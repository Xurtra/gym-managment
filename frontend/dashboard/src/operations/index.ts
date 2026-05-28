import { Permission } from "@gym-platform/constants";
import {
  buildContractWaiverListPage,
  ContractWaiverType,
  type ContractWaiverDocumentView,
  type ContractWaiverListPage
} from "../contractsWaivers/list.js";

export interface OperationsGymView {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface OperationsMemberView {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  status?: string;
}

export interface OperationsClassTypeView {
  id: string;
  name: string;
}

export interface OperationsLocationView {
  id: string;
  name: string;
}

export interface OperationsTrainerView {
  id: string;
  fullName: string;
}

export interface OperationsClassSessionView {
  classTypeId: string;
  trainerUserId?: string;
  startsAt: string;
  capacity: number;
}

export interface OperationsPlanView {
  id: string;
  name: string;
  priceCents?: number | string;
}

export interface OperationsResourceView {
  id: string;
  locationId?: string;
  linkedStaffUserId?: string;
  name: string;
  resourceType: string;
  status: "active" | "archived";
  capacity?: number;
  pricing?: { amountCents?: number | string };
}

export interface OperationsReservationView {
  id: string;
  resourceId: string;
  locationId?: string;
  memberId: string;
  status: string;
  startsAt: string;
  endsAt: string;
  amountCents: number;
}

export interface OperationsStaffView {
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  roleName: string;
  status: string;
}

export interface OperationsRoleView {
  id: string;
  name: string;
  permissions: string[];
  isSystem?: boolean;
  createsReservableResource?: boolean;
}

export interface OperationsTimeEntryView {
  userId: string;
  clockedInAt: string;
  clockedOutAt?: string;
}

export interface OperationsStripeAccountView {
  accountId?: string;
  chargesEnabled?: boolean;
  onboardingComplete?: boolean;
  requirementsDue?: string[];
  businessName?: string;
}

export interface OperationsWorkspaceView {
  gym: OperationsGymView;
  platformAdmin: boolean;
  permissions: string[];
  members: OperationsMemberView[];
  classTypes: OperationsClassTypeView[];
  locations: OperationsLocationView[];
  trainers: OperationsTrainerView[];
  classSessions: OperationsClassSessionView[];
  plans: OperationsPlanView[];
  resources: OperationsResourceView[];
  reservations: OperationsReservationView[];
  staff: OperationsStaffView[];
  roles: OperationsRoleView[];
  timeEntries: OperationsTimeEntryView[];
  stripeAccount?: OperationsStripeAccountView;
}

const portalRouteItems = [
  { label: "Member Home", href: "/", active: true },
  { label: "Classes", href: "/classes", active: false },
  { label: "Billing", href: "/billing", active: false },
  { label: "Check-In Code", href: "/check-in", active: false }
] as const;

export interface OperationsHeaderModel {
  eyebrow: string;
  title: string;
  kicker?: string;
  actions?: Array<{ label: string; href: string }>;
}

export interface OperationsMetricCard {
  label: string;
  value: string;
}

export interface OperationsCard {
  id: string;
  title: string;
  subtitle?: string;
  initials?: string;
  active?: boolean;
}

export interface OperationsProductCard {
  id: string;
  name: string;
  priceLabel: string;
}

export interface OperationsTableModel {
  columns: string[];
  rows: string[][];
  emptyTitle: string;
  emptyBody: string;
}

export interface OperationsFormOption {
  label: string;
  value: string;
}

export interface LocationOperationsPage {
  header: OperationsHeaderModel;
  canCreateLocation: boolean;
  canCreateResource: boolean;
  locationForm: {
    defaultCountry: string;
    defaultTimezone: string;
  };
  resourceForm: {
    locationOptions: OperationsFormOption[];
    typeOptions: OperationsFormOption[];
    paymentOptions: OperationsFormOption[];
  };
  roster: {
    title: string;
    action: { label: string; href: string };
    locations: OperationsCard[];
    emptyTitle: string;
    emptyBody: string;
  };
  reservationsTable: OperationsTableModel;
  selectedLocation: {
    title: string;
    resourceCountLabel: string;
    metrics: OperationsMetricCard[];
  };
  resources: {
    title: string;
    products: OperationsProductCard[];
    emptyTitle: string;
    emptyBody: string;
  };
}

export interface TrainingOperationsPage {
  header: OperationsHeaderModel;
  trainers: {
    title: string;
    kicker: string;
    cards: OperationsCard[];
    emptyTitle: string;
    emptyBody: string;
  };
  sessionsTable: OperationsTableModel;
  products: {
    title: string;
    cards: OperationsProductCard[];
    emptyTitle: string;
    emptyBody: string;
  };
  availabilityMetrics: OperationsMetricCard[];
}

export interface PortalOperationsPage {
  header: OperationsHeaderModel;
  publicPages: {
    title: string;
    action: { label: string; href: string };
    metrics: OperationsMetricCard[];
  };
  portal: {
    title: string;
    routeCountLabel: string;
    routes: Array<{ label: string; href: string; active: boolean; body: string }>;
  };
  plans: {
    title: string;
    cards: OperationsProductCard[];
    emptyTitle: string;
    emptyBody: string;
  };
  health: {
    title: string;
    body: string;
  };
}

export interface FormsOperationsPage {
  header: OperationsHeaderModel;
  contractPage: ContractWaiverListPage;
  summaryCards: OperationsMetricCard[];
  table: OperationsTableModel;
}

export interface MarketingOperationsPage {
  header: OperationsHeaderModel;
  metrics: OperationsMetricCard[];
  featureCards: Array<{ title: string; body: string }>;
}

export interface ReportsOperationsPage {
  header: OperationsHeaderModel;
  snapshotMetrics: OperationsMetricCard[];
  payrollTable: OperationsTableModel;
  revenueMetrics: OperationsMetricCard[];
  timeClockMetrics: OperationsMetricCard[];
}

export interface SettingsOperationsPage {
  header: OperationsHeaderModel;
  tabs: Array<{ label: string; active: boolean }>;
  companyMetrics: OperationsMetricCard[];
  roleCards: OperationsCard[];
  selectedRole?: {
    name: string;
    kindLabel: string;
    permissionLabel: string;
    resourceBody: string;
  };
  staffRows: Array<{ id: string; name: string; detail: string; status: string }>;
}

export function buildLocationsOperationsPage(data: OperationsWorkspaceView): LocationOperationsPage {
  const activeLocations = data.locations;
  const activeResources = data.resources.filter((resource) => resource.status === "active" && !resource.linkedStaffUserId);
  const selectedLocation = activeLocations[0];
  const selectedResources = selectedLocation
    ? activeResources.filter((resource) => resource.locationId === selectedLocation.id)
    : activeResources;

  return {
    header: {
      eyebrow: "Locations",
      title: "Facilities and rooms",
      kicker: `${activeLocations.length} active · ${activeResources.length} bookable resources`,
      actions: [
        { label: "New location", href: "#create-location-form" },
        { label: "New resource", href: "#create-resource-form" }
      ]
    },
    canCreateLocation: data.platformAdmin || data.permissions.includes(Permission.LocationCreate),
    canCreateResource: data.platformAdmin || data.permissions.includes(Permission.LocationUpdate),
    locationForm: {
      defaultCountry: "US",
      defaultTimezone: "America/New_York"
    },
    resourceForm: {
      locationOptions: activeLocations.map((location) => ({ label: location.name, value: location.id })),
      typeOptions: [
        { label: "Room", value: "room" },
        { label: "Court", value: "court" },
        { label: "Equipment", value: "equipment" },
        { label: "Space", value: "space" }
      ],
      paymentOptions: [
        { label: "Free", value: "free" },
        { label: "Pay later", value: "pay_later" },
        { label: "Pay upfront", value: "pay_upfront" }
      ]
    },
    roster: {
      title: "Location roster",
      action: { label: "New reservation", href: "/dashboard/reservations/new" },
      locations: activeLocations.map((location) => ({
        id: location.id,
        title: location.name,
        subtitle: "Facility",
        initials: initials(location.name)
      })),
      emptyTitle: "No locations loaded",
      emptyBody: "Add locations to organize classes, resources, and staff shifts."
    },
    reservationsTable: {
      columns: ["Resource", "Member", "Status", "Starts"],
      rows: data.reservations.slice(0, 8).map((reservation) => [
        resourceName(data, reservation.resourceId),
        memberName(data, reservation.memberId),
        reservation.status,
        formatDateTime(reservation.startsAt)
      ]),
      emptyTitle: "No reservations yet",
      emptyBody: "Facility bookings appear here once members reserve rooms or equipment."
    },
    selectedLocation: {
      title: selectedLocation?.name ?? "No location selected",
      resourceCountLabel: `${selectedResources.length} resources`,
      metrics: [
        { label: "Classes", value: String(data.classSessions.length) },
        { label: "Rooms", value: String(selectedResources.length) },
        { label: "Reservations", value: String(data.reservations.length) },
        {
          label: "Capacity",
          value: String(selectedResources.reduce((sum, resource) => sum + (resource.capacity ?? 0), 0))
        }
      ]
    },
    resources: {
      title: "Reservable resources",
      products: selectedResources.slice(0, 6).map((resource) => ({
        id: resource.id,
        name: resource.name,
        priceLabel: formatCurrency(resource.pricing?.amountCents ?? 0)
      })),
      emptyTitle: "No resources",
      emptyBody: "Create rooms, courts, equipment, or bookable staff resources for this location."
    }
  };
}

export function buildTrainingOperationsPage(data: OperationsWorkspaceView): TrainingOperationsPage {
  const trainerIds = new Set(data.trainers.map((trainer) => trainer.id));
  const trainerSessions = data.classSessions.filter(
    (session) => session.trainerUserId && trainerIds.has(session.trainerUserId)
  );
  const trainerResources = data.resources.filter((resource) => resource.linkedStaffUserId);

  return {
    header: {
      eyebrow: "Training",
      title: "Personal training sessions",
      kicker: `${data.trainers.length} trainers · ${trainerSessions.length} scheduled`
    },
    trainers: {
      title: "Trainer roster",
      kicker: `${trainerResources.length} reservable resources`,
      cards: data.trainers.map((trainer) => ({
        id: trainer.id,
        title: trainer.fullName,
        subtitle: "Trainer",
        initials: initials(trainer.fullName)
      })),
      emptyTitle: "No trainers loaded",
      emptyBody: "Staff with trainer roles will appear here."
    },
    sessionsTable: {
      columns: ["Session", "Trainer", "Starts", "Capacity"],
      rows: trainerSessions.slice(0, 8).map((session) => [
        classTypeName(data, session.classTypeId),
        trainerName(data, session.trainerUserId),
        formatDateTime(session.startsAt),
        String(session.capacity)
      ]),
      emptyTitle: "No training sessions",
      emptyBody: "Scheduled class or training sessions with trainers appear here."
    },
    products: {
      title: "Training products",
      cards: data.plans.slice(0, 6).map((plan) => ({
        id: plan.id,
        name: plan.name,
        priceLabel: formatCurrency(plan.priceCents)
      })),
      emptyTitle: "No products yet",
      emptyBody: "Membership and package products will appear here."
    },
    availabilityMetrics: [
      { label: "Locations", value: String(data.locations.length) },
      { label: "Resources", value: String(trainerResources.length) },
      { label: "Staff", value: String(data.staff.length) },
      { label: "Bookings", value: String(trainerSessions.length) }
    ]
  };
}

export function buildPortalOperationsPage(data: OperationsWorkspaceView): PortalOperationsPage {
  return {
    header: {
      eyebrow: "Portal",
      title: "Member portal configuration",
      kicker: data.gym.slug
    },
    publicPages: {
      title: "Public pages",
      action: { label: "Open plans", href: `/gyms/${data.gym.slug}/plans` },
      metrics: [
        { label: "Slug", value: data.gym.slug },
        { label: "Plans", value: String(data.plans.length) },
        { label: "Classes", value: String(data.classSessions.length) },
        { label: "Locations", value: String(data.locations.length) }
      ]
    },
    portal: {
      title: "Member Portal",
      routeCountLabel: `${portalRouteItems.length} member routes`,
      routes: portalRouteItems.map((route) => ({
        ...route,
        body: route.active ? "Active member portal landing route." : "Member-facing portal route."
      }))
    },
    plans: {
      title: "Published plans",
      cards: data.plans.slice(0, 4).map((plan) => ({
        id: plan.id,
        name: plan.name,
        priceLabel: formatCurrency(plan.priceCents)
      })),
      emptyTitle: "No public plans",
      emptyBody: "Create active plans to show them on the portal."
    },
    health: {
      title: "Portal health",
      body: "Use this page to confirm the customer-facing signup, schedule, and checkout surfaces are populated from the same gym data."
    }
  };
}

export function buildFormsOperationsPage(data: OperationsWorkspaceView): FormsOperationsPage {
  const contractPage = buildContractWaiverListPage({
    documents: contractWaiverDocuments(data),
    permissions: data.permissions
  });

  return {
    header: {
      eyebrow: "Forms",
      title: "Contracts and waivers",
      kicker: contractPage.summaryLabel
    },
    contractPage,
    summaryCards: [
      { label: "Contracts", value: String(contractPage.summary.contractCount) },
      { label: "Waivers", value: String(contractPage.summary.waiverCount) },
      { label: "Requires signature", value: String(contractPage.summary.requiredSignatureCount) },
      { label: "Published", value: String(contractPage.summary.publishedCount) }
    ],
    table: {
      columns: contractPage.table.columns.map((column) => column.label),
      rows: contractPage.rows.map((row) => [row.title, row.typeLabel, row.statusLabel, row.signatureLabel]),
      emptyTitle: "No rows yet",
      emptyBody: "This report will populate when matching records exist."
    }
  };
}

export function buildMarketingOperationsPage(data: OperationsWorkspaceView): MarketingOperationsPage {
  const leadCount = data.members.filter((member) => member.status === "lead").length;
  const publicRouteCount = 3;
  const hasCheckoutPlan = data.plans.length > 0;
  const featureCards = [
    { title: "Online signup", body: "Public signup flow for new members." },
    { title: "Class booking", body: "Public schedule and booking surface." },
    { title: "Member portal", body: "Member-facing account and billing area." },
    { title: "Website builder", body: "Public website content module." }
  ];

  return {
    header: {
      eyebrow: "Marketing",
      title: "Public site builder",
      kicker: `${featureCards.length} website modules`
    },
    metrics: [
      { label: "Public site", value: data.gym.slug || "Not set" },
      { label: "Leads", value: String(leadCount) },
      { label: "Public routes", value: String(publicRouteCount) },
      { label: "Checkout", value: hasCheckoutPlan ? "Ready" : "Blocked" }
    ],
    featureCards
  };
}

export function buildReportsOperationsPage(data: OperationsWorkspaceView): ReportsOperationsPage {
  const activeMembers = data.members.filter((member) => member.status === "active").length;
  const openTimeEntries = data.timeEntries.filter((entry) => !entry.clockedOutAt).length;
  const totalMinutes = data.timeEntries.reduce((sum, entry) => sum + timeEntryMinutes(entry), 0);

  return {
    header: {
      eyebrow: "Reporting",
      title: "Reports and payroll",
      kicker: `${data.members.length} consumers · ${data.staff.length} staff`
    },
    snapshotMetrics: [
      { label: "Consumers", value: String(data.members.length) },
      { label: "Active members", value: String(activeMembers) },
      { label: "Classes", value: String(data.classSessions.length) },
      { label: "Reservations", value: String(data.reservations.length) }
    ],
    payrollTable: {
      columns: ["Staff", "Role", "Entries", "Hours"],
      rows: data.staff.slice(0, 8).map((staff) => {
        const entries = data.timeEntries.filter((entry) => entry.userId === staff.userId);
        const minutes = entries.reduce((sum, entry) => sum + timeEntryMinutes(entry), 0);
        return [staffName(staff), staff.roleName, String(entries.length), (minutes / 60).toFixed(2)];
      }),
      emptyTitle: "No rows yet",
      emptyBody: "This report will populate when matching records exist."
    },
    revenueMetrics: [
      { label: "Plans", value: String(data.plans.length) },
      { label: "Resources", value: String(data.resources.length) },
      { label: "Stripe", value: data.stripeAccount?.chargesEnabled ? "Ready" : "Setup" },
      { label: "Portal", value: data.gym.slug }
    ],
    timeClockMetrics: [
      { label: "Total hours", value: (totalMinutes / 60).toFixed(2) },
      { label: "Open entries", value: String(openTimeEntries) }
    ]
  };
}

export function buildSettingsOperationsPage(data: OperationsWorkspaceView): SettingsOperationsPage {
  const editableRoles = data.roles.filter((role) => !role.isSystem);
  const selectedRole = editableRoles[0] ?? data.roles[0];
  const tabs = ["Company Information", "Roles and Staff", "Locations", "Member Portal", "Billing", "Notifications", "Data Import"];

  return {
    header: {
      eyebrow: "Settings",
      title: "Workspace controls",
      kicker: "Customize your gym operations"
    },
    tabs: tabs.map((label, index) => ({ label, active: index === 0 })),
    companyMetrics: [
      { label: "Gym", value: data.gym.name },
      { label: "Slug", value: data.gym.slug },
      { label: "Timezone", value: "America/New_York" },
      { label: "Locations", value: String(data.locations.length) }
    ],
    roleCards: data.roles.slice(0, 8).map((role) => ({
      id: role.id,
      title: role.name,
      subtitle: `${role.permissions.length} permissions`,
      active: role.id === selectedRole?.id
    })),
    ...(selectedRole
      ? {
          selectedRole: {
            name: selectedRole.name,
            kindLabel: selectedRole.isSystem ? "System role" : "Custom role",
            permissionLabel: `${selectedRole.permissions.length} permissions`,
            resourceBody: selectedRole.createsReservableResource
              ? "Staff assigned to this role get a reservable resource."
              : "Staff assigned to this role do not get reservable resources."
          }
        }
      : {}),
    staffRows: data.staff.slice(0, 8).map((staff) => ({
      id: staff.userId,
      name: staffName(staff),
      detail: `${staff.email} · ${staff.roleName}`,
      status: staff.status
    }))
  };
}

const DEFAULT_SIGNATURE_REQUIREMENTS = [
  "Waiver",
  "Photo consent",
  "Billing agreement",
  "Emergency contact acknowledgment"
];

function contractWaiverDocuments(data: OperationsWorkspaceView): ContractWaiverDocumentView[] {
  const now = new Date().toISOString();
  return DEFAULT_SIGNATURE_REQUIREMENTS.map((label, index) => ({
    id: `document-${index + 1}`,
    gymId: data.gym.id,
    title: label,
    type: label.toLowerCase().includes("agreement")
      ? ContractWaiverType.Contract
      : ContractWaiverType.Waiver,
    version: 1,
    requiresSignature: true,
    signedMemberCount: Math.min(data.members.length, index),
    createdAt: now,
    updatedAt: now,
    publishedAt: now
  }));
}

function staffName(staff: OperationsStaffView) {
  return `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim() || staff.email;
}

function memberName(data: OperationsWorkspaceView, memberId: string) {
  const member = data.members.find((candidate) => candidate.id === memberId);
  return member ? `${member.firstName} ${member.lastName}`.trim() || member.email || memberId : memberId;
}

function resourceName(data: OperationsWorkspaceView, resourceId: string) {
  return data.resources.find((resource) => resource.id === resourceId)?.name ?? resourceId;
}

function classTypeName(data: OperationsWorkspaceView, classTypeId: string) {
  return data.classTypes.find((classType) => classType.id === classTypeId)?.name ?? "Training session";
}

function trainerName(data: OperationsWorkspaceView, trainerId?: string) {
  return data.trainers.find((trainer) => trainer.id === trainerId)?.fullName ?? "Unassigned";
}

function timeEntryMinutes(entry: OperationsTimeEntryView) {
  const start = new Date(entry.clockedInAt).getTime();
  const end = entry.clockedOutAt ? new Date(entry.clockedOutAt).getTime() : Date.now();
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? Math.round((end - start) / 60000) : 0;
}

function formatCurrency(priceCents?: number | string) {
  const cents = numericCents(priceCents);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((Number.isFinite(cents) ? cents : 0) / 100);
}

function numericCents(priceCents?: number | string) {
  return typeof priceCents === "number" ? priceCents : Number(priceCents ?? 0);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function initials(value: string) {
  return value.slice(0, 2).toUpperCase();
}
