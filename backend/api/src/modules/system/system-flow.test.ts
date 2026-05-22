import { RoleName, StaffAuditAction, UserStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp, createServices, type Services } from "../../app.js";
import { generateTotpCode } from "../auth/auth.service.js";
import { fixedClock, testConfig } from "../../testUtils.js";

interface TestApi {
  baseUrl: string;
  services: Services;
  request<T>(path: string, options?: RequestInit): Promise<{ response: Response; data: T }>;
  close(): Promise<void>;
}

interface RegisterResponse {
  user: { id: string; email: string };
  gym?: { id: string; name: string; slug: string };
  accessToken: string;
  refreshToken: string;
  emailVerificationToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

interface GymResponse {
  id: string;
  name: string;
  logoUrl?: string;
  timezone: string;
  locale: string;
  onboardingCompletedSteps: string[];
}

interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  twoFactorRequired?: boolean;
}

interface TwoFactorSetupResponse {
  secret: string;
  otpauthUrl: string;
}

interface TwoFactorVerifyResponse {
  enabled: boolean;
  recoveryCodes: string[];
}

interface LocationResponse {
  id: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  timezone: string;
  phone?: string;
  operatingHours: Record<string, Array<{ opensAt: string; closesAt: string }>>;
  status: string;
  archivedAt?: string;
}

interface LocationListResponse {
  locations: LocationResponse[];
}

interface LocationRoomsResponse {
  rooms: Array<{
    locationId: string;
    name: string;
    sessionCount: number;
    nextSessionAt?: string;
  }>;
}

interface RoleResponse {
  id: string;
  name: string;
  permissions: string[];
  isSystem: boolean;
}

interface StaffInviteResponse {
  invite: {
    id: string;
    email: string;
    roleId: string;
    status: string;
    expiresAt: string;
  };
  inviteToken: string;
}

interface StaffInviteListResponse {
  invites: Array<{
    id: string;
    email: string;
    roleId: string;
    status: string;
  }>;
}

interface StaffInviteAcceptResponse {
  user: { id: string; email: string };
  gym: { id: string };
  membership: { roleId: string };
  invite: { status: string };
  accessToken: string;
  refreshToken: string;
}

interface StaffAccessListResponse {
  staff: Array<{
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    status: string;
  }>;
}

interface StaffAuditListResponse {
  entries: Array<{
    actorUserId: string;
    targetUserId: string;
    action: string;
    previousRoleId?: string;
    nextRoleId?: string;
    reason?: string;
  }>;
}

interface StaffShiftResponse {
  id: string;
  userId: string;
  locationId?: string;
  roleId: string;
  startsAt: string;
  endsAt: string;
  createdByUserId: string;
}

interface StaffShiftListResponse {
  shifts: StaffShiftResponse[];
}

interface StaffTimeEntryResponse {
  id: string;
  userId: string;
  locationId?: string;
  clockedInAt: string;
  clockedOutAt?: string;
  clockedInByUserId: string;
  clockedOutByUserId?: string;
}

interface StaffTimeEntryListResponse {
  entries: StaffTimeEntryResponse[];
}

interface MemberResponse {
  id: string;
  firstName: string;
  status: string;
  phone?: string;
}

interface PlanResponse {
  id: string;
  name: string;
  priceCents: number;
  status: string;
}

interface MemberMembershipResponse {
  id: string;
  memberId: string;
  planId: string;
  status: string;
}

interface ClassTypeResponse {
  id: string;
  name: string;
}

interface ClassSessionResponse {
  id: string;
  classTypeId: string;
  trainerUserId?: string;
  roomName?: string;
  capacity: number;
  waitlistCapacity: number;
}

interface BookingResponse {
  id: string;
  memberId: string;
  status: string;
  source: string;
  waitlistPosition?: number;
  staffOverride: boolean;
  overrideReason?: string;
  promotedAt?: string;
}

interface BookingCancellationResponse {
  booking: BookingResponse;
  promotedBooking?: BookingResponse;
}

interface CheckInCodeResponse {
  qrPayload: string;
  barcode?: string;
  barcodeFallback: string;
}

interface CheckInResponse {
  id: string;
  memberId: string;
  locationId: string;
  classSessionId?: string;
  bookingId?: string;
  status: string;
  method: string;
  staffOverride: boolean;
  deniedReason?: string;
}

interface AccessDeviceRegistrationResponse {
  device: { id: string; status: string; apiKeyPreview: string };
  apiKey: string;
}

interface AccessRuleResponse {
  id: string;
  locationId: string;
  planId?: string;
}

interface AccessEventResponse {
  unlock: boolean;
  reason: string;
  event: { id: string; decision: string; reason: string };
  memberId?: string;
}

let api: TestApi;

beforeEach(async () => {
  api = await startApi();
});

afterEach(async () => {
  await api.close();
});

describe("system API flow", () => {
  it("runs the owner onboarding, session, email, location, and logout flow", async () => {
    const registered = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: "owner@example.com",
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

    const gymSettings = await ok<GymResponse>(`/gyms/${gymId}`, {
      headers: authHeaders(registered.accessToken)
    });
    const updatedGymSettings = await ok<GymResponse>(
      `/gyms/${gymId}`,
      json(
        {
          name: "Demo Performance Club",
          logoUrl: "https://example.com/logo.png",
          brandColors: { primary: "#111827", secondary: "#2563EB" },
          businessInfo: { legalName: "Demo Performance Club LLC", email: "hello@example.com" },
          operatingHours: { mon: [{ opensAt: "06:00", closesAt: "22:00" }] },
          onboardingCompletedSteps: ["gym-details", "location-details"]
        },
        registered.accessToken,
        "PATCH"
      )
    );
    expect(gymSettings.name).toBe("Demo Strength Club");
    expect(updatedGymSettings.name).toBe("Demo Performance Club");
    expect(updatedGymSettings.logoUrl).toBe("https://example.com/logo.png");
    expect(updatedGymSettings.onboardingCompletedSteps).toContain("location-details");

    const verified = await ok<{ user: { emailVerifiedAt?: string } }>(
      "/auth/verify-email",
      json({ token: registered.emailVerificationToken })
    );
    expect(verified.user.emailVerifiedAt).toBe("2026-05-16T12:00:00.000Z");

    const createdLocation = await ok<LocationResponse>(
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
    expect(createdLocation.name).toBe("Main Floor");

    const listed = await ok<LocationListResponse>(`/gyms/${gymId}/locations`, {
      headers: authHeaders(registered.accessToken)
    });
    const detail = await ok<LocationResponse>(`/gyms/${gymId}/locations/${createdLocation.id}`, {
      headers: authHeaders(registered.accessToken)
    });
    expect(listed.locations).toHaveLength(1);
    expect(detail.id).toBe(createdLocation.id);

    const updated = await ok<LocationResponse>(
      `/gyms/${gymId}/locations/${createdLocation.id}`,
      json({ name: "Main Studio" }, registered.accessToken, "PATCH")
    );
    expect(updated.name).toBe("Main Studio");

    const archived = await ok<LocationResponse>(`/gyms/${gymId}/locations/${createdLocation.id}`, {
      method: "DELETE",
      headers: authHeaders(registered.accessToken)
    });
    expect(archived.status).toBe("archived");

    const refreshed = await ok<RefreshResponse>(
      "/auth/refresh",
      json({ refreshToken: registered.refreshToken })
    );
    await fails("/auth/refresh", json({ refreshToken: registered.refreshToken }), 401);

    await ok("/auth/logout", json({ refreshToken: refreshed.refreshToken }));
    await fails("/auth/refresh", json({ refreshToken: refreshed.refreshToken }), 401);
  });

  it("protects gym-scoped routes from users outside the tenant", async () => {
    const owner = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: "owner@example.com",
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );
    const outsider = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: "outsider@example.com",
        password: "Password123",
        firstName: "Out",
        lastName: "Sider",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );

    await fails(
      `/gyms/${owner.gym?.id}/locations`,
      { headers: authHeaders(outsider.accessToken) },
      403
    );
  });

  it("creates gym locations through the location endpoint and rejects duplicates", async () => {
    const owner = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: "owner@example.com",
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );
    const gymId = owner.gym?.id ?? "";

    const createdLocation = await ok<LocationResponse>(
      `/gyms/${gymId}/locations`,
      json(
        {
          name: "Downtown Annex",
          address: {
            line1: "200 Fitness Ave",
            line2: "Suite 300",
            city: "New York",
            region: "NY",
            postalCode: "10002",
            country: "us"
          },
          timezone: "America/New_York",
          phone: "555-0100"
        },
        owner.accessToken
      )
    );

    expect(createdLocation.name).toBe("Downtown Annex");
    expect(createdLocation.address.line2).toBe("Suite 300");
    expect(createdLocation.address.country).toBe("US");
    expect(createdLocation.timezone).toBe("America/New_York");
    expect(createdLocation.phone).toBe("555-0100");
    expect(createdLocation.operatingHours).toEqual({});
    expect(createdLocation.status).toBe("active");

    const { response, data } = await api.request<{ error?: { code?: string; message?: string } }>(
      `/gyms/${gymId}/locations`,
      json(
        {
          name: "  downtown annex  ",
          address: {
            line1: "201 Fitness Ave",
            city: "New York",
            region: "NY",
            postalCode: "10003",
            country: "US"
          },
          timezone: "America/New_York"
        },
        owner.accessToken
      )
    );

    expect(response.status).toBe(409);
    expect(data.error?.code).toBe("location_name_exists");
  });

  it("edits gym locations through the location endpoint and rejects duplicate names", async () => {
    const owner = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: "owner@example.com",
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );
    const gymId = owner.gym?.id ?? "";

    const originalLocation = await ok<LocationResponse>(
      `/gyms/${gymId}/locations`,
      json(
        {
          name: "Main Floor",
          address: {
            line1: "100 Fitness Ave",
            line2: "Suite 100",
            city: "New York",
            region: "NY",
            postalCode: "10001",
            country: "US"
          },
          timezone: "America/New_York",
          phone: "555-0100",
          operatingHours: { mon: [{ opensAt: "06:00", closesAt: "22:00" }] }
        },
        owner.accessToken
      )
    );
    const otherLocation = await ok<LocationResponse>(
      `/gyms/${gymId}/locations`,
      json(
        {
          name: "Uptown Studio",
          address: {
            line1: "300 Fitness Ave",
            city: "New York",
            region: "NY",
            postalCode: "10004",
            country: "US"
          },
          timezone: "America/New_York"
        },
        owner.accessToken
      )
    );

    const updatedLocation = await ok<LocationResponse>(
      `/gyms/${gymId}/locations/${originalLocation.id}`,
      json(
        {
          name: "Midtown Studio",
          address: {
            line1: "150 Fitness Ave",
            city: "Brooklyn",
            region: "NY",
            postalCode: "11201",
            country: "us"
          },
          timezone: "America/Chicago",
          phone: "",
          operatingHours: { tue: [{ opensAt: "07:00", closesAt: "21:00" }] }
        },
        owner.accessToken,
        "PATCH"
      )
    );

    expect(updatedLocation.name).toBe("Midtown Studio");
    expect(updatedLocation.address.line1).toBe("150 Fitness Ave");
    expect(updatedLocation.address.line2).toBeUndefined();
    expect(updatedLocation.address.city).toBe("Brooklyn");
    expect(updatedLocation.address.country).toBe("US");
    expect(updatedLocation.timezone).toBe("America/Chicago");
    expect(updatedLocation.phone).toBeUndefined();
    expect(updatedLocation.operatingHours).toEqual({
      tue: [{ opensAt: "07:00", closesAt: "21:00" }]
    });

    const { response, data } = await api.request<{ error?: { code?: string; message?: string } }>(
      `/gyms/${gymId}/locations/${originalLocation.id}`,
      json({ name: otherLocation.name }, owner.accessToken, "PATCH")
    );

    expect(response.status).toBe(409);
    expect(data.error?.code).toBe("location_name_exists");
  });

  it("archives gym locations through the location endpoint and removes them from active access", async () => {
    const owner = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: "owner@example.com",
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );
    const gymId = owner.gym?.id ?? "";

    const activeLocation = await ok<LocationResponse>(
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
          timezone: "America/New_York"
        },
        owner.accessToken
      )
    );

    const archivedLocation = await ok<LocationResponse>(`/gyms/${gymId}/locations/${activeLocation.id}`, {
      method: "DELETE",
      headers: authHeaders(owner.accessToken)
    });

    expect(archivedLocation.id).toBe(activeLocation.id);
    expect(archivedLocation.status).toBe("archived");
    expect(archivedLocation.archivedAt).toBe("2026-05-16T12:00:00.000Z");

    const listedLocations = await ok<LocationListResponse>(`/gyms/${gymId}/locations`, {
      headers: authHeaders(owner.accessToken)
    });
    expect(listedLocations.locations).toHaveLength(0);

    const detail = await api.request<{ error?: { code?: string } }>(
      `/gyms/${gymId}/locations/${activeLocation.id}`,
      { headers: authHeaders(owner.accessToken) }
    );
    expect(detail.response.status).toBe(404);
    expect(detail.data.error?.code).toBe("not_found");

    const update = await api.request<{ error?: { code?: string } }>(
      `/gyms/${gymId}/locations/${activeLocation.id}`,
      json({ name: "Reopened Floor" }, owner.accessToken, "PATCH")
    );
    expect(update.response.status).toBe(404);
    expect(update.data.error?.code).toBe("not_found");
  });

  it("assigns roles only when the actor has role-assignment permission", async () => {
    const owner = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: "owner@example.com",
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );
    const staff = await api.services.authService.register({
      email: "staff@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Staff",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const gymId = owner.gym?.id ?? "";
    const memberRole = await api.services.roleService.getRoleByName(gymId, RoleName.Member);
    const trainerRole = await api.services.roleService.getRoleByName(gymId, RoleName.Trainer);
    const membershipId = randomUUID();
    await api.services.repositories.gymUsers.createGymUser({
      id: membershipId,
      gymId,
      userId: staff.user.id,
      roleId: memberRole.id,
      status: UserStatus.Active,
      createdAt: fixedClock.now(),
      updatedAt: fixedClock.now()
    });

    const assigned = await ok<{ roleId: string }>(
      `/gyms/${gymId}/roles/assign`,
      json({ userId: staff.user.id, roleId: trainerRole.id }, owner.accessToken)
    );
    const location = await ok<LocationResponse>(
      `/gyms/${gymId}/locations`,
      json(
        {
          name: "Staff Schedule Floor",
          address: {
            line1: "100 Fitness Ave",
            city: "New York",
            region: "NY",
            postalCode: "10001",
            country: "US"
          },
          timezone: "America/New_York",
          operatingHours: {}
        },
        owner.accessToken
      )
    );
    const shift = await ok<StaffShiftResponse>(
      `/gyms/${gymId}/staff/shifts`,
      json(
        {
          userId: staff.user.id,
          locationId: location.id,
          startsAt: "2026-05-18T13:00:00.000Z",
          endsAt: "2026-05-18T21:00:00.000Z"
        },
        owner.accessToken
      )
    );

    expect(assigned.roleId).toBe(trainerRole.id);
    expect(shift.userId).toBe(staff.user.id);
    expect(shift.locationId).toBe(location.id);
    expect(shift.roleId).toBe(trainerRole.id);
    expect(shift.createdByUserId).toBe(owner.user.id);
    const staffShifts = await ok<StaffShiftListResponse>(`/gyms/${gymId}/staff/shifts`, {
      headers: authHeaders(owner.accessToken)
    });
    expect(staffShifts.shifts[0]?.id).toBe(shift.id);
    const myStaffShifts = await ok<StaffShiftListResponse>(`/gyms/${gymId}/staff/shifts/me`, {
      headers: authHeaders(staff.accessToken)
    });
    expect(myStaffShifts.shifts[0]?.id).toBe(shift.id);
    const allStaffShiftsAsTrainer = await api.request<{ error?: { code?: string } }>(
      `/gyms/${gymId}/staff/shifts`,
      { headers: authHeaders(staff.accessToken) }
    );
    expect(allStaffShiftsAsTrainer.response.status).toBe(403);
    const selfClockedIn = await ok<StaffTimeEntryResponse>(
      `/gyms/${gymId}/staff/time-entries/me/clock-in`,
      json({ locationId: location.id }, staff.accessToken)
    );
    expect(selfClockedIn.userId).toBe(staff.user.id);
    expect(selfClockedIn.clockedInByUserId).toBe(staff.user.id);
    const myClockEntries = await ok<StaffTimeEntryListResponse>(
      `/gyms/${gymId}/staff/time-entries/me`,
      {
        headers: authHeaders(staff.accessToken)
      }
    );
    expect(myClockEntries.entries[0]?.id).toBe(selfClockedIn.id);
    const allTimeEntriesAsTrainer = await api.request<{ error?: { code?: string } }>(
      `/gyms/${gymId}/staff/time-entries`,
      { headers: authHeaders(staff.accessToken) }
    );
    expect(allTimeEntriesAsTrainer.response.status).toBe(403);
    const selfClockedOut = await ok<StaffTimeEntryResponse>(
      `/gyms/${gymId}/staff/time-entries/me/clock-out`,
      json({}, staff.accessToken)
    );
    expect(selfClockedOut.id).toBe(selfClockedIn.id);
    expect(selfClockedOut.clockedOutByUserId).toBe(staff.user.id);
    const clockedIn = await ok<StaffTimeEntryResponse>(
      `/gyms/${gymId}/staff/time-entries/clock-in`,
      json({ userId: staff.user.id, locationId: location.id }, owner.accessToken)
    );
    expect(clockedIn.userId).toBe(staff.user.id);
    expect(clockedIn.locationId).toBe(location.id);
    expect(clockedIn.clockedOutAt).toBeUndefined();
    const clockEntries = await ok<StaffTimeEntryListResponse>(
      `/gyms/${gymId}/staff/time-entries`,
      {
        headers: authHeaders(owner.accessToken)
      }
    );
    expect(clockEntries.entries.some((entry) => entry.id === clockedIn.id)).toBe(true);
    const clockedOut = await ok<StaffTimeEntryResponse>(
      `/gyms/${gymId}/staff/time-entries/clock-out`,
      json({ userId: staff.user.id }, owner.accessToken)
    );
    expect(clockedOut.id).toBe(clockedIn.id);
    expect(clockedOut.clockedOutByUserId).toBe(owner.user.id);
    const staffAccess = await ok<StaffAccessListResponse>(`/gyms/${gymId}/staff`, {
      headers: authHeaders(owner.accessToken)
    });
    const roleAudit = await ok<StaffAuditListResponse>(`/gyms/${gymId}/staff/audit`, {
      headers: authHeaders(owner.accessToken)
    });
    const removed = await ok<{ status: string }>(
      `/gyms/${gymId}/staff/${staff.user.id}`,
      json({ reason: "Seasonal staff ended" }, owner.accessToken, "DELETE")
    );
    const removalAudit = await ok<StaffAuditListResponse>(`/gyms/${gymId}/staff/audit`, {
      headers: authHeaders(owner.accessToken)
    });

    expect(staffAccess.staff.find((entry) => entry.userId === staff.user.id)?.roleName).toBe(
      RoleName.Trainer
    );
    expect(roleAudit.entries.some((entry) => entry.action === StaffAuditAction.RoleChanged)).toBe(
      true
    );
    expect(removed.status).toBe(UserStatus.Disabled);
    expect(
      removalAudit.entries.some(
        (entry) =>
          entry.action === StaffAuditAction.AccessRemoved &&
          entry.targetUserId === staff.user.id &&
          entry.reason === "Seasonal staff ended"
      )
    ).toBe(true);

    const roles = await ok<{ roles: RoleResponse[] }>(`/gyms/${gymId}/roles`, {
      headers: authHeaders(owner.accessToken)
    });
    const customRole = await ok<RoleResponse>(
      `/gyms/${gymId}/roles`,
      json(
        {
          name: "Operations Lead",
          permissions: ["gym:read", "member:read", "report:read"]
        },
        owner.accessToken
      )
    );
    const editedCustomRole = await ok<RoleResponse>(
      `/gyms/${gymId}/roles/${customRole.id}`,
      json(
        {
          name: "Assistant Operations Lead",
          permissions: ["gym:read", "member:read", "staff:read"]
        },
        owner.accessToken,
        "PATCH"
      )
    );
    const managerRole = roles.roles.find((role) => role.name === RoleName.Manager);
    if (!managerRole) {
      throw new Error("Expected manager role to exist.");
    }

    expect(customRole.isSystem).toBe(false);
    expect(customRole.permissions).toEqual(["gym:read", "member:read", "report:read"]);
    expect(editedCustomRole.name).toBe("Assistant Operations Lead");
    expect(editedCustomRole.permissions).toEqual(["gym:read", "member:read", "staff:read"]);

    const invite = await ok<StaffInviteResponse>(
      `/gyms/${gymId}/staff/invites`,
      json({ email: "manager@example.com", roleId: managerRole.id }, owner.accessToken)
    );
    const inviteList = await ok<StaffInviteListResponse>(`/gyms/${gymId}/staff/invites`, {
      headers: authHeaders(owner.accessToken)
    });
    const acceptedInvite = await ok<StaffInviteAcceptResponse>(
      "/staff/invites/accept",
      json({
        token: invite.inviteToken,
        firstName: "Demo",
        lastName: "Manager",
        password: "Password123"
      })
    );

    expect(invite.invite.email).toBe("manager@example.com");
    expect(invite.invite.roleId).toBe(managerRole.id);
    expect(invite.invite.status).toBe("pending");
    expect(invite.inviteToken).toBeTruthy();
    expect(inviteList.invites[0]?.email).toBe("manager@example.com");
    expect(acceptedInvite.user.email).toBe("manager@example.com");
    expect(acceptedInvite.gym.id).toBe(gymId);
    expect(acceptedInvite.membership.roleId).toBe(managerRole.id);
    expect(acceptedInvite.invite.status).toBe("accepted");
    expect(acceptedInvite.accessToken).toBeTruthy();
    await fails(
      "/staff/invites/accept",
      json({
        token: invite.inviteToken,
        firstName: "Demo",
        lastName: "Manager",
        password: "Password123"
      }),
      400
    );
  });

  it("runs member, plan, class schedule, and public schedule endpoints", async () => {
    const registered = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: "owner@example.com",
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );
    const gymId = registered.gym?.id ?? "";

    const location = await ok<LocationResponse>(
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

    const member = await ok<MemberResponse>(
      `/gyms/${gymId}/members`,
      json(
        {
          firstName: "Jamie",
          lastName: "Rivera",
          email: "jamie@example.com",
          phone: "555-0101",
          barcode: "MEM-100",
          tagNames: ["founding-member"]
        },
        registered.accessToken
      )
    );
    const waitlistMember = await ok<MemberResponse>(
      `/gyms/${gymId}/members`,
      json(
        {
          firstName: "Taylor",
          lastName: "Morgan",
          email: "taylor@example.com",
          phone: "555-0103",
          barcode: "MEM-101",
          tagNames: ["trial"]
        },
        registered.accessToken
      )
    );
    const manualMember = await ok<MemberResponse>(
      `/gyms/${gymId}/members`,
      json(
        {
          firstName: "Jordan",
          lastName: "Lee",
          email: "jordan@example.com",
          phone: "555-0104",
          barcode: "MEM-102",
          tagNames: ["manual"]
        },
        registered.accessToken
      )
    );
    const members = await ok<{ members: MemberResponse[] }>(`/gyms/${gymId}/members`, {
      headers: authHeaders(registered.accessToken)
    });

    const plan = await ok<PlanResponse>(
      `/gyms/${gymId}/membership-plans`,
      json(
        {
          name: "Monthly Unlimited",
          billingInterval: "monthly",
          priceCents: 9900,
          signupFeeCents: 0,
          trialDays: 7,
          autoRenew: true,
          isPublic: true
        },
        registered.accessToken
      )
    );
    const updatedPlan = await ok<PlanResponse>(
      `/gyms/${gymId}/membership-plans/${plan.id}`,
      json({ priceCents: 10900 }, registered.accessToken, "PATCH")
    );
    const memberMembership = await ok<MemberMembershipResponse>(
      `/gyms/${gymId}/members/${member.id}/memberships`,
      json({ planId: plan.id }, registered.accessToken)
    );
    await ok<MemberMembershipResponse>(
      `/gyms/${gymId}/members/${waitlistMember.id}/memberships`,
      json({ planId: plan.id }, registered.accessToken)
    );
    await ok<MemberMembershipResponse>(
      `/gyms/${gymId}/members/${manualMember.id}/memberships`,
      json({ planId: plan.id }, registered.accessToken)
    );
    const memberMemberships = await ok<{ memberships: MemberMembershipResponse[] }>(
      `/gyms/${gymId}/members/${member.id}/memberships`,
      { headers: authHeaders(registered.accessToken) }
    );

    const classType = await ok<ClassTypeResponse>(
      `/gyms/${gymId}/class-types`,
      json(
        {
          name: "Strength Foundations",
          defaultDurationMinutes: 60,
          defaultCapacity: 16,
          defaultWaitlistCapacity: 4,
          isPublic: true
        },
        registered.accessToken
      )
    );
    const classSession = await ok<ClassSessionResponse>(
      `/gyms/${gymId}/class-sessions`,
      json(
        {
          classTypeId: classType.id,
          locationId: location.id,
          trainerUserId: registered.user.id,
          roomName: "Studio A",
          startsAt: "2026-05-18T14:00:00.000Z",
          endsAt: "2026-05-18T15:00:00.000Z",
          capacity: 1,
          waitlistCapacity: 1
        },
        registered.accessToken
      )
    );
    const publicSchedule = await ok<ClassSessionResponse[]>(
      `/public/gyms/${registered.gym?.slug}/schedule?from=2026-05-18T00:00:00.000Z&to=2026-05-19T00:00:00.000Z`
    );
    const filteredPublicSchedule = await ok<ClassSessionResponse[]>(
      `/public/gyms/${registered.gym?.slug}/schedule?from=2026-05-18T00:00:00.000Z&to=2026-05-19T00:00:00.000Z&locationId=${location.id}`
    );
    const locationRooms = await ok<LocationRoomsResponse>(
      `/gyms/${gymId}/locations/${location.id}/rooms`,
      { headers: authHeaders(registered.accessToken) }
    );

    const booking = await ok<BookingResponse>(
      `/gyms/${gymId}/class-sessions/${classSession.id}/bookings`,
      json({ memberId: member.id }, registered.accessToken)
    );
    await fails(
      `/gyms/${gymId}/class-sessions/${classSession.id}/bookings`,
      json({ memberId: waitlistMember.id }, registered.accessToken),
      409
    );
    const waitlistSpot = await ok<BookingResponse>(
      `/gyms/${gymId}/class-sessions/${classSession.id}/waitlist`,
      json({ memberId: waitlistMember.id }, registered.accessToken)
    );
    const listedBookings = await ok<{ bookings: BookingResponse[] }>(
      `/gyms/${gymId}/class-sessions/${classSession.id}/bookings`,
      { headers: authHeaders(registered.accessToken) }
    );
    const cancelledBooking = await ok<BookingCancellationResponse>(
      `/gyms/${gymId}/class-bookings/${booking.id}`,
      {
        method: "DELETE",
        headers: authHeaders(registered.accessToken)
      }
    );
    const manualBooking = await ok<BookingResponse>(
      `/gyms/${gymId}/class-sessions/${classSession.id}/bookings/manual`,
      json(
        {
          memberId: manualMember.id,
          overrideCapacity: true,
          overrideReason: "Staff approved extra spot."
        },
        registered.accessToken
      )
    );
    const checkInCode = await ok<CheckInCodeResponse>(
      `/gyms/${gymId}/members/${waitlistMember.id}/check-in-code`,
      { headers: authHeaders(registered.accessToken) }
    );
    const classCheckIn = await ok<CheckInResponse>(
      `/gyms/${gymId}/check-ins`,
      json(
        {
          qrPayload: checkInCode.qrPayload,
          locationId: location.id,
          classSessionId: classSession.id,
          method: "qr_code"
        },
        registered.accessToken
      )
    );
    const deniedCheckIn = await ok<CheckInResponse>(
      `/gyms/${gymId}/check-ins`,
      json(
        {
          barcode: "MEM-100",
          locationId: location.id,
          classSessionId: classSession.id,
          method: "barcode"
        },
        registered.accessToken
      )
    );
    const listedCheckIns = await ok<{ checkIns: CheckInResponse[] }>(
      `/gyms/${gymId}/members/${waitlistMember.id}/check-ins`,
      { headers: authHeaders(registered.accessToken) }
    );
    const accessDevice = await ok<AccessDeviceRegistrationResponse>(
      `/gyms/${gymId}/access/devices`,
      json({ name: "Front Door", locationId: location.id }, registered.accessToken)
    );
    const accessRule = await ok<AccessRuleResponse>(
      `/gyms/${gymId}/access/rules`,
      json(
        { name: "Monthly front door", locationId: location.id, planId: plan.id },
        registered.accessToken
      )
    );
    const heartbeat = await ok<{ status: string }>(
      "/access/device-heartbeats",
      json({ apiKey: accessDevice.apiKey })
    );
    const accessAllowed = await ok<AccessEventResponse>(
      "/access/device-events",
      json({ apiKey: accessDevice.apiKey, barcode: "MEM-101" })
    );
    const accessDenied = await ok<AccessEventResponse>(
      "/access/device-events",
      json({ apiKey: accessDevice.apiKey, barcode: "UNKNOWN-MEMBER" })
    );
    const listedAccessEvents = await ok<{ events: Array<{ decision: string; reason: string }> }>(
      `/gyms/${gymId}/access/events`,
      { headers: authHeaders(registered.accessToken) }
    );
    const rotatedAccessDevice = await ok<AccessDeviceRegistrationResponse>(
      `/gyms/${gymId}/access/devices/${accessDevice.device.id}/rotate-key`,
      json({}, registered.accessToken)
    );
    const listedAccessDevices = await ok<{ devices: Array<{ id: string; status: string }> }>(
      `/gyms/${gymId}/access/devices`,
      { headers: authHeaders(registered.accessToken) }
    );

    const updatedMember = await ok<MemberResponse>(
      `/gyms/${gymId}/members/${member.id}`,
      json({ phone: "555-0102", status: "frozen" }, registered.accessToken, "PATCH")
    );
    const archivedMember = await ok<MemberResponse>(`/gyms/${gymId}/members/${member.id}`, {
      method: "DELETE",
      headers: authHeaders(registered.accessToken)
    });
    const archivedPlan = await ok<PlanResponse>(`/gyms/${gymId}/membership-plans/${plan.id}`, {
      method: "DELETE",
      headers: authHeaders(registered.accessToken)
    });

    expect(updatedMember.phone).toBe("555-0102");
    expect(members.members).toHaveLength(3);
    expect(updatedPlan.priceCents).toBe(10900);
    expect(memberMembership.planId).toBe(plan.id);
    expect(memberMembership.status).toBe("active");
    expect(memberMemberships.memberships).toHaveLength(1);
    expect(classSession.capacity).toBe(1);
    expect(classSession.waitlistCapacity).toBe(1);
    expect(classSession.trainerUserId).toBe(registered.user.id);
    expect(classSession.roomName).toBe("Studio A");
    expect(publicSchedule).toHaveLength(1);
    expect(publicSchedule[0]?.id).toBe(classSession.id);
    expect(filteredPublicSchedule[0]?.id).toBe(classSession.id);
    expect(locationRooms.rooms[0]?.name).toBe("Studio A");
    expect(booking.status).toBe("booked");
    expect(waitlistSpot.status).toBe("waitlisted");
    expect(waitlistSpot.waitlistPosition).toBe(1);
    expect(listedBookings.bookings).toHaveLength(2);
    expect(cancelledBooking.booking.status).toBe("cancelled");
    expect(cancelledBooking.promotedBooking?.id).toBe(waitlistSpot.id);
    expect(cancelledBooking.promotedBooking?.status).toBe("booked");
    expect(manualBooking.status).toBe("booked");
    expect(manualBooking.source).toBe("staff");
    expect(manualBooking.staffOverride).toBe(true);
    expect(manualBooking.overrideReason).toMatch(/extra spot/i);
    expect(checkInCode.barcode).toBe("MEM-101");
    expect(classCheckIn.status).toBe("allowed");
    expect(classCheckIn.method).toBe("qr_code");
    expect(classCheckIn.bookingId).toBe(waitlistSpot.id);
    expect(deniedCheckIn.status).toBe("denied");
    expect(deniedCheckIn.deniedReason).toBe("class_booking_required");
    expect(listedCheckIns.checkIns).toHaveLength(1);
    expect(accessDevice.apiKey).toMatch(/^ak_/);
    expect(accessRule.planId).toBe(plan.id);
    expect(heartbeat.status).toBe("active");
    expect(accessAllowed.unlock).toBe(true);
    expect(accessAllowed.reason).toBe("access_granted");
    expect(accessDenied.unlock).toBe(false);
    expect(accessDenied.reason).toBe("member_not_found");
    expect(listedAccessEvents.events).toHaveLength(2);
    expect(rotatedAccessDevice.apiKey).not.toBe(accessDevice.apiKey);
    expect(listedAccessDevices.devices[0]?.id).toBe(accessDevice.device.id);
    expect(archivedMember.status).toBe("archived");
    expect(archivedPlan.status).toBe("archived");
  });

  it("resets passwords and revokes active refresh tokens", async () => {
    const owner = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: "owner@example.com",
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );
    const forgot = await ok<{ resetToken?: string }>(
      "/auth/forgot-password",
      json({ email: "owner@example.com" })
    );

    await ok(
      "/auth/reset-password",
      json({ token: forgot.resetToken, password: "NewPassword123" })
    );
    await fails("/auth/refresh", json({ refreshToken: owner.refreshToken }), 401);

    const login = await ok<{ user: { email: string } }>(
      "/auth/login",
      json({ email: "owner@example.com", password: "NewPassword123" })
    );
    expect(login.user.email).toBe("owner@example.com");
  });

  it("sets up two-factor auth and supports recovery code login", async () => {
    const owner = await ok<RegisterResponse>(
      "/auth/register",
      json({
        email: "owner@example.com",
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
      })
    );
    const setup = await ok<TwoFactorSetupResponse>("/auth/2fa/setup", {
      method: "POST",
      headers: authHeaders(owner.accessToken)
    });
    const verify = await ok<TwoFactorVerifyResponse>(
      "/auth/2fa/verify",
      json({ code: generateTotpCode(setup.secret, fixedClock.now()) }, owner.accessToken)
    );

    const challenged = await ok<LoginResponse>(
      "/auth/login",
      json({ email: "owner@example.com", password: "Password123" })
    );
    const totpLogin = await ok<LoginResponse>(
      "/auth/login",
      json({
        email: "owner@example.com",
        password: "Password123",
        twoFactorCode: generateTotpCode(setup.secret, fixedClock.now())
      })
    );
    const recoveryLogin = await ok<LoginResponse>(
      "/auth/login",
      json({
        email: "owner@example.com",
        password: "Password123",
        recoveryCode: verify.recoveryCodes[0]
      })
    );

    expect(setup.otpauthUrl).toContain("otpauth://totp");
    expect(verify.enabled).toBe(true);
    expect(verify.recoveryCodes).toHaveLength(8);
    expect(challenged.twoFactorRequired).toBe(true);
    expect(totpLogin.accessToken).toBeTruthy();
    expect(recoveryLogin.accessToken).toBeTruthy();
    await fails(
      "/auth/login",
      json({
        email: "owner@example.com",
        password: "Password123",
        recoveryCode: verify.recoveryCodes[0]
      }),
      401
    );
  });
});

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
