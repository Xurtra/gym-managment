import { expect, test } from "./observableTest.js";
import { loginViaUi, registerOwnerViaApi } from "./helpers.js";

test.describe("Authentication", () => {
  test("owner can register via API and log in via the dashboard UI", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);

    await page.goto(`/?gymSlug=${gym.gymSlug}`);
    await expect(page.locator("#login-form")).toBeVisible();
    await expect(page.locator('h2')).toContainText(/Log in/i);

    const loginForm = page.locator("#login-form").filter({ visible: true });
    await loginForm.locator('input[name="email"]').fill(gym.ownerEmail);
    await loginForm.locator('input[name="password"]').fill(gym.ownerPassword);
    await loginForm.locator('button[type="submit"]').click();

    await expect(page.locator(".club-shell")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".club-brand strong")).toContainText(/E2E Gym/i);
  });

  test("login form shows an error for wrong credentials", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);

    await page.goto(`/?gymSlug=${gym.gymSlug}`);
    await page.fill('input[name="email"]', gym.ownerEmail);
    await page.fill('input[name="password"]', "WrongPassword!");
    await page.click('#login-form button[type="submit"]');

    // Should stay on the login page (not navigate to dashboard)
    await expect(page.locator("#login-form")).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(".club-shell")).not.toBeVisible();
  });

  test("dashboard tabs are visible after login", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    await expect(page.locator('a.club-tab[data-dashboard-view="consumers"]')).toBeVisible();
    await expect(page.locator('a.club-tab[data-dashboard-view="check_in"]')).toBeVisible();
    await expect(page.locator('a.club-tab[data-dashboard-view="bookings"]')).toBeVisible();
  });
});
