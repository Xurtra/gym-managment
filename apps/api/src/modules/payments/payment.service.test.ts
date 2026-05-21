import { BillingInterval, FeatureFlag, MemberStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";

describe("PaymentService subscriptions", () => {
  it("creates a mock Stripe subscription checkout and syncs member membership status", async () => {
    const services = createServices(testConfig, fixedClock);
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
    await services.tenancyService.updateGym(owner.gym.id, {
      featureFlags: [FeatureFlag.PointOfSale]
    });
    await services.paymentService.connectStripeAccount(owner.gym.id);
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

    const checkout = await services.paymentService.createSubscriptionCheckout(owner.gym.id, {
      memberId: member.id,
      planId: plan.id
    });
    const subscriptions = await services.paymentService.listSubscriptions(owner.gym.id);
    const memberships = await services.memberMembershipService.list(owner.gym.id, member.id);

    expect(checkout.checkoutUrl).toContain("mock-subscription-checkout");
    expect(checkout.subscription.status).toBe("active");
    expect(subscriptions).toHaveLength(1);
    expect(memberships).toHaveLength(1);
    expect(memberships[0]).toMatchObject({
      memberId: member.id,
      planId: plan.id,
      status: "active"
    });
  });
});
