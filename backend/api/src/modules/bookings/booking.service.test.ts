import {
  BillingInterval,
  BookingStatus,
  MemberStatus,
  MembershipStatus
} from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices, type Services } from "../../app.js";
import type { ClassSession, Member } from "../../infrastructure/store/entities.js";
import { fixedClock, testConfig } from "../../testUtils.js";

describe("BookingService", () => {
  it("books until capacity, waitlists overflow, and promotes the next waitlisted member on cancel", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, session, members } = await createBookingFixture(services, {
      capacity: 1,
      waitlistCapacity: 2
    });

    const booked = await services.bookingService.createBooking(gymId, session.id, {
      memberId: members[0].id
    });
    await expect(
      services.bookingService.createBooking(gymId, session.id, { memberId: members[1].id })
    ).rejects.toThrow(/full/i);
    const waitlisted = await services.bookingService.joinWaitlist(gymId, session.id, {
      memberId: members[1].id
    });

    const cancelled = await services.bookingService.cancelBooking(gymId, booked.id);
    const bookings = await services.bookingService.listForSession(gymId, session.id);
    const notifications = await services.repositories.notifications.listNotificationEventsForGym(gymId);

    expect(booked.status).toBe(BookingStatus.Booked);
    expect(waitlisted.status).toBe(BookingStatus.Waitlisted);
    expect(waitlisted.waitlistPosition).toBe(1);
    expect(cancelled.booking.status).toBe(BookingStatus.Cancelled);
    expect(cancelled.promotedBooking?.id).toBe(waitlisted.id);
    expect(cancelled.promotedBooking?.status).toBe(BookingStatus.Booked);
    expect(cancelled.promotedBooking?.promotedAt?.toISOString()).toBe("2026-05-16T12:00:00.000Z");
    expect(bookings.filter((booking) => booking.status === BookingStatus.Booked)).toHaveLength(1);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.type).toBe("waitlist_promoted");
    expect(notifications[0]?.relatedBookingId).toBe(waitlisted.id);
  });

  it("skips an ineligible first waitlisted member and promotes the next eligible member", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, session, members } = await createBookingFixture(services, {
      capacity: 1,
      waitlistCapacity: 2
    });

    const booked = await services.bookingService.createBooking(gymId, session.id, {
      memberId: members[0].id
    });
    const firstWaitlisted = await services.bookingService.joinWaitlist(gymId, session.id, {
      memberId: members[1].id
    });
    const secondWaitlisted = await services.bookingService.joinWaitlist(gymId, session.id, {
      memberId: members[2].id
    });

    await services.memberService.update(gymId, members[1].id, {
      status: MemberStatus.Frozen
    });

    const cancelled = await services.bookingService.cancelBooking(gymId, booked.id);
    const listed = await services.bookingService.listForSession(gymId, session.id);

    expect(firstWaitlisted.status).toBe(BookingStatus.Waitlisted);
    expect(secondWaitlisted.status).toBe(BookingStatus.Waitlisted);
    expect(cancelled.promotedBooking?.id).toBe(secondWaitlisted.id);
    expect(cancelled.promotedBooking?.status).toBe(BookingStatus.Booked);
    expect(
      listed.find((booking) => booking.id === firstWaitlisted.id)?.status
    ).toBe(BookingStatus.Waitlisted);
    expect(
      listed.find((booking) => booking.id === secondWaitlisted.id)?.status
    ).toBe(BookingStatus.Booked);
  });

  it("rejects duplicate active spots, full waitlists, and ineligible members", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, session, members } = await createBookingFixture(services, {
      capacity: 1,
      waitlistCapacity: 1
    });
    const frozen = await services.memberService.create(gymId, {
      firstName: "Frozen",
      lastName: "Member",
      email: "frozen@example.com",
      status: MemberStatus.Frozen,
      tagNames: []
    });

    const booked = await services.bookingService.createBooking(gymId, session.id, {
      memberId: members[0].id
    });
    const waitlisted = await services.bookingService.joinWaitlist(gymId, session.id, {
      memberId: members[1].id
    });

    await expect(
      services.bookingService.createBooking(gymId, session.id, { memberId: members[0].id })
    ).rejects.toThrow(/already/i);
    await expect(
      services.bookingService.joinWaitlist(gymId, session.id, { memberId: members[2].id })
    ).rejects.toThrow(/waitlist is full/i);
    await expect(
      services.bookingService.createBooking(gymId, session.id, { memberId: frozen.id })
    ).rejects.toThrow(/eligible/i);

    const left = await services.bookingService.leaveWaitlist(gymId, waitlisted.id);
    const listed = await services.bookingService.listForSession(gymId, session.id);

    expect(booked.status).toBe(BookingStatus.Booked);
    expect(left.booking.status).toBe(BookingStatus.Cancelled);
    expect(listed.filter((booking) => booking.status === BookingStatus.Waitlisted)).toHaveLength(0);
  });

  it("requires active memberships and enforces plan class access limits", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, session, members, locationId, classTypeId } = await createBookingFixture(services, {
      capacity: 3,
      waitlistCapacity: 1,
      classAccessLimit: 1
    });
    const noMembership = await services.memberService.create(gymId, {
      firstName: "No",
      lastName: "Plan",
      email: "noplan@example.com",
      status: MemberStatus.Active,
      tagNames: []
    });
    const secondSession = await services.classScheduleService.createSession(gymId, {
      classTypeId,
      locationId,
      startsAt: "2026-05-19T14:00:00.000Z",
      endsAt: "2026-05-19T15:00:00.000Z",
      capacity: 3,
      waitlistCapacity: 1
    });

    await services.bookingService.createBooking(gymId, session.id, { memberId: members[0].id });

    await expect(
      services.bookingService.createBooking(gymId, secondSession.id, { memberId: members[0].id })
    ).rejects.toThrow(/limit/i);
    await expect(
      services.bookingService.createBooking(gymId, session.id, { memberId: noMembership.id })
    ).rejects.toThrow(/active membership/i);
  });

  it("lets one-time customers book a covered class and rejects bookings beyond the entitlement limit", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, session, locationId, classTypeId } = await createBookingFixture(services, {
      capacity: 3,
      waitlistCapacity: 1
    });
    const customer = await services.memberService.create(gymId, {
      firstName: "Casey",
      lastName: "Customer",
      email: "casey@example.com",
      status: MemberStatus.Active,
      tagNames: []
    });
    const dropIn = await services.membershipPlanService.create(gymId, {
      name: "Drop In",
      billingInterval: BillingInterval.OneTime,
      priceCents: 2500,
      signupFeeCents: 0,
      trialDays: 0,
      autoRenew: false,
      isPublic: true
    });
    await services.memberMembershipService.assignPlan(gymId, customer.id, {
      planId: dropIn.id,
      status: MembershipStatus.Active
    });
    const secondSession = await services.classScheduleService.createSession(gymId, {
      classTypeId,
      locationId,
      startsAt: "2026-05-19T14:00:00.000Z",
      endsAt: "2026-05-19T15:00:00.000Z",
      capacity: 3,
      waitlistCapacity: 1
    });

    const booking = await services.bookingService.createBooking(gymId, session.id, {
      memberId: customer.id
    });

    expect(booking.status).toBe(BookingStatus.Booked);
    expect(dropIn.classAccessLimit).toBe(1);
    await expect(
      services.bookingService.createBooking(gymId, secondSession.id, { memberId: customer.id })
    ).rejects.toThrow(/limit/i);
  });

  it("applies late cancellation fees inside the session cancellation cutoff", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, session, members } = await createBookingFixture(services, {
      capacity: 3,
      waitlistCapacity: 1,
      startsAt: "2026-05-16T12:30:00.000Z",
      endsAt: "2026-05-16T13:30:00.000Z",
      cancellationCutoffMinutes: 60,
      lateCancellationFeeCents: 1500
    });

    const booking = await services.bookingService.createBooking(gymId, session.id, {
      memberId: members[0].id
    });
    const cancelled = await services.bookingService.cancelBooking(gymId, booking.id);

    expect(cancelled.booking.isLateCancellation).toBe(true);
    expect(cancelled.booking.lateCancellationFeeCents).toBe(1500);
  });

  it("lets staff manually book with a capacity override", async () => {
    const services = createServices(testConfig, fixedClock);
    const { gymId, session, members, staffUserId } = await createBookingFixture(services, {
      capacity: 1,
      waitlistCapacity: 0
    });

    await services.bookingService.createBooking(gymId, session.id, { memberId: members[0].id });
    const manualBooking = await services.bookingService.createStaffManualBooking(
      gymId,
      session.id,
      staffUserId,
      {
        memberId: members[1].id,
        overrideCapacity: true,
        overrideEligibility: false,
        overridePlanLimit: false,
        overrideReason: "Owner approved over-capacity booking."
      }
    );

    expect(manualBooking.status).toBe(BookingStatus.Booked);
    expect(manualBooking.source).toBe("staff");
    expect(manualBooking.staffOverride).toBe(true);
    expect(manualBooking.createdByUserId).toBe(staffUserId);
    expect(manualBooking.overrideReason).toMatch(/approved/i);
  });
});

async function createBookingFixture(
  services: Services,
  options: {
    capacity: number;
    waitlistCapacity: number;
    classAccessLimit?: number;
    startsAt?: string;
    endsAt?: string;
    cancellationCutoffMinutes?: number;
    lateCancellationFeeCents?: number;
  }
): Promise<{
  gymId: string;
  staffUserId: string;
  locationId: string;
  classTypeId: string;
  session: ClassSession;
  members: [Member, Member, Member];
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
    defaultCapacity: options.capacity,
    defaultWaitlistCapacity: options.waitlistCapacity,
    isPublic: true
  });
  const session = await services.classScheduleService.createSession(gymId, {
    classTypeId: classType.id,
    locationId: location.id,
    startsAt: options.startsAt ?? "2026-05-18T14:00:00.000Z",
    endsAt: options.endsAt ?? "2026-05-18T15:00:00.000Z",
    capacity: options.capacity,
    waitlistCapacity: options.waitlistCapacity,
    cancellationCutoffMinutes: options.cancellationCutoffMinutes,
    lateCancellationFeeCents: options.lateCancellationFeeCents
  });
  const firstMember = await createMember(services, gymId, "Jamie", "MEM-1");
  const secondMember = await createMember(services, gymId, "Taylor", "MEM-2");
  const thirdMember = await createMember(services, gymId, "Jordan", "MEM-3");
  const plan = await services.membershipPlanService.create(gymId, {
    name: "Class Access",
    billingInterval: BillingInterval.Monthly,
    priceCents: 9900,
    signupFeeCents: 0,
    trialDays: 0,
    autoRenew: true,
    isPublic: true,
    classAccessLimit: options.classAccessLimit
  });
  await Promise.all(
    [firstMember, secondMember, thirdMember].map((member) =>
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
    classTypeId: classType.id,
    session,
    members: [firstMember, secondMember, thirdMember]
  };
}

function createMember(services: Services, gymId: string, firstName: string, barcode: string) {
  return services.memberService.create(gymId, {
    firstName,
    lastName: "Member",
    email: `${firstName.toLowerCase()}@example.com`,
    barcode,
    status: MemberStatus.Active,
    tagNames: []
  });
}
