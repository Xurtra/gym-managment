import { input } from "@gym-platform/ui";
import { canAccessDashboardRoute, dashboardRoutes } from "../routing/index.js";
export function buildGlobalGymSearch(inputModel) {
    const query = inputModel.query?.trim() ?? "";
    const context = {
        permissions: inputModel.permissions ?? [],
        ...(inputModel.platformAdmin !== undefined ? { platformAdmin: inputModel.platformAdmin } : {})
    };
    const items = [...buildRouteSearchItems(context), ...(inputModel.items ?? [])].filter((item) => canAccessSearchItem(item, context));
    const results = rankSearchItems(items, query)
        .slice(0, inputModel.limit ?? 8)
        .map((result) => ({
        ...result,
        selected: result.id === inputModel.selectedResultId,
        typeLabel: globalSearchTypeLabels[result.type]
    }));
    const selectedResult = results.find((result) => result.selected);
    const routeResultCount = results.filter((result) => result.type === "route").length;
    const entityResultCount = results.length - routeResultCount;
    const model = {
        kind: "global_gym_search",
        queryField: input({
            name: "globalSearch",
            label: "Search",
            value: query,
            type: "text",
            required: false
        }),
        open: query.length > 0,
        query,
        placeholder: "Search gym",
        resultCount: results.length,
        routeResultCount,
        entityResultCount,
        summaryLabel: query.length === 0
            ? "Search routes and gym records"
            : results.length === 0
                ? `No results for "${query}"`
                : `${results.length} result${results.length === 1 ? "" : "s"}`,
        results,
        empty: query.length > 0 && results.length === 0
    };
    const selectedResultIndex = results.findIndex((result) => result.selected);
    if (selectedResultIndex >= 0) {
        model.selectedResultIndex = selectedResultIndex;
    }
    if (selectedResult) {
        model.selectedResult = selectedResult;
    }
    return model;
}
function buildRouteSearchItems(context) {
    return dashboardRoutes
        .filter((route) => route.protected)
        .filter((route) => canAccessDashboardRoute(route, context))
        .map((route) => ({
        id: `route:${route.path}`,
        type: "route",
        title: route.title,
        subtitle: "Dashboard",
        href: route.path,
        keywords: [route.path.replace("/", ""), ...route.title.split(/\s+/)]
    }));
}
function canAccessSearchItem(item, context) {
    if (context.platformAdmin) {
        return true;
    }
    const requiredPermissions = item.requiredPermissions ?? [];
    return requiredPermissions.every((permission) => context.permissions.includes(permission));
}
function rankSearchItems(items, query) {
    if (!query) {
        return [];
    }
    const normalizedQuery = normalize(query);
    return items
        .map((item) => {
        const score = scoreSearchItem(item, normalizedQuery);
        return { ...item, score, selected: false };
    })
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}
function scoreSearchItem(item, normalizedQuery) {
    const title = normalize(item.title);
    const subtitle = normalize(item.subtitle ?? "");
    const keywords = (item.keywords ?? []).map(normalize);
    if (title === normalizedQuery) {
        return 100;
    }
    if (title.startsWith(normalizedQuery)) {
        return 80;
    }
    if (title.includes(normalizedQuery)) {
        return 60;
    }
    if (keywords.some((keyword) => keyword.startsWith(normalizedQuery))) {
        return 50;
    }
    if (keywords.some((keyword) => keyword.includes(normalizedQuery))) {
        return 35;
    }
    if (subtitle.includes(normalizedQuery)) {
        return 20;
    }
    return 0;
}
function normalize(value) {
    return value.trim().toLowerCase();
}
const globalSearchTypeLabels = {
    route: "Route",
    gym: "Gym",
    location: "Location",
    member: "Member",
    staff: "Staff",
    class: "Class",
    plan: "Plan"
};
//# sourceMappingURL=globalSearch.js.map