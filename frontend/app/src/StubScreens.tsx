import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { buildDashboardShellLayout, buildPageHeader } from "@gym-platform/dashboard";
import { EmptyState } from "@gym-platform/ui-react";
import { loadDashboardWorkspaceData, loadSession, type DashboardWorkspaceData } from "./dashboardData.js";
import { Shell } from "./Shell.js";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardWorkspaceData }
  | { status: "failed"; message: string };

export function DashboardHomeRoute() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    setState({ status: "loading" });
    loadDashboardWorkspaceData()
      .then((data) => setState({ status: "ready", data }))
      .catch((error) => setState({ status: "failed", message: describeError(error) }));
  }, []);

  if (!loadSession()) {
    return <Navigate to="/dashboard/login" replace />;
  }
  if (state.status === "loading") {
    return <div className="react-bootstrap-state">Loading dashboard...</div>;
  }
  if (state.status === "failed") {
    return <div className="empty-state"><h3>Dashboard unavailable</h3><p>{state.message}</p></div>;
  }

  const shell = buildDashboardShellLayout({
    path: "/",
    permissions: state.data.permissions,
    platformAdmin: state.data.platformAdmin,
    email: state.data.me.user.email,
    firstName: state.data.me.user.firstName,
    lastName: state.data.me.user.lastName,
    gymName: state.data.gym.name,
    pageHeader: buildPageHeader({
      title: "Dashboard",
      eyebrow: "Overview",
      breadcrumbs: [{ label: "Dashboard", href: "/" }],
      description: `${state.data.members.length} consumers, ${state.data.classSessions.length} scheduled sessions.`
    })
  });

  return (
    <Shell model={shell}>
      <section className="club-panel">
        <div className="stat-grid compact">
          <article className="mini-card"><span>Consumers</span><strong>{state.data.members.length}</strong></article>
          <article className="mini-card"><span>Classes</span><strong>{state.data.classSessions.length}</strong></article>
          <article className="mini-card"><span>Locations</span><strong>{state.data.locations.length}</strong></article>
        </div>
      </section>
    </Shell>
  );
}

export function ShellPlaceholderRoute({
  path,
  title,
  body,
  emptyTitle
}: {
  path: string;
  title: string;
  body: string;
  emptyTitle?: string;
}) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    setState({ status: "loading" });
    loadDashboardWorkspaceData()
      .then((data) => setState({ status: "ready", data }))
      .catch((error) => setState({ status: "failed", message: describeError(error) }));
  }, []);

  if (!loadSession()) {
    return <Navigate to="/dashboard/login" replace />;
  }
  if (state.status === "loading") {
    return <div className="react-bootstrap-state">Loading {title.toLowerCase()}...</div>;
  }
  if (state.status === "failed") {
    return <div className="empty-state"><h3>{title} unavailable</h3><p>{state.message}</p></div>;
  }

  const shell = buildDashboardShellLayout({
    path,
    permissions: state.data.permissions,
    platformAdmin: state.data.platformAdmin,
    email: state.data.me.user.email,
    firstName: state.data.me.user.firstName,
    lastName: state.data.me.user.lastName,
    gymName: state.data.gym.name,
    pageHeader: buildPageHeader({
      title,
      eyebrow: "Dashboard",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: title, href: path }
      ]
    })
  });

  return (
    <Shell model={shell}>
      <section className="club-panel">
        <EmptyState model={{ kind: "empty", title: emptyTitle ?? title, body }} />
      </section>
    </Shell>
  );
}

export function NotFound() {
  return (
    <section className="club-panel">
      <EmptyState
        model={{
          kind: "empty",
          title: "Page not found",
          body: "The requested route is not available."
        }}
      />
    </section>
  );
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
