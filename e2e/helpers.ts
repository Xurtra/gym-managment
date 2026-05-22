import { type APIRequestContext, expect, type Page } from "@playwright/test";

const API_URL = "http://127.0.0.1:4000";

export interface TestGym {
  gymId: string;
  gymSlug: string;
  ownerEmail: string;
  ownerPassword: string;
  accessToken: string;
}

export async function registerOwnerViaApi(
  request: APIRequestContext,
  suffix = Date.now().toString()
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
    ownerEmail: email,
    ownerPassword: password,
    accessToken: body.accessToken
  };
}

export async function loginViaUi(page: Page, gym: TestGym) {
  await page.goto(`/?gymSlug=${gym.gymSlug}`);
  await page.waitForSelector("#login-form");
  await page.fill('input[name="email"]', gym.ownerEmail);
  await page.fill('input[name="password"]', gym.ownerPassword);
  await page.click('#login-form button[type="submit"]');
  await page.waitForSelector('.club-shell', { timeout: 10_000 });
}

export async function navigateToDashboardView(page: Page, view: string) {
  await page.click(`[data-dashboard-view="${view}"]`);
  await page.waitForTimeout(300);
}
