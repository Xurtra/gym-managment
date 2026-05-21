import { FeatureFlag, GymStatus, MemberStatus, MembershipStatus, Permission, PlanStatus } from "@gym-platform/constants";
import { accessDeviceCreateSchema, accessDeviceEventSchema, accessDeviceHeartbeatSchema, accessRuleCreateSchema, classBookingCreateSchema, checkInCreateSchema, contractWaiverAssignmentCreateSchema, contractWaiverCreateSchema, contractWaiverSignatureCreateSchema, contractWaiverUpdateSchema, forgotPasswordSchema, gymCreateSchema, gymUpdateSchema, classSessionCreateSchema, classTypeCreateSchema, customRoleCreateSchema, customRoleUpdateSchema, locationCreateSchema, locationUpdateSchema, loginSchema, memberPortalAccountSchema, memberPortalLoginSchema, memberPortalTokenAcceptSchema, memberCreateSchema, memberMembershipAssignSchema, memberUpdateSchema, membershipPlanCreateSchema, membershipPlanUpdateSchema, notificationProcessSchema, logoutSchema, publicSignupSchema, refreshTokenSchema, registerSchema, resendVerificationSchema, resetPasswordSchema, roleAssignmentSchema, staffAccessRemoveSchema, staffAvailabilityCreateSchema, staffInviteAcceptSchema, staffInviteCreateSchema, staffTaskCreateSchema, staffTaskUpdateSchema, staffShiftCreateSchema, staffManualBookingSchema, stripePaymentCollectSchema, stripePaymentRefundSchema, stripeSubscriptionCheckoutSchema, twoFactorVerifySchema, waitlistJoinSchema, verifyEmailSchema } from "@gym-platform/validation";
import { Pool } from "pg";
import { ZodError } from "zod";
import { AppError, badRequest, forbidden, notFound, unauthorized } from "./http/errors.js";
import { verifyAccessToken } from "./infrastructure/security/tokens.js";
import { InMemoryStore } from "./infrastructure/store/inMemoryStore.js";
import { createPostgresRepositories } from "./infrastructure/store/postgresRepositories.js";
import { AccessControlService } from "./modules/accessControl/accessControl.service.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { BookingService } from "./modules/bookings/booking.service.js";
import { CheckInService } from "./modules/checkIns/checkIn.service.js";
import { ClassScheduleService } from "./modules/classes/classSchedule.service.js";
import { ContractWaiverService } from "./modules/contractsWaivers/contractWaiver.service.js";
import { MemberMembershipService } from "./modules/memberMemberships/memberMembership.service.js";
import { MemberPortalService } from "./modules/memberPortal/memberPortal.service.js";
import { LocationService } from "./modules/locations/location.service.js";
import { MemberService } from "./modules/members/member.service.js";
import { MembershipPlanService } from "./modules/membershipPlans/membershipPlan.service.js";
import { NotificationService } from "./modules/notifications/notification.service.js";
import { PaymentService } from "./modules/payments/payment.service.js";
import { ReportingService } from "./modules/reports/reporting.service.js";
import { RoleService } from "./modules/roles/role.service.js";
import { StaffScheduleService } from "./modules/staffSchedule/staffSchedule.service.js";
import { TenancyService } from "./modules/tenancy/tenancy.service.js";
import { systemClock } from "./shared/time.js";
export function createServices(config, clock = systemClock, repositories = new InMemoryStore()) {
    const roleService = new RoleService(repositories, clock);
    const tenancyService = new TenancyService(repositories, clock);
    const authService = new AuthService(repositories, tenancyService, clock, {
        accessTokenSecret: config.accessTokenSecret,
        accessTokenTtlSeconds: config.accessTokenTtlSeconds,
        refreshTokenTtlDays: config.refreshTokenTtlDays,
        passwordResetTokenTtlMinutes: config.passwordResetTokenTtlMinutes,
        emailVerificationTokenTtlHours: config.emailVerificationTokenTtlHours
    });
    const locationService = new LocationService(repositories, clock);
    const staffScheduleService = new StaffScheduleService(repositories, clock);
    const memberService = new MemberService(repositories, clock);
    const memberMembershipService = new MemberMembershipService(repositories, clock);
    const memberPortalService = new MemberPortalService(repositories, clock, {
        accessTokenSecret: config.accessTokenSecret,
        accessTokenTtlSeconds: config.accessTokenTtlSeconds,
        refreshTokenTtlDays: config.refreshTokenTtlDays
    });
    const membershipPlanService = new MembershipPlanService(repositories, clock);
    const classScheduleService = new ClassScheduleService(repositories, clock);
    const bookingService = new BookingService(repositories, clock);
    const checkInService = new CheckInService(repositories, clock);
    const accessControlService = new AccessControlService(repositories, clock);
    const notificationService = new NotificationService(repositories, clock);
    const paymentService = new PaymentService(repositories, clock, config);
    const contractWaiverService = new ContractWaiverService(repositories, clock);
    const reportingService = new ReportingService(repositories, clock);
    const services = {
        repositories,
        clock,
        authService,
        roleService,
        staffScheduleService,
        tenancyService,
        locationService,
        memberService,
        memberMembershipService,
        memberPortalService,
        membershipPlanService,
        classScheduleService,
        bookingService,
        checkInService,
        accessControlService,
        notificationService,
        paymentService,
        contractWaiverService,
        reportingService
    };
    if (repositories instanceof InMemoryStore) {
        services.store = repositories;
    }
    return services;
}
export function createPostgresServices(config, clock = systemClock, pool) {
    if (!config.databaseUrl) {
        throw new Error("DATABASE_URL is required for Postgres-backed services.");
    }
    const resolvedPool = pool ?? new Pool({
        connectionString: config.databaseUrl,
        ssl: { rejectUnauthorized: false }
    });
    const services = createServices(config, clock, createPostgresRepositories(resolvedPool));
    return {
        ...services,
        close: () => resolvedPool.end()
    };
}
export function createApp(config, services = createServices(config)) {
    const routes = createRoutes();
    return async function app(req, res) {
        // Set CORS headers on every response
        for (const [key, value] of Object.entries(corsHeaders)) {
            res.setHeader(key, value);
        }
        try {
            if (req.method === "OPTIONS") {
                sendNoContent(res, 204);
                return;
            }
            const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
            const method = req.method;
            const match = matchRoute(routes, method, url.pathname);
            if (!match) {
                throw notFound("Route was not found.");
            }
            const requestBody = await readBody(req);
            const context = {
                req,
                params: match.params,
                query: url.searchParams,
                body: requestBody.body,
                services,
                config
            };
            if (requestBody.rawBody !== undefined) {
                context.rawBody = requestBody.rawBody;
            }
            const result = await match.route.handler(context);
            sendJson(res, 200, result ?? { ok: true });
        }
        catch (error) {
            sendError(res, error);
        }
    };
}
function createRoutes() {
    const routes = [];
    const add = (method, path, handler) => {
        const { pattern, keys } = compilePath(path);
        routes.push({ method, pattern, keys, handler });
    };
    add("GET", "/health", () => ({
        status: "ok",
        service: "gym-platform-api",
        checkedAt: new Date().toISOString()
    }));
    add("POST", "/auth/register", async (context) => {
        const input = parseWith(registerSchema, context.body);
        return context.services.authService.register(input);
    });
    add("POST", "/auth/login", async (context) => {
        const input = parseWith(loginSchema, context.body);
        return context.services.authService.login(input);
    });
    add("POST", "/auth/refresh", (context) => {
        const input = parseWith(refreshTokenSchema, context.body);
        return context.services.authService.refresh(input.refreshToken);
    });
    add("POST", "/auth/logout", (context) => {
        const input = parseWith(logoutSchema, context.body);
        return context.services.authService.logout(input.refreshToken);
    });
    add("POST", "/auth/forgot-password", (context) => {
        const input = parseWith(forgotPasswordSchema, context.body);
        return context.services.authService.forgotPassword(input);
    });
    add("POST", "/auth/reset-password", async (context) => {
        const input = parseWith(resetPasswordSchema, context.body);
        return context.services.authService.resetPassword(input);
    });
    add("POST", "/auth/verify-email", (context) => {
        const input = parseWith(verifyEmailSchema, context.body);
        return context.services.authService.verifyEmail(input);
    });
    add("POST", "/auth/resend-verification", (context) => {
        const input = parseWith(resendVerificationSchema, context.body);
        return context.services.authService.resendVerification(input.email);
    });
    add("POST", "/auth/2fa/setup", (context) => {
        const auth = requireAuth(context);
        return context.services.authService.setupTwoFactor(auth.sub);
    });
    add("POST", "/auth/2fa/verify", (context) => {
        const auth = requireAuth(context);
        const input = parseWith(twoFactorVerifySchema, context.body);
        return context.services.authService.verifyTwoFactorSetup(auth.sub, input);
    });
    add("POST", "/auth/2fa/recovery-codes", (context) => {
        const auth = requireAuth(context);
        return context.services.authService.regenerateRecoveryCodes(auth.sub);
    });
    add("POST", "/staff/invites/accept", (context) => {
        const input = parseWith(staffInviteAcceptSchema, context.body);
        return context.services.authService.acceptStaffInvite(input);
    });
    add("GET", "/auth/me", (context) => {
        const auth = requireAuth(context);
        return context.services.authService.currentUser(auth.sub, auth.gymId);
    });
    add("POST", "/member-auth/login", async (context) => {
        const input = parseWith(memberPortalLoginSchema, context.body);
        return context.services.memberPortalService.login(input);
    });
    add("POST", "/member-auth/refresh", (context) => {
        const input = parseWith(refreshTokenSchema, context.body);
        return context.services.memberPortalService.refresh(input.refreshToken);
    });
    add("POST", "/member-auth/logout", (context) => {
        const input = parseWith(logoutSchema, context.body);
        return context.services.memberPortalService.logout(input.refreshToken);
    });
    add("POST", "/member-auth/setup-password", (context) => {
        const input = parseWith(memberPortalTokenAcceptSchema, context.body);
        return context.services.memberPortalService.acceptPortalToken(input);
    });
    add("GET", "/member-portal/me", async (context) => {
        const auth = requireMemberAuth(context);
        return context.services.memberPortalService.me(auth.gymId, auth.sub);
    });
    add("GET", "/member-portal/memberships", async (context) => {
        const auth = requireMemberAuth(context);
        return context.services.memberPortalService.memberships(auth.gymId, auth.sub);
    });
    add("GET", "/member-portal/check-in-code", async (context) => {
        const auth = requireMemberAuth(context);
        return context.services.memberPortalService.checkInCode(auth.gymId, auth.sub);
    });
    add("GET", "/member-portal/check-ins", async (context) => {
        const auth = requireMemberAuth(context);
        return context.services.memberPortalService.checkIns(auth.gymId, auth.sub);
    });
    add("GET", "/member-portal/classes", async (context) => {
        const auth = requireMemberAuth(context);
        const from = context.query.get("from") ? new Date(context.query.get("from") ?? "") : new Date();
        const to = context.query.get("to")
            ? new Date(context.query.get("to") ?? "")
            : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
            throw badRequest("Schedule date range is invalid.", "invalid_schedule_range");
        }
        const locationId = context.query.get("locationId") ?? undefined;
        if (locationId) {
            const location = await context.services.repositories.locations.getLocation(locationId);
            if (!location || location.gymId !== auth.gymId) {
                throw notFound("Location was not found.");
            }
        }
        const sessions = await context.services.repositories.classes.listPublicClassSessionsForGym(auth.gymId, from, to);
        return {
            sessions: locationId
                ? sessions.filter((session) => session.locationId === locationId)
                : sessions
        };
    });
    add("GET", "/member-portal/bookings", async (context) => {
        const auth = requireMemberAuth(context);
        return {
            bookings: (await context.services.repositories.bookings.listClassBookingsForMember(auth.sub))
                .filter((booking) => booking.gymId === auth.gymId)
        };
    });
    add("POST", "/member-portal/class-sessions/:sessionId/bookings", async (context) => {
        const auth = requireMemberAuth(context);
        return context.services.bookingService.createBooking(auth.gymId, requiredParam(context, "sessionId"), { memberId: auth.sub });
    });
    add("POST", "/member-portal/class-sessions/:sessionId/waitlist", async (context) => {
        const auth = requireMemberAuth(context);
        return context.services.bookingService.joinWaitlist(auth.gymId, requiredParam(context, "sessionId"), { memberId: auth.sub });
    });
    add("DELETE", "/member-portal/bookings/:bookingId", async (context) => {
        const auth = requireMemberAuth(context);
        await requireMemberOwnsBooking(context, auth.gymId, auth.sub, requiredParam(context, "bookingId"));
        return context.services.bookingService.cancelBooking(auth.gymId, requiredParam(context, "bookingId"), auth.sub);
    });
    add("DELETE", "/member-portal/bookings/:bookingId/waitlist", async (context) => {
        const auth = requireMemberAuth(context);
        await requireMemberOwnsBooking(context, auth.gymId, auth.sub, requiredParam(context, "bookingId"));
        return context.services.bookingService.leaveWaitlist(auth.gymId, requiredParam(context, "bookingId"), auth.sub);
    });
    add("GET", "/gyms", async (context) => {
        return { gyms: await context.services.tenancyService.listSettingsGyms() };
    });
    add("POST", "/gyms", (context) => {
        const auth = requireAuth(context);
        const input = parseWith(gymCreateSchema, context.body);
        return context.services.tenancyService.createGym(auth.sub, input);
    });
    add("GET", "/gyms/:gymId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.GymRead);
        return context.services.tenancyService.getGym(gymId);
    });
    add("PATCH", "/gyms/:gymId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.GymUpdate);
        const input = parseWith(gymUpdateSchema, context.body);
        return context.services.tenancyService.updateGym(gymId, input);
    });
    add("GET", "/gyms/:gymId/locations", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.LocationRead);
        return { locations: await context.services.locationService.list(gymId) };
    });
    add("GET", "/gyms/:gymId/locations/:locationId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.LocationRead);
        return context.services.locationService.get(gymId, requiredParam(context, "locationId"));
    });
    add("GET", "/gyms/:gymId/locations/:locationId/rooms", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.LocationRead);
        return {
            rooms: await context.services.locationService.listRooms(gymId, requiredParam(context, "locationId"))
        };
    });
    add("POST", "/gyms/:gymId/locations", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.LocationCreate);
        const input = parseWith(locationCreateSchema, context.body);
        return context.services.locationService.create(gymId, input);
    });
    add("PATCH", "/gyms/:gymId/locations/:locationId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.LocationUpdate);
        const input = parseWith(locationUpdateSchema, context.body);
        return context.services.locationService.update(gymId, requiredParam(context, "locationId"), input);
    });
    add("DELETE", "/gyms/:gymId/locations/:locationId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.LocationArchive);
        return context.services.locationService.archive(gymId, requiredParam(context, "locationId"));
    });
    add("POST", "/gyms/:gymId/roles/assign", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRoleAssign);
        const input = parseWith(roleAssignmentSchema, context.body);
        return context.services.roleService.assignRole(gymId, input.userId, input.roleId, auth.sub);
    });
    add("POST", "/gyms/:gymId/roles", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRoleAssign);
        const input = parseWith(customRoleCreateSchema, context.body);
        return context.services.roleService.createCustomRole(gymId, input);
    });
    add("PATCH", "/gyms/:gymId/roles/:roleId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRoleAssign);
        const input = parseWith(customRoleUpdateSchema, context.body);
        return context.services.roleService.updateCustomRole(gymId, requiredParam(context, "roleId"), input);
    });
    add("GET", "/gyms/:gymId/roles", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRead);
        return { roles: await context.services.roleService.listRoles(gymId) };
    });
    add("GET", "/gyms/:gymId/staff", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRead);
        return { staff: await context.services.roleService.listStaffAccess(gymId) };
    });
    add("GET", "/gyms/:gymId/staff/audit", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRead);
        return { entries: await context.services.roleService.listStaffAuditLogs(gymId) };
    });
    add("DELETE", "/gyms/:gymId/staff/:userId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRemove);
        const input = parseWith(staffAccessRemoveSchema, context.body ?? {});
        return context.services.roleService.removeStaffAccess(gymId, requiredParam(context, "userId"), auth.sub, input);
    });
    add("GET", "/gyms/:gymId/staff/invites", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRead);
        return { invites: await context.services.roleService.listStaffInvites(gymId) };
    });
    add("POST", "/gyms/:gymId/staff/invites", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffInvite);
        const input = parseWith(staffInviteCreateSchema, context.body);
        return context.services.roleService.inviteStaff(gymId, auth.sub, input);
    });
    add("POST", "/gyms/:gymId/staff/shifts", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRoleAssign);
        const input = parseWith(staffShiftCreateSchema, context.body);
        return context.services.staffScheduleService.createShift(gymId, auth.sub, input);
    });
    add("GET", "/gyms/:gymId/staff/shifts", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRead);
        return { shifts: await context.services.staffScheduleService.listShifts(gymId) };
    });
    add("GET", "/gyms/:gymId/staff/availability", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRead);
        return { availability: await context.services.staffScheduleService.listAvailability(gymId) };
    });
    add("POST", "/gyms/:gymId/staff/availability", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRoleAssign);
        const input = parseWith(staffAvailabilityCreateSchema, context.body);
        return context.services.staffScheduleService.createAvailability(gymId, input);
    });
    add("GET", "/gyms/:gymId/staff/tasks", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRead);
        return { tasks: await context.services.staffScheduleService.listTasks(gymId) };
    });
    add("POST", "/gyms/:gymId/staff/tasks", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffInvite);
        const input = parseWith(staffTaskCreateSchema, context.body);
        return context.services.staffScheduleService.createTask(gymId, auth.sub, input);
    });
    add("PATCH", "/gyms/:gymId/staff/tasks/:taskId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffInvite);
        const input = parseWith(staffTaskUpdateSchema, context.body);
        return context.services.staffScheduleService.updateTask(gymId, requiredParam(context, "taskId"), input);
    });
    add("GET", "/gyms/:gymId/members", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberRead);
        return { members: await context.services.memberService.list(gymId) };
    });
    add("POST", "/gyms/:gymId/members", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
        const input = parseWith(memberCreateSchema, context.body);
        return context.services.memberService.create(gymId, input);
    });
    add("PATCH", "/gyms/:gymId/members/:memberId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
        const input = parseWith(memberUpdateSchema, context.body);
        return context.services.memberService.update(gymId, requiredParam(context, "memberId"), input);
    });
    add("POST", "/gyms/:gymId/members/:memberId/portal-account", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
        const input = parseWith(memberPortalAccountSchema, context.body);
        return context.services.memberPortalService.enablePortalAccount(gymId, requiredParam(context, "memberId"), input);
    });
    add("POST", "/gyms/:gymId/members/:memberId/portal-invite", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
        return context.services.memberPortalService.createPortalInvite(gymId, requiredParam(context, "memberId"), context.req.headers.origin ?? "http://localhost:5173");
    });
    add("DELETE", "/gyms/:gymId/members/:memberId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
        return context.services.memberService.archive(gymId, requiredParam(context, "memberId"));
    });
    add("GET", "/gyms/:gymId/members/:memberId/memberships", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberRead);
        return {
            memberships: await context.services.memberMembershipService.list(gymId, requiredParam(context, "memberId"))
        };
    });
    add("POST", "/gyms/:gymId/members/:memberId/memberships", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PlanRead);
        const input = parseWith(memberMembershipAssignSchema, context.body);
        return context.services.memberMembershipService.assignPlan(gymId, requiredParam(context, "memberId"), input);
    });
    add("GET", "/gyms/:gymId/membership-plans", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PlanRead);
        return { plans: await context.services.membershipPlanService.list(gymId) };
    });
    add("POST", "/gyms/:gymId/membership-plans", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PlanWrite);
        const input = parseWith(membershipPlanCreateSchema, context.body);
        return context.services.membershipPlanService.create(gymId, input);
    });
    add("PATCH", "/gyms/:gymId/membership-plans/:planId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PlanWrite);
        const input = parseWith(membershipPlanUpdateSchema, context.body);
        return context.services.membershipPlanService.update(gymId, requiredParam(context, "planId"), input);
    });
    add("DELETE", "/gyms/:gymId/membership-plans/:planId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PlanWrite);
        return context.services.membershipPlanService.archive(gymId, requiredParam(context, "planId"));
    });
    add("GET", "/gyms/:gymId/class-types", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ClassRead);
        return { classTypes: await context.services.classScheduleService.listClassTypes(gymId) };
    });
    add("POST", "/gyms/:gymId/class-types", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ClassWrite);
        const input = parseWith(classTypeCreateSchema, context.body);
        return context.services.classScheduleService.createClassType(gymId, input);
    });
    add("POST", "/gyms/:gymId/class-sessions", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ClassWrite);
        const input = parseWith(classSessionCreateSchema, context.body);
        return context.services.classScheduleService.createSession(gymId, input);
    });
    add("GET", "/gyms/:gymId/class-sessions/:sessionId/bookings", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingRead);
        return {
            bookings: await context.services.bookingService.listForSession(gymId, requiredParam(context, "sessionId"))
        };
    });
    add("POST", "/gyms/:gymId/class-sessions/:sessionId/bookings", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
        const input = parseWith(classBookingCreateSchema, context.body);
        return context.services.bookingService.createBooking(gymId, requiredParam(context, "sessionId"), input);
    });
    add("POST", "/gyms/:gymId/class-sessions/:sessionId/bookings/manual", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
        const input = parseWith(staffManualBookingSchema, context.body);
        return context.services.bookingService.createStaffManualBooking(gymId, requiredParam(context, "sessionId"), auth.sub, input);
    });
    add("DELETE", "/gyms/:gymId/class-bookings/:bookingId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
        return context.services.bookingService.cancelBooking(gymId, requiredParam(context, "bookingId"), auth.sub);
    });
    add("POST", "/gyms/:gymId/class-sessions/:sessionId/waitlist", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
        const input = parseWith(waitlistJoinSchema, context.body);
        return context.services.bookingService.joinWaitlist(gymId, requiredParam(context, "sessionId"), input);
    });
    add("DELETE", "/gyms/:gymId/class-bookings/:bookingId/waitlist", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
        return context.services.bookingService.leaveWaitlist(gymId, requiredParam(context, "bookingId"), auth.sub);
    });
    add("GET", "/gyms/:gymId/members/:memberId/check-in-code", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberRead);
        return context.services.checkInService.checkInCode(gymId, requiredParam(context, "memberId"));
    });
    add("GET", "/gyms/:gymId/members/:memberId/check-ins", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberRead);
        return {
            checkIns: await context.services.checkInService.listForMember(gymId, requiredParam(context, "memberId"))
        };
    });
    add("GET", "/gyms/:gymId/check-ins", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberRead);
        return { checkIns: await context.services.checkInService.listForGym(gymId) };
    });
    add("POST", "/gyms/:gymId/check-ins", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
        const input = parseWith(checkInCreateSchema, context.body);
        return context.services.checkInService.checkIn(gymId, auth.sub, input);
    });
    add("DELETE", "/gyms/:gymId/check-ins/:checkInId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
        return context.services.checkInService.deleteCheckIn(gymId, requiredParam(context, "checkInId"));
    });
    add("GET", "/gyms/:gymId/access/devices", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.AccessRead);
        return { devices: await context.services.accessControlService.listDevices(gymId) };
    });
    add("POST", "/gyms/:gymId/access/devices", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.AccessWrite);
        const input = parseWith(accessDeviceCreateSchema, context.body);
        return context.services.accessControlService.registerDevice(gymId, input);
    });
    add("POST", "/gyms/:gymId/access/devices/:deviceId/rotate-key", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.AccessWrite);
        return context.services.accessControlService.rotateDeviceApiKey(gymId, requiredParam(context, "deviceId"));
    });
    add("GET", "/gyms/:gymId/access/rules", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.AccessRead);
        return { rules: await context.services.accessControlService.listRules(gymId) };
    });
    add("POST", "/gyms/:gymId/access/rules", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.AccessWrite);
        const input = parseWith(accessRuleCreateSchema, context.body);
        return context.services.accessControlService.createRule(gymId, input);
    });
    add("GET", "/gyms/:gymId/access/events", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.AccessRead);
        return { events: await context.services.accessControlService.listEvents(gymId) };
    });
    add("POST", "/access/device-events", async (context) => {
        const input = parseWith(accessDeviceEventSchema, context.body);
        return context.services.accessControlService.authorizeDoor(input);
    });
    add("POST", "/access/device-heartbeats", async (context) => {
        const input = parseWith(accessDeviceHeartbeatSchema, context.body);
        return context.services.accessControlService.heartbeat(input);
    });
    add("POST", "/stripe/webhooks", async (context) => {
        return context.services.paymentService.handleStripeWebhook(context.rawBody ?? "", headerValue(context.req.headers["stripe-signature"]));
    });
    add("GET", "/gyms/:gymId/payments/stripe-account", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentRead);
        return { account: await context.services.paymentService.getStripeAccount(gymId) };
    });
    add("POST", "/gyms/:gymId/payments/stripe-account/connect", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentWrite);
        return context.services.paymentService.connectStripeAccount(gymId);
    });
    add("GET", "/gyms/:gymId/payments", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentRead);
        return { payments: await context.services.paymentService.listPayments(gymId) };
    });
    add("GET", "/gyms/:gymId/payments/subscriptions", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentRead);
        return { subscriptions: await context.services.paymentService.listSubscriptions(gymId) };
    });
    add("POST", "/gyms/:gymId/payments/subscriptions/checkout", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentWrite);
        const input = parseWith(stripeSubscriptionCheckoutSchema, context.body);
        return context.services.paymentService.createSubscriptionCheckout(gymId, input);
    });
    add("POST", "/gyms/:gymId/payments", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentWrite);
        const input = parseWith(stripePaymentCollectSchema, context.body);
        return context.services.paymentService.collectPayment(gymId, input);
    });
    add("POST", "/gyms/:gymId/payments/:paymentId/refund", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentWrite);
        const input = parseWith(stripePaymentRefundSchema, context.body ?? {});
        return context.services.paymentService.refundPayment(gymId, requiredParam(context, "paymentId"), input);
    });
    add("GET", "/gyms/:gymId/notifications", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingRead);
        return { notifications: await context.services.notificationService.list(gymId) };
    });
    add("POST", "/gyms/:gymId/notifications/:notificationId/process", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
        const input = parseWith(notificationProcessSchema, context.body ?? {});
        return context.services.notificationService.process(gymId, requiredParam(context, "notificationId"), input);
    });
    add("POST", "/gyms/:gymId/notifications/:notificationId/retry", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
        return context.services.notificationService.retry(gymId, requiredParam(context, "notificationId"));
    });
    add("GET", "/gyms/:gymId/contracts-waivers", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.GymRead);
        return { documents: await context.services.contractWaiverService.list(gymId) };
    });
    add("GET", "/gyms/:gymId/contracts-waivers/assignments", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberRead);
        return { assignments: await context.services.contractWaiverService.listAssignments(gymId) };
    });
    add("POST", "/gyms/:gymId/contracts-waivers", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.GymUpdate);
        const input = parseWith(contractWaiverCreateSchema, context.body);
        return context.services.contractWaiverService.create(gymId, input);
    });
    add("POST", "/gyms/:gymId/contracts-waivers/:documentId/assignments", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
        const input = parseWith(contractWaiverAssignmentCreateSchema, context.body);
        return context.services.contractWaiverService.assign(gymId, requiredParam(context, "documentId"), auth.sub, input);
    });
    add("GET", "/gyms/:gymId/members/:memberId/contracts-waivers", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberRead);
        return {
            assignments: await context.services.contractWaiverService.listMemberAssignments(gymId, requiredParam(context, "memberId"))
        };
    });
    add("POST", "/gyms/:gymId/contracts-waivers/assignments/:assignmentId/sign", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
        const input = parseWith(contractWaiverSignatureCreateSchema, context.body);
        return context.services.contractWaiverService.signAssignment(gymId, requiredParam(context, "assignmentId"), input, requestIp(context.req));
    });
    add("PATCH", "/gyms/:gymId/contracts-waivers/:documentId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.GymUpdate);
        const input = parseWith(contractWaiverUpdateSchema, context.body);
        return context.services.contractWaiverService.update(gymId, requiredParam(context, "documentId"), input);
    });
    add("DELETE", "/gyms/:gymId/contracts-waivers/:documentId", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.GymUpdate);
        return context.services.contractWaiverService.archive(gymId, requiredParam(context, "documentId"));
    });
    add("GET", "/gyms/:gymId/reports/overview", async (context) => {
        const auth = requireAuth(context);
        const gymId = requiredParam(context, "gymId");
        await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
        await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ReportRead);
        return context.services.reportingService.overview(gymId);
    });
    add("GET", "/public/gyms/:gymSlug/schedule", async (context) => {
        const gym = await getActiveGymBySlug(context, requiredParam(context, "gymSlug"));
        const from = context.query.get("from") ? new Date(context.query.get("from") ?? "") : new Date();
        const to = context.query.get("to")
            ? new Date(context.query.get("to") ?? "")
            : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
            throw badRequest("Schedule date range is invalid.", "invalid_schedule_range");
        }
        const locationId = context.query.get("locationId") ?? undefined;
        return context.services.classScheduleService.publicSchedule(gym.slug, from, to, locationId ? { locationId } : {});
    });
    add("GET", "/public/gyms/:gymSlug", async (context) => {
        const gym = await getActiveGymBySlug(context, requiredParam(context, "gymSlug"));
        return {
            gym: {
                id: gym.id,
                name: gym.name,
                slug: gym.slug,
                timezone: gym.timezone,
                locale: gym.locale,
                featureFlags: gym.featureFlags,
                ...(gym.logoUrl ? { logoUrl: gym.logoUrl } : {}),
                ...(gym.brandColors ? { brandColors: gym.brandColors } : {}),
                ...(gym.businessInfo ? { businessInfo: gym.businessInfo } : {})
            }
        };
    });
    add("GET", "/public/gyms/:gymSlug/plans", async (context) => {
        const gym = await getActiveGymBySlug(context, requiredParam(context, "gymSlug"));
        const plans = (await context.services.membershipPlanService.list(gym.id)).filter((plan) => plan.isPublic && plan.status !== PlanStatus.Archived);
        return {
            gym: {
                id: gym.id,
                name: gym.name,
                slug: gym.slug,
                featureFlags: gym.featureFlags
            },
            plans
        };
    });
    add("POST", "/public/gyms/:gymSlug/signup", async (context) => {
        const gym = await getActiveGymBySlug(context, requiredParam(context, "gymSlug"));
        if (!gym.featureFlags.includes(FeatureFlag.OnlineSignup)) {
            throw forbidden("Online signup is not enabled for this gym.");
        }
        const input = parseWith(publicSignupSchema, context.body);
        const plan = await context.services.repositories.membershipPlans.getMembershipPlan(input.planId);
        if (!plan || plan.gymId !== gym.id || plan.status === PlanStatus.Archived || !plan.isPublic) {
            throw notFound("Membership plan was not found.");
        }
        const memberStatus = plan.trialDays > 0 ? MemberStatus.Trial : MemberStatus.Active;
        const membershipStatus = plan.trialDays > 0 ? MembershipStatus.Trialing : MembershipStatus.Active;
        const member = await context.services.memberService.create(gym.id, {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            ...(input.phone ? { phone: input.phone } : {}),
            status: memberStatus,
            tagNames: ["online-signup"]
        });
        const membership = await context.services.memberMembershipService.assignPlan(gym.id, member.id, {
            planId: plan.id,
            status: membershipStatus
        });
        return {
            gym: {
                id: gym.id,
                name: gym.name,
                slug: gym.slug
            },
            plan: {
                id: plan.id,
                name: plan.name,
                billingInterval: plan.billingInterval,
                priceCents: plan.priceCents,
                signupFeeCents: plan.signupFeeCents,
                trialDays: plan.trialDays
            },
            member,
            membership,
            summary: {
                totalDueTodayCents: plan.priceCents + plan.signupFeeCents
            }
        };
    });
    return routes;
}
async function getActiveGymBySlug(context, gymSlug) {
    const gym = await context.services.repositories.gyms.findGymBySlug(gymSlug);
    if (!gym || gym.status !== GymStatus.Active) {
        throw notFound("Gym was not found.");
    }
    return gym;
}
function requireAuth(context) {
    const header = context.req.headers.authorization;
    const match = header?.match(/^Bearer\s+(.+)$/i);
    if (!match?.[1]) {
        throw unauthorized();
    }
    const payload = verifyAccessToken(match[1], context.config.accessTokenSecret, context.services.clock.now());
    if (!payload) {
        throw unauthorized("Access token is invalid or expired.");
    }
    context.auth = payload;
    return payload;
}
function requireMemberAuth(context) {
    const payload = requireAuth(context);
    if (!payload.gymId) {
        throw unauthorized("Member access token is missing gym context.");
    }
    return { ...payload, gymId: payload.gymId };
}
async function requireMemberOwnsBooking(context, gymId, memberId, bookingId) {
    const booking = await context.services.repositories.bookings.getClassBooking(bookingId);
    if (!booking || booking.gymId !== gymId || booking.memberId !== memberId) {
        throw notFound("Class booking was not found.");
    }
    return booking;
}
function requiredParam(context, key) {
    const value = context.params[key];
    if (!value) {
        throw badRequest(`Missing route parameter: ${key}`);
    }
    return value;
}
function parseWith(schema, body) {
    return schema.parse(body);
}
async function readBody(req) {
    if (req.method === "GET") {
        return { body: undefined, rawBody: undefined };
    }
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === "string"
            ? new TextEncoder().encode(chunk)
            : new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
    }
    if (chunks.length === 0) {
        return { body: undefined, rawBody: undefined };
    }
    const raw = new TextDecoder().decode(concatBytes(chunks));
    if (!raw.trim()) {
        return { body: undefined, rawBody: raw };
    }
    try {
        return { body: JSON.parse(raw), rawBody: raw };
    }
    catch {
        throw badRequest("Request body must be valid JSON.", "invalid_json");
    }
}
function headerValue(value) {
    return Array.isArray(value) ? value[0] : value;
}
function requestIp(req) {
    const forwardedFor = headerValue(req.headers["x-forwarded-for"]);
    return forwardedFor?.split(",")[0]?.trim() || req.socket.remoteAddress || undefined;
}
function concatBytes(chunks) {
    const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
    const merged = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return merged;
}
function matchRoute(routes, method, pathname) {
    for (const route of routes) {
        if (route.method !== method) {
            continue;
        }
        const match = route.pattern.exec(pathname);
        if (!match) {
            continue;
        }
        const params = Object.fromEntries(route.keys.map((key, index) => [key, decodeURIComponent(match[index + 1] ?? "")]));
        return { route, params };
    }
    return undefined;
}
function compilePath(path) {
    const keys = [];
    const segments = path.split("/").filter(Boolean);
    const pattern = segments
        .map((segment) => {
        if (segment.startsWith(":")) {
            keys.push(segment.slice(1));
            return "([^/]+)";
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
        .join("/");
    return { pattern: new RegExp(`^/${pattern}/?$`), keys };
}
function sendJson(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
    });
    res.end(body);
}
function sendNoContent(res, status) {
    res.writeHead(status, {
        ...corsHeaders,
        "Content-Length": "0"
    });
    res.end();
}
function sendError(res, error) {
    if (error instanceof ZodError) {
        sendJson(res, 400, {
            error: {
                code: "validation_failed",
                message: "Request validation failed.",
                issues: error.issues.map((issue) => ({
                    path: issue.path.join("."),
                    message: issue.message
                }))
            }
        });
        return;
    }
    if (error instanceof AppError) {
        sendJson(res, error.status, { error: { code: error.code, message: error.message } });
        return;
    }
    sendJson(res, 500, {
        error: {
            code: "internal_server_error",
            message: "An unexpected error occurred."
        }
    });
}
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS"
};
//# sourceMappingURL=app.js.map