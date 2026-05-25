import { expect, test } from "./observableTest.js";
import { loginViaUi, navigateToDashboardView, registerOwnerViaApi } from "./helpers.js";

test.describe("Member Management", () => {
  test("owner can navigate to consumers view", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    await navigateToDashboardView(page, "consumers");
    await expect(page.getByRole("heading", { name: "Consumer Directory", level: 1 })).toBeVisible();
  });

  test("owner can see the check-in view", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    await navigateToDashboardView(page, "check_in");
    await expect(page.getByRole("heading", { name: "Club Check In" })).toBeVisible();
  });

  test("owner can navigate to the plans view", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    await navigateToDashboardView(page, "plans");
    await expect(page.getByRole("heading", { name: "Plans and packages" })).toBeVisible();
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
