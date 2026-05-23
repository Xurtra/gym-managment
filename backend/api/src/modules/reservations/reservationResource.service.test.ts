import { BillingInterval, ReservationPaymentRequirement } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { createGym, fixedClock, testConfig } from "../../testUtils.js";

describe("ReservationResourceService", () => {
  it("creates resource groups and units, then archives resources", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId);

    const courts = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "Courts",
      resourceType: "court_group",
      isBookable: false
    });
    const courtTwo = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      parentResourceId: courts.id,
      name: "Court 2",
      resourceType: "court"
    });
    const archived = await services.reservationResourceService.archiveResource(gymId, courtTwo.id);
    const active = await services.reservationResourceService.listResources(gymId);

    expect(courtTwo.parentResourceId).toBe(courts.id);
    expect(archived.status).toBe("archived");
    expect(active.map((resource) => resource.id)).toEqual([courts.id]);
  });

  it("validates duration rules for facility reservations", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId);
    const member = await createMember(services, gymId);
    const resource = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "Massage Chair 1",
      resourceType: "massage_chair",
      slotRules: {
        minDurationMinutes: 30,
        maxDurationMinutes: 60,
        incrementMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0
      }
    });

    await expect(
      services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
        resourceId: resource.id,
        memberId: member.id,
        startsAt: "2026-05-17T14:00:00.000Z",
        endsAt: "2026-05-17T14:20:00.000Z",
        overrideConflict: false
      })
    ).rejects.toMatchObject({ code: "invalid_reservation_duration" });
  });

  it("hard-blocks resource conflicts across class allocations and facility reservations", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId);
    const member = await createMember(services, gymId);
    const resource = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "Studio A",
      resourceType: "room"
    });
    const session = await createClassSession(services, gymId, location.id);

    await services.reservationResourceService.allocateClassSession(gymId, session.id, {
      resourceId: resource.id,
      overrideConflict: false
    });

    await expect(
      services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
        resourceId: resource.id,
        memberId: member.id,
        startsAt: "2026-05-17T15:15:00.000Z",
        endsAt: "2026-05-17T15:45:00.000Z",
        overrideConflict: false
      })
    ).rejects.toMatchObject({ code: "resource_conflict" });

    const overridden = await services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
      resourceId: resource.id,
      memberId: member.id,
      startsAt: "2026-05-17T15:15:00.000Z",
      endsAt: "2026-05-17T15:45:00.000Z",
      overrideConflict: true,
      overrideReason: "Owner approved overlap"
    });
    const bookings = await services.bookingService.listForSession(gymId, session.id);

    expect(overridden.status).toBe("confirmed");
    expect(bookings).toHaveLength(0);
  });

  it("snapshots price and applies facility cancellation policy without class late fees", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId);
    const member = await createMember(services, gymId);
    const resource = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "Court 1",
      resourceType: "court",
      pricing: { amountCents: 4000 },
      paymentRequirement: ReservationPaymentRequirement.PayLater,
      cancellationPolicy: { cutoffMinutes: 120, feeCents: 1000 }
    });

    const reservation = await services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
      resourceId: resource.id,
      memberId: member.id,
      startsAt: "2026-05-16T13:00:00.000Z",
      endsAt: "2026-05-16T14:00:00.000Z",
      overrideConflict: false
    });
    const cancelled = await services.reservationResourceService.cancelFacilityReservation(
      gymId,
      reservation.id,
      "staff-user",
      { reason: "Customer called" }
    );

    expect(reservation.amountCents).toBe(4000);
    expect(reservation.paymentStatus).toBe("unpaid");
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cancellationFeeCents).toBe(1000);
    expect(cancelled.cancellationReason).toBe("Customer called");
  });
});

async function createLocation(services: ReturnType<typeof createServices>, gymId: string) {
  return services.locationService.create(gymId, {
    name: `Location ${Math.random()}`,
    address: {
      line1: "1 Main St",
      city: "New York",
      region: "NY",
      postalCode: "10001",
      country: "US"
    },
    timezone: "America/New_York",
    operatingHours: {}
  });
}

async function createMember(services: ReturnType<typeof createServices>, gymId: string) {
  return services.memberService.create(gymId, {
    firstName: "Ari",
    lastName: "Customer",
    email: `ari-${Math.random()}@example.com`,
    status: "active",
    tagNames: []
  });
}

async function createClassSession(
  services: ReturnType<typeof createServices>,
  gymId: string,
  locationId: string
) {
  const plan = await services.membershipPlanService.create(gymId, {
    name: `Plan ${Math.random()}`,
    billingInterval: BillingInterval.Monthly,
    priceCents: 10000,
    signupFeeCents: 0,
    trialDays: 0,
    autoRenew: true,
    isPublic: true
  });
  expect(plan.id).toBeTruthy();
  const classType = await services.classScheduleService.createClassType(gymId, {
    name: `Yoga ${Math.random()}`,
    defaultDurationMinutes: 60,
    defaultCapacity: 10,
    defaultWaitlistCapacity: 2,
    isPublic: true
  });
  return services.classScheduleService.createSession(gymId, {
    classTypeId: classType.id,
    locationId,
    startsAt: "2026-05-17T15:00:00.000Z",
    endsAt: "2026-05-17T16:00:00.000Z",
    capacity: 10,
    waitlistCapacity: 2
  });
}
