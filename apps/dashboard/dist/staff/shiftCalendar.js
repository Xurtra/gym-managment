import { button, emptyState } from "@gym-platform/ui";
export function buildStaffShiftCalendarView(inputModel) {
    const timezone = inputModel.timezone?.trim() || "America/New_York";
    const weekStart = startOfUtcDay(new Date(inputModel.weekStartsAt));
    const weekEnd = addDays(weekStart, 7);
    const staffById = new Map(inputModel.staff.map((staff) => [staff.userId, staff]));
    const roleById = new Map((inputModel.roles ?? []).map((role) => [role.id, role]));
    const locationById = new Map((inputModel.locations ?? []).map((location) => [location.id, location]));
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
    const totalShiftMinutes = visibleShifts.reduce((total, shift) => total + shift.durationMinutes, 0);
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
function isWithinWeek(shift, weekStart, weekEnd) {
    const startsAt = new Date(shift.startsAt);
    return startsAt >= weekStart && startsAt < weekEnd;
}
function overlappingShiftIds(shifts) {
    const overlaps = new Set();
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
function compareShifts(left, right) {
    return (new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime() ||
        new Date(left.endsAt).getTime() - new Date(right.endsAt).getTime() ||
        left.userId.localeCompare(right.userId));
}
function startOfUtcDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function addDays(date, days) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}
function dateKey(date) {
    return date.toISOString().slice(0, 10);
}
function timeLabel(date) {
    return date.toISOString().slice(11, 16);
}
function dayLabel(date) {
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC"
    });
}
function fullNameForStaff(staff) {
    return `${staff.firstName} ${staff.lastName}`.trim() || staff.email;
}
function normalizedOptional(value) {
    const normalized = value?.trim();
    return normalized || undefined;
}
//# sourceMappingURL=shiftCalendar.js.map