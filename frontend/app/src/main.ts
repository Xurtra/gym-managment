import { GymApiClient, ApiError, type ApiTokenStore } from "@gym-platform/api-client";
import {
  AccessDeviceType,
  BillingInterval,
  CheckInMethod,
  ClassSessionStatus,
  FeatureFlag,
  LocationStatus,
  MemberStatus,
  MembershipStatus,
  Permission,
  PlanStatus,
  RoleName,
  UserStatus
} from "@gym-platform/constants";
import {
  buildAccessDeviceListScreen,
  buildAccessDeviceRegistrationScreen,
  buildAccessEventHistoryScreen,
  buildAccessRuleEditorScreen,
  buildBookingListPage,
  buildClassSessionListPage,
  buildContractWaiverListPage,
  buildLeadListPage,
  buildLocationListPage,
  buildMemberListPage,
  buildMembershipPlanListPage,
  buildPersonalTrainingSessionListPage,
  buildStaffListPage,
  buildStripePaymentCollectionScreen,
  buildStripePaymentConnectionScreen,
  ContractWaiverType,
  PersonalTrainingSessionStatus,
  StripePaymentMethod,
  type AccessDeviceView,
  type AccessEventView,
  type AccessRuleView,
  type ClassBookingView,
  type ClassSessionView,
  type CheckInRecord,
  type ContractWaiverDocumentView,
  type StripePaymentAccountView
} from "@gym-platform/dashboard";
import { buildMemberPortalLayout } from "@gym-platform/member-portal";
import {
  buildPublicCheckoutPage,
  buildPublicPlansPage,
  buildPublicSchedulePage,
  buildPublicSignupPage,
  buildPublicSiteLayout,
  buildPublicWebsiteHomePage
} from "@gym-platform/website-renderer";
import "./style.css";

const API_BASE_URL = "http://127.0.0.1:4000";
const SESSION_STORAGE_KEY = "gym-platform-session";
const PUBLIC_SLUG_STORAGE_KEY = "gym-platform-public-slug";
const THEME_STORAGE_KEY = "gym-platform-theme";
const MEMBER_DESK_STORAGE_KEY = "gym-platform-member-desk";
const ROLE_PERMISSION_OPTIONS = Object.values(Permission).filter(
  (permission) => permission !== Permission.PlatformAdmin
);
const DEFAULT_SIGNATURE_REQUIREMENTS = [
  "Waiver",
  "Photo consent",
  "Billing agreement",
  "Emergency contact acknowledgment"
];

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  apiInstanceId?: string;
}

interface HealthResponse {
  status: string;
  service: string;
  persistenceDriver?: "memory" | "postgres";
  apiInstanceId?: string;
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

interface LocationRecord {
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
  status: LocationStatus;
  archivedAt?: string;
}

interface RoleRecord {
  id: string;
  name: string;
  permissions: string[];
  isSystem?: boolean;
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
  };
  activeGym?: GymRecord;
  memberships: MembershipRecord[];
}

interface LocationListResponse {
  locations: LocationRecord[];
}

interface CheckInPayload {
  memberId?: string;
  barcode?: string;
  qrPayload?: string;
  locationId: string;
  classSessionId?: string;
  method: CheckInMethod;
  overrideEligibility?: boolean;
  overrideReason?: string;
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
  status: MemberStatus;
  email?: string;
  phone?: string;
  barcode?: string;
  profileImageUrl?: string;
  emergencyContact?: { name: string; phone: string; relationship?: string };
  notes?: string;
  tagNames: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

interface MemberMembershipRecord {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  status: MembershipStatus;
  startsAt: string;
  endsAt?: string;
}

interface MemberDeskAlertRecord {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  resolvedAt?: string;
}

interface MemberDeskSignatureRecord {
  id: string;
  label: string;
  required: boolean;
  signedAt?: string;
}

interface MemberDeskStore {
  alertsByMemberId: Record<string, MemberDeskAlertRecord[]>;
  signaturesByMemberId: Record<string, MemberDeskSignatureRecord[]>;
}

interface StaffRecord {
  membershipId: string;
  gymId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

interface MemberListResponse {
  members: MemberRecord[];
}

interface PlanRecord {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  billingInterval: BillingInterval;
  priceCents: number;
  signupFeeCents: number;
  trialDays: number;
  autoRenew: boolean;
  contractLengthMonths?: number;
  classAccessLimit?: number;
  isPublic: boolean;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
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

interface PlanListResponse {
  plans: PlanRecord[];
}

interface ClassTypeListResponse {
  classTypes: ClassTypeRecord[];
}

interface ClassBookingListResponse {
  bookings: ClassBookingRecord[];
}

interface AccessDeviceListResponse {
  devices: AccessDeviceView[];
}

interface AccessRuleListResponse {
  rules: AccessRuleView[];
}

interface AccessEventListResponse {
  events: AccessEventView[];
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
  status: ClassSessionStatus;
}

type ClassBookingRecord = ClassBookingView;

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

type ViewName = "dashboard" | "public";
type BannerTone = "success" | "error" | "info";
type ThemeName = "light" | "dark";
type SettingsSectionKey =
  | "setup"
  | "company_information"
  | "roles_staff"
  | "featured_items"
  | "media"
  | "resources"
  | "promotions"
  | "templates"
  | "customized_themes"
  | "tags"
  | "taxes"
  | "forms";

interface AppState {
  view: ViewName;
  apiHealthy: boolean | null;
  apiInstanceId?: string;
  persistenceDriver?: "memory" | "postgres";
  dashboardLoading: boolean;
  publicLoading: boolean;
  session: SessionTokens | null;
  me: MeResponse | null;
  gym: GymRecord | null;
  locations: LocationRecord[];
  selectedLocationId: string;
  platformGyms: GymRecord[];
  platformGymDirectoryLoaded: boolean;
  members: MemberRecord[];
  staff: StaffRecord[];
  plans: PlanRecord[];
  classTypes: ClassTypeRecord[];
  selectedClassSessionId: string;
  classBookings: ClassBookingRecord[];
  accessDevices: AccessDeviceView[];
  accessRules: AccessRuleView[];
  accessEvents: AccessEventView[];
  publicSlug: string;
  publicGym: GymRecord | null;
  publicPlans: PlanRecord[];
  publicSchedule: PublicSessionRecord[];
  selectedPlanId: string;
  theme: ThemeName;
  settingsSection: SettingsSectionKey;
  roles: RoleRecord[];
  selectedRoleId: string;
  banner?: { tone: BannerTone; text: string };
  publicSuccess?: string;
  // Dashboard sub-views
  dashboardView:
    | "home"
    | "customers"
    | "customer_profile"
    | "customer_edit"
    | "leads"
    | "staff"
    | "pos"
    | "plans"
    | "locations"
    | "classes"
    | "bookings"
    | "personal_training"
    | "access_control"
    | "contracts"
    | "member_portal"
    | "marketing"
    | "reports"
    | "settings"
    | "check_in"
    | "check_in_history";
  selectedMemberId?: string;
  editingMemberId?: string;
  checkInBarcode: string;
  checkInResult?: CheckInRecord;
  checkInReview?: {
    memberId?: string;
    memberName: string;
    profileImageUrl?: string;
    status: "allowed" | "denied";
    deniedReason?: string;
    locationId: string;
    payload: CheckInPayload;
  };
  checkInDebug?: {
    title: string;
    message: string;
    details: string[];
  };
  checkInHistory: CheckInRecord[];
  memberCache: Record<string, { memberships: MemberMembershipRecord[]; checkIns: CheckInRecord[] }>;
  memberDesk: MemberDeskStore;
}

const initialRoute = readRoute();
const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

const state: AppState = {
  view: initialRoute.view,
  apiHealthy: null,
  apiInstanceId: undefined,
  persistenceDriver: undefined,
  dashboardLoading: false,
  publicLoading: false,
  session: loadSession(),
  me: null,
  gym: null,
  locations: [],
  selectedLocationId: "",
  platformGyms: [],
  platformGymDirectoryLoaded: false,
  members: [],
  staff: [],
  plans: [],
  classTypes: [],
  selectedClassSessionId: "",
  classBookings: [],
  accessDevices: [],
  accessRules: [],
  accessEvents: [],
  publicSlug: loadPublicSlug(),
  publicGym: null,
  publicPlans: [],
  publicSchedule: [],
  selectedPlanId: "",
  theme: loadTheme(),
  settingsSection: initialRoute.settingsSection ?? "setup",
  roles: [],
  selectedRoleId: "",
  dashboardView: initialRoute.dashboardView,
  checkInBarcode: "",
  checkInHistory: [],
  checkInDebug: undefined,
  checkInReview: undefined,
  memberCache: {},
  memberDesk: loadMemberDeskStore(),
};

const tokenStore: ApiTokenStore = {
  getAccessToken: () => state.session?.accessToken,
  getRefreshToken: () => state.session?.refreshToken,
  setTokens(tokens) {
    const nextTokens = {
      ...tokens,
      ...(state.apiInstanceId ? { apiInstanceId: state.apiInstanceId } : {})
    };
    state.session = nextTokens;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextTokens));
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
  syncRouteFromHash();
  render();
});

applyTheme();

void initialize();

async function initialize() {
  const gymSlugMatch = new URLSearchParams(window.location.search).get("gymSlug");
  if (gymSlugMatch) {
    state.publicSlug = gymSlugMatch;
    localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, gymSlugMatch);
  }
  render();
  ensureDashboardRouteHash();
  await checkApiHealth();
  clearStaleMemorySession();
  await refreshPlatformGymDirectory();
  normalizeInitialPublicSlug(Boolean(gymSlugMatch));
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
    state.persistenceDriver = data.persistenceDriver;
    state.apiInstanceId = data.apiInstanceId;
  } catch {
    state.apiHealthy = false;
    setBanner("error", "Service is unavailable. Please try again shortly.");
  }
}

async function refreshPlatformGymDirectory() {
  try {
    const gymsData = (await client.listGyms()) as { gyms: GymRecord[] };
    state.platformGyms = gymsData.gyms || [];
    state.platformGymDirectoryLoaded = true;
  } catch {
    state.platformGymDirectoryLoaded = false;
  }
}

function clearStaleMemorySession() {
  if (
    state.persistenceDriver === "memory" &&
    state.session &&
    state.apiInstanceId &&
    state.session.apiInstanceId !== state.apiInstanceId
  ) {
    tokenStore.clearTokens();
    clearDashboardState();
    setBanner("info", "The local API restarted, so your saved dev session was cleared. Please log in again.");
  }
}

function normalizeInitialPublicSlug(wasExplicitSlug: boolean) {
  if (!state.platformGymDirectoryLoaded) {
    return;
  }
  const cleanSlug = state.publicSlug.trim().toLowerCase();
  const slugExists = cleanSlug && state.platformGyms.some((gym) => gym.slug === cleanSlug);
  if (slugExists) {
    state.publicSlug = cleanSlug;
    localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, cleanSlug);
    return;
  }
  if (cleanSlug) {
    clearPublicSlug();
    setBanner(
      "info",
      `Gym "${cleanSlug}" was not found in the local API. Choose an available gym or create a new one.`
    );
    return;
  }
  if (!wasExplicitSlug && state.platformGyms[0]) {
    state.publicSlug = state.platformGyms[0].slug;
    localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, state.publicSlug);
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
      const [members, plans, locations, checkIns, classTypes] = (await Promise.all([
        client.listMembers(state.gym.id) as Promise<MemberListResponse>,
        client.listMembershipPlans(state.gym.id) as Promise<PlanListResponse>,
        client.listLocations(state.gym.id) as Promise<LocationListResponse>,
        client.listCheckIns(state.gym.id) as Promise<{ checkIns?: CheckInRecord[] } | CheckInRecord[]>,
        client.listClassTypes(state.gym.id) as Promise<ClassTypeListResponse>
      ])) as [
        MemberListResponse,
        PlanListResponse,
        LocationListResponse,
        { checkIns?: CheckInRecord[] } | CheckInRecord[],
        ClassTypeListResponse
      ];
      state.members = members.members;
      state.plans = plans.plans;
      state.locations = locations.locations;
      state.classTypes = classTypes.classTypes;
      if (!state.selectedLocationId || !state.locations.some((location) => location.id === state.selectedLocationId)) {
        state.selectedLocationId = state.locations[0]?.id ?? "";
      }
      const cachedMembers = members.members
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6);
      state.memberCache = Object.fromEntries(
        await Promise.all(
          cachedMembers.map(async (member) => {
            try {
              const [membershipResponse, checkInsResponse] = await Promise.all([
                client.listMemberMemberships(state.gym!.id, member.id) as Promise<{ memberships?: MemberMembershipRecord[] } | MemberMembershipRecord[]>,
                client.listMemberCheckIns(state.gym!.id, member.id) as Promise<{ checkIns?: CheckInRecord[] } | CheckInRecord[]>
              ]);
              const memberships = Array.isArray(membershipResponse)
                ? membershipResponse
                : membershipResponse.memberships ?? [];
              const checkIns = Array.isArray(checkInsResponse)
                ? checkInsResponse
                : checkInsResponse.checkIns ?? [];
              return [member.id, { memberships, checkIns }];
            } catch {
              return [member.id, { memberships: [], checkIns: [] }];
            }
          })
        )
      );
      const checkInRecords = Array.isArray(checkIns) ? checkIns : checkIns.checkIns ?? [];
      state.checkInHistory = mergeCheckInHistory(checkInRecords);
      try {
        const rolesResponse = (await client.listRoles(state.gym.id)) as { roles?: RoleRecord[] } | RoleRecord[];
        state.roles = Array.isArray(rolesResponse) ? rolesResponse : rolesResponse.roles ?? [];
        if (!state.selectedRoleId || !state.roles.some((role) => role.id === state.selectedRoleId)) {
          state.selectedRoleId = state.roles[0]?.id ?? "";
        }
        const staffResponse = (await client.listStaff(state.gym.id)) as { staff?: StaffRecord[] };
        state.staff = staffResponse.staff ?? [];
      } catch {
        state.roles = [];
        state.staff = [];
      }
      try {
        const [devicesResponse, rulesResponse, eventsResponse] = (await Promise.all([
          client.listAccessDevices(state.gym.id) as Promise<AccessDeviceListResponse>,
          client.listAccessRules(state.gym.id) as Promise<AccessRuleListResponse>,
          client.listAccessEvents(state.gym.id) as Promise<AccessEventListResponse>
        ])) as [AccessDeviceListResponse, AccessRuleListResponse, AccessEventListResponse];
        state.accessDevices = devicesResponse.devices.map(enrichAccessDevice);
        state.accessRules = rulesResponse.rules.map(enrichAccessRule);
        state.accessEvents = eventsResponse.events.map(enrichAccessEvent);
      } catch {
        state.accessDevices = [];
        state.accessRules = [];
        state.accessEvents = [];
      }
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
      state.roles = [];
      state.staff = [];
      state.plans = [];
      state.locations = [];
      state.classTypes = [];
      state.classBookings = [];
      state.accessDevices = [];
      state.accessRules = [];
      state.accessEvents = [];
      state.selectedLocationId = "";
      state.memberCache = {};
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
  if (
    state.platformGymDirectoryLoaded &&
    !state.platformGyms.some((gym) => gym.slug === cleanSlug)
  ) {
    clearPublicSlug();
    setBanner(
      "info",
      `Gym "${cleanSlug}" was not found in the local API. Choose an available gym or create a new one.`
    );
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
    const scheduleFrom = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const scheduleTo = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();
    const [gymResponse, planResponse, scheduleResponse] = (await Promise.all([
      client.publicGym(cleanSlug) as Promise<PublicGymResponse>,
      client.publicPlans(cleanSlug) as Promise<PublicPlanListResponse>,
      client.publicSchedule(cleanSlug, scheduleFrom, scheduleTo) as Promise<PublicSessionRecord[]>
    ])) as [PublicGymResponse, PublicPlanListResponse, PublicSessionRecord[]];
    state.publicGym = gymResponse.gym;
    state.publicPlans = planResponse.plans;
    state.publicSchedule = scheduleResponse;
    if (
      !state.selectedClassSessionId ||
      !state.publicSchedule.some((session) => session.id === state.selectedClassSessionId)
    ) {
      state.selectedClassSessionId = state.publicSchedule[0]?.id ?? "";
    }
    if (!state.selectedPlanId || !state.publicPlans.some((plan) => plan.id === state.selectedPlanId)) {
      state.selectedPlanId = state.publicPlans[0]?.id ?? "";
    }
    await refreshSelectedClassBookings();
  } catch (error) {
    state.publicGym = null;
    state.publicPlans = [];
    state.publicSchedule = [];
    state.selectedClassSessionId = "";
    state.classBookings = [];
    state.selectedPlanId = "";
    if (error instanceof ApiError && error.status === 404) {
      clearPublicSlug();
    }
    setBanner("error", describeError(error));
  } finally {
    state.publicLoading = false;
    if (shouldRender) {
      render();
    }
  }
}

async function refreshSelectedClassBookings() {
  const session = selectedClassSession();
  if (!state.session || !state.gym || !session) {
    state.classBookings = [];
    return;
  }
  try {
    const response = (await client.listClassBookings(
      state.gym.id,
      session.id
    )) as ClassBookingListResponse | ClassBookingRecord[];
    state.classBookings = Array.isArray(response) ? response : response.bookings ?? [];
  } catch {
    state.classBookings = [];
  }
}

function render() {
  applyTheme();
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
    ${state.view === "dashboard"
      ? renderDashboard()
      : `
        <div class="shell shell-public">
          <main class="layout layout-public">
            <section class="panel primary">
              ${renderPublic(publicPlanPage, publicSignupPage, publicSchedulePage)}
            </section>
          </main>
        </div>
      `}
  `;
  bindEvents();
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
      ? `<img src="${escapeAttribute(state.publicGym.logoUrl)}" alt="${escapeAttribute(state.publicGym.name)} logo" style="max-height: 48px; margin-bottom: 0.5rem; display: block;" />`
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

  let content = '';
  switch (state.dashboardView) {
    case 'customers':
      content = renderCustomersView();
      break;
    case 'customer_profile':
      content = renderCustomerProfileView();
      break;
    case 'customer_edit':
      content = renderCustomerEditView();
      break;
    case 'leads':
      content = renderLeadsView();
      break;
    case 'staff':
      content = renderStaffView();
      break;
    case 'pos':
      content = renderPosView();
      break;
    case 'plans':
      content = renderPlansView();
      break;
    case 'locations':
      content = renderLocationsView();
      break;
    case 'classes':
      content = renderClassesView();
      break;
    case 'bookings':
      content = renderBookingsView();
      break;
    case 'personal_training':
      content = renderPersonalTrainingView();
      break;
    case 'access_control':
      content = renderAccessControlView();
      break;
    case 'contracts':
      content = renderContractsView();
      break;
    case 'member_portal':
      content = renderMemberPortalView();
      break;
    case 'marketing':
      content = renderMarketingView();
      break;
    case 'reports':
      content = renderReportsView();
      break;
    case 'settings':
      content = renderSettingsView();
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
    <div class="club-shell">
      <header class="club-topbar">
        <div class="club-brand">
          <div class="club-mark">
            ${state.gym.logoUrl
              ? `<img src="${escapeAttribute(state.gym.logoUrl)}" alt="${escapeAttribute(state.gym.name)} logo" />`
              : `<span>${state.gym.name.slice(0, 2).toUpperCase()}</span>`}
          </div>
          <div class="club-brand-copy">
            <strong>${state.gym.name}</strong>
            <span>${state.gym.slug}</span>
          </div>
        </div>
        <div class="club-topbar-actions">
          <div class="theme-pill">${state.theme === "dark" ? "Dark mode" : "Light mode"}</div>
          <button type="button" class="icon-pill" aria-label="Notifications">N</button>
          <button type="button" class="icon-pill" aria-label="Settings" data-dashboard-view="settings">S</button>
          <button type="button" class="icon-pill" aria-label="Help">?</button>
          <div class="club-user">
            <div class="club-avatar">${userInitials()}</div>
            <div class="club-user-copy">
              <strong>${state.me?.user.firstName ?? "User"} ${state.me?.user.lastName ?? ""}</strong>
              <span>${currentMembership()?.role?.name ?? "Staff"}</span>
            </div>
          </div>
        </div>
      </header>

      <nav class="club-tabs">
        ${dashboardTab("home", "Club Home")}
        ${dashboardTab("check_in", "Check In")}
        ${dashboardTab("customers", "Customers")}
        ${dashboardTab("leads", "Leads")}
        ${dashboardTab("staff", "Staff")}
        ${dashboardTab("pos", "Point Of Sale")}
        ${dashboardTab("plans", "Plans")}
        ${dashboardTab("locations", "Locations")}
        ${dashboardTab("classes", "Classes")}
        ${dashboardTab("bookings", "Bookings")}
        ${dashboardTab("personal_training", "Training")}
        ${dashboardTab("access_control", "Access")}
        ${dashboardTab("contracts", "Forms")}
        ${dashboardTab("member_portal", "Portal")}
        ${dashboardTab("marketing", "Marketing")}
        ${dashboardTab("reports", "Reporting")}
        ${dashboardTab("settings", "Settings")}
      </nav>

      <div class="club-workspace">
        <main class="club-main">
          ${content}
        </main>
        <aside class="club-rail">
          ${renderCheckInRail()}
        </aside>
      </div>
    </div>
    ${state.checkInReview ? renderCheckInReviewModal(state.checkInReview) : ""}
  `;
}

function dashboardTab(key: AppState["dashboardView"], label: string) {
  const active = dashboardTopLevelView(state.dashboardView) === key ? " active" : "";
  return `<a href="${dashboardViewToHash(key)}" class="club-tab${active}" data-dashboard-view="${key}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
}

function userInitials() {
  const user = state.me?.user;
  if (!user) {
    return "U";
  }
  return `${user.firstName?.trim().charAt(0) ?? ""}${user.lastName?.trim().charAt(0) ?? ""}`.toUpperCase() || "U";
}

function renderCheckInRail() {
  const totalCustomers = state.members.length;
  const activeCustomers = state.members.filter((member) => member.status === MemberStatus.Active).length;
  const occupancy = totalCustomers > 0 ? Math.min(100, Math.max(10, Math.round((activeCustomers / totalCustomers) * 100))) : 0;
  const hasLocation = Boolean(state.selectedLocationId || state.locations[0]?.id);
  const recentCheckIns = [...state.checkInHistory]
    .sort((left, right) => Date.parse(right.checkedInAt) - Date.parse(left.checkedInAt));

  return `
    <section class="rail-card rail-check-in">
      <div class="rail-head">
        <h3>Club Check In</h3>
        <p>Search by last name or barcode</p>
      </div>
      <form id="quick-check-in-form" class="rail-search">
        <input name="barcode" type="text" placeholder="Enter last name or barcode" value="${escapeAttribute(state.checkInBarcode)}" ${hasLocation ? "" : "disabled"} />
      </form>
      ${state.checkInDebug ? renderCheckInDebugPanel(state.checkInDebug) : ""}
      ${!hasLocation
        ? `<div class="checkin-debug"><strong>Location setup needed</strong><p>Create or reactivate a gym location before check-ins can be submitted.</p><ul><li>Check-in requires a valid location id.</li><li>Once a location exists, this rail will start submitting check-ins again.</li></ul></div>`
        : ""}
      <div class="rail-meter">
        <div class="rail-meter-row">
          <span>Occupancy</span>
          <strong>${activeCustomers} of ${totalCustomers || 0}</strong>
        </div>
        <div class="rail-progress"><div style="width:${occupancy}%"></div></div>
      </div>
      <div class="rail-list">
        ${recentCheckIns.length === 0
          ? `<p class="muted">No check-ins yet.</p>`
          : recentCheckIns.map((checkIn) => renderRailCheckInCard(checkIn)).join("")}
      </div>
    </section>
  `;
}

function renderRailCheckInCard(checkIn: CheckInRecord) {
  const member = state.members.find((candidate) => candidate.id === checkIn.memberId);
  const summary = member ? buildRailMemberSummary(member) : undefined;
  const statusClass = checkIn.status === "allowed" ? " rail-person-ok" : " rail-person-issue-alert";
  const displayName = checkIn.memberName ?? `${member?.firstName ?? "Customer"} ${member?.lastName ?? ""}`.trim();
  const isDuplicate = state.checkInHistory.filter(
    (entry) => entry.memberId === checkIn.memberId && isSameDay(new Date(entry.checkedInAt), new Date(checkIn.checkedInAt))
  ).length > 1;
  return `
    <button type="button" class="rail-person rail-person-button${statusClass}" data-check-in-record-id="${checkIn.id}" data-check-in-member-id="${checkIn.memberId}">
      <div class="rail-person-photo">
        <div class="rail-person-avatar rail-person-avatar-large">
          ${member?.profileImageUrl
            ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(displayName)}" />`
            : `<span>${initialsFromDisplayName(displayName)}</span>`}
        </div>
      </div>
      <div class="rail-person-body">
        <div class="rail-person-copy">
          <strong>${displayName}</strong>
          <div class="rail-person-badges">
            ${summary ? `<span class="rail-person-plan-tag">${summary.planLabel}</span>` : ""}
            ${checkIn.status === "denied" ? `<span class="rail-person-blocked-tag">Blocked</span>` : ""}
            ${isDuplicate ? `<span class="rail-person-duplicate-tag">Already checked in</span>` : ""}
          </div>
        </div>
        <div class="rail-person-details">
          <span>${formatRelativeDate(new Date(checkIn.checkedInAt))}</span>
          <span class="${checkIn.status === "allowed" ? "rail-person-issue-tag" : "rail-person-issue-alert-text"}">
            ${checkIn.status === "allowed" ? "Checked in" : (checkIn.deniedReason ?? "Denied")}
          </span>
        </div>
      </div>
    </button>
  `;
}

function renderDashboardHome() {
  const leadCount = state.members.filter((member) => member.status === MemberStatus.Lead).length;
  const activeCount = state.members.filter((member) => member.status === MemberStatus.Active).length;
  const spotlight = selectedMember() ?? state.members[0];
  const recentMembers = [...state.members]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const planCards = state.plans.slice(0, 6);
  return `
    <div class="club-home-grid">
      <section class="club-panel club-customers">
        <div class="card-head">
          <div>
            <p class="eyebrow">Customers</p>
            <h2>${state.gym?.name ?? "Customer Cards"}</h2>
          </div>
          <span class="club-kicker">${state.members.length} total · ${activeCount} active · ${leadCount} leads</span>
        </div>
        ${spotlight ? `
          <article class="club-focus-card">
            <div class="club-focus-photo">
              ${spotlight.profileImageUrl
                ? `<img src="${escapeAttribute(spotlight.profileImageUrl)}" alt="${escapeAttribute(`${spotlight.firstName} ${spotlight.lastName}`.trim())}" />`
                : customerInitials(spotlight)}
            </div>
            <div class="club-focus-copy">
              <p class="eyebrow">Selected</p>
              <h3>${spotlight.firstName} ${spotlight.lastName}</h3>
              <p>${spotlight.status}</p>
              <div class="club-mini-nav">
                <button type="button" class="ghost-button" data-dashboard-view="customer_profile" data-preserve-context="true">Open Profile</button>
                <button type="button" class="ghost-button" data-dashboard-view="customer_edit" data-preserve-context="true">Edit Customer</button>
              </div>
            </div>
          </article>
        ` : `
          <div class="empty-state"><p>Tap a customer from the check-in list to load their card here.</p></div>
        `}
        <div class="club-customer-grid">
          ${recentMembers.length === 0
            ? `<div class="empty-state"><p>No customer cards available.</p></div>`
            : recentMembers.map((member) => `
                <button type="button" class="club-customer-card" data-action="view-member" data-member-id="${member.id}">
                  <div class="club-customer-avatar">
                    ${member.profileImageUrl
                      ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(`${member.firstName} ${member.lastName}`.trim())}" />`
                      : customerInitials(member)}
                  </div>
                  <strong>${member.firstName} ${member.lastName}</strong>
                  <span>${member.status}</span>
                </button>
              `).join("")}
        </div>
      </section>

      <section class="club-panel club-promo">
        <div class="card-head">
          <div>
            <p class="eyebrow">Notice</p>
            <h2>New Promotion</h2>
          </div>
          <span class="club-kicker">Operations</span>
        </div>
        <p class="club-copy">Use the top navigation to jump between customers, leads, staff, POS, marketing, and reporting. Edit a customer from the profile view and adjust barcodes or profile pictures at any time.</p>
        <div class="club-mini-nav">
          <button type="button" class="ghost-button" data-dashboard-view="customers">Open Customers</button>
          <button type="button" class="ghost-button" data-dashboard-view="pos">Open POS</button>
        </div>
      </section>

      <section class="club-panel club-events">
        <div class="card-head">
          <div>
            <p class="eyebrow">Upcoming Events</p>
            <h2>Member Actions</h2>
          </div>
        </div>
        <div class="club-events-list">
          ${recentMembers.length === 0
            ? `<div class="empty-state"><p>No customer activity yet.</p></div>`
            : recentMembers.map((member) => `
                <article class="club-event">
                  <div class="club-event-avatar">
                    ${member.profileImageUrl
                      ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(`${member.firstName} ${member.lastName}`.trim())}" />`
                      : customerInitials(member)}
                  </div>
                  <div>
                    <strong>${member.firstName} ${member.lastName}</strong>
                    <p>${member.status}${member.barcode ? ` · ${member.barcode}` : ""}</p>
                  </div>
                </article>
              `).join("")}
        </div>
      </section>

      <section class="club-panel club-pos">
        <div class="card-head">
          <div>
            <p class="eyebrow">Point Of Sale</p>
            <h2>Membership Products</h2>
          </div>
        </div>
        <div class="club-product-grid">
          ${planCards.length === 0
            ? `<div class="empty-state"><p>No public plans yet.</p></div>`
            : planCards.map((plan) => `
                <article class="club-product">
                  <div class="club-product-art"></div>
                  <strong>${plan.name}</strong>
                  <span>${formatCurrency(plan.priceCents)}</span>
                </article>
              `).join("")}
        </div>
      </section>

      <section class="club-panel club-spotlight">
        <div class="card-head">
          <div>
            <p class="eyebrow">Spotlight Member</p>
            <h2>${spotlight ? `${spotlight.firstName} ${spotlight.lastName}` : "No customer selected"}</h2>
          </div>
          <button type="button" class="ghost-button" data-dashboard-view="customers" data-preserve-context="true">View Customers</button>
        </div>
        ${spotlight ? `
          <div class="spotlight-card">
            <div class="spotlight-photo">
              ${spotlight.profileImageUrl
                ? `<img src="${escapeAttribute(spotlight.profileImageUrl)}" alt="${escapeAttribute(`${spotlight.firstName} ${spotlight.lastName}`.trim())}" />`
                : customerInitials(spotlight)}
            </div>
            <div class="spotlight-copy">
              <p><strong>Status:</strong> ${spotlight.status}</p>
              <p><strong>Barcode:</strong> ${spotlight.barcode || "Not set"}</p>
              <p><strong>Contact:</strong> ${spotlight.email || spotlight.phone || "No contact info"}</p>
            </div>
          </div>
        ` : `
          <div class="empty-state"><p>Create a customer to see the spotlight card.</p></div>
        `}
      </section>
    </div>
  `;
}

function renderCustomersView() {
  const memberPage = buildMemberListPage({
    members: state.members,
    permissions: currentPermissions()
  });
  const recentMembers = [...state.members]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);
  const spotlight = selectedMember() ?? recentMembers[0];
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Customers</p>
          <h2>Customer Cards</h2>
        </div>
        <span class="club-kicker">${memberPage.summaryLabel}</span>
      </div>
      <div class="club-page-split">
        <div class="club-customer-grid">
          ${recentMembers.length === 0
            ? `<div class="empty-state"><p>No customers yet.</p></div>`
            : recentMembers.map((member) => `
                <button type="button" class="club-customer-card" data-action="view-member" data-member-id="${member.id}">
                  <div class="club-customer-avatar">
                    ${member.profileImageUrl
                      ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(`${member.firstName} ${member.lastName}`.trim())}" />`
                      : customerInitials(member)}
                  </div>
                  <strong>${member.firstName} ${member.lastName}</strong>
                  <span>${member.status}</span>
                </button>
              `).join("")}
        </div>
        <div class="club-panel club-focus-panel">
          ${spotlight
            ? `
              <div class="club-focus-card compact">
                <div class="club-focus-photo">
                  ${spotlight.profileImageUrl
                    ? `<img src="${escapeAttribute(spotlight.profileImageUrl)}" alt="${escapeAttribute(`${spotlight.firstName} ${spotlight.lastName}`.trim())}" />`
                    : customerInitials(spotlight)}
                </div>
                <div class="club-focus-copy">
                  <p class="eyebrow">Selected</p>
                  <h3>${spotlight.firstName} ${spotlight.lastName}</h3>
                  <p>${spotlight.status}</p>
                  <div class="club-mini-nav">
                    <button type="button" class="ghost-button" data-dashboard-view="customer_profile" data-preserve-context="true">Open Profile</button>
                    <button type="button" class="ghost-button" data-dashboard-view="customer_edit" data-preserve-context="true">Edit Customer</button>
                  </div>
                </div>
              </div>
            `
            : `<div class="empty-state"><p>Select a customer to see details.</p></div>`}
          ${renderModelTable(memberPage.table, "No customer rows to display.")}
        </div>
      </div>
    </section>
  `;
}

function renderCustomerProfileView() {
  const member = selectedMember();
  if (!member) {
    return `<div class="empty-state"><h3>Customer not found</h3><p>The selected customer could not be found.</p></div>`;
  }
  const summary = buildCheckInMemberSummary(member);
  const planOptions = state.plans
    .filter((plan) => plan.status !== "archived")
    .map((plan) => ({ value: plan.id, label: `${plan.name} · ${formatCurrency(plan.priceCents)}` }));
  const photoMarkup = member.profileImageUrl
    ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(`${member.firstName} ${member.lastName}`.trim() || "Customer")} profile picture" style="width:112px;height:112px;border-radius:28px;object-fit:cover;border:1px solid var(--line);background:#111;" />`
    : `<div style="width:112px;height:112px;border-radius:28px;display:grid;place-items:center;background:#262626;border:1px solid var(--line);font-weight:700;">${customerInitials(member)}</div>`;
  return `
    <div style="margin-bottom:1rem;">
      <button class="tab-btn active" data-dashboard-view="customers" data-preserve-context="true">← Back to Customers</button>
    </div>
    <section class="club-panel profile-sheet">
      <div class="profile-header">
        <div class="profile-header-main">
          <div class="profile-avatar">${photoMarkup}</div>
          <div class="profile-header-copy">
            <p class="eyebrow">Customer Profile</p>
            <h2>${member.firstName} ${member.lastName}</h2>
            <div class="checkin-sheet-badges">
              <span class="club-note-label">${summary.planLabel}</span>
              <span class="club-note-label">${summary.statusLabel}</span>
              ${summary.paidMember ? `<span class="checkin-paid-tag">Paid member</span>` : `<span class="checkin-due-tag">Payment needed</span>`}
            </div>
            <div class="checkin-sheet-meta">
              <span><strong>Amount due:</strong> ${summary.amountDueLabel}</span>
              <span><strong>Barcode:</strong> ${member.barcode || "Not set"}</span>
              <span><strong>Profile image:</strong> ${member.profileImageUrl || "Not set"}</span>
            </div>
            ${renderLinkedMemberChips(summary)}
          </div>
        </div>
        <div class="club-mini-nav">
          <button type="button" class="ghost-button" data-customer-action="edit" data-member-id="${member.id}">Edit customer</button>
          <button type="button" class="ghost-button" data-dashboard-view="check_in" data-preserve-context="true">Open check-in</button>
          <button type="button" class="ghost-button" data-sheet-view="pos">POS</button>
        </div>
      </div>

      <div class="profile-tools-grid">
        <form id="member-barcode-form" class="form-card compact-form">
          <input type="hidden" name="memberId" value="${member.id}" />
          ${renderInput("barcode", "Barcode", "text", member.barcode ?? "")}
          <button type="submit">Save barcode</button>
        </form>

        ${planOptions.length === 0
          ? `<div class="settings-placeholder"><strong>No plans loaded</strong><p>Create a plan before adding a membership.</p></div>`
          : `
            <form id="member-add-membership-form" class="form-card compact-form">
              <input type="hidden" name="memberId" value="${member.id}" />
              ${renderSelect("planId", "Add membership", planOptions, summary.primaryPlan?.id ?? planOptions[0]?.value ?? "")}
              ${renderSelect("status", "Membership status", [
                { value: MembershipStatus.Active, label: "Active" },
                { value: MembershipStatus.Trialing, label: "Trialing" },
                { value: MembershipStatus.PastDue, label: "Past due" },
                { value: MembershipStatus.Frozen, label: "Frozen" },
                { value: MembershipStatus.Expired, label: "Expired" }
              ], MembershipStatus.Active)}
              <button type="submit">Add membership</button>
            </form>
          `}
      </div>

      <div class="profile-grid">
        <div class="profile-column">
          <div class="checkin-sheet-section">
            <div class="card-head">
              <h3>Billing history / Invoices</h3>
              <span>${summary.memberships.length}</span>
            </div>
            ${renderBillingHistory(member)}
          </div>

          <div class="checkin-sheet-section">
            <div class="card-head">
              <h3>Notes</h3>
              <button type="button" class="ghost-button" data-dashboard-view="customer_edit" data-preserve-context="true">Edit notes</button>
            </div>
            ${member.notes
              ? `<div class="club-note"><p>${escapeHtml(member.notes)}</p></div>`
              : `<div class="settings-placeholder"><strong>No notes</strong><p>Add front-desk notes from the customer editor.</p></div>`}
          </div>
        </div>

        <div class="profile-column">
          <div class="checkin-sheet-section">
            <div class="card-head">
              <h3>Contacts</h3>
              <span>${summary.otherMembers.length ? `${summary.otherMembers.length} linked` : "0 linked"}</span>
            </div>
            ${renderMemberContacts(member, summary)}
          </div>

          <div class="checkin-sheet-section">
            <div class="card-head">
              <h3>Alerts</h3>
              <span>Front desk</span>
            </div>
            ${renderMemberAlerts(member)}
          </div>

          <div class="checkin-sheet-section">
            <div class="card-head">
              <h3>Forms and signatures</h3>
              <span>${getMemberSignatures(member.id).length}</span>
            </div>
            ${renderMemberSignatures(member)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCustomerEditView() {
  const member = selectedMember();
  if (!member) {
    return `<div class="empty-state"><h3>Customer not found</h3><p>The selected customer could not be found.</p></div>`;
  }
  return `
    <section class="data-card customer-edit-shell">
      <div class="card-head customer-edit-head">
        <div>
          <p class="eyebrow">Edit Customer</p>
          <h3>${member.firstName} ${member.lastName}</h3>
        </div>
        <span>${member.id}</span>
      </div>
      <form id="update-member-form" class="form-card customer-edit-form">
        <input type="hidden" name="memberId" value="${member.id}" />
        <div class="customer-edit-toolbar">
          <div class="customer-edit-toolbar-copy">
            <strong>Everything saves from here.</strong>
            <span>Use the sections below to update the member record.</span>
          </div>
          <div class="customer-edit-actions">
            <button type="submit" class="save-button">Save customer</button>
            <button type="button" class="ghost-button" data-dashboard-view="customers" data-preserve-context="true">Back to customers</button>
          </div>
        </div>

        <div class="customer-edit-grid">
          <section class="customer-edit-card">
            <h4>Identity</h4>
            ${renderInput("firstName", "First name", "text", member.firstName)}
            ${renderInput("lastName", "Last name", "text", member.lastName)}
            ${renderSelect("status", "Status", Object.values(MemberStatus).map((value) => ({ value, label: value })), member.status)}
          </section>

          <section class="customer-edit-card">
            <h4>Contact</h4>
            ${renderInput("email", "Email", "email", member.email ?? "")}
            ${renderInput("phone", "Phone", "tel", member.phone ?? "")}
            ${renderInput("profileImageUrl", "Profile image URL", "url", member.profileImageUrl ?? "")}
          </section>

          <section class="customer-edit-card">
            <h4>Access</h4>
            ${renderInput("barcode", "Barcode", "text", member.barcode ?? "")}
            ${renderInput("tagNames", "Tags, comma separated", "text", member.tagNames.join(", "))}
          </section>

          <section class="customer-edit-card customer-edit-card-wide">
            <h4>Notes</h4>
            <label class="field">
              <span>Notes</span>
              <textarea name="notes" rows="5">${escapeAttribute(member.notes ?? "")}</textarea>
            </label>
          </section>

          <section class="customer-edit-card customer-edit-card-wide">
            <h4>Emergency contact</h4>
            ${renderInput("emergencyContactName", "Contact name", "text", member.emergencyContact?.name ?? "")}
            ${renderInput("emergencyContactPhone", "Contact phone", "tel", member.emergencyContact?.phone ?? "")}
            ${renderInput("emergencyContactRelationship", "Relationship", "text", member.emergencyContact?.relationship ?? "")}
          </section>
        </div>

        <div class="customer-edit-footer">
          <button type="submit" class="save-button">Save customer</button>
          <button type="button" class="ghost-button" data-dashboard-view="customers" data-preserve-context="true">Cancel</button>
        </div>
      </form>
    </section>
  `;
}

function renderLeadsView() {
  const leadPage = buildLeadListPage({
    members: state.members,
    permissions: currentPermissions()
  });
  const leadCards = leadPage.rows.slice(0, 6);
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Leads</p>
          <h2>Lead Pipeline</h2>
        </div>
        <span class="club-kicker">${leadPage.summaryLabel}</span>
      </div>
      <div class="club-page-split">
        <div class="club-customer-grid">
          ${leadCards.length === 0
            ? `<div class="empty-state"><p>No leads yet.</p></div>`
            : leadCards.map((member) => `
                <button type="button" class="club-customer-card" data-action="view-member" data-member-id="${member.id}">
                  <div class="club-customer-avatar">
                    ${member.profileImageUrl
                      ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(`${member.firstName} ${member.lastName}`.trim())}" />`
                      : customerInitials(member)}
                  </div>
                  <strong>${member.fullName}</strong>
                  <span>${member.contactLabel} · ${member.tagLabel}</span>
                </button>
              `).join("")}
        </div>
        <div class="club-panel club-focus-panel">
          <div class="club-note">
            <span class="club-note-label">Pipeline</span>
            <strong>${leadPage.rowCount}</strong>
            <p>Leads are powered by the shared leads-and-CRM model and can be promoted by changing status.</p>
          </div>
          ${renderModelTable(leadPage.table, "No leads to display.")}
        </div>
      </div>
    </section>
  `;
}

function renderStaffView() {
  const staffPage = buildStaffListPage({
    staff: state.staff,
    roles: state.roles.map((role) => ({
      id: role.id,
      name: role.name,
      label: formatRoleLabel(role.name),
      permissions: role.permissions
    })),
    permissions: currentPermissions()
  });
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Staff</p>
          <h2>Team access</h2>
        </div>
        <span>${staffPage.summary.visibleCount} visible · ${staffPage.summary.activeCount} active</span>
      </div>
      <div class="club-customer-grid">
        ${state.staff.length === 0
          ? `<div class="empty-state"><p>No staff loaded.</p></div>`
          : staffPage.rows.slice(0, 6).map((staff) => `
              <article class="club-customer-card">
                <div class="club-customer-avatar">${staff.initials}</div>
                <strong>${staff.fullName}</strong>
                <span>${staff.roleLabel} · ${staff.statusLabel}</span>
              </article>
            `).join("")}
      </div>
      ${renderModelTable(staffPage.table, "No staff rows to display.")}
    </section>
  `;
}

function renderPosView() {
  const publicPlanPage = state.publicGym
    ? buildPublicPlansPage({
        plans: state.publicPlans,
        featureFlags: state.publicGym.featureFlags,
        featuredPlanId: state.selectedPlanId || state.publicPlans[0]?.id
      })
    : undefined;
  const selected = selectedMember() ?? state.members.find((member) => member.status !== MemberStatus.Archived);
  const stripeAccount = demoStripeAccount();
  const connection = buildStripePaymentConnectionScreen({
    permissions: currentPermissions(),
    ...(stripeAccount ? { account: stripeAccount } : {})
  });
  const collection = buildStripePaymentCollectionScreen({
    permissions: currentPermissions(),
    featureFlags: state.gym?.featureFlags ?? [],
    amountCents: selected ? "9900" : "",
    paymentMethod: StripePaymentMethod.ManualEntry,
    ...(stripeAccount ? { account: stripeAccount } : {}),
    ...(selected ? { member: selected } : {})
  });
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Point Of Sale</p>
          <h2>Payments and memberships</h2>
        </div>
        <span>${connection.summaryLabel}</span>
      </div>
      <div class="club-page-split">
        <div>
          <div class="club-product-grid compact">
            ${publicPlanPage?.planCards.slice(0, 6).map((plan) => `
              <article class="club-product">
                <div class="club-product-art"></div>
                <strong>${plan.title}</strong>
                <span>${plan.priceLabel}</span>
              </article>
            `).join("") ?? `<div class="empty-state"><p>No plans loaded.</p></div>`}
          </div>
        </div>
        <div class="section-stack">
          <article class="mini-card">
            <span>Stripe</span>
            <strong>${connection.statusLabel}</strong>
            <p class="muted">${connection.reason ?? connection.summaryLabel}</p>
          </article>
          <article class="mini-card">
            <span>Collection</span>
            <strong>${collection.memberName}</strong>
            <p class="muted">${collection.blockedReason ?? collection.summaryLabel}</p>
          </article>
          <div class="club-mini-nav">
            <button type="button" class="ghost-button" data-dashboard-view="plans">Manage plans</button>
            <button type="button" class="ghost-button" data-dashboard-view="customer_profile" data-preserve-context="true">Open selected customer</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderPlansView() {
  const page = buildMembershipPlanListPage({
    plans: state.plans,
    permissions: currentPermissions()
  });
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Membership Plans</p>
          <h2>Plans and packages</h2>
        </div>
        <span>${page.summaryLabel}</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Monthly</span><strong>${page.summary.monthlyCount}</strong></article>
        <article class="mini-card"><span>Yearly</span><strong>${page.summary.yearlyCount}</strong></article>
        <article class="mini-card"><span>Public</span><strong>${page.summary.publicCount}</strong></article>
        <article class="mini-card"><span>Package</span><strong>${page.summary.packageCount}</strong></article>
      </div>
      <div class="club-page-split">
        <div class="data-card">
          ${renderModelTable(page.table, "No membership plans to display.")}
        </div>
        <form id="create-plan-form" class="form-card">
          <h3>Create public plan</h3>
          ${renderInput("name", "Plan name")}
          ${renderInput("description", "Description")}
          ${renderSelect("billingInterval", "Billing interval", [
            { value: BillingInterval.Monthly, label: "Monthly" },
            { value: BillingInterval.Yearly, label: "Yearly" },
            { value: BillingInterval.OneTime, label: "One-time" },
            { value: BillingInterval.Package, label: "Package" }
          ], BillingInterval.Monthly)}
          ${renderInput("price", "Price", "number", "99")}
          ${renderInput("signupFee", "Signup fee", "number", "0")}
          ${renderInput("trialDays", "Trial days", "number", "0")}
          <button type="submit" ${page.createPlanAction.disabled ? "disabled" : ""}>Create plan</button>
        </form>
      </div>
    </section>
  `;
}

function renderLocationsView() {
  const page = buildLocationListPage(state.locations, state.selectedLocationId);
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Locations</p>
          <h2>Facilities and rooms</h2>
        </div>
        <span>${page.summary.activeCount} active · ${page.summary.archivedCount} archived</span>
      </div>
      <div class="club-page-split">
        <div class="data-card">
          ${renderModelTable(page.table, "No active locations to display.")}
          ${page.selectedLocation ? `
            <div class="club-note" style="margin-top: 14px;">
              <span class="club-note-label">Selected for operations</span>
              <p>${escapeHtml(page.selectedLocation.name)} powers check-ins, class schedules, access rules, and reporting filters.</p>
            </div>
          ` : ""}
        </div>
        <form id="create-location-form" class="form-card">
          <h3>Add location</h3>
          ${renderInput("name", "Location name")}
          ${renderInput("line1", "Address line 1")}
          ${renderInput("line2", "Address line 2")}
          ${renderInput("city", "City")}
          ${renderInput("region", "State / Region")}
          ${renderInput("postalCode", "Postal code")}
          ${renderInput("country", "Country", "text", "US")}
          ${renderInput("timezone", "Timezone", "text", state.gym?.timezone ?? "America/New_York")}
          ${renderInput("phone", "Phone", "tel")}
          <button type="submit">Create location</button>
        </form>
      </div>
    </section>
  `;
}

function renderClassesView() {
  const page = buildClassSessionListPage({
    sessions: dashboardClassSessions(),
    classTypes: classTypeViews(),
    locations: state.locations.map((location) => ({ id: location.id, name: location.name })),
    trainers: trainerViews(),
    permissions: currentPermissions()
  });
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Classes</p>
          <h2>Schedule board</h2>
        </div>
        <span>${page.summaryLabel}</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Scheduled</span><strong>${page.summary.scheduledCount}</strong></article>
        <article class="mini-card"><span>Completed</span><strong>${page.summary.completedCount}</strong></article>
        <article class="mini-card"><span>Cancelled</span><strong>${page.summary.cancelledCount}</strong></article>
        <article class="mini-card"><span>Class types</span><strong>${state.classTypes.length}</strong></article>
      </div>
      ${renderModelTable(page.table, "No class sessions are visible for the current public schedule window.")}
      <div class="club-mini-nav">
        <button type="button" class="ghost-button" data-dashboard-view="bookings">Open bookings</button>
        <button type="button" class="ghost-button" data-dashboard-view="locations">Locations</button>
      </div>
    </section>
  `;
}

function renderBookingsView() {
  const session = selectedClassSession();
  if (!session) {
    return `
      <section class="club-panel club-page">
        <div class="empty-state">
          <h3>No class session selected</h3>
          <p>Load a public schedule or create a class session before reviewing bookings and waitlists.</p>
        </div>
      </section>
    `;
  }
  const bookingPage = buildBookingListPage({
    session: bookingSessionView(session),
    bookings: state.classBookings,
    members: state.members,
    permissions: currentPermissions()
  });
  const sessions = dashboardClassSessions();
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Bookings</p>
          <h2>${escapeHtml(bookingPage.session.className)}</h2>
        </div>
        <span>${bookingPage.summaryLabel}</span>
      </div>
      <label class="field">
        <span>Class session</span>
        <select data-class-session-select>
          ${sessions.map((item) => {
            const option = bookingSessionView(item);
            return `<option value="${item.id}" ${item.id === session.id ? "selected" : ""}>${escapeHtml(option.className)} · ${escapeHtml(option.startsAt)}</option>`;
          }).join("")}
        </select>
      </label>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Booked</span><strong>${bookingPage.summary.bookedCount}</strong></article>
        <article class="mini-card"><span>Waitlisted</span><strong>${bookingPage.summary.waitlistedCount}</strong></article>
        <article class="mini-card"><span>Cancelled</span><strong>${bookingPage.summary.cancelledCount}</strong></article>
        <article class="mini-card"><span>Staff-created</span><strong>${bookingPage.summary.staffCreatedCount}</strong></article>
      </div>
      ${renderModelTable(bookingPage.table, "No bookings for this class session.")}
    </section>
  `;
}

function renderPersonalTrainingView() {
  const sessions = demoPersonalTrainingSessions();
  const page = buildPersonalTrainingSessionListPage({
    sessions,
    members: state.members,
    trainers: trainerViews(),
    permissions: currentPermissions(),
    featureFlags: state.gym?.featureFlags ?? []
  });
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Personal Training</p>
          <h2>Trainer appointments</h2>
        </div>
        <span>${page.summaryLabel}</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Feature</span><strong>${page.featureEnabled ? "Enabled" : "Disabled"}</strong></article>
        <article class="mini-card"><span>Scheduled</span><strong>${page.summary.scheduledCount}</strong></article>
        <article class="mini-card"><span>Trainers</span><strong>${page.trainerOptionCount}</strong></article>
        <article class="mini-card"><span>Visible</span><strong>${page.rowCount}</strong></article>
      </div>
      ${renderModelTable(page.table, page.empty?.body ?? "No personal training sessions to display.")}
    </section>
  `;
}

function renderAccessControlView() {
  const selectedLocationId = state.selectedLocationId || state.locations[0]?.id || "";
  const selectedPlanId = state.plans.find((plan) => plan.status === PlanStatus.Active)?.id;
  const deviceList = buildAccessDeviceListScreen(state.accessDevices);
  const registration = buildAccessDeviceRegistrationScreen({
    deviceType: AccessDeviceType.DoorController,
    ...(selectedLocationId ? { locationId: selectedLocationId } : {})
  });
  const ruleEditor = buildAccessRuleEditorScreen({
    rules: state.accessRules,
    allowAllActiveMembers: !selectedPlanId,
    ...(selectedLocationId ? { selectedLocationId } : {}),
    ...(selectedPlanId ? { selectedPlanId } : {})
  });
  const events = buildAccessEventHistoryScreen(state.accessEvents);
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Access Control</p>
          <h2>Doors, rules, and events</h2>
        </div>
        <span>${deviceList.devices.length} devices · ${events.deniedCount} denied events</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Devices</span><strong>${deviceList.devices.length}</strong></article>
        <article class="mini-card"><span>Offline</span><strong>${deviceList.offlineCount}</strong></article>
        <article class="mini-card"><span>Rules</span><strong>${ruleEditor.rules.length}</strong></article>
        <article class="mini-card"><span>Events</span><strong>${events.events.length}</strong></article>
      </div>
      <div class="club-page-split">
        <div class="section-stack">
          <div class="data-card">
            <h3>Devices</h3>
            ${renderSimpleRows(deviceList.devices, ["name", "locationName", "deviceType", "status", "apiKeyPreview"], "No access devices registered.")}
          </div>
          <div class="data-card">
            <h3>Recent access events</h3>
            ${renderSimpleRows(events.events.slice(0, 8), ["occurredAt", "memberName", "deviceName", "decision", "reason"], "No access events recorded.")}
          </div>
        </div>
        <div class="section-stack">
          <form id="create-access-device-form" class="form-card">
            <h3>Register device</h3>
            ${renderInput("name", "Device name", "text", registration.name)}
            ${renderSelect("locationId", "Location", locationSelectOptions(), selectedLocationId)}
            ${renderSelect("deviceType", "Device type", [
              { value: AccessDeviceType.DoorController, label: "Door controller" },
              { value: AccessDeviceType.Kiosk, label: "Kiosk" }
            ], registration.deviceType)}
            <button type="submit" ${!registration.canSubmit && !selectedLocationId ? "disabled" : ""}>Register device</button>
          </form>
          <form id="create-access-rule-form" class="form-card">
            <h3>Create rule</h3>
            ${renderInput("name", "Rule name", "text", "All active members")}
            ${renderSelect("locationId", "Location", locationSelectOptions(), selectedLocationId)}
            ${renderSelect("planId", "Plan", [{ value: "", label: "All active members" }, ...planSelectOptions()], selectedPlanId ?? "")}
            <label class="permission-chip active">
              <input type="checkbox" name="allowAllActiveMembers" ${ruleEditor.allowAllActiveMembers ? "checked" : ""} />
              <span>Allow all active members</span>
            </label>
            <button type="submit" ${!selectedLocationId ? "disabled" : ""}>Create rule</button>
          </form>
        </div>
      </div>
    </section>
  `;
}

function renderContractsView() {
  const page = buildContractWaiverListPage({
    documents: contractWaiverDocuments(),
    permissions: currentPermissions()
  });
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Forms</p>
          <h2>Contracts and waivers</h2>
        </div>
        <span>${page.summaryLabel}</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Contracts</span><strong>${page.summary.contractCount}</strong></article>
        <article class="mini-card"><span>Waivers</span><strong>${page.summary.waiverCount}</strong></article>
        <article class="mini-card"><span>Requires signature</span><strong>${page.summary.requiredSignatureCount}</strong></article>
        <article class="mini-card"><span>Published</span><strong>${page.summary.publishedCount}</strong></article>
      </div>
      ${renderModelTable(page.table, "No contracts or waivers to display.")}
    </section>
  `;
}

function renderMemberPortalView() {
  const portal = buildMemberPortalLayout("/");
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Member Portal</p>
          <h2>${portal.title}</h2>
        </div>
        <span>${portal.navItems.length} member routes</span>
      </div>
      <div class="card-grid">
        ${portal.navItems.map((item) => `
          <article class="mini-card">
            <span>${item.href}</span>
            <strong>${item.label}</strong>
            <p class="muted">${item.active ? "Default member portal landing view" : "Member self-service route"}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderMarketingView() {
  const publicLayout = buildPublicSiteLayout("/");
  const publicFeatureFlags = state.publicGym?.featureFlags ?? state.gym?.featureFlags ?? [];
  const brandColors = state.publicGym?.brandColors;
  const home = buildPublicWebsiteHomePage({
    gymName: state.publicGym?.name ?? state.gym?.name ?? "Public website",
    featureFlags: publicFeatureFlags,
    ...(brandColors?.primary ? { primaryColor: brandColors.primary } : {}),
    ...(brandColors?.accent ? { accentColor: brandColors.accent } : {}),
    ...(state.publicGym?.logoUrl ? { logoUrl: state.publicGym.logoUrl } : {})
  });
  const selectedPlan = state.publicPlans.find((plan) => plan.id === state.selectedPlanId);
  const checkout = buildPublicCheckoutPage({
    featureFlags: publicFeatureFlags,
    firstName: "New",
    lastName: "Member",
    email: "new.member@example.com",
    ...(selectedPlan ? { plan: selectedPlan } : {})
  });
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Marketing</p>
          <h2>Public site builder</h2>
        </div>
        <span>${home.summaryLabel}</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card">
          <span>Public site</span>
          <strong>${state.publicSlug || state.gym?.slug || "Not set"}</strong>
        </article>
        <article class="mini-card">
          <span>Leads</span>
          <strong>${state.members.filter((member) => member.status === MemberStatus.Lead).length}</strong>
        </article>
        <article class="mini-card">
          <span>Public routes</span>
          <strong>${publicLayout.navItems.length}</strong>
        </article>
        <article class="mini-card">
          <span>Checkout</span>
          <strong>${checkout.canSubmit ? "Ready" : "Blocked"}</strong>
        </article>
      </div>
      <div class="card-grid">
        ${home.featureCards.map((card) => `
          <article class="mini-card">
            <span>Website section</span>
            <strong>${escapeHtml(card.title)}</strong>
            <p class="muted">${escapeHtml(card.body ?? "Public website module")}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderReportsView() {
  const statusCounts = Object.values(MemberStatus).map((status) => ({
    status,
    count: state.members.filter((member) => member.status === status).length
  }));
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <h3>Reports</h3>
        <span>${state.members.length} customers</span>
      </div>
      <div class="stat-grid compact">
        ${statusCounts
          .map(
            (entry) => `
              <article class="mini-card">
                <span>${entry.status}</span>
                <strong>${entry.count}</strong>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

const settingsTabs: Array<{ key: SettingsSectionKey; label: string }> = [
  { key: "setup", label: "Setup" },
  { key: "company_information", label: "Company Information" },
  { key: "roles_staff", label: "Roles and Staff" },
  { key: "featured_items", label: "Featured Items" },
  { key: "media", label: "Media" },
  { key: "resources", label: "Resources" },
  { key: "promotions", label: "Promotions" },
  { key: "templates", label: "Templates" },
  { key: "customized_themes", label: "Customized Themes" },
  { key: "tags", label: "Tags" },
  { key: "taxes", label: "Taxes" },
  { key: "forms", label: "Forms" },
];

function formatPermissionLabel(permission: string) {
  return permission
    .split(":")
    .map((part) =>
      part
        .split("_")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ")
    )
    .join(" ");
}

function renderPermissionCheckboxes(selectedPermissions: string[] = []) {
  return ROLE_PERMISSION_OPTIONS.map(
    (permission) => `
      <label class="permission-chip${selectedPermissions.includes(permission) ? " active" : ""}">
        <input type="checkbox" name="permissions" value="${permission}" ${selectedPermissions.includes(permission) ? "checked" : ""} />
        <span>${escapeHtml(formatPermissionLabel(permission))}</span>
      </label>
    `
  ).join("");
}

function renderSettingsView() {
  const activeLocations = state.locations.filter((location) => !location.archivedAt);
  const content = renderSettingsSectionContent(activeLocations);
  return `
    <section class="club-panel club-page settings-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Settings</p>
          <h2>Workspace controls</h2>
        </div>
        <span class="club-kicker">Customize your gym operations</span>
      </div>
      <div class="settings-shell">
        <aside class="settings-sidebar">
          ${settingsTabs
            .map(
              (tab) => `
                <button type="button" class="settings-tab${state.settingsSection === tab.key ? " active" : ""}" data-settings-section="${tab.key}">
                  ${tab.label}
                </button>
              `
            )
            .join("")}
        </aside>
        <div class="settings-content">
          ${content}
        </div>
      </div>
    </section>
  `;
}

function renderSettingsSectionContent(activeLocations: LocationRecord[]) {
  const editableRoles = state.roles.filter(
    (role) => role.name !== RoleName.Owner && role.name !== RoleName.Member
  );
  const selectedRole = state.roles.find((role) => role.id === state.selectedRoleId) ?? editableRoles[0] ?? state.roles[0];
  switch (state.settingsSection) {
    case "company_information":
      return `
        <div class="club-panel">
          <h3>Company Information</h3>
          <p class="club-copy">Review the gym identity that appears across the dashboard and check-in flow.</p>
          <div class="settings-grid">
            <article class="mini-card"><span>Gym</span><strong>${escapeHtml(state.gym?.name ?? "Gym")}</strong></article>
            <article class="mini-card"><span>Slug</span><strong>${escapeHtml(state.gym?.slug ?? "n/a")}</strong></article>
            <article class="mini-card"><span>Timezone</span><strong>${escapeHtml(state.gym?.timezone ?? "America/New_York")}</strong></article>
            <article class="mini-card"><span>Locations</span><strong>${state.locations.length}</strong></article>
          </div>
        </div>
      `;
    case "roles_staff":
      return `
        <div class="settings-grid settings-grid-wide">
          <div class="club-panel">
            <h3>Roles and Staff</h3>
            <p class="club-copy">Manage access, front desk staff, and operational roles.</p>
            <div class="settings-grid">
              ${state.roles.length === 0
                ? `<div class="settings-placeholder"><strong>No roles loaded</strong><p>Open the gym again after the backend finishes loading roles.</p></div>`
                : state.roles.map((role) => `
                    <button type="button" class="settings-role-card${role.id === state.selectedRoleId ? " active" : ""}" data-role-select="${role.id}">
                      <strong>${escapeHtml(role.name)}</strong>
                      <span>${role.permissions.length} permissions</span>
                    </button>
                  `).join("")}
            </div>
          </div>
          <div class="club-panel">
            <h3>Role details</h3>
            ${selectedRole
              ? `
                <div class="role-detail-head">
                  <div>
                    <strong>${escapeHtml(selectedRole.name)}</strong>
                    <p>${selectedRole.isSystem ? "System role" : "Custom role"}</p>
                  </div>
                  <span class="club-note-label">${selectedRole.permissions.length} permissions</span>
                </div>
                <div class="settings-placeholder" style="margin-bottom: 14px;">
                  <strong>Permissions</strong>
                  <p>${selectedRole.permissions.map((permission) => escapeHtml(formatPermissionLabel(permission))).join(", ") || "No permissions"}</p>
                </div>
                ${selectedRole.isSystem
                  ? `<p class="muted">System roles cannot be edited from the UI.</p>`
                  : `
                    <form id="edit-role-form" class="form-card">
                      ${renderInput("roleName", "Role name", "text", selectedRole.name)}
                      <div class="permissions-grid">
                        ${renderPermissionCheckboxes(selectedRole.permissions)}
                      </div>
                      <button type="submit">Save role</button>
                    </form>
                  `}
              `
              : `<p class="muted">Select a role to inspect its permissions.</p>`}
          </div>
          <div class="club-panel">
            <h3>Staff assignments</h3>
            <p class="club-copy">Assign a staff member to one of the editable staff roles.</p>
            <div class="staff-role-list">
              ${state.staff.length === 0
                ? `<div class="settings-placeholder"><strong>No staff loaded</strong><p>Staff access will appear here once the gym has active staff members.</p></div>`
                : state.staff.map((staff) => `
                    <article class="staff-role-row">
                      <div>
                        <strong>${escapeHtml(`${staff.firstName} ${staff.lastName}`.trim())}</strong>
                        <p>${escapeHtml(staff.email)} · ${escapeHtml(staff.roleName)}</p>
                      </div>
                      <div class="staff-role-actions">
                        <select data-staff-role-select="${staff.userId}">
                          ${editableRoles
                            .map(
                              (role) =>
                                `<option value="${role.id}" ${role.id === staff.roleId ? "selected" : ""}>${escapeHtml(role.name)}</option>`
                            )
                            .join("")}
                        </select>
                        <button type="button" class="ghost-button" data-staff-role-assign="${staff.userId}">Assign</button>
                      </div>
                    </article>
                  `).join("")}
            </div>
          </div>
          <div class="club-panel">
            <h3>Create custom role</h3>
            <p class="club-copy">Build a new custom access role from the permission set below.</p>
            <form id="create-role-form" class="form-card">
              ${renderInput("newRoleName", "Role name")}
              <div class="permissions-grid">
                ${renderPermissionCheckboxes()}
              </div>
              <button type="submit">Create role</button>
            </form>
          </div>
        </div>
      `;
    case "featured_items":
      return `
        <div class="club-panel">
          <h3>Featured Items</h3>
          <p class="club-copy">Highlight products, offers, or services for the front desk and POS.</p>
          <div class="settings-placeholder">
            <strong>${state.plans.length} plans available</strong>
            <p>Use this section for pinned items and quick-sale highlights.</p>
          </div>
        </div>
      `;
    case "media":
      return `
        <div class="club-panel">
          <h3>Media</h3>
          <p class="club-copy">Upload logos, profile art, banners, and other visual assets.</p>
          <div class="settings-placeholder">
            <strong>Brand assets</strong>
            <p>Media uploads and asset libraries can be managed here.</p>
          </div>
        </div>
      `;
    case "resources":
      return `
        <div class="club-panel">
          <h3>Resources</h3>
          <p class="club-copy">Store internal files, SOPs, and support references.</p>
          <div class="settings-placeholder">
            <strong>Operational resources</strong>
            <p>Links, documents, and help content can live here.</p>
          </div>
        </div>
      `;
    case "promotions":
      return `
        <div class="club-panel">
          <h3>Promotions</h3>
          <p class="club-copy">Manage discounts, campaigns, and referral offers.</p>
          <div class="settings-placeholder">
            <strong>${state.plans.length} plan entries</strong>
            <p>Promotional rules and special offers can be organized here.</p>
          </div>
        </div>
      `;
    case "templates":
      return `
        <div class="club-panel">
          <h3>Templates</h3>
          <p class="club-copy">Build reusable templates for recurring gym operations.</p>
          <div class="settings-placeholder">
            <strong>Reusable templates</strong>
            <p>Templates for messages, workflows, and admin tasks can be added here.</p>
          </div>
        </div>
      `;
    case "customized_themes":
      return `
        <div class="club-panel">
          <h3>Customized Themes</h3>
          <p class="club-copy">Tune the UI style and brand feel for your workspace.</p>
          <div class="club-mini-nav">
            <button type="button" class="ghost-button${state.theme === "light" ? " active" : ""}" data-theme-choice="light">Light mode</button>
            <button type="button" class="ghost-button${state.theme === "dark" ? " active" : ""}" data-theme-choice="dark">Dark mode</button>
          </div>
        </div>
      `;
    case "tags":
      return `
        <div class="club-panel">
          <h3>Tags</h3>
          <p class="club-copy">Tag customers, leads, and staff for quick filtering.</p>
          <div class="settings-placeholder">
            <strong>Label system</strong>
            <p>Customer and staff tags can be created and reused here.</p>
          </div>
        </div>
      `;
    case "taxes":
      return `
        <div class="club-panel">
          <h3>Taxes</h3>
          <p class="club-copy">Set tax rates and billing rules for sales and memberships.</p>
          <div class="settings-placeholder">
            <strong>Tax configuration</strong>
            <p>Sales tax and billing rules can be controlled from this area.</p>
          </div>
        </div>
      `;
    case "forms":
      return `
        <div class="club-panel">
          <h3>Forms</h3>
          <p class="club-copy">Manage waivers, intake forms, and custom workflows.</p>
          <div class="settings-placeholder">
            <strong>Form builder</strong>
            <p>Digital forms and onboarding workflows can be organized here.</p>
          </div>
        </div>
      `;
    case "setup":
    default:
      return `
        <div class="settings-grid settings-grid-wide">
          <div class="club-panel">
            <h3>Appearance</h3>
            <p class="club-copy">Choose whether the dashboard should use a light or dark presentation.</p>
            <div class="club-mini-nav">
              <button type="button" class="ghost-button${state.theme === "light" ? " active" : ""}" data-theme-choice="light">Light mode</button>
              <button type="button" class="ghost-button${state.theme === "dark" ? " active" : ""}" data-theme-choice="dark">Dark mode</button>
            </div>
          </div>
          <div class="club-panel">
            <h3>Locations</h3>
            <p class="club-copy">Create at least one active location so check-ins can be submitted from the kiosk and sidebar.</p>
            <div class="stat-grid compact" style="margin-bottom: 14px;">
              <article class="mini-card">
                <span>Active</span>
                <strong>${activeLocations.length}</strong>
              </article>
              <article class="mini-card">
                <span>Total</span>
                <strong>${state.locations.length}</strong>
              </article>
            </div>
            <form id="create-location-form" class="form-card">
              <h4 style="margin:0;">Add location</h4>
              ${renderInput("name", "Location name")}
              <div class="two-up stacked-mobile">
                ${renderInput("line1", "Address line 1")}
                ${renderInput("line2", "Address line 2")}
              </div>
              <div class="three-up stacked-mobile">
                ${renderInput("city", "City")}
                ${renderInput("region", "State / Region")}
                ${renderInput("postalCode", "Postal code")}
              </div>
              <div class="two-up stacked-mobile">
                ${renderInput("country", "Country", "text", "US")}
                ${renderInput("timezone", "Timezone", "text", state.gym?.timezone ?? "America/New_York")}
              </div>
              ${renderInput("phone", "Phone", "tel")}
              <button type="submit">Create location</button>
            </form>
            <div class="club-note" style="margin-top: 16px;">
              <span class="club-note-label">Existing locations</span>
              <div class="club-location-list">
                ${state.locations.length === 0
                  ? `<p class="muted">No locations configured yet.</p>`
                  : state.locations.map((location) => `
                      <article class="club-location-row${location.id === state.selectedLocationId ? " selected" : ""}">
                        <div>
                          <strong>${location.name}</strong>
                          <p>${location.address.line1}, ${location.address.city}, ${location.address.region}</p>
                        </div>
                        <div class="club-location-actions">
                          <span>${location.status}</span>
                          <button type="button" class="ghost-button" data-location-select="${location.id}">Use for check-ins</button>
                        </div>
                      </article>
                    `).join("")}
              </div>
            </div>
          </div>
        </div>
      `;
  }
}

function renderModelTable(
  model: { columns: Array<{ key: string; label: string }>; rows: unknown[] },
  emptyMessage: string
) {
  if (model.rows.length === 0) {
    return `<div class="empty-state"><p>${escapeHtml(emptyMessage)}</p></div>`;
  }
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${model.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${model.rows.map((row) => {
            const record = row as Record<string, unknown>;
            return `
              <tr>
                ${model.columns
                  .map((column) => `<td>${formatCellValue(record[column.key])}</td>`)
                  .join("")}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSimpleRows(rows: unknown[], keys: string[], emptyMessage: string) {
  if (rows.length === 0) {
    return `<div class="empty-state"><p>${escapeHtml(emptyMessage)}</p></div>`;
  }
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${keys.map((key) => `<th>${escapeHtml(formatHeaderLabel(key))}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => {
            const record = row as Record<string, unknown>;
            return `<tr>${keys.map((key) => `<td>${formatCellValue(record[key])}</td>`).join("")}</tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function formatCellValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (Array.isArray(value)) {
    return escapeHtml(value.map(String).join(", "));
  }
  if (value instanceof Date) {
    return escapeHtml(value.toLocaleString());
  }
  if (typeof value === "object") {
    return escapeHtml(JSON.stringify(value));
  }
  return escapeHtml(String(value));
}

function formatHeaderLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatRoleLabel(name: string) {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function locationSelectOptions() {
  return state.locations
    .filter((location) => location.status === LocationStatus.Active)
    .map((location) => ({ value: location.id, label: location.name }));
}

function planSelectOptions() {
  return state.plans
    .filter((plan) => plan.status === PlanStatus.Active)
    .map((plan) => ({ value: plan.id, label: plan.name }));
}

function demoStripeAccount(): StripePaymentAccountView | undefined {
  if (!state.gym?.featureFlags.includes(FeatureFlag.PointOfSale)) {
    return undefined;
  }
  return {
    gymId: state.gym.id,
    accountId: `acct_${state.gym.id.slice(0, 8)}`,
    country: "US",
    defaultCurrency: "usd",
    businessName: state.gym.name,
    chargesEnabled: true,
    payoutsEnabled: true,
    onboardingComplete: true,
    requirementsDue: []
  };
}

function dashboardClassSessions(): ClassSessionView[] {
  return state.publicSchedule.map((session) => ({
    id: session.id,
    classTypeId: session.classTypeId,
    locationId: session.locationId,
    ...(session.trainerUserId ? { trainerUserId: session.trainerUserId } : {}),
    ...(session.roomName ? { roomName: session.roomName } : {}),
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    capacity: session.capacity,
    waitlistCapacity: session.waitlistCapacity,
    status: session.status
  }));
}

function classTypeViews() {
  const fromApi = state.classTypes.map((classType) => ({
    id: classType.id,
    name: classType.name,
    isPublic: classType.isPublic
  }));
  const known = new Set(fromApi.map((classType) => classType.id));
  const fromSchedule = dashboardClassSessions()
    .filter((session) => !known.has(session.classTypeId))
    .map((session) => ({
      id: session.classTypeId,
      name: session.classTypeId,
      isPublic: true
    }));
  return [...fromApi, ...fromSchedule];
}

function trainerViews() {
  return state.staff.map((staff) => ({
    id: staff.userId,
    fullName: `${staff.firstName} ${staff.lastName}`.trim() || staff.email
  }));
}

function selectedClassSession() {
  const sessions = dashboardClassSessions();
  return (
    sessions.find((session) => session.id === state.selectedClassSessionId) ??
    sessions[0]
  );
}

function bookingSessionView(session: ClassSessionView) {
  const classType = classTypeViews().find((item) => item.id === session.classTypeId);
  const location = state.locations.find((item) => item.id === session.locationId);
  return {
    id: session.id,
    className: classType?.name ?? session.classTypeId,
    locationName: location?.name ?? session.locationId,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    capacity: session.capacity,
    waitlistCapacity: session.waitlistCapacity
  };
}

function demoPersonalTrainingSessions() {
  const member = state.members.find((candidate) => candidate.status !== MemberStatus.Archived);
  const trainer = trainerViews()[0];
  if (!member || !trainer || !state.gym?.featureFlags.includes(FeatureFlag.PersonalTraining)) {
    return [];
  }
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  return [
    {
      id: "demo-personal-training-session",
      memberId: member.id,
      trainerUserId: trainer.id,
      packageName: "Intro PT package",
      locationName: state.locations[0]?.name ?? "Main floor",
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: PersonalTrainingSessionStatus.Scheduled
    }
  ];
}

function contractWaiverDocuments(): ContractWaiverDocumentView[] {
  const gymId = state.gym?.id ?? "demo-gym";
  const now = new Date().toISOString();
  return DEFAULT_SIGNATURE_REQUIREMENTS.map((label, index) => ({
    id: `document-${index + 1}`,
    gymId,
    title: label,
    type: label.toLowerCase().includes("agreement")
      ? ContractWaiverType.Contract
      : ContractWaiverType.Waiver,
    version: 1,
    requiresSignature: true,
    signedMemberCount: Object.values(state.memberDesk.signaturesByMemberId).filter((signatures) =>
      signatures.some((signature) => signature.label === label && signature.signedAt)
    ).length,
    createdAt: now,
    updatedAt: now,
    publishedAt: now
  }));
}

function enrichAccessDevice(device: AccessDeviceView): AccessDeviceView {
  const location = state.locations.find((item) => item.id === device.locationId);
  return {
    ...device,
    ...(location ? { locationName: location.name } : {})
  };
}

function enrichAccessRule(rule: AccessRuleView): AccessRuleView {
  const location = state.locations.find((item) => item.id === rule.locationId);
  const plan = rule.planId ? state.plans.find((item) => item.id === rule.planId) : undefined;
  return {
    ...rule,
    ...(location ? { locationName: location.name } : {}),
    ...(plan ? { planName: plan.name } : {})
  };
}

function enrichAccessEvent(event: AccessEventView): AccessEventView {
  const location = state.locations.find((item) => item.id === event.locationId);
  const device = state.accessDevices.find((item) => item.id === event.deviceId);
  const member = event.memberId ? state.members.find((item) => item.id === event.memberId) : undefined;
  return {
    ...event,
    ...(location ? { locationName: location.name } : {}),
    ...(device ? { deviceName: device.name } : {}),
    ...(member ? { memberName: `${member.firstName} ${member.lastName}`.trim() } : {})
  };
}

function selectedMember() {
  return state.members.find((member) => member.id === (state.editingMemberId ?? state.selectedMemberId));
}

function loadMemberDeskStore(): MemberDeskStore {
  try {
    const raw = localStorage.getItem(MEMBER_DESK_STORAGE_KEY);
    if (!raw) {
      return { alertsByMemberId: {}, signaturesByMemberId: {} };
    }
    const parsed = JSON.parse(raw) as Partial<MemberDeskStore>;
    return {
      alertsByMemberId: parsed.alertsByMemberId ?? {},
      signaturesByMemberId: parsed.signaturesByMemberId ?? {}
    };
  } catch {
    return { alertsByMemberId: {}, signaturesByMemberId: {} };
  }
}

function saveMemberDeskStore() {
  localStorage.setItem(MEMBER_DESK_STORAGE_KEY, JSON.stringify(state.memberDesk));
}

function getMemberAlerts(memberId: string) {
  return [...(state.memberDesk.alertsByMemberId[memberId] ?? [])].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
  );
}

function getMemberSignatures(memberId: string) {
  const existing = state.memberDesk.signaturesByMemberId[memberId];
  if (existing && existing.length > 0) {
    return existing;
  }
  const seeded = DEFAULT_SIGNATURE_REQUIREMENTS.map((label) => ({
    id: `${memberId}-${label.toLowerCase().replace(/\s+/g, "-")}`,
    label,
    required: true
  }));
  state.memberDesk = {
    ...state.memberDesk,
    signaturesByMemberId: {
      ...state.memberDesk.signaturesByMemberId,
      [memberId]: seeded
    }
  };
  saveMemberDeskStore();
  return seeded;
}

function addMemberAlert(memberId: string, title: string, message: string) {
  const alert: MemberDeskAlertRecord = {
    id: `${memberId}-${Date.now()}`,
    title,
    message,
    createdAt: new Date().toISOString()
  };
  state.memberDesk = {
    alertsByMemberId: {
      ...state.memberDesk.alertsByMemberId,
      [memberId]: [alert, ...(state.memberDesk.alertsByMemberId[memberId] ?? [])]
    },
    signaturesByMemberId: state.memberDesk.signaturesByMemberId
  };
  saveMemberDeskStore();
}

function resolveMemberAlert(memberId: string, alertId: string) {
  const alerts = state.memberDesk.alertsByMemberId[memberId] ?? [];
  state.memberDesk = {
    ...state.memberDesk,
    alertsByMemberId: {
      ...state.memberDesk.alertsByMemberId,
      [memberId]: alerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              resolvedAt: alert.resolvedAt ?? new Date().toISOString()
            }
          : alert
      )
    }
  };
  saveMemberDeskStore();
}

function toggleMemberSignature(memberId: string, signatureId: string) {
  const current = getMemberSignatures(memberId);
  const updated = current.map((signature) =>
    signature.id === signatureId
      ? {
          ...signature,
          signedAt: signature.signedAt ? undefined : new Date().toISOString()
        }
      : signature
  );
  state.memberDesk = {
    ...state.memberDesk,
    signaturesByMemberId: {
      ...state.memberDesk.signaturesByMemberId,
      [memberId]: updated
    }
  };
  saveMemberDeskStore();
}

function buildRailMemberSummary(member: MemberRecord) {
  const cache = state.memberCache[member.id];
  const memberships = Array.isArray(cache?.memberships) ? cache.memberships : [];
  const checkIns = Array.isArray(cache?.checkIns) ? cache.checkIns : [];
  const planId = memberships.find((membership) => membership.status === "active" || membership.status === "trialing")?.planId ?? memberships[0]?.planId;
  const planName = planId ? state.plans.find((plan) => plan.id === planId)?.name ?? "Unknown plan" : "No plan on file";
  const lastCheckIn = checkIns
    .slice()
    .sort((left, right) => Date.parse(right.checkedInAt) - Date.parse(left.checkedInAt))[0];
  const lastCheckInDate = lastCheckIn ? new Date(lastCheckIn.checkedInAt) : undefined;
  const daysSinceCheckIn = lastCheckInDate ? Math.floor((Date.now() - lastCheckInDate.getTime()) / 86400000) : undefined;
  const activeMembership = memberships.find((membership) => membership.status === "active" || membership.status === "trialing");
  const membershipEndsAt = activeMembership?.endsAt ? new Date(activeMembership.endsAt) : undefined;
  const daysUntilMembershipEnd = membershipEndsAt
    ? Math.ceil((membershipEndsAt.getTime() - Date.now()) / 86400000)
    : undefined;

  let issueLabel = "No issues";
  if (member.status === MemberStatus.Frozen || memberships.some((membership) => membership.status === "paused")) {
    issueLabel = "Freeze";
  } else if (member.status === MemberStatus.PastDue || memberships.some((membership) => membership.status === "past_due")) {
    issueLabel = "Payment overdue";
  } else if (member.status === MemberStatus.Expired || memberships.some((membership) => membership.status === "expired" || membership.status === "canceled")) {
    issueLabel = "Membership expired";
  } else if (daysUntilMembershipEnd !== undefined && daysUntilMembershipEnd <= 30 && daysUntilMembershipEnd >= 0) {
    issueLabel = `Renewal due in ${daysUntilMembershipEnd} days`;
  } else if (daysSinceCheckIn >= 60) {
    issueLabel = "No check-in for 60+ days";
  }

  if (issueLabel === "Payment overdue" && daysUntilMembershipEnd !== undefined && daysUntilMembershipEnd <= 30) {
    issueLabel = `Card issue, renew in ${daysUntilMembershipEnd} days`;
  }

  const lastCheckInLabel = lastCheckInDate
    ? `Last check-in ${formatRelativeDate(lastCheckInDate)}`
    : undefined;
  const todaysCheckIns = lastCheckInDate
    ? checkIns.filter((checkIn) => isSameDay(new Date(checkIn.checkedInAt), lastCheckInDate))
    : [];

  return {
    planLabel: `Plan: ${planName}`,
    lastCheckInLabel,
    issueLabel,
    duplicateLabel: todaysCheckIns.length > 1 ? "Already checked in" : undefined
  };
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatRelativeDate(value: Date) {
  const diffDays = Math.floor((Date.now() - value.getTime()) / 86400000);
  if (diffDays <= 0) {
    return `today at ${value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `yesterday at ${value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return value.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function customerInitials(member: MemberRecord) {
  return [member.firstName, member.lastName]
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "C";
}

function initialsFromDisplayName(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "C";
}

function renderCheckInView() {
  const member = selectedCheckInMember();
  return `
    <section class="club-panel checkin-sheet">
      ${member ? renderCheckInMemberSheet(member) : `
        <div class="empty-state checkin-sheet-empty">
          <p class="eyebrow">Check-In</p>
          <h3>Select a customer from the rail</h3>
          <p>When a member is checked in or selected from the right-side list, their front-desk sheet opens here.</p>
        </div>
      `}
      ${state.checkInDebug ? renderCheckInDebugPanel(state.checkInDebug) : ""}
      ${state.checkInResult ? renderCheckInResultCard(state.checkInResult) : ""}
    </section>
  `;
}

function selectedCheckInMember() {
  const selected = selectedMember();
  if (selected) {
    return selected;
  }
  if (state.checkInResult?.memberId) {
    return state.members.find((member) => member.id === state.checkInResult?.memberId);
  }
  return undefined;
}

function normalizeAccountKey(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizePhone(value?: string) {
  return value ? value.replace(/\D+/g, "") : "";
}

function buildCheckInMemberSummary(member: MemberRecord) {
  const cache = state.memberCache[member.id];
  const memberships = Array.isArray(cache?.memberships) ? cache.memberships : [];
  const activeMembership = memberships.find(
    (membership) => membership.status === MembershipStatus.Active || membership.status === MembershipStatus.Trialing
  );
  const primaryPlanId = activeMembership?.planId ?? memberships[0]?.planId;
  const primaryPlan = primaryPlanId ? state.plans.find((plan) => plan.id === primaryPlanId) : undefined;
  const amountDueCents = activeMembership ? 0 : primaryPlan?.priceCents ?? 0;
  const otherMembers = state.members.filter((candidate) => {
    if (candidate.id === member.id) {
      return false;
    }
    const sameEmail = normalizeAccountKey(candidate.email) && normalizeAccountKey(candidate.email) === normalizeAccountKey(member.email);
    const samePhone = normalizePhone(candidate.phone) && normalizePhone(candidate.phone) === normalizePhone(member.phone);
    return sameEmail || samePhone;
  });
  const paidMember = Boolean(activeMembership);
  const statusLabel = paidMember ? "Paid member" : member.status === MemberStatus.Lead ? "Lead" : "Not paid";
  const checkInSummary = buildRailMemberSummary(member);
  return {
    amountDueLabel: formatCurrency(amountDueCents),
    paidMember,
    statusLabel,
    planLabel: primaryPlan ? `Plan: ${primaryPlan.name}` : "Plan: No plan on file",
    barcodeLabel: member.barcode || "No barcode on file",
    memberships,
    primaryPlan,
    otherMembers,
    checkInSummary
  };
}

function renderLinkedMemberChips(summary: ReturnType<typeof buildCheckInMemberSummary>) {
  if (summary.otherMembers.length === 0) {
    return `<span class="club-note-label">No secondary members linked</span>`;
  }
  return `
    <div class="linked-member-chips">
      ${summary.otherMembers.map((other) => `
        <button type="button" class="club-note-label linked-member-chip" data-check-in-member-id="${other.id}">
          ${other.firstName} ${other.lastName}
        </button>
      `).join("")}
    </div>
  `;
}

function renderBillingHistory(member: MemberRecord) {
  const memberships = [...(state.memberCache[member.id]?.memberships ?? [])]
    .sort((left, right) => Date.parse(right.startsAt) - Date.parse(left.startsAt));
  if (memberships.length === 0) {
    return `<div class="settings-placeholder"><strong>No billing history</strong><p>Enroll this customer to begin tracking membership invoices.</p></div>`;
  }
  return `
    <div class="invoice-list">
      ${memberships.map((membership) => {
        const plan = state.plans.find((candidate) => candidate.id === membership.planId);
        const statusLabel = membership.status.replace(/_/g, " ");
        const amountLabel = plan ? formatCurrency(plan.priceCents) : "Unknown plan";
        const endsAtLabel = membership.endsAt ? `Ends ${new Date(membership.endsAt).toLocaleDateString()}` : "No end date";
        return `
          <article class="invoice-card">
            <div class="invoice-card-head">
              <strong>${plan?.name ?? "Membership"}</strong>
              <span>${statusLabel}</span>
            </div>
            <p>${amountLabel}</p>
            <small>Starts ${new Date(membership.startsAt).toLocaleDateString()} · ${endsAtLabel}</small>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderMemberAlerts(member: MemberRecord) {
  const alerts = getMemberAlerts(member.id);
  return `
    <div class="section-stack">
      <form id="member-alert-form" class="form-card compact-form">
        <input type="hidden" name="memberId" value="${member.id}" />
        ${renderInput("title", "Alert title", "text")}
        <label class="field">
          <span>Alert message</span>
          <textarea name="message" rows="3"></textarea>
        </label>
        <button type="submit">Add alert</button>
      </form>
      ${alerts.length === 0
        ? `<div class="settings-placeholder"><strong>No alerts</strong><p>Create front-desk alerts for this member here.</p></div>`
        : `<div class="alert-list">
            ${alerts.map((alert) => `
              <article class="alert-card${alert.resolvedAt ? " resolved" : ""}">
                <div class="card-head">
                  <strong>${escapeHtml(alert.title)}</strong>
                  <span>${new Date(alert.createdAt).toLocaleDateString()}</span>
                </div>
                <p>${escapeHtml(alert.message)}</p>
                ${alert.resolvedAt
                  ? `<small>Resolved ${new Date(alert.resolvedAt).toLocaleDateString()}</small>`
                  : `<small>Open alert</small><button type="button" class="ghost-button" data-member-alert-resolve="${alert.id}" data-member-id="${member.id}">Resolve</button>`}
              </article>
            `).join("")}
          </div>`}
    </div>
  `;
}

function renderMemberSignatures(member: MemberRecord) {
  const signatures = getMemberSignatures(member.id);
  return `
    <div class="signature-list">
      ${signatures.map((signature) => `
        <button
          type="button"
          class="signature-row${signature.signedAt ? " signed" : ""}"
          data-signature-toggle="${signature.id}"
          data-member-id="${member.id}"
        >
          <span>
            <strong>${escapeHtml(signature.label)}</strong>
            <small>${signature.required ? "Required" : "Optional"}</small>
          </span>
          <span class="signature-state">${signature.signedAt ? `Signed ${new Date(signature.signedAt).toLocaleDateString()}` : "Needs signature"}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderMemberContacts(member: MemberRecord, summary: ReturnType<typeof buildCheckInMemberSummary>) {
  const emergencyContact = member.emergencyContact;
  return `
    <div class="contact-stack">
      <article class="mini-card">
        <strong>Primary contact</strong>
        <p style="margin:0.5rem 0 0;color:var(--muted);">${member.email || "No email"} · ${member.phone || "No phone"}</p>
      </article>
      <article class="mini-card">
        <strong>Emergency contact</strong>
        ${emergencyContact
          ? `<p style="margin:0.5rem 0 0;color:var(--muted);">${escapeHtml(emergencyContact.name)} · ${escapeHtml(emergencyContact.phone)}${emergencyContact.relationship ? ` · ${escapeHtml(emergencyContact.relationship)}` : ""}</p>`
          : `<p style="margin:0.5rem 0 0;color:var(--muted);">No emergency contact on file.</p>`}
      </article>
      <article class="mini-card">
        <strong>Account links</strong>
        <div class="linked-member-stack">
          ${summary.otherMembers.length === 0
            ? `<span class="muted">No secondary members linked.</span>`
            : summary.otherMembers.map((other) => `<button type="button" class="linked-member-card" data-check-in-member-id="${other.id}">${other.firstName} ${other.lastName}</button>`).join("")}
        </div>
      </article>
    </div>
  `;
}

function renderCheckInMemberSheet(member: MemberRecord) {
  const summary = buildCheckInMemberSummary(member);
  const avatarMarkup = member.profileImageUrl
    ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(`${member.firstName} ${member.lastName}`.trim())}" />`
    : `<span>${customerInitials(member)}</span>`;
  const planOptions = state.plans
    .filter((plan) => plan.status !== "archived")
    .map((plan) => ({ value: plan.id, label: `${plan.name} · ${formatCurrency(plan.priceCents)}` }));
  return `
    <div class="checkin-sheet-grid">
      <div class="checkin-sheet-hero">
        <div class="checkin-sheet-avatar">${avatarMarkup}</div>
        <div class="checkin-sheet-copy">
          <p class="eyebrow">Check-In Member</p>
          <h2>${member.firstName} ${member.lastName}</h2>
          <div class="checkin-sheet-badges">
            <span class="club-note-label">${summary.planLabel}</span>
            <span class="club-note-label">${summary.statusLabel}</span>
            ${summary.paidMember ? `<span class="checkin-paid-tag">Paid member</span>` : `<span class="checkin-due-tag">Payment needed</span>`}
          </div>
          <div class="checkin-sheet-meta">
            <span><strong>Amount due:</strong> ${summary.amountDueLabel}</span>
            <span><strong>Last check-in:</strong> ${summary.checkInSummary.lastCheckInLabel ?? "No check-in yet"}</span>
            <span><strong>Check-in status:</strong> ${summary.checkInSummary.issueLabel}</span>
          </div>
          ${renderLinkedMemberChips(summary)}
          <div class="checkin-sheet-actions">
            <button type="button" class="ghost-button" data-sheet-view="pos" data-preserve-context="true">POS</button>
            <button type="button" class="ghost-button" data-sheet-view="customer_profile" data-preserve-context="true">Profile</button>
            <button type="button" class="ghost-button" data-sheet-view="customer_edit" data-preserve-context="true">Notes</button>
            <button type="button" class="ghost-button" data-sheet-view="customer_edit" data-preserve-context="true">Create alert</button>
          </div>
        </div>
      </div>

      <div class="checkin-sheet-stats">
        <article class="mini-card">
          <span>Amount due</span>
          <strong>${summary.amountDueLabel}</strong>
        </article>
        <article class="mini-card">
          <span>Barcode</span>
          <strong>${summary.barcodeLabel}</strong>
        </article>
        <article class="mini-card">
          <span>Memberships</span>
          <strong>${summary.memberships.length}</strong>
        </article>
        <article class="mini-card">
          <span>Other members</span>
          <strong>${summary.otherMembers.length}</strong>
        </article>
      </div>

      <div class="checkin-sheet-section">
        <div class="card-head">
          <h3>Enrollment</h3>
          <span>${state.plans.length} plans</span>
        </div>
        ${planOptions.length === 0
          ? `<div class="settings-placeholder"><strong>No plans loaded</strong><p>Create a plan before trying to enroll this member.</p></div>`
          : `
            <form id="check-in-enroll-form" class="form-card">
              <input type="hidden" name="memberId" value="${member.id}" />
              ${renderSelect("planId", "Plan", planOptions, summary.primaryPlan?.id ?? planOptions[0]?.value ?? "")}
              <label class="field">
                <span>Membership status</span>
                <input name="status" type="text" value="active" disabled />
              </label>
              <button type="submit">Enroll member</button>
            </form>
          `}
      </div>

      <div class="checkin-sheet-section">
        <div class="card-head">
          <h3>Notes</h3>
          <button type="button" class="ghost-button" data-dashboard-view="customer_edit" data-preserve-context="true">Edit notes</button>
        </div>
        ${member.notes
          ? `<div class="club-note"><p>${escapeHtml(member.notes)}</p></div>`
          : `<div class="settings-placeholder"><strong>No notes</strong><p>Add front-desk notes from the customer editor.</p></div>`}
      </div>

      <div class="checkin-sheet-section">
        <div class="card-head">
          <h3>Billing history / Invoices</h3>
          <span>${summary.memberships.length}</span>
        </div>
        ${renderBillingHistory(member)}
      </div>

      <div class="checkin-sheet-section">
        <div class="card-head">
          <h3>Contacts and signatures</h3>
          <span>${summary.otherMembers.length ? `${summary.otherMembers.length} linked` : "0 linked"}</span>
        </div>
        ${renderMemberContacts(member, summary)}
        ${renderMemberSignatures(member)}
      </div>

      <div class="checkin-sheet-section">
        <div class="card-head">
          <h3>Alerts</h3>
          <button type="button" class="ghost-button" data-dashboard-view="customer_profile" data-preserve-context="true">Open profile</button>
        </div>
        ${renderMemberAlerts(member)}
      </div>
    </div>
  `;
}

function renderCheckInResultCard(result: CheckInRecord) {
  const allowed = result.status === "allowed";
  const member = result.memberId ? state.members.find((candidate) => candidate.id === result.memberId) : undefined;
  const displayName = result.memberName ?? member?.firstName ?? "Customer";
  const avatarMarkup = member?.profileImageUrl
    ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(displayName)}" />`
    : `<span>${initialsFromDisplayName(displayName)}</span>`;
  return `
    <div class="checkin-result-card ${allowed ? "allowed" : "blocked"}">
      <div class="checkin-result-avatar">${avatarMarkup}</div>
      <div class="checkin-result-copy">
        <strong>${displayName}</strong>
        <span>${allowed ? "Entry allowed" : "Entry blocked"}</span>
        ${result.deniedReason ? `<p>${result.deniedReason}</p>` : ""}
      </div>
    </div>
  `;
}

function renderCheckInReviewModal(review: NonNullable<AppState["checkInReview"]>) {
  const allowed = review.status === "allowed";
  const displayName = review.memberName;
  return `
    <div class="checkin-modal-backdrop">
      <div class="checkin-modal ${allowed ? "allowed" : "blocked"}">
        <div class="checkin-modal-avatar">
          ${review.profileImageUrl
            ? `<img src="${escapeAttribute(review.profileImageUrl)}" alt="${escapeAttribute(displayName)}" />`
            : `<span>${initialsFromDisplayName(displayName)}</span>`}
        </div>
        <div class="checkin-modal-copy">
          <p class="eyebrow">Check-in review</p>
          <h3>${displayName}</h3>
          <p>${allowed ? "This entry was allowed." : review.deniedReason ?? "This entry was blocked."}</p>
        </div>
        <div class="checkin-modal-actions">
          ${allowed
            ? `<button type="button" class="ghost-button" data-checkin-review-close>Close</button>`
            : `
              <button type="button" class="ghost-button" data-checkin-review-deny>Keep denied</button>
              <button type="button" class="module-nav-button active" data-checkin-review-allow>Allow entry</button>
            `}
        </div>
      </div>
    </div>
  `;
}

function enrichCheckInRecord(
  record: CheckInRecord,
  memberName: string,
  locationId: string,
  locationName?: string
): CheckInRecord {
  return {
    ...record,
    memberName: record.memberName ?? memberName,
    locationId: record.locationId || locationId,
    locationName: record.locationName ?? locationName
  };
}

function pushCheckInToMemberCache(memberId: string, checkIn: CheckInRecord) {
  const current = state.memberCache[memberId];
  if (!current) {
    return;
  }
  state.memberCache = {
    ...state.memberCache,
    [memberId]: {
      memberships: Array.isArray(current.memberships) ? current.memberships : [],
      checkIns: [checkIn, ...(Array.isArray(current.checkIns) ? current.checkIns : []).filter((entry) => entry.id !== checkIn.id)]
    }
  };
}

function removeCheckInLocally(checkInId: string, record?: CheckInRecord) {
  state.checkInHistory = state.checkInHistory.filter((entry) => entry.id !== checkInId);
  if (record?.memberId && state.memberCache[record.memberId]) {
    state.memberCache = {
      ...state.memberCache,
      [record.memberId]: {
        ...state.memberCache[record.memberId],
        checkIns: state.memberCache[record.memberId].checkIns.filter((entry) => entry.id !== checkInId)
      }
    };
  }
  if (state.checkInResult?.id === checkInId) {
    state.checkInResult = undefined;
  }
  if (record?.memberId && (state.checkInReview?.payload.memberId === record.memberId || state.checkInReview?.memberId === record.memberId)) {
    state.checkInReview = undefined;
  }
  state.checkInDebug = undefined;
}

function mergeCheckInHistory(records: CheckInRecord[]) {
  const unique = new Map<string, CheckInRecord>();
  for (const record of records) {
    if (!unique.has(record.id)) {
      unique.set(record.id, record);
    }
  }
  return [...unique.values()].sort((left, right) => Date.parse(right.checkedInAt) - Date.parse(left.checkedInAt));
}

function renderCheckInDebugPanel(debug: { title: string; message: string; details: string[] }) {
  return `
    <div class="checkin-debug">
      <strong>${debug.title}</strong>
      <p>${debug.message}</p>
      ${debug.details.length > 0 ? `<ul>${debug.details.map((detail) => `<li>${detail}</li>`).join("")}</ul>` : ""}
    </div>
  `;
}

function renderCheckInHistoryView() {
  const history = state.checkInHistory.slice(0, 5);
  return `
    <section class="data-card">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Check-In History</h3>
        <span>${state.checkInHistory.length} records</span>
      </div>
      ${history.length === 0
        ? `<p class="muted">No check-in records yet.</p>`
        : `<div class="table-wrap"><table>
          <thead><tr><th>Time</th><th>Member</th><th>Status</th><th>Method</th><th>Location</th></tr></thead>
          <tbody>${history.map(c => `
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
  app.querySelectorAll<HTMLElement>("[data-dashboard-view]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const view = btn.dataset.dashboardView as AppState["dashboardView"];
      if (view) {
        navigateDashboardView(view, { preserveContext: btn.dataset.preserveContext === "true" });
      }
    });
  });

  app.querySelectorAll<HTMLElement>("[data-settings-section]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const section = button.dataset.settingsSection as SettingsSectionKey | undefined;
      if (!section) {
        return;
      }
      navigateSettingsSection(section);
    });
  });

  app.querySelectorAll<HTMLElement>("[data-sheet-view]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const view = button.dataset.sheetView as AppState["dashboardView"] | undefined;
      if (!view) return;
      navigateDashboardView(view, { preserveContext: button.dataset.preserveContext === "true" });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-role-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const roleId = button.dataset.roleSelect;
      if (!roleId) return;
      state.selectedRoleId = roleId;
      render();
    });
  });

  // Customer actions
  app.querySelectorAll<HTMLButtonElement>("[data-customer-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingMemberId = button.dataset.memberId;
      navigateDashboardView("customer_edit", { preserveContext: true });
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-action='view-member']").forEach((el) => {
    el.addEventListener("click", () => {
      state.selectedMemberId = el.dataset.memberId;
      navigateDashboardView(el.dataset.viewTarget === "check_in" ? "check_in" : "customer_profile", { preserveContext: true });
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-check-in-member-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMemberId = button.dataset.checkInMemberId;
      navigateDashboardView("check_in", { preserveContext: true });
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-check-in-record-id]").forEach((button) => {
    button.addEventListener("contextmenu", async (event) => {
      event.preventDefault();
      const checkInId = button.dataset.checkInRecordId;
      if (!state.gym || !checkInId) return;
      const record = state.checkInHistory.find((entry) => entry.id === checkInId);
      const label = record?.memberName ?? "this check-in";
      if (!window.confirm(`Remove ${label} from the check-in list?`)) {
        return;
      }
      try {
        await client.deleteCheckIn(state.gym.id, checkInId);
        removeCheckInLocally(checkInId, record);
        setBanner("success", `Removed ${label} from check-ins.`);
        render();
      } catch (error) {
        if (error instanceof ApiError && error.status === 404 && error.code === "not_found") {
          removeCheckInLocally(checkInId, record);
          setBanner("info", `Check-in for ${label} was already removed on the server, so it was cleared from the screen.`);
          await refreshDashboard();
          render();
          return;
        }
        const debug = buildCheckInDebug(error, label, state.selectedLocationId || state.locations[0]?.id || "", record ? state.members.find((member) => member.id === record.memberId) : undefined);
        state.checkInDebug = debug;
        setBanner("error", debug.message);
        render();
      }
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.themeChoice as ThemeName | undefined;
      if (!choice) return;
      state.theme = choice;
      localStorage.setItem(THEME_STORAGE_KEY, choice);
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-location-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const locationId = button.dataset.locationSelect;
    if (!locationId) return;
    state.selectedLocationId = locationId;
    render();
  });
  });

  app.querySelectorAll<HTMLSelectElement>("[data-class-session-select]").forEach((select) => {
    select.addEventListener("change", async () => {
      state.selectedClassSessionId = select.value;
      await refreshSelectedClassBookings();
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-staff-role-assign]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) return;
      const userId = button.dataset.staffRoleAssign;
      const roleSelect = userId ? app.querySelector<HTMLSelectElement>(`[data-staff-role-select="${userId}"]`) : null;
      const roleId = roleSelect?.value;
      if (!userId || !roleId) return;
      try {
        await client.assignStaffRole(state.gym.id, { userId, roleId });
        setBanner("success", "Staff role updated.");
        await refreshDashboard();
      } catch (error) {
        setBanner("error", describeError(error));
      }
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-checkin-review-close]").forEach((button) => {
    button.addEventListener("click", () => {
      state.checkInReview = undefined;
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-checkin-review-deny]").forEach((button) => {
    button.addEventListener("click", () => {
      state.checkInReview = undefined;
      setBanner("info", "Entry remains denied.");
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-checkin-review-allow]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym || !state.checkInReview) return;
      const review = state.checkInReview;
      try {
        const result = await client.createCheckIn(state.gym.id, {
          ...review.payload,
          overrideEligibility: true,
          overrideReason: "Staff approved entry."
        }) as CheckInRecord;
        const approveName = review.memberName;
        const locationName = state.locations.find((location) => location.id === review.locationId)?.name;
        const enrichedResult = enrichCheckInRecord(result, approveName, review.locationId, locationName);
        state.checkInResult = enrichedResult;
        state.selectedMemberId = review.memberId ?? enrichedResult.memberId ?? state.selectedMemberId;
        state.checkInHistory = [enrichedResult, ...state.checkInHistory.filter((entry) => entry.id !== enrichedResult.id)];
        if (review.memberId) {
          pushCheckInToMemberCache(review.memberId, enrichedResult);
        }
        state.checkInReview = undefined;
        navigateDashboardView("check_in", { preserveContext: true });
        setBanner("success", `Entry approved for ${approveName}.`);
        render();
      } catch (error) {
        const debug = buildCheckInDebug(error, review.payload.barcode ?? review.memberName, review.locationId, review.memberId ? state.members.find((member) => member.id === review.memberId) : undefined);
        state.checkInDebug = debug;
        setBanner("error", debug.message);
        render();
      }
    });
  });

  bindForm("check-in-enroll-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const memberId = data.memberId;
    const planId = data.planId;
    if (!memberId || !planId) {
      throw new Error("Choose a member and a plan before enrolling.");
    }
    await client.assignMemberMembership(state.gym.id, memberId, {
      planId,
      status: MembershipStatus.Active,
      startsAt: new Date().toISOString()
    });
    state.selectedMemberId = memberId;
    navigateDashboardView("check_in", { preserveContext: true });
    await refreshDashboard();
  });

  bindForm("create-role-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const permissions = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="permissions"]:checked')).map(
      (input) => input.value
    );
    if (permissions.length === 0) {
      throw new Error("Choose at least one permission for the new role.");
    }
    await client.createCustomRole(state.gym.id, {
      name: data.newRoleName,
      permissions
    });
    setBanner("success", "Custom role created.");
    await refreshDashboard();
  });

  bindForm("edit-role-form", async (form) => {
    if (!state.gym || !state.selectedRoleId) {
      return;
    }
    const data = formData(form);
    const permissions = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="permissions"]:checked')).map(
      (input) => input.value
    );
    if (permissions.length === 0) {
      throw new Error("Choose at least one permission for the role.");
    }
    await client.updateCustomRole(state.gym.id, state.selectedRoleId, {
      name: data.roleName,
      permissions
    });
    setBanner("success", "Role updated.");
    await refreshDashboard();
  });

  // Check-in forms
  const handleCheckIn = async (form: HTMLFormElement) => {
    if (!state.gym) return;
    const data = formData(form);
    const lookup = data.barcode.trim();
    if (!lookup) return;
    state.checkInDebug = undefined;
    const locationId = state.selectedLocationId || state.locations[0]?.id;
    if (!locationId) {
      const debug = {
        title: "Check-in blocked",
        message: "No active location is available for this gym, so the app cannot submit a check-in.",
        details: [
          `Gym: ${state.gym.name}`,
          "Create or reactivate a location before trying again.",
          "If you are the admin, open the Locations area and make one active."
        ]
      };
      state.checkInDebug = debug;
      setBanner("error", debug.message);
      return;
    }
    const normalizedLookup = lookup.toLowerCase();
    const memberMatch =
      state.members.find((member) => member.barcode?.toLowerCase() === normalizedLookup) ??
      state.members.find((member) => member.lastName.toLowerCase() === normalizedLookup) ??
      state.members.find((member) => `${member.firstName} ${member.lastName}`.trim().toLowerCase() === normalizedLookup) ??
      state.members.find((member) => `${member.firstName} ${member.lastName}`.trim().toLowerCase().includes(normalizedLookup)) ??
      state.members.find((member) => member.lastName.toLowerCase().includes(normalizedLookup));
    try {
      const payload: CheckInPayload = memberMatch
        ? { memberId: memberMatch.id, locationId, method: CheckInMethod.Barcode }
        : { barcode: lookup, locationId, method: CheckInMethod.Barcode };
      const result = await client.createCheckIn(state.gym.id, {
        ...payload
      }) as CheckInRecord;
      const locationName = state.locations.find((location) => location.id === locationId)?.name;
      const enrichedResult = enrichCheckInRecord(
        result,
        result.memberName ?? (memberMatch ? `${memberMatch.firstName} ${memberMatch.lastName}`.trim() : lookup),
        locationId,
        locationName
      );
      state.checkInResult = enrichedResult;
      state.selectedMemberId = enrichedResult.memberId ?? memberMatch?.id ?? state.selectedMemberId;
      state.checkInHistory = [enrichedResult, ...state.checkInHistory.filter((entry) => entry.id !== enrichedResult.id)];
      if (enrichedResult.memberId) {
        pushCheckInToMemberCache(enrichedResult.memberId, enrichedResult);
      }
      state.checkInBarcode = "";
      state.checkInDebug = undefined;
      const displayName =
        enrichedResult.memberName ??
        (memberMatch ? `${memberMatch.firstName} ${memberMatch.lastName}`.trim() : lookup);
      state.checkInReview = enrichedResult.status === "denied"
        ? {
            memberId: memberMatch?.id ?? result.memberId,
            memberName: displayName,
            profileImageUrl: memberMatch?.profileImageUrl,
            status: enrichedResult.status,
            deniedReason: enrichedResult.deniedReason,
            locationId,
            payload
          }
        : undefined;
      navigateDashboardView("check_in", { preserveContext: true });
      setBanner(
        enrichedResult.status === "allowed" ? "success" : "error",
        enrichedResult.status === "allowed"
          ? `Checked in ${displayName}.`
          : `Check-in denied for ${displayName}${enrichedResult.deniedReason ? `: ${enrichedResult.deniedReason}` : "."} Review the popup to allow entry.`
      );
      render();
    } catch (error) {
      const debug = buildCheckInDebug(error, lookup, locationId, memberMatch);
      state.checkInDebug = debug;
      setBanner("error", debug.message);
      render();
    }
  };
  bindForm("check-in-form", handleCheckIn);
  bindForm("quick-check-in-form", handleCheckIn);

  bindForm("update-member-form", async (form) => {
    const data = formData(form);
    if (!state.gym) return;
    const memberId = data.memberId;
    if (!memberId) return;
    await client.updateMember(state.gym.id, memberId, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      barcode: data.barcode || undefined,
      profileImageUrl: data.profileImageUrl || "",
      status: data.status as MemberStatus,
      tagNames: splitTags(data.tagNames),
      emergencyContact:
        data.emergencyContactName || data.emergencyContactPhone
          ? {
              name: data.emergencyContactName || "",
              phone: data.emergencyContactPhone || "",
              ...(data.emergencyContactRelationship
                ? { relationship: data.emergencyContactRelationship }
                : {})
            }
          : undefined,
      notes: data.notes || undefined
    });
    state.selectedMemberId = memberId;
    state.editingMemberId = memberId;
    await refreshDashboard();
    navigateDashboardView("customer_profile", { preserveContext: true });
  });

  bindForm("member-barcode-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const memberId = data.memberId;
    if (!memberId) {
      return;
    }
    await client.updateMember(state.gym.id, memberId, {
      barcode: data.barcode || undefined
    });
    await refreshDashboard();
    navigateDashboardView("customer_profile", { preserveContext: true });
  });

  bindForm("member-add-membership-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const memberId = data.memberId;
    const planId = data.planId;
    if (!memberId || !planId) {
      throw new Error("Choose a customer and plan before adding membership.");
    }
    await client.assignMemberMembership(state.gym.id, memberId, {
      planId,
      status: (data.status as MembershipStatus) || MembershipStatus.Active,
      startsAt: new Date().toISOString()
    });
    await refreshDashboard();
    navigateDashboardView("customer_profile", { preserveContext: true });
  });

  bindForm("member-alert-form", async (form) => {
    const data = formData(form);
    const memberId = data.memberId;
    if (!memberId) {
      return;
    }
    const title = data.title.trim();
    const message = data.message.trim();
    if (!title || !message) {
      throw new Error("Enter both an alert title and message.");
    }
    addMemberAlert(memberId, title, message);
    navigateDashboardView("customer_profile", { preserveContext: true });
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-signature-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const memberId = button.dataset.memberId;
      const signatureId = button.dataset.signatureToggle;
      if (!memberId || !signatureId) {
        return;
      }
      toggleMemberSignature(memberId, signatureId);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-member-alert-resolve]").forEach((button) => {
    button.addEventListener("click", () => {
      const memberId = button.dataset.memberId;
      const alertId = button.dataset.memberAlertResolve;
      if (!memberId || !alertId) {
        return;
      }
      resolveMemberAlert(memberId, alertId);
      render();
    });
  });

  bindForm("platform-create-gym-form", async (form) => {
    const data = registerInputFromForm(form, { requireGymName: true });
    if (!data) {
      return;
    }
    try {
      const response = (await client.register(data)) as AuthResponse;
      setBanner("success", "Gym and owner created successfully.");
      if (response.gym?.slug) {
        state.publicSlug = response.gym.slug;
        localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, state.publicSlug);
      }
      await refreshPlatformGymDirectory();
      if (state.publicSlug) {
        await refreshPublic(state.publicSlug, false);
      }
      await refreshDashboard();
    } catch (error) {
      setBanner("error", describeError(error));
      render();
    }
  });

  bindForm("register-form", async (form) => {
    const data = registerInputFromForm(form, { requireGymName: true });
    if (!data) {
      return;
    }
    const response = (await client.register(data)) as AuthResponse;
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
      throw new Error("This account requires two-factor login, which is not wired into the browser app yet.");
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
      autoRenew: true,
      isPublic: true
    });
    setBanner("success", "Public plan created.");
    await refreshDashboard();
  });

  bindForm("create-location-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const name = data.name.trim();
    const line1 = data.line1.trim();
    const city = data.city.trim();
    const region = data.region.trim();
    const postalCode = data.postalCode.trim();
    const country = (data.country.trim() || "US").toUpperCase();
    const timezone = data.timezone.trim() || state.gym.timezone || "America/New_York";
    if (!name || !line1 || !city || !region || !postalCode || !timezone) {
      throw new Error("Location name, address, and timezone are required.");
    }
    await client.createLocation(state.gym.id, {
      name,
      address: {
        line1,
        line2: data.line2.trim() || undefined,
        city,
        region,
        postalCode,
        country
      },
      timezone,
      phone: data.phone.trim() || undefined,
      operatingHours: {}
    });
    setBanner("success", "Location created.");
    await refreshDashboard();
    navigateDashboardView(state.dashboardView === "locations" ? "locations" : "settings", { preserveContext: true });
  });

  bindForm("create-access-device-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const name = data.name.trim();
    const locationId = data.locationId || state.selectedLocationId || state.locations[0]?.id;
    if (!name || !locationId) {
      throw new Error("Device name and location are required.");
    }
    const response = (await client.createAccessDevice(state.gym.id, {
      name,
      locationId,
      deviceType: (data.deviceType as AccessDeviceType) || AccessDeviceType.DoorController
    })) as { device?: AccessDeviceView; apiKey?: string };
    setBanner(
      "success",
      response.apiKey
        ? `Access device registered. New API key: ${response.apiKey}`
        : "Access device registered."
    );
    await refreshDashboard();
    navigateDashboardView("access_control", { preserveContext: true });
  });

  bindForm("create-access-rule-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const name = data.name.trim();
    const locationId = data.locationId || state.selectedLocationId || state.locations[0]?.id;
    const allowAllActiveMembers = Boolean(
      form.querySelector<HTMLInputElement>('input[name="allowAllActiveMembers"]')?.checked
    );
    const planId = data.planId || undefined;
    if (!name || !locationId) {
      throw new Error("Rule name and location are required.");
    }
    await client.createAccessRule(state.gym.id, {
      name,
      locationId,
      allowAllActiveMembers,
      ...(planId && !allowAllActiveMembers ? { planId } : {})
    });
    setBanner("success", "Access rule created.");
    await refreshDashboard();
    navigateDashboardView("access_control", { preserveContext: true });
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
      status: (data.status as MemberStatus) || MemberStatus.Active,
      barcode: data.barcode || undefined,
      profileImageUrl: data.profileImageUrl || undefined,
      tagNames: []
    });
    setBanner("success", "Customer created.");
    await refreshDashboard();
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
    try {
      await handler(form);
    } catch (error) {
      setBanner("error", describeError(error));
      render();
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
  state.roles = [];
  state.plans = [];
  state.classTypes = [];
  state.classBookings = [];
  state.accessDevices = [];
  state.accessRules = [];
  state.accessEvents = [];
  state.memberCache = {};
  state.checkInDebug = undefined;
  state.checkInReview = undefined;
  state.selectedRoleId = "";
}

function setBanner(tone: BannerTone, text: string) {
  state.banner = { tone, text };
}

function readRoute(): { view: ViewName; dashboardView: AppState["dashboardView"]; settingsSection?: SettingsSectionKey } {
  const segments = getHashSegments();
  if (segments[0] === "public") {
    return { view: "public", dashboardView: "home" };
  }
  if (segments[0] === "dashboard") {
    return { view: "dashboard", ...parseDashboardRoute(segments.slice(1)) };
  }
  return { view: "dashboard", dashboardView: "home" };
}

function syncRouteFromHash() {
  const route = readRoute();
  state.view = route.view;
  if (route.view === "dashboard") {
    const previousTopLevel = dashboardTopLevelView(state.dashboardView);
    const nextTopLevel = dashboardTopLevelView(route.dashboardView);
    if (previousTopLevel !== nextTopLevel) {
      resetDashboardTransientState();
    }
    state.dashboardView = route.dashboardView;
    if (route.dashboardView === "settings") {
      state.settingsSection = route.settingsSection ?? "setup";
    }
  }
}

function getHashSegments() {
  return window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
}

function parseDashboardRoute(segments: string[]) {
  const [section, subsection] = segments;
  switch (section) {
    case undefined:
    case "":
    case "home":
      return { dashboardView: "home" as const };
    case "check-in":
      return { dashboardView: subsection === "history" ? "check_in_history" as const : "check_in" as const };
    case "customers":
      if (subsection === "profile") {
        return { dashboardView: "customer_profile" as const };
      }
      if (subsection === "edit") {
        return { dashboardView: "customer_edit" as const };
      }
      return { dashboardView: "customers" as const };
    case "leads":
      return { dashboardView: "leads" as const };
    case "staff":
      return { dashboardView: "staff" as const };
    case "point-of-sale":
    case "pos":
      return { dashboardView: "pos" as const };
    case "plans":
    case "membership-plans":
      return { dashboardView: "plans" as const };
    case "locations":
      return { dashboardView: "locations" as const };
    case "classes":
      return { dashboardView: "classes" as const };
    case "bookings":
      return { dashboardView: "bookings" as const };
    case "personal-training":
    case "training":
      return { dashboardView: "personal_training" as const };
    case "access-control":
    case "access":
      return { dashboardView: "access_control" as const };
    case "contracts":
    case "forms":
      return { dashboardView: "contracts" as const };
    case "member-portal":
    case "portal":
      return { dashboardView: "member_portal" as const };
    case "marketing":
      return { dashboardView: "marketing" as const };
    case "reporting":
    case "reports":
      return { dashboardView: "reports" as const };
    case "settings":
      return {
        dashboardView: "settings" as const,
        settingsSection: parseSettingsSectionRoute(subsection)
      };
    default:
      return { dashboardView: "home" as const };
  }
}

function parseSettingsSectionRoute(section?: string): SettingsSectionKey | undefined {
  switch (section) {
    case "setup":
      return "setup";
    case "company-information":
      return "company_information";
    case "roles-and-staff":
      return "roles_staff";
    case "featured-items":
      return "featured_items";
    case "media":
      return "media";
    case "resources":
      return "resources";
    case "promotions":
      return "promotions";
    case "templates":
      return "templates";
    case "customized-themes":
      return "customized_themes";
    case "tags":
      return "tags";
    case "taxes":
      return "taxes";
    case "forms":
      return "forms";
    default:
      return undefined;
  }
}

function dashboardTopLevelView(view: AppState["dashboardView"]) {
  switch (view) {
    case "customer_profile":
    case "customer_edit":
      return "customers";
    case "check_in_history":
      return "check_in";
    default:
      return view;
  }
}

function dashboardViewToHash(view: AppState["dashboardView"]) {
  switch (view) {
    case "home":
      return "#/dashboard/home";
    case "check_in":
      return "#/dashboard/check-in";
    case "check_in_history":
      return "#/dashboard/check-in/history";
    case "customers":
      return "#/dashboard/customers";
    case "customer_profile":
      return "#/dashboard/customers/profile";
    case "customer_edit":
      return "#/dashboard/customers/edit";
    case "leads":
      return "#/dashboard/leads";
    case "staff":
      return "#/dashboard/staff";
    case "pos":
      return "#/dashboard/point-of-sale";
    case "plans":
      return "#/dashboard/plans";
    case "locations":
      return "#/dashboard/locations";
    case "classes":
      return "#/dashboard/classes";
    case "bookings":
      return "#/dashboard/bookings";
    case "personal_training":
      return "#/dashboard/personal-training";
    case "access_control":
      return "#/dashboard/access-control";
    case "contracts":
      return "#/dashboard/forms";
    case "member_portal":
      return "#/dashboard/member-portal";
    case "marketing":
      return "#/dashboard/marketing";
    case "reports":
      return "#/dashboard/reporting";
    case "settings":
      return `#/dashboard/settings/${settingsSectionToRoute(state.settingsSection)}`;
    default:
      return "#/dashboard/home";
  }
}

function settingsSectionToRoute(section: SettingsSectionKey) {
  switch (section) {
    case "setup":
      return "setup";
    case "company_information":
      return "company-information";
    case "roles_staff":
      return "roles-and-staff";
    case "featured_items":
      return "featured-items";
    case "media":
      return "media";
    case "resources":
      return "resources";
    case "promotions":
      return "promotions";
    case "templates":
      return "templates";
    case "customized_themes":
      return "customized-themes";
    case "tags":
      return "tags";
    case "taxes":
      return "taxes";
    case "forms":
      return "forms";
  }
}

function resetDashboardTransientState() {
  state.selectedMemberId = undefined;
  state.editingMemberId = undefined;
  state.checkInResult = undefined;
  state.checkInReview = undefined;
}

function navigateDashboardView(view: AppState["dashboardView"], options?: { preserveContext?: boolean }) {
  const previousTopLevel = dashboardTopLevelView(state.dashboardView);
  const nextTopLevel = dashboardTopLevelView(view);
  if (!options?.preserveContext && previousTopLevel !== nextTopLevel) {
    resetDashboardTransientState();
  }
  state.dashboardView = view;
  const targetHash = dashboardViewToHash(view);
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
    return;
  }
  render();
}

function navigateSettingsSection(section: SettingsSectionKey) {
  state.settingsSection = section;
  const targetHash = `#/dashboard/settings/${settingsSectionToRoute(section)}`;
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
    return;
  }
  render();
}

function ensureDashboardRouteHash() {
  if (state.view !== "dashboard") {
    return;
  }
  const targetHash = dashboardViewToHash(state.dashboardView);
  if (window.location.hash === targetHash) {
    return;
  }
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}${targetHash}`);
}

function loadTheme(): ThemeName {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  return raw === "dark" ? "dark" : "light";
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
}

function loadSession() {
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

function loadPublicSlug() {
  return localStorage.getItem(PUBLIC_SLUG_STORAGE_KEY) ?? "";
}

function clearPublicSlug() {
  state.publicSlug = "";
  state.publicGym = null;
  state.publicPlans = [];
  state.publicSchedule = [];
  state.selectedClassSessionId = "";
  state.classBookings = [];
  state.selectedPlanId = "";
  localStorage.removeItem(PUBLIC_SLUG_STORAGE_KEY);
}

function registerInputFromForm(form: HTMLFormElement, options: { requireGymName?: boolean } = {}) {
  const data = formData(form);
  const gymName = data.gymName?.trim() ?? "";
  const input = {
    email: data.email?.trim().toLowerCase() ?? "",
    password: data.password ?? "",
    firstName: data.firstName?.trim() ?? "",
    lastName: data.lastName?.trim() ?? "",
    ...(gymName ? { gymName } : {}),
    timezone: "America/New_York",
    locale: "en-US"
  };
  const issues: string[] = [];
  if (!input.firstName) {
    issues.push("Owner first name is required.");
  }
  if (!input.lastName) {
    issues.push("Owner last name is required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    issues.push("Enter a valid owner email.");
  }
  if (!input.password) {
    issues.push("Owner password is required.");
  }
  if (options.requireGymName && !gymName) {
    issues.push("Gym name is required.");
  } else if (gymName && gymName.length < 2) {
    issues.push("Gym name must be at least 2 characters.");
  }
  if (issues.length > 0) {
    setBanner("error", issues.join(" "));
    render();
    return undefined;
  }
  return input;
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

function buildCheckInDebug(
  error: unknown,
  lookup: string,
  locationId: string,
  memberMatch?: MemberRecord
) {
  const details = [
    `Lookup entered: ${lookup}`,
    `Resolved member: ${memberMatch ? `${memberMatch.firstName} ${memberMatch.lastName} (${memberMatch.id})` : "none"}`,
    `Location id: ${locationId}`,
    `Gym id: ${state.gym?.id ?? "unknown"}`
  ];
  if (error instanceof ApiError) {
    details.push(`API status: ${error.status}`);
    details.push(`API code: ${error.code}`);
    if (error.issues && error.issues.length > 0) {
      details.push(`Validation issues: ${error.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
    }
    return {
      title: "Check-in failed",
      message: error.message,
      details
    };
  }
  if (error instanceof Error) {
    details.push(`Error: ${error.message}`);
    return {
      title: "Check-in failed",
      message: error.message,
      details
    };
  }
  details.push("Unknown error type returned by the runtime.");
  return {
    title: "Check-in failed",
    message: "Something went wrong while checking in.",
    details
  };
}

function dollarsToCents(value: string) {
  return Math.round(Number(value || "0") * 100);
}

function safeInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function escapeAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;");
}

function escapeHtml(value: string) {
  return escapeAttribute(value);
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
