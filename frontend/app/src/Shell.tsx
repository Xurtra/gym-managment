import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { DashboardShellLayout } from "@gym-platform/dashboard";
import { useTheme } from "./theme.js";

export interface ShellProps {
  model: DashboardShellLayout;
  children: ReactNode;
  onLogout?: () => void;
}

export function Shell({ model, children, onLogout }: ShellProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const tabs = model.sidebar.groups.flatMap((group) => group.items).filter((item) => item.href !== "/check-ins");
  const checkInTab = model.sidebar.groups
    .flatMap((group) => group.items)
    .find((item) => item.href === "/check-ins");

  return (
    <div className="club-shell">
      <header className="club-topbar">
        <div className="club-brand">
          <div className="club-mark">
            {model.topBar.gymLogoUrl ? (
              <img src={model.topBar.gymLogoUrl} alt={`${model.topBar.gymName ?? "Gym"} logo`} />
            ) : (
              <span>{(model.topBar.gymName ?? "GP").slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="club-brand-copy">
            <strong>{model.topBar.gymName ?? "Gym Platform"}</strong>
            <span>{model.topBar.gymSlug ?? model.topBar.title}</span>
          </div>
        </div>
        <div className="club-topbar-actions">
          <button className="theme-pill" type="button" onClick={toggleTheme}>
            {theme === "dark" ? "Dark mode" : "Light mode"}
          </button>
          <button type="button" className="icon-pill" aria-label="Notifications">
            N
          </button>
          <button
            type="button"
            className="icon-pill"
            aria-label="Settings"
            data-dashboard-view="settings"
            onClick={() => navigate("/dashboard/settings")}
          >
            S
          </button>
          <button type="button" className="icon-pill" aria-label="Help">
            ?
          </button>
          <button type="button" className="topbar-clock-button" aria-label="Open employee time clock">
            <span className="topbar-clock-icon" aria-hidden="true" />
            <span className="topbar-clock-copy">
              <strong>Time clock</strong>
              <small>Employee sign in</small>
            </span>
          </button>
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
                Log out
              </button>
            ) : (
              null
            )
          )}
        </div>
      </header>

      <div className="club-tabs-shell">
        <nav className="club-tabs">
          <div className="club-tabs-primary">
            {tabs.map((item) => (
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
          </div>
        </nav>
        <div className="club-tabs-drawer-handle">
          <Link
            className={`club-tab club-tab-drawer-trigger${checkInTab?.active ? " active" : ""}`}
            data-dashboard-view="check_in"
            data-check-in-rail-toggle="true"
            to="/dashboard/check-ins"
            aria-current={checkInTab?.active ? "page" : undefined}
          >
            Check In
          </Link>
        </div>
      </div>

      <div className="club-workspace">
        <main className="club-main">
          <h1 className="sr-only">{model.content.pageHeader.title}</h1>
          {children}
        </main>
      </div>
    </div>
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
  const viewKeys: Record<string, string> = {
    "/": "home",
    "/consumers": "consumers",
    "/staff": "staff",
    "/payments": "pos",
    "/plans": "plans",
    "/locations": "locations",
    "/classes": "classes",
    "/bookings": "bookings",
    "/training": "personal_training",
    "/access-control": "access_control",
    "/contracts": "contracts",
    "/portal": "member_portal",
    "/marketing": "marketing",
    "/reports": "reports",
    "/settings": "settings"
  };
  return viewKeys[href] ?? (href.replace(/^\//, "").replaceAll("-", "_") || "home");
}

function initials(name: string) {
  const letters = name.split(/\s+/).map((part) => part.charAt(0)).filter(Boolean);
  return letters.slice(0, 2).join("").toUpperCase() || "U";
}
