import { Permission, RoleName, UserStatus } from "@gym-platform/constants";
import { button, input, modal, table } from "@gym-platform/ui";
export function buildStaffPermissionsScreen(inputModel) {
    const canEditRoles = inputModel.permissions.includes(Permission.StaffRoleAssign);
    const canRemoveStaff = inputModel.permissions.includes(Permission.StaffRemove);
    const roleOptions = editableStaffRoles(inputModel.roles);
    const selectedStaff = inputModel.staff.find((staff) => staff.userId === inputModel.selectedUserId);
    const selectedRoleId = inputModel.selectedRoleId ?? selectedStaff?.roleId;
    const selectedRole = roleOptions.find((role) => role.id === selectedRoleId);
    const selectedLocked = selectedStaff
        ? isLockedStaff(selectedStaff, inputModel.currentUserId, inputModel.ownerUserId)
        : true;
    const canSubmitRoleChange = Boolean(canEditRoles &&
        selectedStaff &&
        selectedRole &&
        !selectedLocked &&
        selectedRole.id !== selectedStaff.roleId);
    const reason = inputModel.removalReason?.trim() ?? "";
    const removalStaff = inputModel.staff.find((staff) => staff.userId === inputModel.removalUserId);
    const canConfirmRemoval = Boolean(canRemoveStaff &&
        removalStaff &&
        !isLockedStaff(removalStaff, inputModel.currentUserId, inputModel.ownerUserId));
    const rows = inputModel.staff.map((staff) => {
        const rowSelectedRoleId = staff.userId === inputModel.selectedUserId ? selectedRoleId : staff.roleId;
        const rowOptions = {
            roleOptions,
            canEditRoles,
            canRemoveStaff
        };
        if (inputModel.currentUserId) {
            rowOptions.currentUserId = inputModel.currentUserId;
        }
        if (inputModel.ownerUserId) {
            rowOptions.ownerUserId = inputModel.ownerUserId;
        }
        if (rowSelectedRoleId) {
            rowOptions.selectedRoleId = rowSelectedRoleId;
        }
        return buildPermissionRow(staff, rowOptions);
    });
    return {
        screen: "staff_permissions",
        canEditRoles,
        canRemoveStaff,
        roleOptions,
        rows,
        ...(selectedStaff ? { selectedUserId: selectedStaff.userId } : {}),
        ...(selectedRoleId ? { selectedRoleId } : {}),
        canSubmitRoleChange,
        reasonField: input({
            name: "reason",
            label: "Reason",
            value: reason,
            type: "text",
            required: false
        }),
        saveAction: button({ label: "Save role", disabled: !canSubmitRoleChange }),
        removeAction: button({
            label: "Remove access",
            intent: "danger",
            disabled: !canConfirmRemoval
        }),
        removalModal: modal({
            title: "Remove staff access",
            open: Boolean(removalStaff),
            body: removalStaff ? `${removalStaff.firstName} ${removalStaff.lastName}` : "",
            actions: [
                button({ label: "Cancel", intent: "secondary" }),
                button({ label: "Remove access", intent: "danger", disabled: !canConfirmRemoval })
            ]
        }),
        table: table({
            columns: [
                { key: "fullName", label: "Name" },
                { key: "email", label: "Email" },
                { key: "roleName", label: "Role" },
                { key: "status", label: "Status" }
            ],
            rows
        }),
        auditTrail: inputModel.auditEntries ?? []
    };
}
export function createStaffPermissionChangeSubmission(inputModel) {
    return {
        userId: inputModel.userId,
        roleId: inputModel.roleId
    };
}
export function createStaffAccessRemovalSubmission(inputModel) {
    const submission = {
        userId: inputModel.userId
    };
    const reason = inputModel.reason?.trim();
    if (reason) {
        submission.reason = reason;
    }
    return submission;
}
function buildPermissionRow(staff, options) {
    const locked = isLockedStaff(staff, options.currentUserId, options.ownerUserId);
    return {
        ...staff,
        fullName: `${staff.firstName} ${staff.lastName}`.trim(),
        locked,
        canEdit: options.canEditRoles && !locked,
        canRemove: options.canRemoveStaff && !locked,
        roleOptions: options.roleOptions.map((role) => ({
            ...role,
            selected: role.id === options.selectedRoleId,
            disabled: locked || !options.canEditRoles || Boolean(role.disabled)
        }))
    };
}
function editableStaffRoles(roles) {
    return roles
        .filter((role) => role.name !== RoleName.Member && role.name !== RoleName.Owner)
        .map((role) => ({
        ...role,
        disabled: role.disabled ?? false
    }));
}
function isLockedStaff(staff, currentUserId, ownerUserId) {
    return (staff.status !== UserStatus.Active ||
        staff.roleName === RoleName.Owner ||
        staff.userId === currentUserId ||
        staff.userId === ownerUserId);
}
//# sourceMappingURL=access.js.map