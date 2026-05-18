import { RoleName, StaffAuditAction, UserStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp, createServices } from "../../app.js";
import { generateTotpCode } from "../auth/auth.service.js";
import { fixedClock, testConfig } from "../../testUtils.js";
let api;
beforeEach(async () => {
    api = await startApi();
});
afterEach(async () => {
    await api.close();
});
describe("system API flow", () => {
    it("runs the owner onboarding, session, email, location, and logout flow", async () => {
        const registered = await ok("/auth/register", json({
            email: "owner@example.com",
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
        const gymSettings = await ok(`/gyms/${gymId}`, {
            headers: authHeaders(registered.accessToken)
        });
        const updatedGymSettings = await ok(`/gyms/${gymId}`, json({
            name: "Demo Performance Club",
            logoUrl: "https://example.com/logo.png",
            brandColors: { primary: "#111827", secondary: "#2563EB" },
            businessInfo: { legalName: "Demo Performance Club LLC", email: "hello@example.com" },
            operatingHours: { mon: [{ opensAt: "06:00", closesAt: "22:00" }] },
            onboardingCompletedSteps: ["gym-details", "location-details"]
        }, registered.accessToken, "PATCH"));
        expect(gymSettings.name).toBe("Demo Strength Club");
        expect(updatedGymSettings.name).toBe("Demo Performance Club");
        expect(updatedGymSettings.logoUrl).toBe("https://example.com/logo.png");
        expect(updatedGymSettings.onboardingCompletedSteps).toContain("location-details");
        const verified = await ok("/auth/verify-email", json({ token: registered.emailVerificationToken }));
        expect(verified.user.emailVerifiedAt).toBe("2026-05-16T12:00:00.000Z");
        const createdLocation = await ok(`/gyms/${gymId}/locations`, json({
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
        expect(createdLocation.name).toBe("Main Floor");
        const listed = await ok(`/gyms/${gymId}/locations`, {
            headers: authHeaders(registered.accessToken)
        });
        const detail = await ok(`/gyms/${gymId}/locations/${createdLocation.id}`, {
            headers: authHeaders(registered.accessToken)
        });
        expect(listed.locations).toHaveLength(1);
        expect(detail.id).toBe(createdLocation.id);
        const updated = await ok(`/gyms/${gymId}/locations/${createdLocation.id}`, json({ name: "Main Studio" }, registered.accessToken, "PATCH"));
        expect(updated.name).toBe("Main Studio");
        const archived = await ok(`/gyms/${gymId}/locations/${createdLocation.id}`, {
            method: "DELETE",
            headers: authHeaders(registered.accessToken)
        });
        expect(archived.status).toBe("archived");
        const refreshed = await ok("/auth/refresh", json({ refreshToken: registered.refreshToken }));
        await fails("/auth/refresh", json({ refreshToken: registered.refreshToken }), 401);
        await ok("/auth/logout", json({ refreshToken: refreshed.refreshToken }));
        await fails("/auth/refresh", json({ refreshToken: refreshed.refreshToken }), 401);
    });
    it("protects gym-scoped routes from users outside the tenant", async () => {
        const owner = await ok("/auth/register", json({
            email: "owner@example.com",
            password: "Password123",
            firstName: "Demo",
            lastName: "Owner",
            gymName: "Demo Strength Club",
            timezone: "America/New_York",
            locale: "en-US"
        }));
        const outsider = await ok("/auth/register", json({
            email: "outsider@example.com",
            password: "Password123",
            firstName: "Out",
            lastName: "Sider",
            timezone: "America/New_York",
            locale: "en-US"
        }));
        await fails(`/gyms/${owner.gym?.id}/locations`, { headers: authHeaders(outsider.accessToken) }, 403);
    });
    it("assigns roles only when the actor has role-assignment permission", async () => {
        const owner = await ok("/auth/register", json({
            email: "owner@example.com",
            password: "Password123",
            firstName: "Demo",
            lastName: "Owner",
            gymName: "Demo Strength Club",
            timezone: "America/New_York",
            locale: "en-US"
        }));
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
        const assigned = await ok(`/gyms/${gymId}/roles/assign`, json({ userId: staff.user.id, roleId: trainerRole.id }, owner.accessToken));
        const location = await ok(`/gyms/${gymId}/locations`, json({
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
        }, owner.accessToken));
        const shift = await ok(`/gyms/${gymId}/staff/shifts`, json({
            userId: staff.user.id,
            locationId: location.id,
            startsAt: "2026-05-18T13:00:00.000Z",
            endsAt: "2026-05-18T21:00:00.000Z"
        }, owner.accessToken));
        expect(assigned.roleId).toBe(trainerRole.id);
        expect(shift.userId).toBe(staff.user.id);
        expect(shift.locationId).toBe(location.id);
        expect(shift.roleId).toBe(trainerRole.id);
        expect(shift.createdByUserId).toBe(owner.user.id);
        const staffAccess = await ok(`/gyms/${gymId}/staff`, {
            headers: authHeaders(owner.accessToken)
        });
        const roleAudit = await ok(`/gyms/${gymId}/staff/audit`, {
            headers: authHeaders(owner.accessToken)
        });
        const removed = await ok(`/gyms/${gymId}/staff/${staff.user.id}`, json({ reason: "Seasonal staff ended" }, owner.accessToken, "DELETE"));
        const removalAudit = await ok(`/gyms/${gymId}/staff/audit`, {
            headers: authHeaders(owner.accessToken)
        });
        expect(staffAccess.staff.find((entry) => entry.userId === staff.user.id)?.roleName).toBe(RoleName.Trainer);
        expect(roleAudit.entries.some((entry) => entry.action === StaffAuditAction.RoleChanged)).toBe(true);
        expect(removed.status).toBe(UserStatus.Disabled);
        expect(removalAudit.entries.some((entry) => entry.action === StaffAuditAction.AccessRemoved &&
            entry.targetUserId === staff.user.id &&
            entry.reason === "Seasonal staff ended")).toBe(true);
        const roles = await ok(`/gyms/${gymId}/roles`, {
            headers: authHeaders(owner.accessToken)
        });
        const customRole = await ok(`/gyms/${gymId}/roles`, json({
            name: "Operations Lead",
            permissions: ["gym:read", "member:read", "report:read"]
        }, owner.accessToken));
        const editedCustomRole = await ok(`/gyms/${gymId}/roles/${customRole.id}`, json({
            name: "Assistant Operations Lead",
            permissions: ["gym:read", "member:read", "staff:read"]
        }, owner.accessToken, "PATCH"));
        const managerRole = roles.roles.find((role) => role.name === RoleName.Manager);
        if (!managerRole) {
            throw new Error("Expected manager role to exist.");
        }
        expect(customRole.isSystem).toBe(false);
        expect(customRole.permissions).toEqual(["gym:read", "member:read", "report:read"]);
        expect(editedCustomRole.name).toBe("Assistant Operations Lead");
        expect(editedCustomRole.permissions).toEqual(["gym:read", "member:read", "staff:read"]);
        const invite = await ok(`/gyms/${gymId}/staff/invites`, json({ email: "manager@example.com", roleId: managerRole.id }, owner.accessToken));
        const inviteList = await ok(`/gyms/${gymId}/staff/invites`, {
            headers: authHeaders(owner.accessToken)
        });
        const acceptedInvite = await ok("/staff/invites/accept", json({
            token: invite.inviteToken,
            firstName: "Demo",
            lastName: "Manager",
            password: "Password123"
        }));
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
        await fails("/staff/invites/accept", json({
            token: invite.inviteToken,
            firstName: "Demo",
            lastName: "Manager",
            password: "Password123"
        }), 400);
    });
    it("runs member, plan, class schedule, and public schedule endpoints", async () => {
        const registered = await ok("/auth/register", json({
            email: "owner@example.com",
            password: "Password123",
            firstName: "Demo",
            lastName: "Owner",
            gymName: "Demo Strength Club",
            timezone: "America/New_York",
            locale: "en-US"
        }));
        const gymId = registered.gym?.id ?? "";
        const location = await ok(`/gyms/${gymId}/locations`, json({
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
        const member = await ok(`/gyms/${gymId}/members`, json({
            firstName: "Jamie",
            lastName: "Rivera",
            email: "jamie@example.com",
            phone: "555-0101",
            barcode: "MEM-100",
            tagNames: ["founding-member"]
        }, registered.accessToken));
        const waitlistMember = await ok(`/gyms/${gymId}/members`, json({
            firstName: "Taylor",
            lastName: "Morgan",
            email: "taylor@example.com",
            phone: "555-0103",
            barcode: "MEM-101",
            tagNames: ["trial"]
        }, registered.accessToken));
        const manualMember = await ok(`/gyms/${gymId}/members`, json({
            firstName: "Jordan",
            lastName: "Lee",
            email: "jordan@example.com",
            phone: "555-0104",
            barcode: "MEM-102",
            tagNames: ["manual"]
        }, registered.accessToken));
        const members = await ok(`/gyms/${gymId}/members`, {
            headers: authHeaders(registered.accessToken)
        });
        const plan = await ok(`/gyms/${gymId}/membership-plans`, json({
            name: "Monthly Unlimited",
            billingInterval: "monthly",
            priceCents: 9900,
            signupFeeCents: 0,
            trialDays: 7,
            autoRenew: true,
            isPublic: true
        }, registered.accessToken));
        const updatedPlan = await ok(`/gyms/${gymId}/membership-plans/${plan.id}`, json({ priceCents: 10900 }, registered.accessToken, "PATCH"));
        const memberMembership = await ok(`/gyms/${gymId}/members/${member.id}/memberships`, json({ planId: plan.id }, registered.accessToken));
        await ok(`/gyms/${gymId}/members/${waitlistMember.id}/memberships`, json({ planId: plan.id }, registered.accessToken));
        await ok(`/gyms/${gymId}/members/${manualMember.id}/memberships`, json({ planId: plan.id }, registered.accessToken));
        const memberMemberships = await ok(`/gyms/${gymId}/members/${member.id}/memberships`, { headers: authHeaders(registered.accessToken) });
        const classType = await ok(`/gyms/${gymId}/class-types`, json({
            name: "Strength Foundations",
            defaultDurationMinutes: 60,
            defaultCapacity: 16,
            defaultWaitlistCapacity: 4,
            isPublic: true
        }, registered.accessToken));
        const classSession = await ok(`/gyms/${gymId}/class-sessions`, json({
            classTypeId: classType.id,
            locationId: location.id,
            trainerUserId: registered.user.id,
            roomName: "Studio A",
            startsAt: "2026-05-18T14:00:00.000Z",
            endsAt: "2026-05-18T15:00:00.000Z",
            capacity: 1,
            waitlistCapacity: 1
        }, registered.accessToken));
        const publicSchedule = await ok(`/public/gyms/${registered.gym?.slug}/schedule?from=2026-05-18T00:00:00.000Z&to=2026-05-19T00:00:00.000Z`);
        const filteredPublicSchedule = await ok(`/public/gyms/${registered.gym?.slug}/schedule?from=2026-05-18T00:00:00.000Z&to=2026-05-19T00:00:00.000Z&locationId=${location.id}`);
        const locationRooms = await ok(`/gyms/${gymId}/locations/${location.id}/rooms`, { headers: authHeaders(registered.accessToken) });
        const booking = await ok(`/gyms/${gymId}/class-sessions/${classSession.id}/bookings`, json({ memberId: member.id }, registered.accessToken));
        await fails(`/gyms/${gymId}/class-sessions/${classSession.id}/bookings`, json({ memberId: waitlistMember.id }, registered.accessToken), 409);
        const waitlistSpot = await ok(`/gyms/${gymId}/class-sessions/${classSession.id}/waitlist`, json({ memberId: waitlistMember.id }, registered.accessToken));
        const listedBookings = await ok(`/gyms/${gymId}/class-sessions/${classSession.id}/bookings`, { headers: authHeaders(registered.accessToken) });
        const cancelledBooking = await ok(`/gyms/${gymId}/class-bookings/${booking.id}`, {
            method: "DELETE",
            headers: authHeaders(registered.accessToken)
        });
        const manualBooking = await ok(`/gyms/${gymId}/class-sessions/${classSession.id}/bookings/manual`, json({
            memberId: manualMember.id,
            overrideCapacity: true,
            overrideReason: "Staff approved extra spot."
        }, registered.accessToken));
        const checkInCode = await ok(`/gyms/${gymId}/members/${waitlistMember.id}/check-in-code`, { headers: authHeaders(registered.accessToken) });
        const classCheckIn = await ok(`/gyms/${gymId}/check-ins`, json({
            qrPayload: checkInCode.qrPayload,
            locationId: location.id,
            classSessionId: classSession.id,
            method: "qr_code"
        }, registered.accessToken));
        const deniedCheckIn = await ok(`/gyms/${gymId}/check-ins`, json({
            barcode: "MEM-100",
            locationId: location.id,
            classSessionId: classSession.id,
            method: "barcode"
        }, registered.accessToken));
        const listedCheckIns = await ok(`/gyms/${gymId}/members/${waitlistMember.id}/check-ins`, { headers: authHeaders(registered.accessToken) });
        const accessDevice = await ok(`/gyms/${gymId}/access/devices`, json({ name: "Front Door", locationId: location.id }, registered.accessToken));
        const accessRule = await ok(`/gyms/${gymId}/access/rules`, json({ name: "Monthly front door", locationId: location.id, planId: plan.id }, registered.accessToken));
        const heartbeat = await ok("/access/device-heartbeats", json({ apiKey: accessDevice.apiKey }));
        const accessAllowed = await ok("/access/device-events", json({ apiKey: accessDevice.apiKey, barcode: "MEM-101" }));
        const accessDenied = await ok("/access/device-events", json({ apiKey: accessDevice.apiKey, barcode: "UNKNOWN-MEMBER" }));
        const listedAccessEvents = await ok(`/gyms/${gymId}/access/events`, { headers: authHeaders(registered.accessToken) });
        const rotatedAccessDevice = await ok(`/gyms/${gymId}/access/devices/${accessDevice.device.id}/rotate-key`, json({}, registered.accessToken));
        const listedAccessDevices = await ok(`/gyms/${gymId}/access/devices`, { headers: authHeaders(registered.accessToken) });
        const updatedMember = await ok(`/gyms/${gymId}/members/${member.id}`, json({ phone: "555-0102", status: "frozen" }, registered.accessToken, "PATCH"));
        const archivedMember = await ok(`/gyms/${gymId}/members/${member.id}`, {
            method: "DELETE",
            headers: authHeaders(registered.accessToken)
        });
        const archivedPlan = await ok(`/gyms/${gymId}/membership-plans/${plan.id}`, {
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
        const owner = await ok("/auth/register", json({
            email: "owner@example.com",
            password: "Password123",
            firstName: "Demo",
            lastName: "Owner",
            gymName: "Demo Strength Club",
            timezone: "America/New_York",
            locale: "en-US"
        }));
        const forgot = await ok("/auth/forgot-password", json({ email: "owner@example.com" }));
        await ok("/auth/reset-password", json({ token: forgot.resetToken, password: "NewPassword123" }));
        await fails("/auth/refresh", json({ refreshToken: owner.refreshToken }), 401);
        const login = await ok("/auth/login", json({ email: "owner@example.com", password: "NewPassword123" }));
        expect(login.user.email).toBe("owner@example.com");
    });
    it("sets up two-factor auth and supports recovery code login", async () => {
        const owner = await ok("/auth/register", json({
            email: "owner@example.com",
            password: "Password123",
            firstName: "Demo",
            lastName: "Owner",
            gymName: "Demo Strength Club",
            timezone: "America/New_York",
            locale: "en-US"
        }));
        const setup = await ok("/auth/2fa/setup", {
            method: "POST",
            headers: authHeaders(owner.accessToken)
        });
        const verify = await ok("/auth/2fa/verify", json({ code: generateTotpCode(setup.secret, fixedClock.now()) }, owner.accessToken));
        const challenged = await ok("/auth/login", json({ email: "owner@example.com", password: "Password123" }));
        const totpLogin = await ok("/auth/login", json({
            email: "owner@example.com",
            password: "Password123",
            twoFactorCode: generateTotpCode(setup.secret, fixedClock.now())
        }));
        const recoveryLogin = await ok("/auth/login", json({
            email: "owner@example.com",
            password: "Password123",
            recoveryCode: verify.recoveryCodes[0]
        }));
        expect(setup.otpauthUrl).toContain("otpauth://totp");
        expect(verify.enabled).toBe(true);
        expect(verify.recoveryCodes).toHaveLength(8);
        expect(challenged.twoFactorRequired).toBe(true);
        expect(totpLogin.accessToken).toBeTruthy();
        expect(recoveryLogin.accessToken).toBeTruthy();
        await fails("/auth/login", json({
            email: "owner@example.com",
            password: "Password123",
            recoveryCode: verify.recoveryCodes[0]
        }), 401);
    });
});
async function startApi() {
    const services = createServices(testConfig, fixedClock);
    const server = createServer(createApp(testConfig, services));
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    return {
        baseUrl,
        services,
        request: async (path, options = {}) => {
            const response = await fetch(`${baseUrl}${path}`, options);
            const data = (await response.json());
            return { response, data };
        },
        close: () => closeServer(server)
    };
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
//# sourceMappingURL=system-flow.test.js.map