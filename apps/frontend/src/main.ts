import { GymApiClient, ApiError, type ApiTokenStore } from "@gym-platform/api-client";
import { AccessDeviceType, BillingInterval, FeatureFlag, MemberStatus, MembershipStatus, Permission } from "@gym-platform/constants";
import {
  buildMemberListPage,
  buildMemberProfilePage,
  type CheckInRecord,
} from "@gym-platform/dashboard";
import {
  buildPublicPlansPage,
  buildPublicSchedulePage,
  buildPublicSignupPage
} from "@gym-platform/website-renderer";
import { CheckInMethod } from "@gym-platform/constants";
import "./style.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000";
const SESSION_STORAGE_KEY = "gym-platform-session";
const PUBLIC_SLUG_STORAGE_KEY = "gym-platform-public-slug";

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

interface HealthResponse {
  status: string;
  service: string;
}

interface GymRecord {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  locale: string;
  featureFlags: string[];
  logoUrl?: string;
  brandColors?: { primary: string; secondary?: string; accent?: string };
  businessInfo?: { email?: string; phone?: string; website?: string };
}

interface RoleRecord {
  id: string;
  name: string;
  permissions: string[];
}

interface MembershipRecord {
  id: string;
  gym?: GymRecord;
  role?: RoleRecord;
  status: string;
}

interface MeResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    twoFactorEnabled?: boolean;
  };
  activeGym?: GymRecord;
  memberships: MembershipRecord[];
}

interface AuthResponse {
  user: MeResponse["user"];
  accessToken?: string;
  refreshToken?: string;
  twoFactorRequired?: boolean;
  gym?: GymRecord;
}

interface MemberRecord {
  id: string;
  gymId: string;
  firstName: string;
  lastName: string;
  status: string;
  email?: string;
  phone?: string;
  barcode?: string;
  profileImageUrl?: string;
  portalEnabled?: boolean;
  emergencyContact?: { name: string; phone: string; relationship?: string };
  notes?: string;
  tagNames: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

interface MemberListResponse {
  members: MemberRecord[];
}

interface PlanRecord {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  billingInterval: string;
  priceCents: number;
  signupFeeCents: number;
  trialDays: number;
  autoRenew: boolean;
  contractLengthMonths?: number;
  classAccessLimit?: number;
  isPublic: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PlanListResponse {
  plans: PlanRecord[];
}

interface TwoFactorSetupResponse {
  secret: string;
  otpauthUrl: string;
}

interface TwoFactorVerifyResponse {
  enabled: true;
  recoveryCodes: string[];
}

interface TwoFactorRecoveryCodesResponse {
  recoveryCodes: string[];
}

interface LocationRecord {
  id: string;
  gymId: string;
  name: string;
  timezone: string;
  phone?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

interface LocationListResponse {
  locations: LocationRecord[];
}

interface ClassTypeRecord {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  defaultDurationMinutes: number;
  defaultCapacity: number;
  defaultWaitlistCapacity: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClassTypeListResponse {
  classTypes: ClassTypeRecord[];
}

interface ClassBookingRecord {
  id: string;
  gymId: string;
  classSessionId: string;
  memberId: string;
  status: string;
  waitlistPosition?: number;
  bookedAt: string;
  cancelledAt?: string;
  isLateCancellation: boolean;
  lateCancellationFeeCents: number;
  staffOverride: boolean;
  overrideReason?: string;
}

interface ClassBookingListResponse {
  bookings: ClassBookingRecord[];
}

interface MemberMembershipRecord {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  status: string;
  startsAt: string;
  endsAt?: string;
}

interface MemberMembershipListResponse {
  memberships: MemberMembershipRecord[];
}

interface StaffAccessRecord {
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

interface StaffListResponse {
  staff: StaffAccessRecord[];
}

interface StaffInviteRecord {
  id: string;
  gymId: string;
  email: string;
  roleId: string;
  invitedByUserId: string;
  status: string;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface StaffInviteCreateResponse {
  invite: StaffInviteRecord;
  inviteToken: string;
}

interface MemberPortalInviteResponse {
  token: string;
  setupUrl: string;
  purpose: "setup" | "reset";
  expiresAt: string;
  member: MemberRecord;
}

interface StaffInviteListResponse {
  invites: StaffInviteRecord[];
}

interface StaffAuditRecord {
  id: string;
  gymId: string;
  actorUserId: string;
  targetUserId: string;
  action: string;
  previousRoleId?: string;
  nextRoleId?: string;
  previousStatus?: string;
  nextStatus?: string;
  reason?: string;
  createdAt: string;
}

interface StaffAuditListResponse {
  entries: StaffAuditRecord[];
}

interface RoleListResponse {
  roles: RoleRecord[];
}

interface AccessDeviceRecord {
  id: string;
  gymId: string;
  locationId: string;
  name: string;
  deviceType: string;
  status: string;
  apiKeyPreview: string;
  lastHeartbeatAt?: string;
  createdAt: string;
  updatedAt: string;
  rotatedAt?: string;
}

interface AccessDeviceListResponse {
  devices: AccessDeviceRecord[];
}

interface AccessDeviceCreateResponse {
  device: AccessDeviceRecord;
  apiKey: string;
}

interface AccessRuleRecord {
  id: string;
  gymId: string;
  locationId: string;
  name: string;
  planId?: string;
  allowAllActiveMembers: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AccessRuleListResponse {
  rules: AccessRuleRecord[];
}

interface AccessEventRecord {
  id: string;
  gymId: string;
  deviceId: string;
  locationId: string;
  memberId?: string;
  decision: string;
  reason: string;
  occurredAt: string;
  createdAt: string;
}

interface AccessEventListResponse {
  events: AccessEventRecord[];
}

interface AccessDeviceEventResponse {
  unlock: boolean;
  reason: string;
  event: AccessEventRecord;
  memberId?: string;
}

interface StripePaymentAccountRecord {
  id: string;
  gymId: string;
  stripeAccountId: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsCurrentlyDue: string[];
  dashboardUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface StripePaymentAccountResponse {
  account?: StripePaymentAccountRecord;
  onboardingUrl?: string;
}

interface StripePaymentRecord {
  id: string;
  gymId: string;
  memberId?: string;
  stripeAccountId?: string;
  stripePaymentIntentId?: string;
  amountCents: number;
  currency: string;
  applicationFeeCents: number;
  paymentMethod: "card_reader" | "manual_entry";
  status: "pending" | "succeeded" | "failed" | "refunded";
  note?: string;
  receiptEmail?: string;
  refundedAmountCents: number;
  createdAt: string;
  updatedAt: string;
}

interface StripePaymentListResponse {
  payments: StripePaymentRecord[];
}

interface NotificationRecord {
  id: string;
  gymId: string;
  type: string;
  status: string;
  recipientMemberId: string;
  relatedBookingId?: string;
  payload: Record<string, unknown>;
  sentAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationListResponse {
  notifications: NotificationRecord[];
}

interface ContractWaiverDocumentRecord {
  id: string;
  gymId: string;
  title: string;
  type: "contract" | "waiver";
  version: number;
  requiresSignature: boolean;
  signedMemberCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

interface ContractWaiverDocumentListResponse {
  documents: ContractWaiverDocumentRecord[];
}

interface PublicGymResponse {
  gym: GymRecord;
}

interface PublicPlanListResponse {
  gym: Pick<GymRecord, "id" | "name" | "slug" | "featureFlags">;
  plans: PlanRecord[];
}

interface PublicSessionRecord {
  id: string;
  gymId: string;
  classTypeId: string;
  locationId: string;
  trainerUserId?: string;
  roomName?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  waitlistCapacity: number;
  status: string;
}

interface PublicSignupResponse {
  gym: { id: string; name: string; slug: string };
  member: { id: string; firstName: string; lastName: string; email?: string };
  membership: { id: string; status: string };
  plan: {
    id: string;
    name: string;
    billingInterval: string;
    priceCents: number;
    signupFeeCents: number;
    trialDays: number;
  };
  summary: { totalDueTodayCents: number };
}

type ViewName = "dashboard" | "public" | "memberPortalSetup";
type BannerTone = "success" | "error" | "info";

interface AppState {
  view: ViewName;
  apiHealthy: boolean | null;
  dashboardLoading: boolean;
  publicLoading: boolean;
  session: SessionTokens | null;
  me: MeResponse | null;
  gym: GymRecord | null;
  platformGyms: GymRecord[];
  members: MemberRecord[];
  plans: PlanRecord[];
  locations: LocationRecord[];
  classTypes: ClassTypeRecord[];
  classSessions: PublicSessionRecord[];
  classBookings: Record<string, ClassBookingRecord[]>;
  memberMemberships: Record<string, MemberMembershipRecord[]>;
  roles: RoleRecord[];
  staff: StaffAccessRecord[];
  staffInvites: StaffInviteRecord[];
  staffAudit: StaffAuditRecord[];
  latestInviteToken?: string;
  latestMemberPortalInvite?: {
    memberId: string;
    setupUrl: string;
    token: string;
    purpose: "setup" | "reset";
    expiresAt: string;
  };
  accessDevices: AccessDeviceRecord[];
  accessRules: AccessRuleRecord[];
  accessEvents: AccessEventRecord[];
  latestAccessApiKey?: string;
  latestAccessDecision?: AccessDeviceEventResponse;
  stripeAccount?: StripePaymentAccountRecord;
  stripePayments: StripePaymentRecord[];
  latestStripeOnboardingUrl?: string;
  notifications: NotificationRecord[];
  contractWaiverDocuments: ContractWaiverDocumentRecord[];
  twoFactorLogin?: { email: string; password: string };
  twoFactorSetup?: TwoFactorSetupResponse;
  twoFactorRecoveryCodes: string[];
  publicSlug: string;
  publicGym: GymRecord | null;
  publicPlans: PlanRecord[];
  publicSchedule: PublicSessionRecord[];
  selectedPlanId: string;
  banner?: { tone: BannerTone; text: string };
  createdGym?: GymRecord;
  publicSuccess?: string;
  // Dashboard sub-views
  dashboardView: "home" | "plans" | "members" | "member_profile" | "locations" | "classes" | "staff" | "security" | "access" | "payments" | "notifications" | "contracts" | "check_in" | "check_in_history" | "member_search";
  selectedMemberId?: string;
  selectedClassSessionId: string;
  memberSearchQuery: string;
  checkInBarcode: string;
  selectedCheckInLocationId: string;
  checkInResult?: CheckInRecord;
  checkInHistory: CheckInRecord[];
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

const state: AppState = {
  view: readView(),
  apiHealthy: null,
  dashboardLoading: false,
  publicLoading: false,
  session: loadSession(),
  me: null,
  gym: null,
  platformGyms: [],
  members: [],
  plans: [],
  locations: [],
  classTypes: [],
  classSessions: [],
  classBookings: {},
  memberMemberships: {},
  roles: [],
  staff: [],
  staffInvites: [],
  staffAudit: [],
  accessDevices: [],
  accessRules: [],
  accessEvents: [],
  stripePayments: [],
  notifications: [],
  contractWaiverDocuments: [],
  twoFactorRecoveryCodes: [],
  publicSlug: loadPublicSlug(),
  publicGym: null,
  publicPlans: [],
  publicSchedule: [],
  selectedPlanId: "",
  dashboardView: "home",
  selectedClassSessionId: "",
  memberSearchQuery: "",
  checkInBarcode: "",
  selectedCheckInLocationId: "",
  checkInHistory: [],
};

const tokenStore: ApiTokenStore = {
  getAccessToken: () => state.session?.accessToken,
  getRefreshToken: () => state.session?.refreshToken,
  setTokens(tokens) {
    state.session = tokens;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tokens));
  },
  clearTokens() {
    state.session = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

const client = new GymApiClient({
  baseUrl: API_BASE_URL,
  tokenStore,
  onSessionExpired() {
    clearDashboardState();
    setBanner("info", "Your session expired. Please log in again.");
    render();
  }
});

window.addEventListener("hashchange", () => {
  state.view = readView();
  render();
});

void initialize();

async function initialize() {
  const gymSlugMatch = new URLSearchParams(window.location.search).get("gymSlug");
  if (gymSlugMatch) {
    state.publicSlug = gymSlugMatch;
    localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, gymSlugMatch);
  }
  // Always load platform gyms for the home page
  try {
    const gymsData = await client.listGyms() as { gyms: GymRecord[] };
    state.platformGyms = gymsData.gyms || [];
  } catch (err) {
    console.error("Failed to load platform gyms", err);
  }

  render();
  await checkApiHealth();
  if (state.session) {
    await refreshDashboard();
  }
  if (state.publicSlug) {
    await refreshPublic(state.publicSlug);
  }
  render();
}

async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = (await response.json()) as HealthResponse;
    state.apiHealthy = data.status === "ok";
  } catch {
    state.apiHealthy = false;
    setBanner("error", "Service is unavailable. Please try again shortly.");
  }
}

async function refreshDashboard() {
  if (!state.session) {
    return;
  }
  state.dashboardLoading = true;
  render();
  try {
    const me = (await client.me()) as MeResponse;
    state.me = me;
    state.gym = me.activeGym ?? me.memberships[0]?.gym ?? null;
    if (state.gym) {
      const scheduleFrom = new Date();
      const scheduleTo = new Date(scheduleFrom);
      scheduleTo.setUTCDate(scheduleTo.getUTCDate() + 30);
      const [
        members,
        plans,
        locations,
        classTypes,
        classSessions,
        roles,
        staff,
        staffInvites,
        staffAudit,
        accessDevices,
        accessRules,
        accessEvents,
        stripeAccount,
        stripePayments,
        notifications,
        contractWaiverDocuments
      ] = (await Promise.all([
        client.listMembers(state.gym.id) as Promise<MemberListResponse>,
        client.listMembershipPlans(state.gym.id) as Promise<PlanListResponse>,
        client.listLocations(state.gym.id) as Promise<LocationListResponse>,
        client.listClassTypes(state.gym.id) as Promise<ClassTypeListResponse>,
        client.publicSchedule(
          state.gym.slug,
          scheduleFrom.toISOString(),
          scheduleTo.toISOString()
        ) as Promise<PublicSessionRecord[]>,
        client.listRoles(state.gym.id) as Promise<RoleListResponse>,
        client.listStaff(state.gym.id) as Promise<StaffListResponse>,
        client.listStaffInvites(state.gym.id) as Promise<StaffInviteListResponse>,
        client.listStaffAuditLogs(state.gym.id) as Promise<StaffAuditListResponse>,
        client.listAccessDevices(state.gym.id) as Promise<AccessDeviceListResponse>,
        client.listAccessRules(state.gym.id) as Promise<AccessRuleListResponse>,
        client.listAccessEvents(state.gym.id) as Promise<AccessEventListResponse>,
        client.getStripePaymentAccount(state.gym.id) as Promise<StripePaymentAccountResponse>,
        client.listPayments(state.gym.id) as Promise<StripePaymentListResponse>,
        client.listNotifications(state.gym.id) as Promise<NotificationListResponse>,
        client.listContractWaiverDocuments(state.gym.id) as Promise<ContractWaiverDocumentListResponse>
      ])) as [
        MemberListResponse,
        PlanListResponse,
        LocationListResponse,
        ClassTypeListResponse,
        PublicSessionRecord[],
        RoleListResponse,
        StaffListResponse,
        StaffInviteListResponse,
        StaffAuditListResponse,
        AccessDeviceListResponse,
        AccessRuleListResponse,
        AccessEventListResponse,
        StripePaymentAccountResponse,
        StripePaymentListResponse,
        NotificationListResponse,
        ContractWaiverDocumentListResponse
      ];
      state.members = members.members;
      state.plans = plans.plans;
      state.locations = locations.locations;
      state.classTypes = classTypes.classTypes;
      state.classSessions = classSessions;
      state.roles = roles.roles;
      state.staff = staff.staff;
      state.staffInvites = staffInvites.invites;
      state.staffAudit = staffAudit.entries;
      state.accessDevices = accessDevices.devices;
      state.accessRules = accessRules.rules;
      state.accessEvents = accessEvents.events;
      state.stripeAccount = stripeAccount.account;
      state.stripePayments = stripePayments.payments;
      state.notifications = notifications.notifications;
      state.contractWaiverDocuments = contractWaiverDocuments.documents;
      if (!state.selectedCheckInLocationId || !state.locations.some((location) => location.id === state.selectedCheckInLocationId)) {
        state.selectedCheckInLocationId = state.locations[0]?.id ?? "";
      }
      if (!state.selectedClassSessionId || !state.classSessions.some((session) => session.id === state.selectedClassSessionId)) {
        state.selectedClassSessionId = state.classSessions[0]?.id ?? "";
      }
      state.classBookings = Object.fromEntries(
        await Promise.all(
          state.classSessions.map(async (session) => {
            const bookings = (await client.listClassBookings(
              state.gym?.id ?? "",
              session.id
            )) as ClassBookingListResponse;
            return [session.id, bookings.bookings] as const;
          })
        )
      );
      state.memberMemberships = Object.fromEntries(
        await Promise.all(
          state.members.map(async (member) => {
            const memberships = (await client.listMemberMemberships(
              state.gym?.id ?? "",
              member.id
            )) as MemberMembershipListResponse;
            return [member.id, memberships.memberships] as const;
          })
        )
      );
      if (!state.publicSlug) {
        state.publicSlug = state.gym.slug;
        localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, state.publicSlug);
      }
    } else {
      const isPlatformAdmin = state.me?.memberships?.some(m => m.role?.permissions?.includes("platform:admin"));
      if (isPlatformAdmin) {
        const gymsData = await client.listGyms() as { gyms: GymRecord[] };
        state.platformGyms = gymsData.gyms || [];
      }
      state.members = [];
      state.plans = [];
      state.locations = [];
      state.classTypes = [];
      state.classSessions = [];
      state.classBookings = {};
      state.memberMemberships = {};
      state.roles = [];
      state.staff = [];
      state.staffInvites = [];
      state.staffAudit = [];
      state.latestInviteToken = undefined;
      state.accessDevices = [];
      state.accessRules = [];
      state.accessEvents = [];
      state.latestAccessApiKey = undefined;
      state.latestAccessDecision = undefined;
      state.stripeAccount = undefined;
      state.stripePayments = [];
      state.latestStripeOnboardingUrl = undefined;
      state.notifications = [];
      state.contractWaiverDocuments = [];
      state.selectedCheckInLocationId = "";
      state.selectedClassSessionId = "";
    }
    if (state.publicSlug) {
      await refreshPublic(state.publicSlug, false);
    }
  } catch (error) {
    clearDashboardState();
    setBanner("error", describeError(error));
  } finally {
    state.dashboardLoading = false;
    render();
  }
}

async function refreshPublic(slug: string, shouldRender = true) {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) {
    state.publicGym = null;
    state.publicPlans = [];
    state.publicSchedule = [];
    state.selectedPlanId = "";
    if (shouldRender) {
      render();
    }
    return;
  }

  state.publicLoading = true;
  state.publicSlug = cleanSlug;
  localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, cleanSlug);
  if (shouldRender) {
    render();
  }

  try {
    const [gymResponse, planResponse, scheduleResponse] = (await Promise.all([
      client.publicGym(cleanSlug) as Promise<PublicGymResponse>,
      client.publicPlans(cleanSlug) as Promise<PublicPlanListResponse>,
      client.publicSchedule(cleanSlug, new Date().toISOString()) as Promise<PublicSessionRecord[]>
    ])) as [PublicGymResponse, PublicPlanListResponse, PublicSessionRecord[]];
    state.publicGym = gymResponse.gym;
    state.publicPlans = planResponse.plans;
    state.publicSchedule = scheduleResponse;
    if (!state.selectedPlanId || !state.publicPlans.some((plan) => plan.id === state.selectedPlanId)) {
      state.selectedPlanId = state.publicPlans[0]?.id ?? "";
    }
  } catch (error) {
    state.publicGym = null;
    state.publicPlans = [];
    state.publicSchedule = [];
    state.selectedPlanId = "";
    setBanner("error", describeError(error));
  } finally {
    state.publicLoading = false;
    if (shouldRender) {
      render();
    }
  }
}

function render() {
  const publicPlanPage = state.publicGym
    ? buildPublicPlansPage({
        plans: state.publicPlans,
        featureFlags: state.publicGym.featureFlags,
        featuredPlanId: state.selectedPlanId || state.publicPlans[0]?.id
      })
    : undefined;
  const publicSignupPage = state.publicGym
    ? buildPublicSignupPage({
        plans: state.publicPlans,
        featureFlags: state.publicGym.featureFlags,
        selectedPlanId: state.selectedPlanId
      })
    : undefined;
  const publicSchedulePage = state.publicGym
    ? buildPublicSchedulePage({
        sessions: state.publicSchedule.map((session) => ({
          id: session.id,
          classTypeName: session.classTypeId,
          locationId: session.locationId,
          locationName: session.locationId,
          startsAt: session.startsAt,
          endsAt: session.endsAt,
          status: session.status as "scheduled" | "cancelled" | "completed",
          ...(session.roomName ? { roomName: session.roomName } : {})
        })),
        featureFlags: state.publicGym.featureFlags
      })
    : undefined;
  app.innerHTML = `
    <div class="shell">

      <main class="layout" style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
        <section class="panel primary" style="width:100%;">
          ${renderBanner()}
          ${state.view === "dashboard"
            ? renderDashboard()
            : state.view === "memberPortalSetup"
              ? renderMemberPortalSetup()
              : renderPublic(publicPlanPage, publicSignupPage, publicSchedulePage)}
        </section>
      </main>
    </div>
  `;
  bindEvents();
}

function renderMemberPortalSetup() {
  const token = memberPortalSetupToken();
  return `
    <div class="auth-card" style="max-width:560px;margin:0 auto;">
      <p class="eyebrow">Member portal</p>
      <h1>Set your password</h1>
      <p class="muted">Create a password to use your gym membership on the mobile app.</p>
      ${
        token
          ? `<form id="member-portal-setup-form" class="form-card">
              <input type="hidden" name="token" value="${escapeAttribute(token)}" />
              ${renderInput("password", "New password", "password")}
              <button type="submit">Set password</button>
            </form>`
          : `<div class="empty-state"><h3>Missing setup token</h3><p>Ask the gym staff to generate a new member portal link.</p></div>`
      }
    </div>
  `;
}

function renderDashboard() {
  if (state.dashboardLoading) {
    return `<div class="empty-state"><h2>Loading dashboard</h2><p>Refreshing workspace data.</p></div>`;
  }

  const gymSlugMatch = new URLSearchParams(window.location.search).get("gymSlug");

  if (!gymSlugMatch) {
    return renderPlatformDashboard();
  }

  if (!state.session || !state.me) {
    const gymNameTitle = state.publicGym ? state.publicGym.name : gymSlugMatch;
    const logoHtml = state.publicGym?.logoUrl
      ? `<img src="${state.publicGym.logoUrl}" alt="${state.publicGym.name} logo" style="max-height: 48px; margin-bottom: 0.5rem; display: block;" />`
      : '';

    return `
      <div class="section-head">
        <div>${logoHtml}
          <p class="eyebrow">Gym Authentication</p>
          <h2>Log in to ${gymNameTitle}</h2>
        </div>
      </div>
      <div class="two-up">
        <form id="login-form" class="form-card">
          <h3>Log in</h3>
          ${renderInput("email", "Email", "email")}
          ${renderInput("password", "Password", "password")}
          <button type="submit">Log in</button>
        </form>
        ${
          state.twoFactorLogin
            ? `<form id="two-factor-login-form" class="form-card">
                <h3>Two-factor code</h3>
                <p class="muted">Enter a six-digit authenticator code or a recovery code.</p>
                ${renderInput("twoFactorCode", "Authenticator code")}
                ${renderInput("recoveryCode", "Recovery code")}
                <button type="submit">Verify login</button>
              </form>`
            : ""
        }
        <form id="accept-staff-invite-form" class="form-card">
          <h3>Accept staff invite</h3>
          ${renderInput("token", "Invite token")}
          ${renderInput("firstName", "First name")}
          ${renderInput("lastName", "Last name")}
          ${renderInput("password", "Password", "password")}
          <button type="submit">Accept invite</button>
        </form>
      </div>
    `;
  }

  if (!state.gym) {
    return `
      <div class="section-head"><div>
        <p class="eyebrow">Gym setup</p>
        <h2>Create your first gym</h2>
      </div></div>
      <form id="create-gym-form" class="form-card">
        ${renderInput("name", "Gym name")}
        <button type="submit">Create gym</button>
      </form>
    `;
  }

  // Navigation tabs
  const tabs = `
    <nav style="display:flex;gap:8px;margin-bottom:1.5rem;flex-wrap:wrap;">
      <button class="tab-btn ${state.dashboardView === 'home' ? 'active' : ''}" data-dashboard-view="home">Dashboard</button>
      <button class="tab-btn ${state.dashboardView === 'plans' ? 'active' : ''}" data-dashboard-view="plans">Plans</button>
      <button class="tab-btn ${state.dashboardView === 'members' ? 'active' : ''}" data-dashboard-view="members">Members</button>
      <button class="tab-btn ${state.dashboardView === 'locations' ? 'active' : ''}" data-dashboard-view="locations">Locations</button>
      <button class="tab-btn ${state.dashboardView === 'classes' ? 'active' : ''}" data-dashboard-view="classes">Classes</button>
      <button class="tab-btn ${state.dashboardView === 'staff' ? 'active' : ''}" data-dashboard-view="staff">Staff</button>
      <button class="tab-btn ${state.dashboardView === 'security' ? 'active' : ''}" data-dashboard-view="security">Security</button>
      <button class="tab-btn ${state.dashboardView === 'access' ? 'active' : ''}" data-dashboard-view="access">Access</button>
      <button class="tab-btn ${state.dashboardView === 'payments' ? 'active' : ''}" data-dashboard-view="payments">Payments</button>
      <button class="tab-btn ${state.dashboardView === 'notifications' ? 'active' : ''}" data-dashboard-view="notifications">Notifications</button>
      <button class="tab-btn ${state.dashboardView === 'contracts' ? 'active' : ''}" data-dashboard-view="contracts">Contracts</button>
      <button class="tab-btn ${state.dashboardView === 'member_search' ? 'active' : ''}" data-dashboard-view="member_search">Search</button>
      <button class="tab-btn ${state.dashboardView === 'check_in' ? 'active' : ''}" data-dashboard-view="check_in">Check-In</button>
      <button class="tab-btn ${state.dashboardView === 'check_in_history' ? 'active' : ''}" data-dashboard-view="check_in_history">History</button>
    </nav>
  `;

  let content = '';
  switch (state.dashboardView) {
    case 'members':
      content = renderMembersView();
      break;
    case 'plans':
      content = renderPlansView();
      break;
    case 'member_profile':
      content = renderMemberProfileView();
      break;
    case 'locations':
      content = renderLocationsView();
      break;
    case 'classes':
      content = renderClassesView();
      break;
    case 'staff':
      content = renderStaffView();
      break;
    case 'security':
      content = renderSecurityView();
      break;
    case 'access':
      content = renderAccessView();
      break;
    case 'payments':
      content = renderPaymentsView();
      break;
    case 'notifications':
      content = renderNotificationsView();
      break;
    case 'contracts':
      content = renderContractsView();
      break;
    case 'member_search':
      content = renderMemberSearchView();
      break;
    case 'check_in':
      content = renderCheckInView();
      break;
    case 'check_in_history':
      content = renderCheckInHistoryView();
      break;
    default:
      content = renderDashboardHome();
  }

  return `
    <div class="section-head" style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <p class="eyebrow">${state.gym.name}</p>
        <h2 style="font-size:1.5rem;">${state.gym.slug}</h2>
      </div>
      <button id="logout-button" class="ghost-button" type="button">Log out</button>
    </div>
    ${tabs}
    ${content}
  `;
}

function renderDashboardHome() {
  return `
    <div class="stat-grid">
      <article class="mini-card">
        <span>Members</span>
        <strong>${state.members.length}</strong>
        <small>Active roster</small>
      </article>
      <article class="mini-card">
        <span>Plans</span>
        <strong>${state.plans.length}</strong>
        <small>Membership offers</small>
      </article>
      <article class="mini-card">
        <span>Locations</span>
        <strong>${state.locations.length}</strong>
        <small>Physical sites</small>
      </article>
      <article class="mini-card">
        <span>Classes</span>
        <strong>${state.classSessions.length}</strong>
        <small>Upcoming sessions</small>
      </article>
      <article class="mini-card">
        <span>Staff</span>
        <strong>${state.staff.length}</strong>
        <small>Active access records</small>
      </article>
      <article class="mini-card">
        <span>Access</span>
        <strong>${state.accessDevices.length}</strong>
        <small>Door devices</small>
      </article>
      <article class="mini-card">
        <span>Payments</span>
        <strong>${state.stripePayments.length}</strong>
        <small>${formatCents(state.stripePayments.reduce((total, payment) => total + payment.amountCents, 0))}</small>
      </article>
      <article class="mini-card">
        <span>Notifications</span>
        <strong>${state.notifications.filter((notification) => notification.status === "pending").length}</strong>
        <small>Pending delivery</small>
      </article>
      <article class="mini-card">
        <span>Contracts</span>
        <strong>${state.contractWaiverDocuments.filter((document) => !document.archivedAt).length}</strong>
        <small>Active documents</small>
      </article>
      <article class="mini-card">
        <span>Gym slug</span>
        <strong>${state.gym?.slug ?? ''}</strong>
        <small>Public site handle</small>
      </article>
    </div>
    <div class="two-up">
      <form id="create-plan-form" class="form-card">
        <h3>Create public plan</h3>
        ${renderInput("name", "Plan name")}
        ${renderInput("description", "Description")}
        ${renderInput("price", "Monthly price", "number", "49")}
        ${renderInput("signupFee", "Signup fee", "number", "0")}
        ${renderSelect("billingInterval", "Billing interval",
          Object.values(BillingInterval).map(v => ({ value: v, label: v.replace("_", " ") })),
          BillingInterval.Monthly
        )}
        ${renderInput("trialDays", "Trial days", "number", "0")}
        ${renderInput("contractLengthMonths", "Contract months", "number", "0")}
        ${renderInput("classAccessLimit", "Class access limit", "number")}
        <button type="submit">Create plan</button>
      </form>
      <form id="create-member-form" class="form-card">
        <h3>Create member</h3>
        ${renderInput("firstName", "First name")}
        ${renderInput("lastName", "Last name")}
        ${renderInput("email", "Email", "email")}
        ${renderInput("phone", "Phone", "tel")}
        ${renderInput("barcode", "Barcode")}
        ${renderInput("profileImageUrl", "Profile image URL", "url")}
        <button type="submit">Create member</button>
      </form>
    </div>
    <section class="data-card" style="margin-top:1rem;">
      <div class="card-head"><h3>Members</h3></div>
      ${renderMembersTable(
        buildMemberListPage({ members: state.members, permissions: currentPermissions() })
      )}
    </section>
  `;
}

function renderPlansView() {
  const editablePlan = state.plans[0];
  return `
    <div class="two-up">
      <form id="create-plan-form" class="form-card">
        <h3>Create membership plan</h3>
        ${renderInput("name", "Plan name")}
        ${renderInput("description", "Description")}
        ${renderInput("price", "Price", "number", "49")}
        ${renderInput("signupFee", "Signup fee", "number", "0")}
        ${renderSelect("billingInterval", "Billing interval",
          Object.values(BillingInterval).map(v => ({ value: v, label: v.replace("_", " ") })),
          BillingInterval.Monthly
        )}
        ${renderInput("trialDays", "Trial days", "number", "0")}
        ${renderInput("contractLengthMonths", "Contract months", "number", "0")}
        ${renderInput("classAccessLimit", "Class access limit", "number")}
        ${renderSelect("autoRenew", "Auto renew", [{ value: "true", label: "Yes" }, { value: "false", label: "No" }], "true")}
        ${renderSelect("isPublic", "Public signup", [{ value: "true", label: "Visible" }, { value: "false", label: "Hidden" }], "true")}
        <button type="submit">Create plan</button>
      </form>

      <form id="update-plan-form" class="form-card">
        <h3>Update plan</h3>
        ${
          state.plans.length === 0
            ? `<p class="muted">Create a plan before updating one.</p>`
            : renderSelect("planId", "Plan", state.plans.map((plan) => ({ value: plan.id, label: plan.name })), editablePlan?.id ?? "")
        }
        ${renderInput("name", "New name")}
        ${renderInput("description", "New description")}
        ${renderInput("price", "New price", "number")}
        ${renderInput("signupFee", "New signup fee", "number")}
        ${renderSelect("billingInterval", "Billing interval", [{ value: "", label: "No change" }, ...Object.values(BillingInterval).map(v => ({ value: v, label: v.replace("_", " ") }))], "")}
        ${renderInput("trialDays", "Trial days", "number")}
        ${renderInput("contractLengthMonths", "Contract months", "number")}
        ${renderInput("classAccessLimit", "Class access limit", "number")}
        ${renderSelect("autoRenew", "Auto renew", [{ value: "", label: "No change" }, { value: "true", label: "Yes" }, { value: "false", label: "No" }], "")}
        ${renderSelect("isPublic", "Public signup", [{ value: "", label: "No change" }, { value: "true", label: "Visible" }, { value: "false", label: "Hidden" }], "")}
        <button type="submit" ${state.plans.length === 0 ? "disabled" : ""}>Update plan</button>
      </form>
    </div>

    <section class="data-card" style="margin-top:1rem;">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Membership plans</h3>
        <span>${state.plans.length} active</span>
      </div>
      ${
        state.plans.length === 0
          ? `<p class="muted">No plans yet.</p>`
          : `<div class="card-grid">
              ${state.plans.map((plan) => `
                <article class="mini-card">
                  <span>${escapeHtml(plan.billingInterval.replaceAll("_", " "))}${plan.isPublic ? " - public" : " - hidden"}</span>
                  <strong>${escapeHtml(plan.name)}</strong>
                  <small>${formatCents(plan.priceCents)}${plan.signupFeeCents > 0 ? ` + ${formatCents(plan.signupFeeCents)} signup` : ""}</small>
                  <small style="display:block;">${plan.trialDays} trial days - ${plan.autoRenew ? "auto-renews" : "no auto-renew"} - ${plan.classAccessLimit === undefined ? "unlimited classes" : `${plan.classAccessLimit} classes`}</small>
                  ${plan.description ? `<small style="display:block;">${escapeHtml(plan.description)}</small>` : ""}
                  <button type="button" data-action="archive-plan" data-plan-id="${plan.id}" style="margin-top:8px;">Archive plan</button>
                </article>
              `).join("")}
            </div>`
      }
    </section>
  `;
}

function renderMembersView() {
  return `
    <section class="data-card">
      <div class="card-head" style="display:flex;justify-content:space-between;align-items:center;">
        <h3>All Members</h3>
        <span>${state.members.length} total</span>
      </div>
      ${renderMembersTable(
        buildMemberListPage({ members: state.members, permissions: currentPermissions() })
      )}
    </section>
  `;
}

function renderMemberProfileView() {
  const member = state.members.find(m => m.id === state.selectedMemberId);
  if (!member) {
    return `<div class="empty-state"><h3>Member not found</h3><p>The selected member could not be found.</p></div>`;
  }
  const memberships = state.memberMemberships[member.id] ?? [];
  const profilePage = buildMemberProfilePage({
    member,
    memberships: memberships.map((membership) => ({
      ...membership,
      planName: planName(membership.planId),
      status: membership.status as MembershipStatus
    })),
    permissions: currentPermissions()
  });
  const activeMembership = memberships.find((membership) => membership.status === MembershipStatus.Active || membership.status === MembershipStatus.Trialing);
  const latestPortalInvite = state.latestMemberPortalInvite?.memberId === member.id ? state.latestMemberPortalInvite : undefined;
  const profilePhoto = member.profileImageUrl
    ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(`${member.firstName} ${member.lastName}`.trim())}" style="width:112px;height:112px;border-radius:28px;object-fit:cover;border:1px solid var(--border);" />`
    : `<div style="width:112px;height:112px;border-radius:28px;display:grid;place-items:center;background:var(--surface-muted);border:1px solid var(--border);font-size:2rem;font-weight:700;">${escapeHtml(`${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase() || "M")}</div>`;
  return `
    <div style="margin-bottom:1rem;">
      <button class="tab-btn active" data-dashboard-view="members">← Back to Members</button>
    </div>
    <div class="data-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Member Profile</p>
          <h2>${member.firstName} ${member.lastName}</h2>
        </div>
      </div>
      <div style="display:grid;gap:1rem;">
        <div class="mini-card">
          <strong>Profile image</strong>
          <div style="margin-top:0.75rem;">${profilePhoto}</div>
          ${member.profileImageUrl ? `<p style="margin:0.75rem 0 0;color:var(--muted);word-break:break-word;">${escapeHtml(member.profileImageUrl)}</p>` : `<p style="margin:0.75rem 0 0;color:var(--muted);">No image URL set</p>`}
        </div>
        <div class="mini-card">
          <strong>Contact</strong>
          <p style="margin:0.5rem 0;color:var(--muted);">${member.email || 'No email'} · ${member.phone || 'No phone'}</p>
        </div>
        <div class="mini-card">
          <strong>Status</strong>
          <p style="margin:0.5rem 0;color:var(--muted);">${profilePage.statusLabel}</p>
        </div>
        <div class="mini-card">
          <strong>Member portal</strong>
          <p style="margin:0.5rem 0;color:var(--muted);">${profilePage.portalStatusLabel}${member.email ? "" : " - add an email before inviting"}</p>
          <button type="button" data-action="create-member-portal-invite" data-member-id="${member.id}" ${profilePage.actions.find((action) => action.key === "portal_invite")?.button.disabled ? "disabled" : ""}>
            ${profilePage.portalActionLabel}
          </button>
          ${latestPortalInvite ? `
            <div class="token-box" style="margin-top:0.75rem;">
              <strong>${latestPortalInvite.purpose === "setup" ? "Setup link" : "Reset link"}</strong>
              <p style="word-break:break-all;margin:0.5rem 0;">${escapeHtml(latestPortalInvite.setupUrl)}</p>
              <small>Expires ${new Date(latestPortalInvite.expiresAt).toLocaleString()}</small>
              <button type="button" data-action="copy-member-portal-link" data-copy-value="${escapeAttribute(latestPortalInvite.setupUrl)}" style="margin-top:0.75rem;">Copy link</button>
            </div>
          ` : ""}
        </div>
        ${member.barcode ? `<div class="mini-card"><strong>Barcode</strong><p style="margin:0.5rem 0;color:var(--muted);">${member.barcode}</p></div>` : ''}
        <div class="mini-card">
          <strong>Membership</strong>
          <p style="margin:0.5rem 0;color:var(--muted);">${activeMembership ? planName(activeMembership.planId) : "No active membership assigned"}</p>
        </div>
        ${member.tagNames.length > 0 ? `<div class="mini-card"><strong>Tags</strong><p style="margin:0.5rem 0;color:var(--muted);">${member.tagNames.join(', ')}</p></div>` : ''}
        ${member.notes ? `<div class="mini-card"><strong>Notes</strong><p style="margin:0.5rem 0;color:var(--muted);">${member.notes}</p></div>` : ''}
      </div>
      <form id="assign-membership-form" class="form-card" style="margin-top:1rem;">
        <h3>Assign membership</h3>
        ${
          state.plans.length === 0
            ? `<p class="muted">Create a membership plan before assigning one.</p>`
            : renderSelect("planId", "Plan", state.plans.map((plan) => ({ value: plan.id, label: `${plan.name} - ${formatCents(plan.priceCents)}` })), state.plans[0]?.id ?? "")
        }
        <button type="submit" ${state.plans.length === 0 ? "disabled" : ""}>Assign plan</button>
      </form>
    </div>
  `;
}

function renderLocationsView() {
  return `
    <div class="two-up">
      <section class="data-card">
        <div class="card-head" style="margin-bottom:1rem;">
          <h3>Locations</h3>
          <span>${state.locations.length} total</span>
        </div>
        ${
          state.locations.length === 0
            ? `<p class="muted">Create a location before using check-ins, classes, or access control.</p>`
            : `<div style="display:grid;gap:8px;">
                ${state.locations.map((location) => `
                  <article class="mini-card">
                    <strong>${escapeHtml(location.name)}</strong>
                    <small>${escapeHtml(location.address.line1)}, ${escapeHtml(location.address.city)}, ${escapeHtml(location.address.region)} ${escapeHtml(location.address.postalCode)}</small>
                    <small style="display:block;">${escapeHtml(location.timezone)}${location.phone ? ` - ${escapeHtml(location.phone)}` : ""}</small>
                  </article>
                `).join("")}
              </div>`
        }
      </section>

      <form id="create-location-form" class="form-card">
        <h3>Create location</h3>
        ${renderInput("name", "Location name")}
        ${renderInput("line1", "Street address")}
        ${renderInput("line2", "Suite or unit")}
        ${renderInput("city", "City")}
        ${renderInput("region", "State or region")}
        ${renderInput("postalCode", "Postal code")}
        ${renderInput("country", "Country code", "text", "US")}
        ${renderInput("phone", "Phone", "tel")}
        ${renderInput("timezone", "Timezone", "text", state.gym?.timezone ?? "America/New_York")}
        <button type="submit">Create location</button>
      </form>
    </div>
  `;
}

function renderClassesView() {
  const selectedClassType = state.classTypes[0];
  const defaultEnd = new Date(Date.now() + (selectedClassType?.defaultDurationMinutes ?? 60) * 60_000);
  return `
    <div class="two-up">
      <form id="create-class-type-form" class="form-card">
        <h3>Create class type</h3>
        ${renderInput("name", "Class name")}
        ${renderInput("description", "Description")}
        ${renderInput("defaultDurationMinutes", "Default duration minutes", "number", "60")}
        ${renderInput("defaultCapacity", "Default capacity", "number", "12")}
        ${renderInput("defaultWaitlistCapacity", "Default waitlist capacity", "number", "4")}
        <button type="submit">Create class type</button>
      </form>

      <form id="create-class-session-form" class="form-card">
        <h3>Schedule class</h3>
        ${
          state.classTypes.length === 0
            ? `<p class="muted">Create a class type first.</p>`
            : renderSelect("classTypeId", "Class type", state.classTypes.map((classType) => ({ value: classType.id, label: classType.name })), selectedClassType?.id ?? "")
        }
        ${
          state.locations.length === 0
            ? `<p class="muted">Create a location before scheduling.</p>`
            : renderSelect("locationId", "Location", state.locations.map((location) => ({ value: location.id, label: location.name })), state.locations[0]?.id ?? "")
        }
        ${renderInput("roomName", "Room")}
        ${renderInput("startsAt", "Starts at", "datetime-local", toDateTimeLocal(new Date(Date.now() + 60 * 60_000)))}
        ${renderInput("endsAt", "Ends at", "datetime-local", toDateTimeLocal(defaultEnd))}
        ${renderInput("capacity", "Capacity", "number", String(selectedClassType?.defaultCapacity ?? 12))}
        ${renderInput("waitlistCapacity", "Waitlist capacity", "number", String(selectedClassType?.defaultWaitlistCapacity ?? 4))}
        <button type="submit" ${state.classTypes.length === 0 || state.locations.length === 0 ? "disabled" : ""}>Schedule class</button>
      </form>
    </div>

    <section class="data-card" style="margin-top:1rem;">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Upcoming classes</h3>
        <span>${state.classSessions.length} next 30 days</span>
      </div>
      ${
        state.classSessions.length === 0
          ? `<p class="muted">No scheduled classes yet.</p>`
          : `<div class="card-grid">
              ${state.classSessions.map((session) => renderClassSessionCard(session)).join("")}
            </div>`
      }
    </section>

    <form id="book-class-form" class="form-card" style="margin-top:1rem;">
      <h3>Book member into class</h3>
      ${
        state.classSessions.length === 0
          ? `<p class="muted">Schedule a class before booking.</p>`
          : renderSelect("sessionId", "Class session", state.classSessions.map((session) => ({ value: session.id, label: `${classTypeName(session.classTypeId)} - ${new Date(session.startsAt).toLocaleString()}` })), state.selectedClassSessionId)
      }
      ${
        state.members.length === 0
          ? `<p class="muted">Create a member before booking.</p>`
          : renderSelect("memberId", "Member", state.members.map((member) => ({ value: member.id, label: `${member.firstName} ${member.lastName}` })), state.members[0]?.id ?? "")
      }
      <button type="submit" ${state.classSessions.length === 0 || state.members.length === 0 ? "disabled" : ""}>Book member</button>
    </form>
  `;
}

function renderClassSessionCard(session: PublicSessionRecord) {
  const bookings = state.classBookings[session.id] ?? [];
  const activeBookings = bookings.filter((booking) => booking.status === "booked");
  const waitlisted = bookings.filter((booking) => booking.status === "waitlisted");
  return `
    <article class="mini-card">
      <span>${escapeHtml(locationName(session.locationId))}</span>
      <strong>${escapeHtml(classTypeName(session.classTypeId))}</strong>
      <small>${new Date(session.startsAt).toLocaleString()} - ${new Date(session.endsAt).toLocaleTimeString()}</small>
      <small style="display:block;">${escapeHtml(session.roomName ?? "No room")} · ${activeBookings.length}/${session.capacity} booked · ${waitlisted.length}/${session.waitlistCapacity} waitlisted</small>
    </article>
  `;
}

function renderStaffView() {
  const assignableRoles = staffAssignableRoles();
  const staffOptions = state.staff
    .filter((staff) => staff.userId !== state.me?.user.id && staff.status === "active")
    .map((staff) => ({
      value: staff.userId,
      label: `${staff.firstName} ${staff.lastName} (${staff.email})`
    }));
  return `
    <div class="two-up">
      <section class="data-card">
        <div class="card-head" style="margin-bottom:1rem;">
          <h3>Staff access</h3>
          <span>${state.staff.length} people</span>
        </div>
        ${
          state.staff.length === 0
            ? `<p class="muted">No staff records yet.</p>`
            : `<div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    ${state.staff.map((staff) => `
                      <tr>
                        <td>${escapeHtml(`${staff.firstName} ${staff.lastName}`)}</td>
                        <td>${escapeHtml(staff.email)}</td>
                        <td>${escapeHtml(staff.roleName)}</td>
                        <td>${escapeHtml(staff.status)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>`
        }
      </section>

      <form id="create-staff-invite-form" class="form-card">
        <h3>Invite staff</h3>
        ${renderInput("email", "Email", "email")}
        ${
          assignableRoles.length === 0
            ? `<p class="muted">Create or enable a staff role before inviting.</p>`
            : renderSelect("roleId", "Role", assignableRoles.map((role) => ({ value: role.id, label: roleLabel(role) })), assignableRoles[0]?.id ?? "")
        }
        ${renderInput("message", "Message")}
        <button type="submit" ${assignableRoles.length === 0 ? "disabled" : ""}>Create invite</button>
      </form>
    </div>

    ${
      state.latestInviteToken
        ? `<section class="data-card" style="margin-top:1rem;">
            <div class="card-head"><h3>Latest invite token</h3></div>
            <p class="muted">Give this token to the staff member so they can accept the invite.</p>
            <code style="display:block;white-space:normal;word-break:break-all;">${escapeHtml(state.latestInviteToken)}</code>
          </section>`
        : ""
    }

    <div class="two-up" style="margin-top:1rem;">
      <form id="create-custom-role-form" class="form-card">
        <h3>Create custom role</h3>
        ${renderInput("name", "Role name")}
        <div class="field">
          <span>Permissions</span>
          <div class="permissions-grid">
            ${Object.values(Permission)
              .filter((permission) => permission !== Permission.PlatformAdmin)
              .map((permission) => `
                <label class="permission-chip ${defaultCustomRolePermissions().includes(permission) ? "active" : ""}">
                  <input name="permissions" type="checkbox" value="${permission}" ${defaultCustomRolePermissions().includes(permission) ? "checked" : ""} />
                  <span>${escapeHtml(permissionLabel(permission))}</span>
                </label>
              `)
              .join("")}
          </div>
        </div>
        <button type="submit">Create role</button>
      </form>

      <section class="data-card">
        <div class="card-head" style="margin-bottom:1rem;">
          <h3>Roles</h3>
          <span>${state.roles.length} total</span>
        </div>
        <div style="display:grid;gap:8px;">
          ${state.roles.map((role) => `
            <article class="mini-card">
              <strong>${escapeHtml(roleLabel(role))}</strong>
              <small>${role.permissions.length} permissions</small>
            </article>
          `).join("")}
        </div>
      </section>
    </div>

    <div class="two-up" style="margin-top:1rem;">
      <form id="assign-staff-role-form" class="form-card">
        <h3>Change staff role</h3>
        ${
          staffOptions.length === 0
            ? `<p class="muted">There are no other active staff users to update.</p>`
            : renderSelect("userId", "Staff member", staffOptions, staffOptions[0]?.value ?? "")
        }
        ${
          assignableRoles.length === 0
            ? `<p class="muted">No assignable roles are available.</p>`
            : renderSelect("roleId", "New role", assignableRoles.map((role) => ({ value: role.id, label: roleLabel(role) })), assignableRoles[0]?.id ?? "")
        }
        <button type="submit" ${staffOptions.length === 0 || assignableRoles.length === 0 ? "disabled" : ""}>Update role</button>
      </form>

      <form id="remove-staff-access-form" class="form-card">
        <h3>Remove staff access</h3>
        ${
          staffOptions.length === 0
            ? `<p class="muted">There are no other active staff users to remove.</p>`
            : renderSelect("userId", "Staff member", staffOptions, staffOptions[0]?.value ?? "")
        }
        ${renderInput("reason", "Reason")}
        <button type="submit" ${staffOptions.length === 0 ? "disabled" : ""}>Remove access</button>
      </form>
    </div>

    <section class="data-card" style="margin-top:1rem;">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Pending invites</h3>
        <span>${state.staffInvites.length} total</span>
      </div>
      ${
        state.staffInvites.length === 0
          ? `<p class="muted">No invites yet.</p>`
          : `<div class="table-wrap">
              <table>
                <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Expires</th></tr></thead>
                <tbody>
                  ${state.staffInvites.map((invite) => `
                    <tr>
                      <td>${escapeHtml(invite.email)}</td>
                      <td>${escapeHtml(roleName(invite.roleId))}</td>
                      <td>${escapeHtml(invite.status)}</td>
                      <td>${new Date(invite.expiresAt).toLocaleString()}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>`
      }
    </section>

    <section class="data-card" style="margin-top:1rem;">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Recent staff audit</h3>
        <span>${state.staffAudit.length} events</span>
      </div>
      ${
        state.staffAudit.length === 0
          ? `<p class="muted">No staff audit events yet.</p>`
          : `<div style="display:grid;gap:8px;">
              ${state.staffAudit.slice(0, 8).map((entry) => `
                <article class="mini-card">
                  <strong>${escapeHtml(entry.action)}</strong>
                  <small>${new Date(entry.createdAt).toLocaleString()}${entry.reason ? ` - ${escapeHtml(entry.reason)}` : ""}</small>
                </article>
              `).join("")}
            </div>`
      }
    </section>
  `;
}

function renderSecurityView() {
  const enabled = Boolean(state.me?.user.twoFactorEnabled);
  return `
    <div class="two-up">
      <section class="data-card">
        <div class="card-head" style="margin-bottom:1rem;">
          <h3>Account security</h3>
          <span>${enabled ? "2FA enabled" : "2FA off"}</span>
        </div>
        <div class="mini-card">
          <strong>${escapeHtml(state.me?.user.email ?? "")}</strong>
          <small>${enabled ? "This account requires an authenticator code when logging in." : "Add an authenticator app code to protect this account."}</small>
        </div>
      </section>

      <form id="setup-2fa-form" class="form-card">
        <h3>Set up two-factor auth</h3>
        <p class="muted">${enabled ? "Two-factor auth is already enabled. You can still regenerate recovery codes." : "Start setup to get an authenticator secret."}</p>
        <button type="submit" ${enabled ? "disabled" : ""}>Start setup</button>
      </form>
    </div>

    ${
      state.twoFactorSetup
        ? `<section class="data-card" style="margin-top:1rem;">
            <div class="card-head"><h3>Authenticator setup</h3></div>
            <p class="muted">Add this secret to an authenticator app, then verify the six-digit code.</p>
            <div class="mini-card">
              <strong>Secret</strong>
              <code style="display:block;white-space:normal;word-break:break-all;">${escapeHtml(state.twoFactorSetup.secret)}</code>
              <small style="display:block;margin-top:8px;">${escapeHtml(state.twoFactorSetup.otpauthUrl)}</small>
            </div>
            <form id="verify-2fa-setup-form" class="form-card" style="margin-top:1rem;">
              ${renderInput("code", "Authenticator code")}
              <button type="submit">Enable two-factor auth</button>
            </form>
          </section>`
        : ""
    }

    <div class="two-up" style="margin-top:1rem;">
      <form id="regenerate-recovery-codes-form" class="form-card">
        <h3>Recovery codes</h3>
        <p class="muted">Generate new recovery codes if the old ones were lost or exposed.</p>
        <button type="submit" ${enabled ? "" : "disabled"}>Regenerate codes</button>
      </form>

      <section class="data-card">
        <div class="card-head" style="margin-bottom:1rem;">
          <h3>Latest recovery codes</h3>
          <span>${state.twoFactorRecoveryCodes.length} codes</span>
        </div>
        ${
          state.twoFactorRecoveryCodes.length === 0
            ? `<p class="muted">Recovery codes appear here after enabling 2FA or regenerating codes.</p>`
            : `<div style="display:grid;gap:8px;">
                ${state.twoFactorRecoveryCodes.map((code) => `<code class="mini-card">${escapeHtml(code)}</code>`).join("")}
              </div>`
        }
      </section>
    </div>
  `;
}

function renderAccessView() {
  const apiKeyValue = state.latestAccessApiKey ?? "";
  return `
    <div class="two-up">
      <section class="data-card">
        <div class="card-head" style="margin-bottom:1rem;">
          <h3>Access devices</h3>
          <span>${state.accessDevices.length} total</span>
        </div>
        ${
          state.accessDevices.length === 0
            ? `<p class="muted">Register a door device to test access decisions.</p>`
            : `<div style="display:grid;gap:8px;">
                ${state.accessDevices.map((device) => `
                  <article class="mini-card">
                    <span>${escapeHtml(locationName(device.locationId))}</span>
                    <strong>${escapeHtml(device.name)}</strong>
                    <small>${escapeHtml(device.status)} - ${escapeHtml(device.deviceType.replaceAll("_", " "))} - key ${escapeHtml(device.apiKeyPreview)}</small>
                    <small style="display:block;">${device.lastHeartbeatAt ? `Last heartbeat ${new Date(device.lastHeartbeatAt).toLocaleString()}` : "No heartbeat yet"}</small>
                    <button type="button" data-action="rotate-access-key" data-device-id="${device.id}" style="margin-top:8px;">Rotate key</button>
                  </article>
                `).join("")}
              </div>`
        }
      </section>

      <form id="create-access-device-form" class="form-card">
        <h3>Register device</h3>
        ${renderInput("name", "Device name", "text", "Front Door")}
        ${
          state.locations.length === 0
            ? `<p class="muted">Create a location before adding access devices.</p>`
            : renderSelect("locationId", "Location", state.locations.map((location) => ({ value: location.id, label: location.name })), state.locations[0]?.id ?? "")
        }
        ${renderSelect("deviceType", "Device type", Object.values(AccessDeviceType).map((type) => ({ value: type, label: type.replaceAll("_", " ") })), AccessDeviceType.DoorController)}
        <button type="submit" ${state.locations.length === 0 ? "disabled" : ""}>Register device</button>
      </form>
    </div>

    ${
      state.latestAccessApiKey
        ? `<section class="data-card" style="margin-top:1rem;">
            <div class="card-head"><h3>Latest device API key</h3></div>
            <p class="muted">Store this key now. The API only shows the full value immediately after registration or rotation.</p>
            <code style="display:block;white-space:normal;word-break:break-all;">${escapeHtml(state.latestAccessApiKey)}</code>
          </section>`
        : ""
    }

    <div class="two-up" style="margin-top:1rem;">
      <form id="create-access-rule-form" class="form-card">
        <h3>Create access rule</h3>
        ${renderInput("name", "Rule name", "text", "Front door members")}
        ${
          state.locations.length === 0
            ? `<p class="muted">Create a location first.</p>`
            : renderSelect("locationId", "Location", state.locations.map((location) => ({ value: location.id, label: location.name })), state.locations[0]?.id ?? "")
        }
        ${
          state.plans.length === 0
            ? `<p class="muted">Create a plan first, or allow all active members.</p>`
            : renderSelect("planId", "Plan", [{ value: "", label: "All active members" }, ...state.plans.map((plan) => ({ value: plan.id, label: plan.name }))], "")
        }
        ${renderInput("startsAt", "Starts at", "datetime-local")}
        ${renderInput("endsAt", "Ends at", "datetime-local")}
        <button type="submit" ${state.locations.length === 0 ? "disabled" : ""}>Create rule</button>
      </form>

      <section class="data-card">
        <div class="card-head" style="margin-bottom:1rem;">
          <h3>Access rules</h3>
          <span>${state.accessRules.length} total</span>
        </div>
        ${
          state.accessRules.length === 0
            ? `<p class="muted">No access rules yet.</p>`
            : `<div style="display:grid;gap:8px;">
                ${state.accessRules.map((rule) => `
                  <article class="mini-card">
                    <span>${escapeHtml(locationName(rule.locationId))}</span>
                    <strong>${escapeHtml(rule.name)}</strong>
                    <small>${rule.allowAllActiveMembers ? "All active members" : escapeHtml(planName(rule.planId ?? ""))}</small>
                  </article>
                `).join("")}
              </div>`
        }
      </section>
    </div>

    <div class="two-up" style="margin-top:1rem;">
      <form id="simulate-access-event-form" class="form-card">
        <h3>Test door access</h3>
        ${renderInput("apiKey", "Device API key", "text", apiKeyValue)}
        ${renderInput("barcode", "Member barcode")}
        <button type="submit">Run access check</button>
      </form>

      <form id="access-heartbeat-form" class="form-card">
        <h3>Send heartbeat</h3>
        ${renderInput("apiKey", "Device API key", "text", apiKeyValue)}
        <button type="submit">Send heartbeat</button>
      </form>
    </div>

    ${
      state.latestAccessDecision
        ? `<section class="data-card" style="margin-top:1rem;">
            <div class="card-head"><h3>Latest access decision</h3></div>
            <article class="mini-card">
              <strong>${state.latestAccessDecision.unlock ? "Unlocked" : "Denied"}</strong>
              <small>${escapeHtml(state.latestAccessDecision.reason)}${state.latestAccessDecision.memberId ? ` - ${escapeHtml(memberName(state.latestAccessDecision.memberId))}` : ""}</small>
            </article>
          </section>`
        : ""
    }

    <section class="data-card" style="margin-top:1rem;">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Access events</h3>
        <span>${state.accessEvents.length} total</span>
      </div>
      ${
        state.accessEvents.length === 0
          ? `<p class="muted">No access events yet.</p>`
          : `<div class="table-wrap">
              <table>
                <thead><tr><th>Decision</th><th>Reason</th><th>Member</th><th>Location</th><th>Time</th></tr></thead>
                <tbody>
                  ${state.accessEvents.slice(0, 12).map((event) => `
                    <tr>
                      <td>${escapeHtml(event.decision)}</td>
                      <td>${escapeHtml(event.reason)}</td>
                      <td>${event.memberId ? escapeHtml(memberName(event.memberId)) : "Unknown"}</td>
                      <td>${escapeHtml(locationName(event.locationId))}</td>
                      <td>${new Date(event.occurredAt).toLocaleString()}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>`
      }
    </section>
  `;
}

function renderPaymentsView() {
  const pointOfSaleEnabled = Boolean(state.gym?.featureFlags.includes(FeatureFlag.PointOfSale));
  const account = state.stripeAccount;
  return `
    <div class="two-up">
      <section class="data-card">
        <div class="card-head" style="margin-bottom:1rem;">
          <h3>Stripe connection</h3>
          <span>${account ? (account.chargesEnabled ? "ready" : "needs onboarding") : "not connected"}</span>
        </div>
        ${
          account
            ? `<div class="mini-card">
                <strong>${escapeHtml(account.stripeAccountId)}</strong>
                <small>${account.onboardingComplete ? "Onboarding complete" : "Onboarding required"} - ${account.chargesEnabled ? "charges enabled" : "charges disabled"}</small>
                ${account.requirementsCurrentlyDue.length > 0 ? `<small style="display:block;">Due: ${escapeHtml(account.requirementsCurrentlyDue.join(", "))}</small>` : ""}
                ${account.dashboardUrl ? `<small style="display:block;">${escapeHtml(account.dashboardUrl)}</small>` : ""}
              </div>`
            : `<p class="muted">Connect Stripe before collecting payments.</p>`
        }
        ${state.latestStripeOnboardingUrl ? `<p class="muted">Onboarding URL: <a href="${escapeAttribute(state.latestStripeOnboardingUrl)}" target="_blank" rel="noreferrer">Open Stripe onboarding</a></p>` : ""}
      </section>

      <form id="connect-stripe-form" class="form-card">
        <h3>${account ? "Refresh Stripe connection" : "Connect Stripe"}</h3>
        <p class="muted">Local development uses mock Stripe unless STRIPE_SECRET_KEY is configured.</p>
        <button type="submit">${account ? "Refresh connection" : "Connect Stripe"}</button>
      </form>
    </div>

    <div class="two-up" style="margin-top:1rem;">
      <form id="enable-pos-form" class="form-card">
        <h3>Point of sale</h3>
        <p class="muted">${pointOfSaleEnabled ? "Point of sale is enabled for this gym." : "Enable point of sale before collecting payments."}</p>
        <button type="submit" ${pointOfSaleEnabled ? "disabled" : ""}>Enable point of sale</button>
      </form>

      <form id="collect-payment-form" class="form-card">
        <h3>Collect payment</h3>
        ${
          state.members.length === 0
            ? `<p class="muted">Create a member before collecting a member payment.</p>`
            : renderSelect("memberId", "Member", [{ value: "", label: "Walk-in / no member" }, ...state.members.map((member) => ({ value: member.id, label: `${member.firstName} ${member.lastName}` }))], "")
        }
        ${renderInput("amount", "Amount", "number", "49")}
        ${renderSelect("paymentMethod", "Payment method", [{ value: "manual_entry", label: "Manual entry" }, { value: "card_reader", label: "Card reader" }], "manual_entry")}
        ${renderInput("stripePaymentMethodId", "Stripe payment method ID", "text", "")}
        ${renderInput("receiptEmail", "Receipt email", "email")}
        ${renderInput("note", "Note")}
        <button type="submit" ${!pointOfSaleEnabled || !account?.chargesEnabled ? "disabled" : ""}>Collect payment</button>
      </form>
    </div>

    <section class="data-card" style="margin-top:1rem;">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Payment history</h3>
        <span>${state.stripePayments.length} payments</span>
      </div>
      ${
        state.stripePayments.length === 0
          ? `<p class="muted">No payments recorded yet.</p>`
          : `<div class="table-wrap">
              <table>
                <thead><tr><th>Member</th><th>Amount</th><th>Status</th><th>Method</th><th>Refunded</th><th>Time</th><th></th></tr></thead>
                <tbody>
                  ${state.stripePayments.map((payment) => `
                    <tr>
                      <td>${payment.memberId ? escapeHtml(memberName(payment.memberId)) : "Walk-in"}</td>
                      <td>${formatCents(payment.amountCents)}</td>
                      <td>${escapeHtml(payment.status)}</td>
                      <td>${escapeHtml(payment.paymentMethod.replaceAll("_", " "))}</td>
                      <td>${formatCents(payment.refundedAmountCents)}</td>
                      <td>${new Date(payment.createdAt).toLocaleString()}</td>
                      <td><button type="button" data-action="refund-payment" data-payment-id="${payment.id}" ${payment.status === "failed" || payment.status === "refunded" ? "disabled" : ""}>Refund</button></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>`
      }
    </section>
  `;
}

function renderNotificationsView() {
  const pending = state.notifications.filter((notification) => notification.status === "pending").length;
  const failed = state.notifications.filter((notification) => notification.status === "failed").length;
  return `
    <div class="stat-grid">
      <article class="mini-card">
        <span>Pending</span>
        <strong>${pending}</strong>
        <small>Awaiting delivery</small>
      </article>
      <article class="mini-card">
        <span>Failed</span>
        <strong>${failed}</strong>
        <small>Needs retry</small>
      </article>
      <article class="mini-card">
        <span>Total</span>
        <strong>${state.notifications.length}</strong>
        <small>Notification events</small>
      </article>
    </div>

    <section class="data-card" style="margin-top:1rem;">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Notification outbox</h3>
        <span>${state.notifications.length} events</span>
      </div>
      ${
        state.notifications.length === 0
          ? `<p class="muted">No notification events yet. Waitlist promotions will appear here.</p>`
          : `<div class="table-wrap">
              <table>
                <thead><tr><th>Type</th><th>Member</th><th>Status</th><th>Payload</th><th>Created</th><th></th></tr></thead>
                <tbody>
                  ${state.notifications.map((notification) => `
                    <tr>
                      <td>${escapeHtml(notification.type.replaceAll("_", " "))}</td>
                      <td>${escapeHtml(memberName(notification.recipientMemberId))}</td>
                      <td>${escapeHtml(notification.status)}${notification.failureReason ? ` - ${escapeHtml(notification.failureReason)}` : ""}</td>
                      <td>${escapeHtml(notificationSummary(notification))}</td>
                      <td>${new Date(notification.createdAt).toLocaleString()}</td>
                      <td>
                        ${
                          notification.status === "failed"
                            ? `<button type="button" data-action="retry-notification" data-notification-id="${notification.id}">Retry</button>`
                            : `<button type="button" data-action="process-notification" data-notification-id="${notification.id}" ${notification.status === "sent" ? "disabled" : ""}>Mark sent</button>`
                        }
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>`
      }
    </section>
  `;
}

function renderContractsView() {
  const activeDocuments = state.contractWaiverDocuments.filter((document) => !document.archivedAt);
  const editableDocument = activeDocuments[0];
  return `
    <div class="stat-grid">
      <article class="mini-card">
        <span>Active</span>
        <strong>${activeDocuments.length}</strong>
        <small>Contracts and waivers</small>
      </article>
      <article class="mini-card">
        <span>Published</span>
        <strong>${activeDocuments.filter((document) => document.publishedAt).length}</strong>
        <small>Visible to members</small>
      </article>
      <article class="mini-card">
        <span>Required</span>
        <strong>${activeDocuments.filter((document) => document.requiresSignature).length}</strong>
        <small>Need signatures</small>
      </article>
    </div>

    <div class="two-up" style="margin-top:1rem;">
      <form id="create-contract-waiver-form" class="form-card">
        <h3>Create document</h3>
        ${renderInput("title", "Title", "text", "Liability Waiver")}
        ${renderSelect("type", "Type", [{ value: "contract", label: "Contract" }, { value: "waiver", label: "Waiver" }], "waiver")}
        ${renderInput("version", "Version", "number", "1")}
        ${renderSelect("requiresSignature", "Signature", [{ value: "true", label: "Required" }, { value: "false", label: "Optional" }], "true")}
        ${renderSelect("publish", "Status", [{ value: "true", label: "Publish now" }, { value: "false", label: "Save draft" }], "true")}
        <button type="submit">Create document</button>
      </form>

      <form id="update-contract-waiver-form" class="form-card">
        <h3>Update document</h3>
        ${
          activeDocuments.length === 0
            ? `<p class="muted">Create a document before editing one.</p>`
            : renderSelect("documentId", "Document", activeDocuments.map((document) => ({ value: document.id, label: `${document.title} v${document.version}` })), editableDocument?.id ?? "")
        }
        ${renderInput("title", "New title")}
        ${renderSelect("type", "Type", [{ value: "", label: "No change" }, { value: "contract", label: "Contract" }, { value: "waiver", label: "Waiver" }], "")}
        ${renderInput("version", "New version", "number")}
        ${renderSelect("requiresSignature", "Signature", [{ value: "", label: "No change" }, { value: "true", label: "Required" }, { value: "false", label: "Optional" }], "")}
        ${renderSelect("publish", "Status", [{ value: "", label: "No change" }, { value: "true", label: "Published" }, { value: "false", label: "Draft" }], "")}
        <button type="submit" ${activeDocuments.length === 0 ? "disabled" : ""}>Update document</button>
      </form>
    </div>

    <section class="data-card" style="margin-top:1rem;">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Contracts and waivers</h3>
        <span>${activeDocuments.length} active</span>
      </div>
      ${
        activeDocuments.length === 0
          ? `<p class="muted">No contracts or waivers yet.</p>`
          : `<div class="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Signatures</th><th>Updated</th><th></th></tr></thead>
                <tbody>
                  ${activeDocuments.map((document) => `
                    <tr>
                      <td>${escapeHtml(document.title)} v${document.version}</td>
                      <td>${escapeHtml(document.type)}</td>
                      <td>${document.publishedAt ? "Published" : "Draft"} - ${document.requiresSignature ? "required" : "optional"}</td>
                      <td>${document.signedMemberCount}</td>
                      <td>${new Date(document.updatedAt).toLocaleString()}</td>
                      <td><button type="button" data-action="archive-contract-waiver" data-document-id="${document.id}">Archive</button></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>`
      }
    </section>
  `;
}

function renderMemberSearchView() {
  const query = state.memberSearchQuery.toLowerCase();
  const filtered = state.members.filter(m => {
    if (!query) return true;
    return (m.firstName + ' ' + m.lastName).toLowerCase().includes(query) ||
      (m.email || '').toLowerCase().includes(query) ||
      (m.phone || '').includes(query) ||
      (m.barcode || '').includes(query);
  });
  return `
    <section class="data-card">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Member Search</h3>
        <span>${filtered.length} results</span>
      </div>
      <form id="member-search-form" style="display:flex;gap:8px;margin-bottom:1rem;">
        <input name="query" type="text" placeholder="Search by name, email, phone, or barcode..." value="${escapeAttribute(state.memberSearchQuery)}"
          style="flex:1;border-radius:8px;border:1px solid var(--line);padding:12px 14px;background:#18181b;color:var(--ink);" />
        <button type="submit">Search</button>
      </form>
      ${filtered.length === 0
        ? `<p class="muted">No members match your search.</p>`
        : `<div style="display:grid;gap:8px;">
          ${filtered.map(m => `
            <div class="mini-card" style="cursor:pointer;" data-member-id="${m.id}" data-action="view-member">
              <strong>${m.firstName} ${m.lastName}</strong>
              <small>${m.email || m.phone || 'No contact'} · ${m.status}</small>
              ${m.barcode ? `<small style="display:block;">Barcode: ${m.barcode}</small>` : ''}
            </div>
          `).join('')}
        </div>`
      }
    </section>
  `;
}

function renderCheckInView() {
  if (state.locations.length === 0) {
    return `
      <section class="data-card">
        <div class="empty-state">
          <h3>No location available</h3>
          <p>Create a location before recording barcode check-ins.</p>
          <button type="button" data-dashboard-view="locations">Create location</button>
        </div>
      </section>
    `;
  }
  return `
    <section class="data-card">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Check-In Kiosk</h3>
        <span>Scan barcode to check in a member</span>
      </div>
      <form id="check-in-form" style="display:flex;gap:8px;margin-bottom:1rem;">
        <select name="locationId" style="border-radius:8px;border:1px solid var(--line);padding:12px 14px;background:#18181b;color:var(--ink);">
          ${state.locations.map((location) => `<option value="${location.id}" ${location.id === state.selectedCheckInLocationId ? "selected" : ""}>${escapeHtml(location.name)}</option>`).join("")}
        </select>
        <input name="barcode" type="text" placeholder="Enter member barcode..." value="${escapeAttribute(state.checkInBarcode)}"
          style="flex:1;border-radius:8px;border:1px solid var(--line);padding:12px 14px;background:#18181b;color:var(--ink);" autofocus />
        <button type="submit">Check In</button>
      </form>
      ${state.checkInResult ? `
        <div class="banner ${state.checkInResult.status === 'allowed' ? 'success' : 'error'}">
          <strong>${state.checkInResult.memberName}</strong> — ${state.checkInResult.status === 'allowed' ? '✓ Allowed' : '✗ Denied'}
          ${state.checkInResult.deniedReason ? `<p style="margin:0.5rem 0 0;">${state.checkInResult.deniedReason}</p>` : ''}
        </div>
      ` : ''}
    </section>
  `;
}

function renderCheckInHistoryView() {
  return `
    <section class="data-card">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Check-In History</h3>
        <span>${state.checkInHistory.length} records</span>
      </div>
      ${state.checkInHistory.length === 0
        ? `<p class="muted">No check-in records yet.</p>`
        : `<div class="table-wrap"><table>
          <thead><tr><th>Time</th><th>Member</th><th>Status</th><th>Method</th><th>Location</th></tr></thead>
          <tbody>${state.checkInHistory.map(c => `
            <tr>
              <td>${new Date(c.checkedInAt).toLocaleString()}</td>
              <td>${c.memberName}</td>
              <td>${c.status}</td>
              <td>${c.method}</td>
              <td>${c.locationName || '-'}</td>
            </tr>
          `).join('')}</tbody>
        </table></div>`
      }
    </section>
  `;
}



function renderPlatformDashboard() {
  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Platform Dashboard</p>
        <h2>Workspace Admin</h2>
      </div>
      <button id="logout-button" class="ghost-button" type="button">Log out</button>
    </div>

    ${state.createdGym ? `
      <section class="banner success">
        <strong>${escapeHtml(state.createdGym.name)} is ready.</strong>
        <p style="margin:0.5rem 0 0;">Use the new owner email and password you just entered, or open the dashboard now.</p>
        <a href="?gymSlug=${state.createdGym.slug}#/dashboard" class="ghost-button" style="display:inline-block;margin-top:12px;text-decoration:none;">Open dashboard</a>
      </section>
    ` : ""}

    <div class="list-grid">
      <section class="data-card">
        <div class="card-head">
          <h3>All Gyms</h3>
          <span>${state.platformGyms.length} total</span>
        </div>
        <div class="gym-cards" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; padding: 1rem;">
          ${state.platformGyms.map(gym => `
            <a href="?gymSlug=${gym.slug}#/dashboard" class="form-card" style="text-decoration:none; color:inherit;">
              <h4>${gym.name}</h4>
              <small>${gym.slug}</small>
            </a>
          `).join('')}
        </div>
      </section>
      
      <section class="data-card">
        <div class="card-head">
          <h3>Create New Gym & Owner</h3>
        </div>
        <form id="platform-create-gym-form" class="form-card" style="margin: 1rem;">
          ${renderInput("firstName", "Owner First Name")}
          ${renderInput("lastName", "Owner Last Name")}
          ${renderInput("email", "Owner Email", "email")}
          ${renderInput("password", "Owner Password", "password")}
          ${renderInput("gymName", "Gym Name")}
          <button type="submit">Add Gym</button>
        </form>
      </section>
    </div>
  `;
}

function renderPublic(
  publicPlanPage: ReturnType<typeof buildPublicPlansPage> | undefined,
  publicSignupPage: ReturnType<typeof buildPublicSignupPage> | undefined,
  publicSchedulePage: ReturnType<typeof buildPublicSchedulePage> | undefined
) {
  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Public website</p>
        <h2>${state.publicGym?.name ?? "Website"}</h2>
      </div>
    </div>

    <form id="public-slug-form" class="inline-form">
      ${renderInput("slug", "Gym slug", "text", state.publicSlug || state.gym?.slug || "")}
      <button type="submit">${state.publicLoading ? "Loading..." : "Load public site"}</button>
    </form>

    ${
      !state.publicGym
        ? `<div class="empty-state"><h3>No public gym loaded</h3><p>Enter a gym slug to open the public website.</p></div>`
        : `
          <section class="hero-card">
            <p class="eyebrow">Public profile</p>
            <h2>${state.publicGym.name}</h2>
            <p>Slug: <code>${state.publicGym.slug}</code></p>
            <p>${state.publicGym.businessInfo?.phone ?? state.publicGym.businessInfo?.email ?? "Memberships available online"}</p>
          </section>

          ${state.publicSuccess ? `<div class="banner success">${state.publicSuccess}</div>` : ""}

          <div class="two-up stacked-mobile">
            <section class="data-card">
              <div class="card-head">
                <h3>Public plans</h3>
                <span>${publicPlanPage?.summaryLabel ?? "Unavailable"}</span>
              </div>
              ${renderPublicPlans(publicPlanPage)}
            </section>

            <form id="public-signup-form" class="form-card">
              <h3>Join online</h3>
              <p class="muted">${publicSignupPage?.summaryLabel ?? "Select a plan to continue."}</p>
              ${renderInput("firstName", "First name")}
              ${renderInput("lastName", "Last name")}
              ${renderInput("email", "Email", "email")}
              ${renderInput("phone", "Phone", "tel")}
              <button type="submit" ${!state.selectedPlanId ? "disabled" : ""}>
                ${!state.selectedPlanId ? "Choose a plan first" : "Submit signup"}
              </button>
            </form>
          </div>

          <section class="data-card">
            <div class="card-head">
              <h3>Public schedule</h3>
              <span>${publicSchedulePage?.summaryLabel ?? "No schedule loaded"}</span>
            </div>
            ${renderPublicSchedule(publicSchedulePage)}
          </section>
        `
    }
  `;
}

function bindEvents() {
  // Dashboard tab navigation
  app.querySelectorAll<HTMLButtonElement>("[data-dashboard-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.dashboardView as AppState["dashboardView"];
      if (view) {
        state.dashboardView = view;
        state.selectedMemberId = undefined;
        state.checkInResult = undefined;
        render();
      }
    });
  });

  // Member search results click
  app.querySelectorAll<HTMLDivElement>("[data-action='view-member']").forEach((el) => {
    el.addEventListener("click", () => {
      state.selectedMemberId = el.dataset.memberId;
      state.dashboardView = "member_profile";
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-action='rotate-access-key']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym || !button.dataset.deviceId) {
        return;
      }
      try {
        const response = (await client.rotateAccessDeviceKey(
          state.gym.id,
          button.dataset.deviceId
        )) as AccessDeviceCreateResponse;
        state.latestAccessApiKey = response.apiKey;
        setBanner("success", `Rotated key for ${response.device.name}.`);
        await refreshDashboard();
      } catch (error) {
        setBanner("error", describeError(error));
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-action='archive-plan']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym || !button.dataset.planId) {
        return;
      }
      try {
        await client.archiveMembershipPlan(state.gym.id, button.dataset.planId);
        setBanner("success", "Membership plan archived.");
        await refreshDashboard();
      } catch (error) {
        setBanner("error", describeError(error));
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-action='create-member-portal-invite']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym || !button.dataset.memberId) {
        return;
      }
      try {
        const response = (await client.createMemberPortalInvite(
          state.gym.id,
          button.dataset.memberId
        )) as MemberPortalInviteResponse;
        state.latestMemberPortalInvite = {
          memberId: response.member.id,
          setupUrl: response.setupUrl,
          token: response.token,
          purpose: response.purpose,
          expiresAt: response.expiresAt
        };
        setBanner(
          "success",
          response.purpose === "setup" ? "Member portal setup link created." : "Member portal reset link created."
        );
        await refreshDashboard();
      } catch (error) {
        setBanner("error", describeError(error));
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-action='copy-member-portal-link']").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copyValue;
      if (!value) {
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
        setBanner("success", "Member portal link copied.");
      } catch {
        setBanner("info", "Select and copy the member portal link manually.");
      }
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-action='refund-payment']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym || !button.dataset.paymentId) {
        return;
      }
      try {
        await client.refundPayment(state.gym.id, button.dataset.paymentId, {});
        setBanner("success", "Payment refunded.");
        await refreshDashboard();
      } catch (error) {
        setBanner("error", describeError(error));
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-action='process-notification']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym || !button.dataset.notificationId) {
        return;
      }
      try {
        await client.processNotification(state.gym.id, button.dataset.notificationId, {});
        setBanner("success", "Notification marked sent.");
        await refreshDashboard();
      } catch (error) {
        setBanner("error", describeError(error));
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-action='retry-notification']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym || !button.dataset.notificationId) {
        return;
      }
      try {
        await client.retryNotification(state.gym.id, button.dataset.notificationId);
        setBanner("success", "Notification queued for retry.");
        await refreshDashboard();
      } catch (error) {
        setBanner("error", describeError(error));
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-action='archive-contract-waiver']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym || !button.dataset.documentId) {
        return;
      }
      try {
        await client.archiveContractWaiverDocument(state.gym.id, button.dataset.documentId);
        setBanner("success", "Document archived.");
        await refreshDashboard();
      } catch (error) {
        setBanner("error", describeError(error));
        render();
      }
    });
  });

  // Check-in form
  bindForm("check-in-form", async (form) => {
    if (!state.gym) return;
    const data = formData(form);
    const barcode = data.barcode.trim();
    if (!barcode) return;
    state.selectedCheckInLocationId = data.locationId || state.selectedCheckInLocationId;
    try {
      const result = await client.createCheckIn(state.gym.id, {
        barcode,
        locationId: state.selectedCheckInLocationId,
        method: CheckInMethod.Barcode
      }) as CheckInRecord;
      state.checkInResult = result;
      state.checkInHistory = [result, ...state.checkInHistory];
      state.checkInBarcode = "";
      render();
    } catch (error) {
      setBanner("error", describeError(error));
      render();
    }
  });

  // Member search form
  bindForm("member-search-form", async (form) => {
    const data = formData(form);
    state.memberSearchQuery = data.query || "";
    render();
  });

  bindForm("platform-create-gym-form", async (form) => {
    const data = formData(form);
    try {
      const response = (await client.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        gymName: data.gymName,
        timezone: "America/New_York",
        locale: "en-US"
      })) as AuthResponse;
      if (response.accessToken && response.refreshToken) {
        tokenStore.setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        });
      }
      if (response.gym) {
        state.createdGym = response.gym;
        state.publicSlug = response.gym.slug;
        localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, response.gym.slug);
      }
      setBanner("success", response.gym ? `Gym created: ${response.gym.name}.` : "Gym and owner created successfully.");
      const gymsData = await client.listGyms() as { gyms: GymRecord[] };
      state.platformGyms = gymsData.gyms || [];
      await refreshDashboard();
    } catch (error) {
      setBanner("error", describeError(error));
      render();
    }
  });

  bindForm("register-form", async (form) => {
    const data = formData(form);
    const response = (await client.register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      gymName: data.gymName,
      timezone: "America/New_York",
      locale: "en-US"
    })) as AuthResponse;
    if (!response.accessToken || !response.refreshToken) {
      throw new Error("Registration did not return a session.");
    }
    tokenStore.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    });
    if (response.gym?.slug) {
      state.publicSlug = response.gym.slug;
      localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, state.publicSlug);
    }
    setBanner("success", "Account created. Dashboard data is loading.");
    await refreshDashboard();
  });

  bindForm("login-form", async (form) => {
    const data = formData(form);
    const response = (await client.login({
      email: data.email,
      password: data.password
    })) as AuthResponse;
    if (response.twoFactorRequired) {
      state.twoFactorLogin = { email: data.email, password: data.password };
      setBanner("info", "Enter your two-factor code to finish logging in.");
      render();
      return;
    }
    if (!response.accessToken || !response.refreshToken) {
      throw new Error("Login did not return a session.");
    }
    tokenStore.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    });
    setBanner("success", "Logged in successfully.");
    await refreshDashboard();
  });

  bindForm("two-factor-login-form", async (form) => {
    if (!state.twoFactorLogin) {
      throw new Error("Start login again before entering a two-factor code.");
    }
    const data = formData(form);
    const response = (await client.login({
      email: state.twoFactorLogin.email,
      password: state.twoFactorLogin.password,
      twoFactorCode: data.twoFactorCode || undefined,
      recoveryCode: data.recoveryCode || undefined
    })) as AuthResponse;
    if (response.twoFactorRequired || !response.accessToken || !response.refreshToken) {
      throw new Error("Two-factor verification failed.");
    }
    tokenStore.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    });
    state.twoFactorLogin = undefined;
    setBanner("success", "Logged in successfully.");
    await refreshDashboard();
  });

  bindForm("accept-staff-invite-form", async (form) => {
    const data = formData(form);
    const response = (await client.acceptStaffInvite({
      token: data.token,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password
    })) as AuthResponse;
    if (!response.accessToken || !response.refreshToken) {
      throw new Error("Staff invite acceptance did not return a session.");
    }
    tokenStore.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    });
    if (response.gym?.slug) {
      state.publicSlug = response.gym.slug;
      localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, state.publicSlug);
      window.history.replaceState({}, "", `?gymSlug=${response.gym.slug}#/dashboard`);
    }
    setBanner("success", "Staff invite accepted.");
    await refreshDashboard();
  });

  bindForm("create-gym-form", async (form) => {
    const data = formData(form);
    await client.createGym({
      name: data.name,
      timezone: "America/New_York",
      locale: "en-US",
      featureFlags: []
    });
    setBanner("success", "Gym created.");
    await refreshDashboard();
  });

  bindForm("setup-2fa-form", async () => {
    const response = (await client.setupTwoFactor()) as TwoFactorSetupResponse;
    state.twoFactorSetup = response;
    state.twoFactorRecoveryCodes = [];
    setBanner("info", "Add the secret to your authenticator app, then verify the code.");
    render();
  });

  bindForm("verify-2fa-setup-form", async (form) => {
    const data = formData(form);
    const response = (await client.verifyTwoFactor(data.code)) as TwoFactorVerifyResponse;
    state.twoFactorSetup = undefined;
    state.twoFactorRecoveryCodes = response.recoveryCodes;
    setBanner("success", "Two-factor auth enabled. Save your recovery codes.");
    await refreshDashboard();
  });

  bindForm("regenerate-recovery-codes-form", async () => {
    const response = (await client.regenerateTwoFactorRecoveryCodes()) as TwoFactorRecoveryCodesResponse;
    state.twoFactorRecoveryCodes = response.recoveryCodes;
    setBanner("success", "New recovery codes generated.");
    render();
  });

  bindForm("create-plan-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    await client.createMembershipPlan(state.gym.id, {
      name: data.name,
      description: data.description,
      billingInterval: data.billingInterval as BillingInterval,
      priceCents: dollarsToCents(data.price),
      signupFeeCents: dollarsToCents(data.signupFee || "0"),
      trialDays: safeInteger(data.trialDays, 0),
      autoRenew: data.autoRenew ? data.autoRenew === "true" : true,
      contractLengthMonths: optionalInteger(data.contractLengthMonths),
      classAccessLimit: optionalInteger(data.classAccessLimit),
      isPublic: data.isPublic ? data.isPublic === "true" : true
    });
    setBanner("success", "Public plan created.");
    await refreshDashboard();
  });

  bindForm("update-plan-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const input: {
      name?: string;
      description?: string;
      billingInterval?: BillingInterval;
      priceCents?: number;
      signupFeeCents?: number;
      trialDays?: number;
      autoRenew?: boolean;
      contractLengthMonths?: number;
      classAccessLimit?: number;
      isPublic?: boolean;
    } = {};
    if (data.name) input.name = data.name;
    if (data.description) input.description = data.description;
    if (data.billingInterval) input.billingInterval = data.billingInterval as BillingInterval;
    if (data.price) input.priceCents = dollarsToCents(data.price);
    if (data.signupFee) input.signupFeeCents = dollarsToCents(data.signupFee);
    if (data.trialDays) input.trialDays = safeInteger(data.trialDays, 0);
    if (data.contractLengthMonths) input.contractLengthMonths = safeInteger(data.contractLengthMonths, 0);
    if (data.classAccessLimit) input.classAccessLimit = safeInteger(data.classAccessLimit, 0);
    if (data.autoRenew) input.autoRenew = data.autoRenew === "true";
    if (data.isPublic) input.isPublic = data.isPublic === "true";
    if (Object.keys(input).length === 0) {
      throw new Error("Enter at least one plan field to update.");
    }
    await client.updateMembershipPlan(state.gym.id, data.planId, input);
    setBanner("success", "Membership plan updated.");
    await refreshDashboard();
  });

  bindForm("create-location-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    await client.createLocation(state.gym.id, {
      name: data.name,
      timezone: data.timezone || state.gym.timezone || "America/New_York",
      phone: data.phone || undefined,
      address: {
        line1: data.line1,
        line2: data.line2 || undefined,
        city: data.city,
        region: data.region,
        postalCode: data.postalCode,
        country: data.country || "US"
      },
      operatingHours: {}
    });
    setBanner("success", "Location created.");
    await refreshDashboard();
  });

  bindForm("create-class-type-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    await client.createClassType(state.gym.id, {
      name: data.name,
      description: data.description || undefined,
      defaultDurationMinutes: safeInteger(data.defaultDurationMinutes, 60),
      defaultCapacity: safeInteger(data.defaultCapacity, 12),
      defaultWaitlistCapacity: safeInteger(data.defaultWaitlistCapacity, 4),
      isPublic: true
    });
    setBanner("success", "Class type created.");
    await refreshDashboard();
  });

  bindForm("create-class-session-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    await client.createClassSession(state.gym.id, {
      classTypeId: data.classTypeId,
      locationId: data.locationId,
      roomName: data.roomName || undefined,
      startsAt: new Date(data.startsAt).toISOString(),
      endsAt: new Date(data.endsAt).toISOString(),
      capacity: safeInteger(data.capacity, 12),
      waitlistCapacity: safeInteger(data.waitlistCapacity, 4),
      cancellationCutoffMinutes: 0,
      lateCancellationFeeCents: 0
    });
    setBanner("success", "Class scheduled.");
    await refreshDashboard();
  });

  bindForm("book-class-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    state.selectedClassSessionId = data.sessionId;
    await client.createClassBooking(state.gym.id, data.sessionId, {
      memberId: data.memberId
    });
    setBanner("success", "Member booked into class.");
    await refreshDashboard();
  });

  bindForm("create-staff-invite-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const response = (await client.createStaffInvite(state.gym.id, {
      email: data.email,
      roleId: data.roleId,
      message: data.message || undefined
    })) as StaffInviteCreateResponse;
    state.latestInviteToken = response.inviteToken;
    setBanner("success", `Invite created for ${response.invite.email}.`);
    await refreshDashboard();
  });

  bindForm("create-custom-role-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const permissions = new FormData(form).getAll("permissions").map(String) as Permission[];
    await client.createCustomRole(state.gym.id, {
      name: data.name,
      permissions
    });
    setBanner("success", "Custom role created.");
    await refreshDashboard();
  });

  bindForm("assign-staff-role-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    await client.assignStaffRole(state.gym.id, {
      userId: data.userId,
      roleId: data.roleId
    });
    setBanner("success", "Staff role updated.");
    await refreshDashboard();
  });

  bindForm("remove-staff-access-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    await client.removeStaffAccess(state.gym.id, data.userId, {
      reason: data.reason || undefined
    });
    setBanner("success", "Staff access removed.");
    await refreshDashboard();
  });

  bindForm("create-access-device-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const response = (await client.createAccessDevice(state.gym.id, {
      name: data.name,
      locationId: data.locationId,
      deviceType: data.deviceType as AccessDeviceType
    })) as AccessDeviceCreateResponse;
    state.latestAccessApiKey = response.apiKey;
    setBanner("success", `Access device registered: ${response.device.name}.`);
    await refreshDashboard();
  });

  bindForm("create-access-rule-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    await client.createAccessRule(state.gym.id, {
      name: data.name,
      locationId: data.locationId,
      planId: data.planId || undefined,
      allowAllActiveMembers: !data.planId,
      startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined
    });
    setBanner("success", "Access rule created.");
    await refreshDashboard();
  });

  bindForm("simulate-access-event-form", async (form) => {
    const data = formData(form);
    state.latestAccessApiKey = data.apiKey;
    const response = (await client.createAccessDeviceEvent({
      apiKey: data.apiKey,
      barcode: data.barcode
    })) as AccessDeviceEventResponse;
    state.latestAccessDecision = response;
    setBanner(response.unlock ? "success" : "info", response.unlock ? "Access granted." : `Access denied: ${response.reason}.`);
    await refreshDashboard();
  });

  bindForm("access-heartbeat-form", async (form) => {
    const data = formData(form);
    state.latestAccessApiKey = data.apiKey;
    await client.createAccessDeviceHeartbeat({
      apiKey: data.apiKey
    });
    setBanner("success", "Device heartbeat recorded.");
    await refreshDashboard();
  });

  bindForm("connect-stripe-form", async () => {
    if (!state.gym) {
      return;
    }
    const response = (await client.connectStripePaymentAccount(state.gym.id)) as StripePaymentAccountResponse;
    state.stripeAccount = response.account;
    state.latestStripeOnboardingUrl = response.onboardingUrl;
    setBanner("success", "Stripe connection initialized.");
    await refreshDashboard();
  });

  bindForm("enable-pos-form", async () => {
    if (!state.gym) {
      return;
    }
    await client.updateGym(state.gym.id, {
      featureFlags: Array.from(new Set([...state.gym.featureFlags, FeatureFlag.PointOfSale]))
    });
    setBanner("success", "Point of sale enabled.");
    await refreshDashboard();
  });

  bindForm("collect-payment-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    await client.collectPayment(state.gym.id, {
      memberId: data.memberId || undefined,
      amountCents: dollarsToCents(data.amount),
      currency: "usd",
      paymentMethod: data.paymentMethod as "card_reader" | "manual_entry",
      stripePaymentMethodId: data.stripePaymentMethodId || undefined,
      receiptEmail: data.receiptEmail || undefined,
      note: data.note || undefined
    });
    setBanner("success", "Payment recorded.");
    await refreshDashboard();
  });

  bindForm("create-contract-waiver-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    await client.createContractWaiverDocument(state.gym.id, {
      title: data.title,
      type: data.type as "contract" | "waiver",
      version: safeInteger(data.version, 1),
      requiresSignature: data.requiresSignature === "true",
      publish: data.publish === "true"
    });
    setBanner("success", "Document created.");
    await refreshDashboard();
  });

  bindForm("update-contract-waiver-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const input: {
      title?: string;
      type?: "contract" | "waiver";
      version?: number;
      requiresSignature?: boolean;
      publish?: boolean;
    } = {};
    if (data.title) input.title = data.title;
    if (data.type) input.type = data.type as "contract" | "waiver";
    if (data.version) input.version = safeInteger(data.version, 1);
    if (data.requiresSignature) input.requiresSignature = data.requiresSignature === "true";
    if (data.publish) input.publish = data.publish === "true";
    if (Object.keys(input).length === 0) {
      throw new Error("Enter at least one document field to update.");
    }
    await client.updateContractWaiverDocument(state.gym.id, data.documentId, input);
    setBanner("success", "Document updated.");
    await refreshDashboard();
  });

  bindForm("create-member-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    await client.createMember(state.gym.id, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      barcode: data.barcode || undefined,
      profileImageUrl: data.profileImageUrl || undefined,
      status: MemberStatus.Active,
      tagNames: []
    });
    setBanner("success", "Member created.");
    await refreshDashboard();
  });

  bindForm("assign-membership-form", async (form) => {
    if (!state.gym || !state.selectedMemberId) {
      return;
    }
    const data = formData(form);
    await client.assignMemberMembership(state.gym.id, state.selectedMemberId, {
      planId: data.planId,
      status: MembershipStatus.Active
    });
    setBanner("success", "Membership assigned.");
    await refreshDashboard();
  });

  bindForm("member-portal-setup-form", async (form) => {
    const data = formData(form);
    await client.setupMemberPortalPassword({
      token: data.token,
      password: data.password
    });
    setBanner("success", "Password set. You can now log in from the mobile app.");
    render();
  });

  bindForm("public-slug-form", async (form) => {
    const data = formData(form);
    state.publicSuccess = undefined;
    await refreshPublic(data.slug);
  });

  bindForm("public-signup-form", async (form) => {
    if (!state.publicSlug || !state.selectedPlanId) {
      throw new Error("Choose a public plan first.");
    }
    const data = formData(form);
    const response = (await client.publicSignup(state.publicSlug, {
      planId: state.selectedPlanId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      ...(data.phone ? { phone: data.phone } : {})
    })) as PublicSignupResponse;
    state.publicSuccess = `Signup completed for ${response.member.firstName} ${response.member.lastName}.`;
    setBanner("success", "Public signup completed and saved to the backend.");
    if (state.gym?.slug === state.publicSlug && state.session) {
      await refreshDashboard();
    } else {
      render();
    }
  });

  app.querySelectorAll<HTMLButtonElement>("[data-plan-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPlanId = button.dataset.planId ?? "";
      state.publicSuccess = undefined;
      render();
    });
  });

  const logoutButton = app.querySelector<HTMLButtonElement>("#logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      const refreshToken = state.session?.refreshToken;
      clearDashboardState();
      if (refreshToken) {
        try {
          await client.logout(refreshToken);
        } catch {
          // Best effort logout.
        }
      }
      setBanner("info", "Logged out.");
      render();
    });
  }
}

function bindForm(id: string, handler: (form: HTMLFormElement) => Promise<void>) {
  const form = app.querySelector<HTMLFormElement>(`#${id}`);
  if (!form) {
    return;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector<HTMLButtonElement>("button[type='submit']");
    const originalLabel = submitButton?.textContent;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Working...";
    }
    try {
      await handler(form);
    } catch (error) {
      setBanner("error", describeError(error));
      render();
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });
}

function formData(form: HTMLFormElement) {
  const values = new FormData(form);
  return Object.fromEntries(values.entries()) as Record<string, string>;
}

function renderInput(name: string, label: string, type = "text", value = "") {
  return `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" type="${type}" value="${escapeAttribute(value)}" />
    </label>
  `;
}

function renderSelect(
  name: string,
  label: string,
  options: Array<{ value: string; label: string }>,
  selectedValue: string
) {
  return `
    <label class="field">
      <span>${label}</span>
      <select name="${name}">
        ${options
          .map(
            (option) =>
              `<option value="${option.value}" ${option.value === selectedValue ? "selected" : ""}>${option.label}</option>`
          )
          .join("")}
      </select>
    </label>
  `;
}

function renderMembersTable(memberPage: ReturnType<typeof buildMemberListPage>) {
  if (memberPage.rows.length === 0) {
    return `<p class="muted">${memberPage.empty?.body ?? "No members yet."}</p>`;
  }
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${memberPage.table.columns.map((column) => `<th>${column.label}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${memberPage.rows
            .map(
              (row) => `
                <tr>
                  <td>${row.fullName}</td>
                  <td>${row.contactLabel}</td>
                  <td>${row.statusLabel}</td>
                  <td>${row.tagLabel}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPublicPlans(publicPlanPage: ReturnType<typeof buildPublicPlansPage> | undefined) {
  if (!publicPlanPage) {
    return `<p class="muted">No public plan data loaded.</p>`;
  }
  if (publicPlanPage.empty) {
    return `<p class="muted">${publicPlanPage.empty.body ?? publicPlanPage.empty.title}</p>`;
  }
  return `
    <div class="card-grid">
      ${publicPlanPage.planCards
        .map(
          (plan) => `
            <article class="plan-card${plan.planId === state.selectedPlanId ? " selected" : ""}">
              <p class="eyebrow">${plan.featured ? "Featured" : "Plan"}</p>
              <h3>${plan.title}</h3>
              <p>${plan.priceLabel}</p>
              <small>${plan.signupFeeLabel}</small>
              <span>${plan.accessLabel}</span>
              <button type="button" data-plan-id="${plan.planId}">
                ${plan.planId === state.selectedPlanId ? "Selected" : "Choose plan"}
              </button>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderPublicSchedule(
  publicSchedulePage: ReturnType<typeof buildPublicSchedulePage> | undefined
) {
  if (!publicSchedulePage) {
    return `<p class="muted">No schedule data loaded.</p>`;
  }
  if (publicSchedulePage.empty) {
    return `<p class="muted">${publicSchedulePage.empty.body ?? publicSchedulePage.empty.title}</p>`;
  }
  return `
    <div class="card-grid">
      ${publicSchedulePage.sessionCards
        .map(
          (session) => `
            <article class="mini-card">
              <span>${session.title}</span>
              <strong>${session.startsAtLabel}</strong>
              <small>${session.roomLabel}</small>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function currentMembership() {
  if (!state.me || !state.gym) {
    return undefined;
  }
  return (
    state.me.memberships.find((membership) => membership.gym?.id === state.gym?.id) ??
    state.me.memberships[0]
  );
}

function currentPermissions() {
  return currentMembership()?.role?.permissions ?? [];
}

function clearDashboardState() {
  tokenStore.clearTokens();
  state.me = null;
  state.gym = null;
  state.members = [];
  state.plans = [];
  state.locations = [];
  state.classTypes = [];
  state.classSessions = [];
  state.classBookings = {};
  state.memberMemberships = {};
  state.roles = [];
  state.staff = [];
  state.staffInvites = [];
  state.staffAudit = [];
  state.latestInviteToken = undefined;
  state.latestMemberPortalInvite = undefined;
  state.accessDevices = [];
  state.accessRules = [];
  state.accessEvents = [];
  state.latestAccessApiKey = undefined;
  state.latestAccessDecision = undefined;
  state.stripeAccount = undefined;
  state.stripePayments = [];
  state.latestStripeOnboardingUrl = undefined;
  state.notifications = [];
  state.contractWaiverDocuments = [];
  state.twoFactorLogin = undefined;
  state.twoFactorSetup = undefined;
  state.twoFactorRecoveryCodes = [];
  state.selectedCheckInLocationId = "";
  state.selectedClassSessionId = "";
  state.createdGym = undefined;
}

function setBanner(tone: BannerTone, text: string) {
  state.banner = { tone, text };
}

function renderBanner() {
  if (!state.banner) {
    return "";
  }
  return `<div class="banner ${state.banner.tone}">${escapeHtml(state.banner.text)}</div>`;
}

function readView(): ViewName {
  if (window.location.hash.includes("/member-portal/setup")) {
    return "memberPortalSetup";
  }
  return window.location.hash.includes("/public") ? "public" : "dashboard";
}

function memberPortalSetupToken() {
  const query = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(query).get("token") ?? "";
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionTokens) : null;
  } catch {
    return null;
  }
}

function loadPublicSlug() {
  return localStorage.getItem(PUBLIC_SLUG_STORAGE_KEY) ?? "";
}

function describeError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.issues && error.issues.length > 0) {
      const detail = error.issues.map(i => `${i.path}: ${i.message}`).join("; ");
      return `Validation failed - ${detail}`;
    }
    return `${error.message} (${error.status})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

function dollarsToCents(value: string) {
  return Math.round(Number(value || "0") * 100);
}

function safeInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalInteger(value: string) {
  if (!value) {
    return undefined;
  }
  return safeInteger(value, 0);
}

function planName(planId: string) {
  return state.plans.find((plan) => plan.id === planId)?.name ?? "Unknown plan";
}

function classTypeName(classTypeId: string) {
  return state.classTypes.find((classType) => classType.id === classTypeId)?.name ?? classTypeId;
}

function locationName(locationId: string) {
  return state.locations.find((location) => location.id === locationId)?.name ?? locationId;
}

function memberName(memberId: string) {
  const member = state.members.find((candidate) => candidate.id === memberId);
  return member ? `${member.firstName} ${member.lastName}` : memberId;
}

function notificationSummary(notification: NotificationRecord) {
  const classSessionId = notification.payload.classSessionId;
  const startsAt = notification.payload.startsAt;
  return [
    typeof classSessionId === "string" ? classTypeName(state.classSessions.find((session) => session.id === classSessionId)?.classTypeId ?? "") : "",
    typeof startsAt === "string" ? new Date(startsAt).toLocaleString() : ""
  ].filter(Boolean).join(" - ") || JSON.stringify(notification.payload);
}

function roleName(roleId: string) {
  return state.roles.find((role) => role.id === roleId)?.name ?? roleId;
}

function roleLabel(role: RoleRecord) {
  return role.name.replaceAll("_", " ");
}

function staffAssignableRoles() {
  return state.roles.filter((role) => role.name !== "owner" && role.name !== "member");
}

function defaultCustomRolePermissions() {
  return [
    Permission.GymRead,
    Permission.LocationRead,
    Permission.StaffRead,
    Permission.MemberRead,
    Permission.PlanRead,
    Permission.ClassRead,
    Permission.BookingRead,
    Permission.AccessRead,
    Permission.ReportRead
  ];
}

function permissionLabel(permission: string) {
  const [scope, action] = permission.split(":");
  return [scope, action].filter(Boolean).map((part) => titleCase(part?.replaceAll("_", " ") ?? "")).join(" - ");
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCents(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);
}

function toDateTimeLocal(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function escapeAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
