import type { ButtonModel, EmptyStateModel, TableModel } from "@gym-platform/ui";
import type { LocationView } from "./types.js";
export interface LocationListRow {
    id: string;
    name: string;
    address: string;
    phoneLabel: string;
    timezone: string;
    status: string;
    detailHref: string;
}
export interface LocationListSummary {
    totalCount: number;
    activeCount: number;
    archivedCount: number;
    visibleCount: number;
}
export interface LocationListPage {
    screen: "location_list";
    locations: LocationListRow[];
    rows: LocationListRow[];
    summary: LocationListSummary;
    selectedLocation?: LocationView;
    table: TableModel<LocationListRow>;
    empty?: EmptyStateModel;
    createLocationAction: ButtonModel;
}
export declare function buildLocationListPage(locations: LocationView[], selectedLocationId?: string): LocationListPage;
//# sourceMappingURL=list.d.ts.map