import { BillingInterval, MemberStatus, MembershipStatus } from "@gym-platform/constants";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp, createServices, type Services } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";

interface TestApi {
  baseUrl: string;
  services: Services;
  request<T>(path: string, options?: RequestInit): Promise<{ response: Response; data: T }>;
  close(): Promise<void>;
}

let api: TestApi;

beforeEach(async () => {
  api = await startApi();
});

afterEach(async () => {
  await api.close();
});

describe("member portal booking routes", () => {
  it("lets a member view classes, book, waitlist, and only cancel their own bookings", async () => {
    const fixture = await createBookingFixture(api.services);

    const login = await ok<{ accessToken: string }>(
      "/member-auth/login",
      json({
        gymSlug: fixture.gymSlug,
        email: "jamie@example.com",
        password: "MemberPassword123"
      })
    );
    const taylorLogin = await ok<{ accessToken: string }>(
      "/member-auth/login",
      json({
        gymSlug: fixture.gymSlug,
        email: "taylor@example.com",
        password: "MemberPassword123"
      })
    );
    const schedule = await ok<{ sessions: Array<{ id: string }> }>(
      "/member-portal/classes?from=2026-05-17T00:00:00.000Z&to=2026-05-19T00:00:00.000Z",
      { headers: authHeaders(login.accessToken) }
    );
    const booking = await ok<{ id: string; status: string; memberId: string }>(
      `/member-portal/class-sessions/${fixture.sessionId}/bookings`,
      json({}, login.accessToken)
    );
    const waitlist = await ok<{ id: string; status: string; waitlistPosition: number }>(
      `/member-portal/class-sessions/${fixture.sessionId}/waitlist`,
      json({}, taylorLogin.accessToken)
    );
    const bookings = await ok<{ bookings: Array<{ id: string }> }>("/member-portal/bookings", {
      headers: authHeaders(login.accessToken)
    });
    await fails(
      `/member-portal/bookings/${booking.id}`,
      { method: "DELETE", headers: authHeaders(taylorLogin.accessToken) },
      404
    );
    const cancelled = await ok<{ booking: { status: string }; promotedBooking?: { id: string; status: string } }>(
      `/member-portal/bookings/${booking.id}`,
      { method: "DELETE", headers: authHeaders(login.accessToken) }
    );

    expect(schedule.sessions.map((session) => session.id)).toContain(fixture.sessionId);
    expect(booking.memberId).toBe(fixture.jamieId);
    expect(booking.status).toBe("booked");
    expect(waitlist.status).toBe("waitlisted");
    expect(waitlist.waitlistPosition).toBe(1);
    expect(bookings.bookings.map((entry) => entry.id)).toEqual([booking.id]);
    expect(cancelled.booking.status).toBe("cancelled");
    expect(cancelled.promotedBooking?.id).toBe(waitlist.id);
    expect(cancelled.promotedBooking?.status).toBe("booked");
  });
});

async function createBookingFixture(services: Services) {
  const owner = await services.authService.register({
    email: "owner@example.com",
    password: "Password123",
    firstName: "Demo",
    lastName: "Owner",
    gymName: "Demo Strength Club",
    timezone: "America/New_York",
    locale: "en-US"
  });
  if (!owner.gym) {
    throw new Error("Expected gym to be created.");
  }
  const location = await services.locationService.create(owner.gym.id, {
    name: "Main Floor",
    address: {
      line1: "100 Fitness Ave",
      city: "New York",
      region: "NY",
      postalCode: "10001",
      country: "US"
    },
    timezone: "America/New_York",
    operatingHours: {}
  });
  const plan = await services.membershipPlanService.create(owner.gym.id, {
    name: "Monthly Unlimited",
    billingInterval: BillingInterval.Monthly,
    priceCents: 9900,
    signupFeeCents: 0,
    trialDays: 0,
    autoRenew: true,
    isPublic: true
  });
  const jamie = await createPortalMember(services, owner.gym.id, "Jamie", "Rivera", "jamie@example.com", plan.id);
  await createPortalMember(services, owner.gym.id, "Taylor", "Morgan", "taylor@example.com", plan.id);
  const classType = await services.classScheduleService.createClassType(owner.gym.id, {
    name: "Strength Foundations",
    defaultDurationMinutes: 60,
    defaultCapacity: 1,
    defaultWaitlistCapacity: 2,
    isPublic: true
  });
  const session = await services.classScheduleService.createSession(owner.gym.id, {
    classTypeId: classType.id,
    locationId: location.id,
    startsAt: "2026-05-18T14:00:00.000Z",
    endsAt: "2026-05-18T15:00:00.000Z",
    capacity: 1,
    waitlistCapacity: 2,
    cancellationCutoffMinutes: 0,
    lateCancellationFeeCents: 0
  });
  return {
    gymSlug: owner.gym.slug,
    sessionId: session.id,
    jamieId: jamie.id
  };
}

async function createPortalMember(
  services: Services,
  gymId: string,
  firstName: string,
  lastName: string,
  email: string,
  planId: string
) {
  const member = await services.memberService.create(gymId, {
    firstName,
    lastName,
    email,
    status: MemberStatus.Active,
    tagNames: []
  });
  await services.memberMembershipService.assignPlan(gymId, member.id, {
    planId,
    status: MembershipStatus.Active
  });
  const invite = await services.memberPortalService.createPortalInvite(gymId, member.id);
  await services.memberPortalService.acceptPortalToken({
    token: invite.token,
    password: "MemberPassword123"
  });
  return member;
}

async function startApi(): Promise<TestApi> {
  const services = createServices(testConfig, fixedClock);
  const server = createServer(createApp(testConfig, services));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    baseUrl,
    services,
    request: async <T>(path: string, options: RequestInit = {}) => {
      const response = await fetch(`${baseUrl}${path}`, options);
      const data = (await response.json()) as T;
      return { response, data };
    },
    close: () => closeServer(server)
  };
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
