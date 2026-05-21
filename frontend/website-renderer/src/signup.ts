import { BillingInterval, FeatureFlag, PlanStatus } from "@gym-platform/constants";
import { button, emptyState } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";

export interface PublicSignupPlanView {
  id: string;
  gymId: string;
  name: string;
  billingInterval: BillingInterval;
  priceCents: number;
  signupFeeCents: number;
  isPublic: boolean;
  status: PlanStatus;
  description?: string;
  archivedAt?: string;
}

export interface PublicSignupPlanCard {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  signupFeeLabel: string;
  billingIntervalLabel: string;
  selected: boolean;
}

export interface PublicSignupPage {
  screen: "public_signup";
  onlineSignupEnabled: boolean;
  plans: PublicSignupPlanCard[];
  planCount: number;
  selectedPlanId?: string;
  summaryLabel: string;
  primaryAction: ButtonModel;
  empty?: EmptyStateModel;
  blockedReason?: string;
}

export function buildPublicSignupPage(inputModel: {
  plans: PublicSignupPlanView[];
  featureFlags?: string[];
  selectedPlanId?: string;
}): PublicSignupPage {
  const onlineSignupEnabled = (inputModel.featureFlags ?? []).includes(FeatureFlag.OnlineSignup);
  const availablePlans = inputModel.plans.filter(isPublicActivePlan);
  const selectedPlan = availablePlans.find((plan) => plan.id === inputModel.selectedPlanId);
  const plans = availablePlans.map<PublicSignupPlanCard>((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description?.trim() || "No plan description provided.",
    priceLabel: buildPriceLabel(plan),
    signupFeeLabel:
      plan.signupFeeCents > 0 ? `${formatCurrency(plan.signupFeeCents)} signup fee` : "No signup fee",
    billingIntervalLabel: billingIntervalLabel(plan.billingInterval),
    selected: plan.id === selectedPlan?.id
  }));
  const blockedReason = !onlineSignupEnabled ? "Online signup is disabled for this gym." : undefined;
  const empty = buildEmptyState(onlineSignupEnabled, plans.length > 0);
  const canSubmit = Boolean(onlineSignupEnabled && selectedPlan);

  return {
    screen: "public_signup",
    onlineSignupEnabled,
    plans,
    planCount: plans.length,
    ...(selectedPlan ? { selectedPlanId: selectedPlan.id } : {}),
    summaryLabel: buildSummaryLabel({
      blockedReason,
      selectedPlanName: selectedPlan?.name,
      planCount: plans.length
    }),
    primaryAction: button({
      label: "Continue to checkout",
      icon: "arrow-right",
      disabled: !canSubmit
    }),
    ...(empty ? { empty } : {}),
    ...(blockedReason ? { blockedReason } : {})
  };
}

function isPublicActivePlan(plan: PublicSignupPlanView) {
  return plan.isPublic && plan.status === PlanStatus.Active && !plan.archivedAt;
}

function buildEmptyState(onlineSignupEnabled: boolean, hasPlans: boolean) {
  if (!onlineSignupEnabled) {
    return emptyState({
      title: "Online signup unavailable",
      body: "Check back later or contact the gym directly."
    });
  }
  if (!hasPlans) {
    return emptyState({
      title: "No public plans available",
      body: "There are no membership plans available for online signup right now."
    });
  }
  return undefined;
}

function buildSummaryLabel(inputModel: {
  blockedReason: string | undefined;
  selectedPlanName: string | undefined;
  planCount: number;
}) {
  if (inputModel.blockedReason) {
    return "Online signup unavailable";
  }
  if (inputModel.planCount === 0) {
    return "No public plans available";
  }
  if (!inputModel.selectedPlanName) {
    return `${inputModel.planCount} plans available`;
  }
  return `Sign up for ${inputModel.selectedPlanName}`;
}

function buildPriceLabel(plan: PublicSignupPlanView) {
  switch (plan.billingInterval) {
    case BillingInterval.Monthly:
      return `${formatCurrency(plan.priceCents)}/month`;
    case BillingInterval.Yearly:
      return `${formatCurrency(plan.priceCents)}/year`;
    case BillingInterval.OneTime:
      return `${formatCurrency(plan.priceCents)} one-time`;
    case BillingInterval.Package:
      return `${formatCurrency(plan.priceCents)} package`;
  }
}

function billingIntervalLabel(interval: BillingInterval) {
  switch (interval) {
    case BillingInterval.Monthly:
      return "Monthly";
    case BillingInterval.Yearly:
      return "Yearly";
    case BillingInterval.OneTime:
      return "One-time";
    case BillingInterval.Package:
      return "Package";
  }
}

function formatCurrency(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}
