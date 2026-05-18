import { button, modal } from "@gym-platform/ui";
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

export function buildDashboardConfirmationModal(inputModel: {
  title: string;
  body: string;
  open?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: UiIntent;
  destructive?: boolean;
  confirmDisabled?: boolean;
}): DashboardConfirmationModal {
  const destructive = inputModel.destructive ?? inputModel.intent === "danger";
  const intent = inputModel.intent ?? (destructive ? "danger" : "primary");
  const confirmAction = button({
    label: inputModel.confirmLabel ?? "Confirm",
    intent,
    disabled: inputModel.confirmDisabled ?? false
  });
  const cancelAction = button({
    label: inputModel.cancelLabel ?? "Cancel",
    intent: "secondary"
  });

  return {
    kind: "dashboard_confirmation_modal",
    open: inputModel.open ?? false,
    title: inputModel.title.trim(),
    body: inputModel.body.trim(),
    intent,
    destructive,
    confirmAction,
    cancelAction,
    modal: modal({
      title: inputModel.title.trim(),
      body: inputModel.body.trim(),
      open: inputModel.open ?? false,
      actions: [cancelAction, confirmAction]
    })
  };
}
