import { table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
import type { OperatingHoursView } from "../gymSettings/types.js";
declare const dayOrder: readonly ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export interface LocationHoursRow {
    day: (typeof dayOrder)[number];
    dayLabel: string;
    opensAt: string;
    closesAt: string;
    valid: boolean;
    error?: string;
}
export interface LocationBusinessHoursEditor {
    screen: "location_business_hours";
    rows: LocationHoursRow[];
    invalidRows: LocationHoursRow[];
    coveredDays: Array<LocationHoursRow["day"]>;
    validRowCount: number;
    invalidRowCount: number;
    summaryLabel: string;
    canSubmit: boolean;
    empty?: EmptyStateModel;
    saveAction: ButtonModel;
    table: ReturnType<typeof table<LocationHoursRow>>;
}
export declare function buildLocationBusinessHoursEditor(operatingHours: OperatingHoursView): LocationBusinessHoursEditor;
export {};
//# sourceMappingURL=hours.d.ts.map