import { LocationStatus } from "@gym-platform/constants";
import { button, emptyState, table } from "@gym-platform/ui";
import { formatAddress } from "./address.js";
export function buildLocationListPage(locations, selectedLocationId) {
    const activeLocations = locations.filter((location) => location.status === LocationStatus.Active);
    const activeCount = activeLocations.length;
    const archivedCount = locations.length - activeLocations.length;
    const rows = activeLocations
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id))
        .map((location) => ({
        id: location.id,
        name: location.name,
        address: formatAddress(location.address),
        phoneLabel: location.phone ?? "No phone",
        timezone: location.timezone,
        status: location.status,
        detailHref: `/locations/${location.id}`
    }));
    const empty = rows.length === 0
        ? emptyState({
            title: "No active locations",
            body: archivedCount > 0 ? "Archived locations are hidden from the active list." : "Add a location to start organizing classes, access rules, and schedules.",
            action: button({ label: "Add location", icon: "plus" })
        })
        : undefined;
    const page = {
        screen: "location_list",
        locations: rows,
        rows,
        summary: {
            totalCount: locations.length,
            activeCount,
            archivedCount,
            visibleCount: rows.length
        },
        table: table({
            columns: [
                { key: "name", label: "Location" },
                { key: "address", label: "Address" },
                { key: "phoneLabel", label: "Phone" },
                { key: "timezone", label: "Timezone" },
                { key: "status", label: "Status" }
            ],
            rows,
            ...(empty ? { empty } : {})
        }),
        ...(empty ? { empty } : {}),
        createLocationAction: button({
            label: "Add location",
            icon: "plus"
        })
    };
    const selectedLocation = activeLocations.find((location) => location.id === selectedLocationId) ?? activeLocations[0];
    if (selectedLocation) {
        page.selectedLocation = selectedLocation;
    }
    return page;
}
//# sourceMappingURL=list.js.map