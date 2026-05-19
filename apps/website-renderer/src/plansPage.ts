import { BillingInterval, FeatureFlag, PlanStatus } from "@gym-platform/constants";
import { button, card, emptyState } from "@gym-platform/ui";
import type { ButtonModel, CardModel, EmptyStateModel } from "@gym-platform/ui";

export interface PublicWebsitePlanView {
  id: string;
  name: string;
  description?: string;
  billingInterval: BillingInterval;
  priceCents: number;
  signupFeeCents: number;
  isPublic: boolean;
  status: PlanStatus;
  archivedAt?: string;
  classAccessLimit?: number;
}

export interface PublicWebsitePlanCard extends CardModel {
  planId: string;
  priceLabel: string;
  signupFeeLabel: string;
  accessLabel: string;
  featured: boolean;
}

export interface PublicPlansPage {
  screen: "public_plans";
  websiteBuilderEnabled: boolean;
  onlineSignupEnabled: boolean;
  summaryLabel: string;
  planCards: PublicWebsitePlanCard[];
  primaryAction: ButtonModel;
  secondaryAction: ButtonModel;
  empty?: EmptyStateModel;
  blockedReason?: string;
}

export function buildPublicPlansPage(inputModel: {
  plans: PublicWebsitePlanView[];
  featureFlags?: string[];
  featuredPlanId?: string;
}): PublicPlansPage {
  const featureFlags = inputModel.featureFlags ?? [];
  const websiteBuilderEnabled = featureFlags.includes(FeatureFlag.WebsiteBuilder);
  const onlineSignupEnabled = featureFlags.includes(FeatureFlag.OnlineSignup);
  const blockedReason = websiteBuilderEnabled ? undefined : "Website builder is disabled for this gym.";
  const availablePlans = inputModel.plans.filter(isVisiblePlan).sort(comparePlans);
  const planCards = availablePlans.map<PublicWebsitePlanCard>((plan) => ({
    ...card({
      title: plan.name,
      body: plan.description?.trim() || "No plan description provided.",
      actions: [
        button({
          label: onlineSignupEnabled ? "Choose plan" : "Contact gym",
          icon: onlineSignupEnabled ? "arrow-right" : "mail",
          disabled: !websiteBuilderEnabled
        })
      ]
    }),
    planId: plan.id,
    priceLabel: buildPriceLabel(plan),
    signupFeeLabel:
      plan.signupFeeCents > 0 ? `${formatCurrency(plan.signupFeeCents)} signup fee` : "No signup fee",
    accessLabel: buildAccessLabel(plan.classAccessLimit),
    featured: plan.id === inputModel.featuredPlanId
  }));
  const empty = buildEmptyState({
    websiteBuilderEnabled,
    planCount: planCards.length
  });

  return {
    screen: "public_plans",
    websiteBuilderEnabled,
    onlineSignupEnabled,
    summaryLabel: buildSummaryLabel({
      blockedReason,
      planCount: planCards.length,
      featuredPlanName: planCards.find((planCard) => planCard.featured)?.title
    }),
    planCards,
    primaryAction: button({
      label: onlineSignupEnabled ? "Start signup" : "Contact the gym",
      icon: onlineSignupEnabled ? "arrow-right" : "mail",
      disabled: !websiteBuilderEnabled
    }),
    secondaryAction: button({
      label: "View class schedule",
      icon: "calendar",
      intent: "secondary",
      disabled: !websiteBuilderEnabled
    }),
    ...(empty ? { empty } : {}),
    ...(blockedReason ? { blockedReason } : {})
  };
}

function isVisiblePlan(plan: PublicWebsitePlanView) {
  return plan.isPublic && plan.status === PlanStatus.Active && !plan.archivedAt;
}

function comparePlans(left: PublicWebsitePlanView, right: PublicWebsitePlanView) {
  if (left.priceCents !== right.priceCents) {
    return left.priceCents - right.priceCents;
  }

  return left.name.localeCompare(right.name);
}

function buildEmptyState(inputModel: {
  websiteBuilderEnabled: boolean;
  planCount: number;
}) {
  if (!inputModel.websiteBuilderEnabled) {
    return emptyState({
      title: "Plans unavailable",
      body: "Enable the website builder feature flag to publish your public membership plans."
    });
  }

  if (inputModel.planCount === 0) {
    return emptyState({
      title: "No public plans available",
      body: "There are no public membership plans to show right now."
    });
  }

  return undefined;
}

function buildSummaryLabel(inputModel: {
  blockedReason: string | undefined;
  planCount: number;
  featuredPlanName: string | undefined;
}) {
  if (inputModel.blockedReason) {
    return "Public plans unavailable";
  }

  if (inputModel.featuredPlanName) {
    return `${inputModel.planCount} plans available, featuring ${inputModel.featuredPlanName}`;
  }

  return `${inputModel.planCount} plans available`;
}

function buildPriceLabel(plan: PublicWebsitePlanView) {
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

function buildAccessLabel(classAccessLimit: number | undefined) {
  if (classAccessLimit === undefined) {
    return "Unlimited class access";
  }

  if (classAccessLimit <= 0) {
    return "No class access included";
  }

  return `${classAccessLimit} class visits included`;
}

function formatCurrency(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}
