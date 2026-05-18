import {
  BillingInterval,
  BookingStatus,
  CheckInMethod,
  CheckInStatus,
  MemberStatus,
  MembershipStatus
} from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices, type Services } from "../../app.js";
import type { ClassSession, Member } from "../../infrastructure/store/entities.js";
import { fixedClock, testConfig } from "../../testUtils.js";

describe("CheckInService", () => {
  it("creates allowed barcode and QR check-ins for active members", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, locationId, staffUserId, members } = await createCheckInFixture(services);

    const barcodeCheckIn = await services.checkInService.checkIn(gymId, staffUserId, {
      barcode: "MEM-1",
      locationId,
      method: CheckInMethod.Barcode
    });
    const code = await services.checkInService.checkInCode(gymId, members[0].id);
    const qrCheckIn = await services.checkInService.checkIn(gymId, staffUserId, {
      qrPayload: code.qrPayload,
      locationId,
      method: CheckInMethod.QrCode
    });
    const memberCheckIns = await services.checkInService.listForMember(gymId, members[0].id);

    expect(code.barcode).toBe("MEM-1");
    expect(barcodeCheckIn.status).toBe(CheckInStatus.Allowed);
    expect(barcodeCheckIn.method).toBe(CheckInMethod.Barcode);
    expect(qrCheckIn.status).toBe(CheckInStatus.Allowed);
    expect(qrCheckIn.method).toBe(CheckInMethod.QrCode);
    expect(memberCheckIns).toHaveLength(2);
  });

  it("denies frozen members and members without an active membership", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, locationId, staffUserId, planId } = await createCheckInFixture(services);
    const frozen = await createMember(services, gymId, "Frozen", "MEM-FROZEN", MemberStatus.Frozen);
    await services.memberMembershipService.assignPlan(gymId, frozen.id, {
      planId,
      status: MembershipStatus.Active
    });
    const expiredMembership = await createMember(
      services,
      gymId,
      "ExpiredPlan",
      "MEM-EXPIRED-PLAN",
      MemberStatus.Active
    );
    await services.memberMembershipService.assignPlan(gymId, expiredMembership.id, {
      planId,
      status: MembershipStatus.Expired
    });

    const frozenCheckIn = await services.checkInService.checkIn(gymId, staffUserId, {
      memberId: frozen.id,
      locationId
    });
    const expiredMembershipCheckIn = await services.checkInService.checkIn(gymId, staffUserId, {
      memberId: expiredMembership.id,
      locationId
    });

    expect(frozenCheckIn.status).toBe(CheckInStatus.Denied);
    expect(frozenCheckIn.deniedReason).toBe("member_status_frozen");
    expect(expiredMembershipCheckIn.status).toBe(CheckInStatus.Denied);
    expect(expiredMembershipCheckIn.deniedReason).toBe("membership_not_active");
  });

  it("rejects check-ins for locations outside the active gym location set", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, staffUserId, members } = await createCheckInFixture(services);

    await expect(
      services.checkInService.checkIn(gymId, staffUserId, {
        memberId: members[0].id,
        locationId: "df99f6e0-4aa5-4d43-a651-4d8d8510d230"
      })
    ).rejects.toThrow(/location/i);
  });

  it("requires a booked class spot for class check-in unless staff override is supplied", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, locationId, staffUserId, session, members } = await createCheckInFixture(services);

    const denied = await services.checkInService.checkIn(gymId, staffUserId, {
      memberId: members[1].id,
      locationId,
      classSessionId: session.id
    });
    const overridden = await services.checkInService.checkIn(gymId, staffUserId, {
      memberId: members[1].id,
      locationId,
      classSessionId: session.id,
      overrideEligibility: true,
      overrideReason: "Staff approved drop-in class access."
    });

    expect(denied.status).toBe(CheckInStatus.Denied);
    expect(denied.deniedReason).toBe("class_booking_required");
    expect(overridden.status).toBe(CheckInStatus.Allowed);
    expect(overridden.staffOverride).toBe(true);
    expect(overridden.deniedReason).toBe("class_booking_required");
    expect(overridden.overrideReason).toMatch(/drop-in/i);
  });

  it("links class check-ins to booked class bookings", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, locationId, staffUserId, session, members } = await createCheckInFixture(services);
    const booking = await services.bookingService.createBooking(gymId, session.id, {
      memberId: members[0].id
    });

    const checkIn = await services.checkInService.checkIn(gymId, staffUserId, {
      memberId: members[0].id,
      locationId,
      classSessionId: session.id
    });

    expect(booking.status).toBe(BookingStatus.Booked);
    expect(checkIn.status).toBe(CheckInStatus.Allowed);
    expect(checkIn.bookingId).toBe(booking.id);
    expect(checkIn.classSessionId).toBe(session.id);
  });
});

async function createCheckInFixture(
  services: Services
): Promise<{
  gymId: string;
  staffUserId: string;
  locationId: string;
  planId: string;
  session: ClassSession;
  members: [Member, Member];
}> {
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
  const gymId = owner.gym.id;
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
    operatingHours: {
      mon: [{ opensAt: "06:00", closesAt: "22:00" }]
    }
  });
  const classType = await services.classScheduleService.createClassType(gymId, {
    name: "Strength Foundations",
    defaultDurationMinutes: 60,
    defaultCapacity: 12,
    defaultWaitlistCapacity: 2,
    isPublic: true
  });
  const session = await services.classScheduleService.createSession(gymId, {
    classTypeId: classType.id,
    locationId: location.id,
    startsAt: "2026-05-18T14:00:00.000Z",
    endsAt: "2026-05-18T15:00:00.000Z",
    capacity: 12,
    waitlistCapacity: 2
  });
  const members: [Member, Member] = [
    await createMember(services, gymId, "Jamie", "MEM-1", MemberStatus.Active),
    await createMember(services, gymId, "Taylor", "MEM-2", MemberStatus.Active)
  ];
  const plan = await services.membershipPlanService.create(gymId, {
    name: "Class Access",
    billingInterval: BillingInterval.Monthly,
    priceCents: 9900,
    signupFeeCents: 0,
    trialDays: 0,
    autoRenew: true,
    isPublic: true
  });
  await Promise.all(
    members.map((member) =>
      services.memberMembershipService.assignPlan(gymId, member.id, {
        planId: plan.id,
        status: MembershipStatus.Active
      })
    )
  );
  return {
    gymId,
    staffUserId: owner.user.id,
    locationId: location.id,
    planId: plan.id,
    session,
    members
  };
}

function createMember(
  services: Services,
  gymId: string,
  firstName: string,
  barcode: string,
  status: MemberStatus
) {
  return services.memberService.create(gymId, {
    firstName,
    lastName: "Member",
    email: `${firstName.toLowerCase()}@example.com`,
    barcode,
    status,
    tagNames: []
  });
}
