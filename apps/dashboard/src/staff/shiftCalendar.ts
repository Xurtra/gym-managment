import { button, emptyState } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
import type { StaffMemberView, StaffRoleOption, StaffShiftView } from "./types.js";

export interface StaffShiftCalendarItem extends StaffShiftView {
  staffName: string;
  roleLabel: string;
  locationLabel?: string;
  startsAtTime: string;
  endsAtTime: string;
  durationMinutes: number;
  overlaps: boolean;
  detailAction: ButtonModel;
}

export interface StaffShiftCalendarDay {
  key: string;
  date: string;
  label: string;
  isToday: boolean;
  shifts: StaffShiftCalendarItem[];
  totalShiftMinutes: number;
  overlappingShiftCount: number;
}

export interface StaffShiftCalendarView {
  screen: "staff_shift_calendar";
  weekStartsAt: string;
  weekEndsAt: string;
  timezone: string;
  days: StaffShiftCalendarDay[];
  visibleShifts: StaffShiftCalendarItem[];
  totalShiftCount: number;
  totalShiftMinutes: number;
  overlappingShiftCount: number;
  selectedStaffId?: string;
  selectedLocationId?: string;
  staffOptions: Array<{ id: string; label: string; selected: boolean }>;
  locationOptions: Array<{ id: string; label: string; selected: boolean }>;
  previousWeekAction: ButtonModel;
  nextWeekAction: ButtonModel;
  createShiftAction: ButtonModel;
  empty?: EmptyStateModel;
}

export function buildStaffShiftCalendarView(inputModel: {
  staff: StaffMemberView[];
  shifts: StaffShiftView[];
  roles?: StaffRoleOption[];
  locations?: Array<{ id: string; name: string }>;
  weekStartsAt: string;
  timezone?: string;
  today?: string;
  selectedStaffId?: string;
  selectedLocationId?: string;
}): StaffShiftCalendarView {
  const timezone = inputModel.timezone?.trim() || "America/New_York";
  const weekStart = startOfUtcDay(new Date(inputModel.weekStartsAt));
  const weekEnd = addDays(weekStart, 7);
  const staffById = new Map(inputModel.staff.map((staff) => [staff.userId, staff]));
  const roleById = new Map((inputModel.roles ?? []).map((role) => [role.id, role]));
  const locationById = new Map(
    (inputModel.locations ?? []).map((location) => [location.id, location])
  );
  const todayKey = dateKey(startOfUtcDay(new Date(inputModel.today ?? new Date().toISOString())));
  const selectedStaffId = normalizedOptional(inputModel.selectedStaffId);
  const selectedLocationId = normalizedOptional(inputModel.selectedLocationId);

  const filteredShifts = inputModel.shifts
    .filter((shift) => isWithinWeek(shift, weekStart, weekEnd))
    .filter((shift) => !selectedStaffId || shift.userId === selectedStaffId)
    .filter((shift) => !selectedLocationId || shift.locationId === selectedLocationId)
    .sort(compareShifts);
  const overlapIds = overlappingShiftIds(filteredShifts);
  const visibleShifts = filteredShifts.map((shift) => {
    const staff = staffById.get(shift.userId);
    const role = roleById.get(shift.roleId);
    const location = shift.locationId ? locationById.get(shift.locationId) : undefined;
    const startsAt = new Date(shift.startsAt);
    const endsAt = new Date(shift.endsAt);
    return {
      ...shift,
      staffName: staff ? fullNameForStaff(staff) : "Unknown staff",
      roleLabel: role?.label ?? String(staff?.roleName ?? shift.roleId),
      ...(location ? { locationLabel: location.name } : {}),
      startsAtTime: timeLabel(startsAt),
      endsAtTime: timeLabel(endsAt),
      durationMinutes: Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000)),
      overlaps: overlapIds.has(shift.id),
      detailAction: button({
        label: "View shift",
        icon: "calendar-days",
        intent: "secondary"
      })
    };
  });
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    const key = dateKey(day);
    const shifts = visibleShifts.filter((shift) => dateKey(new Date(shift.startsAt)) === key);
    return {
      key,
      date: day.toISOString(),
      label: dayLabel(day),
      isToday: key === todayKey,
      shifts,
      totalShiftMinutes: shifts.reduce((total, shift) => total + shift.durationMinutes, 0),
      overlappingShiftCount: shifts.filter((shift) => shift.overlaps).length
    };
  });
  const totalShiftMinutes = visibleShifts.reduce(
    (total, shift) => total + shift.durationMinutes,
    0
  );

  return {
    screen: "staff_shift_calendar",
    weekStartsAt: weekStart.toISOString(),
    weekEndsAt: addDays(weekEnd, -1).toISOString(),
    timezone,
    days,
    visibleShifts,
    totalShiftCount: visibleShifts.length,
    totalShiftMinutes,
    overlappingShiftCount: visibleShifts.filter((shift) => shift.overlaps).length,
    ...(selectedStaffId ? { selectedStaffId } : {}),
    ...(selectedLocationId ? { selectedLocationId } : {}),
    staffOptions: inputModel.staff.map((staff) => ({
      id: staff.userId,
      label: fullNameForStaff(staff),
      selected: staff.userId === selectedStaffId
    })),
    locationOptions: (inputModel.locations ?? []).map((location) => ({
      id: location.id,
      label: location.name,
      selected: location.id === selectedLocationId
    })),
    previousWeekAction: button({
      label: "Previous week",
      icon: "chevron-left",
      intent: "secondary"
    }),
    nextWeekAction: button({ label: "Next week", icon: "chevron-right", intent: "secondary" }),
    createShiftAction: button({ label: "Create shift", icon: "calendar-plus" }),
    ...(visibleShifts.length === 0
      ? {
          empty: emptyState({
            title: "No shifts scheduled",
            body: "Create a staff shift or adjust the calendar filters."
          })
        }
      : {})
  };
}

function isWithinWeek(shift: StaffShiftView, weekStart: Date, weekEnd: Date) {
  const startsAt = new Date(shift.startsAt);
  return startsAt >= weekStart && startsAt < weekEnd;
}

function overlappingShiftIds(shifts: StaffShiftView[]) {
  const overlaps = new Set<string>();
  for (let index = 0; index < shifts.length; index += 1) {
    const shift = shifts[index];
    if (!shift) {
      continue;
    }
    const startsAt = new Date(shift.startsAt);
    const endsAt = new Date(shift.endsAt);
    for (const candidate of shifts.slice(index + 1)) {
      if (candidate.userId !== shift.userId) {
        continue;
      }
      if (startsAt < new Date(candidate.endsAt) && endsAt > new Date(candidate.startsAt)) {
        overlaps.add(shift.id);
        overlaps.add(candidate.id);
      }
    }
  }
  return overlaps;
}

function compareShifts(left: StaffShiftView, right: StaffShiftView) {
  return (
    new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime() ||
    new Date(left.endsAt).getTime() - new Date(right.endsAt).getTime() ||
    left.userId.localeCompare(right.userId)
  );
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function timeLabel(date: Date) {
  return date.toISOString().slice(11, 16);
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

function fullNameForStaff(staff: StaffMemberView) {
  return `${staff.firstName} ${staff.lastName}`.trim() || staff.email;
}

function normalizedOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}
