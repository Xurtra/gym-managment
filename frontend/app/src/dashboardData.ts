import { GymApiClient, type ApiTokenStore } from "@gym-platform/api-client";
import type { ClassSessionCreateInput } from "@gym-platform/validation";
import type {
  AccessDeviceStatus,
  AccessDeviceType,
  AccessEventDecision,
  CheckInMethod,
  CheckInStatus,
  ConsumerRecordStatus,
  ConsumerSegment,
  LeadStage,
  MemberStatus,
  MembershipStatus,
  Permission as PermissionValue
} from "@gym-platform/constants";
import { Permission } from "@gym-platform/constants";
import type {
  BookingMemberView,
  BookingSessionView,
  ClassBookingView,
  ClassLocationView,
  ClassSessionView,
  ClassTrainerView,
  ClassTypeView,
  MemberProfileMembershipView,
  MemberView
} from "@gym-platform/dashboard";

export const API_BASE_URL = "http://127.0.0.1:4000";
export const SESSION_STORAGE_KEY = "gym-platform-session";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  apiInstanceId?: string;
}

export interface GymRecord {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface MembershipRecord {
  id: string;
  gym?: GymRecord;
  role?: {
    name: string;
    permissions: PermissionValue[];
  };
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  activeGym?: GymRecord;
  memberships: MembershipRecord[];
}

export interface ConsumerListResponse {
  consumers: MemberView[];
}

interface MemberMembershipRecord {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  status: MembershipStatus;
  startsAt: string;
  endsAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PlanRecord {
  id: string;
  name: string;
}

interface MembershipPlanListResponse {
  plans?: unknown[];
}

interface ClassTypeListResponse {
  classTypes?: ClassTypeView[];
}

interface LocationListResponse {
  locations?: ClassLocationView[];
}

interface ClassBookingListResponse {
  bookings?: ClassBookingView[];
}

interface TrainerStaffRecord {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface StaffListResponse {
  staff?: TrainerStaffRecord[];
}

export interface DashboardWorkspaceData {
  me: MeResponse;
  gym: GymRecord;
  permissions: PermissionValue[];
  platformAdmin: boolean;
  members: MemberView[];
  classTypes: ClassTypeView[];
  locations: ClassLocationView[];
  trainers: ClassTrainerView[];
  classSessions: ClassSessionView[];
}

export interface MemberCreateFormInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: MemberStatus;
}

export interface MemberUpdateFormInput extends MemberCreateFormInput {
  tagNames: string[];
  notes?: string;
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<SessionTokens>;
    if (typeof parsed.accessToken !== "string" || typeof parsed.refreshToken !== "string") {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      ...(typeof parsed.apiInstanceId === "string" ? { apiInstanceId: parsed.apiInstanceId } : {})
    };
  } catch {
    return null;
  }
}

export function createDashboardClient(onSessionExpired?: () => void) {
  const tokenStore: ApiTokenStore = {
    getAccessToken: () => loadSession()?.accessToken,
    getRefreshToken: () => loadSession()?.refreshToken,
    setTokens(tokens) {
      const nextTokens = {
        ...tokens,
        ...(loadSession()?.apiInstanceId ? { apiInstanceId: loadSession()?.apiInstanceId } : {})
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextTokens));
    },
    clearTokens() {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  return new GymApiClient({
    baseUrl: API_BASE_URL,
    tokenStore,
    onSessionExpired
  });
}

export async function loadDashboardWorkspaceData(client = createDashboardClient()) {
  const me = (await client.me()) as MeResponse;
  const gym = me.activeGym ?? me.memberships[0]?.gym;
  if (!gym) {
    throw new Error("No active gym is available for this account.");
  }
  const currentMembership =
    me.memberships.find((membership) => membership.gym?.id === gym.id) ?? me.memberships[0];
  const permissions = currentMembership?.role?.permissions ?? [];
  const scheduleFrom = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const scheduleTo = new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString();
  const [consumerResponse, classTypeResponse, locationResponse, staffResponse, scheduleResponse] =
    await Promise.all([
      client.listConsumers(gym.id) as Promise<ConsumerListResponse>,
      safeLoad(() => client.listClassTypes(gym.id) as Promise<ClassTypeListResponse>, {}),
      safeLoad(() => client.listLocations(gym.id) as Promise<LocationListResponse>, {}),
      safeLoad(() => client.listStaff(gym.id) as Promise<StaffListResponse>, {}),
      safeLoad(
        () => client.publicSchedule(gym.slug, scheduleFrom, scheduleTo) as Promise<ClassSessionView[]>,
        []
      )
    ]);

  return {
    me,
    gym,
    permissions,
    platformAdmin: permissions.includes(Permission.PlatformAdmin),
    members: normalizeMembers(consumerResponse.consumers),
    classTypes: classTypeResponse.classTypes ?? [],
    locations: locationResponse.locations ?? [],
    trainers: normalizeTrainers(staffResponse.staff ?? []),
    classSessions: normalizeClassSessions(scheduleResponse)
  };
}

export async function loadPublicGymName(gymSlug: string) {
  const client = new GymApiClient({ baseUrl: API_BASE_URL });
  const response = (await client.publicGym(gymSlug)) as { gym?: { name?: string }; name?: string };
  return response.gym?.name ?? response.name ?? "Gym Platform";
}

export async function loadMemberMemberships(
  gymId: string,
  memberId: string,
  client = createDashboardClient()
): Promise<MemberProfileMembershipView[]> {
  const [membershipResponse, planResponse] = await Promise.all([
    client.listConsumerMemberships(gymId, memberId) as Promise<
      { memberships?: MemberMembershipRecord[] } | MemberMembershipRecord[]
    >,
    client.listMembershipPlans(gymId).catch(() => ({ plans: [] })) as Promise<{ plans?: PlanRecord[] }>
  ]);
  const memberships = Array.isArray(membershipResponse)
    ? membershipResponse
    : membershipResponse.memberships ?? [];
  const plans = planResponse.plans ?? [];
  const planNames = new Map(plans.map((plan) => [plan.id, plan.name]));

  return memberships.map((membership) => ({
    ...membership,
    planName: planNames.get(membership.planId) ?? membership.planId
  }));
}

export async function createMember(
  gymId: string,
  input: MemberCreateFormInput,
  client = createDashboardClient()
) {
  return client.createConsumer(gymId, {
    firstName: input.firstName,
    lastName: input.lastName,
    ...(input.email ? { email: input.email } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    status: input.status,
    tagNames: []
  });
}

export async function updateMember(
  gymId: string,
  memberId: string,
  input: MemberUpdateFormInput,
  client = createDashboardClient()
) {
  return client.updateConsumer(gymId, memberId, {
    firstName: input.firstName,
    lastName: input.lastName,
    ...(input.email ? { email: input.email } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    status: input.status,
    tagNames: input.tagNames,
    ...(input.notes ? { notes: input.notes } : {})
  });
}

export async function loadClassBookings(
  gymId: string,
  sessionId: string,
  client = createDashboardClient()
): Promise<ClassBookingView[]> {
  const response = (await client.listClassBookings(gymId, sessionId)) as
    | ClassBookingListResponse
    | ClassBookingView[];
  return Array.isArray(response) ? response : response.bookings ?? [];
}

export async function loadBookingsForSessions(
  gymId: string,
  sessionIds: string[],
  client = createDashboardClient()
): Promise<Record<string, ClassBookingView[]>> {
  const entries = await Promise.all(
    sessionIds.map(async (sessionId) => [sessionId, await loadClassBookings(gymId, sessionId, client)] as const)
  );
  return Object.fromEntries(entries);
}

export async function loadClassBookingsWorkspaceData(client = createDashboardClient()) {
  const data = await loadDashboardWorkspaceData(client);
  const bookingsBySession = await loadBookingsForSessions(
    data.gym.id,
    data.classSessions.map((classSession) => classSession.id),
    client
  );
  return { data, bookingsBySession };
}

export async function cancelBooking(gymId: string, bookingId: string, client = createDashboardClient()) {
  return client.cancelClassBooking(gymId, bookingId);
}

export async function createClassSession(
  gymId: string,
  input: ClassSessionCreateInput,
  client = createDashboardClient()
) {
  return client.createClassSession(gymId, input);
}

export function currentUserDisplayName(me: MeResponse) {
  return `${me.user.firstName ?? ""} ${me.user.lastName ?? ""}`.trim() || me.user.email;
}

function normalizeMembers(members: MemberView[]) {
  return members.map((member) => ({
    ...member,
    tagNames: member.tagNames ?? [],
    recordStatus: member.recordStatus as ConsumerRecordStatus,
    ...(member.leadStage ? { leadStage: member.leadStage as LeadStage } : {}),
    ...(member.segments ? { segments: member.segments as ConsumerSegment[] } : {})
  }));
}

export function toBookingMembers(members: MemberView[]): BookingMemberView[] {
  return members.map((member) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    ...(member.email ? { email: member.email } : {}),
    ...(member.phone ? { phone: member.phone } : {}),
    ...(member.barcode ? { barcode: member.barcode } : {})
  }));
}

export function toBookingSession(session: ClassSessionView, data: DashboardWorkspaceData): BookingSessionView {
  const className =
    data.classTypes.find((classType) => classType.id === session.classTypeId)?.name ?? "Unknown class";
  const locationName =
    data.locations.find((location) => location.id === session.locationId)?.name ?? "Unknown location";
  return {
    id: session.id,
    className,
    locationName,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    capacity: session.capacity,
    waitlistCapacity: session.waitlistCapacity
  };
}

function normalizeClassSessions(sessions: ClassSessionView[]): ClassSessionView[] {
  return sessions.map((session) => ({
    ...session,
    ...(session.trainerUserId ? { trainerUserId: session.trainerUserId } : {}),
    ...(session.roomName ? { roomName: session.roomName } : {})
  }));
}

function normalizeTrainers(staff: TrainerStaffRecord[]): ClassTrainerView[] {
  return staff.map((staffMember) => ({
    id: staffMember.userId,
    fullName:
      `${staffMember.firstName ?? ""} ${staffMember.lastName ?? ""}`.trim() || staffMember.email
  }));
}

async function safeLoad<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

export interface GrowthSummaryRecord {
  openLeads: number;
  dueToday: number;
  overdueCount: number;
  watchlistCount: number;
  convertedThisMonth: number;
}

export interface InteractionRecord {
  id: string;
  type: string;
  notes?: string;
  staffName?: string;
  occurredAt: string;
  createdAt: string;
}

export interface GrowthWorkspaceData extends DashboardWorkspaceData {
  summary: GrowthSummaryRecord;
  inboxConsumers: MemberView[];
  watchlistConsumers: MemberView[];
}

export async function loadGrowthWorkspaceData(
  client = createDashboardClient()
): Promise<GrowthWorkspaceData> {
  const base = await loadDashboardWorkspaceData(client);
  const [summary, inbox, watchlist] = await Promise.all([
    safeLoad(
      () => client.getGrowthSummary(base.gym.id) as Promise<GrowthSummaryRecord>,
      { openLeads: 0, dueToday: 0, overdueCount: 0, watchlistCount: 0, convertedThisMonth: 0 }
    ),
    safeLoad(
      () => client.getFollowUpInbox(base.gym.id) as Promise<{ consumers?: MemberView[] }>,
      { consumers: [] }
    ),
    safeLoad(
      () => client.getRetentionWatchlist(base.gym.id) as Promise<{ consumers?: MemberView[] }>,
      { consumers: [] }
    )
  ]);
  return {
    ...base,
    summary,
    inboxConsumers: inbox.consumers ?? [],
    watchlistConsumers: watchlist.consumers ?? []
  };
}

export async function loadGrowthInteractions(
  gymId: string,
  consumerId: string,
  client = createDashboardClient()
): Promise<InteractionRecord[]> {
  const result = (await client.listInteractions(gymId, consumerId)) as
    | { interactions?: InteractionRecord[] }
    | InteractionRecord[];
  return Array.isArray(result) ? result : result.interactions ?? [];
}

export async function logGrowthInteraction(
  gymId: string,
  consumerId: string,
  input: { type: "call" | "sms" | "email" | "note"; notes?: string },
  client = createDashboardClient()
) {
  return client.logInteraction(gymId, consumerId, input);
}

export async function convertGrowthLead(
  gymId: string,
  consumerId: string,
  input: { planId?: string },
  client = createDashboardClient()
) {
  return client.convertLeadToMember(gymId, consumerId, input);
}

export interface AuthActionResult {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  twoFactorRequired?: boolean;
  emailVerificationToken?: string;
  gym?: GymRecord;
}

export interface AccessDeviceRecord {
  id: string;
  locationId: string;
  locationName?: string;
  name: string;
  deviceType: AccessDeviceType;
  status: AccessDeviceStatus;
  apiKeyPreview: string;
  rotatedAt?: string;
  lastHeartbeatAt?: string;
}

export interface AccessRuleRecord {
  id: string;
  name: string;
  locationId: string;
  locationName?: string;
  planId?: string;
  planName?: string;
  allowAllActiveMembers: boolean;
}

export interface AccessEventRecord {
  id: string;
  deviceId: string;
  deviceName?: string;
  locationId: string;
  locationName?: string;
  memberId?: string;
  memberName?: string;
  decision: AccessEventDecision;
  reason: string;
  occurredAt: string;
}

export interface CheckInRecord {
  id: string;
  memberId: string;
  memberName?: string;
  locationId: string;
  locationName?: string;
  classSessionId?: string;
  className?: string;
  bookingId?: string;
  status: CheckInStatus;
  method: CheckInMethod;
  staffOverride: boolean;
  deniedReason?: string;
  overrideReason?: string;
  checkedInAt: string;
}

export interface StaffRecord {
  membershipId: string;
  gymId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleRecord {
  id: string;
  name: string;
  permissions: PermissionValue[];
  parentRoleId?: string;
  createsReservableResource?: boolean;
  isSystem?: boolean;
}

export interface StaffInviteRecord {
  id: string;
  email: string;
  roleId: string;
  roleName?: string;
  invitedByUserId: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface StaffShiftRecord {
  id: string;
  gymId: string;
  userId: string;
  locationId?: string;
  roleId: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffTimeEntryRecord {
  id: string;
  gymId: string;
  userId: string;
  locationId?: string;
  clockedInAt: string;
  clockedOutAt?: string;
  clockedInByUserId: string;
  clockedOutByUserId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceRecord {
  id: string;
  locationId?: string;
  parentResourceId?: string;
  name: string;
  resourceType: string;
  status: "active" | "archived";
  isBookable: boolean;
  isExclusive: boolean;
  capacity: number;
  amenities: string[];
  pricing: { amountCents: number };
  paymentRequirement: string;
  confirmationMode: string;
  linkedStaffUserId?: string;
  createdFromRoleId?: string;
  autoManaged?: boolean;
}

export interface FacilityReservationRecord {
  id: string;
  resourceId: string;
  locationId?: string;
  memberId: string;
  status: "pending" | "confirmed" | "cancelled";
  startsAt: string;
  endsAt: string;
  amountCents: number;
  paymentRequirement: string;
  paymentStatus: "not_required" | "unpaid" | "paid" | "refunded";
  cancellationFeeCents: number;
  refundAmountCents: number;
}

export interface StripeConnectAccountRecord {
  accountId?: string;
  country?: string;
  defaultCurrency?: string;
  businessName?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
  requirementsDue: string[];
  dashboardUrl?: string;
}

export interface PosTransactionRecord {
  id: string;
  gymId: string;
  memberId?: string;
  memberName?: string;
  amountCents: number;
  currency: string;
  paymentMethod: "card_reader" | "manual_entry";
  status: "succeeded" | "pending" | "failed" | "refunded";
  description?: string;
  refundedAmountCents?: number;
  createdAt: string;
}

export async function loginUser(input: {
  email: string;
  password: string;
  twoFactorCode?: string;
  recoveryCode?: string;
}) {
  const client = createDashboardClient();
  return (await client.login(input)) as AuthActionResult;
}

export async function registerUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gymName?: string;
  timezone?: string;
  locale?: string;
}) {
  const client = createDashboardClient();
  return (await client.register(input)) as AuthActionResult;
}

export async function forgotPassword(email: string) {
  const client = createDashboardClient();
  return client.forgotPassword(email);
}

export async function resetPassword(token: string, password: string) {
  const client = createDashboardClient();
  return client.resetPassword({ token, password });
}

export async function verifyEmail(token: string) {
  const client = createDashboardClient();
  return client.verifyEmail(token);
}

export async function resendVerification(email: string) {
  const client = createDashboardClient();
  return client.resendVerification(email);
}

export async function setupTwoFactor() {
  const client = createDashboardClient();
  return (await client.setupTwoFactor()) as { secret?: string; qrCodeDataUrl?: string };
}

export async function verifyTwoFactor(code: string) {
  const client = createDashboardClient();
  return (await client.verifyTwoFactor(code)) as { enabled?: boolean; recoveryCodes?: string[] };
}

export async function regenerateRecoveryCodes() {
  const client = createDashboardClient();
  return (await client.regenerateTwoFactorRecoveryCodes()) as { recoveryCodes?: string[] };
}

export async function loadOperationsWorkspace(client = createDashboardClient()) {
  const base = await loadDashboardWorkspaceData(client);
  const [checkIns, accessDevices, accessRules, accessEvents, resources, reservations, staff, roles, invites, shifts, timeEntries, stripeAccount] =
    await Promise.all([
      safeLoad(() => client.listCheckIns(base.gym.id) as Promise<{ checkIns?: CheckInRecord[] } | CheckInRecord[]>, []),
      safeLoad(() => client.listAccessDevices(base.gym.id) as Promise<{ devices?: AccessDeviceRecord[] } | AccessDeviceRecord[]>, []),
      safeLoad(() => client.listAccessRules(base.gym.id) as Promise<{ rules?: AccessRuleRecord[] } | AccessRuleRecord[]>, []),
      safeLoad(() => client.listAccessEvents(base.gym.id) as Promise<{ events?: AccessEventRecord[] } | AccessEventRecord[]>, []),
      safeLoad(() => client.listResources(base.gym.id) as Promise<{ resources?: ResourceRecord[] } | ResourceRecord[]>, []),
      safeLoad(() => client.listFacilityReservations(base.gym.id) as Promise<{ reservations?: FacilityReservationRecord[] } | FacilityReservationRecord[]>, []),
      safeLoad(() => client.listStaff(base.gym.id) as Promise<{ staff?: StaffRecord[] } | StaffRecord[]>, []),
      safeLoad(() => client.listRoles(base.gym.id) as Promise<{ roles?: RoleRecord[] } | RoleRecord[]>, []),
      safeLoad(() => client.listStaffInvites(base.gym.id) as Promise<{ invites?: StaffInviteRecord[] } | StaffInviteRecord[]>, []),
      safeLoad(() => client.listStaffShifts(base.gym.id) as Promise<{ shifts?: StaffShiftRecord[] } | StaffShiftRecord[]>, []),
      safeLoad(() => client.listStaffTimeEntries(base.gym.id) as Promise<{ timeEntries?: StaffTimeEntryRecord[] } | StaffTimeEntryRecord[]>, []),
      safeLoad(
        () => client.getStripeConnectAccount(base.gym.id) as Promise<StripeConnectAccountRecord>,
        {
          chargesEnabled: false,
          payoutsEnabled: false,
          onboardingComplete: false,
          requirementsDue: []
        }
      )
    ]);

  return {
    ...base,
    checkIns: normalizeArray(checkIns, "checkIns"),
    accessDevices: normalizeArray(accessDevices, "devices"),
    accessRules: normalizeArray(accessRules, "rules"),
    accessEvents: normalizeArray(accessEvents, "events"),
    resources: normalizeArray(resources, "resources"),
    reservations: normalizeArray(reservations, "reservations"),
    staff: normalizeArray(staff, "staff"),
    roles: normalizeArray(roles, "roles"),
    invites: normalizeArray(invites, "invites"),
    shifts: normalizeArray(shifts, "shifts"),
    timeEntries: normalizeArray(timeEntries, "timeEntries"),
    stripeAccount,
    posTransactions: [] as PosTransactionRecord[]
  };
}

export async function loadPlansWorkspaceData(client = createDashboardClient()) {
  const data = await loadDashboardWorkspaceData(client);
  const response = (await client.listMembershipPlans(data.gym.id)) as MembershipPlanListResponse | unknown[];
  return {
    data,
    plans: Array.isArray(response) ? response : response.plans ?? []
  };
}

export async function createManualCheckIn(
  gymId: string,
  input: {
    memberId?: string;
    barcode?: string;
    qrPayload?: string;
    locationId: string;
    classSessionId?: string;
    method: CheckInMethod;
    overrideEligibility?: boolean;
    overrideReason?: string;
  },
  client = createDashboardClient()
) {
  return client.createCheckIn(gymId, input);
}

export async function createAccessDevice(
  gymId: string,
  input: {
    locationId: string;
    name: string;
    deviceType: AccessDeviceType;
  },
  client = createDashboardClient()
) {
  return client.createAccessDevice(gymId, input);
}

export async function createResource(
  gymId: string,
  input: {
    locationId?: string;
    linkedStaffUserId?: string;
    name: string;
    resourceType: string;
    pricing: { amountCents: number };
    paymentRequirement: string;
  },
  client = createDashboardClient()
) {
  return client.createResource(gymId, input as never);
}

export async function createReservation(
  gymId: string,
  input: {
    resourceId: string;
    memberId: string;
    startsAt: string;
    endsAt: string;
    overrideConflict: boolean;
    note?: string;
  },
  client = createDashboardClient()
) {
  return client.createFacilityReservation(gymId, input);
}

export async function createStaffInvite(
  gymId: string,
  input: { email: string; roleId: string; message?: string },
  client = createDashboardClient()
) {
  return client.createStaffInvite(gymId, input);
}

export async function createPosTransaction(
  gymId: string,
  input: {
    memberId: string;
    amountCents: number;
    paymentMethod: "card_reader" | "manual_entry";
    note?: string;
    receiptEmail?: string;
  },
  client = createDashboardClient()
) {
  return client.createPosPurchase(gymId, input as never);
}

export function storeSession(tokens: SessionTokens) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearSessionTokens() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function normalizeArray<T>(
  value: T[] | Record<string, T[]>,
  key: string
) {
  if (Array.isArray(value)) {
    return value;
  }
  const candidate = value[key];
  return Array.isArray(candidate) ? candidate : [];
}
