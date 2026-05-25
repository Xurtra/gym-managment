import { type APIRequestContext, expect, type Page } from "@playwright/test";

const API_URL = "http://127.0.0.1:4000";

export interface TestGym {
  gymId: string;
  gymSlug: string;
  gymName: string;
  ownerEmail: string;
  ownerPassword: string;
  accessToken: string;
}

export async function registerOwnerViaApi(
  request: APIRequestContext,
  suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
): Promise<TestGym> {
  const email = `owner-${suffix}@e2e.test`;
  const password = "Password123!";
  const gymName = `E2E Gym ${suffix}`;

  const res = await request.post(`${API_URL}/auth/register`, {
    data: {
      email,
      password,
      firstName: "E2E",
      lastName: "Owner",
      gymName,
      timezone: "America/New_York",
      locale: "en-US"
    }
  });
  expect(res.status()).toBe(200);
  const body = await res.json() as {
    accessToken: string;
    gym: { id: string; slug: string };
  };
  return {
    gymId: body.gym.id,
    gymSlug: body.gym.slug,
    gymName,
    ownerEmail: email,
    ownerPassword: password,
    accessToken: body.accessToken
  };
}

export async function loginViaUi(page: Page, gym: TestGym) {
  await page.goto(`/?gymSlug=${gym.gymSlug}`);
  await expect(page.getByRole("heading", { name: `Log in to ${gym.gymName}` })).toBeVisible();
  const loginForm = page.locator("#login-form").filter({ visible: true });
  await expect(loginForm).toBeVisible();
  await loginForm.locator('input[name="email"]').fill(gym.ownerEmail);
  await loginForm.locator('input[name="password"]').fill(gym.ownerPassword);
  await expect(loginForm.locator('input[name="email"]')).toHaveValue(gym.ownerEmail);
  await loginForm.locator('button[type="submit"]').click();
  await expect(page.locator(".club-shell").filter({ visible: true })).toBeVisible({ timeout: 10_000 });
}

export async function navigateToDashboardView(page: Page, view: string) {
  await page.locator(`a.club-tab[data-dashboard-view="${view}"]`).filter({ visible: true }).click();
  await expect(page.locator(`a.club-tab.active[data-dashboard-view="${view}"]`).filter({ visible: true })).toBeVisible();
}
