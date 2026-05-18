import { AccessEventDecision } from "@gym-platform/constants";
import type { AccessEventView } from "./types.js";

export interface AccessEventHistoryScreen {
  screen: "access_event_history";
  events: AccessEventView[];
  deniedCount: number;
  filters: AccessEventHistoryFilters;
}

export interface AccessEventHistoryFilters {
  locationId?: string;
  decision?: AccessEventDecision;
  from?: string;
  to?: string;
}

export function buildAccessEventHistoryScreen(
  events: AccessEventView[],
  filters: AccessEventHistoryFilters = {}
): AccessEventHistoryScreen {
  const filtered = events
    .filter((event) => matchesFilters(event, filters))
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
  return {
    screen: "access_event_history",
    events: filtered,
    deniedCount: filtered.filter((event) => event.decision === AccessEventDecision.Deny).length,
    filters
  };
}

function matchesFilters(event: AccessEventView, filters: AccessEventHistoryFilters) {
  if (filters.locationId && event.locationId !== filters.locationId) {
    return false;
  }
  if (filters.decision && event.decision !== filters.decision) {
    return false;
  }
  if (filters.from && Date.parse(event.occurredAt) < Date.parse(filters.from)) {
    return false;
  }
  if (filters.to && Date.parse(event.occurredAt) > Date.parse(filters.to)) {
    return false;
  }
  return true;
}
