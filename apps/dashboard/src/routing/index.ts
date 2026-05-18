import { Permission } from "@gym-platform/constants";
import type { Permission as PermissionValue } from "@gym-platform/constants";
import { captureErrorBoundary, errorState, layout, loadingState } from "@gym-platform/ui";

export interface DashboardRoute {
  path: string;
  title: string;
  protected: boolean;
  requiredPermissions?: PermissionValue[];
}

export interface DashboardPermissionContext {
  permissions: PermissionValue[];
  platformAdmin?: boolean;
}

export interface GuardedNavigationItem {
  label: string;
  href: string;
  active: boolean;
  requiredPermissions: PermissionValue[];
}

export const dashboardRoutes: DashboardRoute[] = [
  { path: "/login", title: "Login", protected: false },
  { path: "/register", title: "Register", protected: false },
  { path: "/forgot-password", title: "Forgot Password", protected: false },
  { path: "/reset-password", title: "Reset Password", protected: false },
  { path: "/", title: "Dashboard", protected: true, requiredPermissions: [Permission.GymRead] },
  {
    path: "/locations",
    title: "Locations",
    protected: true,
    requiredPermissions: [Permission.LocationRead]
  },
  {
    path: "/members",
    title: "Members",
    protected: true,
    requiredPermissions: [Permission.MemberRead]
  },
  {
    path: "/classes",
    title: "Classes",
    protected: true,
    requiredPermissions: [Permission.ClassRead]
  },
  {
    path: "/check-ins",
    title: "Check-Ins",
    protected: true,
    requiredPermissions: [Permission.MemberWrite]
  },
  {
    path: "/access-control",
    title: "Access Control",
    protected: true,
    requiredPermissions: [Permission.AccessRead]
  },
  {
    path: "/reports",
    title: "Reports",
    protected: true,
    requiredPermissions: [Permission.ReportRead]
  },
  {
    path: "/settings",
    title: "Settings",
    protected: true,
    requiredPermissions: [Permission.GymUpdate]
  }
];

export function resolveDashboardRoute(path: string) {
  return dashboardRoutes.find((route) => route.path === path) ?? dashboardRoutes[0]!;
}

export function buildDashboardLayout(path: string, context?: DashboardPermissionContext) {
  return layout({
    title: "Staff Dashboard",
    navItems: buildGuardedNavigation(path, context)
  });
}

export function buildProtectedRoute(input: {
  path: string;
  authenticated: boolean;
  permissions?: PermissionValue[];
  platformAdmin?: boolean;
}) {
  const route = resolveDashboardRoute(input.path);
  const permissionContext: DashboardPermissionContext = {
    permissions: input.permissions ?? [],
    ...(input.platformAdmin !== undefined ? { platformAdmin: input.platformAdmin } : {})
  };
  const hasRoutePermission = canAccessDashboardRoute(route, permissionContext);
  const redirectTo = !route.protected
    ? undefined
    : !input.authenticated
      ? "/login"
      : !hasRoutePermission
        ? "/"
        : undefined;
  return {
    route,
    allowed: !route.protected || (input.authenticated && hasRoutePermission),
    redirectTo
  };
}

export function buildGuardedNavigation(
  path: string,
  context: DashboardPermissionContext = { permissions: [] }
): GuardedNavigationItem[] {
  return dashboardRoutes
    .filter((route) => route.protected)
    .filter((route) => canAccessDashboardRoute(route, context))
    .map((route) => ({
      label: route.title,
      href: route.path,
      active: route.path === path,
      requiredPermissions: route.requiredPermissions ?? []
    }));
}

export function canAccessDashboardRoute(
  route: DashboardRoute,
  context: DashboardPermissionContext
) {
  if (!route.protected || context.platformAdmin) {
    return true;
  }
  const requiredPermissions = route.requiredPermissions ?? [];
  if (requiredPermissions.length === 0) {
    return true;
  }
  return requiredPermissions.every((permission) => context.permissions.includes(permission));
}

export function buildRouteLoadingState() {
  return loadingState("Loading page");
}

export function buildRouteErrorState(error: unknown) {
  return captureErrorBoundary(error).error ?? errorState({ title: "Route error", message: "Unknown error" });
}
