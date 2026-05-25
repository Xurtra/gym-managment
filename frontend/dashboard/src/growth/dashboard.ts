import { Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import type { GrowthSummary } from "./types.js";

export interface GrowthStatCard {
  label: string;
  value: number;
  href?: string;
  urgent?: boolean;
}

export interface GrowthDashboardPage {
  screen: "growth_dashboard";
  summary: GrowthSummary;
  statCards: GrowthStatCard[];
  viewInboxAction: ButtonModel;
  viewWatchlistAction: ButtonModel;
  createLeadAction: ButtonModel;
  importLeadsAction: ButtonModel;
}

export function buildGrowthDashboardPage(inputModel: {
  summary: GrowthSummary;
  permissions: string[];
}): GrowthDashboardPage {
  const canWrite = inputModel.permissions.includes(Permission.GrowthWrite);
  const { summary } = inputModel;

  const statCards: GrowthStatCard[] = [
    {
      label: "Open Leads",
      value: summary.openLeads,
      href: "/growth/leads"
    },
    {
      label: "Due Today",
      value: summary.dueToday,
      href: "/growth/inbox",
      urgent: summary.dueToday > 0
    },
    {
      label: "Overdue",
      value: summary.overdueCount,
      href: "/growth/inbox",
      urgent: summary.overdueCount > 0
    },
    {
      label: "Watchlist",
      value: summary.watchlistCount,
      href: "/growth/watchlist",
      urgent: summary.watchlistCount > 0
    },
    {
      label: "Converted This Month",
      value: summary.convertedThisMonth
    }
  ];

  return {
    screen: "growth_dashboard",
    summary,
    statCards,
    viewInboxAction: button({ label: "View Inbox", intent: "primary" }),
    viewWatchlistAction: button({ label: "View Watchlist", intent: "secondary" }),
    createLeadAction: button({ label: "Create Lead", icon: "user-plus", disabled: !canWrite }),
    importLeadsAction: button({ label: "Import Leads", icon: "upload", disabled: !canWrite })
  };
}
