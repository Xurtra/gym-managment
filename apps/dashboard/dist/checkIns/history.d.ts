import { CheckInStatus } from "@gym-platform/constants";
import type { CheckInRecord } from "./types.js";
export interface CheckInHistoryFilters {
    memberId?: string;
    status?: CheckInStatus;
    from?: string;
    to?: string;
}
export interface CheckInHistoryScreen {
    screen: "check_in_history";
    records: CheckInRecord[];
    total: number;
    filters: CheckInHistoryFilters;
}
export declare function buildCheckInHistoryScreen(records: CheckInRecord[], filters?: CheckInHistoryFilters): CheckInHistoryScreen;
export declare function exportCheckInHistoryCsv(records: CheckInRecord[]): string;
//# sourceMappingURL=history.d.ts.map