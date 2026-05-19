import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
export interface DetailDrawerItem {
    key: string;
    label: string;
    value: string;
    empty?: boolean;
}
export interface DetailDrawerSectionInput {
    key: string;
    title: string;
    items: Array<{
        key: string;
        label: string;
        value?: string | number | boolean | Date | null;
    }>;
}
export interface DetailDrawerSection {
    key: string;
    title: string;
    items: DetailDrawerItem[];
}
export interface DetailDrawerAction {
    key: string;
    button: ButtonModel;
    href?: string;
}
export interface DashboardDetailDrawer {
    kind: "dashboard_detail_drawer";
    title: string;
    open: boolean;
    subtitle?: string;
    sections: DetailDrawerSection[];
    sectionCount: number;
    itemCount: number;
    actions: DetailDrawerAction[];
    actionCount: number;
    summaryLabel: string;
    closeAction: ButtonModel;
    empty?: EmptyStateModel;
}
export declare function buildDashboardDetailDrawer(inputModel: {
    title: string;
    open?: boolean;
    subtitle?: string;
    sections: DetailDrawerSectionInput[];
    actions?: Array<{
        key: string;
        label: string;
        href?: string;
        icon?: string;
        disabled?: boolean;
        intent?: ButtonModel["intent"];
    }>;
}): DashboardDetailDrawer;
//# sourceMappingURL=detailDrawer.d.ts.map