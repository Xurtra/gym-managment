import type { ButtonModel, ModalModel, UiIntent } from "@gym-platform/ui";
export interface DashboardConfirmationModal {
    kind: "dashboard_confirmation_modal";
    open: boolean;
    title: string;
    body: string;
    intent: UiIntent;
    destructive: boolean;
    confirmAction: ButtonModel;
    cancelAction: ButtonModel;
    modal: ModalModel;
}
export declare function buildDashboardConfirmationModal(inputModel: {
    title: string;
    body: string;
    open?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    intent?: UiIntent;
    destructive?: boolean;
    confirmDisabled?: boolean;
}): DashboardConfirmationModal;
//# sourceMappingURL=confirmationModal.d.ts.map