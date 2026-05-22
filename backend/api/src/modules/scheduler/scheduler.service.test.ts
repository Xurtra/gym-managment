import { RoleName, UserStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";

describe("SchedulerService", () => {
  it("creates coverage rules, generates shifts, and auto-resolves replacement requests", async () => {
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
    const firstStaff = await services.authService.register({
      email: "frontdesk.one@example.com",
      password: "Password123",
      firstName: "First",
      lastName: "Desk",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const secondStaff = await services.authService.register({
      email: "frontdesk.two@example.com",
      password: "Password123",
      firstName: "Second",
      lastName: "Desk",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const gymId = owner.gym?.id ?? "";
    const frontDeskRole = await services.roleService.getRoleByName(gymId, RoleName.FrontDesk);
    for (const user of [firstStaff.user, secondStaff.user]) {
      await services.repositories.gymUsers.createGymUser({
        id: randomUUID(),
        gymId,
        userId: user.id,
        roleId: frontDeskRole.id,
        status: UserStatus.Active,
        createdAt: fixedClock.now(),
        updatedAt: fixedClock.now()
      });
    }

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
    await services.schedulerService.createCoverageRule(gymId, owner.user.id, {
      name: "Front desk weekdays",
      locationId: location.id,
      roleId: frontDeskRole.id,
      daysOfWeek: [1],
      startTime: "09:00",
      endTime: "13:00",
      requiredStaff: 1
    });
    await services.schedulerService.createAvailability(gymId, {
      userId: firstStaff.user.id,
      daysOfWeek: [1],
      startTime: "09:00",
      endTime: "13:00",
      preference: "preferred"
    });
    await services.schedulerService.createAvailability(gymId, {
      userId: secondStaff.user.id,
      daysOfWeek: [1],
      startTime: "09:00",
      endTime: "13:00",
      preference: "available"
    });

    const draft = await services.schedulerService.generateDraft(gymId, {
      startsOn: "2026-05-18",
      endsOn: "2026-05-18",
      locationId: location.id
    });
    expect(draft.warnings).toEqual([]);
    expect(draft.assignments[0]?.userId).toBe(firstStaff.user.id);

    const published = await services.schedulerService.publishGeneratedSchedule(gymId, owner.user.id, {
      startsOn: "2026-05-18",
      endsOn: "2026-05-18",
      locationId: location.id,
      replaceExisting: false
    });
    expect(published.shifts).toHaveLength(1);

    const request = await services.schedulerService.createRequest(gymId, firstStaff.user.id, {
      shiftId: published.shifts[0]?.id,
      requestType: "swap",
      message: "I need someone to cover this shift."
    });
    const resolved = await services.schedulerService.resolveRequest(
      gymId,
      request.id,
      owner.user.id,
      { decision: "apply", autoAssignReplacement: true }
    );
    expect(resolved.status).toBe("resolved");
    expect(resolved.suggestedReplacementUserId).toBe(secondStaff.user.id);
    await expect(services.staffScheduleService.listShifts(gymId)).resolves.toMatchObject([
      { userId: secondStaff.user.id }
    ]);

    await services.schedulerService.updateSettings(gymId, { planningHorizonDays: 2 });
    const horizonDraft = await services.schedulerService.generateDraft(gymId, {
      startsOn: "2026-05-18",
      locationId: location.id
    });
    expect(horizonDraft.endsOn).toBe("2026-05-19");

    const noNotePreferenceRequest = await services.schedulerService.createPreferenceRequest(
      gymId,
      firstStaff.user.id,
      {
        daysOfWeek: [2],
        startTime: "09:00",
        endTime: "12:00",
        preference: "preferred"
      }
    );
    expect(noNotePreferenceRequest.status).toBe("open");

    const preferenceRequest = await services.schedulerService.createPreferenceRequest(
      gymId,
      secondStaff.user.id,
      {
        daysOfWeek: [1, 3],
        startTime: "13:00",
        endTime: "18:00",
        preference: "unavailable",
        notes: "Afternoons conflict with school."
      }
    );
    const approvedPreference = await services.schedulerService.resolvePreferenceRequest(
      gymId,
      preferenceRequest.id,
      owner.user.id,
      { decision: "approve", resolutionNote: "Approved for future drafts." }
    );
    expect(approvedPreference.status).toBe("approved");
    await expect(
      services.schedulerService.listAvailabilities(gymId, new Set([secondStaff.user.id]))
    ).resolves.toMatchObject([
      {
        userId: secondStaff.user.id,
        daysOfWeek: [1, 3],
        preference: "unavailable"
      }
    ]);

    const declinedRequest = await services.schedulerService.createRequest(gymId, secondStaff.user.id, {
      requestType: "time_off",
      message: "I would like next Monday off."
    });
    const declined = await services.schedulerService.resolveRequest(
      gymId,
      declinedRequest.id,
      owner.user.id,
      { decision: "decline", autoAssignReplacement: false, resolutionNote: "Coverage is already thin." }
    );
    expect(declined.status).toBe("declined");
    expect(declined.resolutionNote).toBe("Coverage is already thin.");
  });
});
