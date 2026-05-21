import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import type { DashboardPermissionContext } from "../routing/index.js";
import { buildGroupedDashboardNavigation } from "./navigation.js";
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

export function buildMobileDashboardNavigation(inputModel: {
  path: string;
  context?: DashboardPermissionContext;
  open?: boolean;
}): MobileDashboardNavigation {
  const groups = buildGroupedDashboardNavigation(
    inputModel.path,
    inputModel.context ?? { permissions: [] }
  );
  const activeGroup = groups.find((group) => group.active);
  const itemCount = groups.reduce((total, group) => total + group.items.length, 0);
  return {
    open: inputModel.open ?? false,
    activePath: inputModel.path,
    groups,
    groupCount: groups.length,
    ...(activeGroup ? { activeGroupKey: activeGroup.key } : {}),
    summaryLabel:
      itemCount === 0
        ? "No mobile navigation items"
        : `${itemCount} mobile navigation item${itemCount === 1 ? "" : "s"}`,
    toggleAction: button({
      label: "Menu",
      icon: "menu",
      intent: "secondary"
    }),
    closeAction: button({
      label: "Close",
      icon: "x",
      intent: "secondary"
    }),
    itemCount
  };
}
