import {
  BookingSource,
  BookingStatus,
  ClassSessionStatus,
  MemberStatus,
  MembershipStatus,
  NotificationEventStatus,
  NotificationEventType,
  PlanStatus
} from "@gym-platform/constants";
import type { ClassBookingCreateInput, StaffManualBookingInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
import type {
  ClassBooking,
  ClassSession,
  MemberMembership,
  MembershipPlan
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

const bookableMemberStatuses = new Set<MemberStatus>([MemberStatus.Active, MemberStatus.Trial]);
const activeMembershipStatuses = new Set<MembershipStatus>([
  MembershipStatus.Active,
  MembershipStatus.Trialing
]);

interface MembershipEligibility {
  memberships: MemberMembership[];
  plans: MembershipPlan[];
}

export class BookingService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async listForSession(gymId: string, classSessionId: string) {
    await this.getScopedSession(this.repositories, gymId, classSessionId);
    return this.repositories.bookings.listClassBookingsForSession(classSessionId);
  }

  async createBooking(gymId: string, classSessionId: string, input: ClassBookingCreateInput) {
    return this.repositories.transaction(async (repositories) => {
      const session = await this.getBookableSession(repositories, gymId, classSessionId);
      const member = await this.getBookableMember(repositories, gymId, input.memberId);
      const eligibility = await this.getActiveMembershipEligibility(repositories, gymId, member.id);
      const bookings = await repositories.bookings.listClassBookingsForSession(session.id);
      this.ensureNoActiveBooking(bookings, member.id);
      if (bookedCount(bookings) >= session.capacity) {
        throw conflict("Class session is full. Join the waitlist instead.", "class_capacity_reached");
      }
      await this.ensurePlanLimitAvailable(repositories, member.id, eligibility);
      const now = this.clock.now();
      const booking: ClassBooking = {
        id: randomUUID(),
        gymId,
        classSessionId: session.id,
        memberId: member.id,
        status: BookingStatus.Booked,
        source: BookingSource.Member,
        bookedAt: now,
        isLateCancellation: false,
        lateCancellationFeeCents: 0,
        staffOverride: false,
        createdAt: now,
        updatedAt: now
      };
      return repositories.bookings.createClassBooking(booking);
    });
  }

  async joinWaitlist(gymId: string, classSessionId: string, input: ClassBookingCreateInput) {
    return this.repositories.transaction(async (repositories) => {
      const session = await this.getBookableSession(repositories, gymId, classSessionId);
      const member = await this.getBookableMember(repositories, gymId, input.memberId);
      await this.getActiveMembershipEligibility(repositories, gymId, member.id);
      const bookings = await repositories.bookings.listClassBookingsForSession(session.id);
      this.ensureNoActiveBooking(bookings, member.id);
      if (bookedCount(bookings) < session.capacity) {
        throw conflict("Class session still has booking capacity.", "booking_capacity_available");
      }
      const waitlisted = activeWaitlisted(bookings);
      if (waitlisted.length >= session.waitlistCapacity) {
        throw conflict("Class waitlist is full.", "waitlist_capacity_reached");
      }
      const now = this.clock.now();
      const booking: ClassBooking = {
        id: randomUUID(),
        gymId,
        classSessionId: session.id,
        memberId: member.id,
        status: BookingStatus.Waitlisted,
        waitlistPosition: nextWaitlistPosition(waitlisted),
        source: BookingSource.Member,
        bookedAt: now,
        isLateCancellation: false,
        lateCancellationFeeCents: 0,
        staffOverride: false,
        createdAt: now,
        updatedAt: now
      };
      return repositories.bookings.createClassBooking(booking);
    });
  }

  async createStaffManualBooking(
    gymId: string,
    classSessionId: string,
    staffUserId: string,
    input: StaffManualBookingInput
  ) {
    return this.repositories.transaction(async (repositories) => {
      const session = await this.getBookableSession(repositories, gymId, classSessionId);
      const member = await this.getBookableMember(repositories, gymId, input.memberId);
      const bookings = await repositories.bookings.listClassBookingsForSession(session.id);
      this.ensureNoActiveBooking(bookings, member.id);
      if (!input.overrideCapacity && bookedCount(bookings) >= session.capacity) {
        throw conflict("Class session is full. Use a staff override to book anyway.", "class_capacity_reached");
      }
      if (!input.overrideEligibility) {
        const eligibility = await this.getActiveMembershipEligibility(repositories, gymId, member.id);
        if (!input.overridePlanLimit) {
          await this.ensurePlanLimitAvailable(repositories, member.id, eligibility);
        }
      }
      const now = this.clock.now();
      const booking: ClassBooking = {
        id: randomUUID(),
        gymId,
        classSessionId: session.id,
        memberId: member.id,
        status: BookingStatus.Booked,
        source: BookingSource.Staff,
        createdByUserId: staffUserId,
        bookedAt: now,
        isLateCancellation: false,
        lateCancellationFeeCents: 0,
        staffOverride: input.overrideCapacity || input.overrideEligibility || input.overridePlanLimit,
        createdAt: now,
        updatedAt: now
      };
      if (input.overrideReason) {
        booking.overrideReason = input.overrideReason;
      }
      return repositories.bookings.createClassBooking(booking);
    });
  }

  async cancelBooking(gymId: string, bookingId: string, cancelledByUserId?: string) {
    return this.repositories.transaction(async (repositories) => {
      const { booking, session } = await this.getScopedBooking(repositories, gymId, bookingId);
      if (booking.status === BookingStatus.Cancelled) {
        throw conflict("Class booking is already cancelled.", "booking_already_cancelled");
      }
      const cancelled = await this.cancelActiveBooking(repositories, booking, session, cancelledByUserId);
      const promotedBooking =
        booking.status === BookingStatus.Booked
          ? await this.promoteNextWaitlistedBooking(repositories, session)
          : undefined;
      if (booking.status === BookingStatus.Waitlisted) {
        await this.compactWaitlistPositions(repositories, session.id);
      }
      return promotedBooking ? { booking: cancelled, promotedBooking } : { booking: cancelled };
    });
  }

  async leaveWaitlist(gymId: string, bookingId: string, cancelledByUserId?: string) {
    return this.repositories.transaction(async (repositories) => {
      const { booking, session } = await this.getScopedBooking(repositories, gymId, bookingId);
      if (booking.status !== BookingStatus.Waitlisted) {
        throw conflict("Only waitlisted bookings can leave the waitlist.", "booking_not_waitlisted");
      }
      const cancelled = await this.cancelActiveBooking(repositories, booking, session, cancelledByUserId);
      await this.compactWaitlistPositions(repositories, session.id);
      return { booking: cancelled };
    });
  }

  private async getBookableSession(repositories: Repositories, gymId: string, classSessionId: string) {
    const session = await this.getScopedSession(repositories, gymId, classSessionId);
    if (session.status !== ClassSessionStatus.Scheduled || session.startsAt <= this.clock.now()) {
      throw conflict("Class session is not open for booking.", "class_booking_closed");
    }
    return session;
  }

  private async getScopedSession(repositories: Repositories, gymId: string, classSessionId: string) {
    const session = await repositories.classes.getClassSession(classSessionId);
    if (!session || session.gymId !== gymId) {
      throw notFound("Class session was not found.");
    }
    return session;
  }

  private async getBookableMember(repositories: Repositories, gymId: string, memberId: string) {
    const member = await repositories.members.getMember(memberId);
    if (!member || member.gymId !== gymId || member.status === MemberStatus.Archived) {
      throw notFound("Member was not found.");
    }
    if (!bookableMemberStatuses.has(member.status)) {
      throw conflict("Member is not eligible for class booking.", "member_not_bookable");
    }
    return member;
  }

  private async getScopedBooking(repositories: Repositories, gymId: string, bookingId: string) {
    const booking = await repositories.bookings.getClassBooking(bookingId);
    if (!booking || booking.gymId !== gymId) {
      throw notFound("Class booking was not found.");
    }
    const session = await this.getScopedSession(repositories, gymId, booking.classSessionId);
    return { booking, session };
  }

  private ensureNoActiveBooking(bookings: ClassBooking[], memberId: string) {
    const duplicate = bookings.find(
      (booking) => booking.memberId === memberId && isActiveBooking(booking)
    );
    if (duplicate) {
      throw conflict(
        "Member already has an active booking or waitlist spot for this session.",
        "member_already_booked"
      );
    }
  }

  private async cancelActiveBooking(
    repositories: Repositories,
    booking: ClassBooking,
    session: ClassSession,
    cancelledByUserId?: string
  ) {
    const isLateCancellation =
      booking.status === BookingStatus.Booked && isInsideCancellationCutoff(session, this.clock.now());
    const cancelled: ClassBooking = {
      ...booking,
      status: BookingStatus.Cancelled,
      cancelledAt: this.clock.now(),
      isLateCancellation,
      lateCancellationFeeCents: isLateCancellation ? session.lateCancellationFeeCents : 0,
      updatedAt: this.clock.now()
    };
    if (cancelledByUserId) {
      cancelled.cancelledByUserId = cancelledByUserId;
    }
    delete cancelled.waitlistPosition;
    return repositories.bookings.updateClassBooking(cancelled);
  }

  private async promoteNextWaitlistedBooking(repositories: Repositories, session: ClassSession) {
    const bookings = await repositories.bookings.listClassBookingsForSession(session.id);
    if (bookedCount(bookings) >= session.capacity) {
      return undefined;
    }
    let next: ClassBooking | undefined;
    for (const candidate of activeWaitlisted(bookings)) {
      if (await this.canPromoteWaitlistedBooking(repositories, session.gymId, candidate.memberId)) {
        next = candidate;
        break;
      }
    }
    if (!next) {
      return undefined;
    }
    const now = this.clock.now();
    const promoted: ClassBooking = {
      ...next,
      status: BookingStatus.Booked,
      bookedAt: now,
      promotedAt: now,
      updatedAt: now
    };
    delete promoted.waitlistPosition;
    const saved = await repositories.bookings.updateClassBooking(promoted);
    await this.createWaitlistPromotionNotification(repositories, saved, session);
    await this.compactWaitlistPositions(repositories, session.id);
    return saved;
  }

  private async compactWaitlistPositions(repositories: Repositories, classSessionId: string) {
    const bookings = await repositories.bookings.listClassBookingsForSession(classSessionId);
    const waitlisted = activeWaitlisted(bookings);
    const now = this.clock.now();
    for (const [index, booking] of waitlisted.entries()) {
      const expectedPosition = index + 1;
      if (booking.waitlistPosition === expectedPosition) {
        continue;
      }
      await repositories.bookings.updateClassBooking({
        ...booking,
        waitlistPosition: expectedPosition,
        updatedAt: now
      });
    }
  }

  private async getActiveMembershipEligibility(
    repositories: Repositories,
    gymId: string,
    memberId: string
  ): Promise<MembershipEligibility> {
    const now = this.clock.now();
    const memberships = (await repositories.memberMemberships.listMemberMembershipsForMember(memberId)).filter(
      (membership) =>
        membership.gymId === gymId &&
        activeMembershipStatuses.has(membership.status) &&
        membership.startsAt <= now &&
        (!membership.endsAt || membership.endsAt >= now)
    );
    const plans: MembershipPlan[] = [];
    for (const membership of memberships) {
      const plan = await repositories.membershipPlans.getMembershipPlan(membership.planId);
      if (plan && plan.gymId === gymId && plan.status !== PlanStatus.Archived) {
        plans.push(plan);
      }
    }
    if (plans.length === 0) {
      throw conflict("Member does not have an active membership for class booking.", "active_membership_required");
    }
    return { memberships, plans };
  }

  private async ensurePlanLimitAvailable(
    repositories: Repositories,
    memberId: string,
    eligibility: MembershipEligibility
  ) {
    if (eligibility.plans.some((plan) => plan.classAccessLimit === undefined)) {
      return;
    }
    const classAccessLimit = eligibility.plans.reduce(
      (total, plan) => total + (plan.classAccessLimit ?? 0),
      0
    );
    const activeBookings = await this.countUpcomingBookedClasses(repositories, memberId);
    if (activeBookings >= classAccessLimit) {
      throw conflict("Member has reached their active class booking limit.", "plan_class_limit_reached");
    }
  }

  private async countUpcomingBookedClasses(repositories: Repositories, memberId: string) {
    const bookings = await repositories.bookings.listClassBookingsForMember(memberId);
    let count = 0;
    for (const booking of bookings) {
      if (booking.status !== BookingStatus.Booked) {
        continue;
      }
      const session = await repositories.classes.getClassSession(booking.classSessionId);
      if (
        session &&
        session.status === ClassSessionStatus.Scheduled &&
        session.startsAt >= this.clock.now()
      ) {
        count += 1;
      }
    }
    return count;
  }

  private async canPromoteWaitlistedBooking(
    repositories: Repositories,
    gymId: string,
    memberId: string
  ) {
    try {
      const eligibility = await this.getActiveMembershipEligibility(repositories, gymId, memberId);
      await this.ensurePlanLimitAvailable(repositories, memberId, eligibility);
      return true;
    } catch {
      return false;
    }
  }

  private async createWaitlistPromotionNotification(
    repositories: Repositories,
    booking: ClassBooking,
    session: ClassSession
  ) {
    const now = this.clock.now();
    await repositories.notifications.createNotificationEvent({
      id: randomUUID(),
      gymId: booking.gymId,
      type: NotificationEventType.WaitlistPromoted,
      status: NotificationEventStatus.Pending,
      recipientMemberId: booking.memberId,
      relatedBookingId: booking.id,
      payload: {
        classSessionId: session.id,
        startsAt: session.startsAt.toISOString()
      },
      createdAt: now,
      updatedAt: now
    });
  }
}

function isActiveBooking(booking: ClassBooking) {
  return booking.status === BookingStatus.Booked || booking.status === BookingStatus.Waitlisted;
}

function bookedCount(bookings: ClassBooking[]) {
  return bookings.filter((booking) => booking.status === BookingStatus.Booked).length;
}

function activeWaitlisted(bookings: ClassBooking[]) {
  return bookings
    .filter((booking) => booking.status === BookingStatus.Waitlisted)
    .sort(
      (left, right) =>
        (left.waitlistPosition ?? Number.MAX_SAFE_INTEGER) -
          (right.waitlistPosition ?? Number.MAX_SAFE_INTEGER) ||
        left.createdAt.getTime() - right.createdAt.getTime()
    );
}

function nextWaitlistPosition(bookings: ClassBooking[]) {
  return bookings.reduce((max, booking) => Math.max(max, booking.waitlistPosition ?? 0), 0) + 1;
}

function isInsideCancellationCutoff(session: ClassSession, now: Date) {
  if (session.cancellationCutoffMinutes <= 0) {
    return false;
  }
  const cutoffStartsAt = new Date(
    session.startsAt.getTime() - session.cancellationCutoffMinutes * 60 * 1000
  );
  return now >= cutoffStartsAt;
}
