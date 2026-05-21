import { BillingInterval, MemberStatus, MembershipStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices, type Services } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";

describe("MemberPortalService", () => {
  it("enables member portal login, reads profile data, and rotates refresh tokens", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, gymSlug, memberId, planId } = await createMemberPortalFixture(services);

    await services.memberPortalService.enablePortalAccount(gymId, memberId, {
      password: "MemberPassword123"
    });
    await services.memberMembershipService.assignPlan(gymId, memberId, {
      planId,
      status: MembershipStatus.Active
    });

    const login = await services.memberPortalService.login({
      gymSlug,
      email: "jamie@example.com",
      password: "MemberPassword123"
    });
    const me = await services.memberPortalService.me(gymId, memberId);
    const code = await services.memberPortalService.checkInCode(gymId, memberId);
    const refreshed = await services.memberPortalService.refresh(login.refreshToken);

    expect(login.member.email).toBe("jamie@example.com");
    expect(login.gym.slug).toBe(gymSlug);
    expect(login.accessToken).toBeTruthy();
    expect(me.memberships).toHaveLength(1);
    expect(me.memberships[0]?.plan?.id).toBe(planId);
    expect(code.qrPayload).toBe(`gym:${gymId}:member:${memberId}`);
    expect(code.barcodeFallback).toBe(memberId);
    expect(refreshed.refreshToken).not.toBe(login.refreshToken);
    await expect(services.memberPortalService.refresh(login.refreshToken)).rejects.toThrow(
      /invalid or expired/i
    );
  });

  it("rejects members without enabled portal access", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymSlug } = await createMemberPortalFixture(services);

    await expect(
      services.memberPortalService.login({
        gymSlug,
        email: "jamie@example.com",
        password: "MemberPassword123"
      })
    ).rejects.toThrow(/invalid email or password/i);
  });

  it("creates one-time setup and reset tokens for member-managed passwords", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, gymSlug, memberId } = await createMemberPortalFixture(services);

    const setup = await services.memberPortalService.createPortalInvite(
      gymId,
      memberId,
      "https://dashboard.example.com"
    );
    await services.memberPortalService.acceptPortalToken({
      token: setup.token,
      password: "MemberPassword123"
    });
    const login = await services.memberPortalService.login({
      gymSlug,
      email: "jamie@example.com",
      password: "MemberPassword123"
    });
    const reset = await services.memberPortalService.createPortalInvite(gymId, memberId);
    await services.memberPortalService.acceptPortalToken({
      token: reset.token,
      password: "NewMemberPassword123"
    });

    expect(setup.purpose).toBe("setup");
    expect(setup.setupUrl).toBe(`https://dashboard.example.com/#/member-portal/setup?token=${setup.token}`);
    expect(reset.purpose).toBe("reset");
    await expect(
      services.memberPortalService.acceptPortalToken({
        token: setup.token,
        password: "AnotherPassword123"
      })
    ).rejects.toThrow(/invalid or expired/i);
    await expect(services.memberPortalService.refresh(login.refreshToken)).rejects.toThrow(
      /invalid or expired/i
    );
    await expect(
      services.memberPortalService.login({
        gymSlug,
        email: "jamie@example.com",
        password: "NewMemberPassword123"
      })
    ).resolves.toMatchObject({ member: { email: "jamie@example.com" } });
  });
});

async function createMemberPortalFixture(services: Services) {
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
  return { gymId: owner.gym.id, gymSlug: owner.gym.slug, memberId: member.id, planId: plan.id };
}
