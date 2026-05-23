import { BillingInterval, MemberStatus, MembershipStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices, type Services } from "../../app.js";
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

  it("rejects recurring memberships only when the consumer is missing contact info", async () => {
    const services = createServices(testConfig, fixedClock);
    const owner = await registerOwner(services);
    const recurringPlan = await services.membershipPlanService.create(owner.gym.id, {
      name: "Monthly Unlimited",
      billingInterval: BillingInterval.Monthly,
      priceCents: 9900,
      signupFeeCents: 0,
      trialDays: 0,
      autoRenew: true,
      isPublic: true
    });
    const packagePlan = await services.membershipPlanService.create(owner.gym.id, {
      name: "Ten Class Pack",
      billingInterval: BillingInterval.Package,
      priceCents: 14900,
      signupFeeCents: 0,
      trialDays: 0,
      autoRenew: false,
      isPublic: true,
      classAccessLimit: 10
    });
    const noContact = await services.memberService.create(owner.gym.id, {
      firstName: "Jamie",
      lastName: "Rivera",
      profileImageUrl: "https://example.com/jamie.jpg",
      status: MemberStatus.Active,
      tagNames: []
    });
    const noPhoto = await services.memberService.create(owner.gym.id, {
      firstName: "Taylor",
      lastName: "Morgan",
      email: "taylor@example.com",
      status: MemberStatus.Active,
      tagNames: []
    });

    await expect(
      services.memberMembershipService.assignPlan(owner.gym.id, noContact.id, {
        planId: recurringPlan.id,
        status: MembershipStatus.Active
      })
    ).rejects.toThrow(/email or phone number/i);

    await expect(
      services.memberMembershipService.assignPlan(owner.gym.id, noPhoto.id, {
        planId: recurringPlan.id,
        status: MembershipStatus.Active
      })
    ).resolves.toMatchObject({ memberId: noPhoto.id, planId: recurringPlan.id });

    await expect(
      services.memberMembershipService.assignPlan(owner.gym.id, noPhoto.id, {
        planId: packagePlan.id,
        status: MembershipStatus.Active
      })
    ).resolves.toMatchObject({ memberId: noPhoto.id, planId: packagePlan.id });
  });

  it("rejects archived members, missing plans, and invalid membership dates", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, memberId, planId } = await createMemberAndPlan(services);
    await services.memberService.archive(gymId, memberId);

    await expect(
      services.memberMembershipService.assignPlan(gymId, memberId, {
        planId,
        status: MembershipStatus.Active
      })
    ).rejects.toThrow(/member/i);

    const activeMember = await services.memberService.create(gymId, {
      firstName: "Taylor",
      lastName: "Morgan",
      email: "taylor@example.com",
      profileImageUrl: "https://example.com/taylor.jpg",
      status: MemberStatus.Active,
      tagNames: []
    });

    await expect(
      services.memberMembershipService.assignPlan(gymId, activeMember.id, {
        planId: "00000000-0000-4000-8000-000000000000",
        status: MembershipStatus.Active
      })
    ).rejects.toThrow(/plan/i);

    await expect(
      services.memberMembershipService.assignPlan(gymId, activeMember.id, {
        planId,
        status: MembershipStatus.Active,
        startsAt: "2026-05-20T12:00:00.000Z",
        endsAt: "2026-05-19T12:00:00.000Z"
      })
    ).rejects.toThrow(/end date/i);
  });
});

async function registerOwner(services: Services) {
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
  return owner as typeof owner & { gym: NonNullable<typeof owner.gym> };
}

async function createMemberAndPlan(services: Services) {
  const owner = await registerOwner(services);
  const member = await services.memberService.create(owner.gym.id, {
    firstName: "Jamie",
    lastName: "Rivera",
    email: "jamie@example.com",
    profileImageUrl: "https://example.com/jamie.jpg",
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
