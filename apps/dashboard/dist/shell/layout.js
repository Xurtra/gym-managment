import { resolveDashboardRoute } from "../routing/index.js";
import { buildAccountMenu } from "./accountMenu.js";
import { buildGlobalGymSearch } from "./globalSearch.js";
import { buildDashboardHomePage } from "./home.js";
import { buildMobileDashboardNavigation } from "./mobileNavigation.js";
import { buildGroupedDashboardNavigation } from "./navigation.js";
import { buildPageHeader } from "./pageHeader.js";
export function buildDashboardShellLayout(inputModel) {
    const route = resolveDashboardRoute(inputModel.path);
    const permissionContext = {
        permissions: inputModel.permissions ?? [],
        ...(inputModel.platformAdmin !== undefined ? { platformAdmin: inputModel.platformAdmin } : {})
    };
    const accountInput = {
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
    const searchInput = {
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
    const content = {
        id: route.path === "/" ? "dashboard-home" : route.path.slice(1).replaceAll("/", "-"),
        title: route.title,
        loading: inputModel.contentLoading ?? false,
        pageHeader: inputModel.pageHeader ??
            buildPageHeader({
                title: route.title,
                breadcrumbs: [
                    { label: "Dashboard", href: "/" },
                    { label: route.title, href: route.path }
                ]
            })
    };
    if (route.path === "/") {
        const homeInput = {
            metrics: inputModel.homeMetrics ?? {},
            permissions: permissionContext.permissions
        };
        if (inputModel.homeDeltas) {
            homeInput.deltas = inputModel.homeDeltas;
        }
        content.homePage = buildDashboardHomePage(homeInput);
    }
    const mobileNavigationInput = {
        path: route.path,
        context: permissionContext
    };
    if (inputModel.mobileNavigationOpen !== undefined) {
        mobileNavigationInput.open = inputModel.mobileNavigationOpen;
    }
    const mobileNavigation = buildMobileDashboardNavigation(mobileNavigationInput);
    const groups = buildGroupedDashboardNavigation(route.path, permissionContext);
    const globalSearch = buildGlobalGymSearch(searchInput);
    const activeGroup = groups.find((group) => group.active);
    return {
        screen: "dashboard_shell",
        routePath: route.path,
        sidebar: {
            collapsed: inputModel.sidebarCollapsed ?? false,
            groupCount: groups.length,
            itemCount: groups.reduce((total, group) => total + group.itemCount, 0),
            ...(activeGroup ? { activeGroupKey: activeGroup.key } : {}),
            groups
        },
        topBar: {
            title: route.title,
            ...(inputModel.gymName ? { gymName: inputModel.gymName } : {}),
            searchResultCount: globalSearch.resultCount,
            globalSearch,
            accountMenu: buildAccountMenu(accountInput)
        },
        content,
        mobileNavigation,
        mobileMenuAction: mobileNavigation.toggleAction,
        permissionContext
    };
}
//# sourceMappingURL=layout.js.map