import { describe, expect, it } from "vitest";
import { createServices, type Services } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";

describe("ClassScheduleService", () => {
  it("creates class types, schedules class sessions, and exposes public sessions", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, locationId, ownerUserId, gymSlug } = await createGymWithLocation(services);
    const annex = await services.locationService.create(gymId, {
      name: "Downtown Annex",
      address: {
        line1: "200 Market St",
        city: "New York",
        region: "NY",
        postalCode: "10002",
        country: "US"
      },
      timezone: "America/New_York",
      operatingHours: {
        mon: [{ opensAt: "07:00", closesAt: "21:00" }]
      }
    });
    const publicType = await services.classScheduleService.createClassType(gymId, {
      name: "Strength Foundations",
      description: "Full-body strength work.",
      defaultDurationMinutes: 60,
      defaultCapacity: 16,
      defaultWaitlistCapacity: 4,
      isPublic: true
    });
    const privateType = await services.classScheduleService.createClassType(gymId, {
      name: "Staff Training",
      defaultDurationMinutes: 45,
      defaultCapacity: 8,
      defaultWaitlistCapacity: 0,
      isPublic: false
    });

    const publicSession = await services.classScheduleService.createSession(gymId, {
      classTypeId: publicType.id,
      locationId,
      trainerUserId: ownerUserId,
      roomName: "Studio A",
      startsAt: "2026-05-18T14:00:00.000Z",
      endsAt: "2026-05-18T15:00:00.000Z",
      capacity: 12,
      waitlistCapacity: 3
    });
    await services.classScheduleService.createSession(gymId, {
      classTypeId: privateType.id,
      locationId,
      startsAt: "2026-05-18T16:00:00.000Z",
      endsAt: "2026-05-18T17:00:00.000Z",
      capacity: 8,
      waitlistCapacity: 0
    });
    await services.classScheduleService.createSession(gymId, {
      classTypeId: publicType.id,
      locationId: annex.id,
      roomName: "Lift Lab",
      startsAt: "2026-05-18T18:00:00.000Z",
      endsAt: "2026-05-18T19:00:00.000Z",
      capacity: 10,
      waitlistCapacity: 2
    });

    const schedule = await services.classScheduleService.publicSchedule(
      gymSlug,
      new Date("2026-05-18T00:00:00.000Z"),
      new Date("2026-05-19T00:00:00.000Z")
    );
    const filteredSchedule = await services.classScheduleService.publicSchedule(
      gymSlug,
      new Date("2026-05-18T00:00:00.000Z"),
      new Date("2026-05-19T00:00:00.000Z"),
      { locationId }
    );

    expect(publicSession.capacity).toBe(12);
    expect(publicSession.waitlistCapacity).toBe(3);
    expect(publicSession.trainerUserId).toBe(ownerUserId);
    expect(publicSession.roomName).toBe("Studio A");
    expect(schedule).toHaveLength(2);
    expect(filteredSchedule).toHaveLength(1);
    expect(filteredSchedule[0]?.id).toBe(publicSession.id);
  });

  it("rejects invalid session times and trainers outside the gym", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, locationId } = await createGymWithLocation(services);
    const outsider = await services.authService.register({
      email: "outsider@example.com",
      password: "Password123",
      firstName: "Out",
      lastName: "Sider",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const classType = await services.classScheduleService.createClassType(gymId, {
      name: "Conditioning",
      defaultDurationMinutes: 45,
      defaultCapacity: 20,
      defaultWaitlistCapacity: 5,
      isPublic: true
    });

    await expect(
      services.classScheduleService.createSession(gymId, {
        classTypeId: classType.id,
        locationId,
        startsAt: "2026-05-18T15:00:00.000Z",
        endsAt: "2026-05-18T14:00:00.000Z",
        capacity: 20,
        waitlistCapacity: 5
      })
    ).rejects.toThrow(/end time/i);

    await expect(
      services.classScheduleService.createSession(gymId, {
        classTypeId: classType.id,
        locationId,
        trainerUserId: outsider.user.id,
        startsAt: "2026-05-18T14:00:00.000Z",
        endsAt: "2026-05-18T15:00:00.000Z",
        capacity: 20,
        waitlistCapacity: 5
      })
    ).rejects.toThrow(/trainer/i);
  });
});

async function createGymWithLocation(services: Services) {
  const owner = await services.authService.register({
    email: "owner@example.com",
    password: "Password123",
    firstName: "Demo",
    lastName: "Owner",
    gymName: "Demo Strength Club",
    timezone: "America/New_York",
    locale: "en-US"
  });
  if (!owner.gym) {
    throw new Error("Expected gym to be created.");
  }
  const location = await services.locationService.create(owner.gym.id, {
    name: "Main Floor",
    address: {
      line1: "100 Fitness Ave",
      city: "New York",
      region: "NY",
      postalCode: "10001",
      country: "US"
    },
    timezone: "America/New_York",
    operatingHours: {
      mon: [{ opensAt: "06:00", closesAt: "22:00" }]
    }
  });
  return {
    gymId: owner.gym.id,
    gymSlug: owner.gym.slug,
    ownerUserId: owner.user.id,
    locationId: location.id
  };
}
