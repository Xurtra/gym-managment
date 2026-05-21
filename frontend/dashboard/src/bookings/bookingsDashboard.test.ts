import { describe, expect, it } from "vitest";
import { BookingSource, BookingStatus, Permission } from "@gym-platform/constants";
import {
  buildBookingCancelScreen,
  buildBookingDetailPage,
  buildBookingListPage,
  buildLeaveWaitlistScreen,
  buildStaffManualBookingScreen,
  buildWaitlistEntryScreen,
  createWaitlistEntrySubmission,
  createStaffManualBookingSubmission,
  type BookingMemberView,
  type BookingSessionView,
  type ClassBookingView
} from "./index.js";

describe("buildBookingListPage", () => {
  it("builds a filtered booking list with summary metadata", () => {
    const screen = buildBookingListPage({
      session: buildSession(),
      bookings: buildBookings(),
      members: buildMembers(),
      permissions: [Permission.BookingRead, Permission.BookingWrite],
      filters: {
        query: "taylor",
        status: BookingStatus.Waitlisted
      }
    });

    expect(screen.screen).toBe("booking_list");
    expect(screen.rowCount).toBe(1);
    expect(screen.activeFilterCount).toBe(2);
    expect(screen.statusOptionCount).toBe(3);
    expect(screen.summary.totalCount).toBe(3);
    expect(screen.summary.bookedCount).toBe(1);
    expect(screen.summary.waitlistedCount).toBe(1);
    expect(screen.summary.cancelledCount).toBe(1);
    expect(screen.summary.staffCreatedCount).toBe(1);
    expect(screen.summary.lateCancelledCount).toBe(1);
    expect(screen.summary.visibleCount).toBe(1);
    expect(screen.summaryLabel).toBe("Showing 1 of 3 bookings for Strength Foundations");
    expect(screen.rows[0]).toMatchObject({
      memberName: "Taylor Member",
      statusLabel: "Waitlisted",
      sourceLabel: "Member",
      waitlistLabel: "Waitlist #1",
      lateFeeLabel: "No late fee"
    });
    expect(screen.rows[0]?.actions.map((action) => action.href)).toEqual([
      "/members/member-2",
      "/bookings/booking-2/cancel"
    ]);
    expect(screen.createBookingAction.disabled).toBe(false);
    expect(screen.empty).toBeUndefined();
  });

  it("builds a read-only empty state when no bookings match", () => {
    const screen = buildBookingListPage({
      session: buildSession(),
      bookings: buildBookings(),
      members: buildMembers(),
      permissions: [Permission.BookingRead],
      filters: {
        query: "missing",
        status: BookingStatus.Booked
      }
    });

    expect(screen.rowCount).toBe(0);
    expect(screen.activeFilterCount).toBe(2);
    expect(screen.empty).toMatchObject({
      title: "No bookings match your filters",
      body: "Adjust the booking filters and try again."
    });
    expect(screen.createBookingAction.disabled).toBe(true);
    expect(screen.table.empty?.title).toBe("No bookings match your filters");
  });

  it("builds a booking detail page with section metadata", () => {
    const detail = buildBookingDetailPage({
      session: buildSession(),
      booking: buildBookings()[2]!,
      members: buildMembers(),
      permissions: [Permission.BookingRead, Permission.BookingWrite]
    });

    expect(detail.screen).toBe("booking_detail");
    expect(detail.memberName).toBe("Jordan Member");
    expect(detail.contactLabel).toBe("jordan@example.com");
    expect(detail.statusLabel).toBe("Cancelled");
    expect(detail.sourceLabel).toBe("Member");
    expect(detail.waitlistLabel).toBe("Booked");
    expect(detail.lateFeeLabel).toBe("$15.00");
    expect(detail.overrideLabel).toBe("Standard booking");
    expect(detail.sectionCount).toBe(3);
    expect(detail.actionCount).toBe(3);
    expect(detail.summaryLabel).toBe("Jordan Member is cancelled for Strength Foundations");
    expect(detail.sections[2]?.details).toEqual(
      expect.arrayContaining([
        { key: "late_fee", label: "Late fee", value: "$15.00" },
        {
          key: "cancellation_reason",
          label: "Cancellation reason",
          value: "No cancellation reason"
        }
      ])
    );
    expect(detail.actions.map((action) => action.href)).toEqual([
      "/classes/session-1/bookings",
      "/members/member-3",
      "/bookings/booking-3/cancel"
    ]);
    expect(detail.actions[2]?.button.disabled).toBe(true);
  });

  it("builds a booking cancel flow with ready and blocked states", () => {
    const ready = buildBookingCancelScreen({
      session: buildSession(),
      booking: buildBookings()[1]!,
      members: buildMembers(),
      permissions: [Permission.BookingRead, Permission.BookingWrite]
    });
    const blocked = buildBookingCancelScreen({
      session: buildSession(),
      booking: buildBookings()[2]!,
      members: buildMembers(),
      permissions: [Permission.BookingRead]
    });

    expect(ready.screen).toBe("booking_cancel");
    expect(ready.canCancel).toBe(true);
    expect(ready.memberName).toBe("Taylor Member");
    expect(ready.statusLabel).toBe("Waitlisted");
    expect(ready.waitlistLabel).toBe("Waitlist #1");
    expect(ready.lateFeeLabel).toBe("No late fee");
    expect(ready.cancelAction.disabled).toBe(false);
    expect(ready.confirmation.confirmDisabled).toBe(false);
    expect(ready.summaryLabel).toBe("Cancel Taylor Member for Strength Foundations");

    expect(blocked.canCancel).toBe(false);
    expect(blocked.blockedReason).toBe("You do not have permission to cancel bookings.");
    expect(blocked.cancelAction.disabled).toBe(true);
    expect(blocked.confirmation.confirmDisabled).toBe(true);
  });

  it("builds a staff manual booking screen with override metadata", () => {
    const screen = buildStaffManualBookingScreen({
      session: { ...buildSession(), capacity: 1 },
      bookings: buildBookings(),
      members: buildMembers(),
      permissions: [Permission.BookingRead, Permission.BookingWrite],
      memberId: "member-4",
      overrideCapacity: true,
      overrideReason: "Manager approved overflow spot."
    });

    expect(screen.screen).toBe("staff_manual_booking");
    expect(screen.selectedMemberId).toBe("member-4");
    expect(screen.memberOptionCount).toBe(4);
    expect(screen.overrideOptionCount).toBe(3);
    expect(screen.selectedOverrideCount).toBe(1);
    expect(screen.bookedCount).toBe(1);
    expect(screen.waitlistedCount).toBe(1);
    expect(screen.activeBookingCount).toBe(2);
    expect(screen.capacityReached).toBe(true);
    expect(screen.canSubmit).toBe(true);
    expect(screen.summaryLabel).toBe("Create a staff booking for Morgan Member in Strength Foundations");
    expect(screen.memberOptions[0]).toMatchObject({
      value: "member-1",
      disabled: true,
      detailLabel: "Already booked"
    });
    expect(screen.overrideReasonField.required).toBe(true);
    expect(screen.overrideReasonField.error).toBeUndefined();
    expect(screen.action.disabled).toBe(false);
  });

  it("blocks staff manual booking for duplicate members and missing override reasons", () => {
    const duplicate = buildStaffManualBookingScreen({
      session: buildSession(),
      bookings: buildBookings(),
      members: buildMembers(),
      permissions: [Permission.BookingRead, Permission.BookingWrite],
      memberId: "member-2"
    });
    const missingReason = buildStaffManualBookingScreen({
      session: { ...buildSession(), capacity: 1 },
      bookings: buildBookings(),
      members: buildMembers(),
      permissions: [Permission.BookingRead, Permission.BookingWrite],
      memberId: "member-4",
      overrideCapacity: true
    });

    expect(duplicate.canSubmit).toBe(false);
    expect(duplicate.blockedReason).toBe(
      "Member already has an active booking or waitlist spot for this session."
    );

    expect(missingReason.canSubmit).toBe(false);
    expect(missingReason.blockedReason).toBe(
      "An override reason is required when staff override flags are enabled."
    );
    expect(missingReason.overrideReasonField.error).toBe(
      "Enter an override reason when staff override flags are enabled."
    );
    expect(missingReason.action.disabled).toBe(true);
  });

  it("creates a normalized staff manual booking submission", () => {
    expect(
      createStaffManualBookingSubmission({
        memberId: " member-4 ",
        overrideCapacity: true,
        overrideEligibility: false,
        overridePlanLimit: true,
        overrideReason: "  Manager approved overflow and plan-limit exception.  "
      })
    ).toEqual({
      memberId: "member-4",
      overrideCapacity: true,
      overrideEligibility: false,
      overridePlanLimit: true,
      overrideReason: "Manager approved overflow and plan-limit exception."
    });

    expect(
      createStaffManualBookingSubmission({
        memberId: "member-4"
      })
    ).toEqual({
      memberId: "member-4",
      overrideCapacity: false,
      overrideEligibility: false,
      overridePlanLimit: false
    });
  });

  it("builds a waitlist entry screen when the class is full", () => {
    const screen = buildWaitlistEntryScreen({
      session: { ...buildSession(), capacity: 1, waitlistCapacity: 3 },
      bookings: buildBookings(),
      members: buildMembers(),
      permissions: [Permission.BookingRead, Permission.BookingWrite],
      memberId: "member-4"
    });

    expect(screen.screen).toBe("booking_waitlist_entry");
    expect(screen.selectedMemberId).toBe("member-4");
    expect(screen.memberOptionCount).toBe(4);
    expect(screen.bookedCount).toBe(1);
    expect(screen.waitlistedCount).toBe(1);
    expect(screen.nextPosition).toBe(2);
    expect(screen.capacityAvailable).toBe(false);
    expect(screen.waitlistFull).toBe(false);
    expect(screen.canSubmit).toBe(true);
    expect(screen.summaryLabel).toBe("Add Morgan Member to the waitlist for Strength Foundations");
    expect(screen.memberOptions[1]).toMatchObject({
      value: "member-2",
      disabled: true,
      detailLabel: "Already waitlisted at position 1"
    });
    expect(screen.action.disabled).toBe(false);
  });

  it("blocks waitlist entry when capacity is available or the member already has a spot", () => {
    const capacityAvailable = buildWaitlistEntryScreen({
      session: { ...buildSession(), capacity: 3, waitlistCapacity: 3 },
      bookings: buildBookings(),
      members: buildMembers(),
      permissions: [Permission.BookingRead, Permission.BookingWrite],
      memberId: "member-4"
    });
    const duplicate = buildWaitlistEntryScreen({
      session: { ...buildSession(), capacity: 1, waitlistCapacity: 3 },
      bookings: buildBookings(),
      members: buildMembers(),
      permissions: [Permission.BookingRead, Permission.BookingWrite],
      memberId: "member-2"
    });

    expect(capacityAvailable.canSubmit).toBe(false);
    expect(capacityAvailable.blockedReason).toBe("Class session still has booking capacity.");

    expect(duplicate.canSubmit).toBe(false);
    expect(duplicate.blockedReason).toBe(
      "Member already has an active booking or waitlist spot for this session."
    );
    expect(duplicate.action.disabled).toBe(true);
  });

  it("creates a normalized waitlist entry submission", () => {
    expect(
      createWaitlistEntrySubmission({
        memberId: " member-4 "
      })
    ).toEqual({
      memberId: "member-4"
    });
  });

  it("builds a leave-waitlist flow with ready and blocked states", () => {
    const ready = buildLeaveWaitlistScreen({
      session: buildSession(),
      booking: buildBookings()[1]!,
      members: buildMembers(),
      permissions: [Permission.BookingRead, Permission.BookingWrite]
    });
    const blocked = buildLeaveWaitlistScreen({
      session: buildSession(),
      booking: buildBookings()[0]!,
      members: buildMembers(),
      permissions: [Permission.BookingRead]
    });

    expect(ready.screen).toBe("booking_leave_waitlist");
    expect(ready.canLeave).toBe(true);
    expect(ready.memberName).toBe("Taylor Member");
    expect(ready.statusLabel).toBe("Waitlisted");
    expect(ready.waitlistLabel).toBe("Waitlist #1");
    expect(ready.leaveAction.disabled).toBe(false);
    expect(ready.confirmation.confirmDisabled).toBe(false);
    expect(ready.summaryLabel).toBe("Remove Taylor Member from the waitlist for Strength Foundations");

    expect(blocked.canLeave).toBe(false);
    expect(blocked.blockedReason).toBe("You do not have permission to manage the waitlist.");
    expect(blocked.leaveAction.disabled).toBe(true);
    expect(blocked.confirmation.confirmDisabled).toBe(true);
  });
});

function buildSession(): BookingSessionView {
  return {
    id: "session-1",
    className: "Strength Foundations",
    locationName: "Main Floor",
    startsAt: "2026-05-20T14:00:00.000Z",
    endsAt: "2026-05-20T15:00:00.000Z",
    capacity: 12,
    waitlistCapacity: 3
  };
}

function buildMembers(): BookingMemberView[] {
  return [
    {
      id: "member-1",
      firstName: "Jamie",
      lastName: "Member",
      email: "jamie@example.com",
      barcode: "MEM-1"
    },
    {
      id: "member-2",
      firstName: "Taylor",
      lastName: "Member",
      email: "taylor@example.com",
      barcode: "MEM-2"
    },
    {
      id: "member-3",
      firstName: "Jordan",
      lastName: "Member",
      email: "jordan@example.com",
      barcode: "MEM-3"
    },
    {
      id: "member-4",
      firstName: "Morgan",
      lastName: "Member",
      email: "morgan@example.com",
      barcode: "MEM-4"
    }
  ];
}

function buildBookings(): ClassBookingView[] {
  return [
    {
      id: "booking-1",
      classSessionId: "session-1",
      memberId: "member-1",
      status: BookingStatus.Booked,
      source: BookingSource.Staff,
      bookedAt: "2026-05-18T10:00:00.000Z",
      isLateCancellation: false,
      lateCancellationFeeCents: 0,
      staffOverride: true,
      overrideReason: "Approved by manager"
    },
    {
      id: "booking-2",
      classSessionId: "session-1",
      memberId: "member-2",
      status: BookingStatus.Waitlisted,
      waitlistPosition: 1,
      source: BookingSource.Member,
      bookedAt: "2026-05-18T10:05:00.000Z",
      isLateCancellation: false,
      lateCancellationFeeCents: 0,
      staffOverride: false
    },
    {
      id: "booking-3",
      classSessionId: "session-1",
      memberId: "member-3",
      status: BookingStatus.Cancelled,
      source: BookingSource.Member,
      bookedAt: "2026-05-18T10:10:00.000Z",
      cancelledAt: "2026-05-19T10:10:00.000Z",
      isLateCancellation: true,
      lateCancellationFeeCents: 1500,
      staffOverride: false
    }
  ];
}
