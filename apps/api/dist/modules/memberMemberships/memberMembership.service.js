import { MemberStatus, PlanStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { badRequest, notFound } from "../../http/errors.js";
export class MemberMembershipService {
    repositories;
    clock;
    constructor(repositories, clock) {
        this.repositories = repositories;
        this.clock = clock;
    }
    async list(gymId, memberId) {
        await this.getScopedMember(gymId, memberId);
        return this.repositories.memberMemberships.listMemberMembershipsForMember(memberId);
    }
    async assignPlan(gymId, memberId, input) {
        await this.getScopedMember(gymId, memberId);
        const plan = await this.repositories.membershipPlans.getMembershipPlan(input.planId);
        if (!plan || plan.gymId !== gymId || plan.status === PlanStatus.Archived) {
            throw notFound("Membership plan was not found.");
        }
        const now = this.clock.now();
        const startsAt = input.startsAt ? new Date(input.startsAt) : now;
        const membership = {
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
    async getScopedMember(gymId, memberId) {
        const member = await this.repositories.members.getMember(memberId);
        if (!member || member.gymId !== gymId || member.status === MemberStatus.Archived) {
            throw notFound("Member was not found.");
        }
        return member;
    }
}
//# sourceMappingURL=memberMembership.service.js.map