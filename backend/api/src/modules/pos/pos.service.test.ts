import { BillingInterval, ConsumerSegment, MembershipStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { createGym, fixedClock, testConfig } from "../../testUtils.js";

describe("PosService", () => {
  it("creates a new consumer from a purchase and marks them as a customer", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);

    const purchase = await services.posService.collectPurchase(gymId, {
      firstName: "Jordan",
      lastName: "Walker",
      email: "jordan@example.com",
      amountCents: 4500,
      paymentMethod: "manual_entry"
    });

    expect(purchase.consumer.email).toBe("jordan@example.com");
    expect(purchase.consumer.segments).toContain(ConsumerSegment.Customer);
    expect(purchase.consumer.isCustomer).toBe(true);
  });

  it("reuses an existing consumer matched by email and can attach a purchased plan", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const existing = await services.memberService.create(gymId, {
      firstName: "Casey",
      lastName: "Rivera",
      email: "casey@example.com",
      status: "active",
      tagNames: []
    });
    const dropInPlan = await services.membershipPlanService.create(gymId, {
      name: "Drop In",
      billingInterval: BillingInterval.OneTime,
      priceCents: 2500,
      signupFeeCents: 0,
      trialDays: 0,
      autoRenew: false,
      isPublic: true
    });

    const purchase = await services.posService.collectPurchase(gymId, {
      firstName: "Casey",
      lastName: "Rivera",
      email: "casey@example.com",
      amountCents: 2500,
      paymentMethod: "manual_entry",
      planId: dropInPlan.id
    });
    const memberships = await services.memberMembershipService.list(gymId, existing.id);

    expect(purchase.consumer.id).toBe(existing.id);
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.status).toBe(MembershipStatus.Active);
    expect(purchase.consumer.segments).toContain(ConsumerSegment.Customer);
  });
});