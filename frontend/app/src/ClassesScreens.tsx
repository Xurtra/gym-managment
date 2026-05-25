import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ClassSessionStatus } from "@gym-platform/constants";
import {
  buildBookingListPage,
  buildClassSessionCreateScreen,
  buildClassSessionDetailPage,
  buildClassSessionListPage,
  buildDashboardShellLayout,
  buildPageHeader,
  createClassSessionSubmission,
  type BookingListRow,
  type ClassBookingView,
  type ClassSessionCreateScreen,
  type ClassSessionDetailPage,
  type ClassSessionListPage,
  type ClassSessionListRow
} from "@gym-platform/dashboard";
import { badge } from "@gym-platform/ui";
import { Badge, Button, Table } from "@gym-platform/ui-react";
import {
  createClassSession,
  createDashboardClient,
  currentUserDisplayName,
  loadClassBookingsWorkspaceData,
  loadSession,
  toBookingMembers,
  toBookingSession,
  type DashboardWorkspaceData
} from "./dashboardData.js";
import { ScheduleCalendar } from "./components/ScheduleCalendar.js";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";

export function ClassesDomainRoute({ mode }: { mode: "list" | "detail" }) {
  const navigate = useNavigate();
  const session = loadSession();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.classBookingsWorkspace,
    queryFn: () => loadClassBookingsWorkspaceData(),
    enabled: Boolean(session)
  });

  if (!session) {
    return <Navigate to="/dashboard/home" replace />;
  }
  if (workspaceQuery.isLoading) {
    return <div className="react-bootstrap-state">Loading classes...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <ErrorState title="Unable to load classes" message={describeError(workspaceQuery.error)} />;
  }

  return (
    <Shell model={buildShellModel(workspaceQuery.data.data, mode)} onLogout={() => logout(navigate)}>
      {mode === "detail" ? (
        <ClassDetailRoute data={workspaceQuery.data.data} bookingsBySession={workspaceQuery.data.bookingsBySession} />
      ) : (
        <ClassListRoute data={workspaceQuery.data.data} />
      )}
    </Shell>
  );
}

function ClassListRoute({ data }: { data: DashboardWorkspaceData }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [slot, setSlot] = useState<{ startsAt: string; endsAt: string } | undefined>();
  const [error, setError] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const createClassSessionMutation = useMutation({
    mutationFn: (input: ClassCreateFormInput) =>
      createClassSession(data.gym.id, createClassSessionSubmission(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.classBookingsWorkspace })
  });
  const page = useMemo(
    () =>
      buildClassSessionListPage({
        sessions: data.classSessions,
        classTypes: data.classTypes,
        locations: data.locations,
        trainers: data.trainers,
        permissions: data.permissions,
        filters: {
          query: searchParams.get("query") ?? undefined,
          locationId: searchParams.get("location") ?? undefined,
          status: (searchParams.get("status") as ClassSessionStatus | null) ?? undefined
        }
      }),
    [data, searchParams]
  );

  async function handleCreate(input: ClassCreateFormInput) {
    try {
      setError(undefined);
      await createClassSessionMutation.mutateAsync(input);
      setSlot(undefined);
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  return (
    <ClassListScreen
      model={page}
      data={data}
      slot={slot}
      error={error}
      onSelectSlot={setSlot}
      onSelectEvent={(event) => navigate(event.href ? toDashboardRoute(event.href) : `/dashboard/classes/${event.id}`)}
      onCloseCreate={() => setSlot(undefined)}
      onCreate={handleCreate}
      onFilterChange={(next) => {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(next)) {
          if (value) {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        }
        setSearchParams(params);
      }}
    />
  );
}

interface ClassCreateFormInput {
  classTypeId: string;
  locationId: string;
  trainerUserId?: string;
  roomName?: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  waitlistCapacity?: string;
  cancellationCutoffMinutes?: string;
  lateCancellationFeeCents?: string;
}

function ClassListScreen({
  model,
  data,
  slot,
  error,
  onSelectSlot,
  onSelectEvent,
  onCloseCreate,
  onCreate,
  onFilterChange
}: {
  model: ClassSessionListPage;
  data: DashboardWorkspaceData;
  slot?: { startsAt: string; endsAt: string };
  error?: string;
  onSelectSlot: (slot: { startsAt: string; endsAt: string }) => void;
  onSelectEvent: (event: ClassSessionListPage["calendarEvents"][number]) => void;
  onCloseCreate: () => void;
  onCreate: (input: ClassCreateFormInput) => Promise<void>;
  onFilterChange: (next: Record<string, string>) => void;
}) {
  return (
    <section className="club-panel club-page">
      <div className="card-head">
        <div>
          <p className="eyebrow">Classes</p>
          <h2>Class schedule</h2>
        </div>
        <span className="club-kicker">{model.summaryLabel}</span>
      </div>

      <div className="react-filter-bar">
        <label className="field">
          <span>Search</span>
          <input value={model.filters.query} onChange={(event) => onFilterChange({ query: event.target.value })} />
        </label>
        <label className="field">
          <span>Location</span>
          <select value={model.filters.locationId ?? ""} onChange={(event) => onFilterChange({ location: event.target.value })}>
            <option value="">All locations</option>
            {model.locationOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select value={model.filters.status ?? ""} onChange={(event) => onFilterChange({ status: event.target.value })}>
            <option value="">All statuses</option>
            {model.statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <ScheduleCalendar
        events={model.calendarEvents}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
      />

      <div className="data-card">
        <Table
          model={model.table}
          getRowKey={(row) => row.id}
          emptyMessage="No classes to display."
          renderCell={(row, columnKey) => renderClassListCell(row, columnKey)}
        />
      </div>

      {slot ? (
        <ClassCreatePanel data={data} slot={slot} error={error} onClose={onCloseCreate} onCreate={onCreate} />
      ) : null}
    </section>
  );
}

function ClassCreatePanel({
  data,
  slot,
  error,
  onClose,
  onCreate
}: {
  data: DashboardWorkspaceData;
  slot: { startsAt: string; endsAt: string };
  error?: string;
  onClose: () => void;
  onCreate: (input: ClassCreateFormInput) => Promise<void>;
}) {
  const model = buildClassSessionCreateScreen({
    classTypes: data.classTypes,
    locations: data.locations,
    trainers: data.trainers,
    permissions: data.permissions,
    classTypeId: data.classTypes[0]?.id,
    locationId: data.locations[0]?.id,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    capacity: "12",
    waitlistCapacity: "3"
  });

  return (
    <div className="modal-backdrop">
      <form
        className="form-card react-modal-card"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void onCreate({
            classTypeId: String(form.get("classTypeId") ?? ""),
            locationId: String(form.get("locationId") ?? ""),
            trainerUserId: optionalString(form.get("trainerUserId")),
            roomName: optionalString(form.get("roomName")),
            startsAt: String(form.get("startsAt") ?? ""),
            endsAt: String(form.get("endsAt") ?? ""),
            capacity: String(form.get("capacity") ?? ""),
            waitlistCapacity: optionalString(form.get("waitlistCapacity")),
            cancellationCutoffMinutes: optionalString(form.get("cancellationCutoffMinutes")),
            lateCancellationFeeCents: optionalString(form.get("lateCancellationFeeCents"))
          });
        }}
      >
        <div className="card-head">
          <div>
            <p className="eyebrow">New class</p>
            <h3>Schedule class</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
        </div>
        <ClassCreateFields model={model} />
        {error ? <p className="form-error">{error}</p> : null}
        <Button model={model.action} type="submit" />
      </form>
    </div>
  );
}

function ClassCreateFields({ model }: { model: ClassSessionCreateScreen }) {
  return (
    <>
      <label className="field">
        <span>Class</span>
        <select name="classTypeId" defaultValue={model.selectedClassTypeId}>
          {model.classTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Location</span>
        <select name="locationId" defaultValue={model.selectedLocationId}>
          {model.locationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Trainer</span>
        <select name="trainerUserId" defaultValue={model.selectedTrainerUserId ?? ""}>
          <option value="">Unassigned</option>
          {model.trainerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <InputField model={model.fields.roomName} />
      <InputField model={model.fields.startsAt} />
      <InputField model={model.fields.endsAt} />
      <InputField model={model.fields.capacity} />
      <InputField model={model.fields.waitlistCapacity} />
    </>
  );
}

function ClassDetailRoute({
  data,
  bookingsBySession
}: {
  data: DashboardWorkspaceData;
  bookingsBySession: Record<string, ClassBookingView[]>;
}) {
  const { sessionId } = useParams();
  const session = data.classSessions.find((candidate) => candidate.id === sessionId);
  if (!session) {
    return <EmptyPanel title="Class not found" body="The selected class session could not be found." />;
  }
  const detail = buildClassSessionDetailPage({
    session,
    classTypes: data.classTypes,
    locations: data.locations,
    trainers: data.trainers,
    permissions: data.permissions
  });
  const bookingList = buildBookingListPage({
    session: toBookingSession(session, data),
    bookings: bookingsBySession[session.id] ?? [],
    members: toBookingMembers(data.members),
    permissions: data.permissions
  });
  return <ClassDetailScreen model={detail} bookings={bookingList} />;
}

function ClassDetailScreen({
  model,
  bookings
}: {
  model: ClassSessionDetailPage;
  bookings: ReturnType<typeof buildBookingListPage>;
}) {
  return (
    <section className="club-panel profile-sheet">
      <div className="card-head">
        <div>
          <p className="eyebrow">Class detail</p>
          <h2>{model.className}</h2>
        </div>
        <Badge model={badge({ label: model.statusLabel, tone: model.statusLabel === "Cancelled" ? "danger" : "success" })} />
      </div>
      <div className="stat-grid compact">
        <article className="mini-card"><span>Booked</span><strong>{bookings.summary.bookedCount}</strong></article>
        <article className="mini-card"><span>Waitlist</span><strong>{bookings.summary.waitlistedCount}</strong></article>
        <article className="mini-card"><span>Capacity</span><strong>{model.session.capacity}</strong></article>
      </div>
      <div className="profile-grid">
        {model.sections.map((section) => (
          <article className="data-card" key={section.key}>
            <h3>{section.title}</h3>
            <DetailList details={section.details} />
          </article>
        ))}
      </div>
      <div className="data-card">
        <h3>Bookings</h3>
        <Table
          model={bookings.table}
          getRowKey={(row) => row.id}
          emptyMessage="No bookings for this class."
          renderCell={(row, columnKey) => renderBookingCell(row, columnKey)}
        />
      </div>
    </section>
  );
}

function renderClassListCell(row: ClassSessionListRow, columnKey: keyof ClassSessionListRow & string) {
  if (columnKey === "className") {
    return <Link to={`/dashboard/classes/${row.id}`}>{row.className}</Link>;
  }
  if (columnKey === "visibilityLabel") {
    return <Badge model={badge({ label: row.visibilityLabel, tone: row.visibilityLabel === "Public" ? "info" : "neutral" })} />;
  }
  return String(row[columnKey] ?? "-");
}

function renderBookingCell(row: BookingListRow, columnKey: keyof BookingListRow & string) {
  if (columnKey === "memberName") {
    return <Link to={`/dashboard/bookings/${row.id}`}>{row.memberName}</Link>;
  }
  if (columnKey === "statusLabel") {
    return <Badge model={badge({ label: row.statusLabel, tone: row.statusLabel === "Cancelled" ? "danger" : "success" })} />;
  }
  return String(row[columnKey] ?? "-");
}

function DetailList({ details }: { details: Array<{ key: string; label: string; value: string }> }) {
  return (
    <dl className="react-detail-list">
      {details.map((detail) => (
        <div key={detail.key}>
          <dt>{detail.label}</dt>
          <dd>{detail.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function InputField({ model }: { model: { name: string; label: string; value: string; type: string; error?: string } }) {
  return (
    <label className="field">
      <span>{model.label}</span>
      <input name={model.name} type={model.type} defaultValue={model.value} />
      {model.error ? <small className="form-error">{model.error}</small> : null}
    </label>
  );
}

function buildShellModel(data: DashboardWorkspaceData, mode: "list" | "detail") {
  const title = mode === "list" ? "Class schedule" : "Class detail";
  return buildDashboardShellLayout({
    path: "/classes",
    permissions: data.permissions,
    platformAdmin: data.platformAdmin,
    email: data.me.user.email,
    firstName: data.me.user.firstName,
    lastName: data.me.user.lastName,
    gymName: data.gym.name,
    pageHeader: buildPageHeader({
      title,
      eyebrow: "Classes",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Classes", href: "/classes" },
        { label: title, href: "/classes" }
      ],
      description: `${currentUserDisplayName(data.me)} is working in ${data.gym.name}.`
    })
  });
}

function toDashboardRoute(href: string) {
  return href.startsWith("/dashboard") ? href : `/dashboard${href}`;
}

function optionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function logout(navigate: ReturnType<typeof useNavigate>) {
  const client = createDashboardClient();
  const refreshToken = loadSession()?.refreshToken;
  localStorage.removeItem("gym-platform-session");
  if (refreshToken) {
    void client.logout(refreshToken).catch(() => undefined);
  }
  navigate("/dashboard/home");
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-state" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
