import { Permission } from "@gym-platform/constants";
import type { Permission as PermissionValue } from "@gym-platform/constants";
import { button, card, emptyState } from "@gym-platform/ui";
import type { ButtonModel, CardModel, EmptyStateModel } from "@gym-platform/ui";

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
  cardCount: number;
  visibleMetricKeys: DashboardSummaryMetric["key"][];
  summaryLabel: string;
  enabledPrimaryActionCount: number;
  disabledPrimaryActionCount: number;
  empty?: EmptyStateModel;
  primaryActions: ButtonModel[];
}

export function buildDashboardHomePage(inputModel: {
  metrics: Partial<Record<DashboardSummaryMetric["key"], number>>;
  deltas?: Partial<Record<DashboardSummaryMetric["key"], number>>;
  permissions?: PermissionValue[];
}): DashboardHomePage {
  const permissions = inputModel.permissions ?? [];
  const cards = summaryMetrics
    .filter((metric) =>
      metric.requiredPermissions.every((permission) => permissions.includes(permission))
    )
    .map((metric) => {
      const value = inputModel.metrics[metric.key] ?? 0;
      const delta = inputModel.deltas?.[metric.key] ?? 0;
      return buildSummaryCard({
        ...metric,
        value,
        delta
      });
    });
  const primaryActions = [
    button({
      label: "Add consumer",
      disabled: !permissions.includes(Permission.MemberWrite)
    }),
    button({
      label: "Create class",
      intent: "secondary",
      disabled: !permissions.includes(Permission.ClassWrite)
    })
  ];
  const enabledPrimaryActionCount = primaryActions.filter((action) => !action.disabled).length;
  const disabledPrimaryActionCount = primaryActions.length - enabledPrimaryActionCount;
  const empty =
    cards.length === 0
      ? emptyState({
          title: "No dashboard metrics available",
          body: "Grant dashboard permissions to show operational summary cards."
        })
      : undefined;

  return {
    screen: "dashboard_home",
    cards,
    cardCount: cards.length,
    visibleMetricKeys: cards.map((card) => card.key),
    summaryLabel:
      cards.length === 0
        ? "No visible dashboard metrics"
        : `${cards.length} dashboard metric${cards.length === 1 ? "" : "s"} visible`,
    enabledPrimaryActionCount,
    disabledPrimaryActionCount,
    ...(empty ? { empty } : {}),
    primaryActions
  };
}

function buildSummaryCard(metric: DashboardSummaryMetric): DashboardSummaryCard {
  const trend =
    metric.delta === undefined || metric.delta === 0 ? "flat" : metric.delta > 0 ? "up" : "down";
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

function formatMetricBody(value: number, delta?: number) {
  if (delta === undefined || delta === 0) {
    return `${value}`;
  }
  const sign = delta > 0 ? "+" : "";
  return `${value} (${sign}${delta})`;
}

const summaryMetrics: DashboardSummaryMetric[] = [
  {
    key: "activeMembers",
    label: "Active members",
    value: 0,
    href: "/consumers?segment=members",
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
