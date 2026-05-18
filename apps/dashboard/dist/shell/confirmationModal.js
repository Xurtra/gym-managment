import { button, modal } from "@gym-platform/ui";
export function buildDashboardConfirmationModal(inputModel) {
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
//# sourceMappingURL=confirmationModal.js.map