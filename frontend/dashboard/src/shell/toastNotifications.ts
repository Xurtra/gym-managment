import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";

export type ToastNotificationSeverity = "info" | "success" | "warning" | "danger";
export type ToastNotificationPlacement = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export interface ToastNotificationActionInput {
  key: string;
  label: string;
  href?: string;
  icon?: string;
  disabled?: boolean;
}

export interface ToastNotificationInput {
  id: string;
  title: string;
  message?: string;
  severity?: ToastNotificationSeverity;
  createdAt?: string;
  autoDismissMs?: number;
  persistent?: boolean;
  action?: ToastNotificationActionInput;
}

export interface ToastNotificationAction {
  key: string;
  button: ButtonModel;
  href?: string;
}

export interface DashboardToastNotification {
  kind: "dashboard_toast_notification";
  id: string;
  title: string;
  severity: ToastNotificationSeverity;
  icon: string;
  createdAt?: string;
  message?: string;
  autoDismissMs?: number;
  persistent: boolean;
  dismissAction: ButtonModel;
  action?: ToastNotificationAction;
}

export interface DashboardToastNotificationCenter {
  kind: "dashboard_toast_notification_center";
  placement: ToastNotificationPlacement;
  toasts: DashboardToastNotification[];
  visibleToasts: DashboardToastNotification[];
  totalCount: number;
  visibleCount: number;
  queuedCount: number;
  summaryLabel: string;
  dismissAllAction: ButtonModel;
}

export function buildDashboardToastNotificationCenter(inputModel: {
  toasts: ToastNotificationInput[];
  maxVisible?: number;
  placement?: ToastNotificationPlacement;
}): DashboardToastNotificationCenter {
  const maxVisible = Math.max(1, inputModel.maxVisible ?? 3);
  const toasts = inputModel.toasts.map(normalizeToast).sort(compareToastsByCreatedAt);

  return {
    kind: "dashboard_toast_notification_center",
    placement: inputModel.placement ?? "top-right",
    toasts,
    visibleToasts: toasts.slice(0, maxVisible),
    totalCount: toasts.length,
    visibleCount: Math.min(toasts.length, maxVisible),
    queuedCount: Math.max(0, toasts.length - maxVisible),
    summaryLabel:
      toasts.length === 0
        ? "No notifications"
        : `${Math.min(toasts.length, maxVisible)} of ${toasts.length} notification${
            toasts.length === 1 ? "" : "s"
          } visible`,
    dismissAllAction: button({
      label: "Dismiss all",
      icon: "x",
      intent: "secondary",
      disabled: toasts.length === 0
    })
  };
}

function normalizeToast(toast: ToastNotificationInput): DashboardToastNotification {
  const severity = toast.severity ?? "info";
  const normalized: DashboardToastNotification = {
    kind: "dashboard_toast_notification",
    id: toast.id,
    title: toast.title.trim(),
    severity,
    icon: iconForSeverity(severity),
    persistent: toast.persistent ?? false,
    dismissAction: button({
      label: "Dismiss",
      icon: "x",
      intent: "secondary"
    })
  };

  const message = toast.message?.trim();
  if (message) {
    normalized.message = message;
  }
  if (toast.createdAt) {
    normalized.createdAt = toast.createdAt;
  }
  if (toast.autoDismissMs && !normalized.persistent) {
    normalized.autoDismissMs = Math.max(1000, toast.autoDismissMs);
  }
  if (toast.action) {
    normalized.action = buildToastAction(toast.action);
  }

  return normalized;
}

function buildToastAction(action: ToastNotificationActionInput): ToastNotificationAction {
  const toastAction: ToastNotificationAction = {
    key: action.key,
    button: button({
      label: action.label,
      intent: "secondary",
      disabled: action.disabled ?? false,
      ...(action.icon ? { icon: action.icon } : {})
    })
  };
  if (action.href) {
    toastAction.href = action.href;
  }
  return toastAction;
}

function iconForSeverity(severity: ToastNotificationSeverity) {
  switch (severity) {
    case "success":
      return "check-circle";
    case "warning":
      return "triangle-alert";
    case "danger":
      return "circle-alert";
    default:
      return "info";
  }
}

function compareToastsByCreatedAt(
  left: DashboardToastNotification,
  right: DashboardToastNotification
) {
  const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
  const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
  return rightTime - leftTime;
}
