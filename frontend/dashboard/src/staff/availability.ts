import { UserStatus } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import type { StaffMemberView } from "./types.js";

export type StaffAvailabilityDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface StaffAvailabilityRange {
  day: StaffAvailabilityDay;
  startsAt: string;
  endsAt: string;
  locationId?: string;
}

export interface StaffAvailabilitySlot extends StaffAvailabilityRange {
  key: string;
  durationMinutes: number;
  valid: boolean;
  error?: string;
  removeAction: ButtonModel;
}

export interface StaffScheduleAvailabilityModel {
  screen: "staff_schedule_availability";
  staff: StaffMemberView;
  timezone: string;
  slots: StaffAvailabilitySlot[];
  slotCount: number;
  conflictCount: number;
  weeklyMinutes: number;
  availableDays: StaffAvailabilityDay[];
  unavailableDays: StaffAvailabilityDay[];
  conflicts: string[];
  summaryLabel: string;
  canCreateShift: boolean;
}

export interface StaffAvailabilityEditor {
  screen: "staff_availability_editor";
  availability: StaffScheduleAvailabilityModel;
  selectedDay: StaffAvailabilityDay;
  startsAtField: InputModel;
  endsAtField: InputModel;
  locationOptions: Array<{ id: string; label: string; selected: boolean }>;
  locationOptionCount: number;
  hasChanges: boolean;
  summaryLabel: string;
  canAdd: boolean;
  canSubmit: boolean;
  addAction: ButtonModel;
  saveAction: ButtonModel;
  clearAction: ButtonModel;
}

const DAYS: StaffAvailabilityDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function buildStaffScheduleAvailabilityModel(inputModel: {
  staff: StaffMemberView;
  availability?: StaffAvailabilityRange[];
  timezone?: string;
}): StaffScheduleAvailabilityModel {
  const slots = normalizeAvailability(inputModel.availability ?? []).map((slot, index, slots) => {
    const rangeError = availabilityRangeError(slot);
    const overlapError = hasAvailabilityOverlap(slot, index, slots)
      ? "Availability overlaps another range for this day."
      : undefined;
    const error = rangeError ?? overlapError;
    return {
      ...slot,
      key: `${slot.day}-${slot.startsAt}-${slot.endsAt}-${slot.locationId ?? "all"}`,
      durationMinutes: error ? 0 : minutesBetween(slot.startsAt, slot.endsAt),
      valid: !error,
      ...(error ? { error } : {}),
      removeAction: button({
        label: `Remove ${slot.day} ${slot.startsAt}-${slot.endsAt}`,
        icon: "x",
        intent: "secondary",
        disabled: inputModel.staff.status !== UserStatus.Active
      })
    };
  });
  const availableDays = DAYS.filter((day) => slots.some((slot) => slot.day === day && slot.valid));
  const conflicts = slots.flatMap((slot) => (slot.error ? [slot.error] : []));

  return {
    screen: "staff_schedule_availability",
    staff: inputModel.staff,
    timezone: inputModel.timezone?.trim() || "America/New_York",
    slots,
    slotCount: slots.length,
    conflictCount: conflicts.length,
    weeklyMinutes: slots.reduce((total, slot) => total + slot.durationMinutes, 0),
    availableDays,
    unavailableDays: DAYS.filter((day) => !availableDays.includes(day)),
    conflicts,
    summaryLabel:
      slots.length === 0
        ? "No availability configured"
        : `${slots.length} availability slot${slots.length === 1 ? "" : "s"}`,
    canCreateShift: inputModel.staff.status === UserStatus.Active && conflicts.length === 0
  };
}

export function buildStaffAvailabilityEditor(inputModel: {
  staff: StaffMemberView;
  availability?: StaffAvailabilityRange[];
  timezone?: string;
  selectedDay?: StaffAvailabilityDay;
  startsAt?: string;
  endsAt?: string;
  selectedLocationId?: string;
  locations?: Array<{ id: string; name: string }>;
  originalAvailability?: StaffAvailabilityRange[];
}): StaffAvailabilityEditor {
  const selectedDay = inputModel.selectedDay ?? "mon";
  const startsAt = normalizeTime(inputModel.startsAt);
  const endsAt = normalizeTime(inputModel.endsAt);
  const availability = buildStaffScheduleAvailabilityModel(inputModel);
  const original = normalizeAvailability(
    inputModel.originalAvailability ?? inputModel.availability ?? []
  );
  const current = availability.slots
    .filter((slot) => slot.valid)
    .map(({ day, startsAt, endsAt, locationId }) =>
      optionalLocation({ day, startsAt, endsAt, locationId })
    );
  const pendingRange = optionalLocation({
    day: selectedDay,
    startsAt,
    endsAt,
    locationId: inputModel.selectedLocationId
  });
  const pendingError = availabilityRangeError(pendingRange);
  const canAdd = inputModel.staff.status === UserStatus.Active && !pendingError;
  const hasChanges = !sameAvailability(current, original);
  const canSubmit =
    inputModel.staff.status === UserStatus.Active &&
    availability.conflicts.length === 0 &&
    hasChanges;
  const locationOptions = (inputModel.locations ?? []).map((location) => ({
    id: location.id,
    label: location.name,
    selected: location.id === inputModel.selectedLocationId
  }));

  return {
    screen: "staff_availability_editor",
    availability,
    selectedDay,
    startsAtField: input({
      name: "startsAt",
      label: "Start time",
      value: startsAt,
      type: "text",
      required: true,
      ...(pendingError && startsAt ? { error: pendingError } : {})
    }),
    endsAtField: input({
      name: "endsAt",
      label: "End time",
      value: endsAt,
      type: "text",
      required: true,
      ...(pendingError && endsAt ? { error: pendingError } : {})
    }),
    locationOptions,
    locationOptionCount: locationOptions.length,
    hasChanges,
    summaryLabel: pendingError
      ? "Pending availability range is invalid"
      : !hasChanges
        ? "No availability changes"
        : "Availability changes ready",
    canAdd,
    canSubmit,
    addAction: button({ label: "Add availability", icon: "plus", disabled: !canAdd }),
    saveAction: button({ label: "Save availability", icon: "save", disabled: !canSubmit }),
    clearAction: button({
      label: "Clear availability",
      icon: "trash-2",
      intent: "secondary",
      disabled: inputModel.staff.status !== UserStatus.Active || availability.slots.length === 0
    })
  };
}

export function addStaffAvailabilitySlot(
  availability: StaffAvailabilityRange[],
  slot: StaffAvailabilityRange
) {
  return normalizeAvailability([...availability, slot]);
}

export function removeStaffAvailabilitySlot(
  availability: StaffAvailabilityRange[],
  slotToRemove: StaffAvailabilityRange
) {
  const normalizedTarget = slotKey(slotToRemove);
  return normalizeAvailability(availability).filter((slot) => slotKey(slot) !== normalizedTarget);
}

export function createStaffAvailabilitySubmission(inputModel: {
  userId: string;
  availability: StaffAvailabilityRange[];
}) {
  return {
    userId: inputModel.userId,
    availability: normalizeAvailability(inputModel.availability).filter(
      (slot) => !availabilityRangeError(slot)
    )
  };
}

function normalizeAvailability(availability: StaffAvailabilityRange[]) {
  const seen = new Set<string>();
  const normalized: StaffAvailabilityRange[] = [];
  for (const slot of availability) {
    const day = DAYS.includes(slot.day) ? slot.day : undefined;
    const startsAt = normalizeTime(slot.startsAt);
    const endsAt = normalizeTime(slot.endsAt);
    if (!day || !startsAt || !endsAt) {
      continue;
    }
    const value = optionalLocation({
      day,
      startsAt,
      endsAt,
      locationId: slot.locationId
    });
    const key = slotKey(value);
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push(value);
    }
  }
  return normalized.sort(
    (left, right) =>
      DAYS.indexOf(left.day) - DAYS.indexOf(right.day) ||
      left.startsAt.localeCompare(right.startsAt) ||
      left.endsAt.localeCompare(right.endsAt)
  );
}

function normalizeTime(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : trimmed;
}

function optionalLocation(slot: {
  day: StaffAvailabilityDay;
  startsAt: string;
  endsAt: string;
  locationId?: string | undefined;
}): StaffAvailabilityRange {
  const locationId = slot.locationId?.trim();
  return locationId
    ? { ...slot, locationId }
    : { day: slot.day, startsAt: slot.startsAt, endsAt: slot.endsAt };
}

function availabilityRangeError(slot: StaffAvailabilityRange) {
  if (!/^\d{2}:\d{2}$/.test(slot.startsAt) || !/^\d{2}:\d{2}$/.test(slot.endsAt)) {
    return "Availability times must use HH:MM format.";
  }
  if (minutesSinceMidnight(slot.endsAt) <= minutesSinceMidnight(slot.startsAt)) {
    return "Availability end time must be after start time.";
  }
  return undefined;
}

function hasAvailabilityOverlap(
  slot: StaffAvailabilityRange,
  index: number,
  slots: StaffAvailabilityRange[]
) {
  if (availabilityRangeError(slot)) {
    return false;
  }
  return slots.some(
    (candidate, candidateIndex) =>
      candidateIndex !== index &&
      candidate.day === slot.day &&
      !availabilityRangeError(candidate) &&
      minutesSinceMidnight(slot.startsAt) < minutesSinceMidnight(candidate.endsAt) &&
      minutesSinceMidnight(slot.endsAt) > minutesSinceMidnight(candidate.startsAt)
  );
}

function minutesBetween(startsAt: string, endsAt: string) {
  return minutesSinceMidnight(endsAt) - minutesSinceMidnight(startsAt);
}

function minutesSinceMidnight(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function sameAvailability(left: StaffAvailabilityRange[], right: StaffAvailabilityRange[]) {
  const normalizedLeft = normalizeAvailability(left).map(slotKey);
  const normalizedRight = normalizeAvailability(right).map(slotKey);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((key, index) => key === normalizedRight[index])
  );
}

function slotKey(slot: StaffAvailabilityRange) {
  return `${slot.day}|${slot.startsAt}|${slot.endsAt}|${slot.locationId ?? ""}`;
}
