import {
  BillingInterval,
  ReservationConfirmationMode,
  ReservationPaymentRequirement,
  RoleName,
  UserStatus
} from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { createGym, fixedClock, testConfig } from "../../testUtils.js";

describe("ReservationResourceService", () => {
  it("creates resource groups and units, then archives resources", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId);
    const otherLocation = await createLocation(services, gymId);

    const courts = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "Courts",
      resourceType: "court_group",
      isBookable: false,
      amenities: ["bleachers", "scoreboard"]
    });
    const courtTwo = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      parentResourceId: courts.id,
      name: "Court 2",
      resourceType: "court"
    });
    await services.reservationResourceService.createResource(gymId, {
      locationId: otherLocation.id,
      name: "Pool Lane 1",
      resourceType: "pool_lane"
    });
    const archived = await services.reservationResourceService.archiveResource(gymId, courtTwo.id);
    const active = await services.reservationResourceService.listResources(gymId, location.id);

    expect(courtTwo.parentResourceId).toBe(courts.id);
    expect(courts.amenities).toEqual(["bleachers", "scoreboard"]);
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

  it("validates max duration, increment, inherited hours, and reservation buffers", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId, {
      sun: [{ opensAt: "09:00", closesAt: "17:00" }]
    });
    const member = await createMember(services, gymId);
    const resource = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "Recovery Chair 1",
      resourceType: "massage_chair",
      slotRules: {
        minDurationMinutes: 30,
        maxDurationMinutes: 60,
        incrementMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 15
      }
    });

    await expect(
      services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
        resourceId: resource.id,
        memberId: member.id,
        startsAt: "2026-05-17T08:00:00.000Z",
        endsAt: "2026-05-17T08:30:00.000Z",
        overrideConflict: false
      })
    ).rejects.toMatchObject({ code: "outside_rentable_hours" });
    await expect(
      services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
        resourceId: resource.id,
        memberId: member.id,
        startsAt: "2026-05-17T09:00:00.000Z",
        endsAt: "2026-05-17T10:15:00.000Z",
        overrideConflict: false
      })
    ).rejects.toMatchObject({ code: "invalid_reservation_duration" });
    await expect(
      services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
        resourceId: resource.id,
        memberId: member.id,
        startsAt: "2026-05-17T09:00:00.000Z",
        endsAt: "2026-05-17T09:45:00.000Z",
        overrideConflict: false
      })
    ).rejects.toMatchObject({ code: "invalid_reservation_increment" });

    await services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
      resourceId: resource.id,
      memberId: member.id,
      startsAt: "2026-05-17T13:00:00.000Z",
      endsAt: "2026-05-17T14:00:00.000Z",
      overrideConflict: false
    });
    await expect(
      services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
        resourceId: resource.id,
        memberId: member.id,
        startsAt: "2026-05-17T14:05:00.000Z",
        endsAt: "2026-05-17T14:35:00.000Z",
        overrideConflict: false
      })
    ).rejects.toMatchObject({ code: "resource_conflict" });

    const availableAfterBuffer = await services.reservationResourceService.availability(
      gymId,
      resource.id,
      new Date("2026-05-17T14:15:00.000Z"),
      new Date("2026-05-17T14:45:00.000Z")
    );
    expect(availableAfterBuffer.available).toBe(true);
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
    await expect(
      services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
        resourceId: resource.id,
        memberId: member.id,
        startsAt: "2026-05-17T15:15:00.000Z",
        endsAt: "2026-05-17T15:45:00.000Z",
        overrideConflict: true
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

  it("lists multiple resources allocated to a class session", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId);
    const session = await createClassSession(services, gymId, location.id);
    const studio = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "Studio A",
      resourceType: "room"
    });
    const heavyBag = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "Heavy Bag Zone",
      resourceType: "equipment_zone"
    });

    await services.reservationResourceService.allocateClassSession(gymId, session.id, {
      resourceId: studio.id,
      overrideConflict: false
    });
    await services.reservationResourceService.allocateClassSession(gymId, session.id, {
      resourceId: heavyBag.id,
      overrideConflict: false
    });

    const allocations = await services.reservationResourceService.listClassSessionAllocations(gymId, session.id);

    expect(allocations).toHaveLength(2);
    expect(new Set(allocations.map((allocation) => allocation.resourceId))).toEqual(
      new Set([heavyBag.id, studio.id])
    );
    expect(allocations.every((allocation) => allocation.classSessionId === session.id)).toBe(true);
  });

  it("allows shared resources up to capacity and reports availability state", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId);
    const member = await createMember(services, gymId);
    const secondMember = await createMember(services, gymId);
    const thirdMember = await createMember(services, gymId);
    const resource = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "TRX Bay",
      resourceType: "training_bay",
      isExclusive: false,
      capacity: 2
    });

    await services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
      resourceId: resource.id,
      memberId: member.id,
      startsAt: "2026-05-17T16:00:00.000Z",
      endsAt: "2026-05-17T17:00:00.000Z",
      overrideConflict: false
    });
    const second = await services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
      resourceId: resource.id,
      memberId: secondMember.id,
      startsAt: "2026-05-17T16:15:00.000Z",
      endsAt: "2026-05-17T16:45:00.000Z",
      overrideConflict: false
    });
    const full = await services.reservationResourceService.availability(
      gymId,
      resource.id,
      new Date("2026-05-17T16:30:00.000Z"),
      new Date("2026-05-17T17:00:00.000Z")
    );

    await expect(
      services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
        resourceId: resource.id,
        memberId: thirdMember.id,
        startsAt: "2026-05-17T16:30:00.000Z",
        endsAt: "2026-05-17T17:00:00.000Z",
        overrideConflict: false
      })
    ).rejects.toMatchObject({ code: "resource_conflict" });

    expect(second.status).toBe("confirmed");
    expect(full.available).toBe(false);
    expect(full.allocations).toHaveLength(2);
  });

  it("snapshots staff-approval confirmation, pay-upfront config, and POS references", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId);
    const member = await createMember(services, gymId);
    const resource = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "Sauna Suite",
      resourceType: "recovery_room",
      pricing: { amountCents: 5500 },
      paymentRequirement: ReservationPaymentRequirement.PayUpfront,
      confirmationMode: ReservationConfirmationMode.StaffApproval
    });

    const reservation = await services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
      resourceId: resource.id,
      memberId: member.id,
      startsAt: "2026-05-17T18:00:00.000Z",
      endsAt: "2026-05-17T19:00:00.000Z",
      paymentReference: "pos-sale-123",
      overrideConflict: false
    });

    expect(reservation.status).toBe("pending");
    expect(reservation.amountCents).toBe(5500);
    expect(reservation.paymentRequirement).toBe(ReservationPaymentRequirement.PayUpfront);
    expect(reservation.paymentStatus).toBe("unpaid");
    expect(reservation.paymentReference).toBe("pos-sale-123");
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

  it("releases future allocation conflicts when a reservation is cancelled before it starts", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId);
    const member = await createMember(services, gymId);
    const resource = await services.reservationResourceService.createResource(gymId, {
      locationId: location.id,
      name: "Court 2",
      resourceType: "court"
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
      { reason: "Customer changed plans" }
    );
    const available = await services.reservationResourceService.availability(
      gymId,
      resource.id,
      new Date("2026-05-16T13:00:00.000Z"),
      new Date("2026-05-16T14:00:00.000Z")
    );

    expect(cancelled.status).toBe("cancelled");
    expect(available.available).toBe(true);
  });

  it("requires reservable staff roles for manual linked resources", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const staff = await services.authService.register({
      email: "manual-link@example.com",
      password: "Password123",
      firstName: "Mira",
      lastName: "Manual",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const frontDeskRole = await services.roleService.getRoleByName(gymId, RoleName.FrontDesk);
    const trainerRole = await services.roleService.getRoleByName(gymId, RoleName.Trainer);
    const membership = await services.repositories.gymUsers.createGymUser({
      id: randomUUID(),
      gymId,
      userId: staff.user.id,
      roleId: frontDeskRole.id,
      status: UserStatus.Active,
      createdAt: fixedClock.now(),
      updatedAt: fixedClock.now()
    });

    await expect(
      services.reservationResourceService.createResource(gymId, {
        linkedStaffUserId: staff.user.id,
        name: "Mira Manual",
        resourceType: "trainer"
      })
    ).rejects.toMatchObject({ code: "staff_resource_role_required" });

    await services.repositories.gymUsers.updateGymUser({
      ...membership,
      roleId: trainerRole.id,
      updatedAt: fixedClock.now()
    });
    const resource = await services.reservationResourceService.createResource(gymId, {
      linkedStaffUserId: staff.user.id,
      name: "Mira Manual",
      resourceType: "trainer"
    });

    expect(resource.linkedStaffUserId).toBe(staff.user.id);
    expect(resource.createdFromRoleId).toBe(trainerRole.id);
    expect(resource.autoManaged).toBe(false);
    expect(resource.locationId).toBeUndefined();
  });

  it("blocks staff-linked trainer resources across classes and facility reservations", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const location = await createLocation(services, gymId);
    const member = await createMember(services, gymId);
    const trainer = await services.authService.register({
      email: "trainer-resource@example.com",
      password: "Password123",
      firstName: "Tess",
      lastName: "Trainer",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const memberRole = await services.roleService.getRoleByName(gymId, RoleName.Member);
    const trainerRole = await services.roleService.getRoleByName(gymId, RoleName.Trainer);
    await services.repositories.gymUsers.createGymUser({
      id: randomUUID(),
      gymId,
      userId: trainer.user.id,
      roleId: memberRole.id,
      status: UserStatus.Active,
      createdAt: fixedClock.now(),
      updatedAt: fixedClock.now()
    });
    await services.roleService.assignRole(gymId, trainer.user.id, trainerRole.id);
    const trainerResource = (
      await services.reservationResourceService.listResources(gymId)
    ).find((resource) => resource.linkedStaffUserId === trainer.user.id);
    const classType = await services.classScheduleService.createClassType(gymId, {
      name: "Trainer Conflict Test",
      defaultDurationMinutes: 60,
      defaultCapacity: 10,
      defaultWaitlistCapacity: 2,
      isPublic: true
    });
    await services.classScheduleService.createSession(gymId, {
      classTypeId: classType.id,
      locationId: location.id,
      trainerUserId: trainer.user.id,
      startsAt: "2026-05-17T15:00:00.000Z",
      endsAt: "2026-05-17T16:00:00.000Z",
      capacity: 10,
      waitlistCapacity: 2
    });

    await expect(
      services.reservationResourceService.createFacilityReservation(gymId, "staff-user", {
        resourceId: trainerResource?.id ?? "",
        locationId: location.id,
        memberId: member.id,
        startsAt: "2026-05-17T15:15:00.000Z",
        endsAt: "2026-05-17T15:45:00.000Z",
        overrideConflict: false
      })
    ).rejects.toMatchObject({ code: "resource_conflict" });
    const overridden = await services.reservationResourceService.createFacilityReservation(
      gymId,
      "staff-user",
      {
        resourceId: trainerResource?.id ?? "",
        locationId: location.id,
        memberId: member.id,
        startsAt: "2026-05-17T15:15:00.000Z",
        endsAt: "2026-05-17T15:45:00.000Z",
        overrideConflict: true,
        overrideReason: "Trainer covering both"
      }
    );

    expect(trainerResource?.locationId).toBeUndefined();
    expect(overridden.locationId).toBe(location.id);
    expect(overridden.status).toBe("confirmed");
  });
});

async function createLocation(
  services: ReturnType<typeof createServices>,
  gymId: string,
  operatingHours = {}
) {
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
    operatingHours
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
