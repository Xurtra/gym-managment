import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { calendarEvent } from "@gym-platform/ui";
import {
  buildDashboardShellLayout,
  buildPageHeader,
  buildStaffInviteFlow,
  buildStaffListPage,
  buildStaffShiftCalendarView,
  type StaffMemberView,
  type StaffRoleOption,
  type StaffShiftView,
  type StaffInviteView
} from "@gym-platform/dashboard";
import { FormLayout, LogList, Table } from "@gym-platform/ui-react";
import { staffInviteCreateSchema } from "@gym-platform/validation";
import type { z } from "zod";
import {
  createStaffInvite,
  loadOperationsWorkspace,
  loadSession,
  type DashboardWorkspaceData,
  type StaffInviteRecord,
  type StaffRecord,
  type StaffShiftRecord,
  type StaffTimeEntryRecord
} from "./dashboardData.js";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";
import { ScheduleCalendar } from "./components/ScheduleCalendar.js";

type Mode = "directory" | "invites" | "shifts" | "time-clock";

type ReadyData = DashboardWorkspaceData & {
  staff: StaffRecord[];
  roles: Array<{ id: string; name: string; permissions: string[]; isSystem?: boolean }>;
  invites: StaffInviteRecord[];
  shifts: StaffShiftRecord[];
  timeEntries: StaffTimeEntryRecord[];
};

export function StaffDomainRoute({ mode }: { mode: Mode }) {
  const session = loadSession();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.operationsWorkspace,
    queryFn: () => loadOperationsWorkspace(),
    enabled: Boolean(session)
  });

  if (!session) {
    return <Navigate to="/dashboard/login" replace />;
  }

  if (workspaceQuery.isLoading) {
    return <div className="react-bootstrap-state">Loading staff...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <div className="empty-state" role="alert">
        <h3>Unable to load staff</h3>
        <p>{describeError(workspaceQuery.error)}</p>
      </div>
    );
  }
  const data = workspaceQuery.data as ReadyData;

  const shell = buildDashboardShellLayout({
    path: "/staff",
    permissions: data.permissions,
    platformAdmin: data.platformAdmin,
    email: data.me.user.email,
    firstName: data.me.user.firstName,
    lastName: data.me.user.lastName,
    gymName: data.gym.name,
    gymSlug: data.gym.slug,
    gymLogoUrl: data.gym.logoUrl,
    pageHeader: buildPageHeader({
      title:
        mode === "invites"
          ? "Staff Invites"
          : mode === "shifts"
            ? "Shift Schedule"
            : mode === "time-clock"
              ? "Time Clock"
              : "Staff Directory",
      eyebrow: "Team",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Staff", href: "/staff" }
      ]
    })
  });

  return (
    <Shell model={shell}>
      {mode === "invites" ? (
        <StaffInviteViewScreen data={data} />
      ) : mode === "shifts" ? (
        <StaffShiftScheduleScreen data={data} />
      ) : mode === "time-clock" ? (
        <StaffTimeClockScreen data={data} />
      ) : (
        <StaffDirectoryScreen data={data} />
      )}
    </Shell>
  );
}

function StaffDirectoryScreen({ data }: { data: ReadyData }) {
  const page = buildStaffListPage({
    staff: data.staff as unknown as StaffMemberView[],
    roles: data.roles.map((role) => ({
      id: role.id,
      name: role.name,
      label: role.name,
      permissions: role.permissions,
      isSystem: role.isSystem
    })) as StaffRoleOption[],
    permissions: data.permissions
  });
  const activeStaff = data.staff.filter((staff) => staff.status === "active");
  const upcomingShifts = data.shifts
    .slice()
    .filter((shift) => new Date(shift.endsAt).getTime() >= Date.now())
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .slice(0, 8);
  const myEntries = data.timeEntries
    .filter((entry) => entry.userId === data.me.user.id)
    .sort((left, right) => new Date(right.clockedInAt).getTime() - new Date(left.clockedInAt).getTime());
  const myMinutes = myEntries.reduce((sum, entry) => sum + staffTimeEntryMinutes(entry), 0);
  const openEntry = myEntries.find((entry) => !entry.clockedOutAt);

  return (
    <section className="club-panel club-page club-staff-page">
      <div className="card-head">
        <div>
          <p className="eyebrow">Staff</p>
          <h2>Team access</h2>
        </div>
        <span>{page.summary.totalCount} staff · {activeStaff.length} active</span>
      </div>
      <div className="club-page-split">
        <div className="section-stack">
          <div className="club-panel">
            <div className="card-head">
              <div>
                <h3>Staff access</h3>
                <p className="club-copy">Roster, assigned roles, and current account status.</p>
              </div>
              <Link className="ghost-button" to="/dashboard/staff/invites">Invite staff</Link>
            </div>
            <div className="stat-grid compact">
              <article className="mini-card"><span>Total</span><strong>{page.summary.totalCount}</strong></article>
              <article className="mini-card"><span>Active</span><strong>{page.summary.activeCount}</strong></article>
              <article className="mini-card"><span>Invited</span><strong>{page.summary.invitedCount}</strong></article>
              <article className="mini-card"><span>Disabled</span><strong>{page.summary.disabledCount}</strong></article>
            </div>
            <div className="data-card">
              <Table model={page.table} getRowKey={(row) => row.userId} />
            </div>
          </div>
          <div className="club-panel">
            <div className="card-head">
              <div>
                <h3>Upcoming shifts</h3>
                <p className="club-copy">Scheduled floor coverage for active staff.</p>
              </div>
              <Link className="ghost-button" to="/dashboard/staff/shifts">Calendar</Link>
            </div>
            {upcomingShifts.length === 0 ? (
              <div className="settings-placeholder"><strong>No upcoming shifts</strong><p>Schedule staff shifts to show coverage here.</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Staff</th><th>Role</th><th>Starts</th><th>Location</th></tr></thead>
                  <tbody>
                    {upcomingShifts.map((shift) => (
                      <tr key={shift.id}>
                        <td>{staffName(data, shift.userId)}</td>
                        <td>{roleName(data, shift.roleId)}</td>
                        <td>{formatDateTime(shift.startsAt)}</td>
                        <td>{locationName(data, shift.locationId)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="club-panel">
            <div className="card-head">
              <div>
                <h3>My hours</h3>
                <p className="club-copy">Your own clocked time only. This does not include anyone else on the roster.</p>
              </div>
              <button type="button" className="ghost-button" disabled={myEntries.length === 0}>Export CSV</button>
            </div>
            <div className="card-grid compact">
              <article className="mini-card"><span>Total hours</span><strong>{(myMinutes / 60).toFixed(2)}</strong></article>
              <article className="mini-card"><span>Status</span><strong>{openEntry ? "Clocked in" : "Not clocked in"}</strong></article>
            </div>
          </div>
        </div>
        <div className="section-stack">
          <div className="club-panel">
            <div className="card-head">
              <div>
                <h3>Authorization tree</h3>
                <p className="club-copy">Roles and permissions that control visible staff tools.</p>
              </div>
            </div>
            <div className="settings-grid">
              {data.roles.slice(0, 8).map((role) => (
                <article className="settings-role-card" key={role.id}>
                  <strong>{role.name}</strong>
                  <span>{role.permissions.length} permissions</span>
                </article>
              ))}
            </div>
          </div>
          <div className="club-panel">
            <div className="card-head">
              <div>
                <h3>Create staff account</h3>
                <p className="club-copy">Send an invite and assign a starting role.</p>
              </div>
            </div>
            <div className="compact-form">
              <label className="field"><span>Email</span><input disabled placeholder="employee@example.com" /></label>
              <label className="field"><span>Role</span><select disabled><option>Choose a role</option></select></label>
              <Link className="ghost-button" to="/dashboard/staff/invites">Open invites</Link>
            </div>
          </div>
          <div className="club-panel">
            <div className="card-head">
              <div>
                <h3>Payroll report</h3>
                <p className="club-copy">Clocked hours by staff member, ready for payroll review.</p>
              </div>
              <button type="button" className="ghost-button" disabled={data.timeEntries.length === 0}>Export CSV</button>
            </div>
            <div className="settings-grid">
              <article className="mini-card"><span>Entries</span><strong>{data.timeEntries.length}</strong></article>
              <article className="mini-card"><span>Open</span><strong>{data.timeEntries.filter((entry) => !entry.clockedOutAt).length}</strong></article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type StaffInviteFields = z.infer<typeof staffInviteCreateSchema>;

function StaffInviteViewScreen({ data }: { data: ReadyData }) {
  const [error, setError] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const createInviteMutation = useMutation({
    mutationFn: (input: Parameters<typeof createStaffInvite>[1]) => createStaffInvite(data.gym.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operationsWorkspace })
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<StaffInviteFields>({
    resolver: zodResolver(staffInviteCreateSchema)
  });

  const screen = buildStaffInviteFlow({
    roles: data.roles.map((role) => ({
      id: role.id,
      name: role.name,
      label: role.name,
      permissions: role.permissions,
      isSystem: role.isSystem
    })) as StaffRoleOption[],
    invites: data.invites as unknown as StaffInviteView[]
  });

  return (
    <FormLayout model={{ title: "Invite staff", description: screen.summaryLabel }}>
      {error ? <div className="banner error">{error}</div> : null}
      <form
        className="compact-form"
        onSubmit={handleSubmit(async (fields) => {
          setError(undefined);
          try {
            await createInviteMutation.mutateAsync({
              email: fields.email,
              roleId: fields.roleId,
              message: fields.message
            });
            reset();
          } catch (caught) {
            setError(describeError(caught));
          }
        })}
      >
        <label className="field">
          <span>{screen.emailField.label}</span>
          <input
            {...register("email")}
            type="email"
            disabled={isSubmitting}
          />
          {errors.email && <small className="field-error">{errors.email.message}</small>}
        </label>
        <label className="field">
          <span>Role</span>
          <select {...register("roleId")} required disabled={isSubmitting}>
            <option value="">Select a role…</option>
            {screen.roleOptions.map((option) => (
              <option key={option.id} value={option.id} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.roleId && <small className="field-error">{errors.roleId.message}</small>}
        </label>
        <label className="field">
          <span>{screen.messageField.label}</span>
          <textarea
            {...register("message", { setValueAs: (v: string) => v.trim() || undefined })}
            rows={3}
            disabled={isSubmitting}
          />
          {errors.message && <small className="field-error">{errors.message.message}</small>}
        </label>
        <button className="save-button" type="submit" disabled={!screen.canSubmit || isSubmitting}>
          {screen.action.label}
        </button>
      </form>
      <div className="data-card">
        <Table model={screen.table} getRowKey={(row) => row.id} />
      </div>
    </FormLayout>
  );
}

function StaffShiftScheduleScreen({ data }: { data: ReadyData }) {
  const weekStartsAt = useMemo(() => {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + diff);
    monday.setUTCHours(0, 0, 0, 0);
    return monday.toISOString();
  }, []);

  const calendar = buildStaffShiftCalendarView({
    staff: data.staff as unknown as StaffMemberView[],
    shifts: data.shifts as unknown as StaffShiftView[],
    roles: data.roles.map((role) => ({ id: role.id, name: role.name, label: role.name })) as StaffRoleOption[],
    locations: data.locations.map((location) => ({ id: location.id, name: location.name })),
    weekStartsAt,
    timezone: "UTC"
  });

  const events = calendar.visibleShifts.map((shift) =>
    calendarEvent({
      id: shift.id,
      title: shift.staffName,
      subtitle: shift.roleLabel,
      startsAt: shift.startsAt,
      endsAt: shift.endsAt,
      status: shift.overlaps ? "overlap" : "scheduled"
    })
  );

  return (
    <section className="club-panel">
      <div className="card-head">
        <h2>{calendar.summaryLabel}</h2>
        <span>{calendar.overlappingShiftCount} overlaps</span>
      </div>
      <ScheduleCalendar events={events} defaultView="week" />
    </section>
  );
}

function StaffTimeClockScreen({ data }: { data: ReadyData }) {
  return (
    <section className="club-panel">
      <LogList
        model={{
          title: "Time entries",
          entries: data.timeEntries
            .slice()
            .sort((left, right) => right.clockedInAt.localeCompare(left.clockedInAt))
            .map((entry) => {
              const staff = data.staff.find((member) => member.userId === entry.userId);
              return {
                key: entry.id,
                title: staff ? `${staff.firstName} ${staff.lastName}`.trim() : entry.userId,
                subtitle: entry.clockedOutAt ? "Clocked out" : "Clocked in",
                timestamp: entry.clockedInAt,
                detail: entry.clockedOutAt ? `Out: ${entry.clockedOutAt}` : "Still clocked in"
              };
            }),
          emptyMessage: "No time clock entries available."
        }}
      />
    </section>
  );
}

function staffName(data: ReadyData, userId: string) {
  const staff = data.staff.find((member) => member.userId === userId);
  return staff ? `${staff.firstName} ${staff.lastName}`.trim() || staff.email : userId;
}

function roleName(data: ReadyData, roleId: string) {
  return data.roles.find((role) => role.id === roleId)?.name ?? roleId;
}

function locationName(data: ReadyData, locationId?: string) {
  if (!locationId) {
    return "No location";
  }
  return data.locations.find((location) => location.id === locationId)?.name ?? locationId;
}

function staffTimeEntryMinutes(entry: StaffTimeEntryRecord) {
  const start = new Date(entry.clockedInAt).getTime();
  const end = entry.clockedOutAt ? new Date(entry.clockedOutAt).getTime() : Date.now();
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? Math.round((end - start) / 60000) : 0;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
