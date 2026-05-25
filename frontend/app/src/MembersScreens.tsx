import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MemberStatus } from "@gym-platform/constants";
import { memberCreateSchema, memberUpdateSchema } from "@gym-platform/validation";
import type { z } from "zod";
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
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";

export function MembersDomainRoute({ mode }: { mode: "list" | "detail" | "edit" }) {
  const navigate = useNavigate();
  const session = loadSession();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.dashboardWorkspace,
    queryFn: () => loadDashboardWorkspaceData(),
    enabled: Boolean(session)
  });

  if (!session) {
    return <Navigate to="/dashboard/home" replace />;
  }
  if (workspaceQuery.isLoading) {
    return <div className="react-bootstrap-state">Loading members...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <div className="empty-state" role="alert">
        <h3>Unable to load members</h3>
        <p>{describeError(workspaceQuery.error)}</p>
      </div>
    );
  }

  const shell = buildShellModel(workspaceQuery.data, mode);

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
        <MemberListRoute data={workspaceQuery.data} />
      ) : mode === "edit" ? (
        <MemberEditRoute data={workspaceQuery.data} />
      ) : (
        <MemberDetailRoute data={workspaceQuery.data} />
      )}
    </Shell>
  );
}

function MemberListRoute({ data }: { data: DashboardWorkspaceData }) {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | undefined>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createMemberMutation = useMutation({
    mutationFn: (input: MemberCreateFormInput) => createMember(data.gym.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboardWorkspace })
  });
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
      const created = (await createMemberMutation.mutateAsync(input)) as MemberView;
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
  const membershipsQuery = useQuery({
    queryKey: member ? queryKeys.memberMemberships(data.gym.id, member.id) : ["member-memberships", data.gym.id, "none"],
    queryFn: () => loadMemberMemberships(data.gym.id, member?.id ?? ""),
    enabled: Boolean(member),
    retry: false
  });

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
    memberships: (membershipsQuery.data ?? []) as MemberProfilePage["memberships"],
    permissions: data.permissions
  });

  return <MemberDetailScreen model={page} />;
}

function MemberEditRoute({ data }: { data: DashboardWorkspaceData }) {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const member = data.members.find((candidate) => candidate.id === memberId);
  const [error, setError] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const updateMemberMutation = useMutation({
    mutationFn: (input: MemberUpdateFormInput) => updateMember(data.gym.id, member?.id ?? "", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardWorkspace });
      if (member) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.memberMemberships(data.gym.id, member.id) });
      }
    }
  });

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
      await updateMemberMutation.mutateAsync(input);
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

type MemberCreateFields = z.infer<typeof memberCreateSchema>;

function MemberCreateCard({
  model,
  error,
  onCreate
}: {
  model: MemberListPage;
  error?: string;
  onCreate: (input: MemberCreateFormInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<MemberCreateFields>({
    resolver: zodResolver(memberCreateSchema),
    defaultValues: { status: MemberStatus.Active, tagNames: [] }
  });

  const disabled = model.createMemberAction.disabled || isSubmitting;

  return (
    <form
      className="form-card compact-form"
      onSubmit={handleSubmit(async (data) => {
        await onCreate(data as MemberCreateFormInput);
      })}
    >
      <div className="card-head">
        <h3>{model.createMemberAction.label}</h3>
        <span>{model.activeFilterCount} filters</span>
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      <label className="field">
        <span>First name</span>
        <input {...register("firstName")} disabled={disabled} />
        {errors.firstName && <small className="field-error">{errors.firstName.message}</small>}
      </label>
      <label className="field">
        <span>Last name</span>
        <input {...register("lastName")} disabled={disabled} />
        {errors.lastName && <small className="field-error">{errors.lastName.message}</small>}
      </label>
      <label className="field">
        <span>Email</span>
        <input
          {...register("email", { setValueAs: (v: string) => v.trim() || undefined })}
          type="email"
          disabled={disabled}
        />
        {errors.email && <small className="field-error">{errors.email.message}</small>}
      </label>
      <label className="field">
        <span>Phone</span>
        <input
          {...register("phone", { setValueAs: (v: string) => v.trim() || undefined })}
          type="tel"
          disabled={disabled}
        />
        {errors.phone && <small className="field-error">{errors.phone.message}</small>}
      </label>
      <label className="field">
        <span>Status</span>
        <select {...register("status")} disabled={disabled}>
          {model.statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.status && <small className="field-error">{errors.status.message}</small>}
      </label>
      <Button model={{ ...model.createMemberAction, disabled }} type="submit" />
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

type MemberUpdateFields = z.infer<typeof memberUpdateSchema>;

function MemberEditScreen({
  member,
  error,
  onUpdate
}: {
  member: MemberView;
  error?: string;
  onUpdate: (input: MemberUpdateFormInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<MemberUpdateFields>({
    resolver: zodResolver(memberUpdateSchema),
    defaultValues: {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email ?? "",
      phone: member.phone ?? "",
      status: member.status,
      tagNames: member.tagNames,
      notes: member.notes ?? ""
    }
  });

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
        onSubmit={handleSubmit(async (data) => {
          await onUpdate(data as unknown as MemberUpdateFormInput);
        })}
      >
        <div className="customer-edit-grid">
          <section className="customer-edit-card">
            <h4>Identity</h4>
            <label className="field">
              <span>First name</span>
              <input {...register("firstName")} disabled={isSubmitting} />
              {errors.firstName && <small className="field-error">{errors.firstName.message}</small>}
            </label>
            <label className="field">
              <span>Last name</span>
              <input {...register("lastName")} disabled={isSubmitting} />
              {errors.lastName && <small className="field-error">{errors.lastName.message}</small>}
            </label>
            <label className="field">
              <span>Status</span>
              <select {...register("status")} disabled={isSubmitting}>
                {Object.values(MemberStatus).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {errors.status && <small className="field-error">{errors.status.message}</small>}
            </label>
          </section>
          <section className="customer-edit-card">
            <h4>Contact</h4>
            <label className="field">
              <span>Email</span>
              <input
                {...register("email", { setValueAs: (v: string) => v.trim() || undefined })}
                type="email"
                disabled={isSubmitting}
              />
              {errors.email && <small className="field-error">{errors.email.message}</small>}
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                {...register("phone", { setValueAs: (v: string) => v.trim() || undefined })}
                type="tel"
                disabled={isSubmitting}
              />
              {errors.phone && <small className="field-error">{errors.phone.message}</small>}
            </label>
          </section>
          <section className="customer-edit-card">
            <h4>Tags</h4>
            <label className="field">
              <span>Tags, comma separated</span>
              <input
                {...register("tagNames", {
                  setValueAs: (v: string) => v.split(",").map((t) => t.trim()).filter(Boolean)
                })}
                defaultValue={member.tagNames.join(", ")}
                disabled={isSubmitting}
              />
              {errors.tagNames && <small className="field-error">{errors.tagNames.message}</small>}
            </label>
          </section>
          <section className="customer-edit-card customer-edit-card-wide">
            <h4>Notes</h4>
            <label className="field">
              <span>Notes</span>
              <textarea
                {...register("notes", { setValueAs: (v: string) => v.trim() || undefined })}
                rows={5}
                disabled={isSubmitting}
              />
              {errors.notes && <small className="field-error">{errors.notes.message}</small>}
            </label>
          </section>
        </div>
        <div className="customer-edit-footer">
          <button type="submit" className="save-button" disabled={isSubmitting}>Save consumer</button>
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
