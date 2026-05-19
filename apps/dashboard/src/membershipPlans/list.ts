import { BillingInterval, Permission, PlanStatus } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";

export interface MembershipPlanView {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  billingInterval: BillingInterval;
  priceCents: number;
  signupFeeCents: number;
  trialDays: number;
  autoRenew: boolean;
  contractLengthMonths?: number;
  classAccessLimit?: number;
  isPublic: boolean;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface MembershipPlanListFilters {
  query?: string;
  billingInterval?: BillingInterval;
}

export interface MembershipPlanBillingIntervalOption {
  value: BillingInterval;
  label: string;
  selected: boolean;
}

export interface MembershipPlanListAction {
  key: "view" | "edit" | "archive";
  button: ButtonModel;
  href?: string;
}

export interface MembershipPlanListRow extends MembershipPlanView {
  priceLabel: string;
  signupFeeLabel: string;
  trialLabel: string;
  accessLabel: string;
  visibilityLabel: string;
  detailHref: string;
  actions: MembershipPlanListAction[];
}

export interface MembershipPlanListSummary {
  totalCount: number;
  monthlyCount: number;
  yearlyCount: number;
  oneTimeCount: number;
  packageCount: number;
  publicCount: number;
  privateCount: number;
  visibleCount: number;
}

export interface MembershipPlanListPage {
  screen: "membership_plan_list";
  filters: Required<Pick<MembershipPlanListFilters, "query">> & Omit<MembershipPlanListFilters, "query">;
  searchField: InputModel;
  billingIntervalOptions: MembershipPlanBillingIntervalOption[];
  summary: MembershipPlanListSummary;
  summaryLabel: string;
  rowCount: number;
  activeFilterCount: number;
  billingIntervalOptionCount: number;
  rows: MembershipPlanListRow[];
  table: TableModel<MembershipPlanListRow>;
  empty?: EmptyStateModel;
  createPlanAction: ButtonModel;
}

export function buildMembershipPlanListPage(inputModel: {
  plans: MembershipPlanView[];
  permissions: string[];
  filters?: MembershipPlanListFilters;
}): MembershipPlanListPage {
  const query = normalizeText(inputModel.filters?.query).toLowerCase();
  const filters: MembershipPlanListPage["filters"] = {
    query,
    ...(inputModel.filters?.billingInterval
      ? { billingInterval: inputModel.filters.billingInterval }
      : {})
  };
  const activePlans = inputModel.plans.filter((plan) => plan.status !== PlanStatus.Archived);
  const canWritePlans = inputModel.permissions.includes(Permission.PlanWrite);
  const billingIntervalOptions = Object.values(BillingInterval).map((interval) => ({
    value: interval,
    label: billingIntervalLabel(interval),
    selected: interval === filters.billingInterval
  }));
  const rows = activePlans
    .filter((plan) => matchesFilters(plan, filters))
    .sort(comparePlans)
    .map((plan) => buildPlanRow(plan, canWritePlans));
  const empty =
    rows.length === 0
      ? emptyState({
          title: hasActiveFilters(filters)
            ? "No membership plans match your filters"
            : "No membership plans",
          body: hasActiveFilters(filters)
            ? "Adjust the plan filters and try again."
            : "Create a membership plan to start selling recurring or packaged access."
        })
      : undefined;

  return {
    screen: "membership_plan_list",
    filters,
    searchField: input({
      name: "membershipPlanSearch",
      label: "Search plans",
      value: query,
      type: "text",
      required: false
    }),
    billingIntervalOptions,
    summary: buildSummary(activePlans, rows.length),
    summaryLabel: `Showing ${rows.length} of ${activePlans.length} membership plan${
      activePlans.length === 1 ? "" : "s"
    }`,
    rowCount: rows.length,
    activeFilterCount: countActiveFilters(filters),
    billingIntervalOptionCount: billingIntervalOptions.length,
    rows,
    table: table({
      columns: [
        { key: "name", label: "Plan" },
        { key: "priceLabel", label: "Price" },
        { key: "trialLabel", label: "Trial" },
        { key: "accessLabel", label: "Class access" },
        { key: "visibilityLabel", label: "Visibility" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    createPlanAction: button({
      label: "Create plan",
      icon: "badge-plus",
      disabled: !canWritePlans
    })
  };
}

function buildPlanRow(
  plan: MembershipPlanView,
  canWritePlans: boolean
): MembershipPlanListRow {
  return {
    ...plan,
    priceLabel: buildPriceLabel(plan),
    signupFeeLabel:
      plan.signupFeeCents > 0 ? `${formatCurrency(plan.signupFeeCents)} signup fee` : "No signup fee",
    trialLabel: plan.trialDays > 0 ? `${plan.trialDays}-day trial` : "No trial",
    accessLabel:
      plan.classAccessLimit === undefined
        ? "Unlimited classes"
        : `${plan.classAccessLimit} class${plan.classAccessLimit === 1 ? "" : "es"}`,
    visibilityLabel: plan.isPublic ? "Public" : "Private",
    detailHref: `/membership-plans/${plan.id}`,
    actions: [
      {
        key: "view",
        href: `/membership-plans/${plan.id}`,
        button: button({ label: "View", icon: "eye", intent: "secondary" })
      },
      {
        key: "edit",
        href: `/membership-plans/${plan.id}/edit`,
        button: button({
          label: "Edit",
          icon: "pencil",
          intent: "secondary",
          disabled: !canWritePlans
        })
      },
      {
        key: "archive",
        href: `/membership-plans/${plan.id}/archive`,
        button: button({
          label: "Archive",
          icon: "archive",
          intent: "danger",
          disabled: !canWritePlans
        })
      }
    ]
  };
}

function buildSummary(plans: MembershipPlanView[], visibleCount: number): MembershipPlanListSummary {
  return {
    totalCount: plans.length,
    monthlyCount: countByInterval(plans, BillingInterval.Monthly),
    yearlyCount: countByInterval(plans, BillingInterval.Yearly),
    oneTimeCount: countByInterval(plans, BillingInterval.OneTime),
    packageCount: countByInterval(plans, BillingInterval.Package),
    publicCount: plans.filter((plan) => plan.isPublic).length,
    privateCount: plans.filter((plan) => !plan.isPublic).length,
    visibleCount
  };
}

function matchesFilters(
  plan: MembershipPlanView,
  filters: MembershipPlanListPage["filters"]
) {
  if (filters.billingInterval && plan.billingInterval !== filters.billingInterval) {
    return false;
  }
  if (!filters.query) {
    return true;
  }
  return [plan.name, plan.description, billingIntervalLabel(plan.billingInterval)]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(filters.query));
}

function comparePlans(left: MembershipPlanView, right: MembershipPlanView) {
  return (
    billingIntervalSort(left.billingInterval) - billingIntervalSort(right.billingInterval) ||
    left.name.localeCompare(right.name) ||
    left.id.localeCompare(right.id)
  );
}

function billingIntervalSort(interval: BillingInterval) {
  return {
    [BillingInterval.Monthly]: 0,
    [BillingInterval.Yearly]: 1,
    [BillingInterval.OneTime]: 2,
    [BillingInterval.Package]: 3
  }[interval];
}

export function billingIntervalLabel(interval: BillingInterval) {
  return {
    [BillingInterval.Monthly]: "Monthly",
    [BillingInterval.Yearly]: "Yearly",
    [BillingInterval.OneTime]: "One-time",
    [BillingInterval.Package]: "Package"
  }[interval];
}

export function buildPriceLabel(plan: MembershipPlanView) {
  const basePrice = formatCurrency(plan.priceCents);
  return {
    [BillingInterval.Monthly]: `${basePrice}/month`,
    [BillingInterval.Yearly]: `${basePrice}/year`,
    [BillingInterval.OneTime]: `${basePrice} one-time`,
    [BillingInterval.Package]: `${basePrice}/package`
  }[plan.billingInterval];
}

export function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function countByInterval(plans: MembershipPlanView[], interval: BillingInterval) {
  return plans.filter((plan) => plan.billingInterval === interval).length;
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function hasActiveFilters(filters: MembershipPlanListPage["filters"]) {
  return Boolean(filters.query || filters.billingInterval);
}

function countActiveFilters(filters: MembershipPlanListPage["filters"]) {
  return [filters.query, filters.billingInterval].filter(Boolean).length;
}
