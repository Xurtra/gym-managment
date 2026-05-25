import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { BillingInterval, PlanStatus } from "@gym-platform/constants";
import {
  buildDashboardShellLayout,
  buildMembershipPlanListPage,
  buildPageHeader,
  type MembershipPlanListPage,
  type MembershipPlanListRow,
  type MembershipPlanView
} from "@gym-platform/dashboard";
import { Button, EmptyState, Table } from "@gym-platform/ui-react";
import { createDashboardClient, currentUserDisplayName, loadDashboardWorkspaceData, loadSession, type DashboardWorkspaceData } from "./dashboardData.js";
import { Shell } from "./Shell.js";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardWorkspaceData; plans: MembershipPlanView[] }
  | { status: "failed"; message: string };

export function PlansDomainRoute() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [searchParams, setSearchParams] = useSearchParams();

  const reload = async () => {
    setState({ status: "loading" });
    try {
      const data = await loadDashboardWorkspaceData();
      const response = (await createDashboardClient().listMembershipPlans(data.gym.id)) as
        | { plans?: unknown[] }
        | unknown[];
      const plans = normalizePlans(response);
      setState({ status: "ready", data, plans });
    } catch (error) {
      setState({ status: "failed", message: describeError(error) });
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  if (!loadSession()) {
    return <Navigate to="/dashboard/login" replace />;
  }
  if (state.status === "loading") {
    return <div className="react-bootstrap-state">Loading plans...</div>;
  }
  if (state.status === "failed") {
    return <div className="empty-state"><h3>Plans unavailable</h3><p>{state.message}</p></div>;
  }

  const shell = buildDashboardShellLayout({
    path: "/settings",
    permissions: state.data.permissions,
    platformAdmin: state.data.platformAdmin,
    email: state.data.me.user.email,
    firstName: state.data.me.user.firstName,
    lastName: state.data.me.user.lastName,
    gymName: state.data.gym.name,
    pageHeader: buildPageHeader({
      title: "Plans and packages",
      eyebrow: "Membership",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Plans and packages", href: "/settings" }
      ],
      description: "Configure recurring memberships and packaged offerings."
    })
  });

  const filters = {
    query: searchParams.get("query") ?? undefined,
    billingInterval: parseBillingInterval(searchParams.get("billingInterval"))
  };

  const page = buildMembershipPlanListPage({
    plans: state.plans,
    permissions: state.data.permissions,
    filters
  });

  return (
    <Shell model={shell}>
      <MembershipPlanListScreen
        model={page}
        onFilterChange={(next) => {
          const params = new URLSearchParams(searchParams);
          for (const [key, value] of Object.entries(next)) {
            if (value) {
              params.set(key, value);
            } else {
              params.delete(key);
            }
          }
          setSearchParams(params);
        }}
      />
    </Shell>
  );
}

function MembershipPlanListScreen({
  model,
  onFilterChange
}: {
  model: MembershipPlanListPage;
  onFilterChange: (next: Record<string, string>) => void;
}) {
  const monthlyPlans = useMemo(
    () => model.rows.filter((row) => row.billingInterval === BillingInterval.Monthly).length,
    [model.rows]
  );
  const yearlyPlans = useMemo(
    () => model.rows.filter((row) => row.billingInterval === BillingInterval.Yearly).length,
    [model.rows]
  );

  return (
    <section className="club-panel club-page">
      <div className="card-head">
        <div>
          <p className="eyebrow">Membership</p>
          <h2>Membership plans</h2>
        </div>
        <span className="club-kicker">{model.summaryLabel}</span>
      </div>

      <div className="stat-grid compact">
        <article className="mini-card"><span>Total</span><strong>{model.summary.totalCount}</strong></article>
        <article className="mini-card"><span>Monthly</span><strong>{monthlyPlans}</strong></article>
        <article className="mini-card"><span>Yearly</span><strong>{yearlyPlans}</strong></article>
        <article className="mini-card"><span>Public</span><strong>{model.summary.publicCount}</strong></article>
      </div>

      <div className="react-filter-bar">
        <label className="field">
          <span>Search</span>
          <input
            value={model.filters.query}
            onChange={(event) => onFilterChange({ query: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Billing interval</span>
          <select
            value={model.filters.billingInterval ?? ""}
            onChange={(event) => onFilterChange({ billingInterval: event.target.value })}
          >
            <option value="">All billing intervals</option>
            {model.billingIntervalOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="card-head">
        <h3>Catalog</h3>
        <Button model={model.createPlanAction} />
      </div>

      {model.empty ? <EmptyState model={model.empty} /> : null}

      {model.rows.length > 0 ? (
        <div className="data-card">
          <Table
            model={model.table}
            getRowKey={(row) => row.id}
            emptyMessage="No plans to display."
            renderCell={(row, columnKey) => renderPlanCell(row, columnKey)}
          />
        </div>
      ) : null}
    </section>
  );
}

function renderPlanCell(row: MembershipPlanListRow, columnKey: string) {
  if (columnKey === "name") {
    return (
      <div>
        <strong>{row.name}</strong>
        {row.description ? <p className="table-subcopy">{row.description}</p> : null}
      </div>
    );
  }
  return String((row as unknown as Record<string, unknown>)[columnKey] ?? "-");
}

function normalizePlans(value: { plans?: unknown[] } | unknown[]) {
  const raw = Array.isArray(value) ? value : Array.isArray(value.plans) ? value.plans : [];
  return raw.map(toMembershipPlanView);
}

function toMembershipPlanView(value: unknown): MembershipPlanView {
  const record = (value ?? {}) as Record<string, unknown>;
  const billingInterval = parseBillingInterval(toText(record.billingInterval)) ?? BillingInterval.Monthly;
  const status = parsePlanStatus(toText(record.status)) ?? PlanStatus.Active;

  return {
    id: toText(record.id) ?? "",
    gymId: toText(record.gymId) ?? "",
    name: toText(record.name) ?? "Unnamed plan",
    ...(toText(record.description) ? { description: toText(record.description) } : {}),
    billingInterval,
    priceCents: toNumber(record.priceCents),
    signupFeeCents: toNumber(record.signupFeeCents),
    trialDays: toNumber(record.trialDays),
    autoRenew: toBoolean(record.autoRenew, true),
    ...(toOptionalNumber(record.contractLengthMonths) !== undefined
      ? { contractLengthMonths: toOptionalNumber(record.contractLengthMonths) }
      : {}),
    ...(toOptionalNumber(record.classAccessLimit) !== undefined
      ? { classAccessLimit: toOptionalNumber(record.classAccessLimit) }
      : {}),
    isPublic: toBoolean(record.isPublic, true),
    status,
    createdAt: toText(record.createdAt) ?? "",
    updatedAt: toText(record.updatedAt) ?? "",
    ...(toText(record.archivedAt) ? { archivedAt: toText(record.archivedAt) } : {})
  };
}

function parseBillingInterval(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }
  return Object.values(BillingInterval).find((interval) => interval === value);
}

function parsePlanStatus(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }
  return Object.values(PlanStatus).find((status) => status === value);
}

function toText(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
