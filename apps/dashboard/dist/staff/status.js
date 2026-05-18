import { Permission, RoleName, UserStatus } from "@gym-platform/constants";
import { button, input, modal } from "@gym-platform/ui";
export function buildStaffStatusFlow(inputModel) {
    const locked = isLockedStaff(inputModel.staff, inputModel.currentUserId, inputModel.ownerUserId);
    const canActivate = Boolean(!locked &&
        inputModel.staff.status === UserStatus.Disabled &&
        inputModel.permissions.includes(Permission.StaffRoleAssign));
    const canDeactivate = Boolean(!locked &&
        inputModel.staff.status === UserStatus.Active &&
        inputModel.permissions.includes(Permission.StaffRemove));
    const nextStatus = resolveNextStatus(inputModel.staff.status, inputModel.targetStatus);
    const canSubmit = Boolean(nextStatus &&
        nextStatus !== inputModel.staff.status &&
        ((nextStatus === UserStatus.Active && canActivate) ||
            (nextStatus === UserStatus.Disabled && canDeactivate)));
    const reason = inputModel.reason?.trim() ?? "";
    const staffName = `${inputModel.staff.firstName} ${inputModel.staff.lastName}`.trim();
    return {
        screen: "staff_status_flow",
        staff: inputModel.staff,
        currentStatus: inputModel.staff.status,
        ...(nextStatus ? { nextStatus } : {}),
        locked,
        canActivate,
        canDeactivate,
        canSubmit,
        reasonField: input({
            name: "reason",
            label: "Reason",
            value: reason,
            type: "text",
            required: false
        }),
        activateAction: button({
            label: "Activate staff",
            icon: "user-check",
            disabled: !canActivate
        }),
        deactivateAction: button({
            label: "Deactivate staff",
            icon: "user-x",
            intent: "danger",
            disabled: !canDeactivate
        }),
        cancelAction: button({
            label: "Cancel",
            icon: "x",
            intent: "secondary"
        }),
        confirmationModal: modal({
            title: nextStatus === UserStatus.Active ? "Activate staff member" : "Deactivate staff member",
            open: Boolean(nextStatus),
            body: staffName || inputModel.staff.email,
            actions: [
                button({ label: "Cancel", intent: "secondary" }),
                button({
                    label: nextStatus === UserStatus.Active ? "Activate staff" : "Deactivate staff",
                    intent: nextStatus === UserStatus.Disabled ? "danger" : "primary",
                    disabled: !canSubmit
                })
            ]
        })
    };
}
export function createStaffStatusChangeSubmission(inputModel) {
    const submission = {
        userId: inputModel.userId,
        status: inputModel.status
    };
    const reason = inputModel.reason?.trim();
    if (reason) {
        submission.reason = reason;
    }
    return submission;
}
function resolveNextStatus(currentStatus, targetStatus) {
    if (targetStatus) {
        return targetStatus;
    }
    if (currentStatus === UserStatus.Active) {
        return UserStatus.Disabled;
    }
    if (currentStatus === UserStatus.Disabled) {
        return UserStatus.Active;
    }
    return undefined;
}
function isLockedStaff(staff, currentUserId, ownerUserId) {
    return (staff.roleName === RoleName.Owner ||
        staff.userId === currentUserId ||
        staff.userId === ownerUserId);
}
//# sourceMappingURL=status.js.map