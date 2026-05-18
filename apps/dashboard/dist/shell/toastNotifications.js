import { button } from "@gym-platform/ui";
export function buildDashboardToastNotificationCenter(inputModel) {
    const maxVisible = Math.max(1, inputModel.maxVisible ?? 3);
    const toasts = inputModel.toasts.map(normalizeToast).sort(compareToastsByCreatedAt);
    return {
        kind: "dashboard_toast_notification_center",
        placement: inputModel.placement ?? "top-right",
        toasts,
        visibleToasts: toasts.slice(0, maxVisible),
        queuedCount: Math.max(0, toasts.length - maxVisible),
        dismissAllAction: button({
            label: "Dismiss all",
            icon: "x",
            intent: "secondary",
            disabled: toasts.length === 0
        })
    };
}
function normalizeToast(toast) {
    const severity = toast.severity ?? "info";
    const normalized = {
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
function buildToastAction(action) {
    const toastAction = {
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
function iconForSeverity(severity) {
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
function compareToastsByCreatedAt(left, right) {
    const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
    const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
    return rightTime - leftTime;
}
//# sourceMappingURL=toastNotifications.js.map