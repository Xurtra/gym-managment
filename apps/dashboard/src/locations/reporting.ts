import { emptyState, table } from "@gym-platform/ui";
import type { EmptyStateModel, TableModel } from "@gym-platform/ui";
import type { LocationView, ReportingLocationRecord } from "./types.js";

export interface LocationReportingFilterOption {
  id: string;
  label: string;
  selected: boolean;
  recordCount: number;
}

export interface LocationReportingFilters {
  screen: "location_reporting_filters";
  selectedLocationIds: string[];
  options: LocationReportingFilterOption[];
  optionCount: number;
  selectedCount: number;
  summaryLabel: string;
  multiLocation: boolean;
  empty?: EmptyStateModel;
}

export interface LocationReportingSummary {
  totalCount: number;
  visibleCount: number;
  selectedLocationCount: number;
  unassignedCount: number;
}

export interface LocationReportingView {
  screen: "location_reporting";
  filters: LocationReportingFilters;
  summary: LocationReportingSummary;
  records: ReportingLocationRecord[];
  empty?: EmptyStateModel;
  table: TableModel<ReportingLocationRecord>;
}

export function buildLocationReportingFilters(
  locations: LocationView[],
  records: ReportingLocationRecord[] = [],
  selectedLocationIds: string[] = []
): LocationReportingFilters {
  const sortedLocations = locations.slice().sort((left, right) => left.name.localeCompare(right.name));
  const locationIds = new Set(sortedLocations.map((location) => location.id));
  const normalizedSelectedLocationIds = selectedLocationIds.filter((locationId) =>
    locationIds.has(locationId)
  );
  const selected = new Set(normalizedSelectedLocationIds);
  const options = sortedLocations.map((location) => ({
    id: location.id,
    label: location.name,
    selected: selected.has(location.id),
    recordCount: records.filter((record) => record.locationId === location.id).length
  }));
  const empty =
    options.length === 0
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
    summaryLabel:
      options.length === 0
        ? "No locations available"
        : normalizedSelectedLocationIds.length === 0
          ? "All locations"
          : `${normalizedSelectedLocationIds.length} location${
              normalizedSelectedLocationIds.length === 1 ? "" : "s"
            } selected`,
    multiLocation: options.length > 1,
    ...(empty ? { empty } : {})
  };
}

export function applyLocationReportingFilters(
  records: ReportingLocationRecord[],
  selectedLocationIds: string[] = []
) {
  if (selectedLocationIds.length === 0) {
    return records;
  }
  const selected = new Set(selectedLocationIds);
  return records.filter((record) => record.locationId && selected.has(record.locationId));
}

export function buildLocationReportingView(input: {
  locations: LocationView[];
  records: ReportingLocationRecord[];
  selectedLocationIds?: string[];
}): LocationReportingView {
  const filters = buildLocationReportingFilters(
    input.locations,
    input.records,
    input.selectedLocationIds ?? []
  );
  const records = applyLocationReportingFilters(input.records, filters.selectedLocationIds).slice().sort(
    compareReportingRecords
  );
  const empty =
    records.length === 0
      ? emptyState({
          title:
            filters.selectedCount > 0 ? "No reporting records match these locations" : "No reporting records",
          body:
            filters.selectedCount > 0
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

function compareReportingRecords(left: ReportingLocationRecord, right: ReportingLocationRecord) {
  return (
    (right.occurredAt ?? "").localeCompare(left.occurredAt ?? "") ||
    (left.locationName ?? "").localeCompare(right.locationName ?? "") ||
    left.id.localeCompare(right.id)
  );
}
