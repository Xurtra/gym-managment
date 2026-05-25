import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { MemberStatus } from "@gym-platform/constants";
import { buildDashboardShellLayout, buildPageHeader } from "@gym-platform/dashboard";
import { EmptyState } from "@gym-platform/ui-react";
import {
  loadDashboardWorkspaceData,
  loadSession,
  type DashboardWorkspaceData,
  type PlanRecord
} from "./dashboardData.js";
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
    gymSlug: workspaceQuery.data.gym.slug,
    gymLogoUrl: workspaceQuery.data.gym.logoUrl,
    pageHeader: buildPageHeader({
      title: "Dashboard",
      eyebrow: "Overview",
      breadcrumbs: [{ label: "Dashboard", href: "/" }],
      description: `${workspaceQuery.data.members.length} consumers, ${workspaceQuery.data.classSessions.length} scheduled sessions.`
    })
  });

  return (
    <Shell model={shell}>
      <DashboardHomeContent data={workspaceQuery.data} />
    </Shell>
  );
}

function DashboardHomeContent({ data }: { data: DashboardWorkspaceData }) {
  const leadCount = data.members.filter(isLeadConsumerRecord).length;
  const activeCount = data.members.filter(isMemberConsumerRecord).length;
  const spotlight = data.members[0];
  const recentMembers = [...data.members]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 4);
  const planCards = data.plans.slice(0, 6);

  return (
    <div className="club-home-grid">
      <section className="club-panel club-customers">
        <div className="card-head">
          <div>
            <p className="eyebrow">Consumers</p>
            <h2>{data.gym.name}</h2>
          </div>
          <span className="club-kicker">
            {data.members.length} consumers · {activeCount} members · {leadCount} leads
          </span>
        </div>
        {spotlight ? (
          <article className="club-focus-card">
            <MemberPhoto className="club-focus-photo" member={spotlight} />
            <div className="club-focus-copy">
              <p className="eyebrow">Selected</p>
              <h3>{memberName(spotlight)}</h3>
              <p>{spotlight.status}</p>
              <div className="club-mini-nav">
                <Link className="ghost-button" to={`/dashboard/consumers/profile/${spotlight.id}`}>
                  Open Profile
                </Link>
                <Link className="ghost-button" to={`/dashboard/consumers/edit/${spotlight.id}`}>
                  Edit Consumer
                </Link>
              </div>
            </div>
          </article>
        ) : (
          <div className="empty-state"><p>Tap a customer from the check-in list to load their card here.</p></div>
        )}
        <div className="club-customer-grid">
          {recentMembers.length === 0 ? (
            <div className="empty-state"><p>No consumer cards available.</p></div>
          ) : (
            recentMembers.map((member) => (
              <Link
                key={member.id}
                className="club-customer-card"
                data-action="view-member"
                data-member-id={member.id}
                to={`/dashboard/consumers/profile/${member.id}`}
              >
                <MemberPhoto className="club-customer-avatar" member={member} />
                <strong>{memberName(member)}</strong>
                <span>{member.status}</span>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="club-panel club-promo">
        <div className="card-head">
          <div>
            <p className="eyebrow">Notice</p>
            <h2>New Promotion</h2>
          </div>
          <span className="club-kicker">Operations</span>
        </div>
        <p className="club-copy">
          Use the top navigation to jump between consumers, staff, POS, marketing, and reporting.
          Edit a consumer from the profile view and adjust barcodes or profile pictures at any time.
        </p>
        <div className="club-mini-nav">
          <Link className="ghost-button" to="/dashboard/consumers">Open Consumers</Link>
          <Link className="ghost-button" to="/dashboard/payments">Open POS</Link>
        </div>
      </section>

      <section className="club-panel club-events">
        <div className="card-head">
          <div>
            <p className="eyebrow">Upcoming Events</p>
            <h2>Member Actions</h2>
          </div>
        </div>
        <div className="club-events-list">
          {recentMembers.length === 0 ? (
            <div className="empty-state"><p>No customer activity yet.</p></div>
          ) : (
            recentMembers.map((member) => (
              <article className="club-event" key={member.id}>
                <MemberPhoto className="club-event-avatar" member={member} />
                <div>
                  <strong>{memberName(member)}</strong>
                  <p>{member.status}{member.barcode ? ` · ${member.barcode}` : ""}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="club-panel club-pos">
        <div className="card-head">
          <div>
            <p className="eyebrow">Point Of Sale</p>
            <h2>Membership Products</h2>
          </div>
        </div>
        <div className="club-product-grid">
          {planCards.length === 0 ? (
            <div className="empty-state"><p>No public plans yet.</p></div>
          ) : (
            planCards.map((plan) => (
              <article className="club-product" key={plan.id}>
                <div className="club-product-art" />
                <strong>{plan.name}</strong>
                <span>{formatCurrency(plan.priceCents)}</span>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="club-panel club-spotlight">
        <div className="card-head">
          <div>
            <p className="eyebrow">Spotlight Member</p>
            <h2>{spotlight ? memberName(spotlight) : "No customer selected"}</h2>
          </div>
          <Link className="ghost-button" to="/dashboard/consumers">View Consumers</Link>
        </div>
        {spotlight ? (
          <div className="spotlight-card">
            <MemberPhoto className="spotlight-photo" member={spotlight} />
            <div className="spotlight-copy">
              <p><strong>Status:</strong> {spotlight.status}</p>
              <p><strong>Barcode:</strong> {spotlight.barcode || "Not set"}</p>
              <p><strong>Contact:</strong> {spotlight.email || spotlight.phone || "No contact info"}</p>
            </div>
          </div>
        ) : (
          <div className="empty-state"><p>Create a customer to see the spotlight card.</p></div>
        )}
      </section>
    </div>
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
    gymSlug: workspaceQuery.data.gym.slug,
    gymLogoUrl: workspaceQuery.data.gym.logoUrl,
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

type HomeMember = DashboardWorkspaceData["members"][number];

function MemberPhoto({ className, member }: { className: string; member: HomeMember }) {
  return (
    <div className={className}>
      {member.profileImageUrl ? (
        <img src={member.profileImageUrl} alt={memberName(member)} />
      ) : (
        customerInitials(member)
      )}
    </div>
  );
}

function memberName(member: HomeMember) {
  return `${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id;
}

function customerInitials(member: HomeMember) {
  const letters = [member.firstName, member.lastName].map((value) => value.trim().charAt(0)).filter(Boolean);
  if (letters.length > 0) {
    return letters.join("").toUpperCase();
  }
  return (member.email?.charAt(0) ?? member.phone?.charAt(0) ?? "?").toUpperCase();
}

function isLeadConsumerRecord(member: HomeMember) {
  return Boolean(member.isLead) || member.status === MemberStatus.Lead;
}

function isMemberConsumerRecord(member: HomeMember) {
  const memberStatuses: MemberStatus[] = [
    MemberStatus.Active,
    MemberStatus.Trial,
    MemberStatus.PastDue,
    MemberStatus.Frozen
  ];
  return Boolean(member.isMember) || memberStatuses.includes(member.status);
}

function formatCurrency(priceCents: PlanRecord["priceCents"]) {
  const cents = typeof priceCents === "number" ? priceCents : Number(priceCents ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format((Number.isFinite(cents) ? cents : 0) / 100);
}
