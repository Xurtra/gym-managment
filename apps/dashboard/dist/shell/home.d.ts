import type { Permission as PermissionValue } from "@gym-platform/constants";
import type { ButtonModel, CardModel } from "@gym-platform/ui";
export interface DashboardSummaryMetric {
    key: "activeMembers" | "checkInsToday" | "classesToday" | "pendingTasks";
    label: string;
    value: number;
    delta?: number;
    href: string;
    requiredPermissions: PermissionValue[];
}
export interface DashboardSummaryCard {
    key: DashboardSummaryMetric["key"];
    title: string;
    value: string;
    trend: "up" | "down" | "flat";
    href: string;
    card: CardModel;
}
export interface DashboardHomePage {
    screen: "dashboard_home";
    cards: DashboardSummaryCard[];
    primaryActions: ButtonModel[];
}
export declare function buildDashboardHomePage(inputModel: {
    metrics: Partial<Record<DashboardSummaryMetric["key"], number>>;
    deltas?: Partial<Record<DashboardSummaryMetric["key"], number>>;
    permissions?: PermissionValue[];
}): DashboardHomePage;
//# sourceMappingURL=home.d.ts.map