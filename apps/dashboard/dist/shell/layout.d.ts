import type { DashboardPermissionContext } from "../routing/index.js";
import { type GlobalSearchItem } from "./globalSearch.js";
import type { DashboardSummaryMetric } from "./home.js";
import type { PageHeaderModel } from "./pageHeader.js";
import type { DashboardShellLayout } from "./types.js";
export declare function buildDashboardShellLayout(inputModel: {
    path: string;
    permissions?: DashboardPermissionContext["permissions"];
    platformAdmin?: boolean;
    firstName?: string;
    lastName?: string;
    email: string;
    gymName?: string;
    searchQuery?: string;
    searchItems?: GlobalSearchItem[];
    selectedSearchResultId?: string;
    homeMetrics?: Partial<Record<DashboardSummaryMetric["key"], number>>;
    homeDeltas?: Partial<Record<DashboardSummaryMetric["key"], number>>;
    pageHeader?: PageHeaderModel;
    mobileNavigationOpen?: boolean;
    sidebarCollapsed?: boolean;
    contentLoading?: boolean;
}): DashboardShellLayout;
//# sourceMappingURL=layout.d.ts.map