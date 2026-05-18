import { resolveDashboardRoute } from "../routing/index.js";
import type { DashboardPermissionContext } from "../routing/index.js";
import { buildAccountMenu } from "./accountMenu.js";
import { buildGlobalGymSearch, type GlobalSearchItem } from "./globalSearch.js";
import { buildDashboardHomePage } from "./home.js";
import type { DashboardSummaryMetric } from "./home.js";
import { buildMobileDashboardNavigation } from "./mobileNavigation.js";
import { buildGroupedDashboardNavigation } from "./navigation.js";
import { buildPageHeader } from "./pageHeader.js";
import type { PageHeaderModel } from "./pageHeader.js";
import type { DashboardShellLayout } from "./types.js";

export function buildDashboardShellLayout(inputModel: {
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
}): DashboardShellLayout {
  const route = resolveDashboardRoute(inputModel.path);
  const permissionContext: DashboardPermissionContext = {
    permissions: inputModel.permissions ?? [],
    ...(inputModel.platformAdmin !== undefined ? { platformAdmin: inputModel.platformAdmin } : {})
  };
  const accountInput: Parameters<typeof buildAccountMenu>[0] = {
    email: inputModel.email,
    permissions: permissionContext.permissions
  };
  if (inputModel.firstName) {
    accountInput.firstName = inputModel.firstName;
  }
  if (inputModel.lastName) {
    accountInput.lastName = inputModel.lastName;
  }
  if (inputModel.gymName) {
    accountInput.gymName = inputModel.gymName;
  }
  const searchInput: Parameters<typeof buildGlobalGymSearch>[0] = {
    permissions: permissionContext.permissions
  };
  if (inputModel.searchQuery) {
    searchInput.query = inputModel.searchQuery;
  }
  if (inputModel.searchItems) {
    searchInput.items = inputModel.searchItems;
  }
  if (inputModel.selectedSearchResultId) {
    searchInput.selectedResultId = inputModel.selectedSearchResultId;
  }
  if (permissionContext.platformAdmin !== undefined) {
    searchInput.platformAdmin = permissionContext.platformAdmin;
  }

  const content: DashboardShellLayout["content"] = {
    id: route.path === "/" ? "dashboard-home" : route.path.slice(1).replaceAll("/", "-"),
    title: route.title,
    loading: inputModel.contentLoading ?? false,
    pageHeader:
      inputModel.pageHeader ??
      buildPageHeader({
        title: route.title,
        breadcrumbs: [
          { label: "Dashboard", href: "/" },
          { label: route.title, href: route.path }
        ]
      })
  };
  if (route.path === "/") {
    const homeInput: Parameters<typeof buildDashboardHomePage>[0] = {
      metrics: inputModel.homeMetrics ?? {},
      permissions: permissionContext.permissions
    };
    if (inputModel.homeDeltas) {
      homeInput.deltas = inputModel.homeDeltas;
    }
    content.homePage = buildDashboardHomePage(homeInput);
  }
  const mobileNavigationInput: Parameters<typeof buildMobileDashboardNavigation>[0] = {
    path: route.path,
    context: permissionContext
  };
  if (inputModel.mobileNavigationOpen !== undefined) {
    mobileNavigationInput.open = inputModel.mobileNavigationOpen;
  }
  const mobileNavigation = buildMobileDashboardNavigation(mobileNavigationInput);

  return {
    screen: "dashboard_shell",
    routePath: route.path,
    sidebar: {
      collapsed: inputModel.sidebarCollapsed ?? false,
      groups: buildGroupedDashboardNavigation(route.path, permissionContext)
    },
    topBar: {
      title: route.title,
      ...(inputModel.gymName ? { gymName: inputModel.gymName } : {}),
      globalSearch: buildGlobalGymSearch(searchInput),
      accountMenu: buildAccountMenu(accountInput)
    },
    content,
    mobileNavigation,
    mobileMenuAction: mobileNavigation.toggleAction,
    permissionContext
  };
}
