import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";

export type FilterDrawerFieldType = "text" | "select" | "date" | "checkbox";
export type FilterDrawerValue = string | boolean | undefined;

export interface FilterDrawerOption {
  label: string;
  value: string;
}

export interface FilterDrawerFieldInput {
  key: string;
  label: string;
  type: FilterDrawerFieldType;
  value?: FilterDrawerValue;
  defaultValue?: FilterDrawerValue;
  options?: FilterDrawerOption[];
  required?: boolean;
  error?: string;
}

export interface FilterDrawerField extends FilterDrawerFieldInput {
  value: FilterDrawerValue;
  defaultValue: FilterDrawerValue;
  active: boolean;
  input?: InputModel;
}

export interface DashboardFilterDrawer {
  kind: "dashboard_filter_drawer";
  title: string;
  open: boolean;
  fields: FilterDrawerField[];
  activeFilterCount: number;
  applyAction: ButtonModel;
  resetAction: ButtonModel;
  closeAction: ButtonModel;
}

export function buildDashboardFilterDrawer(inputModel: {
  title: string;
  open?: boolean;
  fields: FilterDrawerFieldInput[];
  applyLabel?: string;
  resetLabel?: string;
}): DashboardFilterDrawer {
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

function normalizeField(field: FilterDrawerFieldInput): FilterDrawerField {
  const value = field.value ?? defaultEmptyValue(field.type);
  const defaultValue = field.defaultValue ?? defaultEmptyValue(field.type);
  const normalized: FilterDrawerField = {
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

function defaultEmptyValue(type: FilterDrawerFieldType): FilterDrawerValue {
  return type === "checkbox" ? false : "";
}
