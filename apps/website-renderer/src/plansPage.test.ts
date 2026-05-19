import { BillingInterval, FeatureFlag, PlanStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildPublicPlansPage } from "./index.js";

describe("website builder plans page", () => {
  it("builds sorted public plan cards with featured-plan summary", () => {
    const page = buildPublicPlansPage({
      featureFlags: [FeatureFlag.WebsiteBuilder, FeatureFlag.OnlineSignup],
      featuredPlanId: "plan-2",
      plans: [
        {
          id: "plan-2",
          name: "Unlimited",
          billingInterval: BillingInterval.Monthly,
          priceCents: 9900,
          signupFeeCents: 2500,
          isPublic: true,
          status: PlanStatus.Active
        },
        {
          id: "plan-1",
          name: "Starter",
          billingInterval: BillingInterval.Monthly,
          priceCents: 4900,
          signupFeeCents: 0,
          isPublic: true,
          status: PlanStatus.Active,
          classAccessLimit: 4
        }
      ]
    });

    expect(page.websiteBuilderEnabled).toBe(true);
    expect(page.onlineSignupEnabled).toBe(true);
    expect(page.planCards).toHaveLength(2);
    expect(page.planCards[0]?.title).toBe("Starter");
    expect(page.planCards[0]?.accessLabel).toBe("4 class visits included");
    expect(page.planCards[1]?.featured).toBe(true);
    expect(page.summaryLabel).toContain("featuring Unlimited");
  });

  it("builds a blocked state when the website builder feature is disabled", () => {
    const page = buildPublicPlansPage({
      featureFlags: [FeatureFlag.OnlineSignup],
      plans: []
    });

    expect(page.websiteBuilderEnabled).toBe(false);
    expect(page.blockedReason).toBe("Website builder is disabled for this gym.");
    expect(page.empty?.title).toBe("Plans unavailable");
    expect(page.primaryAction.disabled).toBe(true);
  });

  it("filters out non-public and archived plans", () => {
    const page = buildPublicPlansPage({
      featureFlags: [FeatureFlag.WebsiteBuilder],
      plans: [
        {
          id: "plan-1",
          name: "Starter",
          billingInterval: BillingInterval.Monthly,
          priceCents: 4900,
          signupFeeCents: 0,
          isPublic: false,
          status: PlanStatus.Active
        },
        {
          id: "plan-2",
          name: "Unlimited",
          billingInterval: BillingInterval.Monthly,
          priceCents: 9900,
          signupFeeCents: 0,
          isPublic: true,
          status: PlanStatus.Active,
          archivedAt: "2026-05-18T00:00:00.000Z"
        }
      ]
    });

    expect(page.planCards).toHaveLength(0);
    expect(page.empty?.title).toBe("No public plans available");
  });
});
