import type { TableModel } from "@gym-platform/ui";
import type { LocationView, ReportingLocationRecord } from "./types.js";
export interface LocationReportingFilters {
    screen: "location_reporting_filters";
    selectedLocationIds: string[];
    options: Array<{
        id: string;
        label: string;
        selected: boolean;
    }>;
    multiLocation: boolean;
}
export interface LocationReportingView {
    screen: "location_reporting";
    filters: LocationReportingFilters;
    records: ReportingLocationRecord[];
    table: TableModel<ReportingLocationRecord>;
}
export declare function buildLocationReportingFilters(locations: LocationView[], selectedLocationIds?: string[]): LocationReportingFilters;
export declare function applyLocationReportingFilters(records: ReportingLocationRecord[], selectedLocationIds?: string[]): ReportingLocationRecord[];
export declare function buildLocationReportingView(input: {
    locations: LocationView[];
    records: ReportingLocationRecord[];
    selectedLocationIds?: string[];
}): LocationReportingView;
//# sourceMappingURL=reporting.d.ts.map