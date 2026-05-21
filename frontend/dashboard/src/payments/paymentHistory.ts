import { FeatureFlag, Permission } from "@gym-platform/constants";
import { button, emptyState } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
import { StripePaymentMethod } from "./paymentCollection.js";

export const StripePaymentStatus = {
  Succeeded: "succeeded",
  Pending: "pending",
  Failed: "failed",
  Refunded: "refunded"
} as const;

export type StripePaymentStatus =
  (typeof StripePaymentStatus)[keyof typeof StripePaymentStatus];

export interface StripePaymentTransactionView {
  id: string;
  gymId: string;
  memberId?: string;
  memberName?: string;
  amountCents: number;
  currency: string;
  paymentMethod: StripePaymentMethod;
  status: StripePaymentStatus;
  description?: string;
  refundedAmountCents?: number;
  createdAt: string;
}

export interface StripePaymentStatusOption {
  value: StripePaymentStatus;
  label: string;
  selected: boolean;
}

export interface StripePaymentHistoryRow {
  id: string;
  memberName: string;
  amountLabel: string;
  paymentMethodLabel: string;
  statusLabel: string;
  descriptionLabel: string;
  refundedAmountLabel?: string;
  createdAt: string;
  detailHref: string;
}

export interface StripePaymentHistoryScreen {
  screen: "stripe_payment_history";
  canViewPayments: boolean;
  canManagePayments: boolean;
  pointOfSaleEnabled: boolean;
  rows: StripePaymentHistoryRow[];
  rowCount: number;
  totalCount: number;
  totalCollectedAmountLabel: string;
  statusOptions: StripePaymentStatusOption[];
  statusOptionCount: number;
  selectedStatus?: StripePaymentStatus;
  query: string;
  summaryLabel: string;
  collectPaymentAction: ButtonModel;
  empty?: EmptyStateModel;
  blockedReason?: string;
}

export function buildStripePaymentHistoryScreen(inputModel: {
  transactions: StripePaymentTransactionView[];
  permissions: string[];
  featureFlags?: string[];
  query?: string;
  status?: StripePaymentStatus;
}): StripePaymentHistoryScreen {
  const canViewPayments = hasPaymentReadAccess(inputModel.permissions);
  const canManagePayments = inputModel.permissions.includes(Permission.PaymentWrite);
  const pointOfSaleEnabled = (inputModel.featureFlags ?? []).includes(FeatureFlag.PointOfSale);
  const query = inputModel.query?.trim() ?? "";
  const filteredTransactions = canViewPayments
    ? filterTransactions(inputModel.transactions, query, inputModel.status)
    : [];
  const rows = filteredTransactions.map(buildHistoryRow);
  const totalCollectedAmountCents = filteredTransactions.reduce((total, transaction) => {
    return transaction.status === StripePaymentStatus.Failed ? total : total + transaction.amountCents;
  }, 0);
  const blockedReason = canViewPayments ? undefined : "Payment read permission is required.";
  const empty = buildEmptyState({
    blockedReason,
    hasTransactions: inputModel.transactions.length > 0,
    hasFilters: Boolean(query || inputModel.status),
    canManagePayments,
    pointOfSaleEnabled
  });

  return {
    screen: "stripe_payment_history",
    canViewPayments,
    canManagePayments,
    pointOfSaleEnabled,
    rows,
    rowCount: rows.length,
    totalCount: inputModel.transactions.length,
    totalCollectedAmountLabel: formatCurrency(totalCollectedAmountCents, detectCurrency(filteredTransactions)),
    statusOptions: buildStatusOptions(inputModel.status),
    statusOptionCount: Object.values(StripePaymentStatus).length,
    ...(inputModel.status ? { selectedStatus: inputModel.status } : {}),
    query,
    summaryLabel: buildSummaryLabel({
      blockedReason,
      rowCount: rows.length,
      totalAmountLabel: formatCurrency(totalCollectedAmountCents, detectCurrency(filteredTransactions)),
      hasFilters: Boolean(query || inputModel.status)
    }),
    collectPaymentAction: button({
      label: "Collect payment",
      icon: "credit-card",
      disabled: !canManagePayments || !pointOfSaleEnabled
    }),
    ...(empty ? { empty } : {}),
    ...(blockedReason ? { blockedReason } : {})
  };
}

function hasPaymentReadAccess(permissions: string[]) {
  return permissions.includes(Permission.PaymentRead) || permissions.includes(Permission.PaymentWrite);
}

function filterTransactions(
  transactions: StripePaymentTransactionView[],
  query: string,
  status: StripePaymentStatus | undefined
) {
  const normalizedQuery = query.toLowerCase();
  return transactions
    .filter((transaction) => !status || transaction.status === status)
    .filter((transaction) => {
      if (!normalizedQuery) {
        return true;
      }
      return [
        transaction.memberName,
        transaction.description,
        transaction.id
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery));
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function buildHistoryRow(transaction: StripePaymentTransactionView): StripePaymentHistoryRow {
  const currency = transaction.currency.toUpperCase();
  return {
    id: transaction.id,
    memberName: transaction.memberName ?? "Walk-in customer",
    amountLabel: formatCurrency(transaction.amountCents, currency),
    paymentMethodLabel: paymentMethodLabel(transaction.paymentMethod),
    statusLabel: paymentStatusLabel(transaction.status),
    descriptionLabel: transaction.description?.trim() || "No description",
    ...(transaction.refundedAmountCents
      ? { refundedAmountLabel: formatCurrency(transaction.refundedAmountCents, currency) }
      : {}),
    createdAt: transaction.createdAt,
    detailHref: `/payments/${transaction.id}`
  };
}

function buildStatusOptions(selectedStatus: StripePaymentStatus | undefined): StripePaymentStatusOption[] {
  return Object.values(StripePaymentStatus).map((status) => ({
    value: status,
    label: paymentStatusLabel(status),
    selected: status === selectedStatus
  }));
}

function buildEmptyState(inputModel: {
  blockedReason: string | undefined;
  hasTransactions: boolean;
  hasFilters: boolean;
  canManagePayments: boolean;
  pointOfSaleEnabled: boolean;
}) {
  if (inputModel.blockedReason) {
    return emptyState({
      title: "Payments unavailable",
      body: inputModel.blockedReason
    });
  }
  if (inputModel.hasTransactions && inputModel.hasFilters) {
    return emptyState({
      title: "No payments match these filters",
      body: "Adjust the search or payment status filter."
    });
  }
  if (!inputModel.hasTransactions) {
    return emptyState({
      title: "No payments yet",
      body: "Stripe payments collected by staff will appear here.",
      ...(inputModel.canManagePayments && inputModel.pointOfSaleEnabled
        ? { action: button({ label: "Collect payment", icon: "credit-card" }) }
        : {})
    });
  }
  return undefined;
}

function buildSummaryLabel(inputModel: {
  blockedReason: string | undefined;
  rowCount: number;
  totalAmountLabel: string;
  hasFilters: boolean;
}) {
  if (inputModel.blockedReason) {
    return "Payment history unavailable";
  }
  if (inputModel.rowCount === 0) {
    return inputModel.hasFilters ? "No matching payments" : "No payments recorded";
  }
  return `${inputModel.rowCount} payment${inputModel.rowCount === 1 ? "" : "s"} totaling ${inputModel.totalAmountLabel}`;
}

function detectCurrency(transactions: StripePaymentTransactionView[]) {
  return transactions[0]?.currency?.toUpperCase() ?? "USD";
}

function formatCurrency(amountCents: number, currency: string) {
  return `${currency} ${(amountCents / 100).toFixed(2)}`;
}

function paymentMethodLabel(paymentMethod: StripePaymentMethod) {
  switch (paymentMethod) {
    case StripePaymentMethod.CardReader:
      return "Card reader";
    case StripePaymentMethod.ManualEntry:
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
