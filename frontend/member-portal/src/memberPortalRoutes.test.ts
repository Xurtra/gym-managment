import { describe, expect, it } from "vitest";
import { buildMemberPortalLayout, memberPortalRoutes } from "./index.js";

describe("member portal routes", () => {
  it("defines protected member routes and active layout nav", () => {
    const layout = buildMemberPortalLayout("/classes");

    expect(memberPortalRoutes.some((route) => route.path === "/check-in")).toBe(true);
    expect(memberPortalRoutes.filter((route) => route.protected).length).toBeGreaterThan(0);
    expect(layout.navItems.find((item) => item.href === "/classes")?.active).toBe(true);
  });
});
