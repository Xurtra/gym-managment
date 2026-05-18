import { table } from "@gym-platform/ui";
export function buildLocationReportingFilters(locations, selectedLocationIds = []) {
    const selected = new Set(selectedLocationIds);
    return {
        screen: "location_reporting_filters",
        selectedLocationIds,
        options: locations.map((location) => ({
            id: location.id,
            label: location.name,
            selected: selected.has(location.id)
        })),
        multiLocation: locations.length > 1
    };
}
export function applyLocationReportingFilters(records, selectedLocationIds = []) {
    if (selectedLocationIds.length === 0) {
        return records;
    }
    const selected = new Set(selectedLocationIds);
    return records.filter((record) => record.locationId && selected.has(record.locationId));
}
export function buildLocationReportingView(input) {
    const filters = buildLocationReportingFilters(input.locations, input.selectedLocationIds ?? []);
    const records = applyLocationReportingFilters(input.records, filters.selectedLocationIds);
    return {
        screen: "location_reporting",
        filters,
        records,
        table: table({
            columns: [
                { key: "locationName", label: "Location" },
                { key: "metric", label: "Metric" },
                { key: "value", label: "Value" },
                { key: "occurredAt", label: "Date" }
            ],
            rows: records
        })
    };
}
//# sourceMappingURL=reporting.js.map