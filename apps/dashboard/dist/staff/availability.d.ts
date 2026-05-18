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
    weeklyMinutes: number;
    availableDays: StaffAvailabilityDay[];
    unavailableDays: StaffAvailabilityDay[];
    conflicts: string[];
    canCreateShift: boolean;
}
export interface StaffAvailabilityEditor {
    screen: "staff_availability_editor";
    availability: StaffScheduleAvailabilityModel;
    selectedDay: StaffAvailabilityDay;
    startsAtField: InputModel;
    endsAtField: InputModel;
    locationOptions: Array<{
        id: string;
        label: string;
        selected: boolean;
    }>;
    canAdd: boolean;
    canSubmit: boolean;
    addAction: ButtonModel;
    saveAction: ButtonModel;
    clearAction: ButtonModel;
}
export declare function buildStaffScheduleAvailabilityModel(inputModel: {
    staff: StaffMemberView;
    availability?: StaffAvailabilityRange[];
    timezone?: string;
}): StaffScheduleAvailabilityModel;
export declare function buildStaffAvailabilityEditor(inputModel: {
    staff: StaffMemberView;
    availability?: StaffAvailabilityRange[];
    timezone?: string;
    selectedDay?: StaffAvailabilityDay;
    startsAt?: string;
    endsAt?: string;
    selectedLocationId?: string;
    locations?: Array<{
        id: string;
        name: string;
    }>;
    originalAvailability?: StaffAvailabilityRange[];
}): StaffAvailabilityEditor;
export declare function addStaffAvailabilitySlot(availability: StaffAvailabilityRange[], slot: StaffAvailabilityRange): StaffAvailabilityRange[];
export declare function removeStaffAvailabilitySlot(availability: StaffAvailabilityRange[], slotToRemove: StaffAvailabilityRange): StaffAvailabilityRange[];
export declare function createStaffAvailabilitySubmission(inputModel: {
    userId: string;
    availability: StaffAvailabilityRange[];
}): {
    userId: string;
    availability: StaffAvailabilityRange[];
};
//# sourceMappingURL=availability.d.ts.map