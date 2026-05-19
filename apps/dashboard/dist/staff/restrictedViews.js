import { DEFAULT_ROLE_PERMISSIONS, Permission, RoleName } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import { buildGuardedNavigation, canAccessDashboardRoute, dashboardRoutes } from "../routing/index.js";
export function buildTrainerRestrictedView(path = "/classes") {
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
export function buildFrontDeskRestrictedView(path = "/check-ins") {
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
function buildRoleRestrictedView(input) {
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
        activePath: input.path,
        permissions,
        navItems: buildGuardedNavigation(input.path, context),
        visibleRoutes,
        visibleRouteCount: visibleRoutes.length,
        hiddenRoutes,
        hiddenRouteCount: hiddenRoutes.length,
        primaryActions: input.primaryActions,
        primaryActionCount: input.primaryActions.length,
        summaryLabel: `${visibleRoutes.length} dashboard route${visibleRoutes.length === 1 ? "" : "s"} available`
    };
}
//# sourceMappingURL=restrictedViews.js.map