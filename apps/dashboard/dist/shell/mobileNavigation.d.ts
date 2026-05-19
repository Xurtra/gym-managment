import type { ButtonModel } from "@gym-platform/ui";
import type { DashboardPermissionContext } from "../routing/index.js";
import type { DashboardNavigationGroup } from "./types.js";
export interface MobileDashboardNavigation {
    open: boolean;
    activePath: string;
    groups: DashboardNavigationGroup[];
    groupCount: number;
    activeGroupKey?: string;
    summaryLabel: string;
    toggleAction: ButtonModel;
    closeAction: ButtonModel;
    itemCount: number;
}
export declare function buildMobileDashboardNavigation(inputModel: {
    path: string;
    context?: DashboardPermissionContext;
    open?: boolean;
}): MobileDashboardNavigation;
//# sourceMappingURL=mobileNavigation.d.ts.map