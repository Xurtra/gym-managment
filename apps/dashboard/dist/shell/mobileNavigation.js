import { button } from "@gym-platform/ui";
import { buildGroupedDashboardNavigation } from "./navigation.js";
export function buildMobileDashboardNavigation(inputModel) {
    const groups = buildGroupedDashboardNavigation(inputModel.path, inputModel.context ?? { permissions: [] });
    return {
        open: inputModel.open ?? false,
        activePath: inputModel.path,
        groups,
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
        itemCount: groups.reduce((total, group) => total + group.items.length, 0)
    };
}
//# sourceMappingURL=mobileNavigation.js.map