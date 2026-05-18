import { LocationStatus } from "@gym-platform/constants";
import { button, emptyState, table } from "@gym-platform/ui";
import { formatAddress } from "./address.js";
export function buildLocationListPage(locations, selectedLocationId) {
    const activeLocations = locations.filter((location) => location.status === LocationStatus.Active);
    const archivedCount = locations.length - activeLocations.length;
    const rows = activeLocations.map((location) => ({
        id: location.id,
        name: location.name,
        address: formatAddress(location.address),
        timezone: location.timezone,
        status: location.status
    }));
    const page = {
        screen: "location_list",
        locations: rows,
        activeCount: activeLocations.length,
        archivedCount,
        table: table({
            columns: [
                { key: "name", label: "Location" },
                { key: "address", label: "Address" },
                { key: "timezone", label: "Timezone" },
                { key: "status", label: "Status" }
            ],
            rows,
            empty: emptyState({
                title: "No active locations",
                action: button({ label: "Add location" })
            })
        })
    };
    const selectedLocation = activeLocations.find((location) => location.id === selectedLocationId);
    if (selectedLocation) {
        page.selectedLocation = selectedLocation;
    }
    if (rows.length === 0) {
        page.empty = emptyState({
            title: "No active locations",
            action: button({ label: "Add location" })
        });
    }
    return page;
}
//# sourceMappingURL=list.js.map