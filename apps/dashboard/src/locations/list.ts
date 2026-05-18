import { LocationStatus } from "@gym-platform/constants";
import { button, emptyState, table } from "@gym-platform/ui";
import type { EmptyStateModel, TableModel } from "@gym-platform/ui";
import { formatAddress } from "./address.js";
import type { LocationView } from "./types.js";

export interface LocationListRow {
  id: string;
  name: string;
  address: string;
  timezone: string;
  status: string;
}

export interface LocationListPage {
  screen: "location_list";
  locations: LocationListRow[];
  activeCount: number;
  archivedCount: number;
  selectedLocation?: LocationView;
  table: TableModel<LocationListRow>;
  empty?: EmptyStateModel;
}

export function buildLocationListPage(
  locations: LocationView[],
  selectedLocationId?: string
): LocationListPage {
  const activeLocations = locations.filter((location) => location.status === LocationStatus.Active);
  const archivedCount = locations.length - activeLocations.length;
  const rows: LocationListRow[] = activeLocations.map((location) => ({
    id: location.id,
    name: location.name,
    address: formatAddress(location.address),
    timezone: location.timezone,
    status: location.status
  }));
  const page: LocationListPage = {
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
