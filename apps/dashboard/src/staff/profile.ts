import { Permission, RoleName, StaffAuditAction, UserStatus } from "@gym-platform/constants";
import { button, emptyState } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
import type { StaffAuditEntryView, StaffMemberView, StaffRoleOption } from "./types.js";

export interface StaffProfileDetail {
  key: string;
  label: string;
  value: string;
}

export interface StaffProfileAction {
  key: "edit_permissions" | "remove_access" | "back_to_staff";
  button: ButtonModel;
  href?: string;
}

export interface StaffProfileAuditItem extends StaffAuditEntryView {
  actionLabel: string;
  actorLabel: string;
  targetLabel: string;
  changeSummary: string;
}

export interface StaffProfilePage {
  screen: "staff_profile";
  staff: StaffMemberView;
  fullName: string;
  initials: string;
  roleLabel: string;
  statusLabel: string;
  locked: boolean;
  details: StaffProfileDetail[];
  actions: StaffProfileAction[];
  auditTrail: StaffProfileAuditItem[];
  auditEmpty?: EmptyStateModel;
}

export function buildStaffProfilePage(inputModel: {
  staff: StaffMemberView;
  roles: StaffRoleOption[];
  permissions: string[];
  auditEntries?: StaffAuditEntryView[];
  currentUserId?: string;
  ownerUserId?: string;
}): StaffProfilePage {
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

function buildProfileActions(inputModel: {
  staff: StaffMemberView;
  locked: boolean;
  canEditRoles: boolean;
  canRemoveStaff: boolean;
}): StaffProfileAction[] {
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

function buildAuditItem(
  entry: StaffAuditEntryView,
  staff: StaffMemberView,
  roles: StaffRoleOption[]
): StaffProfileAuditItem {
  return {
    ...entry,
    actionLabel: auditActionLabel(entry.action),
    actorLabel: entry.actorUserId,
    targetLabel: fullNameForStaff(staff),
    changeSummary: buildChangeSummary(entry, roles)
  };
}

function buildChangeSummary(entry: StaffAuditEntryView, roles: StaffRoleOption[]) {
  if (entry.action === StaffAuditAction.RoleChanged) {
    return `${roleLabel(entry.previousRoleId, roles)} to ${roleLabel(entry.nextRoleId, roles)}`;
  }
  if (entry.action === StaffAuditAction.AccessRemoved) {
    return entry.reason ? `Access removed: ${entry.reason}` : "Access removed";
  }
  return "Staff profile updated";
}

function roleLabel(roleId: string | undefined, roles: StaffRoleOption[]) {
  if (!roleId) {
    return "Unassigned";
  }
  return roles.find((role) => role.id === roleId)?.label ?? roleId;
}

function auditActionLabel(action: StaffAuditAction) {
  switch (action) {
    case StaffAuditAction.RoleChanged:
      return "Role changed";
    case StaffAuditAction.AccessRemoved:
      return "Access removed";
    default:
      return String(action);
  }
}

function isLockedStaff(staff: StaffMemberView, currentUserId?: string, ownerUserId?: string) {
  return (
    staff.status !== UserStatus.Active ||
    staff.roleName === RoleName.Owner ||
    staff.userId === currentUserId ||
    staff.userId === ownerUserId
  );
}

function fullNameForStaff(staff: StaffMemberView) {
  return `${staff.firstName} ${staff.lastName}`.trim() || staff.email;
}

function buildInitials(staff: StaffMemberView) {
  const initials = `${staff.firstName.trim().charAt(0)}${staff.lastName.trim().charAt(0)}`;
  return initials.toUpperCase() || staff.email.trim().charAt(0).toUpperCase();
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
