import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  buildConsumerDashboardPage,
  buildDashboardShellLayout,
  buildLeadConversionScreen,
  buildLeadProfilePage,
  buildPageHeader
} from "@gym-platform/dashboard";
import { Avatar, StatusBadge, Table, Tabs } from "@gym-platform/ui-react";
import { avatar } from "@gym-platform/ui";
import {
  convertGrowthLead,
  currentUserDisplayName,
  loadDashboardWorkspaceData,
  loadSession,
  type DashboardWorkspaceData
} from "./dashboardData.js";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";

type Mode = "list" | "lead-detail" | "lead-convert";

export function ConsumersDomainRoute({ mode }: { mode: Mode }) {
  const [searchParams] = useSearchParams();
  const session = loadSession();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.dashboardWorkspace,
    queryFn: () => loadDashboardWorkspaceData(),
    enabled: Boolean(session)
  });

  if (!session) {
    return <Navigate to="/dashboard/login" replace />;
  }

  if (workspaceQuery.isLoading) {
    return <div className="react-bootstrap-state">Loading consumers...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <div className="empty-state" role="alert">
        <h3>Unable to load consumers</h3>
        <p>{describeError(workspaceQuery.error)}</p>
      </div>
    );
  }

  const tabQuery = (searchParams.get("segment") ?? "all").toLowerCase();
  const activeTabKey = tabQuery === "members" || tabQuery === "customers" || tabQuery === "leads" ? tabQuery : "all";
  const page = buildConsumerDashboardPage({
    consumers: workspaceQuery.data.members,
    permissions: workspaceQuery.data.permissions,
    activeTabKey: activeTabKey as "all" | "members" | "customers" | "leads"
  });

  const shell = buildDashboardShellLayout({
    path: "/consumers",
    permissions: workspaceQuery.data.permissions,
    platformAdmin: workspaceQuery.data.platformAdmin,
    email: workspaceQuery.data.me.user.email,
    firstName: workspaceQuery.data.me.user.firstName,
    lastName: workspaceQuery.data.me.user.lastName,
    gymName: workspaceQuery.data.gym.name,
    pageHeader: buildPageHeader({
      title:
        mode === "lead-detail"
          ? "Lead Profile"
          : mode === "lead-convert"
            ? "Lead Conversion"
            : "Consumer Directory",
      eyebrow: "People",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Consumers", href: "/consumers" }
      ],
      description: `${currentUserDisplayName(workspaceQuery.data.me)} is working in ${workspaceQuery.data.gym.name}.`
    })
  });

  return (
    <Shell model={shell}>
      {mode === "lead-detail" ? (
        <LeadDetailScreen data={workspaceQuery.data} />
      ) : mode === "lead-convert" ? (
        <LeadConversionScreen data={workspaceQuery.data} />
      ) : (
        <ConsumerListScreen page={page} />
      )}
    </Shell>
  );
}

function ConsumerListScreen({ page }: { page: ReturnType<typeof buildConsumerDashboardPage> }) {
  const activeTable = page.activeList.table;

  return (
    <section className="club-panel consumer-page">
      <div className="card-head">
        <div>
          <p className="eyebrow">Consumers</p>
          <h2>Consumer Directory</h2>
        </div>
        <span className="club-kicker">{page.summaryLabel}</span>
      </div>

      <Tabs
        model={{
          ariaLabel: "Consumer segments",
          items: page.tabs.map((tab) => ({
            key: tab.key,
            label: tab.label,
            href: tab.href.startsWith("/dashboard") ? tab.href : `/dashboard${tab.href}`,
            active: tab.active,
            suffix: tab.count
          }))
        }}
      />

      <div className="stat-grid compact">
        <article className="mini-card"><span>Total</span><strong>{page.summary.totalCount}</strong></article>
        <article className="mini-card"><span>Members</span><strong>{page.summary.memberCount}</strong></article>
        <article className="mini-card"><span>Customers</span><strong>{page.summary.customerCount}</strong></article>
        <article className="mini-card"><span>Leads</span><strong>{page.summary.leadCount}</strong></article>
      </div>

      <div className="data-card">
        <Table
          model={activeTable as any}
          getRowKey={(row, index) => String((row as { id?: string }).id ?? index)}
          renderCell={(row, columnKey) => {
            const typed = row as unknown as Record<string, unknown> & {
              fullName?: string;
              initials?: string;
              detailHref?: string;
              statusBadge?: { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" };
            };
            if (columnKey === "fullName" && typed.fullName && typed.initials) {
              return (
                <Link className="react-member-cell" to={toDashboardRoute(typed.detailHref ?? "/consumers")}> 
                  <Avatar model={avatar({ label: typed.fullName, initials: typed.initials })} />
                  <span>{typed.fullName}</span>
                </Link>
              );
            }
            if (columnKey === "statusLabel" && typed.statusBadge) {
              return <StatusBadge model={{ label: typed.statusBadge.label, tone: typed.statusBadge.tone }} />;
            }
            return String(typed[columnKey] ?? "-");
          }}
        />
      </div>
    </section>
  );
}

function LeadDetailScreen({ data }: { data: DashboardWorkspaceData }) {
  const { consumerId } = useParams();
  const lead = data.members.find((member) => member.id === consumerId) ?? data.members[0];

  if (!lead) {
    return (
      <div className="empty-state">
        <h3>Lead not found</h3>
      </div>
    );
  }

  const page = buildLeadProfilePage({ lead, permissions: data.permissions });

  return (
    <section className="club-panel profile-sheet">
      <div className="profile-header">
        <div className="profile-header-main">
          <Avatar className="profile-avatar" model={avatar({ label: page.fullName, initials: page.initials })} />
          <div className="profile-header-copy">
            <p className="eyebrow">Lead</p>
            <h2>{page.fullName}</h2>
            <StatusBadge model={{ label: page.statusLabel, tone: page.statusBadge.tone }} />
          </div>
        </div>
        <div className="club-mini-nav">
          {page.actions.map((action) =>
            action.href ? (
              <Link key={action.key} to={toDashboardRoute(action.href)} className="ghost-button">
                {action.button.label}
              </Link>
            ) : null
          )}
        </div>
      </div>
      <div className="profile-grid">
        {page.sections.map((section) => (
          <section className="checkin-sheet-section" key={section.key}>
            <div className="card-head"><h3>{section.title}</h3></div>
            <dl className="react-detail-list">
              {section.details.map((detail) => (
                <div key={detail.key}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
}

function LeadConversionScreen({
  data
}: {
  data: DashboardWorkspaceData;
}) {
  const { consumerId } = useParams();
  const navigate = useNavigate();
  const lead = data.members.find((member) => member.id === consumerId) ?? data.members[0];
  const [selectedStatus, setSelectedStatus] = useState<"trial" | "active" | undefined>("trial");
  const [error, setError] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const convertLeadMutation = useMutation({
    mutationFn: () => convertGrowthLead(data.gym.id, lead?.id ?? "", {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardWorkspace });
      void queryClient.invalidateQueries({ queryKey: queryKeys.growthWorkspace });
    }
  });

  if (!lead) {
    return (
      <div className="empty-state">
        <h3>Lead not found</h3>
      </div>
    );
  }

  const screen = buildLeadConversionScreen({ lead, permissions: data.permissions, selectedTargetStatus: selectedStatus });

  return (
    <section className="form-card compact-form">
      <div className="card-head">
        <h3>{screen.fullName}</h3>
        <span>{screen.currentStatusLabel}</span>
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      <label className="field">
        <span>Target status</span>
        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.currentTarget.value as "trial" | "active")}
          disabled={convertLeadMutation.isPending}
        >
          {screen.targetStatusOptions.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
          ))}
        </select>
      </label>
      <button
        className="save-button"
        type="button"
        disabled={!screen.canSubmit || convertLeadMutation.isPending}
        onClick={async () => {
          try {
            setError(undefined);
            await convertLeadMutation.mutateAsync();
            navigate(`/dashboard/leads/${lead.id}`, { replace: true });
          } catch (caught) {
            setError(describeError(caught));
          }
        }}
      >
        {screen.action.label}
      </button>
      {screen.blockedReason ? <p className="club-copy">{screen.blockedReason}</p> : null}
    </section>
  );
}

function toDashboardRoute(href: string) {
  if (href.startsWith("/dashboard")) {
    return href;
  }
  if (href === "/leads") {
    return "/dashboard/consumers?segment=leads";
  }
  if (href.startsWith("/leads/")) {
    const memberId = href.split("/")[2];
    return `/dashboard/leads/${memberId}`;
  }
  if (href.startsWith("/members/")) {
    const parts = href.split("/").filter(Boolean);
    if (parts[2] === "edit") {
      return `/dashboard/consumers/edit/${parts[1]}`;
    }
  }
  return `/dashboard${href}`;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
