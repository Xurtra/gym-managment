import { expect, test } from "@playwright/test";
import { loginViaUi, navigateToDashboardView, registerOwnerViaApi } from "./helpers.js";

test.describe("Member Management", () => {
  test("owner can navigate to consumers view", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    await navigateToDashboardView(page, "consumers");
    await expect(page.locator("h2, h3")).toContainText(/consumer|member/i);
  });

  test("owner can see the check-in view", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    await navigateToDashboardView(page, "check_in");
    await expect(page.locator("h2, h3")).toContainText(/check.in/i);
  });

  test("owner can navigate to the plans view", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    await navigateToDashboardView(page, "plans");
    await expect(page.locator("h2, h3")).toContainText(/plan/i);
  });

  test("dashboard home shows operational summary", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    // Should be on home view after login
    await expect(page.locator(".club-shell")).toBeVisible();
    const nav = page.locator('[data-dashboard-view="home"]');
    await expect(nav).toBeVisible();
  });
});
