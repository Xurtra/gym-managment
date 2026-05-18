import { LocationStatus } from "@gym-platform/constants";
export function buildDashboardLocationSwitcher(locations, selectedLocationId) {
    const activeLocations = locations.filter((location) => location.status === LocationStatus.Active);
    const selectedLocation = activeLocations.find((location) => location.id === selectedLocationId);
    const resolvedSelectedId = selectedLocation?.id ?? activeLocations[0]?.id;
    const screen = {
        screen: "dashboard_location_switcher",
        options: activeLocations.map((location) => ({
            id: location.id,
            label: location.name,
            active: location.id === resolvedSelectedId,
            href: `/dashboard/locations/${location.id}`
        })),
        multiLocation: activeLocations.length > 1
    };
    if (resolvedSelectedId) {
        screen.selectedLocationId = resolvedSelectedId;
    }
    return screen;
}
export function buildPublicScheduleLocationSwitcher(locations, selectedLocationId) {
    const activeLocations = locations.filter((location) => location.status === LocationStatus.Active);
    const screen = {
        screen: "public_schedule_location_switcher",
        options: [
            {
                id: "all",
                label: "All locations",
                active: !selectedLocationId,
                href: "/schedule"
            },
            ...activeLocations.map((location) => ({
                id: location.id,
                label: location.name,
                active: location.id === selectedLocationId,
                href: `/schedule?locationId=${encodeURIComponent(location.id)}`
            }))
        ]
    };
    if (selectedLocationId) {
        screen.selectedLocationId = selectedLocationId;
    }
    return screen;
}
//# sourceMappingURL=switchers.js.map