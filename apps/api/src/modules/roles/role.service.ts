import {
  DEFAULT_ROLE_PERMISSIONS,
  Permission,
  RoleName,
  StaffAuditAction,
  StaffInviteStatus,
  UserStatus
} from "@gym-platform/constants";
import type {
  CustomRoleCreateInput,
  CustomRoleUpdateInput,
  StaffAccessRemoveInput,
  StaffInviteCreateInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { generateOpaqueToken, hashToken } from "../../infrastructure/security/tokens.js";
import type { Role, StaffAuditLog, StaffInvite } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import { addDays, type Clock } from "../../shared/time.js";
import { conflict, forbidden, notFound } from "../../http/errors.js";

export interface PublicStaffInvite {
  id: string;
  gymId: string;
  email: string;
  roleId: string;
  invitedByUserId: string;
  status: StaffInviteStatus;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStaffAccess {
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

export interface PublicStaffAuditLog {
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

export class RoleService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async createDefaultRoles(gymId: string) {
    const existing = await this.repositories.roles.listRolesForGym(gymId);
    if (existing.length > 0) {
      return existing;
    }
    const now = this.clock.now();
    const roles = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([name, permissions]) => ({
      id: randomUUID(),
      gymId,
      name: name as RoleName,
      permissions,
      isSystem: true,
      createdAt: now,
      updatedAt: now
    }));
    return this.repositories.roles.createRoles(roles);
  }

  async getRole(roleId: string) {
    const role = await this.repositories.roles.getRole(roleId);
    if (!role) {
      throw notFound("Role was not found.");
    }
    return role;
  }

  async getRoleByName(gymId: string, name: RoleName) {
    const role = (await this.repositories.roles.listRolesForGym(gymId)).find(
      (candidate) => candidate.name === name
    );
    if (!role) {
      throw notFound(`Default role ${name} was not found for this gym.`);
    }
    return role;
  }

  async listRoles(gymId: string) {
    return this.repositories.roles.listRolesForGym(gymId);
  }

  async createCustomRole(gymId: string, input: CustomRoleCreateInput) {
    await this.ensureCustomRoleNameAvailable(gymId, input.name);
    const now = this.clock.now();
    const role: Role = {
      id: randomUUID(),
      gymId,
      name: input.name.trim(),
      permissions: customRolePermissions(input.permissions),
      isSystem: false,
      createdAt: now,
      updatedAt: now
    };
    return this.repositories.roles.createRole(role);
  }

  async updateCustomRole(gymId: string, roleId: string, input: CustomRoleUpdateInput) {
    const role = await this.getRole(roleId);
    if (role.gymId !== gymId) {
      throw conflict("Role does not belong to this gym.", "role_gym_mismatch");
    }
    if (role.isSystem) {
      throw conflict("System roles cannot be edited.", "system_role_locked");
    }
    const updated: Role = {
      ...role,
      updatedAt: this.clock.now()
    };
    if (input.name) {
      await this.ensureCustomRoleNameAvailable(gymId, input.name, roleId);
      updated.name = input.name.trim();
    }
    if (input.permissions) {
      updated.permissions = customRolePermissions(input.permissions);
    }
    return this.repositories.roles.updateRole(updated);
  }

  async listStaffAccess(gymId: string): Promise<PublicStaffAccess[]> {
    const memberships = await this.repositories.gymUsers.listGymUsersForGym(gymId);
    const staff = await Promise.all(
      memberships.map(async (membership) => {
        const [user, role] = await Promise.all([
          this.repositories.users.getUser(membership.userId),
          this.repositories.roles.getRole(membership.roleId)
        ]);
        if (!user || !role || role.name === RoleName.Member) {
          return undefined;
        }
        return {
          membership,
          user,
          role
        };
      })
    );
    return staff.flatMap((entry) =>
      entry
        ? [
            {
              membershipId: entry.membership.id,
              gymId: entry.membership.gymId,
              userId: entry.user.id,
              email: entry.user.email,
              firstName: entry.user.firstName,
              lastName: entry.user.lastName,
              roleId: entry.role.id,
              roleName: entry.role.name,
              status: entry.membership.status,
              createdAt: entry.membership.createdAt.toISOString(),
              updatedAt: entry.membership.updatedAt.toISOString()
            }
          ]
        : []
    );
  }

  async listStaffAuditLogs(gymId: string) {
    return (await this.repositories.staffAuditLogs.listStaffAuditLogsForGym(gymId)).map(
      toPublicStaffAuditLog
    );
  }

  async permissionsForUser(gymId: string, userId: string) {
    const membership = await this.repositories.gymUsers.findGymUser(gymId, userId);
    if (!membership || membership.status !== UserStatus.Active) {
      return [];
    }
    const role = await this.repositories.roles.getRole(membership.roleId);
    return role?.permissions ?? [];
  }

  async requirePermission(gymId: string, userId: string, permission: Permission) {
    const permissions = await this.permissionsForUser(gymId, userId);
    if (!permissions.includes(permission)) {
      throw forbidden();
    }
  }

  async inviteStaff(gymId: string, invitedByUserId: string, input: StaffInviteCreateInput) {
    const role = await this.getRole(input.roleId);
    if (role.gymId !== gymId) {
      throw conflict("Role does not belong to this gym.", "role_gym_mismatch");
    }
    if (role.name === RoleName.Member || role.name === RoleName.Owner) {
      throw conflict(
        "Only assignable staff roles can be used for staff invites.",
        "staff_role_required"
      );
    }
    const existingUser = await this.repositories.users.findUserByEmail(input.email);
    if (existingUser && (await this.repositories.gymUsers.findGymUser(gymId, existingUser.id))) {
      throw conflict("This user already has access to the gym.", "staff_access_exists");
    }
    const existingInvite = await this.repositories.staffInvites.findPendingStaffInvite(
      gymId,
      input.email
    );
    if (existingInvite) {
      const synced = await this.syncExpiredInvite(existingInvite);
      if (synced.status === StaffInviteStatus.Pending) {
        throw conflict(
          "A pending staff invite already exists for this email.",
          "staff_invite_exists"
        );
      }
    }

    const now = this.clock.now();
    const inviteToken = generateOpaqueToken();
    const invite: StaffInvite = {
      id: randomUUID(),
      gymId,
      email: input.email,
      roleId: role.id,
      invitedByUserId,
      tokenHash: hashToken(inviteToken),
      status: StaffInviteStatus.Pending,
      expiresAt: addDays(now, 7),
      createdAt: now,
      updatedAt: now
    };
    const created = await this.repositories.staffInvites.createStaffInvite(invite);
    return {
      invite: toPublicStaffInvite(created),
      inviteToken
    };
  }

  async listStaffInvites(gymId: string) {
    const invites = await Promise.all(
      (await this.repositories.staffInvites.listStaffInvitesForGym(gymId)).map((invite) =>
        this.syncExpiredInvite(invite)
      )
    );
    return invites.map(toPublicStaffInvite);
  }

  async assignRole(gymId: string, targetUserId: string, roleId: string, actorUserId?: string) {
    return this.repositories.transaction(async (repositories) => {
      const role = await repositories.roles.getRole(roleId);
      if (!role) {
        throw notFound("Role was not found.");
      }
      if (role.gymId !== gymId) {
        throw conflict("Role does not belong to this gym.", "role_gym_mismatch");
      }
      if (role.name === RoleName.Member || role.name === RoleName.Owner) {
        throw conflict(
          "This role cannot be assigned through the staff editor.",
          "staff_role_locked"
        );
      }
      const gym = await repositories.gyms.getGym(gymId);
      if (!gym) {
        throw notFound("Gym was not found.");
      }
      if (gym.ownerUserId === targetUserId) {
        throw conflict("The gym owner role cannot be changed.", "owner_role_locked");
      }
      if (actorUserId === targetUserId) {
        throw conflict("Staff cannot change their own role.", "staff_self_role_change");
      }
      const membership = await repositories.gymUsers.findGymUser(gymId, targetUserId);
      if (!membership) {
        throw notFound("User is not a member of this gym.");
      }
      if (membership.status !== UserStatus.Active) {
        throw conflict("Staff access is not active.", "staff_access_inactive");
      }
      const updated = { ...membership, roleId, updatedAt: this.clock.now() };
      const saved = await repositories.gymUsers.updateGymUser(updated);
      if (actorUserId && membership.roleId !== roleId) {
        await repositories.staffAuditLogs.createStaffAuditLog(
          this.createStaffAuditLog({
            gymId,
            actorUserId,
            targetUserId,
            action: StaffAuditAction.RoleChanged,
            previousRoleId: membership.roleId,
            nextRoleId: roleId
          })
        );
      }
      return saved;
    });
  }

  async removeStaffAccess(
    gymId: string,
    targetUserId: string,
    actorUserId: string,
    input: StaffAccessRemoveInput = {}
  ) {
    return this.repositories.transaction(async (repositories) => {
      const gym = await repositories.gyms.getGym(gymId);
      if (!gym) {
        throw notFound("Gym was not found.");
      }
      if (gym.ownerUserId === targetUserId) {
        throw conflict("The gym owner cannot be removed from staff access.", "owner_access_locked");
      }
      if (actorUserId === targetUserId) {
        throw conflict("Staff cannot remove their own access.", "staff_self_remove");
      }
      const membership = await repositories.gymUsers.findGymUser(gymId, targetUserId);
      if (!membership) {
        throw notFound("User is not a member of this gym.");
      }
      if (membership.status === UserStatus.Disabled) {
        throw conflict("Staff access is already removed.", "staff_access_removed");
      }
      const role = await repositories.roles.getRole(membership.roleId);
      if (!role || role.name === RoleName.Member) {
        throw conflict("Only staff access can be removed from this flow.", "staff_access_required");
      }
      const updated = {
        ...membership,
        status: UserStatus.Disabled,
        updatedAt: this.clock.now()
      };
      const saved = await repositories.gymUsers.updateGymUser(updated);
      const reason = input.reason?.trim();
      const auditInput: Omit<StaffAuditLog, "id" | "createdAt"> = {
        gymId,
        actorUserId,
        targetUserId,
        action: StaffAuditAction.AccessRemoved,
        previousRoleId: membership.roleId,
        nextRoleId: membership.roleId,
        previousStatus: membership.status,
        nextStatus: UserStatus.Disabled
      };
      if (reason) {
        auditInput.reason = reason;
      }
      await repositories.staffAuditLogs.createStaffAuditLog(this.createStaffAuditLog(auditInput));
      return saved;
    });
  }

  private async syncExpiredInvite(invite: StaffInvite) {
    if (invite.status !== StaffInviteStatus.Pending || invite.expiresAt > this.clock.now()) {
      return invite;
    }
    return this.repositories.staffInvites.updateStaffInvite({
      ...invite,
      status: StaffInviteStatus.Expired,
      updatedAt: this.clock.now()
    });
  }

  private createStaffAuditLog(input: Omit<StaffAuditLog, "id" | "createdAt">): StaffAuditLog {
    return {
      id: randomUUID(),
      createdAt: this.clock.now(),
      ...input
    };
  }

  private async ensureCustomRoleNameAvailable(
    gymId: string,
    name: string,
    existingRoleId?: string
  ) {
    const canonical = canonicalRoleName(name);
    if (Object.values(RoleName).includes(canonical as RoleName)) {
      throw conflict("Default role names are reserved.", "role_name_reserved");
    }
    const existing = (await this.repositories.roles.listRolesForGym(gymId)).find(
      (role) => canonicalRoleName(role.name) === canonical && role.id !== existingRoleId
    );
    if (existing) {
      throw conflict("A role with this name already exists.", "role_name_exists");
    }
  }
}

export function toPublicStaffInvite(invite: StaffInvite): PublicStaffInvite {
  const publicInvite: PublicStaffInvite = {
    id: invite.id,
    gymId: invite.gymId,
    email: invite.email,
    roleId: invite.roleId,
    invitedByUserId: invite.invitedByUserId,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
    updatedAt: invite.updatedAt.toISOString()
  };
  if (invite.acceptedAt) {
    publicInvite.acceptedAt = invite.acceptedAt.toISOString();
  }
  if (invite.revokedAt) {
    publicInvite.revokedAt = invite.revokedAt.toISOString();
  }
  return publicInvite;
}

export function toPublicStaffAuditLog(entry: StaffAuditLog): PublicStaffAuditLog {
  const publicEntry: PublicStaffAuditLog = {
    id: entry.id,
    gymId: entry.gymId,
    actorUserId: entry.actorUserId,
    targetUserId: entry.targetUserId,
    action: entry.action,
    createdAt: entry.createdAt.toISOString()
  };
  if (entry.previousRoleId) {
    publicEntry.previousRoleId = entry.previousRoleId;
  }
  if (entry.nextRoleId) {
    publicEntry.nextRoleId = entry.nextRoleId;
  }
  if (entry.previousStatus) {
    publicEntry.previousStatus = entry.previousStatus;
  }
  if (entry.nextStatus) {
    publicEntry.nextStatus = entry.nextStatus;
  }
  if (entry.reason) {
    publicEntry.reason = entry.reason;
  }
  return publicEntry;
}

function customRolePermissions(permissions: Permission[]) {
  const unique = [...new Set(permissions)];
  if (unique.includes(Permission.PlatformAdmin)) {
    throw conflict(
      "Custom gym roles cannot include platform admin permission.",
      "platform_permission_locked"
    );
  }
  return unique;
}

function canonicalRoleName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}
