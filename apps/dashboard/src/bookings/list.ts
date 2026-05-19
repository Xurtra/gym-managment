import { BookingSource, BookingStatus, Permission } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";

export interface BookingMemberView {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  barcode?: string;
}

export interface BookingSessionView {
  id: string;
  className: string;
  locationName: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  waitlistCapacity: number;
}

export interface ClassBookingView {
  id: string;
  classSessionId: string;
  memberId: string;
  status: BookingStatus;
  waitlistPosition?: number;
  source: BookingSource;
  bookedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  isLateCancellation: boolean;
  lateCancellationFeeCents: number;
  staffOverride: boolean;
  overrideReason?: string;
  promotedAt?: string;
}

export interface BookingListFilters {
  query?: string;
  status?: BookingStatus;
}

export interface BookingListStatusOption {
  value: BookingStatus;
  label: string;
  selected: boolean;
}

export interface BookingListAction {
  key: "view_member" | "cancel_booking";
  button: ButtonModel;
  href: string;
}

export interface BookingListRow extends ClassBookingView {
  memberName: string;
  contactLabel: string;
  statusLabel: string;
  sourceLabel: string;
  waitlistLabel: string;
  lateFeeLabel: string;
  overrideLabel: string;
  actions: BookingListAction[];
}

export interface BookingListSummary {
  totalCount: number;
  bookedCount: number;
  waitlistedCount: number;
  cancelledCount: number;
  staffCreatedCount: number;
  lateCancelledCount: number;
  visibleCount: number;
}

export interface BookingListPage {
  screen: "booking_list";
  session: BookingSessionView;
  filters: Required<Pick<BookingListFilters, "query">> & Omit<BookingListFilters, "query">;
  searchField: InputModel;
  statusOptions: BookingListStatusOption[];
  summary: BookingListSummary;
  summaryLabel: string;
  rowCount: number;
  activeFilterCount: number;
  statusOptionCount: number;
  rows: BookingListRow[];
  table: TableModel<BookingListRow>;
  empty?: EmptyStateModel;
  createBookingAction: ButtonModel;
}

export function buildBookingListPage(inputModel: {
  session: BookingSessionView;
  bookings: ClassBookingView[];
  members: BookingMemberView[];
  permissions: string[];
  filters?: BookingListFilters;
}): BookingListPage {
  const query = normalizeText(inputModel.filters?.query).toLowerCase();
  const filters: BookingListPage["filters"] = {
    query,
    ...(inputModel.filters?.status ? { status: inputModel.filters.status } : {})
  };
  const canWriteBookings = inputModel.permissions.includes(Permission.BookingWrite);
  const memberMap = new Map(inputModel.members.map((member) => [member.id, member]));
  const statusOptions = Object.values(BookingStatus).map((status) => ({
    value: status,
    label: bookingStatusLabel(status),
    selected: status === filters.status
  }));
  const rows = inputModel.bookings
    .filter((booking) => matchesFilters(booking, memberMap, filters))
    .sort(compareBookings)
    .map((booking) => buildBookingRow(booking, memberMap, canWriteBookings));
  const empty =
    rows.length === 0
      ? emptyState({
          title: hasActiveFilters(filters) ? "No bookings match your filters" : "No bookings",
          body: hasActiveFilters(filters)
            ? "Adjust the booking filters and try again."
            : "Bookings and waitlist spots for this class session will appear here."
        })
      : undefined;

  return {
    screen: "booking_list",
    session: inputModel.session,
    filters,
    searchField: input({
      name: "bookingSearch",
      label: "Search bookings",
      value: query,
      type: "text",
      required: false
    }),
    statusOptions,
    summary: buildSummary(inputModel.bookings, rows.length),
    summaryLabel: `Showing ${rows.length} of ${inputModel.bookings.length} booking${
      inputModel.bookings.length === 1 ? "" : "s"
    } for ${inputModel.session.className}`,
    rowCount: rows.length,
    activeFilterCount: countActiveFilters(filters),
    statusOptionCount: statusOptions.length,
    rows,
    table: table({
      columns: [
        { key: "memberName", label: "Member" },
        { key: "statusLabel", label: "Status" },
        { key: "sourceLabel", label: "Source" },
        { key: "waitlistLabel", label: "Queue" },
        { key: "lateFeeLabel", label: "Late fee" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    createBookingAction: button({
      label: "Create booking",
      icon: "calendar-plus",
      disabled: !canWriteBookings
    })
  };
}

function buildBookingRow(
  booking: ClassBookingView,
  memberMap: Map<string, BookingMemberView>,
  canWriteBookings: boolean
): BookingListRow {
  const member = memberMap.get(booking.memberId);
  return {
    ...booking,
    memberName: memberName(member, booking.memberId),
    contactLabel: member?.email ?? member?.phone ?? member?.barcode ?? "No contact",
    statusLabel: bookingStatusLabel(booking.status),
    sourceLabel: bookingSourceLabel(booking.source),
    waitlistLabel:
      booking.status === BookingStatus.Waitlisted
        ? `Waitlist #${booking.waitlistPosition ?? "?"}`
        : booking.promotedAt
          ? "Promoted"
          : "Booked",
    lateFeeLabel:
      booking.isLateCancellation && booking.lateCancellationFeeCents > 0
        ? formatCurrency(booking.lateCancellationFeeCents)
        : "No late fee",
    overrideLabel: booking.staffOverride ? booking.overrideReason ?? "Staff override" : "Standard",
    actions: [
      {
        key: "view_member",
        href: `/members/${booking.memberId}`,
        button: button({ label: "View member", icon: "eye", intent: "secondary" })
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
    ]
  };
}

function buildSummary(bookings: ClassBookingView[], visibleCount: number): BookingListSummary {
  return {
    totalCount: bookings.length,
    bookedCount: countByStatus(bookings, BookingStatus.Booked),
    waitlistedCount: countByStatus(bookings, BookingStatus.Waitlisted),
    cancelledCount: countByStatus(bookings, BookingStatus.Cancelled),
    staffCreatedCount: bookings.filter((booking) => booking.source === BookingSource.Staff).length,
    lateCancelledCount: bookings.filter((booking) => booking.isLateCancellation).length,
    visibleCount
  };
}

function matchesFilters(
  booking: ClassBookingView,
  memberMap: Map<string, BookingMemberView>,
  filters: BookingListPage["filters"]
) {
  if (filters.status && booking.status !== filters.status) {
    return false;
  }
  if (!filters.query) {
    return true;
  }
  const member = memberMap.get(booking.memberId);
  return [
    member?.firstName,
    member?.lastName,
    member?.email,
    member?.phone,
    member?.barcode,
    bookingStatusLabel(booking.status),
    bookingSourceLabel(booking.source)
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(filters.query));
}

function compareBookings(left: ClassBookingView, right: ClassBookingView) {
  return (
    bookingStatusSort(left.status) - bookingStatusSort(right.status) ||
    left.bookedAt.localeCompare(right.bookedAt) ||
    left.id.localeCompare(right.id)
  );
}

function bookingStatusSort(status: BookingStatus) {
  return {
    [BookingStatus.Booked]: 0,
    [BookingStatus.Waitlisted]: 1,
    [BookingStatus.Cancelled]: 2
  }[status];
}

export function bookingStatusLabel(status: BookingStatus) {
  return {
    [BookingStatus.Booked]: "Booked",
    [BookingStatus.Waitlisted]: "Waitlisted",
    [BookingStatus.Cancelled]: "Cancelled"
  }[status];
}

export function bookingSourceLabel(source: BookingSource) {
  return {
    [BookingSource.Member]: "Member",
    [BookingSource.Staff]: "Staff"
  }[source];
}

function countByStatus(bookings: ClassBookingView[], status: BookingStatus) {
  return bookings.filter((booking) => booking.status === status).length;
}

export function memberName(member: BookingMemberView | undefined, fallbackId: string) {
  if (!member) {
    return fallbackId;
  }
  return `${member.firstName} ${member.lastName}`.trim() || member.email || fallbackId;
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function hasActiveFilters(filters: BookingListPage["filters"]) {
  return Boolean(filters.query || filters.status);
}

function countActiveFilters(filters: BookingListPage["filters"]) {
  return [filters.query, filters.status].filter(Boolean).length;
}
