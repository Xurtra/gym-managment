import { button, emptyState } from "@gym-platform/ui";
export function buildDashboardDetailDrawer(inputModel) {
    const sections = inputModel.sections.map((section) => ({
        key: section.key,
        title: section.title,
        items: section.items.map((item) => {
            const value = formatDetailValue(item.value);
            return {
                key: item.key,
                label: item.label,
                value,
                empty: value.length === 0
            };
        })
    }));
    const itemCount = sections.reduce((total, section) => total + section.items.length, 0);
    const drawer = {
        kind: "dashboard_detail_drawer",
        title: inputModel.title.trim(),
        open: inputModel.open ?? false,
        sections,
        actions: (inputModel.actions ?? []).map(buildDetailAction),
        closeAction: button({
            label: "Close details",
            icon: "x",
            intent: "secondary"
        })
    };
    const subtitle = inputModel.subtitle?.trim();
    if (subtitle) {
        drawer.subtitle = subtitle;
    }
    if (itemCount === 0) {
        drawer.empty = emptyState({
            title: "No details",
            body: "There are no details to show yet."
        });
    }
    return drawer;
}
function buildDetailAction(action) {
    const detailAction = {
        key: action.key,
        button: button({
            label: action.label,
            intent: action.intent ?? "secondary",
            disabled: action.disabled ?? false,
            ...(action.icon ? { icon: action.icon } : {})
        })
    };
    if (action.href) {
        detailAction.href = action.href;
    }
    return detailAction;
}
function formatDetailValue(value) {
    if (value === null || value === undefined) {
        return "";
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }
    return String(value);
}
//# sourceMappingURL=detailDrawer.js.map