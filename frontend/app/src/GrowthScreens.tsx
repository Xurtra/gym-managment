import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  buildDashboardShellLayout,
  buildFollowUpInboxPage,
  buildGrowthDashboardPage,
  buildGrowthLeadProfilePage,
  buildPageHeader,
  buildRetentionWatchlistPage,
  type InteractionView
} from "@gym-platform/dashboard";
import { badge } from "@gym-platform/ui";
import { Badge, Button, Table } from "@gym-platform/ui-react";
import {
  convertGrowthLead,
  createDashboardClient,
  currentUserDisplayName,
  loadGrowthInteractions,
  loadGrowthWorkspaceData,
  loadSession,
  logGrowthInteraction,
  type GrowthWorkspaceData,
  type InteractionRecord
} from "./dashboardData.js";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";
type InteractionType = "call" | "sms" | "email" | "note";

export function GrowthDomainRoute({
  mode
}: {
  mode: "dashboard" | "inbox" | "watchlist" | "lead";
}) {
  const navigate = useNavigate();
  const session = loadSession();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.growthWorkspace,
    queryFn: () => loadGrowthWorkspaceData(),
    enabled: Boolean(session)
  });

  if (!session) {
    return <Navigate to="/dashboard/home" replace />;
  }
  if (workspaceQuery.isLoading) {
    return <div className="react-bootstrap-state">Loading growth data...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <div className="empty-state" role="alert">
        <h3>Unable to load growth data</h3>
        <p>{describeError(workspaceQuery.error)}</p>
      </div>
    );
  }

  const shell = buildDashboardShellLayout({
    path: "/growth",
    permissions: workspaceQuery.data.permissions,
    platformAdmin: workspaceQuery.data.platformAdmin,
    email: workspaceQuery.data.me.user.email,
    firstName: workspaceQuery.data.me.user.firstName,
    lastName: workspaceQuery.data.me.user.lastName,
    gymName: workspaceQuery.data.gym.name,
    gymSlug: workspaceQuery.data.gym.slug,
    gymLogoUrl: workspaceQuery.data.gym.logoUrl,
    pageHeader: buildPageHeader({
      title: pageTitleFor(mode),
      eyebrow: "Growth",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Growth", href: "/growth" },
        { label: pageTitleFor(mode), href: "/growth" }
      ],
      description: `${currentUserDisplayName(workspaceQuery.data.me)} · ${workspaceQuery.data.gym.name}`
    })
  });

  return (
    <Shell
      model={shell}
      onLogout={() => {
        const client = createDashboardClient();
        const refreshToken = loadSession()?.refreshToken;
        localStorage.removeItem("gym-platform-session");
        if (refreshToken) {
          void client.logout(refreshToken).catch(() => undefined);
        }
        navigate("/dashboard/home");
      }}
    >
      {mode === "inbox" ? (
        <GrowthInboxRoute data={workspaceQuery.data} />
      ) : mode === "watchlist" ? (
        <GrowthWatchlistRoute data={workspaceQuery.data} />
      ) : mode === "lead" ? (
        <GrowthLeadRoute data={workspaceQuery.data} />
      ) : (
        <GrowthDashboardRoute data={workspaceQuery.data} />
      )}
    </Shell>
  );
}

function pageTitleFor(mode: "dashboard" | "inbox" | "watchlist" | "lead") {
  switch (mode) {
    case "inbox":
      return "Follow-up Inbox";
    case "watchlist":
      return "Retention Watchlist";
    case "lead":
      return "Lead Profile";
    default:
      return "Growth Dashboard";
  }
}

function GrowthDashboardRoute({ data }: { data: GrowthWorkspaceData }) {
  const page = useMemo(
    () => buildGrowthDashboardPage({ summary: data.summary, permissions: data.permissions }),
    [data.summary, data.permissions]
  );
  return <GrowthDashboardScreen model={page} />;
}

function GrowthInboxRoute({ data }: { data: GrowthWorkspaceData }) {
  const page = useMemo(
    () =>
      buildFollowUpInboxPage({
        consumers: data.inboxConsumers,
        permissions: data.permissions
      }),
    [data.inboxConsumers, data.permissions]
  );
  return <GrowthInboxScreen model={page} />;
}

function GrowthWatchlistRoute({ data }: { data: GrowthWorkspaceData }) {
  const page = useMemo(
    () =>
      buildRetentionWatchlistPage({
        consumers: data.watchlistConsumers,
        permissions: data.permissions
      }),
    [data.watchlistConsumers, data.permissions]
  );
  return <GrowthWatchlistScreen model={page} />;
}

function GrowthLeadRoute({
  data
}: {
  data: GrowthWorkspaceData;
}) {
  const { consumerId } = useParams();
  const [error, setError] = useState<string | undefined>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const consumer = data.members.find((member) => member.id === consumerId);
  const interactionsQuery = useQuery({
    queryKey: consumer
      ? queryKeys.growthInteractions(data.gym.id, consumer.id)
      : ["growth-interactions", data.gym.id, "none"],
    queryFn: () => loadGrowthInteractions(data.gym.id, consumer?.id ?? ""),
    enabled: Boolean(consumer),
    retry: false
  });
  const logInteractionMutation = useMutation({
    mutationFn: ({ type, notes }: { type: InteractionType; notes: string }) =>
      logGrowthInteraction(data.gym.id, consumer?.id ?? "", { type, notes: notes || undefined }),
    onSuccess: () => {
      if (consumer) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.growthInteractions(data.gym.id, consumer.id) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.growthWorkspace });
    }
  });
  const convertLeadMutation = useMutation({
    mutationFn: () => convertGrowthLead(data.gym.id, consumer?.id ?? "", {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.growthWorkspace });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardWorkspace });
    }
  });

  if (!consumer) {
    return (
      <div className="empty-state">
        <h3>Lead not found</h3>
        <Link to="/dashboard/growth">Back to Growth</Link>
      </div>
    );
  }

  const interactions = interactionsQuery.data ?? [];
  const interactionViews: InteractionView[] = interactions.map((interaction) => ({
    id: interaction.id,
    type: interaction.type as InteractionView["type"],
    occurredAt: interaction.occurredAt,
    createdAt: interaction.createdAt,
    ...(interaction.notes ? { notes: interaction.notes } : {}),
    ...(interaction.staffName ? { staffName: interaction.staffName } : {})
  }));

  const page = buildGrowthLeadProfilePage({
    consumer,
    interactions: interactionViews,
    permissions: data.permissions
  });

  async function handleLogInteraction(type: InteractionType, notes: string) {
    try {
      setError(undefined);
      await logInteractionMutation.mutateAsync({ type, notes });
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  async function handleConvert() {
    try {
      setError(undefined);
      await convertLeadMutation.mutateAsync();
      navigate("/dashboard/growth");
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  return (
    <GrowthLeadScreen
      model={page}
      interactionsLoading={interactionsQuery.isLoading}
      error={error}
      onLogInteraction={handleLogInteraction}
      onConvert={handleConvert}
    />
  );
}

function GrowthDashboardScreen({ model }: { model: ReturnType<typeof buildGrowthDashboardPage> }) {
  const quickActions = model.statCards.filter((card) => card.href);

  return (
    <section className="club-panel club-page">
      <div className="stat-grid">
        {model.statCards.map((card, index) => (
          <article key={`${card.label}-${index}`} className="mini-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>
      <div className="club-note" style={{ marginTop: "1.5rem" }}>
        <span className="club-note-label">Quick actions</span>
        <div className="button-row">
          {quickActions.map((action) => (
            <Link key={action.label} className="ghost-button" to={toDashboardRoute(action.href ?? "/growth")}>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function GrowthInboxScreen({ model }: { model: ReturnType<typeof buildFollowUpInboxPage> }) {
  return (
    <section className="club-panel club-page">
      <div className="card-head">
        <div>
          <span className="club-kicker">
            {model.overdueCount} overdue · {model.dueTodayCount} due today
          </span>
        </div>
        <Link className="ghost-button" to="/dashboard/growth">
          ← Back
        </Link>
      </div>
      <Table
        model={model.table}
        getRowKey={(row) => row.id}
        emptyMessage="No follow-ups due."
        renderCell={(row, columnKey) => {
          if (columnKey === "fullName") {
            return <Link to={`/dashboard/growth/leads/${row.id}`}>{row.fullName}</Link>;
          }
          return String((row as unknown as Record<string, unknown>)[columnKey] ?? "-");
        }}
      />
    </section>
  );
}

function GrowthWatchlistScreen({ model }: { model: ReturnType<typeof buildRetentionWatchlistPage> }) {
  return (
    <section className="club-panel club-page">
      <div className="card-head">
        <span className="club-kicker">{model.totalCount} flagged members</span>
        <Link className="ghost-button" to="/dashboard/growth">
          ← Back
        </Link>
      </div>
      <Table
        model={model.table}
        getRowKey={(row) => row.id}
        emptyMessage="No members on the watchlist."
        renderCell={(row, columnKey) => {
          if (columnKey === "fullName") {
            return <Link to={`/dashboard/growth/leads/${row.id}`}>{row.fullName}</Link>;
          }
          if (columnKey === "retentionFlagBadge" && row.retentionFlagBadge) {
            return (
              <Badge
                model={badge({ label: row.retentionFlagBadge.label, tone: row.retentionFlagBadge.tone })}
              />
            );
          }
          if (columnKey === "statusBadge") {
            return <Badge model={badge({ label: row.statusBadge.label, tone: row.statusBadge.tone })} />;
          }
          return String((row as unknown as Record<string, unknown>)[columnKey] ?? "-");
        }}
      />
    </section>
  );
}

function GrowthLeadScreen({
  model,
  interactionsLoading,
  error,
  onLogInteraction,
  onConvert
}: {
  model: ReturnType<typeof buildGrowthLeadProfilePage>;
  interactionsLoading: boolean;
  error?: string;
  onLogInteraction: (type: InteractionType, notes: string) => Promise<void>;
  onConvert: () => Promise<void>;
}) {
  const [submittingLog, setSubmittingLog] = useState(false);
  const [submittingConvert, setSubmittingConvert] = useState(false);

  return (
    <section className="club-panel profile-sheet">
      <div className="card-head">
        <div>
          <h2>{model.fullName}</h2>
          <span>{model.contactLabel}</span>
        </div>
        <div className="button-row">
          <Link className="ghost-button" to="/dashboard/growth">
            ← Back
          </Link>
          <Button
            model={{ ...model.convertAction, disabled: model.convertAction.disabled || submittingConvert }}
            type="button"
            onClick={() => {
              setSubmittingConvert(true);
              void onConvert().finally(() => setSubmittingConvert(false));
            }}
          />
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}

      <div className="profile-grid">
        <div className="profile-column">
          <section className="checkin-sheet-section">
            <div className="card-head">
              <h3>CRM Details</h3>
            </div>
            <dl className="react-detail-list">
              <div>
                <dt>Lead Source</dt>
                <dd>{model.crmSection.leadSource}</dd>
              </div>
              {model.crmSection.interestLevel ? (
                <div>
                  <dt>Interest</dt>
                  <dd>
                    <Badge
                      model={badge({
                        label: model.crmSection.interestLevel.label,
                        tone: model.crmSection.interestLevel.tone
                      })}
                    />
                  </dd>
                </div>
              ) : null}
              {model.crmSection.assignedStaffName ? (
                <div>
                  <dt>Assigned To</dt>
                  <dd>{model.crmSection.assignedStaffName}</dd>
                </div>
              ) : null}
              {model.crmSection.nextFollowUpLabel ? (
                <div>
                  <dt>Next Follow-up</dt>
                  <dd className={model.crmSection.isFollowUpOverdue ? "text-danger" : ""}>
                    {model.crmSection.nextFollowUpLabel}
                    {model.crmSection.isFollowUpOverdue ? " (overdue)" : ""}
                  </dd>
                </div>
              ) : null}
              {model.crmSection.retentionFlag ? (
                <div>
                  <dt>Retention Flag</dt>
                  <dd>
                    <Badge
                      model={badge({
                        label: model.crmSection.retentionFlag.label,
                        tone: model.crmSection.retentionFlag.tone
                      })}
                    />
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="checkin-sheet-section">
            <div className="card-head">
              <h3>Contact Preferences</h3>
            </div>
            <dl className="react-detail-list">
              <div>
                <dt>Email consent</dt>
                <dd>{model.consentSection.consentEmail ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>SMS consent</dt>
                <dd>{model.consentSection.consentSms ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>Phone consent</dt>
                <dd>{model.consentSection.consentPhone ? "Yes" : "No"}</dd>
              </div>
              {model.consentSection.contactPreference ? (
                <div>
                  <dt>Preference</dt>
                  <dd>{model.consentSection.contactPreference}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        <div className="profile-column">
          <section className="checkin-sheet-section">
            <div className="card-head">
              <h3>Log Interaction</h3>
            </div>
            <form
              className="form-card compact-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const type = String(form.get("type") ?? "note") as InteractionType;
                const notes = String(form.get("notes") ?? "");
                setSubmittingLog(true);
                void onLogInteraction(type, notes).finally(() => {
                  setSubmittingLog(false);
                  event.currentTarget.reset();
                });
              }}
            >
              <label className="field">
                <span>Type</span>
                <select name="type" disabled={model.logNoteAction.disabled || submittingLog}>
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </label>
              <label className="field">
                <span>Notes</span>
                <textarea name="notes" rows={3} disabled={model.logNoteAction.disabled || submittingLog} />
              </label>
              <button type="submit" disabled={model.logNoteAction.disabled || submittingLog}>
                Log
              </button>
            </form>
          </section>

          <section className="checkin-sheet-section">
            <div className="card-head">
              <h3>Timeline</h3>
              {interactionsLoading ? <span>Loading...</span> : <span>{model.timeline.length} entries</span>}
            </div>
            {model.timeline.length === 0 && !interactionsLoading ? (
              <div className="empty-state">
                <p>No interactions logged yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Notes</th>
                      <th>Staff</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.timeline.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.typeLabel}</td>
                        <td>{entry.notes ?? "-"}</td>
                        <td>{entry.staffName ?? "-"}</td>
                        <td>{entry.occurredAtLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

function toDashboardRoute(href: string) {
  if (href.startsWith("/dashboard")) {
    return href;
  }
  return `/dashboard${href}`;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
