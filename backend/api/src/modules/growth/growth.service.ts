import {
  ConsumerRecordStatus,
  ConsumerSegment,
  InteractionType,
  LeadSource,
  LeadStage,
  MemberStatus,
  RetentionFlag
} from "@gym-platform/constants";
import type {
  InteractionCreateInput,
  LeadCrmUpdateInput,
  LeadConvertInput,
  LeadImportRowInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { badRequest, notFound } from "../../http/errors.js";
import type { Consumer, GrowthInteraction, Member } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
import { consumerSegmentsFor } from "../members/member.service.js";

export interface GrowthSummary {
  openLeads: number;
  dueToday: number;
  overdueCount: number;
  watchlistCount: number;
  convertedThisMonth: number;
}

export interface LeadImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export class GrowthService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async getGrowthSummary(gymId: string): Promise<GrowthSummary> {
    const now = this.clock.now();
    const [allMembers, allMemberships, allPlans] = await Promise.all([
      this.repositories.members.listMembersForGym(gymId),
      this.repositories.memberMemberships.listMemberMembershipsForGym(gymId),
      this.repositories.membershipPlans.listMembershipPlansForGym(gymId)
    ]);
    const planMap = new Map(allPlans.map((p) => [p.id, p]));
    const membershipsByMemberId = new Map<string, typeof allMemberships[number][]>();
    for (const m of allMemberships) {
      const list = membershipsByMemberId.get(m.memberId) ?? [];
      list.push(m);
      membershipsByMemberId.set(m.memberId, list);
    }
    const activeMembers = allMembers.filter(
      (m) =>
        m.status !== MemberStatus.Archived &&
        m.recordStatus !== ConsumerRecordStatus.Archived
    );

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let openLeads = 0;
    let dueToday = 0;
    let overdueCount = 0;
    let watchlistCount = 0;
    let convertedThisMonth = 0;

    for (const member of activeMembers) {
      if (member.leadStage === LeadStage.Open) {
        openLeads++;
        if (member.nextFollowUpAt) {
          if (member.nextFollowUpAt <= todayEnd && member.nextFollowUpAt >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            dueToday++;
          } else if (member.nextFollowUpAt < now) {
            overdueCount++;
          }
        }
      }
      if (member.retentionFlag) {
        watchlistCount++;
      }
      if (
        member.leadStage === LeadStage.Converted &&
        member.updatedAt >= startOfMonth
      ) {
        convertedThisMonth++;
      }
    }

    return { openLeads, dueToday, overdueCount, watchlistCount, convertedThisMonth };
  }

  async listFollowUpInbox(gymId: string, asOf?: Date): Promise<Consumer[]> {
    const cutoff = asOf ?? this.clock.now();
    const [allMembers, allMemberships, allPlans] = await Promise.all([
      this.repositories.members.listMembersForGym(gymId),
      this.repositories.memberMemberships.listMemberMembershipsForGym(gymId),
      this.repositories.membershipPlans.listMembershipPlansForGym(gymId)
    ]);
    const planMap = new Map(allPlans.map((p) => [p.id, p]));
    const membershipsByMemberId = new Map<string, typeof allMemberships[number][]>();
    for (const m of allMemberships) {
      const list = membershipsByMemberId.get(m.memberId) ?? [];
      list.push(m);
      membershipsByMemberId.set(m.memberId, list);
    }

    const due = allMembers
      .filter(
        (m) =>
          m.status !== MemberStatus.Archived &&
          m.recordStatus !== ConsumerRecordStatus.Archived &&
          m.leadStage === LeadStage.Open &&
          m.nextFollowUpAt !== undefined &&
          m.nextFollowUpAt <= cutoff
      )
      .sort((a, b) => {
        const aDate = a.nextFollowUpAt!.getTime();
        const bDate = b.nextFollowUpAt!.getTime();
        return aDate - bDate;
      });

    return Promise.all(
      due.map((member) =>
        this.enrichConsumer(member, {
          memberships: membershipsByMemberId.get(member.id) ?? [],
          getPlan: (planId) => Promise.resolve(planMap.get(planId))
        })
      )
    );
  }

  async listRetentionWatchlist(gymId: string): Promise<Consumer[]> {
    const [allMembers, allMemberships, allPlans] = await Promise.all([
      this.repositories.members.listMembersForGym(gymId),
      this.repositories.memberMemberships.listMemberMembershipsForGym(gymId),
      this.repositories.membershipPlans.listMembershipPlansForGym(gymId)
    ]);
    const planMap = new Map(allPlans.map((p) => [p.id, p]));
    const membershipsByMemberId = new Map<string, typeof allMemberships[number][]>();
    for (const m of allMemberships) {
      const list = membershipsByMemberId.get(m.memberId) ?? [];
      list.push(m);
      membershipsByMemberId.set(m.memberId, list);
    }

    const retentionPriority: Record<string, number> = {
      [RetentionFlag.AtRisk]: 0,
      [RetentionFlag.Lapsed]: 1,
      [RetentionFlag.Churned]: 2
    };

    const watchlisted = allMembers
      .filter(
        (m) =>
          m.status !== MemberStatus.Archived &&
          m.recordStatus !== ConsumerRecordStatus.Archived &&
          m.retentionFlag !== undefined
      )
      .sort((a, b) => {
        const aPriority = retentionPriority[a.retentionFlag!] ?? 3;
        const bPriority = retentionPriority[b.retentionFlag!] ?? 3;
        return (
          aPriority - bPriority ||
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        );
      });

    return Promise.all(
      watchlisted.map((member) =>
        this.enrichConsumer(member, {
          memberships: membershipsByMemberId.get(member.id) ?? [],
          getPlan: (planId) => Promise.resolve(planMap.get(planId))
        })
      )
    );
  }

  async updateLeadCrmDetails(
    gymId: string,
    consumerId: string,
    input: LeadCrmUpdateInput
  ): Promise<Consumer> {
    const existing = await this.getActiveConsumer(gymId, consumerId);
    const now = this.clock.now();
    const updated = { ...existing, updatedAt: now } as Member;
    if (input.leadSource !== undefined) updated.leadSource = input.leadSource;
    if (input.interestLevel !== undefined) updated.interestLevel = input.interestLevel;
    if (input.assignedStaffId !== undefined) {
      if (input.assignedStaffId) updated.assignedStaffId = input.assignedStaffId;
      else delete updated.assignedStaffId;
    }
    if (input.nextFollowUpAt !== undefined) {
      if (input.nextFollowUpAt) updated.nextFollowUpAt = new Date(input.nextFollowUpAt);
      else delete updated.nextFollowUpAt;
    }
    if (input.consentEmail !== undefined) updated.consentEmail = input.consentEmail;
    if (input.consentSms !== undefined) updated.consentSms = input.consentSms;
    if (input.consentPhone !== undefined) updated.consentPhone = input.consentPhone;
    if (input.contactPreference !== undefined) {
      if (input.contactPreference) updated.contactPreference = input.contactPreference;
      else delete updated.contactPreference;
    }
    if (input.retentionFlag !== undefined) {
      if (input.retentionFlag) updated.retentionFlag = input.retentionFlag;
      else delete updated.retentionFlag;
    }
    return this.enrichConsumer(await this.repositories.members.updateMember(updated));
  }

  async logInteraction(
    gymId: string,
    consumerId: string,
    staffId: string,
    input: InteractionCreateInput
  ): Promise<GrowthInteraction> {
    await this.getActiveConsumer(gymId, consumerId);
    const now = this.clock.now();
    const interaction: GrowthInteraction = {
      id: randomUUID(),
      gymId,
      consumerId,
      staffId,
      type: input.type,
      ...(input.notes ? { notes: input.notes } : {}),
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : now,
      createdAt: now
    };
    return this.repositories.growth.createInteraction(interaction);
  }

  async listInteractions(gymId: string, consumerId: string): Promise<GrowthInteraction[]> {
    await this.getActiveConsumer(gymId, consumerId);
    return this.repositories.growth.listInteractionsForConsumer(consumerId);
  }

  async convertToMember(
    gymId: string,
    consumerId: string,
    staffId: string,
    input: LeadConvertInput
  ): Promise<Consumer> {
    const existing = await this.getActiveConsumer(gymId, consumerId);
    if (existing.leadStage !== LeadStage.Open) {
      throw badRequest("Only open leads can be converted.");
    }
    const now = this.clock.now();

    let updated: Member = {
      ...existing,
      leadStage: LeadStage.Converted,
      updatedAt: now
    };

    if (input.planId) {
      const plan = await this.repositories.membershipPlans.getMembershipPlan(input.planId);
      if (!plan || plan.gymId !== gymId) {
        throw notFound("Membership plan was not found.");
      }
      const membership = {
        id: randomUUID(),
        gymId,
        memberId: consumerId,
        planId: input.planId,
        status: "active" as const,
        startsAt: now,
        createdAt: now,
        updatedAt: now
      };
      await this.repositories.memberMemberships.createMemberMembership(membership);
    }

    updated = await this.repositories.members.updateMember(updated);

    await this.repositories.growth.createInteraction({
      id: randomUUID(),
      gymId,
      consumerId,
      staffId,
      type: InteractionType.Note,
      notes: "Converted to member",
      occurredAt: now,
      createdAt: now
    });

    return this.enrichConsumer(updated);
  }

  async importLeads(
    gymId: string,
    staffId: string,
    rows: LeadImportRowInput[]
  ): Promise<LeadImportResult> {
    if (rows.length > 500) {
      throw badRequest("Import is limited to 500 rows per request.");
    }

    const existingMembers = await this.repositories.members.listMembersForGym(gymId);
    const existingEmails = new Set(
      existingMembers
        .filter(
          (m) =>
            m.status !== MemberStatus.Archived &&
            m.recordStatus !== ConsumerRecordStatus.Archived &&
            m.email
        )
        .map((m) => m.email!.toLowerCase())
    );

    let imported = 0;
    let skipped = 0;
    const errors: LeadImportResult["errors"] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      try {
        if (row.email && existingEmails.has(row.email.toLowerCase())) {
          skipped++;
          errors.push({ row: i + 1, reason: "Duplicate email — member already exists." });
          continue;
        }
        const now = this.clock.now();
        const member: Member = {
          id: randomUUID(),
          gymId,
          firstName: row.firstName,
          lastName: row.lastName,
          status: MemberStatus.Active,
          recordStatus: ConsumerRecordStatus.Active,
          leadStage: LeadStage.Open,
          tagNames: row.tagNames ?? [],
          leadSource: row.leadSource ?? LeadSource.CsvImport,
          consentEmail: true,
          consentSms: false,
          consentPhone: true,
          createdAt: now,
          updatedAt: now
        };
        if (row.email) {
          member.email = row.email;
          existingEmails.add(row.email.toLowerCase());
        }
        if (row.phone) {
          member.phone = row.phone;
        }
        if (row.notes) {
          member.notes = row.notes;
        }
        await this.repositories.members.createMember(member);
        imported++;
      } catch (err) {
        skipped++;
        errors.push({ row: i + 1, reason: "Failed to import row." });
      }
    }

    return { imported, skipped, errors };
  }

  private async getActiveConsumer(gymId: string, consumerId: string) {
    const member = await this.repositories.members.getMember(consumerId);
    if (
      !member ||
      member.gymId !== gymId ||
      member.status === MemberStatus.Archived ||
      member.recordStatus === ConsumerRecordStatus.Archived
    ) {
      throw notFound("Consumer was not found.");
    }
    return member;
  }

  private async enrichConsumer(
    member: Member,
    preloaded?: {
      memberships: Awaited<ReturnType<Repositories["memberMemberships"]["listMemberMembershipsForMember"]>>;
      getPlan: Parameters<typeof consumerSegmentsFor>[0]["getPlan"];
    }
  ): Promise<Consumer> {
    const memberships =
      preloaded?.memberships ??
      (await this.repositories.memberMemberships.listMemberMembershipsForMember(member.id));
    const getPlan =
      preloaded?.getPlan ??
      ((planId: string) => this.repositories.membershipPlans.getMembershipPlan(planId));
    const segments = await consumerSegmentsFor({
      member,
      memberships,
      now: this.clock.now(),
      getPlan
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
