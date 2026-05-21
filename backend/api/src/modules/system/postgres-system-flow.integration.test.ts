import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp, createPostgresServices } from "../../app.js";
import type { ApiConfig } from "../../config/env.js";
import { runMigrations } from "../../db/migrationRunner.js";
import { fixedClock, testConfig } from "../../testUtils.js";

const describePostgres = process.env.RUN_POSTGRES_TESTS === "1" ? describe : describe.skip;

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

interface TestApi {
  baseUrl: string;
  pool: Pool;
  close(): Promise<void>;
  request<T>(path: string, options?: RequestInit): Promise<{ response: Response; data: T }>;
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

async function startPostgresApi(): Promise<TestApi> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required when RUN_POSTGRES_TESTS=1.");
  }
  assertTestDatabase(databaseUrl);
  const pool = new Pool({ connectionString: databaseUrl });
  await runMigrations(pool, { logger: { log: () => undefined } });
  await resetDatabase(pool);

  const config: ApiConfig = {
    ...testConfig,
    persistenceDriver: "postgres",
    databaseUrl
  };
  const services = createPostgresServices(config, fixedClock, pool);
  const server = createServer(createApp(config, services));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    baseUrl,
    pool,
    request: async <T>(path: string, options: RequestInit = {}) => {
      const response = await fetch(`${baseUrl}${path}`, options);
      const data = (await response.json()) as T;
      return { response, data };
    },
    close: async () => {
      await closeServer(server);
      await services.close();
    }
  };
}

async function resetDatabase(pool: Pool) {
  await pool.query(`
    TRUNCATE TABLE
      purpose_tokens,
      refresh_tokens,
      access_events,
      access_rules,
      access_devices,
      check_ins,
      notification_events,
      class_bookings,
      class_sessions,
      class_types,
      member_memberships,
      membership_plans,
      members,
      locations,
      gym_users,
      roles,
      gyms,
      users
    RESTART IDENTITY CASCADE
  `);
}

function assertTestDatabase(databaseUrl: string) {
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
  if (!databaseName.includes("test") && process.env.ALLOW_DATABASE_RESET !== "true") {
    throw new Error(
      "Refusing to reset a non-test database. Use a database name containing 'test' or set ALLOW_DATABASE_RESET=true."
    );
  }
}

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

async function closeServer(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
