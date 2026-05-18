import { describe, expect, it } from "vitest";
import { GymApiClient } from "./index.js";
describe("GymApiClient auth refresh", () => {
    it("refreshes tokens once after an unauthorized API response and retries the request", async () => {
        const calls = [];
        const tokenStore = memoryTokenStore("expired", "refresh-1");
        const client = new GymApiClient({
            baseUrl: "http://api.local",
            tokenStore,
            fetchImpl: (async (url, init) => {
                const path = url instanceof URL ? url.pathname : new URL(String(url)).pathname;
                const headers = new Headers(init?.headers);
                const authorization = headers.get("authorization") ?? undefined;
                calls.push(authorization ? { path, authorization } : { path });
                if (path === "/auth/me" && headers.get("authorization") === "Bearer expired") {
                    return jsonResponse({ error: { message: "Expired", code: "unauthorized" } }, 401);
                }
                if (path === "/auth/refresh") {
                    return jsonResponse({ accessToken: "fresh", refreshToken: "refresh-2" });
                }
                return jsonResponse({ user: { id: "user-1" } });
            })
        });
        const me = await client.me();
        expect(me).toEqual({ user: { id: "user-1" } });
        expect(tokenStore.getAccessToken()).toBe("fresh");
        expect(calls.map((call) => call.path)).toEqual(["/auth/me", "/auth/refresh", "/auth/me"]);
        expect(calls[2]?.authorization).toBe("Bearer fresh");
    });
    it("clears tokens and calls forced logout when refresh fails", async () => {
        let expired = false;
        const tokenStore = memoryTokenStore("expired", "refresh-1");
        const client = new GymApiClient({
            baseUrl: "http://api.local",
            tokenStore,
            onSessionExpired: () => {
                expired = true;
            },
            fetchImpl: (async (url) => {
                const path = url instanceof URL ? url.pathname : new URL(String(url)).pathname;
                if (path === "/auth/refresh") {
                    return jsonResponse({ error: { message: "Nope", code: "unauthorized" } }, 401);
                }
                return jsonResponse({ error: { message: "Expired", code: "unauthorized" } }, 401);
            })
        });
        await expect(client.me()).rejects.toThrow(/expired/i);
        expect(tokenStore.getAccessToken()).toBeUndefined();
        expect(expired).toBe(true);
    });
    it("builds location detail, room, and public schedule filter requests", async () => {
        const calls = [];
        const client = new GymApiClient({
            baseUrl: "http://api.local",
            accessToken: "token-1",
            fetchImpl: (async (url) => {
                const resolved = url instanceof URL ? url : new URL(String(url));
                calls.push(`${resolved.pathname}${resolved.search}`);
                return jsonResponse({ ok: true });
            })
        });
        await client.listLocations("gym-1");
        await client.getLocation("gym-1", "location-1");
        await client.listLocationRooms("gym-1", "location-1");
        await client.listRoles("gym-1");
        await client.createCustomRole("gym-1", {
            name: "Operations Lead",
            permissions: ["gym:read", "member:read"]
        });
        await client.updateCustomRole("gym-1", "role-custom", {
            name: "Front Office Lead",
            permissions: ["gym:read", "member:read", "staff:read"]
        });
        await client.listStaff("gym-1");
        await client.assignStaffRole("gym-1", {
            userId: "00000000-0000-4000-8000-000000000002",
            roleId: "00000000-0000-4000-8000-000000000003"
        });
        await client.removeStaffAccess("gym-1", "user-2", { reason: "No longer active" });
        await client.listStaffAuditLogs("gym-1");
        await client.createStaffShift("gym-1", {
            userId: "00000000-0000-4000-8000-000000000002",
            startsAt: "2026-05-18T13:00:00.000Z",
            endsAt: "2026-05-18T21:00:00.000Z"
        });
        await client.listStaffInvites("gym-1");
        await client.createStaffInvite("gym-1", {
            email: "trainer@example.com",
            roleId: "00000000-0000-4000-8000-000000000001"
        });
        await client.acceptStaffInvite({
            token: "invite-token-with-enough-length-123456",
            firstName: "Demo",
            lastName: "Trainer",
            password: "Password123"
        });
        await client.publicSchedule("demo-strength-club", "2026-05-18T00:00:00.000Z", "2026-05-19T00:00:00.000Z", "location-1");
        expect(calls).toEqual([
            "/gyms/gym-1/locations",
            "/gyms/gym-1/locations/location-1",
            "/gyms/gym-1/locations/location-1/rooms",
            "/gyms/gym-1/roles",
            "/gyms/gym-1/roles",
            "/gyms/gym-1/roles/role-custom",
            "/gyms/gym-1/staff",
            "/gyms/gym-1/roles/assign",
            "/gyms/gym-1/staff/user-2",
            "/gyms/gym-1/staff/audit",
            "/gyms/gym-1/staff/shifts",
            "/gyms/gym-1/staff/invites",
            "/gyms/gym-1/staff/invites",
            "/staff/invites/accept",
            "/public/gyms/demo-strength-club/schedule?from=2026-05-18T00%3A00%3A00.000Z&to=2026-05-19T00%3A00%3A00.000Z&locationId=location-1"
        ]);
    });
});
function memoryTokenStore(accessToken, refreshToken) {
    let tokens = {
        accessToken,
        refreshToken
    };
    return {
        getAccessToken: () => tokens?.accessToken,
        getRefreshToken: () => tokens?.refreshToken,
        setTokens: (next) => {
            tokens = next;
        },
        clearTokens: () => {
            tokens = undefined;
        }
    };
}
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" }
    });
}
//# sourceMappingURL=apiClientAuth.test.js.map