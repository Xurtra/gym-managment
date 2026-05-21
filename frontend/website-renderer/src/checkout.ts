import { FeatureFlag } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import type { PublicSignupPlanView } from "./signup.js";

export interface PublicCheckoutFields {
  firstName: InputModel;
  lastName: InputModel;
  email: InputModel;
  phone: InputModel;
}

export interface PublicCheckoutSummaryLine {
  label: string;
  value: string;
}

export interface PublicCheckoutSubmission {
  planId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface PublicCheckoutPage {
  screen: "public_checkout";
  onlineSignupEnabled: boolean;
  selectedPlan?: PublicSignupPlanView;
  selectedPlanName: string;
  totalDueLabel: string;
  summaryLines: PublicCheckoutSummaryLine[];
  fields: PublicCheckoutFields;
  canSubmit: boolean;
  summaryLabel: string;
  primaryAction: ButtonModel;
  secondaryAction: ButtonModel;
  blockedReason?: string;
}

export function buildPublicCheckoutPage(inputModel: {
  plan?: PublicSignupPlanView;
  featureFlags?: string[];
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}): PublicCheckoutPage {
  const onlineSignupEnabled = (inputModel.featureFlags ?? []).includes(FeatureFlag.OnlineSignup);
  const values = normalizeCheckoutValues(inputModel);
  const blockedReason = resolveBlockedReason(inputModel.plan, onlineSignupEnabled);
  const selectedPlanName = inputModel.plan?.name ?? "No plan selected";
  const totalDueLabel = inputModel.plan ? buildTotalDueLabel(inputModel.plan) : "$0.00";
  const fields = buildFields(values);
  const canSubmit = Boolean(
    !blockedReason &&
      values.firstName &&
      values.lastName &&
      validEmail(values.email) &&
      validOptionalPhone(values.phone)
  );

  return {
    screen: "public_checkout",
    onlineSignupEnabled,
    ...(inputModel.plan ? { selectedPlan: inputModel.plan } : {}),
    selectedPlanName,
    totalDueLabel,
    summaryLines: inputModel.plan ? buildSummaryLines(inputModel.plan) : [],
    fields,
    canSubmit,
    summaryLabel: buildSummaryLabel(blockedReason, selectedPlanName, totalDueLabel),
    primaryAction: button({
      label: "Complete signup",
      icon: "check",
      disabled: !canSubmit
    }),
    secondaryAction: button({
      label: "Back to plans",
      icon: "arrow-left",
      intent: "secondary"
    }),
    ...(blockedReason ? { blockedReason } : {})
  };
}

export function createPublicCheckoutSubmission(inputModel: {
  planId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}): PublicCheckoutSubmission {
  const values = normalizeCheckoutValues(inputModel);
  return {
    planId: inputModel.planId,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    ...(values.phone ? { phone: values.phone } : {})
  };
}

function buildFields(values: NormalizedCheckoutValues): PublicCheckoutFields {
  return {
    firstName: input({
      name: "firstName",
      label: "First name",
      value: values.firstName,
      type: "text",
      required: true,
      ...(values.firstName ? {} : { error: "First name is required." })
    }),
    lastName: input({
      name: "lastName",
      label: "Last name",
      value: values.lastName,
      type: "text",
      required: true,
      ...(values.lastName ? {} : { error: "Last name is required." })
    }),
    email: input({
      name: "email",
      label: "Email",
      value: values.email,
      type: "email",
      required: true,
      ...(validEmail(values.email) ? {} : { error: "Enter a valid email address." })
    }),
    phone: input({
      name: "phone",
      label: "Phone",
      value: values.phone,
      type: "tel",
      required: false,
      ...(validOptionalPhone(values.phone) ? {} : { error: "Enter a valid phone number." })
    })
  };
}

function buildSummaryLines(plan: PublicSignupPlanView): PublicCheckoutSummaryLine[] {
  return [
    { label: "Plan", value: plan.name },
    { label: "Recurring price", value: buildPriceLabel(plan) },
    {
      label: "Signup fee",
      value: plan.signupFeeCents > 0 ? formatCurrency(plan.signupFeeCents) : "None"
    }
  ];
}

function buildSummaryLabel(
  blockedReason: string | undefined,
  selectedPlanName: string,
  totalDueLabel: string
) {
  if (blockedReason) {
    return "Checkout unavailable";
  }
  return `${selectedPlanName} due today ${totalDueLabel}`;
}

function buildTotalDueLabel(plan: PublicSignupPlanView) {
  return formatCurrency(plan.priceCents + plan.signupFeeCents);
}

function buildPriceLabel(plan: PublicSignupPlanView) {
  switch (plan.billingInterval) {
    case "monthly":
      return `${formatCurrency(plan.priceCents)}/month`;
    case "yearly":
      return `${formatCurrency(plan.priceCents)}/year`;
    case "one_time":
      return `${formatCurrency(plan.priceCents)} one-time`;
    case "package":
      return `${formatCurrency(plan.priceCents)} package`;
  }
}

function resolveBlockedReason(
  plan: PublicSignupPlanView | undefined,
  onlineSignupEnabled: boolean
) {
  if (!onlineSignupEnabled) {
    return "Online signup is disabled for this gym.";
  }
  if (!plan) {
    return "Select a public plan before checkout.";
  }
  if (!plan.isPublic || plan.status !== "active" || plan.archivedAt) {
    return "This plan is no longer available for public signup.";
  }
  return undefined;
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validOptionalPhone(phone: string) {
  return !phone || /^[0-9+()\-\s]{7,}$/.test(phone);
}

function normalizeCheckoutValues(inputModel: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}) {
  return {
    firstName: inputModel.firstName?.trim() ?? "",
    lastName: inputModel.lastName?.trim() ?? "",
    email: inputModel.email?.trim().toLowerCase() ?? "",
    phone: inputModel.phone?.trim() ?? ""
  };
}

function formatCurrency(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}

interface NormalizedCheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
