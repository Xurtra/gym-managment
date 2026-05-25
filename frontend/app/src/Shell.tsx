import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { DashboardShellLayout, PageHeaderModel } from "@gym-platform/dashboard";

export interface ShellProps {
  model: DashboardShellLayout;
  children: ReactNode;
  onLogout?: () => void;
}

export function Shell({ model, children, onLogout }: ShellProps) {
  return (
    <div className="club-shell react-shell">
      <header className="club-topbar">
        <div className="club-brand">
          <div className="club-mark">
            <span>{(model.topBar.gymName ?? "GP").slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="club-brand-copy">
            <strong>{model.topBar.gymName ?? "Gym Platform"}</strong>
            <span>{model.topBar.title}</span>
          </div>
        </div>
        <div className="club-topbar-actions">
          <div className="club-user">
            <div className="club-avatar">{initials(model.topBar.accountMenu.userName)}</div>
            <div className="club-user-copy">
              <strong>{model.topBar.accountMenu.userName}</strong>
              <span>{model.topBar.accountMenu.userEmail}</span>
            </div>
          </div>
          {model.topBar.accountMenu.items.map((item) =>
            item.action === "logout" ? (
              <button
                key={item.key}
                className="topbar-logout-button"
                type="button"
                disabled={item.disabled}
                onClick={onLogout}
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.key}
                className={`icon-pill${item.disabled ? " disabled" : ""}`}
                to={toDashboardRoute(item.href ?? "/")}
                aria-disabled={item.disabled}
              >
                {item.label.slice(0, 1)}
              </Link>
            )
          )}
        </div>
      </header>

      <div className="react-shell-body">
        <aside className="react-sidebar" aria-label="Dashboard navigation">
          {model.sidebar.groups.map((group) => (
            <section className="react-sidebar-group" key={group.key}>
              <h2>{group.label}</h2>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  className={`club-tab${item.active ? " active" : ""}`}
                  data-dashboard-view={dashboardViewKey(item.href)}
                  to={toDashboardRoute(item.href)}
                  aria-current={item.active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </section>
          ))}
        </aside>

        <div className="react-shell-content">
          <PageHeader model={model.content.pageHeader} />
          <main className="club-main">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ model }: { model: PageHeaderModel }) {
  return (
    <header className="react-page-header">
      {model.breadcrumbCount > 0 ? (
        <nav className="react-breadcrumbs" aria-label="Breadcrumbs">
          {model.breadcrumbs.map((breadcrumb) => (
            <Link
              key={breadcrumb.href}
              to={toDashboardRoute(breadcrumb.href)}
              aria-current={breadcrumb.current ? "page" : undefined}
            >
              {breadcrumb.label}
            </Link>
          ))}
        </nav>
      ) : null}
      <div className="section-head">
        <div>
          {model.eyebrow ? <p className="eyebrow">{model.eyebrow}</p> : null}
          <h1>{model.title}</h1>
          {model.description ? <p className="lede">{model.description}</p> : null}
        </div>
      </div>
    </header>
  );
}

function toDashboardRoute(href: string) {
  if (href.startsWith("/dashboard")) {
    return href;
  }
  if (href === "/") {
    return "/dashboard/home";
  }
  return `/dashboard${href}`;
}

function dashboardViewKey(href: string) {
  if (href === "/check-ins") {
    return "check_in";
  }
  if (href === "/settings") {
    return "plans";
  }
  return href.replace(/^\//, "").replaceAll("-", "_") || "home";
}

function initials(name: string) {
  const letters = name.split(/\s+/).map((part) => part.charAt(0)).filter(Boolean);
  return letters.slice(0, 2).join("").toUpperCase() || "U";
}
