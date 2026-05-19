import { BookingStatus, Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  type BookingMemberView,
  type BookingSessionView,
  bookingSourceLabel,
  bookingStatusLabel,
  memberName,
  type ClassBookingView
} from "./list.js";

export interface BookingDetailAction {
  key: "back_to_bookings" | "view_member" | "cancel_booking";
  button: ButtonModel;
  href: string;
}

export interface BookingDetailSectionDetail {
  key: string;
  label: string;
  value: string;
}

export interface BookingDetailSection {
  key: "member" | "booking" | "operations";
  title: string;
  details: BookingDetailSectionDetail[];
}

export interface BookingDetailPage {
  screen: "booking_detail";
  session: BookingSessionView;
  booking: ClassBookingView;
  memberName: string;
  contactLabel: string;
  statusLabel: string;
  sourceLabel: string;
  waitlistLabel: string;
  lateFeeLabel: string;
  overrideLabel: string;
  sectionCount: number;
  sections: BookingDetailSection[];
  actionCount: number;
  actions: BookingDetailAction[];
  summaryLabel: string;
}

export function buildBookingDetailPage(inputModel: {
  session: BookingSessionView;
  booking: ClassBookingView;
  members: BookingMemberView[];
  permissions: string[];
}): BookingDetailPage {
  const member = inputModel.members.find((entry) => entry.id === inputModel.booking.memberId);
  const canWriteBookings = inputModel.permissions.includes(Permission.BookingWrite);
  const derivedMemberName = memberName(member, inputModel.booking.memberId);
  const contactLabel = member?.email ?? member?.phone ?? member?.barcode ?? "No contact";
  const statusLabel = bookingStatusLabel(inputModel.booking.status);
  const sourceLabel = bookingSourceLabel(inputModel.booking.source);
  const waitlistLabel =
    inputModel.booking.status === BookingStatus.Waitlisted
      ? `Waitlist #${inputModel.booking.waitlistPosition ?? "?"}`
      : inputModel.booking.promotedAt
        ? "Promoted to booked"
        : "Booked";
  const lateFeeLabel =
    inputModel.booking.isLateCancellation && inputModel.booking.lateCancellationFeeCents > 0
      ? formatCurrency(inputModel.booking.lateCancellationFeeCents)
      : "No late fee";
  const overrideLabel = inputModel.booking.staffOverride
    ? inputModel.booking.overrideReason ?? "Staff override"
    : "Standard booking";
  const sections = buildSections(inputModel.booking, {
    memberName: derivedMemberName,
    contactLabel,
    statusLabel,
    sourceLabel,
    waitlistLabel,
    lateFeeLabel,
    overrideLabel
  });
  const actions = buildActions(inputModel.booking, canWriteBookings);

  return {
    screen: "booking_detail",
    session: inputModel.session,
    booking: inputModel.booking,
    memberName: derivedMemberName,
    contactLabel,
    statusLabel,
    sourceLabel,
    waitlistLabel,
    lateFeeLabel,
    overrideLabel,
    sectionCount: sections.length,
    sections,
    actionCount: actions.length,
    actions,
    summaryLabel: `${derivedMemberName} is ${statusLabel.toLowerCase()} for ${inputModel.session.className}`
  };
}

function buildSections(
  booking: ClassBookingView,
  labels: {
    memberName: string;
    contactLabel: string;
    statusLabel: string;
    sourceLabel: string;
    waitlistLabel: string;
    lateFeeLabel: string;
    overrideLabel: string;
  }
): BookingDetailSection[] {
  return [
    {
      key: "member",
      title: "Member",
      details: [
        { key: "member_name", label: "Member", value: labels.memberName },
        { key: "contact", label: "Contact", value: labels.contactLabel }
      ]
    },
    {
      key: "booking",
      title: "Booking",
      details: [
        { key: "status", label: "Status", value: labels.statusLabel },
        { key: "source", label: "Source", value: labels.sourceLabel },
        { key: "waitlist", label: "Queue", value: labels.waitlistLabel },
        { key: "booked_at", label: "Booked at", value: booking.bookedAt },
        {
          key: "promoted_at",
          label: "Promoted at",
          value: booking.promotedAt ?? "Not promoted"
        }
      ]
    },
    {
      key: "operations",
      title: "Operations",
      details: [
        { key: "late_fee", label: "Late fee", value: labels.lateFeeLabel },
        { key: "override", label: "Override", value: labels.overrideLabel },
        {
          key: "cancelled_at",
          label: "Cancelled at",
          value: booking.cancelledAt ?? "Not cancelled"
        },
        {
          key: "cancellation_reason",
          label: "Cancellation reason",
          value: booking.cancellationReason ?? "No cancellation reason"
        }
      ]
    }
  ];
}

function buildActions(
  booking: ClassBookingView,
  canWriteBookings: boolean
): BookingDetailAction[] {
  return [
    {
      key: "back_to_bookings",
      href: `/classes/${booking.classSessionId}/bookings`,
      button: button({
        label: "Back to bookings",
        icon: "arrow-left",
        intent: "secondary"
      })
    },
    {
      key: "view_member",
      href: `/members/${booking.memberId}`,
      button: button({
        label: "View member",
        icon: "eye",
        intent: "secondary"
      })
    },
    {
      key: "cancel_booking",
      href: `/bookings/${booking.id}/cancel`,
      button: button({
        label: "Cancel booking",
        icon: "calendar-x",
        intent: "danger",
        disabled: !canWriteBookings || booking.status === BookingStatus.Cancelled
      })
    }
  ];
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
