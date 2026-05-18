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
        selected: result.id === inputModel.selectedResultId
    }));
    const selectedResult = results.find((result) => result.selected);
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
        results,
        empty: query.length > 0 && results.length === 0
    };
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
//# sourceMappingURL=globalSearch.js.map