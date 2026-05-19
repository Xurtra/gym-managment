import type { EmptyStateModel, TableModel } from "@gym-platform/ui";
import type { LocationView, ReportingLocationRecord } from "./types.js";
export interface LocationReportingFilterOption {
    id: string;
    label: string;
    selected: boolean;
    recordCount: number;
}
export interface LocationReportingFilters {
    screen: "location_reporting_filters";
    selectedLocationIds: string[];
    options: LocationReportingFilterOption[];
    optionCount: number;
    selectedCount: number;
    summaryLabel: string;
    multiLocation: boolean;
    empty?: EmptyStateModel;
}
export interface LocationReportingSummary {
    totalCount: number;
    visibleCount: number;
    selectedLocationCount: number;
    unassignedCount: number;
}
export interface LocationReportingView {
    screen: "location_reporting";
    filters: LocationReportingFilters;
    summary: LocationReportingSummary;
    records: ReportingLocationRecord[];
    empty?: EmptyStateModel;
    table: TableModel<ReportingLocationRecord>;
}
export declare function buildLocationReportingFilters(locations: LocationView[], records?: ReportingLocationRecord[], selectedLocationIds?: string[]): LocationReportingFilters;
export declare function applyLocationReportingFilters(records: ReportingLocationRecord[], selectedLocationIds?: string[]): ReportingLocationRecord[];
export declare function buildLocationReportingView(input: {
    locations: LocationView[];
    records: ReportingLocationRecord[];
    selectedLocationIds?: string[];
}): LocationReportingView;
//# sourceMappingURL=reporting.d.ts.map