import { BookingStatus, Permission } from "@gym-platform/constants";
import type { ClassBookingCreateInput } from "@gym-platform/validation";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import { type BookingMemberView, memberName, type BookingSessionView, type ClassBookingView } from "./list.js";

export interface WaitlistMemberOption {
  value: string;
  label: string;
  detailLabel: string;
  selected: boolean;
  disabled: boolean;
}

export interface WaitlistEntryScreen {
  screen: "booking_waitlist_entry";
  session: BookingSessionView;
  memberOptions: WaitlistMemberOption[];
  selectedMemberId?: string;
  memberOptionCount: number;
  bookedCount: number;
  waitlistedCount: number;
  nextPosition?: number;
  capacityAvailable: boolean;
  waitlistFull: boolean;
  canSubmit: boolean;
  summaryLabel: string;
  action: ButtonModel;
  cancelAction: ButtonModel;
  blockedReason?: string;
}

export function buildWaitlistEntryScreen(inputModel: {
  session: BookingSessionView;
  bookings: ClassBookingView[];
  members: BookingMemberView[];
  permissions: string[];
  memberId?: string;
}): WaitlistEntryScreen {
  const canWriteBookings = inputModel.permissions.includes(Permission.BookingWrite);
  const selectedMemberId = normalizeText(inputModel.memberId);
  const bookedCount = countByStatus(inputModel.bookings, BookingStatus.Booked);
  const waitlistedCount = countByStatus(inputModel.bookings, BookingStatus.Waitlisted);
  const capacityAvailable = bookedCount < inputModel.session.capacity;
  const waitlistFull = waitlistedCount >= inputModel.session.waitlistCapacity;
  const memberOptions = buildMemberOptions(inputModel.members, inputModel.bookings, selectedMemberId);
  const blockedReason = resolveBlockedReason({
    canWriteBookings,
    selectedMemberId,
    memberOptions,
    capacityAvailable,
    waitlistFull
  });
  const canSubmit = !blockedReason;

  return {
    screen: "booking_waitlist_entry",
    session: inputModel.session,
    memberOptions,
    ...(selectedMemberId ? { selectedMemberId } : {}),
    memberOptionCount: memberOptions.length,
    bookedCount,
    waitlistedCount,
    ...(!capacityAvailable && !waitlistFull ? { nextPosition: waitlistedCount + 1 } : {}),
    capacityAvailable,
    waitlistFull,
    canSubmit,
    summaryLabel: buildSummaryLabel(inputModel.members, selectedMemberId, inputModel.session.className),
    action: button({ label: "Join waitlist", icon: "list-plus", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" }),
    ...(blockedReason ? { blockedReason } : {})
  };
}

export function createWaitlistEntrySubmission(inputModel: { memberId: string }): ClassBookingCreateInput {
  return {
    memberId: normalizeText(inputModel.memberId)
  };
}

function buildMemberOptions(
  members: BookingMemberView[],
  bookings: ClassBookingView[],
  selectedMemberId: string
): WaitlistMemberOption[] {
  const activeBookings = bookings.filter((booking) => booking.status !== BookingStatus.Cancelled);
  return members.map((member) => {
    const activeBooking = activeBookings.find((booking) => booking.memberId === member.id);
    return {
      value: member.id,
      label: memberName(member, member.id),
      detailLabel: activeBooking
        ? activeBooking.status === BookingStatus.Waitlisted
          ? `Already waitlisted at position ${activeBooking.waitlistPosition ?? "?"}`
          : "Already booked"
        : member.email ?? member.phone ?? member.barcode ?? "No contact",
      selected: member.id === selectedMemberId,
      disabled: Boolean(activeBooking)
    };
  });
}

function resolveBlockedReason(inputModel: {
  canWriteBookings: boolean;
  selectedMemberId: string;
  memberOptions: WaitlistMemberOption[];
  capacityAvailable: boolean;
  waitlistFull: boolean;
}) {
  if (!inputModel.canWriteBookings) {
    return "You do not have permission to manage the waitlist.";
  }
  if (inputModel.capacityAvailable) {
    return "Class session still has booking capacity.";
  }
  if (inputModel.waitlistFull) {
    return "Class waitlist is full.";
  }
  if (!inputModel.selectedMemberId) {
    return "Select a member to add to the waitlist.";
  }
  const selectedMember = inputModel.memberOptions.find((option) => option.value === inputModel.selectedMemberId);
  if (!selectedMember) {
    return "Select a valid member to add to the waitlist.";
  }
  if (selectedMember.disabled) {
    return "Member already has an active booking or waitlist spot for this session.";
  }
  return undefined;
}

function buildSummaryLabel(
  members: BookingMemberView[],
  selectedMemberId: string,
  className: string
) {
  if (!selectedMemberId) {
    return `Add a member to the waitlist for ${className}`;
  }
  const selectedMember = members.find((member) => member.id === selectedMemberId);
  return `Add ${memberName(selectedMember, selectedMemberId)} to the waitlist for ${className}`;
}

function countByStatus(bookings: ClassBookingView[], status: BookingStatus) {
  return bookings.filter((booking) => booking.status === status).length;
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}
