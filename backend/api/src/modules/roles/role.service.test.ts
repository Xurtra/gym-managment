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
    const trainerRole = await services.roleService.getRoleByName(gymId, RoleName.Trainer);
    const memberRole = await services.roleService.getRoleByName(gymId, RoleName.Member);

    expect(ownerRole.permissions).toContain(Permission.StaffRoleAssign);
    expect(managerRole.permissions).toContain(Permission.StaffRemove);
    expect(trainerRole.permissions).toContain(Permission.StaffDirectoryView);
    expect(trainerRole.createsReservableResource).toBe(true);
    expect(managerRole.createsReservableResource).toBe(false);
    expect(memberRole.permissions).not.toContain(Permission.StaffRoleAssign);
    expect(memberRole.permissions).not.toContain(Permission.StaffDirectoryView);
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
    const trainerResource = (
      await services.reservationResourceService.listResources(gymId)
    ).find((resource) => resource.linkedStaffUserId === staff.user.id);
    const listedStaff = await services.roleService.listStaffAccess(gymId);
    const firstAuditEntries = await services.roleService.listStaffAuditLogs(gymId);
    const reassigned = await services.roleService.assignRole(
      gymId,
      staff.user.id,
      frontDeskRole.id,
      owner.user.id
    );
    const archivedTrainerResource = trainerResource
      ? await services.repositories.reservationResources.getResource(trainerResource.id)
      : undefined;
    await expect(
      services.roleService.removeStaffAccess(gymId, staff.user.id, staff.user.id)
    ).rejects.toThrow(/own access/i);
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
    expect(trainerResource?.locationId).toBeUndefined();
    expect(trainerResource?.resourceType).toBe("trainer");
    expect(trainerResource?.autoManaged).toBe(true);
    expect(reassigned.roleId).toBe(frontDeskRole.id);
    expect(archivedTrainerResource?.status).toBe("archived");
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
      ],
      createsReservableResource: true
    });
    const updated = await services.roleService.updateCustomRole(gymId, created.id, {
      name: "Operations Lead",
      permissions: [Permission.GymRead, Permission.MemberRead, Permission.ReportRead],
      createsReservableResource: false
    });
    const temporary = await services.roleService.createCustomRole(gymId, {
      name: "Temporary Role",
      permissions: [Permission.GymRead]
    });
    const deleted = await services.roleService.deleteCustomRole(gymId, temporary.id, owner.user.id);
    const roles = await services.roleService.listRoles(gymId);

    expect(created.isSystem).toBe(false);
    expect(created.createsReservableResource).toBe(true);
    expect(created.permissions).toEqual([
      Permission.GymRead,
      Permission.MemberRead,
      Permission.StaffRead
    ]);
    expect(updated.name).toBe("Operations Lead");
    expect(updated.createsReservableResource).toBe(false);
    expect(updated.permissions).toEqual([
      Permission.GymRead,
      Permission.MemberRead,
      Permission.ReportRead
    ]);
    expect(deleted.status).toBe("deleted");
    expect(roles.some((role) => role.name === "Operations Lead")).toBe(true);
    expect(roles.some((role) => role.name === "Temporary Role")).toBe(false);
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
    await expect(
      services.roleService.deleteCustomRole(gymId, managerRole.id, owner.user.id)
    ).rejects.toThrow(/system/i);
  });

  it("creates linked resources on invite acceptance and backfills enabled custom roles", async () => {
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

    const invite = await services.roleService.inviteStaff(gymId, owner.user.id, {
      email: "trainer.invite@example.com",
      roleId: trainerRole.id
    });
    const accepted = await services.authService.acceptStaffInvite({
      token: invite.inviteToken,
      firstName: "Tara",
      lastName: "Trainer",
      password: "Password123"
    });
    const invitedResource = (
      await services.reservationResourceService.listResources(gymId)
    ).find((resource) => resource.linkedStaffUserId === accepted.user.id);

    const specialtyRole = await services.roleService.createCustomRole(gymId, {
      name: "Recovery Specialist",
      permissions: [Permission.GymRead, Permission.StaffRead],
      createsReservableResource: false
    });
    const specialist = await services.authService.register({
      email: "specialist@example.com",
      password: "Password123",
      firstName: "Riley",
      lastName: "Recovery",
      timezone: "America/New_York",
      locale: "en-US"
    });
    await services.repositories.gymUsers.createGymUser({
      id: randomUUID(),
      gymId,
      userId: specialist.user.id,
      roleId: specialtyRole.id,
      status: UserStatus.Active,
      createdAt: fixedClock.now(),
      updatedAt: fixedClock.now()
    });
    await services.roleService.updateCustomRole(gymId, specialtyRole.id, {
      createsReservableResource: true
    });
    const backfilledResource = (
      await services.reservationResourceService.listResources(gymId)
    ).find((resource) => resource.linkedStaffUserId === specialist.user.id);

    expect(invitedResource?.resourceType).toBe("trainer");
    expect(invitedResource?.locationId).toBeUndefined();
    expect(invitedResource?.createdFromRoleId).toBe(trainerRole.id);
    expect(backfilledResource?.resourceType).toBe("recovery_specialist");
    expect(backfilledResource?.autoManaged).toBe(true);
  });

  it("keeps one active linked resource when switching between reservable roles", async () => {
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
      email: "coach@example.com",
      password: "Password123",
      firstName: "Casey",
      lastName: "Coach",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const gymId = owner.gym?.id ?? "";
    const memberRole = await services.roleService.getRoleByName(gymId, RoleName.Member);
    const trainerRole = await services.roleService.getRoleByName(gymId, RoleName.Trainer);
    const seniorCoachRole = await services.roleService.createCustomRole(gymId, {
      name: "Senior Coach",
      permissions: [Permission.GymRead, Permission.StaffRead],
      createsReservableResource: true
    });
    await services.repositories.gymUsers.createGymUser({
      id: randomUUID(),
      gymId,
      userId: staff.user.id,
      roleId: memberRole.id,
      status: UserStatus.Active,
      createdAt: fixedClock.now(),
      updatedAt: fixedClock.now()
    });

    await services.roleService.assignRole(gymId, staff.user.id, trainerRole.id, owner.user.id);
    const initialResource = (
      await services.reservationResourceService.listResources(gymId)
    ).find((resource) => resource.linkedStaffUserId === staff.user.id);
    await services.reservationResourceService.updateResource(gymId, initialResource?.id ?? "", {
      name: "Casey Coaching"
    });
    await services.roleService.assignRole(gymId, staff.user.id, seniorCoachRole.id, owner.user.id);
    const linkedResources = (
      await services.reservationResourceService.listResources(gymId)
    ).filter((resource) => resource.linkedStaffUserId === staff.user.id);

    expect(linkedResources).toHaveLength(1);
    expect(linkedResources[0]?.id).toBe(initialResource?.id);
    expect(linkedResources[0]?.name).toBe("Casey Coaching");
    expect(linkedResources[0]?.createdFromRoleId).toBe(seniorCoachRole.id);
    expect(linkedResources[0]?.status).toBe("active");
  });

  it("limits role and staff visibility to the actor's own branch", async () => {
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
    const frontDeskManager = await services.authService.register({
      email: "frontdesk.manager@example.com",
      password: "Password123",
      firstName: "Front",
      lastName: "Manager",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const frontDeskStaff = await services.authService.register({
      email: "frontdesk.staff@example.com",
      password: "Password123",
      firstName: "Front",
      lastName: "Staff",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const equipmentStaff = await services.authService.register({
      email: "equipment.staff@example.com",
      password: "Password123",
      firstName: "Equipment",
      lastName: "Staff",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const gymId = owner.gym?.id ?? "";
    const ownerRole = await services.roleService.getRoleByName(gymId, RoleName.Owner);
    const frontDeskManagerRole = await services.roleService.createCustomRole(
      gymId,
      {
        name: "Front Desk Manager",
        parentRoleId: ownerRole.id,
        permissions: [
          Permission.GymRead,
          Permission.StaffRead,
          Permission.StaffRoleAssign,
          Permission.StaffRemove
        ]
      },
      owner.user.id
    );
    const frontDeskStaffRole = await services.roleService.createCustomRole(
      gymId,
      {
        name: "Front Desk Staff",
        parentRoleId: frontDeskManagerRole.id,
        permissions: [Permission.GymRead]
      },
      owner.user.id
    );
    const equipmentManagerRole = await services.roleService.createCustomRole(
      gymId,
      {
        name: "Equipment Manager",
        parentRoleId: ownerRole.id,
        permissions: [Permission.GymRead, Permission.StaffRead]
      },
      owner.user.id
    );
    const equipmentStaffRole = await services.roleService.createCustomRole(
      gymId,
      {
        name: "Equipment Staff",
        parentRoleId: equipmentManagerRole.id,
        permissions: [Permission.GymRead]
      },
      owner.user.id
    );
    const branchMemberships: Array<[string, string]> = [
      [frontDeskManager.user.id, frontDeskManagerRole.id],
      [frontDeskStaff.user.id, frontDeskStaffRole.id],
      [equipmentStaff.user.id, equipmentStaffRole.id]
    ];
    for (const [userId, roleId] of branchMemberships) {
      await services.repositories.gymUsers.createGymUser({
        id: randomUUID(),
        gymId,
        userId,
        roleId,
        status: UserStatus.Active,
        createdAt: fixedClock.now(),
        updatedAt: fixedClock.now()
      });
    }

    const visibleRoles = await services.roleService.listRoles(gymId, frontDeskManager.user.id);
    const visibleStaff = await services.roleService.listStaffAccess(gymId, frontDeskManager.user.id);

    expect(visibleRoles.map((role) => role.name).sort()).toEqual([
      "Front Desk Manager",
      "Front Desk Staff"
    ]);
    expect(visibleRoles.find((role) => role.name === "Front Desk Manager")?.parentRoleId).toBeUndefined();
    expect(visibleStaff.map((staff) => staff.email).sort()).toEqual([
      "frontdesk.manager@example.com",
      "frontdesk.staff@example.com"
    ]);
    await expect(
      services.roleService.deleteCustomRole(gymId, frontDeskStaffRole.id, owner.user.id)
    ).rejects.toThrow(/assigned/i);
    await expect(
      services.roleService.deleteCustomRole(gymId, equipmentManagerRole.id, owner.user.id)
    ).rejects.toThrow(/child roles/i);
    await expect(
      services.roleService.removeStaffAccess(
        gymId,
        equipmentStaff.user.id,
        frontDeskManager.user.id
      )
    ).rejects.toThrow(/below their role branch/i);
    await expect(
      services.roleService.assignRole(
        gymId,
        equipmentStaff.user.id,
        frontDeskStaffRole.id,
        frontDeskManager.user.id
      )
    ).rejects.toThrow(/below their role branch/i);
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
