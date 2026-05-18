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
export declare function buildDashboardDateRangePicker(inputModel: {
    label: string;
    from?: string;
    to?: string;
    min?: string;
    max?: string;
    presets?: DateRangePresetInput[];
    applyLabel?: string;
}): DashboardDateRangePicker;
//# sourceMappingURL=dateRangePicker.d.ts.map