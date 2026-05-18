import { describe, expect, it } from "vitest";
import { buildPublicSiteLayout, publicSiteRoutes } from "./index.js";
describe("public site routes", () => {
    it("defines public website routes and active layout nav", () => {
        const layout = buildPublicSiteLayout("/plans");
        expect(publicSiteRoutes.map((route) => route.path)).toContain("/join");
        expect(layout.navItems.find((item) => item.href === "/plans")?.active).toBe(true);
    });
});
//# sourceMappingURL=publicRoutes.test.js.map