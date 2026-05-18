import { layout } from "@gym-platform/ui";
export const memberPortalRoutes = [
    { path: "/login", title: "Member Login", protected: false },
    { path: "/", title: "Member Home", protected: true },
    { path: "/classes", title: "Classes", protected: true },
    { path: "/billing", title: "Billing", protected: true },
    { path: "/check-in", title: "Check-In Code", protected: true }
];
export function buildMemberPortalLayout(path) {
    return layout({
        title: "Member Portal",
        navItems: memberPortalRoutes
            .filter((route) => route.protected)
            .map((route) => ({ label: route.title, href: route.path, active: route.path === path }))
    });
}
//# sourceMappingURL=index.js.map