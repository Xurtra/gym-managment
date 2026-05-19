import { LocationStatus } from "@gym-platform/constants";
import { button, emptyState, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, TableModel } from "@gym-platform/ui";
import { formatAddress } from "./address.js";
import type { LocationView } from "./types.js";

export interface LocationListRow {
  id: string;
  name: string;
  address: string;
  phoneLabel: string;
  timezone: string;
  status: string;
  detailHref: string;
}

export interface LocationListSummary {
  totalCount: number;
  activeCount: number;
  archivedCount: number;
  visibleCount: number;
}

export interface LocationListPage {
  screen: "location_list";
  locations: LocationListRow[];
  rows: LocationListRow[];
  summary: LocationListSummary;
  selectedLocation?: LocationView;
  table: TableModel<LocationListRow>;
  empty?: EmptyStateModel;
  createLocationAction: ButtonModel;
}

export function buildLocationListPage(
  locations: LocationView[],
  selectedLocationId?: string
): LocationListPage {
  const activeLocations = locations.filter((location) => location.status === LocationStatus.Active);
  const activeCount = activeLocations.length;
  const archivedCount = locations.length - activeLocations.length;
  const rows: LocationListRow[] = activeLocations
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
  const empty =
    rows.length === 0
      ? emptyState({
          title: "No active locations",
          body: archivedCount > 0 ? "Archived locations are hidden from the active list." : "Add a location to start organizing classes, access rules, and schedules.",
          action: button({ label: "Add location", icon: "plus" })
        })
      : undefined;
  const page: LocationListPage = {
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
  const selectedLocation =
    activeLocations.find((location) => location.id === selectedLocationId) ?? activeLocations[0];
  if (selectedLocation) {
    page.selectedLocation = selectedLocation;
  }
  return page;
}
