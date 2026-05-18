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
export declare function buildAccessEventHistoryScreen(events: AccessEventView[], filters?: AccessEventHistoryFilters): AccessEventHistoryScreen;
//# sourceMappingURL=events.d.ts.map