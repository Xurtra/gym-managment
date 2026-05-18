import { AccessEventDecision } from "@gym-platform/constants";
export function buildAccessEventHistoryScreen(events, filters = {}) {
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
function matchesFilters(event, filters) {
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
//# sourceMappingURL=events.js.map