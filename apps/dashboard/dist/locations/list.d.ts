import type { EmptyStateModel, TableModel } from "@gym-platform/ui";
import type { LocationView } from "./types.js";
export interface LocationListRow {
    id: string;
    name: string;
    address: string;
    timezone: string;
    status: string;
}
export interface LocationListPage {
    screen: "location_list";
    locations: LocationListRow[];
    activeCount: number;
    archivedCount: number;
    selectedLocation?: LocationView;
    table: TableModel<LocationListRow>;
    empty?: EmptyStateModel;
}
export declare function buildLocationListPage(locations: LocationView[], selectedLocationId?: string): LocationListPage;
//# sourceMappingURL=list.d.ts.map