import { BookingStatus, Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  buildDashboardConfirmationModal,
  type DashboardConfirmationModal
} from "../shell/index.js";
import {
  type BookingMemberView,
  type BookingSessionView,
  bookingStatusLabel,
  memberName,
  type ClassBookingView
} from "./list.js";

export interface BookingCancelScreen {
  screen: "booking_cancel";
  session: BookingSessionView;
  booking: ClassBookingView;
  canCancel: boolean;
  memberName: string;
  statusLabel: string;
  waitlistLabel: string;
  lateFeeLabel: string;
  cancelAction: ButtonModel;
  keepAction: ButtonModel;
  confirmation: DashboardConfirmationModal;
  summaryLabel: string;
  blockedReason?: string;
}

export function buildBookingCancelScreen(inputModel: {
  session: BookingSessionView;
  booking: ClassBookingView;
  members: BookingMemberView[];
  permissions: string[];
  confirmOpen?: boolean;
}): BookingCancelScreen {
  const canWriteBookings = inputModel.permissions.includes(Permission.BookingWrite);
  const member = inputModel.members.find((entry) => entry.id === inputModel.booking.memberId);
  const resolvedMemberName = memberName(member, inputModel.booking.memberId);
  const statusLabel = bookingStatusLabel(inputModel.booking.status);
  const waitlistLabel =
    inputModel.booking.status === BookingStatus.Waitlisted
      ? `Waitlist #${inputModel.booking.waitlistPosition ?? "?"}`
      : inputModel.booking.promotedAt
        ? "Promoted booking"
        : "Booked";
  const lateFeeLabel =
    inputModel.booking.isLateCancellation && inputModel.booking.lateCancellationFeeCents > 0
      ? formatCurrency(inputModel.booking.lateCancellationFeeCents)
      : "No late fee";
  const blockedReason = resolveBlockedReason(inputModel.booking.status, canWriteBookings);
  const canCancel = !blockedReason;

  return {
    screen: "booking_cancel",
    session: inputModel.session,
    booking: inputModel.booking,
    canCancel,
    memberName: resolvedMemberName,
    statusLabel,
    waitlistLabel,
    lateFeeLabel,
    cancelAction: button({
      label: "Cancel booking",
      icon: "calendar-x",
      intent: "danger",
      disabled: !canCancel
    }),
    keepAction: button({
      label: "Keep booking",
      icon: "arrow-left",
      intent: "secondary"
    }),
    confirmation: buildDashboardConfirmationModal({
      title: "Cancel booking",
      body: `Cancel ${resolvedMemberName}'s booking for ${inputModel.session.className}? Waitlist promotion and late-fee rules may apply.`,
      open: inputModel.confirmOpen ?? true,
      confirmLabel: "Cancel booking",
      cancelLabel: "Keep booking",
      intent: "danger",
      destructive: true,
      confirmDisabled: !canCancel
    }),
    summaryLabel: blockedReason
      ? blockedReason
      : `Cancel ${resolvedMemberName} for ${inputModel.session.className}`,
    ...(blockedReason ? { blockedReason } : {})
  };
}

function resolveBlockedReason(status: BookingStatus, canWriteBookings: boolean) {
  if (!canWriteBookings) {
    return "You do not have permission to cancel bookings.";
  }
  if (status === BookingStatus.Cancelled) {
    return "Booking is already cancelled.";
  }
  return undefined;
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
