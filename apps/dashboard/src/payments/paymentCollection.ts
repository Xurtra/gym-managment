import { FeatureFlag, Permission } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import { memberStatusLabel } from "../members/statusBadges.js";
import type { MemberView } from "../members/types.js";
import type { StripePaymentAccountView } from "./stripeConnection.js";

export const StripePaymentMethod = {
  CardReader: "card_reader",
  ManualEntry: "manual_entry"
} as const;

export type StripePaymentMethod =
  (typeof StripePaymentMethod)[keyof typeof StripePaymentMethod];

export interface StripePaymentMethodOption {
  value: StripePaymentMethod;
  label: string;
  selected: boolean;
  disabled: boolean;
}

export interface StripePaymentCollectionFields {
  amountCents: InputModel;
  note: InputModel;
  receiptEmail: InputModel;
}

export interface StripePaymentCollectionSubmission {
  gymId: string;
  memberId: string;
  amountCents: number;
  paymentMethod: StripePaymentMethod;
  note?: string;
  receiptEmail?: string;
}

export interface StripePaymentCollectionScreen {
  screen: "stripe_payment_collection";
  connected: boolean;
  accountReady: boolean;
  canManagePayments: boolean;
  pointOfSaleEnabled: boolean;
  member?: MemberView;
  memberName: string;
  memberStatusLabel?: string;
  currencyCode: string;
  fields: StripePaymentCollectionFields;
  paymentMethodOptions: StripePaymentMethodOption[];
  paymentMethodOptionCount: number;
  selectedPaymentMethod?: StripePaymentMethod;
  blockedReason?: string;
  canSubmit: boolean;
  summaryLabel: string;
  action: ButtonModel;
  cancelAction: ButtonModel;
}

export function buildStripePaymentCollectionScreen(inputModel: {
  permissions: string[];
  featureFlags?: string[];
  account?: StripePaymentAccountView;
  member?: MemberView;
  amountCents?: string;
  note?: string;
  receiptEmail?: string;
  paymentMethod?: StripePaymentMethod;
}): StripePaymentCollectionScreen {
  const canManagePayments = inputModel.permissions.includes(Permission.PaymentWrite);
  const pointOfSaleEnabled = (inputModel.featureFlags ?? []).includes(FeatureFlag.PointOfSale);
  const connected = Boolean(inputModel.account?.accountId);
  const accountReady = Boolean(
    inputModel.account?.accountId &&
      inputModel.account.onboardingComplete &&
      inputModel.account.chargesEnabled
  );
  const values = normalizePaymentCollectionValues(inputModel);
  const fields = buildPaymentCollectionFields(values);
  const blockedReason = resolveBlockedReason({
    canManagePayments,
    pointOfSaleEnabled,
    connected,
    account: inputModel.account,
    member: inputModel.member
  });
  const paymentMethodOptions = buildPaymentMethodOptions(values.paymentMethod, Boolean(blockedReason));
  const selectedPaymentMethod = paymentMethodOptions.find((option) => option.selected)?.value;
  const canSubmit = Boolean(
    !blockedReason &&
      parsePositiveInt(values.amountCents) !== undefined &&
      validOptionalEmail(values.receiptEmail) &&
      selectedPaymentMethod
  );
  const memberName = resolveMemberName(inputModel.member);
  const currencyCode = inputModel.account?.defaultCurrency?.toUpperCase() ?? "USD";

  return {
    screen: "stripe_payment_collection",
    connected,
    accountReady,
    canManagePayments,
    pointOfSaleEnabled,
    ...(inputModel.member ? { member: inputModel.member } : {}),
    memberName,
    ...(inputModel.member ? { memberStatusLabel: memberStatusLabel(inputModel.member.status) } : {}),
    currencyCode,
    fields,
    paymentMethodOptions,
    paymentMethodOptionCount: paymentMethodOptions.length,
    ...(selectedPaymentMethod ? { selectedPaymentMethod } : {}),
    ...(blockedReason ? { blockedReason } : {}),
    canSubmit,
    summaryLabel: buildSummaryLabel({
      blockedReason,
      amountCents: values.amountCents,
      currencyCode,
      memberName,
      paymentMethod: selectedPaymentMethod
    }),
    action: button({ label: "Collect payment", icon: "credit-card", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
  };
}

export function createStripePaymentCollectionSubmission(inputModel: {
  gymId: string;
  memberId: string;
  amountCents: string;
  paymentMethod: StripePaymentMethod;
  note?: string;
  receiptEmail?: string;
}): StripePaymentCollectionSubmission {
  const values = normalizePaymentCollectionValues(inputModel);
  return {
    gymId: inputModel.gymId,
    memberId: inputModel.memberId,
    amountCents: parsePositiveInt(values.amountCents) ?? 0,
    paymentMethod: inputModel.paymentMethod,
    ...(values.note ? { note: values.note } : {}),
    ...(values.receiptEmail ? { receiptEmail: values.receiptEmail } : {})
  };
}

function buildPaymentCollectionFields(
  values: NormalizedPaymentCollectionValues
): StripePaymentCollectionFields {
  const amountFieldError = amountError(values.amountCents);
  const receiptEmailFieldError = emailError(values.receiptEmail);
  return {
    amountCents: input({
      name: "amountCents",
      label: "Amount in cents",
      value: values.amountCents,
      type: "text",
      required: true,
      ...(amountFieldError ? { error: amountFieldError } : {})
    }),
    note: input({
      name: "note",
      label: "Payment note",
      value: values.note,
      type: "text",
      required: false
    }),
    receiptEmail: input({
      name: "receiptEmail",
      label: "Receipt email",
      value: values.receiptEmail,
      type: "email",
      required: false,
      ...(receiptEmailFieldError ? { error: receiptEmailFieldError } : {})
    })
  };
}

function buildPaymentMethodOptions(
  selectedPaymentMethod: StripePaymentMethod | undefined,
  disabled: boolean
): StripePaymentMethodOption[] {
  return [
    {
      value: StripePaymentMethod.CardReader,
      label: "Card reader",
      selected: selectedPaymentMethod === StripePaymentMethod.CardReader,
      disabled
    },
    {
      value: StripePaymentMethod.ManualEntry,
      label: "Manual entry",
      selected: selectedPaymentMethod === StripePaymentMethod.ManualEntry,
      disabled
    }
  ];
}

function resolveBlockedReason(inputModel: {
  canManagePayments: boolean;
  pointOfSaleEnabled: boolean;
  connected: boolean;
  account: StripePaymentAccountView | undefined;
  member: MemberView | undefined;
}) {
  if (!inputModel.canManagePayments) {
    return "Payment write permission is required.";
  }
  if (!inputModel.pointOfSaleEnabled) {
    return "Point of sale is disabled for this gym.";
  }
  if (!inputModel.connected) {
    return "Connect Stripe before collecting payments.";
  }
  if (!inputModel.account?.onboardingComplete) {
    return "Finish Stripe onboarding before collecting payments.";
  }
  if (!inputModel.account.chargesEnabled) {
    return "Stripe charges are not enabled yet.";
  }
  if (!inputModel.member) {
    return "Select a member to collect payment.";
  }
  if (inputModel.member.archivedAt) {
    return "Archived members cannot be charged.";
  }
  return undefined;
}

function buildSummaryLabel(inputModel: {
  blockedReason: string | undefined;
  amountCents: string;
  currencyCode: string;
  memberName: string;
  paymentMethod: StripePaymentMethod | undefined;
}) {
  if (inputModel.blockedReason) {
    return "Payment collection unavailable";
  }
  if (!inputModel.paymentMethod) {
    return "Select a payment method";
  }
  const amountCents = parsePositiveInt(inputModel.amountCents);
  if (amountCents === undefined) {
    return "Enter a valid payment amount";
  }
  return `Collect ${formatCurrency(amountCents, inputModel.currencyCode)} from ${inputModel.memberName}`;
}

function formatCurrency(amountCents: number, currencyCode: string) {
  return `${currencyCode} ${(amountCents / 100).toFixed(2)}`;
}

function amountError(value: string) {
  if (!value) {
    return "Amount is required.";
  }
  if (parsePositiveInt(value) === undefined) {
    return "Enter a valid amount greater than zero.";
  }
  return undefined;
}

function emailError(value: string) {
  if (!value || validOptionalEmail(value)) {
    return undefined;
  }
  return "Enter a valid receipt email.";
}

function validOptionalEmail(value: string) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parsePositiveInt(value: string) {
  if (!/^\d+$/.test(value)) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return parsed > 0 ? parsed : undefined;
}

function resolveMemberName(member: MemberView | undefined) {
  if (!member) {
    return "No member selected";
  }
  return `${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id;
}

function normalizePaymentCollectionValues(inputModel: {
  amountCents?: string;
  note?: string;
  receiptEmail?: string;
  member?: MemberView;
  paymentMethod?: StripePaymentMethod;
}) {
  return {
    amountCents: inputModel.amountCents?.trim() ?? "",
    note: inputModel.note?.trim() ?? "",
    receiptEmail: inputModel.receiptEmail?.trim() ?? inputModel.member?.email?.trim() ?? "",
    paymentMethod: inputModel.paymentMethod
  };
}

interface NormalizedPaymentCollectionValues {
  amountCents: string;
  note: string;
  receiptEmail: string;
  paymentMethod: StripePaymentMethod | undefined;
}
