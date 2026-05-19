import { Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";

export interface StripePaymentAccountView {
  gymId: string;
  accountId?: string;
  country?: string;
  defaultCurrency?: string;
  businessName?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
  requirementsDue: string[];
  dashboardUrl?: string;
}

export interface StripePaymentConnectionScreen {
  screen: "stripe_payment_connection";
  connected: boolean;
  canManagePayments: boolean;
  statusLabel: string;
  countryLabel: string;
  currencyLabel: string;
  businessLabel: string;
  requirementCount: number;
  requirementsDue: string[];
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
  hasDashboardLink: boolean;
  dashboardUrl?: string;
  connectAction: ButtonModel;
  continueOnboardingAction: ButtonModel;
  openDashboardAction: ButtonModel;
  disconnectAction: ButtonModel;
  actionCount: number;
  summaryLabel: string;
  reason?: string;
}

export function buildStripePaymentConnectionScreen(inputModel: {
  account?: StripePaymentAccountView;
  permissions: string[];
}): StripePaymentConnectionScreen {
  const canManagePayments = inputModel.permissions.includes(Permission.PaymentWrite);
  const account = inputModel.account;
  const connected = Boolean(account?.accountId);
  const requirementCount = account?.requirementsDue.length ?? 0;
  const hasDashboardLink = Boolean(account?.dashboardUrl);
  const reason = canManagePayments ? undefined : "You do not have permission to manage payments.";
  const statusLabel = resolveStatusLabel(account);
  const summaryLabel = !connected
    ? "Stripe account not connected"
    : account?.onboardingComplete
      ? "Stripe account ready for payments"
      : `${requirementCount} Stripe onboarding requirement${requirementCount === 1 ? "" : "s"} remaining`;

  return {
    screen: "stripe_payment_connection",
    connected,
    canManagePayments,
    statusLabel,
    countryLabel: account?.country ?? "No country selected",
    currencyLabel: account?.defaultCurrency?.toUpperCase() ?? "No default currency",
    businessLabel: account?.businessName ?? "No connected business",
    requirementCount,
    requirementsDue: account?.requirementsDue ?? [],
    chargesEnabled: account?.chargesEnabled ?? false,
    payoutsEnabled: account?.payoutsEnabled ?? false,
    onboardingComplete: account?.onboardingComplete ?? false,
    hasDashboardLink,
    ...(account?.dashboardUrl ? { dashboardUrl: account.dashboardUrl } : {}),
    connectAction: button({
      label: connected ? "Reconnect Stripe" : "Connect Stripe",
      icon: "link",
      disabled: !canManagePayments
    }),
    continueOnboardingAction: button({
      label: "Continue onboarding",
      icon: "arrow-right",
      disabled: !connected || !canManagePayments || Boolean(account?.onboardingComplete)
    }),
    openDashboardAction: button({
      label: "Open Stripe dashboard",
      icon: "external-link",
      intent: "secondary",
      disabled: !hasDashboardLink
    }),
    disconnectAction: button({
      label: "Disconnect Stripe",
      icon: "unlink",
      intent: "danger",
      disabled: !connected || !canManagePayments
    }),
    actionCount: 4,
    summaryLabel,
    ...(reason ? { reason } : {})
  };
}

function resolveStatusLabel(account: StripePaymentAccountView | undefined) {
  if (!account?.accountId) {
    return "Not connected";
  }
  if (account.onboardingComplete && account.chargesEnabled && account.payoutsEnabled) {
    return "Ready";
  }
  if (account.onboardingComplete) {
    return "Limited";
  }
  return "Onboarding required";
}
