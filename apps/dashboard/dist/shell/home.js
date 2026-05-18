import { Permission } from "@gym-platform/constants";
import { button, card } from "@gym-platform/ui";
export function buildDashboardHomePage(inputModel) {
    const permissions = inputModel.permissions ?? [];
    const cards = summaryMetrics
        .filter((metric) => metric.requiredPermissions.every((permission) => permissions.includes(permission)))
        .map((metric) => {
        const value = inputModel.metrics[metric.key] ?? 0;
        const delta = inputModel.deltas?.[metric.key] ?? 0;
        return buildSummaryCard({
            ...metric,
            value,
            delta
        });
    });
    return {
        screen: "dashboard_home",
        cards,
        primaryActions: [
            button({
                label: "Add member",
                disabled: !permissions.includes(Permission.MemberWrite)
            }),
            button({
                label: "Create class",
                intent: "secondary",
                disabled: !permissions.includes(Permission.ClassWrite)
            })
        ]
    };
}
function buildSummaryCard(metric) {
    const trend = metric.delta === undefined || metric.delta === 0 ? "flat" : metric.delta > 0 ? "up" : "down";
    return {
        key: metric.key,
        title: metric.label,
        value: String(metric.value),
        trend,
        href: metric.href,
        card: card({
            title: metric.label,
            body: formatMetricBody(metric.value, metric.delta),
            actions: [button({ label: "Open", intent: "secondary" })]
        })
    };
}
function formatMetricBody(value, delta) {
    if (delta === undefined || delta === 0) {
        return `${value}`;
    }
    const sign = delta > 0 ? "+" : "";
    return `${value} (${sign}${delta})`;
}
const summaryMetrics = [
    {
        key: "activeMembers",
        label: "Active members",
        value: 0,
        href: "/members",
        requiredPermissions: [Permission.MemberRead]
    },
    {
        key: "checkInsToday",
        label: "Check-ins today",
        value: 0,
        href: "/check-ins",
        requiredPermissions: [Permission.MemberRead]
    },
    {
        key: "classesToday",
        label: "Classes today",
        value: 0,
        href: "/classes",
        requiredPermissions: [Permission.ClassRead]
    },
    {
        key: "pendingTasks",
        label: "Pending tasks",
        value: 0,
        href: "/settings",
        requiredPermissions: [Permission.GymUpdate]
    }
];
//# sourceMappingURL=home.js.map