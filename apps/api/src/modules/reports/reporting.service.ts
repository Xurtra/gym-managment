import { BookingStatus, MemberStatus, MembershipStatus } from "@gym-platform/constants";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export class ReportingService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async overview(gymId: string) {
    const now = this.clock.now();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [members, payments, subscriptions, checkIns, sessions] = await Promise.all([
      this.repositories.members.listMembersForGym(gymId),
      this.repositories.payments.listPaymentTransactionsForGym(gymId),
      this.repositories.payments.listStripeSubscriptionsForGym(gymId),
      this.repositories.checkIns.listCheckInsForGym(gymId),
      this.repositories.classes.listClassSessionsForGym(gymId)
    ]);
    const memberships = (
      await Promise.all(
        members.map((member) => this.repositories.memberMemberships.listMemberMembershipsForMember(member.id))
      )
    ).flat();
    const bookings = (
      await Promise.all(
        sessions.map((session) => this.repositories.bookings.listClassBookingsForSession(session.id))
      )
    ).flat();
    const revenuePayments = payments.filter((payment) => payment.status === "succeeded");
    const recentMembers = members.filter((member) => member.createdAt >= thirtyDaysAgo);
    const recentCheckIns = checkIns.filter((checkIn) => checkIn.checkedInAt >= thirtyDaysAgo);
    const pastDueMembers = members.filter((member) => member.status === MemberStatus.PastDue);
    const churnedMembers = members.filter(
      (member) =>
        member.status === MemberStatus.Cancelled ||
        member.status === MemberStatus.Expired ||
        member.status === MemberStatus.Archived
    );

    return {
      generatedAt: now.toISOString(),
      memberGrowth: {
        totalMembers: members.length,
        activeMembers: members.filter((member) => member.status === MemberStatus.Active).length,
        trialMembers: members.filter((member) => member.status === MemberStatus.Trial).length,
        leads: members.filter((member) => member.status === MemberStatus.Lead).length,
        newLast30Days: recentMembers.length
      },
      revenue: {
        succeededPaymentsCents: revenuePayments.reduce(
          (total, payment) => total + payment.amountCents - payment.refundedAmountCents,
          0
        ),
        refundedCents: payments.reduce((total, payment) => total + payment.refundedAmountCents, 0),
        activeSubscriptions: subscriptions.filter((subscription) =>
          ["active", "trialing"].includes(subscription.status)
        ).length,
        pastDueSubscriptions: subscriptions.filter(
          (subscription) => subscription.status === "past_due"
        ).length
      },
      checkInVolume: {
        total: checkIns.length,
        last30Days: recentCheckIns.length,
        allowed: checkIns.filter((checkIn) => checkIn.status === "allowed").length,
        denied: checkIns.filter((checkIn) => checkIn.status === "denied").length
      },
      classAttendance: {
        sessions: sessions.length,
        booked: bookings.filter((booking) => booking.status === BookingStatus.Booked).length,
        waitlisted: bookings.filter((booking) => booking.status === BookingStatus.Waitlisted).length,
        cancelled: bookings.filter((booking) => booking.status === BookingStatus.Cancelled).length
      },
      churnAndPastDue: {
        pastDueMembers: pastDueMembers.length,
        churnedMembers: churnedMembers.length,
        pastDueMemberships: memberships.filter(
          (membership) => membership.status === MembershipStatus.PastDue
        ).length,
        canceledMemberships: memberships.filter(
          (membership) => membership.status === MembershipStatus.Canceled
        ).length,
        expiredMemberships: memberships.filter(
          (membership) => membership.status === MembershipStatus.Expired
        ).length
      }
    };
  }
}
