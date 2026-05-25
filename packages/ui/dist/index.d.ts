export type UiIntent = "primary" | "secondary" | "danger";
export type UiSize = "sm" | "md" | "lg";
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";
export interface ButtonModel {
    kind: "button";
    label: string;
    intent: UiIntent;
    size: UiSize;
    disabled: boolean;
    icon?: string;
}
export interface BadgeModel {
    kind: "badge";
    label: string;
    tone: BadgeTone;
}
export interface AvatarModel {
    kind: "avatar";
    label: string;
    initials: string;
    imageUrl?: string;
}
export interface InputModel {
    kind: "input";
    name: string;
    label: string;
    value: string;
    type: "text" | "email" | "password" | "tel";
    required: boolean;
    error?: string;
}
export interface TableModel<T> {
    kind: "table";
    columns: Array<{
        key: keyof T & string;
        label: string;
    }>;
    rows: T[];
    empty?: EmptyStateModel;
}
export interface ModalModel {
    kind: "modal";
    title: string;
    open: boolean;
    body: string;
    actions: ButtonModel[];
}
export interface CardModel {
    kind: "card";
    title: string;
    body?: string;
    actions: ButtonModel[];
}
export interface LayoutModel {
    kind: "layout";
    title: string;
    navItems: Array<{
        label: string;
        href: string;
        active: boolean;
    }>;
}
export interface LoadingStateModel {
    kind: "loading";
    label: string;
}
export interface EmptyStateModel {
    kind: "empty";
    title: string;
    body?: string;
    action?: ButtonModel;
}
export interface CalendarEventModel {
    kind: "calendar_event";
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    subtitle?: string;
    status?: string;
    href?: string;
}
export interface ErrorStateModel {
    kind: "error";
    title: string;
    message: string;
    retry?: ButtonModel;
}
export interface ErrorBoundaryState {
    hasError: boolean;
    error?: ErrorStateModel;
}
export declare function button(input: Partial<ButtonModel> & Pick<ButtonModel, "label">): ButtonModel;
export declare function badge(input: Partial<BadgeModel> & Pick<BadgeModel, "label">): BadgeModel;
export declare function avatar(input: Omit<AvatarModel, "kind">): AvatarModel;
export declare function input(inputModel: Omit<InputModel, "kind">): InputModel;
export declare function table<T>(inputModel: Omit<TableModel<T>, "kind">): TableModel<T>;
export declare function modal(inputModel: Omit<ModalModel, "kind">): ModalModel;
export declare function card(inputModel: Omit<CardModel, "kind">): CardModel;
export declare function layout(inputModel: Omit<LayoutModel, "kind">): LayoutModel;
export declare function loadingState(label?: string): LoadingStateModel;
export declare function emptyState(inputModel: Omit<EmptyStateModel, "kind">): EmptyStateModel;
export declare function calendarEvent(inputModel: Omit<CalendarEventModel, "kind">): CalendarEventModel;
export declare function errorState(inputModel: Omit<ErrorStateModel, "kind">): ErrorStateModel;
export declare function captureErrorBoundary(error: unknown): ErrorBoundaryState;
//# sourceMappingURL=index.d.ts.map