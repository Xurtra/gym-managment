import { ConsumerRecordStatus, MemberStatus, PlanStatus } from "@gym-platform/constants";
import type { MemberMembershipAssignInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { badRequest, notFound } from "../../http/errors.js";
import type { MemberMembership } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export class MemberMembershipService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async list(gymId: string, memberId: string) {
    await this.getScopedMember(gymId, memberId);
    return this.repositories.memberMemberships.listMemberMembershipsForMember(memberId);
  }

  async assignPlan(gymId: string, memberId: string, input: MemberMembershipAssignInput) {
    const member = await this.getScopedMember(gymId, memberId);
    const plan = await this.repositories.membershipPlans.getMembershipPlan(input.planId);
    if (!plan || plan.gymId !== gymId || plan.status === PlanStatus.Archived) {
      throw notFound("Membership plan was not found.");
    }
    assertEligibleForRecurringMembership(member, plan.billingInterval);
    const now = this.clock.now();
    const startsAt = input.startsAt ? new Date(input.startsAt) : now;
    const membership: MemberMembership = {
      id: randomUUID(),
      gymId,
      memberId,
      planId: plan.id,
      status: input.status,
      startsAt,
      createdAt: now,
      updatedAt: now
    };
    if (input.endsAt) {
      const endsAt = new Date(input.endsAt);
      if (endsAt <= startsAt) {
        throw badRequest("Membership end date must be after start date.", "invalid_membership_dates");
      }
      membership.endsAt = endsAt;
    }
    return this.repositories.memberMemberships.createMemberMembership(membership);
  }

  private async getScopedMember(gymId: string, memberId: string) {
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
}

function assertEligibleForRecurringMembership(
  member: { email?: string; phone?: string },
  billingInterval: string
) {
  if (billingInterval !== "monthly" && billingInterval !== "yearly") {
    return;
  }
  const hasContact = Boolean(member.email?.trim() || member.phone?.trim());
  if (hasContact) {
    return;
  }
  throw badRequest(
    "Members need at least an email or phone number before assigning a recurring membership.",
    "member_profile_incomplete"
  );
}
