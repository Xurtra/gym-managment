import { afterEach, beforeEach, expect, it } from "vitest";
import { describePostgres, startPostgresApi, type TestApi } from "./postgres-test-utils.js";

interface RegisterResponse {
  user: { id: string; email: string };
  gym?: { id: string; name: string };
  accessToken: string;
  refreshToken: string;
  emailVerificationToken: string;
}

interface LocationListResponse {
  locations: Array<{ id: string; name: string; status: string }>;
}

let api: TestApi;

beforeEach(async () => {
  api = await startPostgresApi();
});

afterEach(async () => {
  await api.close();
});

describePostgres("Postgres-backed API flow", () => {
  it("runs owner onboarding, tenant-scoped locations, refresh rotation, and current user lookup", async () => {
    const suffix = Date.now();
    const registered = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: `owner-${suffix}@example.com`,
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );
    const gymId = registered.gym?.id ?? "";

    const me = await ok<{ activeGym?: { id: string }; memberships: unknown[] }>("/auth/me", {
      headers: authHeaders(registered.accessToken)
    });
    expect(me.activeGym?.id).toBe(gymId);
    expect(me.memberships).toHaveLength(1);

    await ok(
      `/gyms/${gymId}/locations`,
      json(
        {
          name: "Main Floor",
          address: {
            line1: "100 Fitness Ave",
            city: "New York",
            region: "NY",
            postalCode: "10001",
            country: "US"
          },
          timezone: "America/New_York",
          operatingHours: { mon: [{ opensAt: "06:00", closesAt: "22:00" }] }
        },
        registered.accessToken
      )
    );

    const listed = await ok<LocationListResponse>(`/gyms/${gymId}/locations`, {
      headers: authHeaders(registered.accessToken)
    });
    expect(listed.locations).toHaveLength(1);

    const refreshed = await ok<{ refreshToken: string }>(
      "/auth/refresh",
      json({ refreshToken: registered.refreshToken })
    );
    await fails("/auth/refresh", json({ refreshToken: registered.refreshToken }), 401);

    await ok("/auth/logout", json({ refreshToken: refreshed.refreshToken }));
    await fails("/auth/refresh", json({ refreshToken: refreshed.refreshToken }), 401);

    const countResult = await api.pool.query<{ count: string }>("SELECT count(*) FROM users");
    expect(Number(countResult.rows[0]?.count ?? 0)).toBe(1);
  });
});


async function ok<T = { ok: true }>(path: string, options?: RequestInit): Promise<T> {
  const { response, data } = await api.request<T>(path, options);
  expect(response.status).toBe(200);
  return data;
}

async function fails(path: string, options: RequestInit | undefined, status: number) {
  const { response } = await api.request(path, options);
  expect(response.status).toBe(status);
}

function json(body: unknown, accessToken?: string, method = "POST"): RequestInit {
  return {
    method,
    headers: authHeaders(accessToken),
    body: JSON.stringify(body)
  };
}

function authHeaders(accessToken?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };
  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }
  return headers;
}
