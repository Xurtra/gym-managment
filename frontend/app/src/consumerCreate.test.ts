import { BillingInterval, PlanStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  consumerCreateKindOptions,
  defaultConsumerCreateKind,
  defaultRecurringPlanId,
  recurringMembershipRequirementMessage
} from "./consumerCreate.js";

describe("consumer create form rules", () => {
  it("allows creating a recurring member with contact info and no profile photo", () => {
    expect(recurringMembershipRequirementMessage({ email: "member@example.com" })).toBeUndefined();
    expect(recurringMembershipRequirementMessage({ phone: "555-0101" })).toBeUndefined();
  });

  it("still requires at least one contact method for member creation", () => {
    expect(recurringMembershipRequirementMessage({})).toMatch(/email or phone/i);
  });

  it("defaults the member create form to the first active recurring plan", () => {
    expect(
      defaultRecurringPlanId([
        { id: "drop-in", billingInterval: BillingInterval.OneTime, status: PlanStatus.Active },
        { id: "monthly", billingInterval: BillingInterval.Monthly, status: PlanStatus.Active },
        { id: "yearly", billingInterval: BillingInterval.Yearly, status: PlanStatus.Active }
      ])
    ).toBe("monthly");
  });

  it("does not default to member when no recurring plan exists", () => {
    const plans = [
      { id: "drop-in", billingInterval: BillingInterval.OneTime, status: PlanStatus.Active },
      { id: "pack", billingInterval: BillingInterval.Package, status: PlanStatus.Active }
    ];

    expect(defaultRecurringPlanId(plans)).toBe("");
    expect(defaultConsumerCreateKind(plans)).toBe("consumer");
    expect(consumerCreateKindOptions(plans).map((option) => option.value)).toEqual(["lead", "consumer"]);
  });

  it("skips archived recurring plans when selecting the default", () => {
    const plans = [
      { id: "archived-monthly", billingInterval: BillingInterval.Monthly, status: PlanStatus.Archived },
      { id: "active-yearly", billingInterval: BillingInterval.Yearly, status: PlanStatus.Active }
    ];

    expect(defaultRecurringPlanId(plans)).toBe("active-yearly");
    expect(defaultConsumerCreateKind(plans)).toBe("member");
  });
});
