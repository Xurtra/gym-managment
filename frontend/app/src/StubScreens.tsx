import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { buildDashboardShellLayout, buildPageHeader } from "@gym-platform/dashboard";
import { EmptyState } from "@gym-platform/ui-react";
import { loadDashboardWorkspaceData, loadSession, type DashboardWorkspaceData } from "./dashboardData.js";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";

export function DashboardHomeRoute() {
  const session = loadSession();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.dashboardWorkspace,
    queryFn: () => loadDashboardWorkspaceData(),
    enabled: Boolean(session)
  });

  if (!session) {
    return <Navigate to="/dashboard/login" replace />;
  }
  if (workspaceQuery.isLoading) {
    return <div className="react-bootstrap-state">Loading dashboard...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <div className="empty-state"><h3>Dashboard unavailable</h3><p>{describeError(workspaceQuery.error)}</p></div>;
  }

  const shell = buildDashboardShellLayout({
    path: "/",
    permissions: workspaceQuery.data.permissions,
    platformAdmin: workspaceQuery.data.platformAdmin,
    email: workspaceQuery.data.me.user.email,
    firstName: workspaceQuery.data.me.user.firstName,
    lastName: workspaceQuery.data.me.user.lastName,
    gymName: workspaceQuery.data.gym.name,
    pageHeader: buildPageHeader({
      title: "Dashboard",
      eyebrow: "Overview",
      breadcrumbs: [{ label: "Dashboard", href: "/" }],
      description: `${workspaceQuery.data.members.length} consumers, ${workspaceQuery.data.classSessions.length} scheduled sessions.`
    })
  });

  return (
    <Shell model={shell}>
      <section className="club-panel">
        <div className="stat-grid compact">
          <article className="mini-card"><span>Consumers</span><strong>{workspaceQuery.data.members.length}</strong></article>
          <article className="mini-card"><span>Classes</span><strong>{workspaceQuery.data.classSessions.length}</strong></article>
          <article className="mini-card"><span>Locations</span><strong>{workspaceQuery.data.locations.length}</strong></article>
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
  const session = loadSession();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.dashboardWorkspace,
    queryFn: () => loadDashboardWorkspaceData(),
    enabled: Boolean(session)
  });

  if (!session) {
    return <Navigate to="/dashboard/login" replace />;
  }
  if (workspaceQuery.isLoading) {
    return <div className="react-bootstrap-state">Loading {title.toLowerCase()}...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <div className="empty-state"><h3>{title} unavailable</h3><p>{describeError(workspaceQuery.error)}</p></div>;
  }

  const shell = buildDashboardShellLayout({
    path,
    permissions: workspaceQuery.data.permissions,
    platformAdmin: workspaceQuery.data.platformAdmin,
    email: workspaceQuery.data.me.user.email,
    firstName: workspaceQuery.data.me.user.firstName,
    lastName: workspaceQuery.data.me.user.lastName,
    gymName: workspaceQuery.data.gym.name,
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
