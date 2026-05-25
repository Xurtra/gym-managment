import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MemberStatus } from "@gym-platform/constants";
import {
  buildDashboardShellLayout,
  buildMemberListPage,
  buildMemberProfilePage,
  buildPageHeader,
  type MemberListPage,
  type MemberListRow,
  type MemberProfilePage,
  type MemberView
} from "@gym-platform/dashboard";
import { avatar, badge } from "@gym-platform/ui";
import { Avatar, Badge, Button, Table } from "@gym-platform/ui-react";
import {
  createDashboardClient,
  createMember,
  currentUserDisplayName,
  loadDashboardWorkspaceData,
  loadMemberMemberships,
  loadSession,
  updateMember,
  type DashboardWorkspaceData,
  type MemberCreateFormInput,
  type MemberUpdateFormInput
} from "./dashboardData.js";
import { Shell } from "./Shell.js";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardWorkspaceData }
  | { status: "failed"; message: string };

export function MembersDomainRoute({ mode }: { mode: "list" | "detail" | "edit" }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const navigate = useNavigate();
  const session = loadSession();

  const reload = async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "ready", data: await loadDashboardWorkspaceData() });
    } catch (error) {
      setState({ status: "failed", message: describeError(error) });
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  if (!session) {
    return <Navigate to="/dashboard/home" replace />;
  }
  if (state.status === "loading") {
    return <div className="react-bootstrap-state">Loading members...</div>;
  }
  if (state.status === "failed") {
    return (
      <div className="empty-state" role="alert">
        <h3>Unable to load members</h3>
        <p>{state.message}</p>
      </div>
    );
  }

  const shell = buildShellModel(state.data, mode);

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
      {mode === "list" ? (
        <MemberListRoute data={state.data} onReload={reload} />
      ) : mode === "edit" ? (
        <MemberEditRoute data={state.data} onReload={reload} />
      ) : (
        <MemberDetailRoute data={state.data} />
      )}
    </Shell>
  );
}

function MemberListRoute({
  data,
  onReload
}: {
  data: DashboardWorkspaceData;
  onReload: () => Promise<void>;
}) {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | undefined>();
  const navigate = useNavigate();
  const page = useMemo(
    () =>
      buildMemberListPage({
        members: data.members,
        permissions: data.permissions,
        surface: "consumer",
        filters: {
          query: searchParams.get("query") ?? undefined,
          status: (searchParams.get("status") as MemberStatus | null) ?? undefined
        },
        detailBasePath: "/dashboard/consumers/profile",
        editBasePath: "/dashboard/consumers/edit"
      }),
    [data.members, data.permissions, searchParams]
  );

  async function handleCreate(input: MemberCreateFormInput) {
    try {
      setError(undefined);
      const created = (await createMember(data.gym.id, input)) as MemberView;
      await onReload();
      navigate(`/dashboard/consumers/profile/${created.id}`);
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  return (
    <MemberListScreen
      model={page}
      error={error}
      onCreate={handleCreate}
    />
  );
}

function MemberDetailRoute({ data }: { data: DashboardWorkspaceData }) {
  const { memberId } = useParams();
  const member = data.members.find((candidate) => candidate.id === memberId) ?? data.members[0];
  const [memberships, setMemberships] = useState<MemberProfilePage["memberships"] | undefined>();

  useEffect(() => {
    if (!member) {
      setMemberships(undefined);
      return;
    }
    let cancelled = false;
    loadMemberMemberships(data.gym.id, member.id)
      .then((rows) => {
        if (!cancelled) {
          setMemberships(rows as MemberProfilePage["memberships"]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMemberships([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [data.gym.id, member?.id]);

  if (!member) {
    return (
      <div className="empty-state">
        <h3>Consumer not found</h3>
        <p>The selected consumer could not be found.</p>
      </div>
    );
  }

  const page = buildMemberProfilePage({
    member,
    memberships,
    permissions: data.permissions
  });

  return <MemberDetailScreen model={page} />;
}

function MemberEditRoute({
  data,
  onReload
}: {
  data: DashboardWorkspaceData;
  onReload: () => Promise<void>;
}) {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const member = data.members.find((candidate) => candidate.id === memberId);
  const [error, setError] = useState<string | undefined>();

  if (!member) {
    return (
      <div className="empty-state">
        <h3>Consumer not found</h3>
        <p>The selected consumer could not be found.</p>
      </div>
    );
  }

  async function handleUpdate(input: MemberUpdateFormInput) {
    try {
      setError(undefined);
      await updateMember(data.gym.id, member.id, input);
      await onReload();
      navigate(`/dashboard/consumers/profile/${member.id}`);
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  return <MemberEditScreen member={member} error={error} onUpdate={handleUpdate} />;
}

function MemberListScreen({
  model,
  error,
  onCreate
}: {
  model: MemberListPage;
  error?: string;
  onCreate: (input: MemberCreateFormInput) => Promise<void>;
}) {
  return (
    <section className="club-panel club-page consumer-page">
      <div className="card-head">
        <div>
          <p className="eyebrow">Consumers</p>
          <h2>Consumer Directory</h2>
        </div>
        <span className="club-kicker">{model.summaryLabel}</span>
      </div>

      <div className="stat-grid compact">
        <article className="mini-card"><span>Total</span><strong>{model.summary.totalCount}</strong></article>
        <article className="mini-card"><span>Members</span><strong>{model.summary.memberCount}</strong></article>
        <article className="mini-card"><span>Leads</span><strong>{model.summary.leadCount}</strong></article>
      </div>

      <div className="club-page-split">
        <MemberCreateCard model={model} error={error} onCreate={onCreate} />
        <div className="data-card">
          <Table
            model={model.table}
            getRowKey={(row) => row.id}
            emptyMessage="No consumer rows to display."
            renderCell={(row, columnKey) => renderMemberListCell(row, columnKey)}
          />
        </div>
      </div>
    </section>
  );
}

function MemberCreateCard({
  model,
  error,
  onCreate
}: {
  model: MemberListPage;
  error?: string;
  onCreate: (input: MemberCreateFormInput) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="form-card compact-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSubmitting(true);
        void onCreate({
          firstName: String(form.get("firstName") ?? ""),
          lastName: String(form.get("lastName") ?? ""),
          email: optionalString(form.get("email")),
          phone: optionalString(form.get("phone")),
          status: (String(form.get("status") ?? MemberStatus.Active) as MemberStatus)
        }).finally(() => setSubmitting(false));
      }}
    >
      <div className="card-head">
        <h3>{model.createMemberAction.label}</h3>
        <span>{model.activeFilterCount} filters</span>
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      <label className="field">
        <span>First name</span>
        <input name="firstName" required disabled={model.createMemberAction.disabled || submitting} />
      </label>
      <label className="field">
        <span>Last name</span>
        <input name="lastName" required disabled={model.createMemberAction.disabled || submitting} />
      </label>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" disabled={model.createMemberAction.disabled || submitting} />
      </label>
      <label className="field">
        <span>Phone</span>
        <input name="phone" type="tel" disabled={model.createMemberAction.disabled || submitting} />
      </label>
      <label className="field">
        <span>Status</span>
        <select name="status" defaultValue={MemberStatus.Active} disabled={model.createMemberAction.disabled || submitting}>
          {model.statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <Button model={{ ...model.createMemberAction, disabled: model.createMemberAction.disabled || submitting }} type="submit" />
    </form>
  );
}

function MemberDetailScreen({ model }: { model: MemberProfilePage }) {
  return (
    <section className="club-panel profile-sheet">
      <div className="profile-header">
        <div className="profile-header-main">
          <Avatar
            className="profile-avatar"
            model={avatar({
              label: model.fullName,
              initials: model.initials,
              ...(model.member.profileImageUrl ? { imageUrl: model.member.profileImageUrl } : {})
            })}
          />
          <div className="profile-header-copy">
            <p className="eyebrow">Consumer Profile</p>
            <h2>{model.fullName}</h2>
            <div className="checkin-sheet-badges">
              <MemberStatusBadge model={model.statusBadge} />
              <span className="club-note-label">{model.member.recordStatus}</span>
            </div>
          </div>
        </div>
        <div className="club-mini-nav">
          {model.actions.map((action) =>
            action.href ? (
              <Link key={action.key} to={toDashboardRoute(action.href)} className="ghost-button">
                {action.button.label}
              </Link>
            ) : null
          )}
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-column">
          {model.sections.map((section) => (
            <section className="checkin-sheet-section" key={section.key}>
              <div className="card-head">
                <h3>{section.title}</h3>
              </div>
              <dl className="react-detail-list">
                {section.details.map((detail) => (
                  <div key={detail.key}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <div className="profile-column">
          <section className="checkin-sheet-section">
            <div className="card-head">
              <h3>Memberships</h3>
              <span>{model.membershipSummaryLabel}</span>
            </div>
            {model.memberships.length === 0 ? (
              <div className="empty-state"><p>{model.membershipEmpty?.body ?? "No memberships to display."}</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Plan</th><th>Status</th><th>Dates</th></tr>
                  </thead>
                  <tbody>
                    {model.memberships.map((membership) => (
                      <tr key={membership.id}>
                        <td>{membership.planName}</td>
                        <td>{membership.statusLabel}</td>
                        <td>{membership.dateRangeLabel}</td>
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

function MemberEditScreen({
  member,
  error,
  onUpdate
}: {
  member: MemberView;
  error?: string;
  onUpdate: (input: MemberUpdateFormInput) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <section className="data-card customer-edit-shell">
      <div className="card-head customer-edit-head">
        <div>
          <p className="eyebrow">Edit Consumer</p>
          <h3>{`${member.firstName} ${member.lastName}`.trim()}</h3>
        </div>
        <span>{member.id}</span>
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      <form
        className="form-card customer-edit-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setSubmitting(true);
          void onUpdate({
            firstName: String(form.get("firstName") ?? ""),
            lastName: String(form.get("lastName") ?? ""),
            email: optionalString(form.get("email")),
            phone: optionalString(form.get("phone")),
            status: String(form.get("status") ?? member.status) as MemberStatus,
            tagNames: String(form.get("tagNames") ?? "")
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            notes: optionalString(form.get("notes"))
          }).finally(() => setSubmitting(false));
        }}
      >
        <div className="customer-edit-grid">
          <section className="customer-edit-card">
            <h4>Identity</h4>
            <label className="field"><span>First name</span><input name="firstName" defaultValue={member.firstName} required disabled={submitting} /></label>
            <label className="field"><span>Last name</span><input name="lastName" defaultValue={member.lastName} required disabled={submitting} /></label>
            <label className="field">
              <span>Status</span>
              <select name="status" defaultValue={member.status} disabled={submitting}>
                {Object.values(MemberStatus).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </section>
          <section className="customer-edit-card">
            <h4>Contact</h4>
            <label className="field"><span>Email</span><input name="email" type="email" defaultValue={member.email ?? ""} disabled={submitting} /></label>
            <label className="field"><span>Phone</span><input name="phone" type="tel" defaultValue={member.phone ?? ""} disabled={submitting} /></label>
          </section>
          <section className="customer-edit-card">
            <h4>Tags</h4>
            <label className="field"><span>Tags, comma separated</span><input name="tagNames" defaultValue={member.tagNames.join(", ")} disabled={submitting} /></label>
          </section>
          <section className="customer-edit-card customer-edit-card-wide">
            <h4>Notes</h4>
            <label className="field"><span>Notes</span><textarea name="notes" rows={5} defaultValue={member.notes ?? ""} disabled={submitting} /></label>
          </section>
        </div>
        <div className="customer-edit-footer">
          <button type="submit" className="save-button" disabled={submitting}>Save consumer</button>
          <Link className="ghost-button" to={`/dashboard/consumers/profile/${member.id}`}>Cancel</Link>
        </div>
      </form>
    </section>
  );
}

function MemberStatusBadge({ model }: { model: MemberProfilePage["statusBadge"] }) {
  return <Badge model={badge({ label: model.label, tone: model.tone })} title={model.description} />;
}

function renderMemberListCell(row: MemberListRow, columnKey: keyof MemberListRow & string) {
  if (columnKey === "fullName") {
    return (
      <Link className="react-member-cell" to={row.detailHref}>
        <Avatar
          model={avatar({
            label: row.fullName,
            initials: row.initials,
            ...(row.profileImageUrl ? { imageUrl: row.profileImageUrl } : {})
          })}
        />
        <span>{row.fullName}</span>
      </Link>
    );
  }
  if (columnKey === "statusLabel") {
    return <MemberStatusBadge model={row.statusBadge} />;
  }
  return String(row[columnKey] ?? "-");
}

function buildShellModel(data: DashboardWorkspaceData, mode: "list" | "detail" | "edit") {
  const title =
    mode === "list" ? "Consumer Directory" : mode === "edit" ? "Edit Consumer" : "Consumer Profile";
  return buildDashboardShellLayout({
    path: "/consumers",
    permissions: data.permissions,
    platformAdmin: data.platformAdmin,
    email: data.me.user.email,
    firstName: data.me.user.firstName,
    lastName: data.me.user.lastName,
    gymName: data.gym.name,
    pageHeader: buildPageHeader({
      title,
      eyebrow: "People",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Consumers", href: "/consumers" },
        { label: title, href: "/consumers" }
      ],
      description: `${currentUserDisplayName(data.me)} is working in ${data.gym.name}.`
    })
  });
}

function optionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function toDashboardRoute(href: string) {
  if (href.startsWith("/dashboard")) {
    return href;
  }
  if (href === "/members") {
    return "/dashboard/consumers";
  }
  if (href.startsWith("/members/")) {
    const parts = href.split("/").filter(Boolean);
    const memberId = parts[1];
    if (parts[2] === "edit") {
      return `/dashboard/consumers/edit/${memberId}`;
    }
    return `/dashboard/consumers/profile/${memberId}`;
  }
  return `/dashboard${href}`;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
