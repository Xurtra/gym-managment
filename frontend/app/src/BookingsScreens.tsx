import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BookingStatus } from "@gym-platform/constants";
import {
  buildBookingCancelScreen,
  buildBookingDetailPage,
  buildBookingListPage,
  buildDashboardShellLayout,
  buildPageHeader,
  type BookingCancelScreen,
  type BookingDetailPage,
  type BookingListPage,
  type BookingListRow,
  type ClassBookingView
} from "@gym-platform/dashboard";
import { Badge, Button, Table } from "@gym-platform/ui-react";
import { badge } from "@gym-platform/ui";
import {
  cancelBooking,
  createDashboardClient,
  currentUserDisplayName,
  loadClassBookingsWorkspaceData,
  loadSession,
  toBookingMembers,
  toBookingSession,
  type DashboardWorkspaceData
} from "./dashboardData.js";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";

export function BookingsDomainRoute({ mode }: { mode: "list" | "detail" | "cancel" }) {
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
    return <div className="react-bootstrap-state">Loading bookings...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <ErrorState title="Unable to load bookings" message={describeError(workspaceQuery.error)} />;
  }

  return (
    <Shell model={buildShellModel(workspaceQuery.data.data, mode)} onLogout={() => logout(navigate)}>
      {mode === "detail" ? (
        <BookingDetailRoute data={workspaceQuery.data.data} bookingsBySession={workspaceQuery.data.bookingsBySession} />
      ) : mode === "cancel" ? (
        <BookingCancelRoute data={workspaceQuery.data.data} bookingsBySession={workspaceQuery.data.bookingsBySession} />
      ) : (
        <BookingListRoute data={workspaceQuery.data.data} bookingsBySession={workspaceQuery.data.bookingsBySession} />
      )}
    </Shell>
  );
}

function BookingListRoute({
  data,
  bookingsBySession
}: {
  data: DashboardWorkspaceData;
  bookingsBySession: Record<string, ClassBookingView[]>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFilter = searchParams.get("date") ?? "";
  const classFilter = searchParams.get("class") ?? "";
  const statusFilter = (searchParams.get("status") as BookingStatus | null) ?? undefined;
  const visibleSessions = useMemo(
    () =>
      dateFilter
        ? data.classSessions.filter((session) => session.startsAt.slice(0, 10) === dateFilter)
        : data.classSessions,
    [data.classSessions, dateFilter]
  );
  const selectedSession = visibleSessions.find((session) => session.id === classFilter) ?? visibleSessions[0];

  if (!selectedSession) {
    return <EmptyPanel title="No class sessions" body="Schedule a class before managing bookings." />;
  }

  const page = buildBookingListPage({
    session: toBookingSession(selectedSession, data),
    bookings: bookingsBySession[selectedSession.id] ?? [],
    members: toBookingMembers(data.members),
    permissions: data.permissions,
    filters: { status: statusFilter }
  });

  return (
    <BookingListScreen
      model={page}
      sessions={visibleSessions}
      data={data}
      selectedSessionId={selectedSession.id}
      dateFilter={dateFilter}
      statusFilter={statusFilter ?? ""}
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

function BookingListScreen({
  model,
  sessions,
  data,
  selectedSessionId,
  dateFilter,
  statusFilter,
  onFilterChange
}: {
  model: BookingListPage;
  sessions: DashboardWorkspaceData["classSessions"];
  data: DashboardWorkspaceData;
  selectedSessionId: string;
  dateFilter: string;
  statusFilter: string;
  onFilterChange: (next: Record<string, string>) => void;
}) {
  return (
    <section className="club-panel club-page">
      <div className="card-head">
        <div>
          <p className="eyebrow">Bookings</p>
          <h2>Class bookings</h2>
        </div>
        <span className="club-kicker">{model.summaryLabel}</span>
      </div>

      <div className="react-filter-bar">
        <label className="field">
          <span>Date</span>
          <input type="date" value={dateFilter} onChange={(event) => onFilterChange({ date: event.target.value })} />
        </label>
        <label className="field">
          <span>Class</span>
          <select value={selectedSessionId} onChange={(event) => onFilterChange({ class: event.target.value })}>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {toBookingSession(session, data).className} · {session.startsAt.slice(0, 10)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => onFilterChange({ status: event.target.value })}>
            <option value="">All statuses</option>
            {model.statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stat-grid compact">
        <article className="mini-card"><span>Total</span><strong>{model.summary.totalCount}</strong></article>
        <article className="mini-card"><span>Booked</span><strong>{model.summary.bookedCount}</strong></article>
        <article className="mini-card"><span>Waitlisted</span><strong>{model.summary.waitlistedCount}</strong></article>
        <article className="mini-card"><span>Cancelled</span><strong>{model.summary.cancelledCount}</strong></article>
      </div>

      <div className="data-card">
        <Table
          model={model.table}
          getRowKey={(row) => row.id}
          emptyMessage="No bookings to display."
          renderCell={(row, columnKey) => renderBookingListCell(row, columnKey)}
        />
      </div>
    </section>
  );
}

function BookingDetailRoute({
  data,
  bookingsBySession
}: {
  data: DashboardWorkspaceData;
  bookingsBySession: Record<string, ClassBookingView[]>;
}) {
  const { bookingId } = useParams();
  const resolved = findBooking(data, bookingsBySession, bookingId);
  if (!resolved) {
    return <EmptyPanel title="Booking not found" body="The selected booking could not be found." />;
  }
  const page = buildBookingDetailPage({
    session: toBookingSession(resolved.session, data),
    booking: resolved.booking,
    members: toBookingMembers(data.members),
    permissions: data.permissions
  });
  return <BookingDetailScreen model={page} />;
}

function BookingCancelRoute({
  data,
  bookingsBySession
}: {
  data: DashboardWorkspaceData;
  bookingsBySession: Record<string, ClassBookingView[]>;
}) {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingIdToCancel: string) => cancelBooking(data.gym.id, bookingIdToCancel),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.classBookingsWorkspace })
  });
  const resolved = findBooking(data, bookingsBySession, bookingId);
  if (!resolved) {
    return <EmptyPanel title="Booking not found" body="The selected booking could not be found." />;
  }
  const page = buildBookingCancelScreen({
    session: toBookingSession(resolved.session, data),
    booking: resolved.booking,
    members: toBookingMembers(data.members),
    permissions: data.permissions
  });

  async function handleCancel() {
    try {
      setError(undefined);
      await cancelBookingMutation.mutateAsync(resolved.booking.id);
      navigate(`/dashboard/classes/${resolved.session.id}`);
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  return <BookingCancelScreenView model={page} error={error} onCancel={handleCancel} />;
}

function BookingDetailScreen({ model }: { model: BookingDetailPage }) {
  return (
    <section className="club-panel profile-sheet">
      <div className="card-head">
        <div>
          <p className="eyebrow">Booking detail</p>
          <h2>{model.memberName}</h2>
        </div>
        <Badge model={badge({ label: model.statusLabel, tone: model.statusLabel === "Cancelled" ? "danger" : "success" })} />
      </div>
      <div className="profile-grid">
        {model.sections.map((section) => (
          <article className="data-card" key={section.key}>
            <h3>{section.title}</h3>
            <DetailList details={section.details} />
          </article>
        ))}
      </div>
      <div className="club-mini-nav">
        {model.actions.map((action) => (
          <Link className="ghost-button" key={action.key} to={toDashboardRoute(action.href)}>
            {action.button.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function BookingCancelScreenView({
  model,
  error,
  onCancel
}: {
  model: BookingCancelScreen;
  error?: string;
  onCancel: () => Promise<void>;
}) {
  return (
    <section className="club-panel profile-sheet">
      <div className="card-head">
        <div>
          <p className="eyebrow">Cancel booking</p>
          <h2>{model.memberName}</h2>
        </div>
        <span className="club-kicker">{model.summaryLabel}</span>
      </div>
      {model.blockedReason ? <p className="form-error">{model.blockedReason}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <p className="club-copy">{model.confirmation.body}</p>
      <div className="club-mini-nav">
        <Button model={model.cancelAction} onClick={() => void onCancel()} />
        <Link className="ghost-button" to={`/dashboard/classes/${model.session.id}`}>
          {model.keepAction.label}
        </Link>
      </div>
    </section>
  );
}

function renderBookingListCell(row: BookingListRow, columnKey: keyof BookingListRow & string) {
  if (columnKey === "memberName") {
    return <Link to={`/dashboard/bookings/${row.id}`}>{row.memberName}</Link>;
  }
  if (columnKey === "statusLabel") {
    return <Badge model={badge({ label: row.statusLabel, tone: row.status === BookingStatus.Cancelled ? "danger" : "success" })} />;
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

function findBooking(
  data: DashboardWorkspaceData,
  bookingsBySession: Record<string, ClassBookingView[]>,
  bookingId?: string
) {
  if (!bookingId) {
    return undefined;
  }
  for (const session of data.classSessions) {
    const booking = bookingsBySession[session.id]?.find((candidate) => candidate.id === bookingId);
    if (booking) {
      return { session, booking };
    }
  }
  return undefined;
}

function buildShellModel(data: DashboardWorkspaceData, mode: "list" | "detail" | "cancel") {
  const title = mode === "list" ? "Bookings" : mode === "cancel" ? "Cancel booking" : "Booking detail";
  return buildDashboardShellLayout({
    path: "/bookings",
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
        { label: "Bookings", href: "/bookings" },
        { label: title, href: "/bookings" }
      ],
      description: `${currentUserDisplayName(data.me)} is working in ${data.gym.name}.`
    })
  });
}

function toDashboardRoute(href: string) {
  if (href.startsWith("/dashboard")) {
    return href;
  }
  if (href.startsWith("/members/")) {
    return `/dashboard/consumers/profile/${href.split("/")[2]}`;
  }
  if (href.startsWith("/classes/")) {
    const parts = href.split("/").filter(Boolean);
    return parts[2] === "bookings" ? `/dashboard/classes/${parts[1]}` : `/dashboard/classes/${parts[1] ?? ""}`;
  }
  return `/dashboard${href}`;
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
