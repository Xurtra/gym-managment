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
    staffOptions: Array<{
        id: string;
        label: string;
        selected: boolean;
    }>;
    locationOptions: Array<{
        id: string;
        label: string;
        selected: boolean;
    }>;
    previousWeekAction: ButtonModel;
    nextWeekAction: ButtonModel;
    createShiftAction: ButtonModel;
    empty?: EmptyStateModel;
}
export declare function buildStaffShiftCalendarView(inputModel: {
    staff: StaffMemberView[];
    shifts: StaffShiftView[];
    roles?: StaffRoleOption[];
    locations?: Array<{
        id: string;
        name: string;
    }>;
    weekStartsAt: string;
    timezone?: string;
    today?: string;
    selectedStaffId?: string;
    selectedLocationId?: string;
}): StaffShiftCalendarView;
//# sourceMappingURL=shiftCalendar.d.ts.map