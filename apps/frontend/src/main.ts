import { GymApiClient, ApiError, type ApiTokenStore } from "@gym-platform/api-client";
import { BillingInterval, MemberStatus } from "@gym-platform/constants";
import { buildMemberListPage } from "@gym-platform/dashboard";
import {
  buildPublicPlansPage,
  buildPublicSchedulePage,
  buildPublicSignupPage
} from "@gym-platform/website-renderer";
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
  members: MemberRecord[];
  plans: PlanRecord[];
  publicSlug: string;
  publicGym: GymRecord | null;
  publicPlans: PlanRecord[];
  publicSchedule: PublicSessionRecord[];
  selectedPlanId: string;
  banner?: { tone: BannerTone; text: string };
  publicSuccess?: string;
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
  members: [],
  plans: [],
  publicSlug: loadPublicSlug(),
  publicGym: null,
  publicPlans: [],
  publicSchedule: [],
  selectedPlanId: ""
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
  const memberPage =
    state.gym && state.me
      ? buildMemberListPage({
          members: state.members,
          permissions: currentPermissions()
        })
      : undefined;

  app.innerHTML = `
    <div class="shell">
      <header class="top">
        <div>
          <p class="eyebrow">Gym Platform</p>
          <h1>${state.gym?.name ?? state.publicGym?.name ?? "Workspace"}</h1>
          <p class="lede">${state.me ? state.me.user.email : "Owner access"}</p>
        </div>
        <div class="status-stack">
          <div class="status-card">
            <span>System</span>
            <strong>${state.apiHealthy === null ? "Checking" : state.apiHealthy ? "Online" : "Offline"}</strong>
            <small>${state.apiHealthy ? "Services available" : "Service unavailable"}</small>
          </div>
          <div class="status-card">
            <span>Account</span>
            <strong>${state.me ? `${state.me.user.firstName} ${state.me.user.lastName}` : "Signed out"}</strong>
            <small>${currentMembership()?.role?.name ?? "No role selected"}</small>
          </div>
        </div>
      </header>

      <nav class="tabs">
        <a class="tab${state.view === "dashboard" ? " active" : ""}" href="#/dashboard">Dashboard</a>
        <a class="tab${state.view === "public" ? " active" : ""}" href="#/public">Public Site</a>
      </nav>

      ${state.banner ? `<div class="banner ${state.banner.tone}">${state.banner.text}</div>` : ""}

      <main class="layout">
        <section class="panel primary">
          ${state.view === "dashboard"
            ? renderDashboard(memberPage)
            : renderPublic(publicPlanPage, publicSignupPage, publicSchedulePage)}
        </section>
        <aside class="panel side">
          ${renderSidePanel()}
        </aside>
      </main>
    </div>
  `;

  bindEvents();
}

function renderDashboard(
  memberPage:
    | ReturnType<typeof buildMemberListPage>
    | undefined
) {
  if (state.dashboardLoading) {
    return `<div class="empty-state"><h2>Loading dashboard</h2><p>Refreshing workspace data.</p></div>`;
  }

  if (!state.session || !state.me) {
    return `
      <div class="section-head">
        <div>
          <p class="eyebrow">Authentication</p>
          <h2>Register or log in</h2>
        </div>
      </div>
      <div class="two-up">
        <form id="register-form" class="form-card">
          <h3>Create owner account</h3>
          ${renderInput("firstName", "First name")}
          ${renderInput("lastName", "Last name")}
          ${renderInput("email", "Email", "email")}
          ${renderInput("password", "Password", "password")}
          ${renderInput("gymName", "Gym name")}
          <button type="submit">Register and create gym</button>
        </form>
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
      <div class="section-head">
        <div>
          <p class="eyebrow">Gym setup</p>
          <h2>Create your first gym</h2>
        </div>
      </div>
      <form id="create-gym-form" class="form-card">
        ${renderInput("name", "Gym name")}
        <button type="submit">Create gym</button>
      </form>
    `;
  }

  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h2>${state.gym.name}</h2>
      </div>
      <button id="logout-button" class="ghost-button" type="button">Log out</button>
    </div>

    <div class="stat-grid">
      <article class="mini-card">
        <span>Gym slug</span>
        <strong>${state.gym.slug}</strong>
        <small>Public site handle</small>
      </article>
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
    </div>

    <div class="two-up">
      <form id="create-plan-form" class="form-card">
        <h3>Create public plan</h3>
        ${renderInput("name", "Plan name")}
        ${renderInput("description", "Description")}
        ${renderInput("price", "Monthly price", "number", "49")}
        ${renderInput("signupFee", "Signup fee", "number", "0")}
        ${renderSelect(
          "billingInterval",
          "Billing interval",
          Object.values(BillingInterval).map((value) => ({ value, label: value.replace("_", " ") })),
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

    <div class="list-grid">
      <section class="data-card">
        <div class="card-head">
          <h3>Membership plans</h3>
          <span>${state.plans.length} total</span>
        </div>
        ${renderPlansTable(state.plans)}
      </section>
      <section class="data-card">
        <div class="card-head">
          <h3>Members</h3>
          <span>${memberPage?.summaryLabel ?? "No members yet"}</span>
        </div>
        ${memberPage ? renderMembersTable(memberPage) : `<p class="muted">No members available.</p>`}
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

function renderSidePanel() {
  const membership = currentMembership();
  const publicPlanCount = state.publicPlans.length || state.plans.filter((plan) => plan.isPublic).length;
  return `
    <div class="side-stack">
      <section class="mini-card">
        <span>Account</span>
        <strong>${state.me ? `${state.me.user.firstName} ${state.me.user.lastName}` : "Not signed in"}</strong>
        <small>${membership?.role?.name ?? "No active role loaded"}</small>
      </section>

      <section class="mini-card">
        <span>Public site</span>
        <strong>${state.publicSlug || state.gym?.slug || "Not published"}</strong>
        <small>${publicPlanCount} public plan${publicPlanCount === 1 ? "" : "s"}</small>
      </section>

      <section class="mini-card">
        <span>Roster</span>
        <strong>${state.members.length}</strong>
        <small>${state.members.filter((member) => member.status === MemberStatus.Active).length} active members</small>
      </section>
    </div>
  `;
}

function bindEvents() {
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

function renderPlansTable(plans: PlanRecord[]) {
  if (plans.length === 0) {
    return `<p class="muted">No plans created yet.</p>`;
  }
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Interval</th>
            <th>Price</th>
            <th>Public</th>
          </tr>
        </thead>
        <tbody>
          ${plans
            .map(
              (plan) => `
                <tr>
                  <td>${plan.name}</td>
                  <td>${plan.billingInterval}</td>
                  <td>${formatMoney(plan.priceCents)}</td>
                  <td>${plan.isPublic ? "Yes" : "No"}</td>
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

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function escapeAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;");
}
