import { RoleName, UserStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { testConfig } from "../../testUtils.js";

describe("StaffTimeClockService", () => {
  it("clocks active staff in and out and prevents duplicate open entries", async () => {
    const clock = mutableClock("2026-05-16T12:00:00.000Z");
    const services = createServices(testConfig, clock);
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
    const gymId = owner.gym?.id ?? "";
    const trainerRole = await services.roleService.getRoleByName(gymId, RoleName.Trainer);
    await services.repositories.gymUsers.createGymUser({
      id: randomUUID(),
      gymId,
      userId: staff.user.id,
      roleId: trainerRole.id,
      status: UserStatus.Active,
      createdAt: clock.now(),
      updatedAt: clock.now()
    });

    const clockedIn = await services.staffTimeClockService.clockIn(gymId, owner.user.id, {
      userId: staff.user.id
    });

    expect(clockedIn.userId).toBe(staff.user.id);
    expect(clockedIn.clockedInAt).toBe("2026-05-16T12:00:00.000Z");
    expect(clockedIn.clockedOutAt).toBeUndefined();
    await expect(
      services.staffTimeClockService.clockIn(gymId, owner.user.id, { userId: staff.user.id })
    ).rejects.toThrow(/already clocked in/i);

    clock.set("2026-05-16T14:30:00.000Z");
    const clockedOut = await services.staffTimeClockService.clockOut(gymId, owner.user.id, {
      userId: staff.user.id
    });

    expect(clockedOut.id).toBe(clockedIn.id);
    expect(clockedOut.clockedOutAt).toBe("2026-05-16T14:30:00.000Z");
    await expect(services.staffTimeClockService.listEntries(gymId)).resolves.toEqual([clockedOut]);
    await expect(
      services.staffTimeClockService.listEntriesForStaff(gymId, staff.user.id)
    ).resolves.toEqual([clockedOut]);
    await expect(
      services.staffTimeClockService.clockOut(gymId, owner.user.id, { userId: staff.user.id })
    ).rejects.toThrow(/not clocked in/i);
  });
});

function mutableClock(initial: string) {
  let current = new Date(initial);
  return {
    now: () => new Date(current),
    set: (next: string) => {
      current = new Date(next);
    }
  };
}
