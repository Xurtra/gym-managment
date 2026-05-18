import { Permission, RoleName } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
export function buildCustomRoleCreateScreen(inputModel = {}) {
    return buildCustomRoleScreen({
        screen: "custom_role_create",
        actionLabel: "Create role",
        name: inputModel.name,
        selectedPermissions: inputModel.selectedPermissions
    });
}
export function buildCustomRoleEditScreen(inputModel) {
    return buildCustomRoleScreen({
        screen: "custom_role_edit",
        actionLabel: "Save role",
        roleId: inputModel.role.id,
        name: inputModel.name ?? inputModel.role.label,
        selectedPermissions: inputModel.selectedPermissions ?? inputModel.role.permissions ?? [],
        locked: inputModel.role.isSystem === true || inputModel.role.name === RoleName.Owner
    });
}
export function createCustomRoleSubmission(inputModel) {
    return {
        name: inputModel.name.trim(),
        permissions: editablePermissions(inputModel.permissions)
    };
}
function buildCustomRoleScreen(inputModel) {
    const name = inputModel.name?.trim() ?? "";
    const selectedPermissions = editablePermissions(inputModel.selectedPermissions ?? []);
    const locked = inputModel.locked ?? false;
    const canSubmit = Boolean(!locked && name.length >= 2 && selectedPermissions.length > 0);
    const screen = {
        screen: inputModel.screen,
        nameField: input({
            name: "name",
            label: "Role name",
            value: name,
            type: "text",
            required: true,
            ...(locked ? { error: "System roles cannot be edited." } : {})
        }),
        permissionGroups: buildPermissionGroups(selectedPermissions, locked),
        selectedPermissions,
        canSubmit,
        action: button({ label: inputModel.actionLabel, disabled: !canSubmit })
    };
    if (inputModel.roleId) {
        screen.roleId = inputModel.roleId;
    }
    return screen;
}
function buildPermissionGroups(selectedPermissions, locked) {
    return permissionGroups.map((group) => ({
        ...group,
        toggles: group.permissions.map((permission) => ({
            permission,
            label: permissionLabels[permission],
            group: group.key,
            checked: selectedPermissions.includes(permission),
            disabled: locked || permission === Permission.PlatformAdmin
        }))
    }));
}
function editablePermissions(permissions) {
    return [...new Set(permissions)].filter((permission) => permission !== Permission.PlatformAdmin);
}
const permissionLabels = {
    [Permission.GymRead]: "View gym",
    [Permission.GymUpdate]: "Update gym",
    [Permission.LocationRead]: "View locations",
    [Permission.LocationCreate]: "Create locations",
    [Permission.LocationUpdate]: "Update locations",
    [Permission.LocationArchive]: "Archive locations",
    [Permission.StaffRead]: "View staff",
    [Permission.StaffInvite]: "Invite staff",
    [Permission.StaffRoleAssign]: "Assign roles",
    [Permission.StaffRemove]: "Remove staff",
    [Permission.MemberRead]: "View members",
    [Permission.MemberWrite]: "Manage members",
    [Permission.PlanRead]: "View plans",
    [Permission.PlanWrite]: "Manage plans",
    [Permission.ClassRead]: "View classes",
    [Permission.ClassWrite]: "Manage classes",
    [Permission.BookingRead]: "View bookings",
    [Permission.BookingWrite]: "Manage bookings",
    [Permission.AccessRead]: "View access control",
    [Permission.AccessWrite]: "Manage access control",
    [Permission.PaymentRead]: "View payments",
    [Permission.PaymentWrite]: "Manage payments",
    [Permission.ReportRead]: "View reports",
    [Permission.PlatformAdmin]: "Platform admin"
};
const permissionGroups = [
    {
        key: "gym",
        label: "Gym",
        permissions: [Permission.GymRead, Permission.GymUpdate]
    },
    {
        key: "locations",
        label: "Locations",
        permissions: [
            Permission.LocationRead,
            Permission.LocationCreate,
            Permission.LocationUpdate,
            Permission.LocationArchive
        ]
    },
    {
        key: "staff",
        label: "Staff",
        permissions: [
            Permission.StaffRead,
            Permission.StaffInvite,
            Permission.StaffRoleAssign,
            Permission.StaffRemove
        ]
    },
    {
        key: "members",
        label: "Members",
        permissions: [
            Permission.MemberRead,
            Permission.MemberWrite,
            Permission.PlanRead,
            Permission.PlanWrite
        ]
    },
    {
        key: "classes",
        label: "Classes",
        permissions: [
            Permission.ClassRead,
            Permission.ClassWrite,
            Permission.BookingRead,
            Permission.BookingWrite
        ]
    },
    {
        key: "operations",
        label: "Operations",
        permissions: [
            Permission.AccessRead,
            Permission.AccessWrite,
            Permission.PaymentRead,
            Permission.PaymentWrite,
            Permission.ReportRead,
            Permission.PlatformAdmin
        ]
    }
];
//# sourceMappingURL=roles.js.map