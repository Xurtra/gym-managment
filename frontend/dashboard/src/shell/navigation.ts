import { buildGuardedNavigation } from "../routing/index.js";
import type { DashboardPermissionContext, GuardedNavigationItem } from "../routing/index.js";
import type { DashboardNavigationGroup } from "./types.js";

export function buildGroupedDashboardNavigation(
  path: string,
  context: DashboardPermissionContext = { permissions: [] }
): DashboardNavigationGroup[] {
  const items = buildGuardedNavigation(path, context);
  return navigationGroups.flatMap((group) => {
    const groupItems = group.paths
      .map((groupPath) => items.find((item) => item.href === groupPath))
      .filter((item): item is GuardedNavigationItem => Boolean(item));
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
    paths: ["/consumers", "/check-ins"]
  },
  {
    key: "classes",
    label: "Classes",
    paths: ["/classes"]
  },
  {
    key: "operations",
    label: "Operations",
    paths: ["/access-control", "/migration", "/reports", "/settings"]
  }
] as const;
