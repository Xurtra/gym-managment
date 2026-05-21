import { BillingInterval, FeatureFlag, PlanStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildPublicSignupPage } from "./index.js";

describe("public signup page", () => {
  const plans = [
    {
      id: "plan-1",
      gymId: "gym-1",
      name: "Unlimited Strength",
      billingInterval: BillingInterval.Monthly,
      priceCents: 9900,
      signupFeeCents: 2500,
      isPublic: true,
      status: PlanStatus.Active,
      description: "Full gym access with unlimited classes."
    },
    {
      id: "plan-2",
      gymId: "gym-1",
      name: "Private Coaching",
      billingInterval: BillingInterval.Package,
      priceCents: 24000,
      signupFeeCents: 0,
      isPublic: true,
      status: PlanStatus.Active
    },
    {
      id: "plan-3",
      gymId: "gym-1",
      name: "Hidden Staff Plan",
      billingInterval: BillingInterval.Monthly,
      priceCents: 5000,
      signupFeeCents: 0,
      isPublic: false,
      status: PlanStatus.Active
    }
  ];

  it("builds an enabled public signup page with selectable public plans", () => {
    const page = buildPublicSignupPage({
      plans,
      featureFlags: [FeatureFlag.OnlineSignup],
      selectedPlanId: "plan-1"
    });

    expect(page.screen).toBe("public_signup");
    expect(page.onlineSignupEnabled).toBe(true);
    expect(page.planCount).toBe(2);
    expect(page.selectedPlanId).toBe("plan-1");
    expect(page.summaryLabel).toBe("Sign up for Unlimited Strength");
    expect(page.primaryAction.disabled).toBe(false);
    expect(page.plans[0]).toMatchObject({
      id: "plan-1",
      priceLabel: "$99.00/month",
      signupFeeLabel: "$25.00 signup fee",
      billingIntervalLabel: "Monthly",
      selected: true
    });
    expect(page.plans[1]).toMatchObject({
      id: "plan-2",
      description: "No plan description provided.",
      priceLabel: "$240.00 package",
      signupFeeLabel: "No signup fee",
      selected: false
    });
  });

  it("blocks public signup when the feature flag is disabled", () => {
    const page = buildPublicSignupPage({
      plans,
      selectedPlanId: "plan-1"
    });

    expect(page.onlineSignupEnabled).toBe(false);
    expect(page.blockedReason).toBe("Online signup is disabled for this gym.");
    expect(page.summaryLabel).toBe("Online signup unavailable");
    expect(page.empty?.title).toBe("Online signup unavailable");
    expect(page.primaryAction.disabled).toBe(true);
  });

  it("shows an empty state when no active public plans are available", () => {
    const page = buildPublicSignupPage({
      plans: [
        {
          id: "plan-4",
          gymId: "gym-1",
          name: "Archived Plan",
          billingInterval: BillingInterval.Yearly,
          priceCents: 100000,
          signupFeeCents: 0,
          isPublic: true,
          status: PlanStatus.Archived
        }
      ],
      featureFlags: [FeatureFlag.OnlineSignup]
    });

    expect(page.onlineSignupEnabled).toBe(true);
    expect(page.planCount).toBe(0);
    expect(page.summaryLabel).toBe("No public plans available");
    expect(page.empty?.title).toBe("No public plans available");
    expect(page.primaryAction.disabled).toBe(true);
  });

  it("does not select non-public or archived plans even when requested", () => {
    const page = buildPublicSignupPage({
      plans: [
        ...plans,
        {
          id: "plan-4",
          gymId: "gym-1",
          name: "Archived Public Plan",
          billingInterval: BillingInterval.OneTime,
          priceCents: 10000,
          signupFeeCents: 0,
          isPublic: true,
          status: PlanStatus.Active,
          archivedAt: "2026-05-18T00:00:00.000Z"
        }
      ],
      featureFlags: [FeatureFlag.OnlineSignup],
      selectedPlanId: "plan-4"
    });

    expect(page.planCount).toBe(2);
    expect(page.selectedPlanId).toBeUndefined();
    expect(page.summaryLabel).toBe("2 plans available");
    expect(page.primaryAction.disabled).toBe(true);
  });
});
