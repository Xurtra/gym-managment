import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
    path: "/settings",
    permissions: data.permissions,
    platformAdmin: data.platformAdmin,
    email: data.me.user.email,
    firstName: data.me.user.firstName,
    lastName: data.me.user.lastName,
    gymName: data.gym.name,
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

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
