import { buildGuardedNavigation } from "../routing/index.js";
export function buildGroupedDashboardNavigation(path, context = { permissions: [] }) {
    const items = buildGuardedNavigation(path, context);
    return navigationGroups.flatMap((group) => {
        const groupItems = group.paths
            .map((groupPath) => items.find((item) => item.href === groupPath))
            .filter((item) => Boolean(item));
        return groupItems.length > 0
            ? [
                {
                    key: group.key,
                    label: group.label,
                    active: groupItems.some((item) => item.active),
                    itemCount: groupItems.length,
                    items: groupItems
                }
            ]
            : [];
    });
}
const navigationGroups = [
    {
        key: "workspace",
        label: "Workspace",
        paths: ["/", "/locations"]
    },
    {
        key: "people",
        label: "People",
        paths: ["/members", "/check-ins"]
    },
    {
        key: "classes",
        label: "Classes",
        paths: ["/classes"]
    },
    {
        key: "operations",
        label: "Operations",
        paths: ["/access-control", "/reports", "/settings"]
    }
];
//# sourceMappingURL=navigation.js.map