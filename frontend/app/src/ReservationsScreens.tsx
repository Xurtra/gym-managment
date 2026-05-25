import { useEffect, useMemo, useState } from "react";
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
import { Shell } from "./Shell.js";
import { ScheduleCalendar } from "./components/ScheduleCalendar.js";

type Mode = "list" | "calendar" | "create" | "edit";

type ReadyData = DashboardWorkspaceData & {
  resources: ResourceRecord[];
  reservations: FacilityReservationRecord[];
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: ReadyData }
  | { status: "failed"; message: string };

export function ReservationsDomainRoute({ mode }: { mode: Mode }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const navigate = useNavigate();

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
    return <div className="react-bootstrap-state">Loading reservations...</div>;
  }
  if (state.status === "failed") {
    return (
      <div className="empty-state" role="alert">
        <h3>Unable to load reservations</h3>
        <p>{state.message}</p>
      </div>
    );
  }

  const shell = buildDashboardShellLayout({
    path: "/reports",
    permissions: state.data.permissions,
    platformAdmin: state.data.platformAdmin,
    email: state.data.me.user.email,
    firstName: state.data.me.user.firstName,
    lastName: state.data.me.user.lastName,
    gymName: state.data.gym.name,
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
        <ReservationCalendarView data={state.data} />
      ) : mode === "create" || mode === "edit" ? (
        <ReservationFormView data={state.data} mode={mode} onSaved={reload} />
      ) : (
        <ReservationListView data={state.data} onCreate={() => navigate("/dashboard/reservations/new")} onCalendar={() => navigate("/dashboard/reservations/calendar")} />
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
  mode,
  onSaved
}: {
  data: ReadyData;
  mode: "create" | "edit";
  onSaved: () => Promise<void>;
}) {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const reservation = data.reservations.find((item) => item.id === reservationId);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

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
          setPending(true);
          setError(undefined);
          void (async () => {
            try {
              if (mode === "edit") {
                throw new Error("Edit flow is wired as a placeholder until reservation update API is available.");
              }
              await createReservation(data.gym.id, {
                resourceId,
                memberId,
                startsAt,
                endsAt,
                overrideConflict: false,
                ...(note ? { note } : {})
              });
              await onSaved();
              navigate("/dashboard/reservations");
            } catch (caught) {
              setError(describeError(caught));
            } finally {
              setPending(false);
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
          disabled={pending}
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
          disabled={pending}
        />
        <label className="field">
          <span>{model.fields.startsAt.label}</span>
          <input name="startsAt" type="datetime-local" defaultValue={model.fields.startsAt.value.slice(0, 16)} required disabled={pending} />
        </label>
        <label className="field">
          <span>{model.fields.endsAt.label}</span>
          <input name="endsAt" type="datetime-local" defaultValue={model.fields.endsAt.value.slice(0, 16)} required disabled={pending} />
        </label>
        <TextareaField model={{ name: "note", label: model.fields.note.label, value: model.fields.note.value, rows: 3 }} disabled={pending} />
        <div className="customer-edit-footer">
          <button className="save-button" type="submit" disabled={!model.canSubmit || pending}>
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
