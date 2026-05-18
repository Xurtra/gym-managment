import { Permission, UserStatus } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
export function buildStaffListPage(inputModel) {
    const query = inputModel.filters?.query?.trim().toLowerCase() ?? "";
    const filters = {
        query,
        ...(inputModel.filters?.roleId ? { roleId: inputModel.filters.roleId } : {}),
        ...(inputModel.filters?.status ? { status: inputModel.filters.status } : {})
    };
    const canInviteStaff = inputModel.permissions.includes(Permission.StaffInvite);
    const canManageStaff = inputModel.permissions.includes(Permission.StaffRoleAssign);
    const canRemoveStaff = inputModel.permissions.includes(Permission.StaffRemove);
    const roleLookup = new Map(inputModel.roles.map((role) => [role.id, role]));
    const rows = inputModel.staff
        .filter((staff) => matchesFilters(staff, filters, roleLookup))
        .sort(compareStaff)
        .map((staff) => buildStaffListRow(staff, {
        role: roleLookup.get(staff.roleId),
        canManageStaff,
        canRemoveStaff
    }));
    const empty = rows.length === 0
        ? buildEmptyState(Boolean(query || filters.roleId || filters.status))
        : undefined;
    return {
        screen: "staff_list",
        filters,
        searchField: input({
            name: "staffSearch",
            label: "Search staff",
            value: query,
            type: "text",
            required: false
        }),
        roleOptions: inputModel.roles.map((role) => ({
            ...role,
            selected: role.id === filters.roleId
        })),
        statusOptions: Object.values(UserStatus).map((status) => ({
            value: status,
            label: statusLabel(status),
            selected: status === filters.status
        })),
        summary: {
            totalCount: inputModel.staff.length,
            activeCount: inputModel.staff.filter((staff) => staff.status === UserStatus.Active).length,
            invitedCount: inputModel.staff.filter((staff) => staff.status === UserStatus.Invited).length,
            disabledCount: inputModel.staff.filter((staff) => staff.status === UserStatus.Disabled)
                .length,
            visibleCount: rows.length
        },
        rows,
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
        ...(empty ? { empty } : {}),
        inviteAction: button({
            label: "Invite staff",
            icon: "user-plus",
            disabled: !canInviteStaff
        }),
        manageRolesAction: button({
            label: "Manage roles",
            icon: "shield-check",
            intent: "secondary",
            disabled: !canManageStaff
        })
    };
}
function buildStaffListRow(staff, options) {
    const fullName = `${staff.firstName} ${staff.lastName}`.trim() || staff.email;
    const locked = staff.status !== UserStatus.Active;
    return {
        ...staff,
        fullName,
        initials: buildInitials(staff.firstName, staff.lastName, staff.email),
        roleLabel: options.role?.label ?? String(staff.roleName),
        statusLabel: statusLabel(staff.status),
        active: staff.status === UserStatus.Active,
        detailHref: `/staff/${staff.userId}`,
        actions: [
            {
                key: "view",
                href: `/staff/${staff.userId}`,
                button: button({
                    label: "View",
                    icon: "eye",
                    intent: "secondary"
                })
            },
            {
                key: "edit_permissions",
                href: `/staff/${staff.userId}/permissions`,
                button: button({
                    label: "Edit permissions",
                    icon: "shield-check",
                    intent: "secondary",
                    disabled: !options.canManageStaff || locked
                })
            },
            {
                key: "remove_access",
                button: button({
                    label: "Remove access",
                    icon: "user-x",
                    intent: "danger",
                    disabled: !options.canRemoveStaff || locked
                })
            }
        ]
    };
}
function matchesFilters(staff, filters, roleLookup) {
    if (filters.roleId && staff.roleId !== filters.roleId) {
        return false;
    }
    if (filters.status && staff.status !== filters.status) {
        return false;
    }
    if (!filters.query) {
        return true;
    }
    const role = roleLookup.get(staff.roleId);
    const searchable = [
        staff.firstName,
        staff.lastName,
        staff.email,
        staff.roleName,
        role?.label,
        staff.status
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    return searchable.includes(filters.query);
}
function compareStaff(left, right) {
    const leftName = `${left.lastName} ${left.firstName}`.trim() || left.email;
    const rightName = `${right.lastName} ${right.firstName}`.trim() || right.email;
    return leftName.localeCompare(rightName);
}
function buildInitials(firstName, lastName, email) {
    const first = firstName.trim().charAt(0);
    const last = lastName.trim().charAt(0);
    const initials = `${first}${last}`.toUpperCase();
    return initials || email.trim().charAt(0).toUpperCase();
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
function buildEmptyState(filtered) {
    return emptyState({
        title: filtered ? "No staff match your filters" : "No staff yet",
        body: filtered
            ? "Adjust the staff filters and try again."
            : "Invite staff to start building your team."
    });
}
//# sourceMappingURL=list.js.map