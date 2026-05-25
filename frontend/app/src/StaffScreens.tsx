import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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
import { FormLayout, LogList, SelectField, Table } from "@gym-platform/ui-react";
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

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: ReadyData }
  | { status: "failed"; message: string };

export function StaffDomainRoute({ mode }: { mode: Mode }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const reload = async () => {
    setState({ status: "loading" });
    try {
      const loaded = await loadOperationsWorkspace();
      setState({ status: "ready", data: loaded as ReadyData });
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
    return <div className="react-bootstrap-state">Loading staff...</div>;
  }
  if (state.status === "failed") {
    return (
      <div className="empty-state" role="alert">
        <h3>Unable to load staff</h3>
        <p>{state.message}</p>
      </div>
    );
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
        { label: "Staff", href: "/settings" }
      ]
    })
  });

  return (
    <Shell model={shell}>
      {mode === "invites" ? (
        <StaffInviteViewScreen data={state.data} onSaved={reload} />
      ) : mode === "shifts" ? (
        <StaffShiftScheduleScreen data={state.data} />
      ) : mode === "time-clock" ? (
        <StaffTimeClockScreen data={state.data} />
      ) : (
        <StaffDirectoryScreen data={state.data} />
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

  return (
    <section className="club-panel">
      <div className="card-head">
        <h2>Team members</h2>
        <span>{page.summary.visibleCount} visible</span>
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
    </section>
  );
}

function StaffInviteViewScreen({ data, onSaved }: { data: ReadyData; onSaved: () => Promise<void> }) {
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

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
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setPending(true);
          setError(undefined);
          void (async () => {
            try {
              await createStaffInvite(data.gym.id, {
                email: String(form.get("email") ?? ""),
                roleId: String(form.get("roleId") ?? ""),
                message: optional(form.get("message"))
              });
              await onSaved();
            } catch (caught) {
              setError(describeError(caught));
            } finally {
              setPending(false);
            }
          })();
        }}
      >
        <label className="field">
          <span>{screen.emailField.label}</span>
          <input name={screen.emailField.name} type="email" required disabled={pending} />
        </label>
        <SelectField
          model={{
            name: "roleId",
            label: "Role",
            required: true,
            options: screen.roleOptions.map((option) => ({
              value: option.id,
              label: option.label,
              selected: option.selected,
              disabled: option.disabled
            }))
          }}
          disabled={pending}
        />
        <label className="field">
          <span>{screen.messageField.label}</span>
          <textarea name={screen.messageField.name} rows={3} disabled={pending} />
        </label>
        <button className="save-button" type="submit" disabled={!screen.canSubmit || pending}>
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

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
