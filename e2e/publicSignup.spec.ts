import { expect, test } from "./observableTest.js";
import { registerOwnerViaApi } from "./helpers.js";

test.describe("Public Signup", () => {
  test("public plans page is accessible via gymSlug", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);

    // Create a public plan via API
    const API_URL = "http://127.0.0.1:4000";
    const planRes = await request.post(`${API_URL}/gyms/${gym.gymId}/membership-plans`, {
      headers: { Authorization: `Bearer ${gym.accessToken}` },
      data: {
        name: "Starter Plan",
        billingInterval: "monthly",
        priceCents: 3900,
        signupFeeCents: 0,
        trialDays: 0,
        autoRenew: true,
        isPublic: true
      }
    });
    expect(planRes.status()).toBe(200);

    // Navigate to public plans view (view=public state)
    await page.goto(`/?gymSlug=${gym.gymSlug}&view=public`);
    await page.waitForTimeout(1000);

    // The page should load and show the gym context
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("public signup via API creates a new member", async ({ request }) => {
    const API_URL = "http://127.0.0.1:4000";
    const gym = await registerOwnerViaApi(request);

    // Create a public plan
    const planRes = await request.post(`${API_URL}/gyms/${gym.gymId}/membership-plans`, {
      headers: { Authorization: `Bearer ${gym.accessToken}` },
      data: {
        name: "Public Monthly",
        billingInterval: "monthly",
        priceCents: 4900,
        signupFeeCents: 0,
        trialDays: 0,
        autoRenew: true,
        isPublic: true
      }
    });
    expect(planRes.status()).toBe(200);
    const plan = await planRes.json() as { id: string };

    // Perform public signup
    const suffix = Date.now().toString();
    const signupRes = await request.post(`${API_URL}/public/gyms/${gym.gymSlug}/signup`, {
      data: {
        planId: plan.id,
        firstName: "New",
        lastName: "Signup",
        email: `signup-${suffix}@e2e.test`,
        membershipStartsAt: new Date().toISOString()
      }
    });
    expect(signupRes.status()).toBe(200);
    const body = await signupRes.json() as {
      member: { firstName: string; lastName: string };
      membership: { status: string };
    };
    expect(body.member.firstName).toBe("New");
    expect(body.member.lastName).toBe("Signup");
    expect(["active", "trialing"]).toContain(body.membership.status);
  });
});
