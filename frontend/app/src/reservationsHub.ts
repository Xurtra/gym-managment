import type {
  ClassSessionResourceAllocationInput,
  FacilityReservationCancelInput,
  FacilityReservationCreateInput
} from "@gym-platform/validation";

export interface ReservationAgendaClassInput {
  id: string;
  startsAt: string;
  endsAt: string;
  title: string;
  locationName: string;
  capacity: number;
  waitlistCapacity: number;
  status: string;
}

export interface ReservationAgendaFacilityInput {
  id: string;
  resourceId: string;
  memberId: string;
  startsAt: string;
  endsAt: string;
  resourceName: string;
  memberName: string;
  locationName: string;
  status: string;
  paymentLabel: string;
}

export interface ReservationAgendaItem {
  id: string;
  sourceId: string;
  kind: "class" | "facility";
  startsAt: string;
  endsAt: string;
  title: string;
  locationName: string;
  customerOrCapacity: string;
  status: string;
  paymentLabel: string;
}

export function buildReservationAgendaItems(input: {
  classes: ReservationAgendaClassInput[];
  facilityReservations: ReservationAgendaFacilityInput[];
}): ReservationAgendaItem[] {
  return [
    ...input.classes.map((session) => ({
      id: `class:${session.id}`,
      sourceId: session.id,
      kind: "class" as const,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      title: session.title,
      locationName: session.locationName,
      customerOrCapacity: `${session.capacity} capacity / ${session.waitlistCapacity} waitlist`,
      status: session.status,
      paymentLabel: "Class roster"
    })),
    ...input.facilityReservations.map((reservation) => ({
      id: `facility:${reservation.id}`,
      sourceId: reservation.id,
      kind: "facility" as const,
      startsAt: reservation.startsAt,
      endsAt: reservation.endsAt,
      title: reservation.resourceName,
      locationName: reservation.locationName,
      customerOrCapacity: reservation.memberName,
      status: reservation.status,
      paymentLabel: reservation.paymentLabel
    }))
  ].sort((left, right) => {
    const leftTime = Date.parse(left.startsAt);
    const rightTime = Date.parse(right.startsAt);
    return (Number.isFinite(leftTime) ? leftTime : Number.MAX_SAFE_INTEGER) -
      (Number.isFinite(rightTime) ? rightTime : Number.MAX_SAFE_INTEGER);
  });
}

export function createResourceReservationSubmission(input: {
  resourceId: string;
  memberId: string;
  startsAtLocal: string;
  endsAtLocal: string;
  note?: string;
  overrideConflict?: boolean;
  overrideReason?: string;
}): FacilityReservationCreateInput {
  const resourceId = normalizeText(input.resourceId);
  const memberId = normalizeText(input.memberId);
  const startsAt = datetimeLocalToIso(input.startsAtLocal);
  const endsAt = datetimeLocalToIso(input.endsAtLocal);
  if (!resourceId || !memberId || !startsAt || !endsAt) {
    throw new Error("Resource, customer, start time, and end time are required.");
  }
  if (endsAt <= startsAt) {
    throw new Error("Reservation end time must be after the start time.");
  }
  const overrideReason = normalizeText(input.overrideReason);
  if (input.overrideConflict && !overrideReason) {
    throw new Error("Conflict override requires a reason.");
  }
  const note = normalizeText(input.note);
  return {
    resourceId,
    memberId,
    startsAt,
    endsAt,
    overrideConflict: input.overrideConflict ?? false,
    ...(note ? { note } : {}),
    ...(input.overrideConflict ? { overrideReason } : {})
  };
}

export function createResourceReservationCancelSubmission(input: {
  reason?: string;
}): FacilityReservationCancelInput {
  const reason = normalizeText(input.reason);
  return reason ? { reason } : {};
}

export function createClassResourceAllocationSubmission(input: {
  resourceId: string;
  startsAtLocal?: string;
  endsAtLocal?: string;
  overrideConflict?: boolean;
  overrideReason?: string;
}): ClassSessionResourceAllocationInput {
  const resourceId = normalizeText(input.resourceId);
  if (!resourceId) {
    throw new Error("Resource is required.");
  }
  const startsAt = input.startsAtLocal ? datetimeLocalToIso(input.startsAtLocal) : "";
  const endsAt = input.endsAtLocal ? datetimeLocalToIso(input.endsAtLocal) : "";
  if ((input.startsAtLocal && !startsAt) || (input.endsAtLocal && !endsAt)) {
    throw new Error("Custom allocation times must be valid.");
  }
  if ((startsAt && !endsAt) || (!startsAt && endsAt)) {
    throw new Error("Custom allocation times require both start and end.");
  }
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new Error("Allocation end time must be after the start time.");
  }
  const overrideReason = normalizeText(input.overrideReason);
  if (input.overrideConflict && !overrideReason) {
    throw new Error("Conflict override requires a reason.");
  }
  return {
    resourceId,
    overrideConflict: input.overrideConflict ?? false,
    ...(startsAt && endsAt ? { startsAt, endsAt } : {}),
    ...(input.overrideConflict ? { overrideReason } : {})
  };
}

export function datetimeLocalToIso(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

export function isoToDatetimeLocal(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}
