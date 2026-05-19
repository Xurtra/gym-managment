import type { EmptyStateModel } from "@gym-platform/ui";
import type { LocationSwitcherOption, LocationView } from "./types.js";
export interface DashboardLocationSwitcher {
    screen: "dashboard_location_switcher";
    selectedLocationId?: string;
    selectedLocationName?: string;
    options: LocationSwitcherOption[];
    optionCount: number;
    multiLocation: boolean;
    empty?: EmptyStateModel;
}
export interface PublicScheduleLocationSwitcher {
    screen: "public_schedule_location_switcher";
    selectedLocationId?: string;
    selectedLocationName?: string;
    options: LocationSwitcherOption[];
    optionCount: number;
    empty?: EmptyStateModel;
}
export declare function buildDashboardLocationSwitcher(locations: LocationView[], selectedLocationId?: string): DashboardLocationSwitcher;
export declare function buildPublicScheduleLocationSwitcher(locations: LocationView[], selectedLocationId?: string): PublicScheduleLocationSwitcher;
//# sourceMappingURL=switchers.d.ts.map