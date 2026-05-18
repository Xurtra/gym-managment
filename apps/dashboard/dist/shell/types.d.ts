import type { ButtonModel } from "@gym-platform/ui";
import type { DashboardPermissionContext, GuardedNavigationItem } from "../routing/index.js";
import type { GlobalGymSearchModel } from "./globalSearch.js";
import type { DashboardHomePage } from "./home.js";
import type { MobileDashboardNavigation } from "./mobileNavigation.js";
import type { PageHeaderModel } from "./pageHeader.js";
export interface DashboardNavigationGroup {
    key: string;
    label: string;
    items: GuardedNavigationItem[];
}
export interface AccountMenuItem {
    key: "profile" | "settings" | "logout";
    label: string;
    href?: string;
    action?: "logout";
    disabled: boolean;
}
export interface AccountMenuModel {
    userName: string;
    userEmail: string;
    gymName?: string;
    items: AccountMenuItem[];
}
export interface DashboardSidebarModel {
    collapsed: boolean;
    groups: DashboardNavigationGroup[];
}
export interface DashboardTopBarModel {
    title: string;
    gymName?: string;
    globalSearch: GlobalGymSearchModel;
    accountMenu: AccountMenuModel;
}
export interface DashboardContentRegion {
    id: string;
    title: string;
    loading: boolean;
    pageHeader: PageHeaderModel;
    homePage?: DashboardHomePage;
}
export interface DashboardShellLayout {
    screen: "dashboard_shell";
    routePath: string;
    sidebar: DashboardSidebarModel;
    topBar: DashboardTopBarModel;
    content: DashboardContentRegion;
    mobileNavigation: MobileDashboardNavigation;
    mobileMenuAction: ButtonModel;
    permissionContext: DashboardPermissionContext;
}
//# sourceMappingURL=types.d.ts.map