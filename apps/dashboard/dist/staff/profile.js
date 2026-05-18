import { Permission, RoleName, StaffAuditAction, UserStatus } from "@gym-platform/constants";
import { button, emptyState } from "@gym-platform/ui";
export function buildStaffProfilePage(inputModel) {
    const role = inputModel.roles.find((candidate) => candidate.id === inputModel.staff.roleId);
    const locked = isLockedStaff(inputModel.staff, inputModel.currentUserId, inputModel.ownerUserId);
    const auditTrail = (inputModel.auditEntries ?? [])
        .filter((entry) => entry.targetUserId === inputModel.staff.userId)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .map((entry) => buildAuditItem(entry, inputModel.staff, inputModel.roles));
    return {
        screen: "staff_profile",
        staff: inputModel.staff,
        fullName: fullNameForStaff(inputModel.staff),
        initials: buildInitials(inputModel.staff),
        roleLabel: role?.label ?? String(inputModel.staff.roleName),
        statusLabel: statusLabel(inputModel.staff.status),
        locked,
        details: [
            { key: "email", label: "Email", value: inputModel.staff.email },
            { key: "role", label: "Role", value: role?.label ?? String(inputModel.staff.roleName) },
            { key: "status", label: "Status", value: statusLabel(inputModel.staff.status) },
            { key: "joined", label: "Joined", value: inputModel.staff.createdAt },
            { key: "updated", label: "Last updated", value: inputModel.staff.updatedAt }
        ],
        actions: buildProfileActions({
            staff: inputModel.staff,
            locked,
            canEditRoles: inputModel.permissions.includes(Permission.StaffRoleAssign),
            canRemoveStaff: inputModel.permissions.includes(Permission.StaffRemove)
        }),
        auditTrail,
        ...(auditTrail.length === 0
            ? {
                auditEmpty: emptyState({
                    title: "No staff activity",
                    body: "Role and access changes for this staff member will appear here."
                })
            }
            : {})
    };
}
function buildProfileActions(inputModel) {
    return [
        {
            key: "back_to_staff",
            href: "/staff",
            button: button({
                label: "Back to staff",
                icon: "arrow-left",
                intent: "secondary"
            })
        },
        {
            key: "edit_permissions",
            href: `/staff/${inputModel.staff.userId}/permissions`,
            button: button({
                label: "Edit permissions",
                icon: "shield-check",
                intent: "secondary",
                disabled: !inputModel.canEditRoles || inputModel.locked
            })
        },
        {
            key: "remove_access",
            button: button({
                label: "Remove access",
                icon: "user-x",
                intent: "danger",
                disabled: !inputModel.canRemoveStaff || inputModel.locked
            })
        }
    ];
}
function buildAuditItem(entry, staff, roles) {
    return {
        ...entry,
        actionLabel: auditActionLabel(entry.action),
        actorLabel: entry.actorUserId,
        targetLabel: fullNameForStaff(staff),
        changeSummary: buildChangeSummary(entry, roles)
    };
}
function buildChangeSummary(entry, roles) {
    if (entry.action === StaffAuditAction.RoleChanged) {
        return `${roleLabel(entry.previousRoleId, roles)} to ${roleLabel(entry.nextRoleId, roles)}`;
    }
    if (entry.action === StaffAuditAction.AccessRemoved) {
        return entry.reason ? `Access removed: ${entry.reason}` : "Access removed";
    }
    return "Staff profile updated";
}
function roleLabel(roleId, roles) {
    if (!roleId) {
        return "Unassigned";
    }
    return roles.find((role) => role.id === roleId)?.label ?? roleId;
}
function auditActionLabel(action) {
    switch (action) {
        case StaffAuditAction.RoleChanged:
            return "Role changed";
        case StaffAuditAction.AccessRemoved:
            return "Access removed";
        default:
            return String(action);
    }
}
function isLockedStaff(staff, currentUserId, ownerUserId) {
    return (staff.status !== UserStatus.Active ||
        staff.roleName === RoleName.Owner ||
        staff.userId === currentUserId ||
        staff.userId === ownerUserId);
}
function fullNameForStaff(staff) {
    return `${staff.firstName} ${staff.lastName}`.trim() || staff.email;
}
function buildInitials(staff) {
    const initials = `${staff.firstName.trim().charAt(0)}${staff.lastName.trim().charAt(0)}`;
    return initials.toUpperCase() || staff.email.trim().charAt(0).toUpperCase();
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
//# sourceMappingURL=profile.js.map