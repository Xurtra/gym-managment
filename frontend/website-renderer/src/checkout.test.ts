import { BillingInterval, FeatureFlag, PlanStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildPublicCheckoutPage, createPublicCheckoutSubmission } from "./index.js";

describe("public checkout page", () => {
  const publicPlan = {
    id: "plan-1",
    gymId: "gym-1",
    name: "Unlimited Strength",
    billingInterval: BillingInterval.Monthly,
    priceCents: 9900,
    signupFeeCents: 2500,
    isPublic: true,
    status: PlanStatus.Active,
    description: "Full gym access with unlimited classes."
  };

  it("builds a ready public checkout page", () => {
    const page = buildPublicCheckoutPage({
      plan: publicPlan,
      featureFlags: [FeatureFlag.OnlineSignup],
      firstName: " Jamie ",
      lastName: " Rivera ",
      email: " JAMIE@EXAMPLE.COM ",
      phone: "555-0100"
    });

    expect(page.screen).toBe("public_checkout");
    expect(page.onlineSignupEnabled).toBe(true);
    expect(page.selectedPlanName).toBe("Unlimited Strength");
    expect(page.totalDueLabel).toBe("$124.00");
    expect(page.summaryLines).toEqual([
      { label: "Plan", value: "Unlimited Strength" },
      { label: "Recurring price", value: "$99.00/month" },
      { label: "Signup fee", value: "$25.00" }
    ]);
    expect(page.fields.firstName.value).toBe("Jamie");
    expect(page.fields.lastName.value).toBe("Rivera");
    expect(page.fields.email.value).toBe("jamie@example.com");
    expect(page.fields.phone.value).toBe("555-0100");
    expect(page.canSubmit).toBe(true);
    expect(page.summaryLabel).toBe("Unlimited Strength due today $124.00");
    expect(page.primaryAction.disabled).toBe(false);
  });

  it("blocks checkout when no plan is selected", () => {
    const page = buildPublicCheckoutPage({
      featureFlags: [FeatureFlag.OnlineSignup]
    });

    expect(page.blockedReason).toBe("Select a public plan before checkout.");
    expect(page.selectedPlanName).toBe("No plan selected");
    expect(page.totalDueLabel).toBe("$0.00");
    expect(page.summaryLines).toEqual([]);
    expect(page.summaryLabel).toBe("Checkout unavailable");
    expect(page.primaryAction.disabled).toBe(true);
  });

  it("validates required public checkout fields and normalizes submissions", () => {
    const page = buildPublicCheckoutPage({
      plan: publicPlan,
      featureFlags: [FeatureFlag.OnlineSignup],
      firstName: "",
      lastName: "Stone",
      email: "invalid-email",
      phone: "12"
    });
    const submission = createPublicCheckoutSubmission({
      planId: "plan-1",
      firstName: " Avery ",
      lastName: " Stone ",
      email: " AVERY@EXAMPLE.COM ",
      phone: " 555-0123 "
    });

    expect(page.fields.firstName.error).toBe("First name is required.");
    expect(page.fields.email.error).toBe("Enter a valid email address.");
    expect(page.fields.phone.error).toBe("Enter a valid phone number.");
    expect(page.canSubmit).toBe(false);
    expect(page.primaryAction.disabled).toBe(true);
    expect(submission).toEqual({
      planId: "plan-1",
      firstName: "Avery",
      lastName: "Stone",
      email: "avery@example.com",
      phone: "555-0123"
    });
  });

  it("blocks checkout for archived or non-public plans", () => {
    const page = buildPublicCheckoutPage({
      plan: {
        ...publicPlan,
        isPublic: false,
        archivedAt: "2026-05-18T00:00:00.000Z"
      },
      featureFlags: [FeatureFlag.OnlineSignup],
      firstName: "Jamie",
      lastName: "Rivera",
      email: "jamie@example.com"
    });

    expect(page.blockedReason).toBe("This plan is no longer available for public signup.");
    expect(page.summaryLabel).toBe("Checkout unavailable");
    expect(page.canSubmit).toBe(false);
    expect(page.primaryAction.disabled).toBe(true);
  });

  it("validates missing last name and allows empty optional phone", () => {
    const invalidPage = buildPublicCheckoutPage({
      plan: publicPlan,
      featureFlags: [FeatureFlag.OnlineSignup],
      firstName: "Jamie",
      lastName: "",
      email: "jamie@example.com",
      phone: ""
    });
    const validPage = buildPublicCheckoutPage({
      plan: publicPlan,
      featureFlags: [FeatureFlag.OnlineSignup],
      firstName: "Jamie",
      lastName: "Rivera",
      email: "jamie@example.com",
      phone: ""
    });

    expect(invalidPage.fields.lastName.error).toBe("Last name is required.");
    expect(invalidPage.canSubmit).toBe(false);
    expect(validPage.fields.phone.error).toBeUndefined();
    expect(validPage.canSubmit).toBe(true);
  });
});
