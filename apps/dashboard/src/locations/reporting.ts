import { table } from "@gym-platform/ui";
import type { TableModel } from "@gym-platform/ui";
import type { LocationView, ReportingLocationRecord } from "./types.js";

export interface LocationReportingFilters {
  screen: "location_reporting_filters";
  selectedLocationIds: string[];
  options: Array<{ id: string; label: string; selected: boolean }>;
  multiLocation: boolean;
}

export interface LocationReportingView {
  screen: "location_reporting";
  filters: LocationReportingFilters;
  records: ReportingLocationRecord[];
  table: TableModel<ReportingLocationRecord>;
}

export function buildLocationReportingFilters(
  locations: LocationView[],
  selectedLocationIds: string[] = []
): LocationReportingFilters {
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
