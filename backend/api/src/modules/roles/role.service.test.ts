import {
  Permission,
  RoleName,
  StaffAuditAction,
  StaffInviteStatus,
  UserStatus
} from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";

describe("RoleService", () => {
  it("creates default roles and enforces permission checks", async () => {
    const services = createServices(testConfig, fixedClock);
    const owner = await services.authService.register({
      email: "owner@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Owner",
      gymName: "Demo Strength Club",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const gymId = owner.gym?.id ?? "";

    const ownerRole = await services.roleService.getRoleByName(gymId, RoleName.Owner);
    const managerRole = await services.roleService.getRoleByName(gymId, RoleName.Manager);
    const memberRole = await services.roleService.getRoleByName(gymId, RoleName.Member);

    expect(ownerRole.permissions).toContain(Permission.StaffRoleAssign);
    expect(managerRole.permissions).toContain(Permission.StaffRemove);
    expect(memberRole.permissions).not.toContain(Permission.StaffRoleAssign);
    await expect(
      services.roleService.requirePermission(gymId, owner.user.id, Permission.StaffRoleAssign)
    ).resolves.toBeUndefined();
  });

  it("assigns roles only inside the same gym membership", async () => {
    const services = createServices(testConfig, fixedClock);
    const owner = await services.authService.register({
      email: "owner@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Owner",
      gymName: "Demo Strength Club",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const staff = await services.authService.register({
      email: "staff@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Staff",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const gymId = owner.gym?.id ?? "";
    const memberRole = await services.roleService.getRoleByName(gymId, RoleName.Member);
    const trainerRole = await services.roleService.getRoleByName(gymId, RoleName.Trainer);
    const frontDeskRole = await services.roleService.getRoleByName(gymId, RoleName.FrontDesk);
    const membershipId = randomUUID();
    await services.repositories.gymUsers.createGymUser({
      id: membershipId,
      gymId,
      userId: staff.user.id,
      roleId: memberRole.id,
      status: UserStatus.Active,
      createdAt: fixedClock.now(),
      updatedAt: fixedClock.now()
    });

    const assigned = await services.roleService.assignRole(
      gymId,
      staff.user.id,
      trainerRole.id,
      owner.user.id
    );
    const listedStaff = await services.roleService.listStaffAccess(gymId);
    const firstAuditEntries = await services.roleService.listStaffAuditLogs(gymId);
    const reassigned = await services.roleService.assignRole(
      gymId,
      staff.user.id,
      frontDeskRole.id,
      owner.user.id
    );
    const removed = await services.roleService.removeStaffAccess(
      gymId,
      staff.user.id,
      owner.user.id,
      { reason: "No longer on payroll" }
    );
    const auditEntries = await services.roleService.listStaffAuditLogs(gymId);
    const removalAudit = auditEntries.find(
      (entry) => entry.action === StaffAuditAction.AccessRemoved
    );

    expect(assigned.roleId).toBe(trainerRole.id);
    expect(reassigned.roleId).toBe(frontDeskRole.id);
    expect(removed.status).toBe(UserStatus.Disabled);
    expect(listedStaff.find((entry) => entry.userId === staff.user.id)?.roleName).toBe(
      RoleName.Trainer
    );
    expect(firstAuditEntries[0]?.action).toBe(StaffAuditAction.RoleChanged);
    expect(auditEntries).toHaveLength(3);
    expect(removalAudit?.reason).toBe("No longer on payroll");
    await expect(services.roleService.permissionsForUser(gymId, staff.user.id)).resolves.toEqual(
      []
    );
  });

  it("creates and edits custom roles with editable permissions", async () => {
    const services = createServices(testConfig, fixedClock);
    const owner = await services.authService.register({
      email: "owner@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Owner",
      gymName: "Demo Strength Club",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const gymId = owner.gym?.id ?? "";
    const managerRole = await services.roleService.getRoleByName(gymId, RoleName.Manager);

    const created = await services.roleService.createCustomRole(gymId, {
      name: "Assistant Manager",
      permissions: [
        Permission.GymRead,
        Permission.MemberRead,
        Permission.MemberRead,
        Permission.StaffRead
      ]
    });
    const updated = await services.roleService.updateCustomRole(gymId, created.id, {
      name: "Operations Lead",
      permissions: [Permission.GymRead, Permission.MemberRead, Permission.ReportRead]
    });
    const roles = await services.roleService.listRoles(gymId);

    expect(created.isSystem).toBe(false);
    expect(created.permissions).toEqual([
      Permission.GymRead,
      Permission.MemberRead,
      Permission.StaffRead
    ]);
    expect(updated.name).toBe("Operations Lead");
    expect(updated.permissions).toEqual([
      Permission.GymRead,
      Permission.MemberRead,
      Permission.ReportRead
    ]);
    expect(roles.some((role) => role.name === "Operations Lead")).toBe(true);
    await expect(
      services.roleService.createCustomRole(gymId, {
        name: "Front Desk",
        permissions: [Permission.GymRead]
      })
    ).rejects.toThrow(/reserved/i);
    await expect(
      services.roleService.createCustomRole(gymId, {
        name: "Platform Helper",
        permissions: [Permission.PlatformAdmin]
      })
    ).rejects.toThrow(/platform/i);
    await expect(
      services.roleService.updateCustomRole(gymId, managerRole.id, {
        name: "Manager Plus"
      })
    ).rejects.toThrow(/system/i);
  });

  it("creates staff invites with selected roles and rejects duplicates", async () => {
    const services = createServices(testConfig, fixedClock);
    const owner = await services.authService.register({
      email: "owner@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Owner",
      gymName: "Demo Strength Club",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const gymId = owner.gym?.id ?? "";
    const trainerRole = await services.roleService.getRoleByName(gymId, RoleName.Trainer);
    const memberRole = await services.roleService.getRoleByName(gymId, RoleName.Member);

    const created = await services.roleService.inviteStaff(gymId, owner.user.id, {
      email: "trainer@example.com",
      roleId: trainerRole.id
    });
    const invites = await services.roleService.listStaffInvites(gymId);

    expect(created.invite.email).toBe("trainer@example.com");
    expect(created.invite.roleId).toBe(trainerRole.id);
    expect(created.invite.status).toBe(StaffInviteStatus.Pending);
    expect(created.inviteToken).toHaveLength(43);
    expect(invites).toHaveLength(1);
    expect(invites[0]?.status).toBe(StaffInviteStatus.Pending);
    await expect(
      services.roleService.inviteStaff(gymId, owner.user.id, {
        email: "trainer@example.com",
        roleId: trainerRole.id
      })
    ).rejects.toThrow(/pending/i);
    await expect(
      services.roleService.inviteStaff(gymId, owner.user.id, {
        email: "member@example.com",
        roleId: memberRole.id
      })
    ).rejects.toThrow(/staff/i);
  });

  it("accepts a staff invite and creates gym access", async () => {
    const services = createServices(testConfig, fixedClock);
    const owner = await services.authService.register({
      email: "owner@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Owner",
      gymName: "Demo Strength Club",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const gymId = owner.gym?.id ?? "";
    const frontDeskRole = await services.roleService.getRoleByName(gymId, RoleName.FrontDesk);
    const invite = await services.roleService.inviteStaff(gymId, owner.user.id, {
      email: "frontdesk@example.com",
      roleId: frontDeskRole.id
    });

    const accepted = await services.authService.acceptStaffInvite({
      token: invite.inviteToken,
      firstName: "Demo",
      lastName: "Frontdesk",
      password: "Password123"
    });
    const permissions = await services.roleService.permissionsForUser(gymId, accepted.user.id);

    expect(accepted.user.email).toBe("frontdesk@example.com");
    expect(accepted.gym.id).toBe(gymId);
    expect(accepted.membership.roleId).toBe(frontDeskRole.id);
    expect(accepted.invite.status).toBe(StaffInviteStatus.Accepted);
    expect(accepted.accessToken).toBeTruthy();
    expect(permissions).toEqual(frontDeskRole.permissions);
    await expect(
      services.authService.acceptStaffInvite({
        token: invite.inviteToken,
        firstName: "Demo",
        lastName: "Frontdesk",
        password: "Password123"
      })
    ).rejects.toThrow(/pending/i);
  });
});
