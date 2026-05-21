import { describe, expect, it } from "vitest";
import { GymApiClient, type ApiTokenStore } from "./index.js";

describe("GymApiClient auth refresh", () => {
  it("binds the default fetch implementation for browser callers", async () => {
    const originalFetch = globalThis.fetch;
    let called = false;
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: async function defaultFetch(this: typeof globalThis) {
        called = true;
        expect(this).toBe(globalThis);
        return jsonResponse({ ok: true });
      } as typeof fetch
    });

    try {
      const client = new GymApiClient({ baseUrl: "http://api.local" });
      await client.me();
    } finally {
      Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        value: originalFetch
      });
    }

    expect(called).toBe(true);
  });

  it("refreshes tokens once after an unauthorized API response and retries the request", async () => {
    const calls: Array<{ path: string; authorization?: string }> = [];
    const tokenStore = memoryTokenStore("expired", "refresh-1");
    const client = new GymApiClient({
      baseUrl: "http://api.local",
      tokenStore,
      fetchImpl: (async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
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
      }) as typeof fetch
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
      fetchImpl: (async (url: Parameters<typeof fetch>[0]) => {
        const path = url instanceof URL ? url.pathname : new URL(String(url)).pathname;
        if (path === "/auth/refresh") {
          return jsonResponse({ error: { message: "Nope", code: "unauthorized" } }, 401);
        }
        return jsonResponse({ error: { message: "Expired", code: "unauthorized" } }, 401);
      }) as typeof fetch
    });

    await expect(client.me()).rejects.toThrow(/expired/i);

    expect(tokenStore.getAccessToken()).toBeUndefined();
    expect(expired).toBe(true);
  });

  it("builds location detail, room, and public schedule filter requests", async () => {
    const calls: string[] = [];
    const client = new GymApiClient({
      baseUrl: "http://api.local",
      accessToken: "token-1",
      fetchImpl: (async (url: Parameters<typeof fetch>[0]) => {
        const resolved = url instanceof URL ? url : new URL(String(url));
        calls.push(`${resolved.pathname}${resolved.search}`);
        return jsonResponse({ ok: true });
      }) as typeof fetch
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
    await client.publicSchedule(
      "demo-strength-club",
      "2026-05-18T00:00:00.000Z",
      "2026-05-19T00:00:00.000Z",
      "location-1"
    );

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

  it("builds roles and staff access requests with the expected methods, bodies, and auth", async () => {
    const calls: Array<{
      path: string;
      method: string;
      authorization?: string;
      body?: unknown;
    }> = [];
    const client = new GymApiClient({
      baseUrl: "http://api.local",
      accessToken: "token-1",
      fetchImpl: (async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const resolved = url instanceof URL ? url : new URL(String(url));
        const headers = new Headers(init?.headers);
        const authorization = headers.get("authorization") ?? undefined;
        const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
        calls.push({
          path: `${resolved.pathname}${resolved.search}`,
          method: init?.method ?? "GET",
          ...(authorization ? { authorization } : {}),
          ...(body !== undefined ? { body } : {})
        });
        return jsonResponse({ ok: true });
      }) as typeof fetch
    });
    const publicClient = new GymApiClient({
      baseUrl: "http://api.local",
      fetchImpl: (async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const resolved = url instanceof URL ? url : new URL(String(url));
        const headers = new Headers(init?.headers);
        const authorization = headers.get("authorization") ?? undefined;
        const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
        calls.push({
          path: `${resolved.pathname}${resolved.search}`,
          method: init?.method ?? "GET",
          ...(authorization ? { authorization } : {}),
          ...(body !== undefined ? { body } : {})
        });
        return jsonResponse({ ok: true });
      }) as typeof fetch
    });

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
    await client.listStaffInvites("gym-1");
    await client.createStaffInvite("gym-1", {
      email: "trainer@example.com",
      roleId: "00000000-0000-4000-8000-000000000001"
    });
    await publicClient.acceptStaffInvite({
      token: "invite-token-with-enough-length-123456",
      firstName: "Demo",
      lastName: "Trainer",
      password: "Password123"
    });

    expect(calls).toEqual([
      {
        path: "/gyms/gym-1/roles",
        method: "GET",
        authorization: "Bearer token-1"
      },
      {
        path: "/gyms/gym-1/roles",
        method: "POST",
        authorization: "Bearer token-1",
        body: {
          name: "Operations Lead",
          permissions: ["gym:read", "member:read"]
        }
      },
      {
        path: "/gyms/gym-1/roles/role-custom",
        method: "PATCH",
        authorization: "Bearer token-1",
        body: {
          name: "Front Office Lead",
          permissions: ["gym:read", "member:read", "staff:read"]
        }
      },
      {
        path: "/gyms/gym-1/staff",
        method: "GET",
        authorization: "Bearer token-1"
      },
      {
        path: "/gyms/gym-1/roles/assign",
        method: "POST",
        authorization: "Bearer token-1",
        body: {
          userId: "00000000-0000-4000-8000-000000000002",
          roleId: "00000000-0000-4000-8000-000000000003"
        }
      },
      {
        path: "/gyms/gym-1/staff/user-2",
        method: "DELETE",
        authorization: "Bearer token-1",
        body: {
          reason: "No longer active"
        }
      },
      {
        path: "/gyms/gym-1/staff/audit",
        method: "GET",
        authorization: "Bearer token-1"
      },
      {
        path: "/gyms/gym-1/staff/invites",
        method: "GET",
        authorization: "Bearer token-1"
      },
      {
        path: "/gyms/gym-1/staff/invites",
        method: "POST",
        authorization: "Bearer token-1",
        body: {
          email: "trainer@example.com",
          roleId: "00000000-0000-4000-8000-000000000001"
        }
      },
      {
        path: "/staff/invites/accept",
        method: "POST",
        body: {
          token: "invite-token-with-enough-length-123456",
          firstName: "Demo",
          lastName: "Trainer",
          password: "Password123"
        }
      }
    ]);
  });

  it("builds member portal class booking requests", async () => {
    const calls: Array<{
      path: string;
      method: string;
      authorization?: string;
    }> = [];
    const client = new GymApiClient({
      baseUrl: "http://api.local",
      accessToken: "member-token",
      fetchImpl: (async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const resolved = url instanceof URL ? url : new URL(String(url));
        const headers = new Headers(init?.headers);
        const authorization = headers.get("authorization") ?? undefined;
        calls.push({
          path: `${resolved.pathname}${resolved.search}`,
          method: init?.method ?? "GET",
          ...(authorization ? { authorization } : {})
        });
        return jsonResponse({ ok: true });
      }) as typeof fetch
    });

    await client.listMemberPortalClasses(
      "2026-05-18T00:00:00.000Z",
      "2026-05-19T00:00:00.000Z",
      "location-1"
    );
    await client.listMemberPortalBookings();
    await client.createMemberPortalBooking("session-1");
    await client.joinMemberPortalWaitlist("session-1");
    await client.cancelMemberPortalBooking("booking-1");
    await client.leaveMemberPortalWaitlist("booking-2");

    expect(calls).toEqual([
      {
        path: "/member-portal/classes?from=2026-05-18T00%3A00%3A00.000Z&to=2026-05-19T00%3A00%3A00.000Z&locationId=location-1",
        method: "GET",
        authorization: "Bearer member-token"
      },
      {
        path: "/member-portal/bookings",
        method: "GET",
        authorization: "Bearer member-token"
      },
      {
        path: "/member-portal/class-sessions/session-1/bookings",
        method: "POST",
        authorization: "Bearer member-token"
      },
      {
        path: "/member-portal/class-sessions/session-1/waitlist",
        method: "POST",
        authorization: "Bearer member-token"
      },
      {
        path: "/member-portal/bookings/booking-1",
        method: "DELETE",
        authorization: "Bearer member-token"
      },
      {
        path: "/member-portal/bookings/booking-2/waitlist",
        method: "DELETE",
        authorization: "Bearer member-token"
      }
    ]);
  });

  it("builds member and membership management requests with the expected methods, bodies, and auth", async () => {
    const calls: Array<{
      path: string;
      method: string;
      authorization?: string;
      body?: unknown;
    }> = [];
    const client = new GymApiClient({
      baseUrl: "http://api.local",
      accessToken: "token-1",
      fetchImpl: (async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const resolved = url instanceof URL ? url : new URL(String(url));
        const headers = new Headers(init?.headers);
        const authorization = headers.get("authorization") ?? undefined;
        const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
        calls.push({
          path: `${resolved.pathname}${resolved.search}`,
          method: init?.method ?? "GET",
          ...(authorization ? { authorization } : {}),
          ...(body !== undefined ? { body } : {})
        });
        return jsonResponse({ ok: true });
      }) as typeof fetch
    });

    await client.listMembers("gym-1");
    await client.createMember("gym-1", {
      firstName: "Jamie",
      lastName: "Rivera",
      email: "jamie@example.com",
      phone: "555-0101",
      barcode: "MEM-100",
      status: "active",
      emergencyContact: {
        name: "Avery Rivera",
        phone: "555-0199",
        relationship: "Spouse"
      },
      notes: "Prefers morning classes.",
      tagNames: ["Strength", "Founding"]
    });
    await client.updateMember("gym-1", "member-1", {
      phone: "555-0109",
      status: "past_due",
      tagNames: ["Strength"]
    });
    await client.archiveMember("gym-1", "member-1");
    await client.listMemberMemberships("gym-1", "member-1");
    await client.assignMemberMembership("gym-1", "member-1", {
      planId: "00000000-0000-4000-8000-000000000010",
      status: "active",
      startsAt: "2026-05-18T00:00:00.000Z",
      endsAt: "2026-06-18T00:00:00.000Z"
    });
    await client.listMembershipPlans("gym-1");
    await client.createMembershipPlan("gym-1", {
      name: "Monthly Unlimited",
      billingInterval: "monthly",
      priceCents: 9900,
      signupFeeCents: 2500,
      trialDays: 7,
      autoRenew: true,
      classAccessLimit: 12,
      isPublic: true
    });
    await client.updateMembershipPlan("gym-1", "plan-1", {
      description: "Best for regular members",
      priceCents: 10900,
      trialDays: 14
    });
    await client.archiveMembershipPlan("gym-1", "plan-1");

    expect(calls).toEqual([
      {
        path: "/gyms/gym-1/members",
        method: "GET",
        authorization: "Bearer token-1"
      },
      {
        path: "/gyms/gym-1/members",
        method: "POST",
        authorization: "Bearer token-1",
        body: {
          firstName: "Jamie",
          lastName: "Rivera",
          email: "jamie@example.com",
          phone: "555-0101",
          barcode: "MEM-100",
          status: "active",
          emergencyContact: {
            name: "Avery Rivera",
            phone: "555-0199",
            relationship: "Spouse"
          },
          notes: "Prefers morning classes.",
          tagNames: ["Strength", "Founding"]
        }
      },
      {
        path: "/gyms/gym-1/members/member-1",
        method: "PATCH",
        authorization: "Bearer token-1",
        body: {
          phone: "555-0109",
          status: "past_due",
          tagNames: ["Strength"]
        }
      },
      {
        path: "/gyms/gym-1/members/member-1",
        method: "DELETE",
        authorization: "Bearer token-1"
      },
      {
        path: "/gyms/gym-1/members/member-1/memberships",
        method: "GET",
        authorization: "Bearer token-1"
      },
      {
        path: "/gyms/gym-1/members/member-1/memberships",
        method: "POST",
        authorization: "Bearer token-1",
        body: {
          planId: "00000000-0000-4000-8000-000000000010",
          status: "active",
          startsAt: "2026-05-18T00:00:00.000Z",
          endsAt: "2026-06-18T00:00:00.000Z"
        }
      },
      {
        path: "/gyms/gym-1/membership-plans",
        method: "GET",
        authorization: "Bearer token-1"
      },
      {
        path: "/gyms/gym-1/membership-plans",
        method: "POST",
        authorization: "Bearer token-1",
        body: {
          name: "Monthly Unlimited",
          billingInterval: "monthly",
          priceCents: 9900,
          signupFeeCents: 2500,
          trialDays: 7,
          autoRenew: true,
          classAccessLimit: 12,
          isPublic: true
        }
      },
      {
        path: "/gyms/gym-1/membership-plans/plan-1",
        method: "PATCH",
        authorization: "Bearer token-1",
        body: {
          description: "Best for regular members",
          priceCents: 10900,
          trialDays: 14
        }
      },
      {
        path: "/gyms/gym-1/membership-plans/plan-1",
        method: "DELETE",
        authorization: "Bearer token-1"
      }
    ]);
  });

  it("builds leads and CRM requests through the shared member endpoints", async () => {
    const calls: Array<{
      path: string;
      method: string;
      authorization?: string;
      body?: unknown;
    }> = [];
    const client = new GymApiClient({
      baseUrl: "http://api.local",
      accessToken: "token-1",
      fetchImpl: (async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const resolved = url instanceof URL ? url : new URL(String(url));
        const headers = new Headers(init?.headers);
        const authorization = headers.get("authorization") ?? undefined;
        const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
        calls.push({
          path: `${resolved.pathname}${resolved.search}`,
          method: init?.method ?? "GET",
          ...(authorization ? { authorization } : {}),
          ...(body !== undefined ? { body } : {})
        });
        return jsonResponse({ ok: true });
      }) as typeof fetch
    });

    await client.listMembers("gym-1");
    await client.createMember("gym-1", {
      firstName: "Taylor",
      lastName: "Morgan",
      email: "taylor@example.com",
      phone: "555-0105",
      status: "lead",
      notes: "Requested a trial from the website.",
      tagNames: ["Website", "Trial Request"]
    });
    await client.updateMember("gym-1", "member-lead-1", {
      status: "trial",
      tagNames: ["Website", "Converted"],
      notes: "Booked intro session."
    });
    await client.updateMember("gym-1", "member-lead-1", {
      status: "active"
    });

    expect(calls).toEqual([
      {
        path: "/gyms/gym-1/members",
        method: "GET",
        authorization: "Bearer token-1"
      },
      {
        path: "/gyms/gym-1/members",
        method: "POST",
        authorization: "Bearer token-1",
        body: {
          firstName: "Taylor",
          lastName: "Morgan",
          email: "taylor@example.com",
          phone: "555-0105",
          status: "lead",
          notes: "Requested a trial from the website.",
          tagNames: ["Website", "Trial Request"]
        }
      },
      {
        path: "/gyms/gym-1/members/member-lead-1",
        method: "PATCH",
        authorization: "Bearer token-1",
        body: {
          status: "trial",
          tagNames: ["Website", "Converted"],
          notes: "Booked intro session."
        }
      },
      {
        path: "/gyms/gym-1/members/member-lead-1",
        method: "PATCH",
        authorization: "Bearer token-1",
        body: {
          status: "active"
        }
      }
    ]);
  });
});

function memoryTokenStore(accessToken: string, refreshToken: string): ApiTokenStore {
  let tokens: { accessToken: string; refreshToken: string } | undefined = {
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

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}
