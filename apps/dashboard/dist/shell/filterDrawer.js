import { button, input } from "@gym-platform/ui";
export function buildDashboardFilterDrawer(inputModel) {
    const fields = inputModel.fields.map(normalizeField);
    const activeFilterCount = fields.filter((field) => field.active).length;
    return {
        kind: "dashboard_filter_drawer",
        title: inputModel.title.trim(),
        open: inputModel.open ?? false,
        fields,
        activeFilterCount,
        applyAction: button({
            label: inputModel.applyLabel ?? "Apply filters",
            icon: "filter",
            disabled: fields.some((field) => Boolean(field.error))
        }),
        resetAction: button({
            label: inputModel.resetLabel ?? "Reset",
            icon: "rotate-ccw",
            intent: "secondary",
            disabled: activeFilterCount === 0
        }),
        closeAction: button({
            label: "Close filters",
            icon: "x",
            intent: "secondary"
        })
    };
}
function normalizeField(field) {
    const value = field.value ?? defaultEmptyValue(field.type);
    const defaultValue = field.defaultValue ?? defaultEmptyValue(field.type);
    const normalized = {
        ...field,
        value,
        defaultValue,
        active: value !== defaultValue
    };
    if (field.type === "text" || field.type === "date") {
        normalized.input = input({
            name: field.key,
            label: field.label,
            value: String(value ?? ""),
            type: "text",
            required: field.required ?? false,
            ...(field.error ? { error: field.error } : {})
        });
    }
    return normalized;
}
function defaultEmptyValue(type) {
    return type === "checkbox" ? false : "";
}
//# sourceMappingURL=filterDrawer.js.map