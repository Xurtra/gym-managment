import type { ButtonModel } from "@gym-platform/ui";
export interface PageHeaderBreadcrumb {
    label: string;
    href: string;
    current: boolean;
}
export interface PageHeaderTab {
    key: string;
    label: string;
    href: string;
    active: boolean;
    disabled: boolean;
}
export interface PageHeaderAction {
    key: string;
    button: ButtonModel;
    href?: string;
}
export interface PageHeaderModel {
    kind: "page_header";
    title: string;
    eyebrow?: string;
    description?: string;
    breadcrumbs: PageHeaderBreadcrumb[];
    breadcrumbCount: number;
    primaryAction?: PageHeaderAction;
    secondaryActions: PageHeaderAction[];
    actionCount: number;
    tabs: PageHeaderTab[];
    tabCount: number;
    activeTabKey?: string;
    summaryLabel: string;
}
export declare function buildPageHeader(inputModel: {
    title: string;
    eyebrow?: string;
    description?: string;
    breadcrumbs?: Array<{
        label: string;
        href: string;
    }>;
    primaryAction?: {
        key: string;
        label: string;
        href?: string;
        icon?: string;
        disabled?: boolean;
    };
    secondaryActions?: Array<{
        key: string;
        label: string;
        href?: string;
        icon?: string;
        disabled?: boolean;
    }>;
    tabs?: Array<{
        key: string;
        label: string;
        href: string;
        disabled?: boolean;
    }>;
    activeTabKey?: string;
}): PageHeaderModel;
//# sourceMappingURL=pageHeader.d.ts.map