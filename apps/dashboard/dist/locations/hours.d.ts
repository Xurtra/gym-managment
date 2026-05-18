import { table } from "@gym-platform/ui";
import type { OperatingHoursView } from "../gymSettings/types.js";
declare const dayOrder: readonly ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export interface LocationHoursRow {
    day: (typeof dayOrder)[number];
    opensAt: string;
    closesAt: string;
    valid: boolean;
}
export interface LocationBusinessHoursEditor {
    screen: "location_business_hours";
    rows: LocationHoursRow[];
    invalidRows: LocationHoursRow[];
    canSubmit: boolean;
    table: ReturnType<typeof table<LocationHoursRow>>;
}
export declare function buildLocationBusinessHoursEditor(operatingHours: OperatingHoursView): LocationBusinessHoursEditor;
export {};
//# sourceMappingURL=hours.d.ts.map