import { DEFAULT_ROLE_PERMISSIONS, Permission, RoleName } from "@gym-platform/constants";
import type {
  Permission as PermissionValue,
  RoleName as RoleNameValue
} from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  buildGuardedNavigation,
  canAccessDashboardRoute,
  dashboardRoutes,
  type GuardedNavigationItem
} from "../routing/index.js";

export interface RestrictedDashboardView {
  screen: "restricted_dashboard";
  roleName: RoleNameValue;
  permissions: PermissionValue[];
  navItems: GuardedNavigationItem[];
  visibleRoutes: string[];
  hiddenRoutes: string[];
  primaryActions: ButtonModel[];
}

export function buildTrainerRestrictedView(path = "/classes"): RestrictedDashboardView {
  return buildRoleRestrictedView({
    roleName: RoleName.Trainer,
    path,
    primaryActions: [
      button({
        label: "Manage classes",
        disabled: !DEFAULT_ROLE_PERMISSIONS[RoleName.Trainer].includes(Permission.ClassWrite)
      }),
      button({
        label: "Book member",
        intent: "secondary",
        disabled: !DEFAULT_ROLE_PERMISSIONS[RoleName.Trainer].includes(Permission.BookingWrite)
      })
    ]
  });
}

export function buildFrontDeskRestrictedView(path = "/check-ins"): RestrictedDashboardView {
  return buildRoleRestrictedView({
    roleName: RoleName.FrontDesk,
    path,
    primaryActions: [
      button({
        label: "Start check-in",
        disabled: !DEFAULT_ROLE_PERMISSIONS[RoleName.FrontDesk].includes(Permission.MemberWrite)
      }),
      button({
        label: "Update member",
        intent: "secondary",
        disabled: !DEFAULT_ROLE_PERMISSIONS[RoleName.FrontDesk].includes(Permission.MemberWrite)
      }),
      button({
        label: "Take payment",
        intent: "secondary",
        disabled: !DEFAULT_ROLE_PERMISSIONS[RoleName.FrontDesk].includes(Permission.PaymentWrite)
      })
    ]
  });
}

function buildRoleRestrictedView(input: {
  roleName: RoleNameValue;
  path: string;
  primaryActions: ButtonModel[];
}): RestrictedDashboardView {
  const permissions = DEFAULT_ROLE_PERMISSIONS[input.roleName];
  const context = { permissions };
  const visibleRoutes = dashboardRoutes
    .filter((route) => route.protected)
    .filter((route) => canAccessDashboardRoute(route, context))
    .map((route) => route.path);
  const hiddenRoutes = dashboardRoutes
    .filter((route) => route.protected)
    .filter((route) => !canAccessDashboardRoute(route, context))
    .map((route) => route.path);

  return {
    screen: "restricted_dashboard",
    roleName: input.roleName,
    permissions,
    navItems: buildGuardedNavigation(input.path, context),
    visibleRoutes,
    hiddenRoutes,
    primaryActions: input.primaryActions
  };
}
