import { BookingStatus, Permission } from "@gym-platform/constants";
import type { StaffManualBookingInput } from "@gym-platform/validation";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import {
  type BookingMemberView,
  type BookingSessionView,
  bookingStatusLabel,
  memberName,
  type ClassBookingView
} from "./list.js";

export interface StaffManualBookingMemberOption {
  value: string;
  label: string;
  detailLabel: string;
  selected: boolean;
  disabled: boolean;
}

export interface StaffManualBookingOverrideOption {
  key: "overrideCapacity" | "overrideEligibility" | "overridePlanLimit";
  label: string;
  description: string;
  selected: boolean;
}

export interface StaffManualBookingScreen {
  screen: "staff_manual_booking";
  session: BookingSessionView;
  memberOptions: StaffManualBookingMemberOption[];
  selectedMemberId?: string;
  memberOptionCount: number;
  overrideOptions: StaffManualBookingOverrideOption[];
  overrideOptionCount: number;
  selectedOverrideCount: number;
  overrideReasonField: InputModel;
  bookedCount: number;
  waitlistedCount: number;
  activeBookingCount: number;
  capacityReached: boolean;
  canSubmit: boolean;
  summaryLabel: string;
  action: ButtonModel;
  cancelAction: ButtonModel;
  blockedReason?: string;
}

export function buildStaffManualBookingScreen(inputModel: {
  session: BookingSessionView;
  bookings: ClassBookingView[];
  members: BookingMemberView[];
  permissions: string[];
  memberId?: string;
  overrideCapacity?: boolean;
  overrideEligibility?: boolean;
  overridePlanLimit?: boolean;
  overrideReason?: string;
}): StaffManualBookingScreen {
  const canWriteBookings = inputModel.permissions.includes(Permission.BookingWrite);
  const selectedMemberId = normalizeText(inputModel.memberId);
  const overrideCapacity = inputModel.overrideCapacity ?? false;
  const overrideEligibility = inputModel.overrideEligibility ?? false;
  const overridePlanLimit = inputModel.overridePlanLimit ?? false;
  const overrideReason = normalizeText(inputModel.overrideReason);
  const memberOptions = buildMemberOptions(inputModel.members, inputModel.bookings, selectedMemberId);
  const overrideOptions = buildOverrideOptions({
    overrideCapacity,
    overrideEligibility,
    overridePlanLimit
  });
  const bookedCount = countByStatus(inputModel.bookings, BookingStatus.Booked);
  const waitlistedCount = countByStatus(inputModel.bookings, BookingStatus.Waitlisted);
  const activeBookingCount = bookedCount + waitlistedCount;
  const capacityReached = bookedCount >= inputModel.session.capacity;
  const blockedReason = resolveBlockedReason(
    {
      canWriteBookings,
      selectedMemberId,
      memberOptions,
      capacityReached,
      overrideCapacity,
      overrideEligibility,
      overridePlanLimit,
      overrideReason
    }
  );
  const canSubmit = !blockedReason;

  return {
    screen: "staff_manual_booking",
    session: inputModel.session,
    memberOptions,
    ...(selectedMemberId ? { selectedMemberId } : {}),
    memberOptionCount: memberOptions.length,
    overrideOptions,
    overrideOptionCount: overrideOptions.length,
    selectedOverrideCount: overrideOptions.filter((option) => option.selected).length,
    overrideReasonField: input({
      name: "overrideReason",
      label: "Override reason",
      value: overrideReason,
      type: "text",
      required: overrideCapacity || overrideEligibility || overridePlanLimit,
      ...(requiresOverrideReason({
        overrideCapacity,
        overrideEligibility,
        overridePlanLimit,
        overrideReason
      })
        ? { error: "Enter an override reason when staff override flags are enabled." }
        : {})
    }),
    bookedCount,
    waitlistedCount,
    activeBookingCount,
    capacityReached,
    canSubmit,
    summaryLabel: buildSummaryLabel(inputModel.members, selectedMemberId, inputModel.session.className),
    action: button({ label: "Create booking", icon: "calendar-plus", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" }),
    ...(blockedReason ? { blockedReason } : {})
  };
}

export function createStaffManualBookingSubmission(inputModel: {
  memberId: string;
  overrideCapacity?: boolean;
  overrideEligibility?: boolean;
  overridePlanLimit?: boolean;
  overrideReason?: string;
}): StaffManualBookingInput {
  const memberId = normalizeText(inputModel.memberId);
  const overrideCapacity = inputModel.overrideCapacity ?? false;
  const overrideEligibility = inputModel.overrideEligibility ?? false;
  const overridePlanLimit = inputModel.overridePlanLimit ?? false;
  const overrideReason = normalizeText(inputModel.overrideReason);

  return {
    memberId,
    overrideCapacity,
    overrideEligibility,
    overridePlanLimit,
    ...(overrideCapacity || overrideEligibility || overridePlanLimit
      ? overrideReason
        ? { overrideReason }
        : {}
      : {})
  };
}

function buildMemberOptions(
  members: BookingMemberView[],
  bookings: ClassBookingView[],
  selectedMemberId: string
): StaffManualBookingMemberOption[] {
  const activeBookings = bookings.filter((booking) => booking.status !== BookingStatus.Cancelled);
  return members.map((member) => {
    const activeBooking = activeBookings.find((booking) => booking.memberId === member.id);
    return {
      value: member.id,
      label: memberName(member, member.id),
      detailLabel: activeBooking
        ? `Already ${bookingStatusLabel(activeBooking.status).toLowerCase()}`
        : member.email ?? member.phone ?? member.barcode ?? "No contact",
      selected: member.id === selectedMemberId,
      disabled: Boolean(activeBooking)
    };
  });
}

function buildOverrideOptions(inputModel: {
  overrideCapacity: boolean;
  overrideEligibility: boolean;
  overridePlanLimit: boolean;
}): StaffManualBookingOverrideOption[] {
  return [
    {
      key: "overrideCapacity",
      label: "Override capacity",
      description: "Book the member even when the class session is full.",
      selected: inputModel.overrideCapacity
    },
    {
      key: "overrideEligibility",
      label: "Override eligibility",
      description: "Bypass membership eligibility checks for this booking.",
      selected: inputModel.overrideEligibility
    },
    {
      key: "overridePlanLimit",
      label: "Override plan limit",
      description: "Ignore class access limits on the member's plan.",
      selected: inputModel.overridePlanLimit
    }
  ];
}

function resolveBlockedReason(inputModel: {
  canWriteBookings: boolean;
  selectedMemberId: string;
  memberOptions: StaffManualBookingMemberOption[];
  capacityReached: boolean;
  overrideCapacity: boolean;
  overrideEligibility: boolean;
  overridePlanLimit: boolean;
  overrideReason: string;
}) {
  if (!inputModel.canWriteBookings) {
    return "You do not have permission to create bookings.";
  }
  if (!inputModel.selectedMemberId) {
    return "Select a member to create a staff booking.";
  }
  const selectedMember = inputModel.memberOptions.find((option) => option.value === inputModel.selectedMemberId);
  if (!selectedMember) {
    return "Select a valid member to create a staff booking.";
  }
  if (selectedMember.disabled) {
    return "Member already has an active booking or waitlist spot for this session.";
  }
  if (inputModel.capacityReached && !inputModel.overrideCapacity) {
    return "Class session is full. Enable a capacity override to book anyway.";
  }
  if (
    requiresOverrideReason({
      overrideCapacity: inputModel.overrideCapacity,
      overrideEligibility: inputModel.overrideEligibility,
      overridePlanLimit: inputModel.overridePlanLimit,
      overrideReason: inputModel.overrideReason
    })
  ) {
    return "An override reason is required when staff override flags are enabled.";
  }
  return undefined;
}

function requiresOverrideReason(inputModel: {
  overrideCapacity: boolean;
  overrideEligibility: boolean;
  overridePlanLimit: boolean;
  overrideReason: string;
}) {
  return (
    (inputModel.overrideCapacity || inputModel.overrideEligibility || inputModel.overridePlanLimit) &&
    !inputModel.overrideReason
  );
}

function buildSummaryLabel(
  members: BookingMemberView[],
  selectedMemberId: string,
  className: string
) {
  if (!selectedMemberId) {
    return `Create a staff booking for ${className}`;
  }
  const selectedMember = members.find((member) => member.id === selectedMemberId);
  return `Create a staff booking for ${memberName(selectedMember, selectedMemberId)} in ${className}`;
}

function countByStatus(bookings: ClassBookingView[], status: BookingStatus) {
  return bookings.filter((booking) => booking.status === status).length;
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}
