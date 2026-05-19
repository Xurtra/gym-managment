import { layout } from "@gym-platform/ui";
export const publicSiteRoutes = [
    { path: "/", title: "Home" },
    { path: "/schedule", title: "Schedule" },
    { path: "/plans", title: "Plans" },
    { path: "/join", title: "Join" }
];
export function buildPublicSiteLayout(path) {
    return layout({
        title: "Public Website",
        navItems: publicSiteRoutes.map((route) => ({
            label: route.title,
            href: route.path,
            active: route.path === path
        }))
    });
}
export * from "./homePage.js";
export * from "./schedulePage.js";
export * from "./plansPage.js";
export * from "./signup.js";
export * from "./checkout.js";
//# sourceMappingURL=index.js.map