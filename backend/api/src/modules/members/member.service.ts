import {
  BillingInterval,
  ConsumerRecordStatus,
  ConsumerSegment,
  LeadStage,
  MemberStatus,
  MembershipStatus
} from "@gym-platform/constants";
import type { MemberCreateInput, MemberUpdateInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
import type { Consumer, EmergencyContact, Member, MemberMembership } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
import { POS_CUSTOMER_TAG } from "../pos/pos.constants.js";

export class MemberService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async list(gymId: string): Promise<Consumer[]> {
    const members = (await this.repositories.members.listMembersForGym(gymId)).filter(
      (member) =>
        member.status !== MemberStatus.Archived &&
        member.recordStatus !== ConsumerRecordStatus.Archived
    );
    return Promise.all(members.map((member) => this.enrichConsumer(member)));
  }

  async get(gymId: string, memberId: string): Promise<Consumer> {
    return this.enrichConsumer(await this.getActive(gymId, memberId));
  }

  async create(gymId: string, input: MemberCreateInput) {
    await this.ensureUnique(gymId, input.email, input.barcode);
    const now = this.clock.now();
    const lifecycle = normalizeConsumerLifecycle(
      input.status ?? MemberStatus.Active,
      input.leadStage ?? LeadStage.None
    );
    const member: Member = {
      id: randomUUID(),
      gymId,
      firstName: input.firstName,
      lastName: input.lastName,
      status: lifecycle.status,
      recordStatus: lifecycle.recordStatus,
      leadStage: lifecycle.leadStage,
      tagNames: input.tagNames ?? [],
      createdAt: now,
      updatedAt: now
    };
    applyOptionalMemberFields(member, input);
    return this.enrichConsumer(await this.repositories.members.createMember(member));
  }

  async update(gymId: string, memberId: string, input: MemberUpdateInput) {
    const existing = await this.getActive(gymId, memberId);
    await this.ensureUnique(gymId, input.email, input.barcode, memberId);
    const lifecycle = normalizeConsumerLifecycle(
      input.status ?? existing.status,
      input.leadStage ?? existing.leadStage
    );
    const updated: Member = {
      ...existing,
      firstName: input.firstName ?? existing.firstName,
      lastName: input.lastName ?? existing.lastName,
      status: lifecycle.status,
      recordStatus: lifecycle.recordStatus,
      leadStage: lifecycle.leadStage,
      tagNames: input.tagNames ?? existing.tagNames,
      updatedAt: this.clock.now()
    };
    applyOptionalMemberFields(updated, input);
    return this.enrichConsumer(await this.repositories.members.updateMember(updated));
  }

  async archive(gymId: string, memberId: string) {
    const existing = await this.getActive(gymId, memberId);
    const now = this.clock.now();
    const archived: Member = {
      ...existing,
      status: MemberStatus.Archived,
      recordStatus: ConsumerRecordStatus.Archived,
      leadStage: existing.leadStage === LeadStage.None ? LeadStage.Closed : existing.leadStage,
      archivedAt: now,
      updatedAt: now
    };
    return this.enrichConsumer(await this.repositories.members.updateMember(archived));
  }

  private async getActive(gymId: string, memberId: string) {
    const member = await this.repositories.members.getMember(memberId);
    if (
      !member ||
      member.gymId !== gymId ||
      member.status === MemberStatus.Archived ||
      member.recordStatus === ConsumerRecordStatus.Archived
    ) {
      throw notFound("Member was not found.");
    }
    return member;
  }

  private async ensureUnique(gymId: string, email?: string, barcode?: string, ignoreMemberId?: string) {
    if (!email && !barcode) {
      return;
    }
    const members = await this.repositories.members.listMembersForGym(gymId);
    const duplicate = members.find(
      (member) =>
        member.id !== ignoreMemberId &&
        member.status !== MemberStatus.Archived &&
        member.recordStatus !== ConsumerRecordStatus.Archived &&
        ((email && member.email?.toLowerCase() === email.toLowerCase()) ||
          (barcode && member.barcode === barcode))
    );
    if (duplicate) {
      throw conflict("A member with this email or barcode already exists.", "member_duplicate");
    }
  }

  private async enrichConsumer(member: Member): Promise<Consumer> {
    const memberships = await this.repositories.memberMemberships.listMemberMembershipsForMember(member.id);
    const segments = await consumerSegmentsFor({
      member,
      memberships,
      now: this.clock.now(),
      getPlan: (planId) => this.repositories.membershipPlans.getMembershipPlan(planId)
    });
    return {
      ...member,
      segments,
      isLead: segments.includes(ConsumerSegment.Lead),
      isCustomer: segments.includes(ConsumerSegment.Customer),
      isMember: segments.includes(ConsumerSegment.Member)
    };
  }
}

export async function consumerSegmentsFor(input: {
  member: Member;
  memberships: MemberMembership[];
  now: Date;
  getPlan: (planId: string) => Promise<{ billingInterval: BillingInterval; gymId: string } | undefined>;
}) {
  const segments = new Set<ConsumerSegment>();
  if (input.member.leadStage === LeadStage.Open) {
    segments.add(ConsumerSegment.Lead);
  }
  if (input.member.tagNames.includes(POS_CUSTOMER_TAG)) {
    segments.add(ConsumerSegment.Customer);
  }
  for (const membership of input.memberships) {
    if (
      membership.gymId !== input.member.gymId ||
      !activeEntitlementStatuses.has(membership.status) ||
      membership.startsAt > input.now ||
      (membership.endsAt && membership.endsAt < input.now)
    ) {
      continue;
    }
    const plan = await input.getPlan(membership.planId);
    if (!plan || plan.gymId !== input.member.gymId) {
      continue;
    }
    if (
      plan.billingInterval === BillingInterval.Monthly ||
      plan.billingInterval === BillingInterval.Yearly
    ) {
      segments.add(ConsumerSegment.Member);
    }
    if (
      plan.billingInterval === BillingInterval.OneTime ||
      plan.billingInterval === BillingInterval.Package
    ) {
      segments.add(ConsumerSegment.Customer);
    }
  }
  return [...segments];
}

const activeEntitlementStatuses = new Set<MembershipStatus>([
  MembershipStatus.Active,
  MembershipStatus.Trialing
]);

function normalizeConsumerLifecycle(status: MemberStatus, leadStage: LeadStage) {
  if (status === MemberStatus.Lead) {
    return {
      status: MemberStatus.Active,
      recordStatus: ConsumerRecordStatus.Active,
      leadStage: LeadStage.Open
    };
  }
  if (status === MemberStatus.Archived) {
    return {
      status,
      recordStatus: ConsumerRecordStatus.Archived,
      leadStage: leadStage === LeadStage.None ? LeadStage.Closed : leadStage
    };
  }
  return {
    status,
    recordStatus: ConsumerRecordStatus.Active,
    leadStage
  };
}

function applyOptionalMemberFields(member: Member, input: MemberCreateInput | MemberUpdateInput) {
  if (input.email !== undefined) {
    member.email = input.email;
  }
  if (input.phone !== undefined) {
    member.phone = input.phone;
  }
  if (input.barcode !== undefined) {
    member.barcode = input.barcode;
  }
  if (input.profileImageUrl !== undefined) {
    member.profileImageUrl = input.profileImageUrl;
  }
  if (input.emergencyContact !== undefined) {
    member.emergencyContact = normalizeEmergencyContact(input.emergencyContact);
  }
  if (input.notes !== undefined) {
    member.notes = input.notes;
  }
}

function normalizeEmergencyContact(input: NonNullable<MemberCreateInput["emergencyContact"]>): EmergencyContact {
  const contact: EmergencyContact = {
    name: input.name,
    phone: input.phone
  };
  if (input.relationship !== undefined) {
    contact.relationship = input.relationship;
  }
  return contact;
}
