import { BillingInterval, PlanStatus } from "@gym-platform/constants";

type RecurringPlanLike = {
  id: string;
  billingInterval: BillingInterval;
  status: PlanStatus;
};

export type ConsumerCreateKind = "lead" | "consumer" | "member";

export function defaultRecurringPlanId(plans: RecurringPlanLike[]) {
  return (
    plans.find(
      (plan) =>
        plan.status === PlanStatus.Active &&
        (plan.billingInterval === BillingInterval.Monthly || plan.billingInterval === BillingInterval.Yearly)
    )?.id ?? ""
  );
}

export function defaultConsumerCreateKind(plans: RecurringPlanLike[]): ConsumerCreateKind {
  return defaultRecurringPlanId(plans) ? "member" : "consumer";
}

export function consumerCreateKindOptions(plans: RecurringPlanLike[]) {
  const options: Array<{ value: ConsumerCreateKind; label: string }> = [
    { value: "lead", label: "Lead" },
    { value: "consumer", label: "Consumer" }
  ];
  if (defaultRecurringPlanId(plans)) {
    options.push({ value: "member", label: "Member" });
  }
  return options;
}

export function recurringMembershipRequirementMessage(input: { email?: string; phone?: string }) {
  const hasContact = Boolean(input.email?.trim() || input.phone?.trim());
  if (hasContact) {
    return undefined;
  }
  return "Members need at least an email or phone number. Add both contact methods when possible";
}

export function assertRecurringMembershipRequirements(input: { email?: string; phone?: string }, action: string) {
  const requirementMessage = recurringMembershipRequirementMessage(input);
  if (!requirementMessage) {
    return;
  }
  throw new Error(`${requirementMessage} ${action}`);
}
