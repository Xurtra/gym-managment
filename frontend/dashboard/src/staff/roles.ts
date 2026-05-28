import { Permission, RoleName } from "@gym-platform/constants";
import type { Permission as PermissionValue } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import type { CustomRoleSubmission, StaffRoleOption } from "./types.js";

export interface PermissionToggle {
  permission: PermissionValue;
  label: string;
  group: string;
  checked: boolean;
  disabled: boolean;
}

export interface PermissionGroup {
  key: string;
  label: string;
  selectedCount: number;
  availableCount: number;
  summaryLabel: string;
  toggles: PermissionToggle[];
}

export interface CustomRoleScreen {
  screen: "custom_role_create" | "custom_role_edit";
  roleId?: string;
  roleLabel?: string;
  nameField: InputModel;
  permissionGroups: PermissionGroup[];
  selectedPermissions: PermissionValue[];
  selectedPermissionCount: number;
  availablePermissionCount: number;
  disabledPermissionCount: number;
  createsReservableResource: boolean;
  summaryLabel: string;
  lockedReason?: string;
  canSubmit: boolean;
  action: ButtonModel;
}

export function buildCustomRoleCreateScreen(
  inputModel: {
    name?: string;
    selectedPermissions?: PermissionValue[];
    createsReservableResource?: boolean;
  } = {}
): CustomRoleScreen {
  return buildCustomRoleScreen({
    screen: "custom_role_create",
    actionLabel: "Create role",
    name: inputModel.name,
    selectedPermissions: inputModel.selectedPermissions,
    createsReservableResource: inputModel.createsReservableResource
  });
}

export function buildCustomRoleEditScreen(inputModel: {
  role: StaffRoleOption;
  name?: string;
  selectedPermissions?: PermissionValue[];
}): CustomRoleScreen {
  return buildCustomRoleScreen({
    screen: "custom_role_edit",
    actionLabel: "Save role",
    roleId: inputModel.role.id,
    roleLabel: inputModel.role.label,
    name: inputModel.name ?? inputModel.role.label,
    selectedPermissions: inputModel.selectedPermissions ?? inputModel.role.permissions ?? [],
    createsReservableResource: inputModel.role.createsReservableResource ?? false,
    locked: inputModel.role.isSystem === true || inputModel.role.name === RoleName.Owner
  });
}

export function createCustomRoleSubmission(inputModel: {
  name: string;
  permissions: PermissionValue[];
  createsReservableResource?: boolean;
}): CustomRoleSubmission {
  return {
    name: inputModel.name.trim(),
    permissions: editablePermissions(inputModel.permissions),
    createsReservableResource: inputModel.createsReservableResource ?? false
  };
}

function buildCustomRoleScreen(inputModel: {
  screen: CustomRoleScreen["screen"];
  actionLabel: string;
  roleId?: string | undefined;
  roleLabel?: string | undefined;
  name?: string | undefined;
  selectedPermissions?: PermissionValue[] | undefined;
  createsReservableResource?: boolean | undefined;
  locked?: boolean | undefined;
}): CustomRoleScreen {
  const name = inputModel.name?.trim() ?? "";
  const selectedPermissions = editablePermissions(inputModel.selectedPermissions ?? []);
  const locked = inputModel.locked ?? false;
  const permissionGroups = buildPermissionGroups(selectedPermissions, locked);
  const selectedPermissionCount = selectedPermissions.length;
  const availablePermissionCount = permissionGroups.reduce(
    (count, group) => count + group.availableCount,
    0
  );
  const disabledPermissionCount = permissionGroups.reduce(
    (count, group) => count + group.toggles.filter((toggle) => toggle.disabled).length,
    0
  );
  const nameError = locked
    ? "System roles cannot be edited."
    : name.length === 0
      ? "Role name is required."
      : name.length < 2
        ? "Role name must be at least 2 characters."
        : undefined;
  const canSubmit = Boolean(!locked && name.length >= 2 && selectedPermissions.length > 0);
  const screen: CustomRoleScreen = {
    screen: inputModel.screen,
    nameField: input({
      name: "name",
      label: "Role name",
      value: name,
      type: "text",
      required: true,
      ...(nameError ? { error: nameError } : {})
    }),
    permissionGroups,
    selectedPermissions,
    selectedPermissionCount,
    availablePermissionCount,
    disabledPermissionCount,
    createsReservableResource: inputModel.createsReservableResource ?? false,
    summaryLabel:
      selectedPermissionCount === 0
        ? "No permissions selected"
        : `${selectedPermissionCount} permission${selectedPermissionCount === 1 ? "" : "s"} selected`,
    ...(locked ? { lockedReason: "System roles cannot be edited." } : {}),
    canSubmit,
    action: button({ label: inputModel.actionLabel, disabled: !canSubmit })
  };
  if (inputModel.roleId) {
    screen.roleId = inputModel.roleId;
  }
  if (inputModel.roleLabel) {
    screen.roleLabel = inputModel.roleLabel;
  }
  return screen;
}

function buildPermissionGroups(selectedPermissions: PermissionValue[], locked: boolean) {
  return permissionGroups.map((group) => ({
    ...group,
    selectedCount: group.permissions.filter((permission) => selectedPermissions.includes(permission)).length,
    availableCount: group.permissions.filter((permission) => permission !== Permission.PlatformAdmin).length,
    summaryLabel: `${group.permissions.filter((permission) => selectedPermissions.includes(permission)).length} of ${
      group.permissions.filter((permission) => permission !== Permission.PlatformAdmin).length
    } selected`,
    toggles: group.permissions.map((permission) => ({
      permission,
      label: permissionLabels[permission],
      group: group.key,
      checked: selectedPermissions.includes(permission),
      disabled: locked || permission === Permission.PlatformAdmin
    }))
  }));
}

function editablePermissions(permissions: PermissionValue[]) {
  return [...new Set(permissions)].filter((permission) => permission !== Permission.PlatformAdmin);
}

const permissionLabels: Record<PermissionValue, string> = {
  [Permission.GymRead]: "View gym",
  [Permission.GymUpdate]: "Update gym",
  [Permission.LocationRead]: "View locations",
  [Permission.LocationCreate]: "Create locations",
  [Permission.LocationUpdate]: "Update locations",
  [Permission.LocationArchive]: "Archive locations",
  [Permission.StaffDirectoryView]: "View employee directory",
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
  [Permission.ScheduleRead]: "View scheduler",
  [Permission.ScheduleCreate]: "Create schedules",
  [Permission.SchedulePublish]: "Publish schedules",
  [Permission.ScheduleRequestsManage]: "Manage schedule requests",
  [Permission.ScheduleAutoResolve]: "Auto-resolve requests",
  [Permission.PlatformAdmin]: "Platform admin"
};

const permissionGroups: Array<{
  key: string;
  label: string;
  permissions: PermissionValue[];
}> = [
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
      Permission.StaffDirectoryView,
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
    key: "scheduler",
    label: "Scheduler",
    permissions: [
      Permission.ScheduleRead,
      Permission.ScheduleCreate,
      Permission.SchedulePublish,
      Permission.ScheduleRequestsManage,
      Permission.ScheduleAutoResolve
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
