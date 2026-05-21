import { Permission, RoleName, UserStatus } from "@gym-platform/constants";
import { button, emptyState, input, modal, table } from "@gym-platform/ui";
import type {
  ButtonModel,
  EmptyStateModel,
  InputModel,
  ModalModel,
  TableModel
} from "@gym-platform/ui";
import type {
  StaffAccessRemovalSubmission,
  StaffAuditEntryView,
  StaffMemberView,
  StaffPermissionChangeSubmission,
  StaffRoleOption
} from "./types.js";

export interface StaffPermissionRow extends StaffMemberView {
  fullName: string;
  selected: boolean;
  locked: boolean;
  lockedReason?: string;
  canEdit: boolean;
  canRemove: boolean;
  roleLabel: string;
  statusLabel: string;
  roleOptions: Array<StaffRoleOption & { selected: boolean; disabled: boolean }>;
}

export interface StaffPermissionsScreen {
  screen: "staff_permissions";
  canEditRoles: boolean;
  canRemoveStaff: boolean;
  roleOptions: StaffRoleOption[];
  rows: StaffPermissionRow[];
  totalStaffCount: number;
  editableStaffCount: number;
  removableStaffCount: number;
  auditEntryCount: number;
  summaryLabel: string;
  selectedUserId?: string;
  selectedStaffName?: string;
  selectedRoleId?: string;
  canSubmitRoleChange: boolean;
  reasonField: InputModel;
  saveAction: ButtonModel;
  removeAction: ButtonModel;
  removalModal: ModalModel;
  empty?: EmptyStateModel;
  table: TableModel<StaffPermissionRow>;
  auditTrail: StaffAuditEntryView[];
}

export function buildStaffPermissionsScreen(inputModel: {
  staff: StaffMemberView[];
  roles: StaffRoleOption[];
  permissions: string[];
  auditEntries?: StaffAuditEntryView[];
  currentUserId?: string;
  ownerUserId?: string;
  selectedUserId?: string;
  selectedRoleId?: string;
  removalUserId?: string;
  removalReason?: string;
}): StaffPermissionsScreen {
  const canEditRoles = inputModel.permissions.includes(Permission.StaffRoleAssign);
  const canRemoveStaff = inputModel.permissions.includes(Permission.StaffRemove);
  const roleOptions = editableStaffRoles(inputModel.roles);
  const selectedStaff = inputModel.staff.find(
    (staff) => staff.userId === inputModel.selectedUserId
  );
  const selectedStaffName = selectedStaff
    ? `${selectedStaff.firstName} ${selectedStaff.lastName}`.trim()
    : undefined;
  const selectedRoleId = inputModel.selectedRoleId ?? selectedStaff?.roleId;
  const selectedRole = roleOptions.find((role) => role.id === selectedRoleId);
  const selectedLocked = selectedStaff
    ? isLockedStaff(selectedStaff, inputModel.currentUserId, inputModel.ownerUserId)
    : true;
  const canSubmitRoleChange = Boolean(
    canEditRoles &&
      selectedStaff &&
      selectedRole &&
      !selectedLocked &&
      selectedRole.id !== selectedStaff.roleId
  );
  const reason = inputModel.removalReason?.trim() ?? "";
  const removalStaff = inputModel.staff.find((staff) => staff.userId === inputModel.removalUserId);
  const canConfirmRemoval = Boolean(
    canRemoveStaff &&
      removalStaff &&
      !isLockedStaff(removalStaff, inputModel.currentUserId, inputModel.ownerUserId)
  );
  const rows = inputModel.staff
    .map((staff) => {
      const rowSelectedRoleId =
        staff.userId === inputModel.selectedUserId ? selectedRoleId : staff.roleId;
      const rowOptions: Parameters<typeof buildPermissionRow>[1] = {
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
  const empty =
    rows.length === 0
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
    summaryLabel:
      rows.length === 0
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

export function createStaffPermissionChangeSubmission(inputModel: {
  userId: string;
  roleId: string;
}): StaffPermissionChangeSubmission {
  return {
    userId: inputModel.userId,
    roleId: inputModel.roleId
  };
}

export function createStaffAccessRemovalSubmission(inputModel: {
  userId: string;
  reason?: string;
}): StaffAccessRemovalSubmission {
  const submission: StaffAccessRemovalSubmission = {
    userId: inputModel.userId
  };
  const reason = inputModel.reason?.trim();
  if (reason) {
    submission.reason = reason;
  }
  return submission;
}

function buildPermissionRow(
  staff: StaffMemberView,
  options: {
    roleOptions: StaffRoleOption[];
    canEditRoles: boolean;
    canRemoveStaff: boolean;
    selected: boolean;
    currentUserId?: string;
    ownerUserId?: string;
    selectedRoleId?: string;
  }
): StaffPermissionRow {
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

function editableStaffRoles(roles: StaffRoleOption[]) {
  return roles
    .filter((role) => role.name !== RoleName.Member && role.name !== RoleName.Owner)
    .map((role) => ({
      ...role,
      disabled: role.disabled ?? false
    }));
}

function isLockedStaff(staff: StaffMemberView, currentUserId?: string, ownerUserId?: string) {
  return (
    staff.status !== UserStatus.Active ||
    staff.roleName === RoleName.Owner ||
    staff.userId === currentUserId ||
    staff.userId === ownerUserId
  );
}

function lockedReason(staff: StaffMemberView, currentUserId?: string, ownerUserId?: string) {
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

function statusLabel(status: UserStatus) {
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
