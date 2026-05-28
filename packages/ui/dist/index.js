export function button(input) {
    return {
        kind: "button",
        label: input.label,
        intent: input.intent ?? "primary",
        size: input.size ?? "md",
        disabled: input.disabled ?? false,
        ...(input.icon ? { icon: input.icon } : {})
    };
}
export function input(inputModel) {
    return { kind: "input", ...inputModel };
}
export function table(inputModel) {
    return { kind: "table", ...inputModel };
}
export function modal(inputModel) {
    return { kind: "modal", ...inputModel };
}
export function card(inputModel) {
    return { kind: "card", ...inputModel };
}
export function layout(inputModel) {
    return { kind: "layout", ...inputModel };
}
export function loadingState(label = "Loading") {
    return { kind: "loading", label };
}
export function emptyState(inputModel) {
    return { kind: "empty", ...inputModel };
}
export function errorState(inputModel) {
    return { kind: "error", ...inputModel };
}
export function captureErrorBoundary(error) {
    if (!error) {
        return { hasError: false };
    }
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return {
        hasError: true,
        error: errorState({
            title: "Unexpected error",
            message,
            retry: button({ label: "Try again", intent: "secondary" })
        })
    };
}
//# sourceMappingURL=index.js.map