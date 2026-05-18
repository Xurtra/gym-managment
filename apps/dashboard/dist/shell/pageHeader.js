import { button } from "@gym-platform/ui";
export function buildPageHeader(inputModel) {
    const header = {
        kind: "page_header",
        title: inputModel.title.trim(),
        breadcrumbs: buildBreadcrumbs(inputModel.breadcrumbs ?? []),
        secondaryActions: (inputModel.secondaryActions ?? []).map((action) => buildHeaderAction(action, "secondary")),
        tabs: (inputModel.tabs ?? []).map((tab) => ({
            key: tab.key,
            label: tab.label,
            href: tab.href,
            active: tab.key === inputModel.activeTabKey,
            disabled: tab.disabled ?? false
        }))
    };
    const eyebrow = inputModel.eyebrow?.trim();
    if (eyebrow) {
        header.eyebrow = eyebrow;
    }
    const description = inputModel.description?.trim();
    if (description) {
        header.description = description;
    }
    if (inputModel.primaryAction) {
        header.primaryAction = buildHeaderAction(inputModel.primaryAction, "primary");
    }
    return header;
}
function buildBreadcrumbs(items) {
    return items.map((item, index) => ({
        label: item.label,
        href: item.href,
        current: index === items.length - 1
    }));
}
function buildHeaderAction(action, intent) {
    const headerAction = {
        key: action.key,
        button: button({
            label: action.label,
            intent,
            disabled: action.disabled ?? false,
            ...(action.icon ? { icon: action.icon } : {})
        })
    };
    if (action.href) {
        headerAction.href = action.href;
    }
    return headerAction;
}
//# sourceMappingURL=pageHeader.js.map