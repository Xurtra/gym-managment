import { LocationStatus } from "@gym-platform/constants";
import { emptyState } from "@gym-platform/ui";
export function buildDashboardLocationSwitcher(locations, selectedLocationId) {
    const activeLocations = locations.filter((location) => location.status === LocationStatus.Active);
    const selectedLocation = activeLocations.find((location) => location.id === selectedLocationId);
    const resolvedSelectedLocation = selectedLocation ?? activeLocations[0];
    const resolvedSelectedId = resolvedSelectedLocation?.id;
    const screen = {
        screen: "dashboard_location_switcher",
        options: activeLocations.map((location) => ({
            id: location.id,
            label: location.name,
            active: location.id === resolvedSelectedId,
            href: `/dashboard/locations/${location.id}`
        })),
        optionCount: activeLocations.length,
        multiLocation: activeLocations.length > 1
    };
    if (activeLocations.length === 0) {
        screen.empty = emptyState({
            title: "No active locations",
            body: "Create a location to switch the dashboard context."
        });
    }
    if (resolvedSelectedId) {
        screen.selectedLocationId = resolvedSelectedId;
        screen.selectedLocationName = resolvedSelectedLocation?.name;
    }
    return screen;
}
export function buildPublicScheduleLocationSwitcher(locations, selectedLocationId) {
    const activeLocations = locations.filter((location) => location.status === LocationStatus.Active);
    const selectedLocation = activeLocations.find((location) => location.id === selectedLocationId);
    const resolvedSelectedLocation = selectedLocation;
    const resolvedSelectedId = resolvedSelectedLocation?.id;
    const screen = {
        screen: "public_schedule_location_switcher",
        options: [
            {
                id: "all",
                label: activeLocations.length > 1 ? "All locations" : "All classes",
                active: !resolvedSelectedId,
                href: "/schedule"
            },
            ...activeLocations.map((location) => ({
                id: location.id,
                label: location.name,
                active: location.id === resolvedSelectedId,
                href: `/schedule?locationId=${encodeURIComponent(location.id)}`
            }))
        ],
        optionCount: activeLocations.length + 1
    };
    if (activeLocations.length === 0) {
        screen.empty = emptyState({
            title: "No public locations",
            body: "No active locations are currently available for the public schedule."
        });
    }
    if (resolvedSelectedId) {
        screen.selectedLocationId = resolvedSelectedId;
        screen.selectedLocationName = resolvedSelectedLocation?.name;
    }
    return screen;
}
//# sourceMappingURL=switchers.js.map