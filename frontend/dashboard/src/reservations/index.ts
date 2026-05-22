import { Permission, ReservationConfirmationMode, ReservationPaymentRequirement } from "@gym-platform/constants";
import type {
  ClassSessionResourceAllocationInput,
  FacilityReservationCancelInput,
  FacilityReservationCreateInput,
  ResourceCreateInput
} from "@gym-platform/validation";
import { button, emptyState, input, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";

export interface ResourceView {
  id: string;
  locationId: string;
  parentResourceId?: string;
  name: string;
  resourceType: string;
  status: "active" | "archived";
  isBookable: boolean;
  isExclusive: boolean;
  capacity: number;
  amenities: string[];
  pricing: { amountCents: number };
  paymentRequirement: ReservationPaymentRequirement;
  confirmationMode: ReservationConfirmationMode;
}

export interface FacilityReservationView {
  id: string;
  resourceId: string;
  memberId: string;
  status: "pending" | "confirmed" | "cancelled";
  startsAt: string;
  endsAt: string;
  amountCents: number;
  paymentRequirement: ReservationPaymentRequirement;
  paymentStatus: "not_required" | "unpaid" | "paid" | "refunded";
  cancellationFeeCents: number;
  refundAmountCents: number;
}

export interface ReservationMemberView {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface ResourceRegistryRow extends ResourceView {
  pricingLabel: string;
  bookingLabel: string;
  detailHref: string;
}

export interface ResourceRegistryScreen {
  screen: "resource_registry";
  rows: ResourceRegistryRow[];
  table: TableModel<ResourceRegistryRow>;
  empty?: EmptyStateModel;
  createAction: ButtonModel;
}

export function buildResourceRegistryScreen(inputModel: {
  resources: ResourceView[];
  permissions: string[];
  locationId?: string;
}): ResourceRegistryScreen {
  const canManage = inputModel.permissions.includes(Permission.LocationUpdate);
  const rows = inputModel.resources
    .filter((resource) => resource.status !== "archived")
    .filter((resource) => !inputModel.locationId || resource.locationId === inputModel.locationId)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((resource) => ({
      ...resource,
      pricingLabel: formatCurrency(resource.pricing.amountCents),
      bookingLabel: resource.isBookable ? (resource.isExclusive ? "Exclusive" : `Shared x${resource.capacity}`) : "Not bookable",
      detailHref: `/resources/${resource.id}`
    }));
  const empty =
    rows.length === 0
      ? emptyState({
          title: "No reservable resources",
          body: "Rooms, courts, lanes, and scarce equipment configured for reservations will appear here.",
          ...(canManage ? { action: button({ label: "Add resource", icon: "plus" }) } : {})
        })
      : undefined;
  return {
    screen: "resource_registry",
    rows,
    table: table({
      columns: [
        { key: "name", label: "Resource" },
        { key: "resourceType", label: "Type" },
        { key: "bookingLabel", label: "Booking" },
        { key: "pricingLabel", label: "Price" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    createAction: button({ label: "Add resource", icon: "plus", disabled: !canManage })
  };
}

export interface ResourceEditorScreen {
  screen: "resource_create";
  fields: {
    name: InputModel;
    resourceType: InputModel;
    amountCents: InputModel;
  };
  canSubmit: boolean;
  action: ButtonModel;
}

export function buildResourceCreateScreen(inputModel: {
  permissions: string[];
  locationId: string;
  name?: string;
  resourceType?: string;
  amountCents?: string;
}): ResourceEditorScreen {
  const canManage = inputModel.permissions.includes(Permission.LocationUpdate);
  const name = normalizeText(inputModel.name);
  const resourceType = normalizeText(inputModel.resourceType);
  const amountCents = normalizeText(inputModel.amountCents || "0");
  const canSubmit = canManage && Boolean(name && resourceType) && numberOrZero(amountCents) >= 0;
  return {
    screen: "resource_create",
    fields: {
      name: input({ name: "name", label: "Resource name", value: name, type: "text", required: true }),
      resourceType: input({ name: "resourceType", label: "Type", value: resourceType, type: "text", required: true }),
      amountCents: input({ name: "amountCents", label: "Price cents", value: amountCents, type: "text", required: true })
    },
    canSubmit,
    action: button({ label: "Create resource", icon: "plus", disabled: !canSubmit })
  };
}

export function createResourceSubmission(inputModel: {
  locationId: string;
  name: string;
  resourceType: string;
  amountCents?: string;
}): ResourceCreateInput {
  const amountCents = numberOrZero(inputModel.amountCents);
  return {
    locationId: inputModel.locationId,
    name: normalizeText(inputModel.name),
    resourceType: normalizeText(inputModel.resourceType),
    pricing: { amountCents },
    paymentRequirement: amountCents > 0 ? ReservationPaymentRequirement.PayLater : ReservationPaymentRequirement.Free
  };
}

export interface ResourceAvailabilityScreen {
  screen: "resource_availability";
  resource: ResourceView;
  allocations: Array<{ id: string; startsAt: string; endsAt: string; source: string }>;
  available: boolean;
  summaryLabel: string;
}

export function buildResourceAvailabilityScreen(inputModel: {
  resource: ResourceView;
  allocations: Array<{ id: string; startsAt: string; endsAt: string; source: string }>;
  available: boolean;
}): ResourceAvailabilityScreen {
  return {
    screen: "resource_availability",
    resource: inputModel.resource,
    allocations: inputModel.allocations,
    available: inputModel.available,
    summaryLabel: inputModel.available
      ? `${inputModel.resource.name} is available`
      : `${inputModel.resource.name} is already reserved`
  };
}

export interface FacilityReservationCreateScreen {
  screen: "facility_reservation_create";
  resourceOptions: Array<{ value: string; label: string; selected: boolean }>;
  memberOptions: Array<{ value: string; label: string; selected: boolean }>;
  fields: { startsAt: InputModel; endsAt: InputModel; note: InputModel };
  canSubmit: boolean;
  action: ButtonModel;
}

export function buildFacilityReservationCreateScreen(inputModel: {
  resources: ResourceView[];
  members: ReservationMemberView[];
  permissions: string[];
  resourceId?: string;
  memberId?: string;
  startsAt?: string;
  endsAt?: string;
  note?: string;
}): FacilityReservationCreateScreen {
  const canBook = inputModel.permissions.includes(Permission.BookingWrite);
  const resourceId = normalizeText(inputModel.resourceId);
  const memberId = normalizeText(inputModel.memberId);
  const startsAt = normalizeText(inputModel.startsAt);
  const endsAt = normalizeText(inputModel.endsAt);
  const canSubmit = canBook && Boolean(resourceId && memberId && startsAt && endsAt && endsAt > startsAt);
  return {
    screen: "facility_reservation_create",
    resourceOptions: inputModel.resources
      .filter((resource) => resource.status === "active" && resource.isBookable)
      .map((resource) => ({ value: resource.id, label: resource.name, selected: resource.id === resourceId })),
    memberOptions: inputModel.members.map((member) => ({
      value: member.id,
      label: memberName(member),
      selected: member.id === memberId
    })),
    fields: {
      startsAt: input({ name: "startsAt", label: "Starts at", value: startsAt, type: "text", required: true }),
      endsAt: input({ name: "endsAt", label: "Ends at", value: endsAt, type: "text", required: true }),
      note: input({ name: "note", label: "Note", value: normalizeText(inputModel.note), type: "text", required: false })
    },
    canSubmit,
    action: button({ label: "Create reservation", icon: "calendar-plus", disabled: !canSubmit })
  };
}

export function createFacilityReservationSubmission(inputModel: {
  resourceId: string;
  memberId: string;
  startsAt: string;
  endsAt: string;
  note?: string;
}): FacilityReservationCreateInput {
  return {
    resourceId: inputModel.resourceId,
    memberId: inputModel.memberId,
    startsAt: inputModel.startsAt,
    endsAt: inputModel.endsAt,
    overrideConflict: false,
    ...(normalizeText(inputModel.note) ? { note: normalizeText(inputModel.note) } : {})
  };
}

export interface FacilityReservationDetailScreen {
  screen: "facility_reservation_detail";
  reservation: FacilityReservationView;
  resourceName: string;
  memberName: string;
  paymentLabel: string;
  cancelAction: ButtonModel;
}

export function buildFacilityReservationDetailScreen(inputModel: {
  reservation: FacilityReservationView;
  resource?: ResourceView;
  member?: ReservationMemberView;
  permissions: string[];
}): FacilityReservationDetailScreen {
  const canCancel =
    inputModel.permissions.includes(Permission.BookingWrite) &&
    inputModel.reservation.status !== "cancelled";
  return {
    screen: "facility_reservation_detail",
    reservation: inputModel.reservation,
    resourceName: inputModel.resource?.name ?? inputModel.reservation.resourceId,
    memberName: inputModel.member ? memberName(inputModel.member) : inputModel.reservation.memberId,
    paymentLabel: `${inputModel.reservation.paymentStatus} (${formatCurrency(inputModel.reservation.amountCents)})`,
    cancelAction: button({ label: "Cancel reservation", icon: "calendar-x", intent: "danger", disabled: !canCancel })
  };
}

export function createFacilityReservationCancelSubmission(inputModel: {
  reason?: string;
}): FacilityReservationCancelInput {
  const reason = normalizeText(inputModel.reason);
  return reason ? { reason } : {};
}

export function createClassResourceAllocationSubmission(inputModel: {
  resourceId: string;
  startsAt?: string;
  endsAt?: string;
  overrideConflict?: boolean;
  overrideReason?: string;
}): ClassSessionResourceAllocationInput {
  return {
    resourceId: inputModel.resourceId,
    ...(inputModel.startsAt ? { startsAt: inputModel.startsAt } : {}),
    ...(inputModel.endsAt ? { endsAt: inputModel.endsAt } : {}),
    overrideConflict: inputModel.overrideConflict ?? false,
    ...(normalizeText(inputModel.overrideReason) ? { overrideReason: normalizeText(inputModel.overrideReason) } : {})
  };
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function numberOrZero(value: string | undefined) {
  const parsed = Number(normalizeText(value));
  return Number.isFinite(parsed) ? Math.max(Math.trunc(parsed), 0) : 0;
}

function memberName(member: ReservationMemberView) {
  return `${member.firstName} ${member.lastName}`.trim() || member.email || member.id;
}

function formatCurrency(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}
