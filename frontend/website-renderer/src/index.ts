import { layout } from "@gym-platform/ui";

export const publicSiteRoutes = [
  { path: "/", title: "Home" },
  { path: "/schedule", title: "Schedule" },
  { path: "/plans", title: "Plans" },
  { path: "/join", title: "Join" }
] as const;

export function buildPublicSiteLayout(path: string) {
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
