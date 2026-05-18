import { LocationStatus } from "@gym-platform/constants";
import type { LocationSwitcherOption, LocationView } from "./types.js";

export interface DashboardLocationSwitcher {
  screen: "dashboard_location_switcher";
  selectedLocationId?: string;
  options: LocationSwitcherOption[];
  multiLocation: boolean;
}

export interface PublicScheduleLocationSwitcher {
  screen: "public_schedule_location_switcher";
  selectedLocationId?: string;
  options: LocationSwitcherOption[];
}

export function buildDashboardLocationSwitcher(
  locations: LocationView[],
  selectedLocationId?: string
): DashboardLocationSwitcher {
  const activeLocations = locations.filter((location) => location.status === LocationStatus.Active);
  const selectedLocation = activeLocations.find((location) => location.id === selectedLocationId);
  const resolvedSelectedId = selectedLocation?.id ?? activeLocations[0]?.id;
  const screen: DashboardLocationSwitcher = {
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

export function buildPublicScheduleLocationSwitcher(
  locations: LocationView[],
  selectedLocationId?: string
): PublicScheduleLocationSwitcher {
  const activeLocations = locations.filter((location) => location.status === LocationStatus.Active);
  const screen: PublicScheduleLocationSwitcher = {
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
