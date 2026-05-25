import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { calendarEvent } from "@gym-platform/ui";
import {
  buildDashboardShellLayout,
  buildFacilityReservationCreateScreen,
  buildPageHeader,
  buildResourceRegistryScreen,
  type FacilityReservationView,
  type ReservationMemberView,
  type ResourceView
} from "@gym-platform/dashboard";
import { EmptyState, FormLayout, SelectField, Table, TextareaField } from "@gym-platform/ui-react";
import {
  createReservation,
  loadOperationsWorkspace,
  loadSession,
  type DashboardWorkspaceData,
  type FacilityReservationRecord,
  type ResourceRecord
} from "./dashboardData.js";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";
import { ScheduleCalendar } from "./components/ScheduleCalendar.js";

type Mode = "list" | "calendar" | "create" | "edit";

type ReadyData = DashboardWorkspaceData & {
  resources: ResourceRecord[];
  reservations: FacilityReservationRecord[];
};

export function ReservationsDomainRoute({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
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
    return <div className="react-bootstrap-state">Loading reservations...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <div className="empty-state" role="alert">
        <h3>Unable to load reservations</h3>
        <p>{describeError(workspaceQuery.error)}</p>
      </div>
    );
  }
  const data = workspaceQuery.data as ReadyData;

  const shell = buildDashboardShellLayout({
    path: "/reports",
    permissions: data.permissions,
    platformAdmin: data.platformAdmin,
    email: data.me.user.email,
    firstName: data.me.user.firstName,
    lastName: data.me.user.lastName,
    gymName: data.gym.name,
    pageHeader: buildPageHeader({
      title: mode === "calendar" ? "Reservation Calendar" : mode === "create" ? "Create Reservation" : mode === "edit" ? "Edit Reservation" : "Reservations",
      eyebrow: "Operations",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Reservations", href: "/reports" }
      ]
    })
  });

  return (
    <Shell model={shell}>
      {mode === "calendar" ? (
        <ReservationCalendarView data={data} />
      ) : mode === "create" || mode === "edit" ? (
        <ReservationFormView data={data} mode={mode} />
      ) : (
        <ReservationListView data={data} onCreate={() => navigate("/dashboard/reservations/new")} onCalendar={() => navigate("/dashboard/reservations/calendar")} />
      )}
    </Shell>
  );
}

function ReservationListView({
  data,
  onCreate,
  onCalendar
}: {
  data: ReadyData;
  onCreate: () => void;
  onCalendar: () => void;
}) {
  const registry = buildResourceRegistryScreen({
    resources: data.resources as unknown as ResourceView[],
    permissions: data.permissions
  });

  return (
    <section className="club-panel">
      <div className="card-head">
        <div>
          <p className="eyebrow">Reservations</p>
          <h2>Resource Registry</h2>
        </div>
        <div className="club-mini-nav">
          <button className="ghost-button" type="button" onClick={onCalendar}>Calendar view</button>
          <button className="save-button" type="button" onClick={onCreate}>{registry.createAction.label}</button>
        </div>
      </div>
      <div className="data-card">
        <Table model={registry.table} getRowKey={(row) => row.id} />
      </div>
      {registry.empty ? <EmptyState model={registry.empty} /> : null}
    </section>
  );
}

function ReservationCalendarView({ data }: { data: ReadyData }) {
  const events = useMemo(
    () =>
      data.reservations.map((reservation) => {
        const resourceName = data.resources.find((resource) => resource.id === reservation.resourceId)?.name ?? reservation.resourceId;
        const member = data.members.find((item) => item.id === reservation.memberId);
        const memberName = member ? `${member.firstName} ${member.lastName}`.trim() : reservation.memberId;
        return calendarEvent({
          id: reservation.id,
          title: resourceName,
          subtitle: memberName,
          startsAt: reservation.startsAt,
          endsAt: reservation.endsAt,
          status: reservation.status,
          href: `/dashboard/reservations/${reservation.id}/edit`
        });
      }),
    [data.members, data.reservations, data.resources]
  );

  return (
    <section className="club-panel">
      <ScheduleCalendar defaultView="week" events={events} />
    </section>
  );
}

function ReservationFormView({
  data,
  mode
}: {
  data: ReadyData;
  mode: "create" | "edit";
}) {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const reservation = data.reservations.find((item) => item.id === reservationId);
  const [error, setError] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const createReservationMutation = useMutation({
    mutationFn: (input: Parameters<typeof createReservation>[1]) => createReservation(data.gym.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operationsWorkspace })
  });

  const model = buildFacilityReservationCreateScreen({
    resources: data.resources as unknown as ResourceView[],
    members: data.members.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email
    })) as ReservationMemberView[],
    permissions: data.permissions,
    resourceId: reservation?.resourceId,
    memberId: reservation?.memberId,
    startsAt: reservation?.startsAt,
    endsAt: reservation?.endsAt,
    note: ""
  });

  return (
    <FormLayout
      model={{
        title: mode === "edit" ? "Edit reservation" : "Create reservation",
        description: mode === "edit" ? "Adjust reservation details and save changes." : "Create a new facility reservation."
      }}
    >
      {error ? <div className="banner error">{error}</div> : null}
      <form
        className="compact-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const resourceId = String(form.get("resourceId") ?? "");
          const memberId = String(form.get("memberId") ?? "");
          const startsAt = String(form.get("startsAt") ?? "");
          const endsAt = String(form.get("endsAt") ?? "");
          const note = optional(form.get("note"));
          setError(undefined);
          void (async () => {
            try {
              if (mode === "edit") {
                throw new Error("Edit flow is wired as a placeholder until reservation update API is available.");
              }
              await createReservationMutation.mutateAsync({
                resourceId,
                memberId,
                startsAt,
                endsAt,
                overrideConflict: false,
                ...(note ? { note } : {})
              });
              navigate("/dashboard/reservations");
            } catch (caught) {
              setError(describeError(caught));
            }
          })();
        }}
      >
        <SelectField
          model={{
            name: "resourceId",
            label: "Resource",
            required: true,
            options: model.resourceOptions.map((option) => ({
              value: option.value,
              label: option.label,
              selected: option.selected
            }))
          }}
          disabled={createReservationMutation.isPending}
        />
        <SelectField
          model={{
            name: "memberId",
            label: "Member",
            required: true,
            options: model.memberOptions.map((option) => ({
              value: option.value,
              label: option.label,
              selected: option.selected
            }))
          }}
          disabled={createReservationMutation.isPending}
        />
        <label className="field">
          <span>{model.fields.startsAt.label}</span>
          <input name="startsAt" type="datetime-local" defaultValue={model.fields.startsAt.value.slice(0, 16)} required disabled={createReservationMutation.isPending} />
        </label>
        <label className="field">
          <span>{model.fields.endsAt.label}</span>
          <input name="endsAt" type="datetime-local" defaultValue={model.fields.endsAt.value.slice(0, 16)} required disabled={createReservationMutation.isPending} />
        </label>
        <TextareaField model={{ name: "note", label: model.fields.note.label, value: model.fields.note.value, rows: 3 }} disabled={createReservationMutation.isPending} />
        <div className="customer-edit-footer">
          <button className="save-button" type="submit" disabled={!model.canSubmit || createReservationMutation.isPending}>
            {mode === "edit" ? "Save changes" : model.action.label}
          </button>
          <button className="ghost-button" type="button" onClick={() => navigate("/dashboard/reservations")}>Cancel</button>
        </div>
      </form>
    </FormLayout>
  );
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
