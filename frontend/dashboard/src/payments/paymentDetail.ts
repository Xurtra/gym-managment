import { Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  StripePaymentStatus,
  type StripePaymentTransactionView
} from "./paymentHistory.js";

export interface StripePaymentRefundSubmission {
  transactionId: string;
  amountCents: number;
  reason?: string;
}

export interface StripePaymentDetailLineItem {
  label: string;
  value: string;
}

export interface StripePaymentDetailSection {
  title: string;
  items: StripePaymentDetailLineItem[];
}

export interface StripePaymentDetailScreen {
  screen: "stripe_payment_detail";
  transaction: StripePaymentTransactionView;
  canManagePayments: boolean;
  memberName: string;
  amountLabel: string;
  statusLabel: string;
  paymentMethodLabel: string;
  refundableAmountLabel: string;
  refundable: boolean;
  detailSections: StripePaymentDetailSection[];
  sectionCount: number;
  refundAction: ButtonModel;
  receiptAction: ButtonModel;
  summaryLabel: string;
  blockedReason?: string;
}

export function buildStripePaymentDetailScreen(inputModel: {
  transaction: StripePaymentTransactionView;
  permissions: string[];
}): StripePaymentDetailScreen {
  const canManagePayments = inputModel.permissions.includes(Permission.PaymentWrite);
  const blockedReason = refundBlockedReason(inputModel.transaction, canManagePayments);
  const refundableAmountCents = refundableAmount(inputModel.transaction);
  const currency = inputModel.transaction.currency.toUpperCase();

  return {
    screen: "stripe_payment_detail",
    transaction: inputModel.transaction,
    canManagePayments,
    memberName: inputModel.transaction.memberName ?? "Walk-in customer",
    amountLabel: formatCurrency(inputModel.transaction.amountCents, currency),
    statusLabel: paymentStatusLabel(inputModel.transaction.status),
    paymentMethodLabel: paymentMethodLabel(inputModel.transaction.paymentMethod),
    refundableAmountLabel: formatCurrency(refundableAmountCents, currency),
    refundable: !blockedReason,
    detailSections: buildDetailSections(inputModel.transaction),
    sectionCount: 3,
    refundAction: button({
      label: "Refund payment",
      icon: "rotate-ccw",
      intent: "danger",
      disabled: Boolean(blockedReason)
    }),
    receiptAction: button({
      label: "Send receipt",
      icon: "mail",
      intent: "secondary"
    }),
    summaryLabel: buildSummaryLabel(inputModel.transaction, blockedReason),
    ...(blockedReason ? { blockedReason } : {})
  };
}

export function createStripePaymentRefundSubmission(inputModel: {
  transactionId: string;
  amountCents: string;
  reason?: string;
}): StripePaymentRefundSubmission {
  const amountCents = parseNonNegativeInt(inputModel.amountCents?.trim() ?? "") ?? 0;
  const reason = inputModel.reason?.trim();
  return {
    transactionId: inputModel.transactionId,
    amountCents,
    ...(reason ? { reason } : {})
  };
}

function buildDetailSections(
  transaction: StripePaymentTransactionView
): StripePaymentDetailSection[] {
  const currency = transaction.currency.toUpperCase();
  return [
    {
      title: "Payment",
      items: [
        { label: "Amount", value: formatCurrency(transaction.amountCents, currency) },
        { label: "Status", value: paymentStatusLabel(transaction.status) },
        { label: "Method", value: paymentMethodLabel(transaction.paymentMethod) }
      ]
    },
    {
      title: "Member",
      items: [
        { label: "Customer", value: transaction.memberName ?? "Walk-in customer" },
        { label: "Description", value: transaction.description?.trim() || "No description" }
      ]
    },
    {
      title: "Processing",
      items: [
        { label: "Transaction ID", value: transaction.id },
        { label: "Created", value: transaction.createdAt },
        {
          label: "Refunded",
          value: formatCurrency(transaction.refundedAmountCents ?? 0, currency)
        }
      ]
    }
  ];
}

function buildSummaryLabel(
  transaction: StripePaymentTransactionView,
  blockedReason: string | undefined
) {
  if (blockedReason) {
    return "Refund unavailable";
  }
  return `${paymentStatusLabel(transaction.status)} payment ready for refund review`;
}

function refundBlockedReason(
  transaction: StripePaymentTransactionView,
  canManagePayments: boolean
) {
  if (!canManagePayments) {
    return "Payment write permission is required.";
  }
  if (transaction.status === StripePaymentStatus.Failed) {
    return "Failed payments cannot be refunded.";
  }
  const remainingAmount = refundableAmount(transaction);
  if (remainingAmount <= 0) {
    return "No refundable amount remains.";
  }
  return undefined;
}

function refundableAmount(transaction: StripePaymentTransactionView) {
  return Math.max(0, transaction.amountCents - (transaction.refundedAmountCents ?? 0));
}

function formatCurrency(amountCents: number, currency: string) {
  return `${currency} ${(amountCents / 100).toFixed(2)}`;
}

function parseNonNegativeInt(value: string) {
  if (!/^\d+$/.test(value)) {
    return undefined;
  }
  return Number.parseInt(value, 10);
}

function paymentMethodLabel(paymentMethod: StripePaymentTransactionView["paymentMethod"]) {
  switch (paymentMethod) {
    case "card_reader":
      return "Card reader";
    case "manual_entry":
      return "Manual entry";
  }
}

function paymentStatusLabel(status: StripePaymentStatus) {
  switch (status) {
    case StripePaymentStatus.Succeeded:
      return "Succeeded";
    case StripePaymentStatus.Pending:
      return "Pending";
    case StripePaymentStatus.Failed:
      return "Failed";
    case StripePaymentStatus.Refunded:
      return "Refunded";
  }
}
