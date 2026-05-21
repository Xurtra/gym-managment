import { button, emptyState } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
import type { StaffAvailabilityDay, StaffAvailabilityRange } from "./availability.js";
import type { StaffMemberView, StaffShiftView } from "./types.js";

export type StaffShiftConflictKind =
  | "invalid_shift_time"
  | "overlapping_shift"
  | "outside_availability";
export type StaffShiftConflictSeverity = "blocking" | "warning";

export interface StaffShiftConflict {
  id: string;
  kind: StaffShiftConflictKind;
  severity: StaffShiftConflictSeverity;
  userId: string;
  staffName: string;
  shiftIds: string[];
  startsAt: string;
  endsAt: string;
  message: string;
  resolutionAction: ButtonModel;
}

export interface StaffShiftConflictReport {
  screen: "staff_shift_conflict_detection";
  conflicts: StaffShiftConflict[];
  conflictCount: number;
  blockingCount: number;
  warningCount: number;
  hasBlockingConflicts: boolean;
  affectedStaffIds: string[];
  affectedShiftIds: string[];
  summaryLabel: string;
  reviewAction: ButtonModel;
  empty?: EmptyStateModel;
}

export function buildStaffShiftConflictReport(inputModel: {
  staff: StaffMemberView[];
  shifts: StaffShiftView[];
  availabilityByUserId?: Record<string, StaffAvailabilityRange[]>;
  proposedShift?: StaffShiftView;
}): StaffShiftConflictReport {
  const staffById = new Map(inputModel.staff.map((staff) => [staff.userId, staff]));
  const shifts = [
    ...inputModel.shifts,
    ...(inputModel.proposedShift ? [inputModel.proposedShift] : [])
  ]
    .slice()
    .sort(compareShifts);
  const conflicts = [
    ...invalidTimeConflicts(shifts, staffById),
    ...overlappingShiftConflicts(shifts, staffById),
    ...availabilityConflicts(shifts, staffById, inputModel.availabilityByUserId ?? {})
  ].sort(compareConflicts);
  const affectedStaffIds = uniqueSorted(conflicts.map((conflict) => conflict.userId));
  const affectedShiftIds = uniqueSorted(conflicts.flatMap((conflict) => conflict.shiftIds));
  const blockingCount = conflicts.filter((conflict) => conflict.severity === "blocking").length;
  const warningCount = conflicts.filter((conflict) => conflict.severity === "warning").length;

  return {
    screen: "staff_shift_conflict_detection",
    conflicts,
    conflictCount: conflicts.length,
    blockingCount,
    warningCount,
    hasBlockingConflicts: blockingCount > 0,
    affectedStaffIds,
    affectedShiftIds,
    summaryLabel:
      conflicts.length === 0
        ? "No shift conflicts detected"
        : `${conflicts.length} shift conflict${conflicts.length === 1 ? "" : "s"}`,
    reviewAction: button({
      label: "Review conflicts",
      icon: "triangle-alert",
      intent: blockingCount > 0 ? "danger" : "secondary",
      disabled: conflicts.length === 0
    }),
    ...(conflicts.length === 0
      ? {
          empty: emptyState({
            title: "No shift conflicts",
            body: "Scheduled shifts pass overlap and availability checks."
          })
        }
      : {})
  };
}

function invalidTimeConflicts(
  shifts: StaffShiftView[],
  staffById: Map<string, StaffMemberView>
): StaffShiftConflict[] {
  return shifts.flatMap((shift) => {
    const startsAt = new Date(shift.startsAt);
    const endsAt = new Date(shift.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return [
        conflict({
          kind: "invalid_shift_time",
          severity: "blocking",
          userId: shift.userId,
          staffName: staffName(staffById, shift.userId),
          shiftIds: [shift.id],
          startsAt: shift.startsAt,
          endsAt: shift.endsAt,
          message: `${staffName(staffById, shift.userId)} has a shift ending before it starts.`,
          actionLabel: "Edit shift time"
        })
      ];
    }
    return [];
  });
}

function overlappingShiftConflicts(
  shifts: StaffShiftView[],
  staffById: Map<string, StaffMemberView>
): StaffShiftConflict[] {
  const conflicts: StaffShiftConflict[] = [];
  for (let index = 0; index < shifts.length; index += 1) {
    const shift = shifts[index];
    if (!shift || !validRange(shift)) {
      continue;
    }
    for (const candidate of shifts.slice(index + 1)) {
      if (candidate.userId !== shift.userId || !validRange(candidate)) {
        continue;
      }
      const startsAt = new Date(shift.startsAt);
      const endsAt = new Date(shift.endsAt);
      if (startsAt < new Date(candidate.endsAt) && endsAt > new Date(candidate.startsAt)) {
        conflicts.push(
          conflict({
            kind: "overlapping_shift",
            severity: "blocking",
            userId: shift.userId,
            staffName: staffName(staffById, shift.userId),
            shiftIds: [shift.id, candidate.id].sort(),
            startsAt: maxDate(startsAt, new Date(candidate.startsAt)).toISOString(),
            endsAt: minDate(endsAt, new Date(candidate.endsAt)).toISOString(),
            message: `${staffName(staffById, shift.userId)} has overlapping shifts.`,
            actionLabel: "Resolve overlap"
          })
        );
      }
    }
  }
  return conflicts;
}

function availabilityConflicts(
  shifts: StaffShiftView[],
  staffById: Map<string, StaffMemberView>,
  availabilityByUserId: Record<string, StaffAvailabilityRange[]>
): StaffShiftConflict[] {
  return shifts.flatMap((shift) => {
    const availability = availabilityByUserId[shift.userId] ?? [];
    if (
      availability.length === 0 ||
      !validRange(shift) ||
      shiftFitsAvailability(shift, availability)
    ) {
      return [];
    }
    return [
      conflict({
        kind: "outside_availability",
        severity: "warning",
        userId: shift.userId,
        staffName: staffName(staffById, shift.userId),
        shiftIds: [shift.id],
        startsAt: shift.startsAt,
        endsAt: shift.endsAt,
        message: `${staffName(staffById, shift.userId)} is scheduled outside availability.`,
        actionLabel: "Review availability"
      })
    ];
  });
}

function shiftFitsAvailability(shift: StaffShiftView, availability: StaffAvailabilityRange[]) {
  const startsAt = new Date(shift.startsAt);
  const endsAt = new Date(shift.endsAt);
  const shiftDay = dayKey(startsAt);
  const shiftStart = minutesSinceMidnight(startsAt);
  const shiftEnd = minutesSinceMidnight(endsAt);
  return availability.some(
    (slot) =>
      slot.day === shiftDay &&
      (!slot.locationId || !shift.locationId || slot.locationId === shift.locationId) &&
      minutesFromTime(slot.startsAt) <= shiftStart &&
      minutesFromTime(slot.endsAt) >= shiftEnd
  );
}

function conflict(inputModel: {
  kind: StaffShiftConflictKind;
  severity: StaffShiftConflictSeverity;
  userId: string;
  staffName: string;
  shiftIds: string[];
  startsAt: string;
  endsAt: string;
  message: string;
  actionLabel: string;
}): StaffShiftConflict {
  return {
    id: `${inputModel.kind}:${inputModel.shiftIds.join(":")}`,
    kind: inputModel.kind,
    severity: inputModel.severity,
    userId: inputModel.userId,
    staffName: inputModel.staffName,
    shiftIds: inputModel.shiftIds,
    startsAt: inputModel.startsAt,
    endsAt: inputModel.endsAt,
    message: inputModel.message,
    resolutionAction: button({
      label: inputModel.actionLabel,
      icon: inputModel.severity === "blocking" ? "triangle-alert" : "calendar-clock",
      intent: inputModel.severity === "blocking" ? "danger" : "secondary"
    })
  };
}

function validRange(shift: StaffShiftView) {
  const startsAt = new Date(shift.startsAt);
  const endsAt = new Date(shift.endsAt);
  return !Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime()) && endsAt > startsAt;
}

function compareShifts(left: StaffShiftView, right: StaffShiftView) {
  return (
    new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime() ||
    new Date(left.endsAt).getTime() - new Date(right.endsAt).getTime() ||
    left.id.localeCompare(right.id)
  );
}

function compareConflicts(left: StaffShiftConflict, right: StaffShiftConflict) {
  return (
    severityWeight(left.severity) - severityWeight(right.severity) ||
    left.startsAt.localeCompare(right.startsAt) ||
    left.id.localeCompare(right.id)
  );
}

function severityWeight(severity: StaffShiftConflictSeverity) {
  return severity === "blocking" ? 0 : 1;
}

function staffName(staffById: Map<string, StaffMemberView>, userId: string) {
  const staff = staffById.get(userId);
  return staff ? `${staff.firstName} ${staff.lastName}`.trim() || staff.email : "Unknown staff";
}

function dayKey(date: Date): StaffAvailabilityDay {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    date.getUTCDay()
  ] as StaffAvailabilityDay;
}

function minutesSinceMidnight(date: Date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function minutesFromTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function maxDate(left: Date, right: Date) {
  return left > right ? left : right;
}

function minDate(left: Date, right: Date) {
  return left < right ? left : right;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort();
}
