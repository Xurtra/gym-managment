import { GymApiClient, ApiError, type ApiTokenStore } from "@gym-platform/api-client";
import { BillingInterval, MemberStatus } from "@gym-platform/constants";
import {
  buildMemberListPage,
  type CheckInRecord,
} from "@gym-platform/dashboard";
import {
  buildPublicPlansPage,
  buildPublicSchedulePage,
  buildPublicSignupPage
} from "@gym-platform/website-renderer";
import { CheckInMethod } from "@gym-platform/constants";
import "./style.css";

const API_BASE_URL = "http://127.0.0.1:4000";
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

type ViewName = "dashboard" | "public";
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
  publicSlug: string;
  publicGym: GymRecord | null;
  publicPlans: PlanRecord[];
  publicSchedule: PublicSessionRecord[];
  selectedPlanId: string;
  banner?: { tone: BannerTone; text: string };
  publicSuccess?: string;
  // Dashboard sub-views
  dashboardView: "home" | "members" | "member_profile" | "check_in" | "check_in_history" | "member_search";
  selectedMemberId?: string;
  memberSearchQuery: string;
  checkInBarcode: string;
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
  publicSlug: loadPublicSlug(),
  publicGym: null,
  publicPlans: [],
  publicSchedule: [],
  selectedPlanId: "",
  dashboardView: "home",
  memberSearchQuery: "",
  checkInBarcode: "",
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
      const [members, plans] = (await Promise.all([
        client.listMembers(state.gym.id) as Promise<MemberListResponse>,
        client.listMembershipPlans(state.gym.id) as Promise<PlanListResponse>
      ])) as [MemberListResponse, PlanListResponse];
      state.members = members.members;
      state.plans = plans.plans;
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
    <div class="shell" style="background:#09090b; color:#e5e5e5; min-height:100vh;">

      <main class="layout" style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
        <section class="panel primary" style="width:100%;">
          ${state.view === "dashboard"
            ? renderDashboard()
            : renderPublic(publicPlanPage, publicSignupPage, publicSchedulePage)}
        </section>
      </main>
    </div>
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
      <button class="tab-btn ${state.dashboardView === 'members' ? 'active' : ''}" data-dashboard-view="members">Members</button>
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
    case 'member_profile':
      content = renderMemberProfileView();
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
        <button type="submit">Create plan</button>
      </form>
      <form id="create-member-form" class="form-card">
        <h3>Create member</h3>
        ${renderInput("firstName", "First name")}
        ${renderInput("lastName", "Last name")}
        ${renderInput("email", "Email", "email")}
        ${renderInput("phone", "Phone", "tel")}
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
          <strong>Contact</strong>
          <p style="margin:0.5rem 0;color:var(--muted);">${member.email || 'No email'} · ${member.phone || 'No phone'}</p>
        </div>
        <div class="mini-card">
          <strong>Status</strong>
          <p style="margin:0.5rem 0;color:var(--muted);">${member.status}</p>
        </div>
        ${member.barcode ? `<div class="mini-card"><strong>Barcode</strong><p style="margin:0.5rem 0;color:var(--muted);">${member.barcode}</p></div>` : ''}
        ${member.tagNames.length > 0 ? `<div class="mini-card"><strong>Tags</strong><p style="margin:0.5rem 0;color:var(--muted);">${member.tagNames.join(', ')}</p></div>` : ''}
        ${member.notes ? `<div class="mini-card"><strong>Notes</strong><p style="margin:0.5rem 0;color:var(--muted);">${member.notes}</p></div>` : ''}
      </div>
    </div>
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
  return `
    <section class="data-card">
      <div class="card-head" style="margin-bottom:1rem;">
        <h3>Check-In Kiosk</h3>
        <span>Scan barcode to check in a member</span>
      </div>
      <form id="check-in-form" style="display:flex;gap:8px;margin-bottom:1rem;">
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

  // Check-in form
  bindForm("check-in-form", async (form) => {
    if (!state.gym) return;
    const data = formData(form);
    const barcode = data.barcode.trim();
    if (!barcode) return;
    try {
      const result = await client.createCheckIn(state.gym.id, {
        barcode,
        locationId: "",
        method: CheckInMethod.Barcode
      }) as CheckInRecord;
      state.checkInResult = result;
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
    console.log("[platform-create-gym-form] submitting", {
      email: data.email,
      password: data.password,
      passwordLength: data.password.length,
      firstName: data.firstName,
      lastName: data.lastName,
      gymName: data.gymName,
    });
    try {
      const response = await client.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        gymName: data.gymName,
        timezone: "America/New_York",
        locale: "en-US"
      });
      console.log("[platform-create-gym-form] success", response);
      setBanner("success", "Gym and owner created successfully.");
      const gymsData = await client.listGyms() as { gyms: GymRecord[] };
      state.platformGyms = gymsData.gyms || [];
      await refreshDashboard();
    } catch (error) {
      console.error("[platform-create-gym-form] error", error);
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
      status: MemberStatus.Active,
      tagNames: []
    });
    setBanner("success", "Member created.");
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
}

function setBanner(tone: BannerTone, text: string) {
  state.banner = { tone, text };
}

function readView(): ViewName {
  return window.location.hash.includes("/public") ? "public" : "dashboard";
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

function escapeAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;");
}
