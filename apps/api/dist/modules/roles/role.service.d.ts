import { Permission, RoleName, StaffAuditAction, StaffInviteStatus, UserStatus } from "@gym-platform/constants";
import type { CustomRoleCreateInput, CustomRoleUpdateInput, StaffAccessRemoveInput, StaffInviteCreateInput } from "@gym-platform/validation";
import type { Role, StaffAuditLog, StaffInvite } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import { type Clock } from "../../shared/time.js";
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
export declare class RoleService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    createDefaultRoles(gymId: string): Promise<Role[]>;
    getRole(roleId: string): Promise<Role>;
    getRoleByName(gymId: string, name: RoleName): Promise<Role>;
    listRoles(gymId: string): Promise<Role[]>;
    createCustomRole(gymId: string, input: CustomRoleCreateInput): Promise<Role>;
    updateCustomRole(gymId: string, roleId: string, input: CustomRoleUpdateInput): Promise<Role>;
    listStaffAccess(gymId: string): Promise<PublicStaffAccess[]>;
    listStaffAuditLogs(gymId: string): Promise<PublicStaffAuditLog[]>;
    permissionsForUser(gymId: string, userId: string): Promise<Permission[]>;
    requirePermission(gymId: string, userId: string, permission: Permission): Promise<void>;
    inviteStaff(gymId: string, invitedByUserId: string, input: StaffInviteCreateInput): Promise<{
        invite: PublicStaffInvite;
        inviteToken: string;
    }>;
    listStaffInvites(gymId: string): Promise<PublicStaffInvite[]>;
    assignRole(gymId: string, targetUserId: string, roleId: string, actorUserId?: string): Promise<import("../../infrastructure/store/entities.js").GymUser>;
    removeStaffAccess(gymId: string, targetUserId: string, actorUserId: string, input?: StaffAccessRemoveInput): Promise<import("../../infrastructure/store/entities.js").GymUser>;
    private syncExpiredInvite;
    private createStaffAuditLog;
    private ensureCustomRoleNameAvailable;
}
export declare function toPublicStaffInvite(invite: StaffInvite): PublicStaffInvite;
export declare function toPublicStaffAuditLog(entry: StaffAuditLog): PublicStaffAuditLog;
//# sourceMappingURL=role.service.d.ts.map