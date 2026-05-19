import { Permission, RoleName, UserStatus } from "@gym-platform/constants";
import { button, emptyState, input, modal, table } from "@gym-platform/ui";
export function buildStaffPermissionsScreen(inputModel) {
    const canEditRoles = inputModel.permissions.includes(Permission.StaffRoleAssign);
    const canRemoveStaff = inputModel.permissions.includes(Permission.StaffRemove);
    const roleOptions = editableStaffRoles(inputModel.roles);
    const selectedStaff = inputModel.staff.find((staff) => staff.userId === inputModel.selectedUserId);
    const selectedStaffName = selectedStaff
        ? `${selectedStaff.firstName} ${selectedStaff.lastName}`.trim()
        : undefined;
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
    const rows = inputModel.staff
        .map((staff) => {
        const rowSelectedRoleId = staff.userId === inputModel.selectedUserId ? selectedRoleId : staff.roleId;
        const rowOptions = {
            roleOptions,
            canEditRoles,
            canRemoveStaff,
            selected: staff.userId === selectedStaff?.userId
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
    })
        .sort((left, right) => left.fullName.localeCompare(right.fullName) || left.userId.localeCompare(right.userId));
    const empty = rows.length === 0
        ? emptyState({
            title: "No staff access to manage",
            body: "Invite staff to start assigning roles and reviewing access."
        })
        : undefined;
    const editableStaffCount = rows.filter((row) => row.canEdit).length;
    const removableStaffCount = rows.filter((row) => row.canRemove).length;
    const auditEntryCount = (inputModel.auditEntries ?? []).length;
    return {
        screen: "staff_permissions",
        canEditRoles,
        canRemoveStaff,
        roleOptions,
        rows,
        totalStaffCount: rows.length,
        editableStaffCount,
        removableStaffCount,
        auditEntryCount,
        summaryLabel: rows.length === 0
            ? "No staff access configured"
            : `${editableStaffCount} editable staff member${editableStaffCount === 1 ? "" : "s"}`,
        ...(selectedStaff ? { selectedUserId: selectedStaff.userId } : {}),
        ...(selectedStaffName ? { selectedStaffName } : {}),
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
            body: removalStaff
                ? `${removalStaff.firstName} ${removalStaff.lastName} (${removalStaff.email})`
                : "",
            actions: [
                button({ label: "Cancel", intent: "secondary" }),
                button({ label: "Remove access", intent: "danger", disabled: !canConfirmRemoval })
            ]
        }),
        ...(empty ? { empty } : {}),
        table: table({
            columns: [
                { key: "fullName", label: "Name" },
                { key: "email", label: "Email" },
                { key: "roleLabel", label: "Role" },
                { key: "statusLabel", label: "Status" }
            ],
            rows,
            ...(empty ? { empty } : {})
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
    const selectedRole = options.roleOptions.find((role) => role.id === options.selectedRoleId);
    return {
        ...staff,
        fullName: `${staff.firstName} ${staff.lastName}`.trim(),
        selected: options.selected,
        locked,
        ...(locked ? { lockedReason: lockedReason(staff, options.currentUserId, options.ownerUserId) } : {}),
        canEdit: options.canEditRoles && !locked,
        canRemove: options.canRemoveStaff && !locked,
        roleLabel: selectedRole?.label ?? String(staff.roleName),
        statusLabel: statusLabel(staff.status),
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
function lockedReason(staff, currentUserId, ownerUserId) {
    if (staff.roleName === RoleName.Owner) {
        return "Owners cannot have their role or access changed.";
    }
    if (staff.userId === currentUserId || staff.userId === ownerUserId) {
        return "You cannot change your own staff access.";
    }
    if (staff.status !== UserStatus.Active) {
        return "Only active staff access can be changed.";
    }
    return "This staff member cannot be changed.";
}
function statusLabel(status) {
    switch (status) {
        case UserStatus.Active:
            return "Active";
        case UserStatus.Invited:
            return "Invited";
        case UserStatus.Disabled:
            return "Disabled";
        default:
            return String(status);
    }
}
//# sourceMappingURL=access.js.map