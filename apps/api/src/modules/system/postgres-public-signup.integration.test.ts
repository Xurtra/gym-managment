import { afterEach, beforeEach, expect, it } from "vitest";
import { describePostgres, startPostgresApi, type TestApi } from "./postgres-test-utils.js";

interface RegisterResponse {
  user: { id: string; email: string };
  gym?: { id: string; name: string };
  accessToken: string;
  refreshToken: string;
  emailVerificationToken: string;
}

interface GymResponse {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  locale: string;
  featureFlags: string[];
}

interface PlanResponse {
  id: string;
  name: string;
  priceCents: number;
  signupFeeCents: number;
  billingInterval: string;
  isPublic: boolean;
  status: string;
}

interface PublicGymResponse {
  gym: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    locale: string;
    featureFlags: string[];
  };
}

interface PublicPlanListResponse {
  gym: { id: string; name: string; slug: string; featureFlags: string[] };
  plans: Array<PlanResponse>;
}

interface PublicSignupResponse {
  gym: { id: string; name: string; slug: string };
  plan: { id: string; name: string; billingInterval: string; priceCents: number; signupFeeCents: number; trialDays: number };
  member: { id: string; firstName: string; lastName: string; email: string };
  membership: { id: string; status: string };
  summary: { totalDueTodayCents: number };
}

let api: TestApi;

beforeEach(async () => {
  api = await startPostgresApi();
});

afterEach(async () => {
  await api.close();
});

describePostgres("Postgres public signup flow", () => {
  it("publishes a plan and completes an online signup", async () => {
    const suffix = Date.now();
    const registered = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: `owner-${suffix}@example.com`,
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Signup Club",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );

    const gym = await ok<GymResponse>(`/gyms/${registered.gym?.id ?? ""}`, {
      headers: authHeaders(registered.accessToken)
    });
    expect(gym.slug).toBeTruthy();

    await ok(`/gyms/${gym.id}`, json({ featureFlags: ["online_signup"] }, registered.accessToken, "PATCH"));

    const plan = await ok<PlanResponse>(
      `/gyms/${gym.id}/membership-plans`,
      json(
        {
          name: "Starter Plan",
          description: "A public signup plan.",
          billingInterval: "monthly",
          priceCents: 1000,
          signupFeeCents: 2500,
          trialDays: 0,
          autoRenew: true,
          isPublic: true
        },
        registered.accessToken
      )
    );

    const publicGym = await ok<PublicGymResponse>(`/public/gyms/${gym.slug}`);
    expect(publicGym.gym.slug).toBe(gym.slug);

    const publicPlans = await ok<PublicPlanListResponse>(`/public/gyms/${gym.slug}/plans`);
    expect(publicPlans.plans.some((p) => p.id === plan.id)).toBe(true);

    const signup = await ok<PublicSignupResponse>(
      `/public/gyms/${gym.slug}/signup`,
      json({
        planId: plan.id,
        firstName: "Online",
        lastName: "Member",
        email: `member-${suffix}@example.com`,
        phone: "555-0110"
      })
    );

    expect(signup.plan.id).toBe(plan.id);
    expect(signup.summary.totalDueTodayCents).toBe(plan.priceCents + plan.signupFeeCents);
    expect(signup.member.email).toBe(`member-${suffix}@example.com`);
  });
});

async function ok<T = { ok: true }>(path: string, options?: RequestInit): Promise<T> {
  const { response, data } = await api.request<T>(path, options);
  expect(response.status).toBe(200);
  return data;
}

function json(body: unknown, accessToken?: string, method = "POST"): RequestInit {
  return {
    method,
    headers: authHeaders(accessToken),
    body: JSON.stringify(body)
  };
}

function authHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };
  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }
  return headers;
}
