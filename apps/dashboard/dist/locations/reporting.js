import { emptyState, table } from "@gym-platform/ui";
export function buildLocationReportingFilters(locations, records = [], selectedLocationIds = []) {
    const sortedLocations = locations.slice().sort((left, right) => left.name.localeCompare(right.name));
    const locationIds = new Set(sortedLocations.map((location) => location.id));
    const normalizedSelectedLocationIds = selectedLocationIds.filter((locationId) => locationIds.has(locationId));
    const selected = new Set(normalizedSelectedLocationIds);
    const options = sortedLocations.map((location) => ({
        id: location.id,
        label: location.name,
        selected: selected.has(location.id),
        recordCount: records.filter((record) => record.locationId === location.id).length
    }));
    const empty = options.length === 0
        ? emptyState({
            title: "No reporting locations",
            body: "Create a location before filtering reporting data by location."
        })
        : undefined;
    return {
        screen: "location_reporting_filters",
        selectedLocationIds: normalizedSelectedLocationIds,
        options,
        optionCount: options.length,
        selectedCount: normalizedSelectedLocationIds.length,
        summaryLabel: options.length === 0
            ? "No locations available"
            : normalizedSelectedLocationIds.length === 0
                ? "All locations"
                : `${normalizedSelectedLocationIds.length} location${normalizedSelectedLocationIds.length === 1 ? "" : "s"} selected`,
        multiLocation: options.length > 1,
        ...(empty ? { empty } : {})
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
    const filters = buildLocationReportingFilters(input.locations, input.records, input.selectedLocationIds ?? []);
    const records = applyLocationReportingFilters(input.records, filters.selectedLocationIds).slice().sort(compareReportingRecords);
    const empty = records.length === 0
        ? emptyState({
            title: filters.selectedCount > 0 ? "No reporting records match these locations" : "No reporting records",
            body: filters.selectedCount > 0
                ? "Adjust the selected locations to view more reporting data."
                : "Reporting records will appear here once activity is recorded."
        })
        : undefined;
    return {
        screen: "location_reporting",
        filters,
        summary: {
            totalCount: input.records.length,
            visibleCount: records.length,
            selectedLocationCount: filters.selectedCount,
            unassignedCount: input.records.filter((record) => !record.locationId).length
        },
        records,
        ...(empty ? { empty } : {}),
        table: table({
            columns: [
                { key: "locationName", label: "Location" },
                { key: "metric", label: "Metric" },
                { key: "value", label: "Value" },
                { key: "occurredAt", label: "Date" }
            ],
            rows: records,
            ...(empty ? { empty } : {})
        })
    };
}
function compareReportingRecords(left, right) {
    return ((right.occurredAt ?? "").localeCompare(left.occurredAt ?? "") ||
        (left.locationName ?? "").localeCompare(right.locationName ?? "") ||
        left.id.localeCompare(right.id));
}
//# sourceMappingURL=reporting.js.map