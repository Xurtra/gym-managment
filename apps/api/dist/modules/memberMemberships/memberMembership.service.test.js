import { BillingInterval, MemberStatus, MembershipStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";
describe("MemberMembershipService", () => {
    it("assigns an active plan to an existing member and lists membership history", async () => {
        const services = createServices(testConfig, fixedClock);
        const { gymId, memberId, planId } = await createMemberAndPlan(services);
        const membership = await services.memberMembershipService.assignPlan(gymId, memberId, {
            planId,
            status: MembershipStatus.Active,
            startsAt: "2026-05-16T12:00:00.000Z"
        });
        const memberships = await services.memberMembershipService.list(gymId, memberId);
        expect(membership.memberId).toBe(memberId);
        expect(membership.planId).toBe(planId);
        expect(membership.status).toBe(MembershipStatus.Active);
        expect(memberships).toHaveLength(1);
    });
    it("rejects archived members, missing plans, and invalid membership dates", async () => {
        const services = createServices(testConfig, fixedClock);
        const { gymId, memberId, planId } = await createMemberAndPlan(services);
        await services.memberService.archive(gymId, memberId);
        await expect(services.memberMembershipService.assignPlan(gymId, memberId, {
            planId,
            status: MembershipStatus.Active
        })).rejects.toThrow(/member/i);
        const activeMember = await services.memberService.create(gymId, {
            firstName: "Taylor",
            lastName: "Morgan",
            email: "taylor@example.com",
            status: MemberStatus.Active,
            tagNames: []
        });
        await expect(services.memberMembershipService.assignPlan(gymId, activeMember.id, {
            planId: "00000000-0000-4000-8000-000000000000",
            status: MembershipStatus.Active
        })).rejects.toThrow(/plan/i);
        await expect(services.memberMembershipService.assignPlan(gymId, activeMember.id, {
            planId,
            status: MembershipStatus.Active,
            startsAt: "2026-05-20T12:00:00.000Z",
            endsAt: "2026-05-19T12:00:00.000Z"
        })).rejects.toThrow(/end date/i);
    });
});
async function createMemberAndPlan(services) {
    const owner = await services.authService.register({
        email: "owner@example.com",
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
    });
    if (!owner.gym) {
        throw new Error("Expected gym to be created.");
    }
    const member = await services.memberService.create(owner.gym.id, {
        firstName: "Jamie",
        lastName: "Rivera",
        email: "jamie@example.com",
        status: MemberStatus.Active,
        tagNames: []
    });
    const plan = await services.membershipPlanService.create(owner.gym.id, {
        name: "Monthly Unlimited",
        billingInterval: BillingInterval.Monthly,
        priceCents: 9900,
        signupFeeCents: 0,
        trialDays: 0,
        autoRenew: true,
        isPublic: true
    });
    return { gymId: owner.gym.id, memberId: member.id, planId: plan.id };
}
//# sourceMappingURL=memberMembership.service.test.js.map