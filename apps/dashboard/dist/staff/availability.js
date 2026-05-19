import { UserStatus } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export function buildStaffScheduleAvailabilityModel(inputModel) {
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
        summaryLabel: slots.length === 0
            ? "No availability configured"
            : `${slots.length} availability slot${slots.length === 1 ? "" : "s"}`,
        canCreateShift: inputModel.staff.status === UserStatus.Active && conflicts.length === 0
    };
}
export function buildStaffAvailabilityEditor(inputModel) {
    const selectedDay = inputModel.selectedDay ?? "mon";
    const startsAt = normalizeTime(inputModel.startsAt);
    const endsAt = normalizeTime(inputModel.endsAt);
    const availability = buildStaffScheduleAvailabilityModel(inputModel);
    const original = normalizeAvailability(inputModel.originalAvailability ?? inputModel.availability ?? []);
    const current = availability.slots
        .filter((slot) => slot.valid)
        .map(({ day, startsAt, endsAt, locationId }) => optionalLocation({ day, startsAt, endsAt, locationId }));
    const pendingRange = optionalLocation({
        day: selectedDay,
        startsAt,
        endsAt,
        locationId: inputModel.selectedLocationId
    });
    const pendingError = availabilityRangeError(pendingRange);
    const canAdd = inputModel.staff.status === UserStatus.Active && !pendingError;
    const hasChanges = !sameAvailability(current, original);
    const canSubmit = inputModel.staff.status === UserStatus.Active &&
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
export function addStaffAvailabilitySlot(availability, slot) {
    return normalizeAvailability([...availability, slot]);
}
export function removeStaffAvailabilitySlot(availability, slotToRemove) {
    const normalizedTarget = slotKey(slotToRemove);
    return normalizeAvailability(availability).filter((slot) => slotKey(slot) !== normalizedTarget);
}
export function createStaffAvailabilitySubmission(inputModel) {
    return {
        userId: inputModel.userId,
        availability: normalizeAvailability(inputModel.availability).filter((slot) => !availabilityRangeError(slot))
    };
}
function normalizeAvailability(availability) {
    const seen = new Set();
    const normalized = [];
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
    return normalized.sort((left, right) => DAYS.indexOf(left.day) - DAYS.indexOf(right.day) ||
        left.startsAt.localeCompare(right.startsAt) ||
        left.endsAt.localeCompare(right.endsAt));
}
function normalizeTime(value) {
    const trimmed = value?.trim() ?? "";
    return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : trimmed;
}
function optionalLocation(slot) {
    const locationId = slot.locationId?.trim();
    return locationId
        ? { ...slot, locationId }
        : { day: slot.day, startsAt: slot.startsAt, endsAt: slot.endsAt };
}
function availabilityRangeError(slot) {
    if (!/^\d{2}:\d{2}$/.test(slot.startsAt) || !/^\d{2}:\d{2}$/.test(slot.endsAt)) {
        return "Availability times must use HH:MM format.";
    }
    if (minutesSinceMidnight(slot.endsAt) <= minutesSinceMidnight(slot.startsAt)) {
        return "Availability end time must be after start time.";
    }
    return undefined;
}
function hasAvailabilityOverlap(slot, index, slots) {
    if (availabilityRangeError(slot)) {
        return false;
    }
    return slots.some((candidate, candidateIndex) => candidateIndex !== index &&
        candidate.day === slot.day &&
        !availabilityRangeError(candidate) &&
        minutesSinceMidnight(slot.startsAt) < minutesSinceMidnight(candidate.endsAt) &&
        minutesSinceMidnight(slot.endsAt) > minutesSinceMidnight(candidate.startsAt));
}
function minutesBetween(startsAt, endsAt) {
    return minutesSinceMidnight(endsAt) - minutesSinceMidnight(startsAt);
}
function minutesSinceMidnight(value) {
    const [hours = "0", minutes = "0"] = value.split(":");
    return Number(hours) * 60 + Number(minutes);
}
function sameAvailability(left, right) {
    const normalizedLeft = normalizeAvailability(left).map(slotKey);
    const normalizedRight = normalizeAvailability(right).map(slotKey);
    return (normalizedLeft.length === normalizedRight.length &&
        normalizedLeft.every((key, index) => key === normalizedRight[index]));
}
function slotKey(slot) {
    return `${slot.day}|${slot.startsAt}|${slot.endsAt}|${slot.locationId ?? ""}`;
}
//# sourceMappingURL=availability.js.map