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
  columns: Array<{ key: keyof T & string; label: string }>;
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
  navItems: Array<{ label: string; href: string; active: boolean }>;
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

export function button(input: Partial<ButtonModel> & Pick<ButtonModel, "label">): ButtonModel {
  return {
    kind: "button",
    label: input.label,
    intent: input.intent ?? "primary",
    size: input.size ?? "md",
    disabled: input.disabled ?? false,
    ...(input.icon ? { icon: input.icon } : {})
  };
}

export function badge(input: Partial<BadgeModel> & Pick<BadgeModel, "label">): BadgeModel {
  return {
    kind: "badge",
    label: input.label,
    tone: input.tone ?? "neutral"
  };
}

export function avatar(input: Omit<AvatarModel, "kind">): AvatarModel {
  return { kind: "avatar", ...input };
}

export function input(inputModel: Omit<InputModel, "kind">): InputModel {
  return { kind: "input", ...inputModel };
}

export function table<T>(inputModel: Omit<TableModel<T>, "kind">): TableModel<T> {
  return { kind: "table", ...inputModel };
}

export function modal(inputModel: Omit<ModalModel, "kind">): ModalModel {
  return { kind: "modal", ...inputModel };
}

export function card(inputModel: Omit<CardModel, "kind">): CardModel {
  return { kind: "card", ...inputModel };
}

export function layout(inputModel: Omit<LayoutModel, "kind">): LayoutModel {
  return { kind: "layout", ...inputModel };
}

export function loadingState(label = "Loading"): LoadingStateModel {
  return { kind: "loading", label };
}

export function emptyState(inputModel: Omit<EmptyStateModel, "kind">): EmptyStateModel {
  return { kind: "empty", ...inputModel };
}

export function calendarEvent(inputModel: Omit<CalendarEventModel, "kind">): CalendarEventModel {
  return { kind: "calendar_event", ...inputModel };
}

export function errorState(inputModel: Omit<ErrorStateModel, "kind">): ErrorStateModel {
  return { kind: "error", ...inputModel };
}

export function captureErrorBoundary(error: unknown): ErrorBoundaryState {
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
