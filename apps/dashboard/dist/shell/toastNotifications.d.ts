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
export declare function buildDashboardToastNotificationCenter(inputModel: {
    toasts: ToastNotificationInput[];
    maxVisible?: number;
    placement?: ToastNotificationPlacement;
}): DashboardToastNotificationCenter;
//# sourceMappingURL=toastNotifications.d.ts.map