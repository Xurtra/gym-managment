import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
import type { StaffAvailabilityRange } from "./availability.js";
import type { StaffMemberView, StaffShiftView } from "./types.js";
export type StaffShiftConflictKind = "invalid_shift_time" | "overlapping_shift" | "outside_availability";
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
export declare function buildStaffShiftConflictReport(inputModel: {
    staff: StaffMemberView[];
    shifts: StaffShiftView[];
    availabilityByUserId?: Record<string, StaffAvailabilityRange[]>;
    proposedShift?: StaffShiftView;
}): StaffShiftConflictReport;
//# sourceMappingURL=shiftConflicts.d.ts.map