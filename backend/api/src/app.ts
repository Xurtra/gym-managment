import { FeatureFlag, GymStatus, MemberStatus, MembershipStatus, Permission, PlanStatus } from "@gym-platform/constants";
import {
  accessDeviceCreateSchema,
  accessDeviceEventSchema,
  accessDeviceHeartbeatSchema,
  accessRuleCreateSchema,
  classBookingCreateSchema,
  classSessionResourceAllocationSchema,
  checkInCreateSchema,
  consumerCreateSchema,
  consumerProfileImageUploadSchema,
  consumerUpdateSchema,
  forgotPasswordSchema,
  gymCreateSchema,
  gymUpdateSchema,
  classSessionCreateSchema,
  classTypeCreateSchema,
  customRoleCreateSchema,
  customRoleUpdateSchema,
  locationCreateSchema,
  locationUpdateSchema,
  facilityReservationCancelSchema,
  facilityReservationCreateSchema,
  loginSchema,
  memberCreateSchema,
  memberMembershipAssignSchema,
  memberUpdateSchema,
  membershipPlanCreateSchema,
  membershipPlanUpdateSchema,
  logoutSchema,
  posStripeFinalizeSchema,
  publicSignupSchema,
  posPurchaseSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  resourceCreateSchema,
  resourceUpdateSchema,
  roleAssignmentSchema,
  schedulerAvailabilityCreateSchema,
  schedulerCoverageRuleCreateSchema,
  schedulerGenerateSchema,
  schedulerPreferenceRequestCreateSchema,
  schedulerPreferenceRequestResolveSchema,
  schedulerPublishSchema,
  schedulerRequestCreateSchema,
  schedulerRequestResolveSchema,
  schedulerSettingsUpdateSchema,
  staffAccessRemoveSchema,
  staffClockInSchema,
  staffClockOutSchema,
  staffInviteAcceptSchema,
  staffInviteCreateSchema,
  staffSelfClockInSchema,
  staffSelfClockOutSchema,
  staffShiftCreateSchema,
  staffManualBookingSchema,
  twoFactorVerifySchema,
  waitlistJoinSchema,
  verifyEmailSchema
} from "@gym-platform/validation";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Pool } from "pg";
import { ZodError, type ZodSchema } from "zod";
import type { z } from "zod";
import type { ApiConfig } from "./config/env.js";
import { AppError, badRequest, forbidden, notFound, unauthorized } from "./http/errors.js";
import { verifyAccessToken, type AccessTokenPayload } from "./infrastructure/security/tokens.js";
import {
  readMemberProfileImage,
  uploadMemberProfileImage
} from "./infrastructure/storage/memberProfileImageStore.js";
import { InMemoryStore } from "./infrastructure/store/inMemoryStore.js";
import { createPostgresRepositories } from "./infrastructure/store/postgresRepositories.js";
import type { Repositories } from "./infrastructure/store/repositories.js";
import { AccessControlService } from "./modules/accessControl/accessControl.service.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { BookingService } from "./modules/bookings/booking.service.js";
import { CheckInService } from "./modules/checkIns/checkIn.service.js";
import { ClassScheduleService } from "./modules/classes/classSchedule.service.js";
import { MemberMembershipService } from "./modules/memberMemberships/memberMembership.service.js";
import { LocationService } from "./modules/locations/location.service.js";
import { MemberService } from "./modules/members/member.service.js";
import { MembershipPlanService } from "./modules/membershipPlans/membershipPlan.service.js";
import { PosService } from "./modules/pos/pos.service.js";
import { PosStripeService } from "./modules/pos/posStripe.service.js";
import { ReservationResourceService } from "./modules/reservations/reservationResource.service.js";
import { RoleService } from "./modules/roles/role.service.js";
import { SchedulerService } from "./modules/scheduler/scheduler.service.js";
import { StaffScheduleService } from "./modules/staffSchedule/staffSchedule.service.js";
import { StaffTimeClockService } from "./modules/staffTimeClock/staffTimeClock.service.js";
import { TenancyService } from "./modules/tenancy/tenancy.service.js";
import { systemClock, type Clock } from "./shared/time.js";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "OPTIONS";

interface Route {
  method: HttpMethod;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

interface RequestContext {
  req: IncomingMessage;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  rawBody?: Buffer;
  auth?: AccessTokenPayload;
  services: Services;
  config: ApiConfig;
}

type Handler = (context: RequestContext) => Promise<unknown> | unknown;

interface RawResponse {
  raw: true;
  status: number;
  headers?: Record<string, string>;
  body: Uint8Array | Buffer | string;
}

export interface Services {
  repositories: Repositories;
  store?: InMemoryStore;
  clock: Clock;
  authService: AuthService;
  roleService: RoleService;
  schedulerService: SchedulerService;
  staffScheduleService: StaffScheduleService;
  staffTimeClockService: StaffTimeClockService;
  tenancyService: TenancyService;
  locationService: LocationService;
  memberService: MemberService;
  memberMembershipService: MemberMembershipService;
  membershipPlanService: MembershipPlanService;
  posService: PosService;
  posStripeService: PosStripeService;
  reservationResourceService: ReservationResourceService;
  classScheduleService: ClassScheduleService;
  bookingService: BookingService;
  checkInService: CheckInService;
  accessControlService: AccessControlService;
}

export function createServices(
  config: ApiConfig,
  clock: Clock = systemClock,
  repositories: Repositories = new InMemoryStore()
): Services {
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
  const staffTimeClockService = new StaffTimeClockService(repositories, clock);
  const schedulerService = new SchedulerService(repositories, clock);
  const memberService = new MemberService(repositories, clock);
  const memberMembershipService = new MemberMembershipService(repositories, clock);
  const membershipPlanService = new MembershipPlanService(repositories, clock);
  const posService = new PosService(repositories, clock);
  const bootstrapServices = {} as Services;
  const reservationResourceService = new ReservationResourceService(repositories, clock);
  const classScheduleService = new ClassScheduleService(repositories, clock);
  const bookingService = new BookingService(repositories, clock);
  const checkInService = new CheckInService(repositories, clock);
  const accessControlService = new AccessControlService(repositories, clock);
  const services: Services = {
    repositories,
    clock,
    authService,
    roleService,
    schedulerService,
    staffScheduleService,
    staffTimeClockService,
    tenancyService,
    locationService,
    memberService,
    memberMembershipService,
    membershipPlanService,
    posService,
    posStripeService: undefined as unknown as PosStripeService,
    reservationResourceService,
    classScheduleService,
    bookingService,
    checkInService,
    accessControlService
  };
  bootstrapServices.repositories = services.repositories;
  bootstrapServices.clock = services.clock;
  bootstrapServices.authService = services.authService;
  bootstrapServices.roleService = services.roleService;
  bootstrapServices.staffScheduleService = services.staffScheduleService;
  bootstrapServices.tenancyService = services.tenancyService;
  bootstrapServices.locationService = services.locationService;
  bootstrapServices.memberService = services.memberService;
  bootstrapServices.memberMembershipService = services.memberMembershipService;
  bootstrapServices.membershipPlanService = services.membershipPlanService;
  bootstrapServices.posService = services.posService;
  bootstrapServices.reservationResourceService = services.reservationResourceService;
  bootstrapServices.classScheduleService = services.classScheduleService;
  bootstrapServices.bookingService = services.bookingService;
  bootstrapServices.checkInService = services.checkInService;
  bootstrapServices.accessControlService = services.accessControlService;
  services.posStripeService = new PosStripeService(config, services);
  if (repositories instanceof InMemoryStore) {
    services.store = repositories;
  }
  return services;
}

export function createPostgresServices(config: ApiConfig, clock: Clock = systemClock, pool?: Pool) {
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

export function createApp(config: ApiConfig, services = createServices(config)) {
  const routes = createRoutes();
  return async function app(req: IncomingMessage, res: ServerResponse) {
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
      const method = req.method as HttpMethod;
      const match = matchRoute(routes, method, url.pathname);
      if (!match) {
        throw notFound("Route was not found.");
      }
      const bodyResult = await readBody(req);
      const result = await match.route.handler({
        req,
        params: match.params,
        query: url.searchParams,
        body: bodyResult.body,
        ...(bodyResult.rawBody ? { rawBody: bodyResult.rawBody } : {}),
        services,
        config
      });
      if (isRawResponse(result)) {
        sendRaw(res, result);
        return;
      }
      sendJson(res, 200, result ?? { ok: true });
    } catch (error) {
      sendError(res, error);
    }
  };
}

function createRoutes() {
  const routes: Route[] = [];
  const add = (method: HttpMethod, path: string, handler: Handler) => {
    const { pattern, keys } = compilePath(path);
    routes.push({ method, pattern, keys, handler });
  };

  add("GET", "/health", (context) => ({
    status: "ok",
    service: "gym-platform-api",
    persistenceDriver: context.config.persistenceDriver,
    apiInstanceId: context.config.apiInstanceId,
    checkedAt: new Date().toISOString()
  }));

  add("POST", "/webhooks/stripe", async (context) => {
    return context.services.posStripeService.handleWebhook(
      context.rawBody ?? Buffer.from(""),
      typeof context.req.headers["stripe-signature"] === "string"
        ? context.req.headers["stripe-signature"]
        : undefined
    );
  });

  add("GET", "/media/member-images/:assetId", async (context) => {
    const image = await readMemberProfileImage(context.config, requiredParam(context, "assetId"));
    return {
      raw: true,
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": image.cacheControl
      },
      body: image.body
    } satisfies RawResponse;
  });

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

  add("GET", "/gyms", async (context) => {
    const auth = requireAuth(context);
    await requirePlatformAdmin(context, auth);
    return { gyms: await context.services.tenancyService.listSettingsGyms() };
  });

  add("POST", "/platform/gyms", async (context) => {
    const auth = requireAuth(context);
    await requirePlatformAdmin(context, auth);
    const input = parseWith(registerSchema, context.body);
    if (!input.gymName) {
      throw badRequest("Gym name is required.", "gym_name_required");
    }
    const result = await context.services.authService.register(input);
    return {
      user: result.user,
      gym: result.gym,
      emailVerificationToken: result.emailVerificationToken
    };
  });

  add("DELETE", "/platform/gyms/:gymId", async (context) => {
    const auth = requireAuth(context);
    await requirePlatformAdmin(context, auth);
    return context.services.tenancyService.archiveGym(requiredParam(context, "gymId"));
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
      rooms: await context.services.locationService.listRooms(
        gymId,
        requiredParam(context, "locationId")
      )
    };
  });

  add("GET", "/gyms/:gymId/resources", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.LocationRead);
    return {
      resources: await context.services.reservationResourceService.listResources(
        gymId,
        context.query.get("locationId") ?? undefined
      )
    };
  });

  add("POST", "/gyms/:gymId/resources", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.LocationUpdate);
    const input = parseWith(resourceCreateSchema, context.body);
    return context.services.reservationResourceService.createResource(gymId, input);
  });

  add("PATCH", "/gyms/:gymId/resources/:resourceId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.LocationUpdate);
    const input = parseWith(resourceUpdateSchema, context.body);
    return context.services.reservationResourceService.updateResource(
      gymId,
      requiredParam(context, "resourceId"),
      input
    );
  });

  add("DELETE", "/gyms/:gymId/resources/:resourceId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.LocationArchive);
    return context.services.reservationResourceService.archiveResource(
      gymId,
      requiredParam(context, "resourceId")
    );
  });

  add("GET", "/gyms/:gymId/resources/:resourceId/availability", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingRead);
    const from = new Date(context.query.get("from") ?? "");
    const to = new Date(context.query.get("to") ?? "");
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw badRequest("Availability date range is invalid.", "invalid_availability_range");
    }
    return context.services.reservationResourceService.availability(
      gymId,
      requiredParam(context, "resourceId"),
      from,
      to
    );
  });

  add("GET", "/gyms/:gymId/facility-reservations", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingRead);
    return {
      reservations: await context.services.reservationResourceService.listFacilityReservations(gymId)
    };
  });

  add("POST", "/gyms/:gymId/facility-reservations", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
    const input = parseWith(facilityReservationCreateSchema, context.body);
    return context.services.reservationResourceService.createFacilityReservation(
      gymId,
      auth.sub,
      input
    );
  });

  add("GET", "/gyms/:gymId/facility-reservations/:reservationId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingRead);
    return context.services.reservationResourceService.getFacilityReservation(
      gymId,
      requiredParam(context, "reservationId")
    );
  });

  add("DELETE", "/gyms/:gymId/facility-reservations/:reservationId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
    const input = context.body ? parseWith(facilityReservationCancelSchema, context.body) : {};
    return context.services.reservationResourceService.cancelFacilityReservation(
      gymId,
      requiredParam(context, "reservationId"),
      auth.sub,
      input
    );
  });

  add("POST", "/gyms/:gymId/locations", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.LocationCreate
    );
    const input = parseWith(locationCreateSchema, context.body);
    return context.services.locationService.create(gymId, input);
  });

  add("PATCH", "/gyms/:gymId/locations/:locationId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.LocationUpdate
    );
    const input = parseWith(locationUpdateSchema, context.body);
    return context.services.locationService.update(
      gymId,
      requiredParam(context, "locationId"),
      input
    );
  });

  add("DELETE", "/gyms/:gymId/locations/:locationId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.LocationArchive
    );
    return context.services.locationService.archive(gymId, requiredParam(context, "locationId"));
  });

  add("POST", "/gyms/:gymId/roles/assign", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.StaffRoleAssign
    );
    const input = parseWith(roleAssignmentSchema, context.body);
    return context.services.roleService.assignRole(gymId, input.userId, input.roleId, auth.sub);
  });

  add("POST", "/gyms/:gymId/roles", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.StaffRoleAssign
    );
    const input = parseWith(customRoleCreateSchema, context.body);
    return context.services.roleService.createCustomRole(gymId, input, auth.sub);
  });

  add("PATCH", "/gyms/:gymId/roles/:roleId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.StaffRoleAssign
    );
    const input = parseWith(customRoleUpdateSchema, context.body);
    return context.services.roleService.updateCustomRole(
      gymId,
      requiredParam(context, "roleId"),
      input,
      auth.sub
    );
  });

  add("DELETE", "/gyms/:gymId/roles/:roleId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.StaffRoleAssign
    );
    return context.services.roleService.deleteCustomRole(
      gymId,
      requiredParam(context, "roleId"),
      auth.sub
    );
  });

  add("GET", "/gyms/:gymId/roles", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRead);
    return { roles: await context.services.roleService.listRoles(gymId, auth.sub) };
  });

  add("GET", "/gyms/:gymId/staff", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    const permissions = await requireAnyPermission(context, gymId, auth.sub, [
      Permission.StaffRead,
      Permission.StaffDirectoryView
    ]);
    return {
      staff: await context.services.roleService.listStaffAccess(
        gymId,
        permissions.includes(Permission.StaffDirectoryView) ? undefined : auth.sub
      )
    };
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
    return context.services.roleService.removeStaffAccess(
      gymId,
      requiredParam(context, "userId"),
      auth.sub,
      input
    );
  });

  add("GET", "/gyms/:gymId/staff/invites", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRead);
    return { invites: await context.services.roleService.listStaffInvites(gymId, auth.sub) };
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
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.StaffRoleAssign
    );
    const input = parseWith(staffShiftCreateSchema, context.body);
    const visibleStaffUserIds = await context.services.roleService.visibleStaffUserIds(
      gymId,
      auth.sub
    );
    if (visibleStaffUserIds && !visibleStaffUserIds.has(input.userId)) {
      throw forbidden("Staff can only schedule users below their role branch.");
    }
    return context.services.staffScheduleService.createShift(gymId, auth.sub, input);
  });

  add("GET", "/gyms/:gymId/scheduler/rules", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ScheduleRead);
    return { rules: await context.services.schedulerService.listCoverageRules(gymId) };
  });

  add("POST", "/gyms/:gymId/scheduler/rules", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ScheduleCreate);
    const input = parseWith(schedulerCoverageRuleCreateSchema, context.body);
    return context.services.schedulerService.createCoverageRule(gymId, auth.sub, input);
  });

  add("GET", "/gyms/:gymId/scheduler/settings", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ScheduleRead);
    return context.services.schedulerService.getSettings(gymId);
  });

  add("PATCH", "/gyms/:gymId/scheduler/settings", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ScheduleCreate);
    const input = parseWith(schedulerSettingsUpdateSchema, context.body);
    return context.services.schedulerService.updateSettings(gymId, input);
  });

  add("GET", "/gyms/:gymId/scheduler/availability", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ScheduleRead);
    const visibleStaffUserIds = await context.services.roleService.visibleStaffUserIds(gymId, auth.sub);
    return {
      availability: await context.services.schedulerService.listAvailabilities(
        gymId,
        visibleStaffUserIds
      )
    };
  });

  add("GET", "/gyms/:gymId/scheduler/availability/me", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    return {
      availability: await context.services.schedulerService.listAvailabilities(
        gymId,
        new Set([auth.sub])
      )
    };
  });

  add("POST", "/gyms/:gymId/scheduler/availability", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ScheduleCreate);
    const input = parseWith(schedulerAvailabilityCreateSchema, context.body);
    const visibleStaffUserIds = await context.services.roleService.visibleStaffUserIds(gymId, auth.sub);
    if (visibleStaffUserIds && !visibleStaffUserIds.has(input.userId)) {
      throw forbidden("Schedulers can only edit availability for visible staff.");
    }
    return context.services.schedulerService.createAvailability(gymId, input);
  });

  add("GET", "/gyms/:gymId/scheduler/preference-requests", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.ScheduleRead
    );
    const visibleStaffUserIds = await context.services.roleService.visibleStaffUserIds(gymId, auth.sub);
    return {
      requests: await context.services.schedulerService.listPreferenceRequests(
        gymId,
        visibleStaffUserIds
      )
    };
  });

  add("GET", "/gyms/:gymId/scheduler/preference-requests/me", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    return {
      requests: await context.services.schedulerService.listPreferenceRequestsForStaff(
        gymId,
        auth.sub
      )
    };
  });

  add("POST", "/gyms/:gymId/scheduler/preference-requests", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    const input = parseWith(schedulerPreferenceRequestCreateSchema, context.body);
    return context.services.schedulerService.createPreferenceRequest(gymId, auth.sub, input);
  });

  add("POST", "/gyms/:gymId/scheduler/preference-requests/:requestId/resolve", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.ScheduleRequestsManage
    );
    const input = parseWith(schedulerPreferenceRequestResolveSchema, context.body);
    return context.services.schedulerService.resolvePreferenceRequest(
      gymId,
      requiredParam(context, "requestId"),
      auth.sub,
      input
    );
  });

  add("GET", "/gyms/:gymId/scheduler/requests", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.ScheduleRequestsManage
    );
    const visibleStaffUserIds = await context.services.roleService.visibleStaffUserIds(gymId, auth.sub);
    return {
      requests: await context.services.schedulerService.listRequests(gymId, visibleStaffUserIds)
    };
  });

  add("GET", "/gyms/:gymId/scheduler/requests/me", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    return { requests: await context.services.schedulerService.listRequestsForStaff(gymId, auth.sub) };
  });

  add("POST", "/gyms/:gymId/scheduler/requests", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    const input = parseWith(schedulerRequestCreateSchema, context.body);
    return context.services.schedulerService.createRequest(gymId, auth.sub, input);
  });

  add("POST", "/gyms/:gymId/scheduler/generate", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ScheduleCreate);
    const input = parseWith(schedulerGenerateSchema, context.body);
    return context.services.schedulerService.generateDraft(gymId, input);
  });

  add("POST", "/gyms/:gymId/scheduler/publish", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.SchedulePublish);
    const input = parseWith(schedulerPublishSchema, context.body);
    return context.services.schedulerService.publishGeneratedSchedule(gymId, auth.sub, input);
  });

  add("POST", "/gyms/:gymId/scheduler/requests/:requestId/resolve", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.ScheduleRequestsManage
    );
    const input = parseWith(schedulerRequestResolveSchema, context.body);
    if (input.decision === "apply" && input.autoAssignReplacement) {
      await context.services.roleService.requirePermission(
        gymId,
        auth.sub,
        Permission.ScheduleAutoResolve
      );
    }
    return context.services.schedulerService.resolveRequest(
      gymId,
      requiredParam(context, "requestId"),
      auth.sub,
      input
    );
  });

  add("GET", "/gyms/:gymId/staff/shifts", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.StaffRead);
    const shifts = await context.services.staffScheduleService.listShifts(gymId);
    const visibleStaffUserIds = await context.services.roleService.visibleStaffUserIds(
      gymId,
      auth.sub
    );
    return {
      shifts: visibleStaffUserIds
        ? shifts.filter((shift) => visibleStaffUserIds.has(shift.userId))
        : shifts
    };
  });

  add("GET", "/gyms/:gymId/staff/shifts/me", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.GymRead);
    return {
      shifts: await context.services.staffScheduleService.listShiftsForStaff(gymId, auth.sub)
    };
  });

  add("GET", "/gyms/:gymId/staff/time-entries", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    const permissions = await requireAnyPermission(context, gymId, auth.sub, [
      Permission.StaffRead,
      Permission.StaffDirectoryView
    ]);
    const entries = await context.services.staffTimeClockService.listEntries(gymId);
    if (!permissions.includes(Permission.StaffRead)) {
      return {
        entries: entries.filter((entry) => entry.userId === auth.sub || !entry.clockedOutAt)
      };
    }
    const visibleStaffUserIds = await context.services.roleService.visibleStaffUserIds(
      gymId,
      auth.sub
    );
    return {
      entries: visibleStaffUserIds
        ? entries.filter((entry) => visibleStaffUserIds.has(entry.userId))
        : entries
    };
  });

  add("GET", "/gyms/:gymId/staff/time-entries/me", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.GymRead);
    return {
      entries: await context.services.staffTimeClockService.listEntriesForStaff(gymId, auth.sub)
    };
  });

  add("POST", "/gyms/:gymId/staff/time-entries/clock-in", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.StaffRoleAssign
    );
    const input = parseWith(staffClockInSchema, context.body);
    const visibleStaffUserIds = await context.services.roleService.visibleStaffUserIds(
      gymId,
      auth.sub
    );
    if (visibleStaffUserIds && !visibleStaffUserIds.has(input.userId)) {
      throw forbidden("Staff can only clock users below their role branch.");
    }
    return context.services.staffTimeClockService.clockIn(gymId, auth.sub, input);
  });

  add("POST", "/gyms/:gymId/staff/time-entries/me/clock-in", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    const input = parseWith(staffSelfClockInSchema, context.body);
    return context.services.staffTimeClockService.clockIn(gymId, auth.sub, {
      ...input,
      userId: auth.sub
    });
  });

  add("POST", "/gyms/:gymId/staff/time-entries/clock-out", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(
      gymId,
      auth.sub,
      Permission.StaffRoleAssign
    );
    const input = parseWith(staffClockOutSchema, context.body);
    const visibleStaffUserIds = await context.services.roleService.visibleStaffUserIds(
      gymId,
      auth.sub
    );
    if (visibleStaffUserIds && !visibleStaffUserIds.has(input.userId)) {
      throw forbidden("Staff can only clock users below their role branch.");
    }
    return context.services.staffTimeClockService.clockOut(gymId, auth.sub, input);
  });

  add("POST", "/gyms/:gymId/staff/time-entries/me/clock-out", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    const input = parseWith(staffSelfClockOutSchema, context.body);
    return context.services.staffTimeClockService.clockOut(gymId, auth.sub, {
      ...input,
      userId: auth.sub
    });
  });

  add("GET", "/gyms/:gymId/consumers", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberRead);
    return { consumers: await context.services.memberService.list(gymId) };
  });

  add("POST", "/gyms/:gymId/consumers", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
    const input = parseWith(consumerCreateSchema, context.body);
    return context.services.memberService.create(gymId, input);
  });

  add("POST", "/gyms/:gymId/consumers/profile-image", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
    const input = parseWith(consumerProfileImageUploadSchema, context.body);
    const upload = await uploadMemberProfileImage(
      context.config,
      {
        gymId,
        ...(input.consumerId ? { consumerId: input.consumerId } : {})
      },
      input
    );
    return {
      assetId: upload.assetId,
      url: buildMediaUrl(context, `/media/member-images/${upload.assetId}`),
      contentType: upload.contentType
    };
  });

  add("POST", "/gyms/:gymId/pos/purchases", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentWrite);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
    const input = parseWith(posPurchaseSchema, context.body);
    if (input.planId) {
      await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PlanRead);
    }
    return context.services.posService.collectPurchase(gymId, input);
  });

  add("GET", "/gyms/:gymId/pos/stripe/config", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentWrite);
    return context.services.posStripeService.getConfig(gymId);
  });

  add("POST", "/gyms/:gymId/pos/payment-intents", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentWrite);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
    const input = parseWith(posPurchaseSchema, context.body);
    if (input.planId) {
      await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PlanRead);
    }
    return context.services.posStripeService.createPaymentIntent(gymId, input);
  });

  add("POST", "/gyms/:gymId/pos/payment-intents/:paymentIntentId/finalize", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PaymentWrite);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
    const input = parseWith(posStripeFinalizeSchema, {
      paymentIntentId: requiredParam(context, "paymentIntentId")
    });
    return context.services.posStripeService.finalizePaymentIntent(gymId, input.paymentIntentId);
  });

  add("PATCH", "/gyms/:gymId/consumers/:consumerId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
    const input = parseWith(consumerUpdateSchema, context.body);
    return context.services.memberService.update(gymId, requiredParam(context, "consumerId"), input);
  });

  add("DELETE", "/gyms/:gymId/consumers/:consumerId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
    return context.services.memberService.archive(gymId, requiredParam(context, "consumerId"));
  });

  add("GET", "/gyms/:gymId/consumers/:consumerId/memberships", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberRead);
    return {
      memberships: await context.services.memberMembershipService.list(
        gymId,
        requiredParam(context, "consumerId")
      )
    };
  });

  add("POST", "/gyms/:gymId/consumers/:consumerId/memberships", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PlanRead);
    const input = parseWith(memberMembershipAssignSchema, context.body);
    return context.services.memberMembershipService.assignPlan(
      gymId,
      requiredParam(context, "consumerId"),
      input
    );
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
      memberships: await context.services.memberMembershipService.list(
        gymId,
        requiredParam(context, "memberId")
      )
    };
  });

  add("POST", "/gyms/:gymId/members/:memberId/memberships", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.MemberWrite);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.PlanRead);
    const input = parseWith(memberMembershipAssignSchema, context.body);
    return context.services.memberMembershipService.assignPlan(
      gymId,
      requiredParam(context, "memberId"),
      input
    );
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
    return context.services.membershipPlanService.update(
      gymId,
      requiredParam(context, "planId"),
      input
    );
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

  add("POST", "/gyms/:gymId/class-sessions/:sessionId/resource-allocations", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.ClassWrite);
    const input = parseWith(classSessionResourceAllocationSchema, context.body);
    return context.services.reservationResourceService.allocateClassSession(
      gymId,
      requiredParam(context, "sessionId"),
      input
    );
  });

  add("GET", "/gyms/:gymId/class-sessions/:sessionId/bookings", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingRead);
    return {
      bookings: await context.services.bookingService.listForSession(
        gymId,
        requiredParam(context, "sessionId")
      )
    };
  });

  add("POST", "/gyms/:gymId/class-sessions/:sessionId/bookings", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
    const input = parseWith(classBookingCreateSchema, context.body);
    return context.services.bookingService.createBooking(
      gymId,
      requiredParam(context, "sessionId"),
      input
    );
  });

  add("POST", "/gyms/:gymId/class-sessions/:sessionId/bookings/manual", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
    const input = parseWith(staffManualBookingSchema, context.body);
    return context.services.bookingService.createStaffManualBooking(
      gymId,
      requiredParam(context, "sessionId"),
      auth.sub,
      input
    );
  });

  add("DELETE", "/gyms/:gymId/class-bookings/:bookingId", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
    return context.services.bookingService.cancelBooking(
      gymId,
      requiredParam(context, "bookingId"),
      auth.sub
    );
  });

  add("POST", "/gyms/:gymId/class-sessions/:sessionId/waitlist", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
    const input = parseWith(waitlistJoinSchema, context.body);
    return context.services.bookingService.joinWaitlist(
      gymId,
      requiredParam(context, "sessionId"),
      input
    );
  });

  add("DELETE", "/gyms/:gymId/class-bookings/:bookingId/waitlist", async (context) => {
    const auth = requireAuth(context);
    const gymId = requiredParam(context, "gymId");
    await context.services.tenancyService.ensureGymAccess(auth.sub, gymId);
    await context.services.roleService.requirePermission(gymId, auth.sub, Permission.BookingWrite);
    return context.services.bookingService.leaveWaitlist(
      gymId,
      requiredParam(context, "bookingId"),
      auth.sub
    );
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
      checkIns: await context.services.checkInService.listForMember(
        gymId,
      requiredParam(context, "memberId")
    )
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
    return context.services.accessControlService.rotateDeviceApiKey(
      gymId,
      requiredParam(context, "deviceId")
    );
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
    return context.services.classScheduleService.publicSchedule(
      gym.slug,
      from,
      to,
      locationId ? { locationId } : {}
    );
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
    const plans = (await context.services.membershipPlanService.list(gym.id)).filter(
      (plan) => plan.isPublic && plan.status !== PlanStatus.Archived
    );
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
    const membershipStatus =
      plan.trialDays > 0 ? MembershipStatus.Trialing : MembershipStatus.Active;
    const createdMember = await context.services.memberService.create(gym.id, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      ...(input.phone ? { phone: input.phone } : {}),
      status: memberStatus,
      tagNames: ["online-signup"]
    });
    const membership = await context.services.memberMembershipService.assignPlan(gym.id, createdMember.id, {
      planId: plan.id,
      status: membershipStatus
    });
    const member = await context.services.memberService.get(gym.id, createdMember.id);
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

async function getActiveGymBySlug(context: RequestContext, gymSlug: string) {
  const gym = await context.services.repositories.gyms.findGymBySlug(gymSlug);
  if (!gym || gym.status !== GymStatus.Active) {
    throw notFound("Gym was not found.");
  }
  return gym;
}

function requireAuth(context: RequestContext) {
  const header = context.req.headers.authorization;
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    throw unauthorized();
  }
  const payload = verifyAccessToken(
    match[1],
    context.config.accessTokenSecret,
    context.services.clock.now()
  );
  if (!payload) {
    throw unauthorized("Access token is invalid or expired.");
  }
  context.auth = payload;
  return payload;
}

function requiredParam(context: RequestContext, key: string) {
  const value = context.params[key];
  if (!value) {
    throw badRequest(`Missing route parameter: ${key}`);
  }
  return value;
}

function parseWith<T extends ZodSchema>(schema: T, body: unknown): z.infer<T> {
  return schema.parse(body);
}

async function requireAnyPermission(
  context: RequestContext,
  gymId: string,
  userId: string,
  permissions: Permission[]
) {
  const granted = await context.services.roleService.permissionsForUser(gymId, userId);
  if (!permissions.some((permission) => granted.includes(permission))) {
    throw forbidden();
  }
  return granted;
}

async function requirePlatformAdmin(context: RequestContext, auth: AccessTokenPayload) {
  if (context.config.platformAdminEmails.includes(auth.email.toLowerCase())) {
    return;
  }
  if (!auth.gymId) {
    throw forbidden("Platform admin access is required.");
  }
  await context.services.roleService.requirePermission(
    auth.gymId,
    auth.sub,
    Permission.PlatformAdmin
  );
}

async function readBody(req: IncomingMessage) {
  if (req.method === "GET") {
    return { body: undefined, rawBody: undefined as Buffer | undefined };
  }
  const chunks: Uint8Array<ArrayBufferLike>[] = [];
  for await (const chunk of req) {
    chunks.push(
      typeof chunk === "string"
        ? new TextEncoder().encode(chunk)
        : new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
    );
  }
  if (chunks.length === 0) {
    return { body: undefined, rawBody: undefined as Buffer | undefined };
  }
  const rawBody = Buffer.from(concatBytes(chunks));
  const raw = rawBody.toString("utf8");
  if (!raw.trim()) {
    return { body: undefined, rawBody };
  }
  try {
    return { body: JSON.parse(raw), rawBody };
  } catch {
    throw badRequest("Request body must be valid JSON.", "invalid_json");
  }
}

function concatBytes(chunks: Uint8Array<ArrayBufferLike>[]) {
  const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const merged = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

function matchRoute(routes: Route[], method: HttpMethod, pathname: string) {
  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }
    const match = route.pattern.exec(pathname);
    if (!match) {
      continue;
    }
    const params = Object.fromEntries(
      route.keys.map((key, index) => [key, decodeURIComponent(match[index + 1] ?? "")])
    );
    return { route, params };
  }
  return undefined;
}

function compilePath(path: string) {
  const keys: string[] = [];
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

function sendJson(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    ...corsHeaders,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendRaw(res: ServerResponse, response: RawResponse) {
  const bodyLength =
    typeof response.body === "string"
      ? Buffer.byteLength(response.body)
      : response.body.byteLength;
  res.writeHead(response.status, {
    ...corsHeaders,
    ...(response.headers ?? {}),
    "Content-Length": bodyLength
  });
  res.end(response.body);
}

function isRawResponse(value: unknown): value is RawResponse {
  return Boolean(value && typeof value === "object" && (value as { raw?: boolean }).raw);
}

function buildMediaUrl(context: RequestContext, path: string) {
  const baseUrl = context.config.mediaBaseUrl?.replace(/\/$/, "");
  if (baseUrl) {
    return `${baseUrl}${path}`;
  }
  const forwardedProto = context.req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto.split(",")[0] : "http";
  const host = context.req.headers.host ?? "127.0.0.1:4000";
  return `${protocol}://${host}${path}`;
}

function sendNoContent(res: ServerResponse, status: number) {
  res.writeHead(status, {
    ...corsHeaders,
    "Content-Length": "0"
  });
  res.end();
}

function sendError(res: ServerResponse, error: unknown) {
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
} as const;
