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
    fieldCount: number;
    activeFilterCount: number;
    errorCount: number;
    summaryLabel: string;
    applyAction: ButtonModel;
    resetAction: ButtonModel;
    closeAction: ButtonModel;
}
export declare function buildDashboardFilterDrawer(inputModel: {
    title: string;
    open?: boolean;
    fields: FilterDrawerFieldInput[];
    applyLabel?: string;
    resetLabel?: string;
}): DashboardFilterDrawer;
//# sourceMappingURL=filterDrawer.d.ts.map