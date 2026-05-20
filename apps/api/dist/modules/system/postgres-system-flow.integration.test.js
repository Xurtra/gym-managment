import { afterEach, beforeEach, expect, it } from "vitest";
import { describePostgres, startPostgresApi } from "./postgres-test-utils.js";
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
//# sourceMappingURL=postgres-system-flow.integration.test.js.map