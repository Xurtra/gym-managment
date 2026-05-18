import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";

export interface DateRangePresetInput {
  key: string;
  label: string;
  from: string;
  to: string;
}

export interface DateRangePreset extends DateRangePresetInput {
  active: boolean;
}

export interface DashboardDateRangePicker {
  kind: "dashboard_date_range_picker";
  label: string;
  from?: string;
  to?: string;
  min?: string;
  max?: string;
  valid: boolean;
  errors: string[];
  fromField: InputModel;
  toField: InputModel;
  presets: DateRangePreset[];
  applyAction: ButtonModel;
  clearAction: ButtonModel;
}

export function buildDashboardDateRangePicker(inputModel: {
  label: string;
  from?: string;
  to?: string;
  min?: string;
  max?: string;
  presets?: DateRangePresetInput[];
  applyLabel?: string;
}): DashboardDateRangePicker {
  const from = normalizeDateValue(inputModel.from);
  const to = normalizeDateValue(inputModel.to);
  const min = normalizeDateValue(inputModel.min);
  const max = normalizeDateValue(inputModel.max);
  const errors = validateRange({ from, to, min, max });

  return {
    kind: "dashboard_date_range_picker",
    label: inputModel.label.trim(),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(min ? { min } : {}),
    ...(max ? { max } : {}),
    valid: errors.length === 0,
    errors,
    fromField: input({
      name: "from",
      label: "From",
      value: from ?? "",
      type: "text",
      required: false,
      ...(errors.some((error) => error.toLowerCase().includes("from"))
        ? { error: "Invalid from date" }
        : {})
    }),
    toField: input({
      name: "to",
      label: "To",
      value: to ?? "",
      type: "text",
      required: false,
      ...(errors.some((error) => error.toLowerCase().includes("to"))
        ? { error: "Invalid to date" }
        : {})
    }),
    presets: (inputModel.presets ?? []).map((preset) => ({
      ...preset,
      active: preset.from === from && preset.to === to
    })),
    applyAction: button({
      label: inputModel.applyLabel ?? "Apply date range",
      icon: "calendar-range",
      disabled: errors.length > 0
    }),
    clearAction: button({
      label: "Clear date range",
      icon: "x",
      intent: "secondary",
      disabled: !from && !to
    })
  };
}

function normalizeDateValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function validateRange(inputModel: {
  from: string | undefined;
  to: string | undefined;
  min: string | undefined;
  max: string | undefined;
}) {
  const errors: string[] = [];
  const fromTime = parseDate(inputModel.from);
  const toTime = parseDate(inputModel.to);
  const minTime = parseDate(inputModel.min);
  const maxTime = parseDate(inputModel.max);

  if (inputModel.from && fromTime === undefined) {
    errors.push("From date is invalid.");
  }
  if (inputModel.to && toTime === undefined) {
    errors.push("To date is invalid.");
  }
  if (fromTime !== undefined && toTime !== undefined && fromTime > toTime) {
    errors.push("From date must be before to date.");
  }
  if (fromTime !== undefined && minTime !== undefined && fromTime < minTime) {
    errors.push("From date is before the minimum date.");
  }
  if (toTime !== undefined && maxTime !== undefined && toTime > maxTime) {
    errors.push("To date is after the maximum date.");
  }

  return errors;
}

function parseDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
}
