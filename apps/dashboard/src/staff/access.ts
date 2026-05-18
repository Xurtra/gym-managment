import { Permission, RoleName, UserStatus } from "@gym-platform/constants";
import { button, input, modal, table } from "@gym-platform/ui";
import type { ButtonModel, InputModel, ModalModel, TableModel } from "@gym-platform/ui";
import type {
  StaffAccessRemovalSubmission,
  StaffAuditEntryView,
  StaffMemberView,
  StaffPermissionChangeSubmission,
  StaffRoleOption
} from "./types.js";

export interface StaffPermissionRow extends StaffMemberView {
  fullName: string;
  locked: boolean;
  canEdit: boolean;
  canRemove: boolean;
  roleOptions: Array<StaffRoleOption & { selected: boolean; disabled: boolean }>;
}

export interface StaffPermissionsScreen {
  screen: "staff_permissions";
  canEditRoles: boolean;
  canRemoveStaff: boolean;
  roleOptions: StaffRoleOption[];
  rows: StaffPermissionRow[];
  selectedUserId?: string;
  selectedRoleId?: string;
  canSubmitRoleChange: boolean;
  reasonField: InputModel;
  saveAction: ButtonModel;
  removeAction: ButtonModel;
  removalModal: ModalModel;
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
  const rows = inputModel.staff.map((staff) => {
    const rowSelectedRoleId =
      staff.userId === inputModel.selectedUserId ? selectedRoleId : staff.roleId;
    const rowOptions: Parameters<typeof buildPermissionRow>[1] = {
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
    currentUserId?: string;
    ownerUserId?: string;
    selectedRoleId?: string;
  }
): StaffPermissionRow {
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
