import type {
  Permission,
  RoleName,
  StaffAuditAction,
  StaffInviteStatus,
  UserStatus
} from "@gym-platform/constants";

export interface StaffRoleOption {
  id: string;
  name: RoleName | string;
  label: string;
  permissions?: Permission[];
  isSystem?: boolean;
  disabled?: boolean;
}

export interface StaffInviteView {
  id: string;
  email: string;
  roleId: string;
  roleName?: RoleName | string;
  invitedByUserId: string;
  status: StaffInviteStatus;
  expiresAt: string;
  createdAt: string;
}

export interface StaffInviteSubmission {
  email: string;
  roleId: string;
  message?: string;
}

export interface StaffInviteEmailSendSubmission {
  inviteIds: string[];
  message?: string;
}

export interface StaffInviteAcceptanceSubmission {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface StaffCreateSubmission {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  message?: string;
}

export interface StaffEditSubmission {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
}

export interface StaffStatusChangeSubmission {
  userId: string;
  status: UserStatus;
  reason?: string;
}

export interface TrainerPublicVisibilitySubmission {
  userId: string;
  publicProfileVisible: boolean;
  profileSlug?: string;
}

export interface TrainerSpecialtiesSubmission {
  userId: string;
  specialties: string[];
}

export interface TrainerBioSubmission {
  userId: string;
  bio: string;
}

export interface TrainerProfileImageSubmission {
  userId: string;
  imageUrl?: string;
  altText?: string;
  removeImage: boolean;
}

export interface StaffShiftView {
  id: string;
  gymId: string;
  userId: string;
  locationId?: string;
  roleId: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export type StaffTaskPriority = "low" | "normal" | "high" | "urgent";
export type StaffTaskStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface StaffTaskView {
  id: string;
  gymId: string;
  title: string;
  description?: string;
  assignedToUserId: string;
  createdByUserId: string;
  priority: StaffTaskPriority;
  status: StaffTaskStatus;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffTaskAssignmentSubmission {
  title: string;
  assignedToUserId: string;
  priority: StaffTaskPriority;
  description?: string;
  dueAt?: string;
}

export interface StaffTaskCompletionSubmission {
  taskId: string;
  completedByUserId: string;
  completedAt: string;
  note?: string;
}

export interface StaffMemberView {
  membershipId: string;
  gymId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: RoleName | string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StaffPermissionChangeSubmission {
  userId: string;
  roleId: string;
}

export interface StaffAccessRemovalSubmission {
  userId: string;
  reason?: string;
}

export interface StaffAuditEntryView {
  id: string;
  gymId: string;
  actorUserId: string;
  targetUserId: string;
  action: StaffAuditAction;
  previousRoleId?: string;
  nextRoleId?: string;
  previousStatus?: UserStatus;
  nextStatus?: UserStatus;
  reason?: string;
  createdAt: string;
}

export interface CustomRoleSubmission {
  name: string;
  permissions: Permission[];
}
