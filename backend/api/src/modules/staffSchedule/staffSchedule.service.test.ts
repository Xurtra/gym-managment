import { RoleName, UserStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";

describe("StaffScheduleService", () => {
  it("creates staff shifts and rejects overlaps or non-staff members", async () => {
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
      email: "trainer@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Trainer",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const member = await services.authService.register({
      email: "member@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Member",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const gymId = owner.gym?.id ?? "";
    const trainerRole = await services.roleService.getRoleByName(gymId, RoleName.Trainer);
    const memberRole = await services.roleService.getRoleByName(gymId, RoleName.Member);
    await services.repositories.gymUsers.createGymUser({
      id: randomUUID(),
      gymId,
      userId: staff.user.id,
      roleId: trainerRole.id,
      status: UserStatus.Active,
      createdAt: fixedClock.now(),
      updatedAt: fixedClock.now()
    });
    await services.repositories.gymUsers.createGymUser({
      id: randomUUID(),
      gymId,
      userId: member.user.id,
      roleId: memberRole.id,
      status: UserStatus.Active,
      createdAt: fixedClock.now(),
      updatedAt: fixedClock.now()
    });
    const location = await services.locationService.create(gymId, {
      name: "Main Floor",
      address: {
        line1: "100 Fitness Ave",
        city: "New York",
        region: "NY",
        postalCode: "10001",
        country: "US"
      },
      timezone: "America/New_York",
      operatingHours: {}
    });

    const shift = await services.staffScheduleService.createShift(gymId, owner.user.id, {
      userId: staff.user.id,
      locationId: location.id,
      startsAt: "2026-05-18T13:00:00.000Z",
      endsAt: "2026-05-18T21:00:00.000Z",
      notes: "Front desk coverage"
    });

    expect(shift.userId).toBe(staff.user.id);
    expect(shift.locationId).toBe(location.id);
    expect(shift.roleId).toBe(trainerRole.id);
    expect(shift.createdByUserId).toBe(owner.user.id);
    expect(shift.notes).toBe("Front desk coverage");
    await expect(
      services.staffScheduleService.createShift(gymId, owner.user.id, {
        userId: staff.user.id,
        startsAt: "2026-05-18T20:00:00.000Z",
        endsAt: "2026-05-19T01:00:00.000Z"
      })
    ).rejects.toThrow(/already has a shift/i);
    await expect(
      services.staffScheduleService.createShift(gymId, owner.user.id, {
        userId: member.user.id,
        startsAt: "2026-05-19T13:00:00.000Z",
        endsAt: "2026-05-19T21:00:00.000Z"
      })
    ).rejects.toThrow(/staff member/i);
    await expect(
      services.staffScheduleService.createShift(gymId, owner.user.id, {
        userId: staff.user.id,
        roleId: memberRole.id,
        startsAt: "2026-05-19T13:00:00.000Z",
        endsAt: "2026-05-19T21:00:00.000Z"
      })
    ).rejects.toThrow(/staff role/i);
  });
});
