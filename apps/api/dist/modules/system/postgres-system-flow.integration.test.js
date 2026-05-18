import { createServer } from "node:http";
import { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp, createPostgresServices } from "../../app.js";
import { runMigrations } from "../../db/migrationRunner.js";
import { fixedClock, testConfig } from "../../testUtils.js";
const describePostgres = process.env.RUN_POSTGRES_TESTS === "1" ? describe : describe.skip;
let api;
beforeEach(async () => {
    api = await startPostgresApi();
});
afterEach(async () => {
    await api.close();
});
describePostgres("Postgres-backed API flow", () => {
    it("runs owner onboarding, tenant-scoped locations, refresh rotation, and current user lookup", async () => {
        const suffix = Date.now();
        const registered = await ok("/auth/register", json({
            email: `owner-${suffix}@example.com`,
            password: "Password123",
            firstName: "Demo",
            lastName: "Owner",
            gymName: "Demo Strength Club",
            timezone: "America/New_York",
            locale: "en-US"
        }));
        const gymId = registered.gym?.id ?? "";
        const me = await ok("/auth/me", {
            headers: authHeaders(registered.accessToken)
        });
        expect(me.activeGym?.id).toBe(gymId);
        expect(me.memberships).toHaveLength(1);
        await ok(`/gyms/${gymId}/locations`, json({
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
        }, registered.accessToken));
        const listed = await ok(`/gyms/${gymId}/locations`, {
            headers: authHeaders(registered.accessToken)
        });
        expect(listed.locations).toHaveLength(1);
        const refreshed = await ok("/auth/refresh", json({ refreshToken: registered.refreshToken }));
        await fails("/auth/refresh", json({ refreshToken: registered.refreshToken }), 401);
        await ok("/auth/logout", json({ refreshToken: refreshed.refreshToken }));
        await fails("/auth/refresh", json({ refreshToken: refreshed.refreshToken }), 401);
        const countResult = await api.pool.query("SELECT count(*) FROM users");
        expect(Number(countResult.rows[0]?.count ?? 0)).toBe(1);
    });
});
async function startPostgresApi() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is required when RUN_POSTGRES_TESTS=1.");
    }
    assertTestDatabase(databaseUrl);
    const pool = new Pool({ connectionString: databaseUrl });
    await runMigrations(pool, { logger: { log: () => undefined } });
    await resetDatabase(pool);
    const config = {
        ...testConfig,
        persistenceDriver: "postgres",
        databaseUrl
    };
    const services = createPostgresServices(config, fixedClock, pool);
    const server = createServer(createApp(config, services));
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    return {
        baseUrl,
        pool,
        request: async (path, options = {}) => {
            const response = await fetch(`${baseUrl}${path}`, options);
            const data = (await response.json());
            return { response, data };
        },
        close: async () => {
            await closeServer(server);
            await services.close();
        }
    };
}
async function resetDatabase(pool) {
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
function assertTestDatabase(databaseUrl) {
    const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
    if (!databaseName.includes("test") && process.env.ALLOW_DATABASE_RESET !== "true") {
        throw new Error("Refusing to reset a non-test database. Use a database name containing 'test' or set ALLOW_DATABASE_RESET=true.");
    }
}
async function ok(path, options) {
    const { response, data } = await api.request(path, options);
    expect(response.status).toBe(200);
    return data;
}
async function fails(path, options, status) {
    const { response } = await api.request(path, options);
    expect(response.status).toBe(status);
}
function json(body, accessToken, method = "POST") {
    return {
        method,
        headers: authHeaders(accessToken),
        body: JSON.stringify(body)
    };
}
function authHeaders(accessToken) {
    const headers = {
        "content-type": "application/json"
    };
    if (accessToken) {
        headers.authorization = `Bearer ${accessToken}`;
    }
    return headers;
}
async function closeServer(server) {
    await new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
//# sourceMappingURL=postgres-system-flow.integration.test.js.map