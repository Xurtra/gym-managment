import type { Permission as PermissionValue } from "@gym-platform/constants";
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
export declare const dashboardRoutes: DashboardRoute[];
export declare function resolveDashboardRoute(path: string): DashboardRoute;
export declare function buildDashboardLayout(path: string, context?: DashboardPermissionContext): import("@gym-platform/ui").LayoutModel;
export declare function buildProtectedRoute(input: {
    path: string;
    authenticated: boolean;
    permissions?: PermissionValue[];
    platformAdmin?: boolean;
}): {
    route: DashboardRoute;
    allowed: boolean;
    redirectTo: string | undefined;
};
export declare function buildGuardedNavigation(path: string, context?: DashboardPermissionContext): GuardedNavigationItem[];
export declare function canAccessDashboardRoute(route: DashboardRoute, context: DashboardPermissionContext): boolean;
export declare function buildRouteLoadingState(): import("@gym-platform/ui").LoadingStateModel;
export declare function buildRouteErrorState(error: unknown): import("@gym-platform/ui").ErrorStateModel;
//# sourceMappingURL=index.d.ts.map