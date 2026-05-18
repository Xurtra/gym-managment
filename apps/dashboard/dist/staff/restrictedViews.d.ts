import type { Permission as PermissionValue, RoleName as RoleNameValue } from "@gym-platform/constants";
import type { ButtonModel } from "@gym-platform/ui";
import { type GuardedNavigationItem } from "../routing/index.js";
export interface RestrictedDashboardView {
    screen: "restricted_dashboard";
    roleName: RoleNameValue;
    permissions: PermissionValue[];
    navItems: GuardedNavigationItem[];
    visibleRoutes: string[];
    hiddenRoutes: string[];
    primaryActions: ButtonModel[];
}
export declare function buildTrainerRestrictedView(path?: string): RestrictedDashboardView;
export declare function buildFrontDeskRestrictedView(path?: string): RestrictedDashboardView;
//# sourceMappingURL=restrictedViews.d.ts.map