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

export interface LeaveWaitlistScreen {
  screen: "booking_leave_waitlist";
  session: BookingSessionView;
  booking: ClassBookingView;
  canLeave: boolean;
  memberName: string;
  statusLabel: string;
  waitlistLabel: string;
  leaveAction: ButtonModel;
  keepAction: ButtonModel;
  confirmation: DashboardConfirmationModal;
  summaryLabel: string;
  blockedReason?: string;
}

export function buildLeaveWaitlistScreen(inputModel: {
  session: BookingSessionView;
  booking: ClassBookingView;
  members: BookingMemberView[];
  permissions: string[];
  confirmOpen?: boolean;
}): LeaveWaitlistScreen {
  const canWriteBookings = inputModel.permissions.includes(Permission.BookingWrite);
  const member = inputModel.members.find((entry) => entry.id === inputModel.booking.memberId);
  const resolvedMemberName = memberName(member, inputModel.booking.memberId);
  const statusLabel = bookingStatusLabel(inputModel.booking.status);
  const waitlistLabel =
    inputModel.booking.status === BookingStatus.Waitlisted
      ? `Waitlist #${inputModel.booking.waitlistPosition ?? "?"}`
      : "Not currently waitlisted";
  const blockedReason = resolveBlockedReason(inputModel.booking.status, canWriteBookings);
  const canLeave = !blockedReason;

  return {
    screen: "booking_leave_waitlist",
    session: inputModel.session,
    booking: inputModel.booking,
    canLeave,
    memberName: resolvedMemberName,
    statusLabel,
    waitlistLabel,
    leaveAction: button({
      label: "Leave waitlist",
      icon: "list-x",
      intent: "danger",
      disabled: !canLeave
    }),
    keepAction: button({
      label: "Stay on waitlist",
      icon: "arrow-left",
      intent: "secondary"
    }),
    confirmation: buildDashboardConfirmationModal({
      title: "Leave waitlist",
      body: `Remove ${resolvedMemberName} from the waitlist for ${inputModel.session.className}? Queue positions will compact for the remaining members.`,
      open: inputModel.confirmOpen ?? true,
      confirmLabel: "Leave waitlist",
      cancelLabel: "Stay on waitlist",
      intent: "danger",
      destructive: true,
      confirmDisabled: !canLeave
    }),
    summaryLabel: blockedReason
      ? blockedReason
      : `Remove ${resolvedMemberName} from the waitlist for ${inputModel.session.className}`,
    ...(blockedReason ? { blockedReason } : {})
  };
}

function resolveBlockedReason(status: BookingStatus, canWriteBookings: boolean) {
  if (!canWriteBookings) {
    return "You do not have permission to manage the waitlist.";
  }
  if (status !== BookingStatus.Waitlisted) {
    return "Only waitlisted bookings can leave the waitlist.";
  }
  return undefined;
}
