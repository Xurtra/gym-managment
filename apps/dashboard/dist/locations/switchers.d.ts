import type { LocationSwitcherOption, LocationView } from "./types.js";
export interface DashboardLocationSwitcher {
    screen: "dashboard_location_switcher";
    selectedLocationId?: string;
    options: LocationSwitcherOption[];
    multiLocation: boolean;
}
export interface PublicScheduleLocationSwitcher {
    screen: "public_schedule_location_switcher";
    selectedLocationId?: string;
    options: LocationSwitcherOption[];
}
export declare function buildDashboardLocationSwitcher(locations: LocationView[], selectedLocationId?: string): DashboardLocationSwitcher;
export declare function buildPublicScheduleLocationSwitcher(locations: LocationView[], selectedLocationId?: string): PublicScheduleLocationSwitcher;
//# sourceMappingURL=switchers.d.ts.map