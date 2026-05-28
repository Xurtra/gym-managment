import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  MemberStatus,
  Permission,
  type MemberStatus as MemberStatusValue
} from "@gym-platform/constants";
import {
  buildConsumerDashboardPage,
  buildDashboardShellLayout,
  buildLeadConversionScreen,
  buildLeadProfilePage,
  buildPageHeader
} from "@gym-platform/dashboard";
import { Avatar, StatusBadge, Table } from "@gym-platform/ui-react";
import { avatar } from "@gym-platform/ui";
import {
  createMember,
  convertGrowthLead,
  currentUserDisplayName,
  loadDashboardWorkspaceData,
  loadSession,
  type DashboardWorkspaceData,
  type MemberCreateFormInput
} from "./dashboardData.js";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";

type Mode = "list" | "lead-detail" | "lead-convert";

export function ConsumersDomainRoute({ mode }: { mode: Mode }) {
  const [searchParams] = useSearchParams();
  const [createError, setCreateError] = useState<string | undefined>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = loadSession();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.dashboardWorkspace,
    queryFn: () => loadDashboardWorkspaceData(),
    enabled: Boolean(session)
  });
  const createMemberMutation = useMutation({
    mutationFn: ({ gymId, input }: { gymId: string; input: MemberCreateFormInput }) => createMember(gymId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboardWorkspace })
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
    gymSlug: workspaceQuery.data.gym.slug,
    gymLogoUrl: workspaceQuery.data.gym.logoUrl,
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

  async function handleCreateConsumer(input: MemberCreateFormInput) {
    try {
      setCreateError(undefined);
      const created = (await createMemberMutation.mutateAsync({ gymId: workspaceQuery.data.gym.id, input })) as ConsumerRecord;
      navigate(`/dashboard/consumers/profile/${created.id}`);
    } catch (caught) {
      setCreateError(describeError(caught));
      throw caught;
    }
  }

  return (
    <Shell model={shell}>
      {mode === "lead-detail" ? (
        <LeadDetailScreen data={workspaceQuery.data} />
      ) : mode === "lead-convert" ? (
        <LeadConversionScreen data={workspaceQuery.data} />
      ) : (
        <ConsumerListScreen
          data={workspaceQuery.data}
          page={page}
          createError={createError}
          isCreating={createMemberMutation.isPending}
          onCreate={handleCreateConsumer}
        />
      )}
    </Shell>
  );
}

function ConsumerListScreen({
  data,
  page,
  createError,
  isCreating,
  onCreate
}: {
  data: DashboardWorkspaceData;
  page: ReturnType<typeof buildConsumerDashboardPage>;
  createError?: string;
  isCreating: boolean;
  onCreate: (input: MemberCreateFormInput) => Promise<void>;
}) {
  const activeTable = page.activeList.table;
  const segmentConsumers = consumersForActiveTab(data.members, page.activeTabKey);
  const recentConsumers = [...segmentConsumers]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 8);
  const spotlight = recentConsumers[0];
  const summary = page.summary;

  return (
    <section className="club-panel club-page consumer-page">
      <div className="card-head">
        <div>
          <p className="eyebrow">Consumers</p>
          <h2>Consumer Directory</h2>
        </div>
        <span className="club-kicker">
          {summary.totalCount} total · {summary.memberCount} members · {summary.customerCount} customers ·{" "}
          {summary.leadCount} leads
        </span>
      </div>

      <AddConsumerCard
        canCreate={data.permissions.includes(Permission.MemberWrite)}
        error={createError}
        isCreating={isCreating}
        onCreate={onCreate}
      />

      <div className="consumer-segment-tabs">
        {page.tabs.map((tab) => (
          <Link
            key={tab.key}
            className={`tab-btn${tab.active ? " active" : ""}`}
            to={toDashboardRoute(tab.href)}
            aria-current={tab.active ? "page" : undefined}
          >
            {consumerTabLabel(tab.label)}
            <span className="consumer-tab-count">{tab.count}</span>
          </Link>
        ))}
      </div>

      <div className="club-page-split">
        <div className="club-customer-grid consumer-card-grid">
          {recentConsumers.length === 0 ? (
            <div className="empty-state"><p>No consumers yet.</p></div>
          ) : (
            recentConsumers.map((member) => (
              <Link
                key={member.id}
                className="club-customer-card"
                data-action="view-member"
                data-member-id={member.id}
                to={`/dashboard/consumers/profile/${member.id}`}
              >
                <ConsumerPhoto className="club-customer-avatar" member={member} />
                <strong>{consumerName(member)}</strong>
                <span className="consumer-card-segments">{consumerSegmentLabel(member)}</span>
              </Link>
            ))
          )}
        </div>
        <div className="club-panel club-focus-panel consumer-detail-panel">
          {spotlight ? (
            <div className="club-focus-card compact">
              <ConsumerPhoto className="club-focus-photo" member={spotlight} />
              <div className="club-focus-copy">
                <p className="eyebrow">Selected consumer</p>
                <h3>{consumerName(spotlight)}</h3>
                <p>{consumerSegmentLabel(spotlight)}</p>
              </div>
              <div className="club-mini-nav consumer-card-actions">
                <Link className="ghost-button" to={`/dashboard/consumers/profile/${spotlight.id}`}>
                  Open Profile
                </Link>
                <Link className="ghost-button" to={`/dashboard/consumers/edit/${spotlight.id}`}>
                  Edit Consumer
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state"><p>Select a consumer to see details.</p></div>
          )}
          <div className="data-card">
            <Table
              model={activeTable as any}
              getRowKey={(row, index) => String((row as { id?: string }).id ?? index)}
              emptyMessage="No consumer rows to display."
              renderCell={(row, columnKey) => renderConsumerTableCell(row, columnKey)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AddConsumerCard({
  canCreate,
  error,
  isCreating,
  onCreate
}: {
  canCreate: boolean;
  error?: string;
  isCreating: boolean;
  onCreate: (input: MemberCreateFormInput) => Promise<void>;
}) {
  const disabled = !canCreate || isCreating;

  return (
    <form
      className="form-card compact-form consumer-create-card"
      id="create-member-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        try {
          await onCreate({
            firstName: requiredText(formData, "firstName"),
            lastName: requiredText(formData, "lastName"),
            email: optionalText(formData, "email"),
            phone: optionalText(formData, "phone"),
            status: requiredText(formData, "status") as MemberStatusValue
          });
          form.reset();
        } catch {
          // The route-level handler renders the error banner.
        }
      }}
    >
      <div className="card-head">
        <div>
          <h3>Add consumer</h3>
          <span>Consumer tab</span>
        </div>
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      <div className="form-grid">
        <label className="field">
          <span>Type</span>
          <select name="status" defaultValue={MemberStatus.Active} disabled={disabled}>
            <option value={MemberStatus.Lead}>Lead</option>
            <option value={MemberStatus.Trial}>Customer</option>
            <option value={MemberStatus.Active}>Member</option>
          </select>
        </label>
        <label className="field">
          <span>First name</span>
          <input name="firstName" autoComplete="given-name" required disabled={disabled} />
        </label>
        <label className="field">
          <span>Last name</span>
          <input name="lastName" autoComplete="family-name" required disabled={disabled} />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" disabled={disabled} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" disabled={disabled} />
        </label>
      </div>
      <button className="save-button" type="submit" disabled={disabled}>
        {isCreating ? "Adding..." : "Add consumer"}
      </button>
      {!canCreate ? <p className="club-copy">You need member write permission to add consumers.</p> : null}
    </form>
  );
}

function renderConsumerTableCell(row: unknown, columnKey: string) {
  const typed = row as Record<string, unknown> & {
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

type ConsumerRecord = DashboardWorkspaceData["members"][number];

function consumersForActiveTab(consumers: ConsumerRecord[], activeTabKey: string) {
  if (activeTabKey === "members") {
    return consumers.filter((consumer) => consumerIsMember(consumer));
  }
  if (activeTabKey === "customers") {
    return consumers.filter((consumer) => consumerIsCustomer(consumer));
  }
  if (activeTabKey === "leads") {
    return consumers.filter((consumer) => consumerIsLead(consumer));
  }
  return consumers;
}

function ConsumerPhoto({ className, member }: { className: string; member: ConsumerRecord }) {
  return (
    <div className={className}>
      {member.profileImageUrl ? (
        <img src={member.profileImageUrl} alt={consumerName(member)} />
      ) : (
        consumerInitials(member)
      )}
    </div>
  );
}

function consumerName(member: ConsumerRecord) {
  return `${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id;
}

function consumerInitials(member: ConsumerRecord) {
  const letters = [member.firstName, member.lastName].map((value) => value.trim().charAt(0)).filter(Boolean);
  return letters.length > 0
    ? letters.join("").toUpperCase()
    : (member.email?.charAt(0) ?? member.phone?.charAt(0) ?? "?").toUpperCase();
}

function consumerSegmentLabel(member: ConsumerRecord) {
  const labels: string[] = [];
  if (consumerIsMember(member)) {
    labels.push("Member");
  }
  if (consumerIsCustomer(member)) {
    labels.push("Customer");
  }
  if (consumerIsLead(member)) {
    labels.push("Lead");
  }
  return labels.length > 0 ? labels.join(" · ") : member.status;
}

function consumerIsMember(member: ConsumerRecord) {
  return Boolean(member.isMember) || member.segments?.includes("member");
}

function consumerIsCustomer(member: ConsumerRecord) {
  return Boolean(member.isCustomer) || member.segments?.includes("customer");
}

function consumerIsLead(member: ConsumerRecord) {
  return Boolean(member.isLead) || member.segments?.includes("lead") || member.status === "lead";
}

function consumerTabLabel(label: string) {
  return label === "All consumers" ? "All" : label;
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

function requiredText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = requiredText(formData, key);
  return value.length > 0 ? value : undefined;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
