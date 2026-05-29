import { GymApiClient, ApiError, type ApiTokenStore } from "@gym-platform/api-client";
import { loadConnectAndInitialize, type StripeConnectInstance } from "@stripe/connect-js";
import { loadStripeTerminal } from "@stripe/terminal-js/pure";
import { loadStripe, type Stripe, type StripeCardElement, type StripeElements } from "@stripe/stripe-js";
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
  ReservationPaymentRequirement,
  RoleName,
  UserStatus
} from "@gym-platform/constants";
import type { ConsumerRecordStatus, ConsumerSegment, LeadStage } from "@gym-platform/constants";
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
  ContractWaiverType,
  PersonalTrainingSessionStatus,
  StripePaymentMethod,
  type AccessDeviceView,
  type AccessEventView,
  type AccessRuleView,
  type ClassBookingView,
  type ClassSessionView,
  type CheckInRecord,
  type ContractWaiverDocumentView
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
import {
  consumerSegmentLabel,
  consumerSummary,
  consumersForSegment,
  isLeadConsumerRecord,
  isMemberConsumerRecord,
  type ConsumerSegmentFilter
} from "./consumerData.js";
import {
  assertRecurringMembershipRequirements,
  consumerCreateKindOptions,
  defaultConsumerCreateKind,
  defaultRecurringPlanId
} from "./consumerCreate.js";
import {
  buildReservationAgendaItems,
  createClassResourceAllocationSubmission,
  createResourceReservationCancelSubmission,
  createResourceReservationSubmission,
  isoToDatetimeLocal,
  type ReservationAgendaItem
} from "./reservationsHub.js";
import "./style.css";

const API_BASE_URL = "http://127.0.0.1:4000";
const SESSION_STORAGE_KEY = "gym-platform-session";
const PUBLIC_SLUG_STORAGE_KEY = "gym-platform-public-slug";
const THEME_STORAGE_KEY = "gym-platform-theme";
const MEMBER_DESK_STORAGE_KEY = "gym-platform-member-desk";
const ROLE_PERMISSION_OPTIONS = Object.values(Permission).filter(
  (permission) => permission !== Permission.PlatformAdmin
);
const CAMPAIGN_IMPORT_TYPES = [
  { value: "clients", label: "Clients" },
  { value: "bookings", label: "Bookings" },
  { value: "services", label: "Services" },
  { value: "memberships_packages", label: "Memberships/packages" },
  { value: "payments", label: "Payments" },
  { value: "rooms_devices", label: "Rooms/devices" }
] as const;
const CAMPAIGN_LAYER_PAGES = [
  { key: "dashboard", label: "Dashboard", path: "" },
  { key: "imports", label: "Imports", path: "imports" },
  { key: "opportunities", label: "Opportunities", path: "opportunities" },
  { key: "utilization", label: "Utilization", path: "utilization" },
  { key: "clients", label: "Clients", path: "clients" },
  { key: "campaigns", label: "Campaigns", path: "campaigns" },
  { key: "programs", label: "Programs", path: "programs" },
  { key: "settings", label: "Settings", path: "settings" }
] as const;
const CAMPAIGN_GENERATOR_TYPES = [
  { value: "unused_credit_reminder", label: "Unused credit reminder" },
  { value: "inactive_member_win_back", label: "Inactive member win-back" },
  { value: "first_visit_follow_up", label: "First visit follow-up" },
  { value: "off_peak_room_fill", label: "Off-peak room fill" },
  { value: "premium_program_launch", label: "Premium program launch" },
  { value: "review_request", label: "Review request" },
  { value: "membership_upgrade", label: "Membership upgrade" }
] as const;
const CAMPAIGN_IMPORT_EXPECTED_FIELDS: Record<CampaignImportType, CampaignImportExpectedField[]> = {
  clients: [
    { field: "full_name", label: "Full name", description: "Client/member full name.", required: true },
    { field: "first_name", label: "First name", description: "First name when split out." },
    { field: "last_name", label: "Last name", description: "Last name when split out." },
    { field: "email", label: "Email", description: "Primary email for matching and outreach." },
    { field: "phone", label: "Phone", description: "Primary phone number." },
    { field: "status", label: "Status", description: "Lead, customer, member, active, inactive, etc." },
    { field: "membership_name", label: "Membership name", description: "Current plan/package label." },
    { field: "source", label: "Source", description: "Lead or acquisition source." },
    { field: "notes", label: "Notes", description: "Internal notes." },
    { field: "tags", label: "Tags", description: "Comma separated tags." }
  ],
  bookings: [
    { field: "client_email", label: "Client email", description: "Email of the booked client." },
    { field: "client_name", label: "Client name", description: "Name of the booked client." },
    { field: "service_name", label: "Service name", description: "Class, appointment, or session.", required: true },
    { field: "booking_date", label: "Booking date", description: "Date of the booking.", required: true },
    { field: "start_time", label: "Start time", description: "Start time or datetime." },
    { field: "end_time", label: "End time", description: "End time or datetime." },
    { field: "status", label: "Status", description: "Booked, cancelled, attended, no-show." },
    { field: "room_name", label: "Room", description: "Room or resource name." },
    { field: "staff_name", label: "Staff", description: "Trainer, instructor, or coach." },
    { field: "notes", label: "Notes", description: "Booking notes." }
  ],
  services: [
    { field: "service_name", label: "Service name", description: "Name of the service.", required: true },
    { field: "description", label: "Description", description: "Service description." },
    { field: "price", label: "Price", description: "Service price." },
    { field: "duration_minutes", label: "Duration minutes", description: "Default duration." },
    { field: "capacity", label: "Capacity", description: "Bookable capacity." },
    { field: "category", label: "Category", description: "Class, training, retail, lesson, etc." },
    { field: "active", label: "Active", description: "Whether it is active." }
  ],
  memberships_packages: [
    { field: "package_name", label: "Membership/package name", description: "Plan, pack, or package name.", required: true },
    { field: "plan_type", label: "Plan type", description: "Monthly, annual, class pack, trial, etc." },
    { field: "price", label: "Price", description: "Plan/package price." },
    { field: "billing_frequency", label: "Billing frequency", description: "Monthly, annual, one-time, package." },
    { field: "sessions_included", label: "Sessions included", description: "Visits, sessions, credits, or classes." },
    { field: "contract_length", label: "Contract length", description: "Commitment or term." },
    { field: "active", label: "Active", description: "Whether it is active." },
    { field: "notes", label: "Notes", description: "Restrictions or internal notes." }
  ],
  payments: [
    { field: "client_email", label: "Client email", description: "Email used to match payer." },
    { field: "client_name", label: "Client name", description: "Payer name." },
    { field: "amount", label: "Amount", description: "Payment amount.", required: true },
    { field: "payment_date", label: "Payment date", description: "Collected or attempted date." },
    { field: "payment_method", label: "Payment method", description: "Card, cash, ACH, comp, etc." },
    { field: "status", label: "Status", description: "Paid, failed, refunded, pending." },
    { field: "reference", label: "Reference", description: "Receipt, invoice, or transaction id." },
    { field: "description", label: "Description", description: "What the payment was for." }
  ],
  rooms_devices: [
    { field: "name", label: "Name", description: "Room, lane, device, or station name.", required: true },
    { field: "resource_type", label: "Resource type", description: "Room, device, court, door, kiosk, etc." },
    { field: "location", label: "Location", description: "Facility or area." },
    { field: "capacity", label: "Capacity", description: "How many people can use it." },
    { field: "active", label: "Active", description: "Whether it is active." },
    { field: "bookable", label: "Bookable", description: "Whether clients can reserve it." },
    { field: "notes", label: "Notes", description: "Internal setup notes." }
  ]
};
const STAFF_ROLE_PRESETS = [
  {
    key: "manager",
    label: "Manager",
    defaultName: "Assistant Manager",
    description: "Broad operational access without owner-only platform control.",
    permissions: [
      Permission.GymRead,
      Permission.GymUpdate,
      Permission.LocationRead,
      Permission.LocationCreate,
      Permission.LocationUpdate,
      Permission.StaffDirectoryView,
      Permission.StaffRead,
      Permission.StaffInvite,
      Permission.StaffRoleAssign,
      Permission.MemberRead,
      Permission.MemberWrite,
      Permission.PlanRead,
      Permission.ClassRead,
      Permission.ClassWrite,
      Permission.BookingRead,
      Permission.BookingWrite,
      Permission.ReportRead
    ]
  },
  {
    key: "staff",
    label: "Basic staff",
    defaultName: "Staff",
    description: "General floor access for viewing members, locations, and bookings.",
    permissions: [
      Permission.GymRead,
      Permission.LocationRead,
      Permission.StaffDirectoryView,
      Permission.MemberRead,
      Permission.ClassRead,
      Permission.BookingRead
    ]
  },
  {
    key: "front_desk",
    label: "Front desk",
    defaultName: "Front Desk Lead",
    description: "Check-in, customer updates, bookings, and point-of-sale support.",
    permissions: [
      Permission.GymRead,
      Permission.LocationRead,
      Permission.StaffDirectoryView,
      Permission.MemberRead,
      Permission.MemberWrite,
      Permission.ClassRead,
      Permission.BookingRead,
      Permission.BookingWrite,
      Permission.AccessRead,
      Permission.PaymentRead,
      Permission.PaymentWrite
    ]
  },
  {
    key: "scheduler",
    label: "Scheduler",
    defaultName: "Schedule Coordinator",
    description: "Creates schedules, publishes shifts, and resolves employee scheduling requests.",
    permissions: [
      Permission.GymRead,
      Permission.StaffDirectoryView,
      Permission.StaffRead,
      Permission.ScheduleRead,
      Permission.ScheduleCreate,
      Permission.SchedulePublish,
      Permission.ScheduleRequestsManage,
      Permission.ScheduleAutoResolve
    ]
  },
  {
    key: "employee_visibility",
    label: "Employee visibility",
    defaultName: "Employee Visibility",
    description: "Read-only staff directory access with clocked-in status, without role assignment or removal controls.",
    permissions: [
      Permission.GymRead,
      Permission.StaffDirectoryView
    ]
  }
] as const;
const PERMISSION_DETAILS: Record<string, { label: string; description: string }> = {
  [Permission.GymRead]: {
    label: "Open the club dashboard",
    description: "Basic access to the signed-in gym."
  },
  [Permission.GymUpdate]: {
    label: "Edit club settings",
    description: "Change gym profile details and operating setup."
  },
  [Permission.LocationRead]: {
    label: "View locations",
    description: "See gym locations, rooms, and facility details."
  },
  [Permission.LocationCreate]: {
    label: "Add locations",
    description: "Create new locations or rooms."
  },
  [Permission.LocationUpdate]: {
    label: "Edit locations",
    description: "Update location details and active setup."
  },
  [Permission.LocationArchive]: {
    label: "Archive locations",
    description: "Remove old locations from active use."
  },
  [Permission.StaffDirectoryView]: {
    label: "View employee directory and clock status",
    description: "See staff names, roles, account status, and who is currently clocked in. Does not allow staff edits."
  },
  [Permission.StaffRead]: {
    label: "View staff roster",
    description: "See staff accounts, schedules, and team access."
  },
  [Permission.StaffInvite]: {
    label: "Create staff accounts",
    description: "Invite employees and set their starting role."
  },
  [Permission.StaffRoleAssign]: {
    label: "Manage staff roles and shifts",
    description: "Assign roles and create shifts for visible staff."
  },
  [Permission.StaffRemove]: {
    label: "Remove staff access",
    description: "Disable an employee's access to this gym."
  },
  [Permission.MemberRead]: {
    label: "View members and leads",
    description: "See customer, member, and lead profiles."
  },
  [Permission.MemberWrite]: {
    label: "Edit members and leads",
    description: "Create or update customer, member, and lead records."
  },
  [Permission.PlanRead]: {
    label: "View memberships and packages",
    description: "See plans, pricing, and service packages."
  },
  [Permission.PlanWrite]: {
    label: "Edit memberships and packages",
    description: "Create or update plans, prices, and packages."
  },
  [Permission.ClassRead]: {
    label: "View classes",
    description: "See class types, sessions, and training options."
  },
  [Permission.ClassWrite]: {
    label: "Edit classes",
    description: "Create or change class sessions and training options."
  },
  [Permission.BookingRead]: {
    label: "View bookings",
    description: "See reservations, waitlists, and attendance."
  },
  [Permission.BookingWrite]: {
    label: "Manage bookings",
    description: "Book, cancel, or update customer reservations."
  },
  [Permission.AccessRead]: {
    label: "View door and kiosk access",
    description: "See access devices, rules, and entry events."
  },
  [Permission.AccessWrite]: {
    label: "Manage door and kiosk access",
    description: "Edit access devices and entry rules."
  },
  [Permission.PaymentRead]: {
    label: "View sales and payments",
    description: "See point-of-sale activity and payment records."
  },
  [Permission.PaymentWrite]: {
    label: "Take payments",
    description: "Sell services, memberships, and other items."
  },
  [Permission.ReportRead]: {
    label: "View reports and payroll",
    description: "See reporting, hours worked, and payroll summaries."
  },
  [Permission.ScheduleRead]: {
    label: "View scheduler",
    description: "See coverage rules, availability, drafts, and schedule requests."
  },
  [Permission.ScheduleCreate]: {
    label: "Create schedules",
    description: "Create coverage rules, availability, and generated schedule drafts."
  },
  [Permission.SchedulePublish]: {
    label: "Publish schedules",
    description: "Turn generated drafts into staff shifts."
  },
  [Permission.ScheduleRequestsManage]: {
    label: "Manage schedule requests",
    description: "Review employee schedule complaints, swaps, and time-off requests."
  },
  [Permission.ScheduleAutoResolve]: {
    label: "Auto-resolve requests",
    description: "Let the system find and assign eligible replacements."
  }
};
const DEFAULT_SIGNATURE_REQUIREMENTS = [
  "Waiver",
  "Photo consent",
  "Billing agreement",
  "Emergency contact acknowledgment"
];

const MIGRATION_CHECKLIST_ITEMS = [
  {
    key: "memberList",
    label: "Member list",
    description: "Names, emails, phone numbers, birthdays, and member status."
  },
  {
    key: "activeMemberships",
    label: "Active memberships",
    description: "Current plans, start dates, renewal state, and cancellation dates."
  },
  {
    key: "billingDates",
    label: "Billing dates",
    description: "Next bill dates, renewal dates, and billing cycle timing."
  },
  {
    key: "paymentStatus",
    label: "Payment status",
    description: "Paid, failed, overdue, frozen, or comped account states."
  },
  {
    key: "attendanceHistory",
    label: "Attendance and check-in history",
    description: "Visits, check-ins, no-shows, and recent engagement patterns."
  },
  {
    key: "classSchedules",
    label: "Class schedules",
    description: "Class types, sessions, coaches, rooms, capacity, and recurrence."
  },
  {
    key: "appointments",
    label: "Appointments",
    description: "Personal training, consultations, tours, and booked services."
  },
  {
    key: "staffList",
    label: "Staff list",
    description: "Employees, trainers, front desk, managers, and contact info."
  },
  {
    key: "staffRoles",
    label: "Staff roles",
    description: "Positions, permission levels, schedule ownership, and payroll role."
  },
  {
    key: "waiversDocuments",
    label: "Waivers and documents",
    description: "Signed waivers, agreements, contracts, forms, and document status."
  },
  {
    key: "notesTags",
    label: "Notes and tags",
    description: "Internal notes, lead tags, member flags, and cancellation reasons."
  },
  {
    key: "productsPackages",
    label: "Products and packages",
    description: "Retail items, service packages, punch cards, and swim lessons."
  },
  {
    key: "paymentMethods",
    label: "Payment methods, if possible",
    description: "Cards or ACH tokens only when the old provider allows secure transfer."
  }
] as const;

const MIGRATION_SOURCE_TYPES = [
  { value: "unknown", label: "Not sure yet" },
  { value: "csv_excel", label: "CSV or Excel export" },
  { value: "pdf_document", label: "PDF or document export" },
  { value: "api_export", label: "API export or integration" },
  { value: "manual_entry", label: "Manual entry" },
  { value: "old_system_report", label: "Report from old software" },
  { value: "not_available", label: "Not available from old system" }
] as const;

const MIGRATION_UPLOAD_ACCEPT = ".csv,.tsv,.xlsx,.xls,.json,.txt,.pdf";
const MIGRATION_UPLOAD_MAX_FILES = 5;
const MIGRATION_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

const STUDIO_RESOURCE_TYPES = [
  { value: "sauna", label: "Sauna" },
  { value: "cold_plunge", label: "Cold plunge" },
  { value: "red_light", label: "Red light" },
  { value: "compression", label: "Compression" },
  { value: "float", label: "Float" },
  { value: "stretch_table", label: "Stretch table" },
  { value: "recovery_room", label: "Recovery room" },
  { value: "other", label: "Other" }
] as const;

const STUDIO_BUSINESS_TYPES = [
  "Recovery studio",
  "Gym",
  "Boutique fitness",
  "Personal training",
  "Wellness studio",
  "Martial arts",
  "Swim school",
  "Other"
] as const;

const STUDIO_SETUP_STEPS = [
  {
    key: "profile",
    label: "Create studio profile",
    description: "Name, business type, hours, buffer time, and revenue assumptions."
  },
  {
    key: "rooms_devices",
    label: "Add rooms/devices",
    description: "Create the rooms, recovery devices, or equipment that can be booked."
  },
  {
    key: "services",
    label: "Add services",
    description: "Add services, memberships, packages, or recovery programs."
  },
  {
    key: "first_csv",
    label: "Upload first CSV",
    description: "Bring in clients, bookings, services, payments, or room/device data."
  },
  {
    key: "first_revenue_plan",
    label: "Generate first revenue plan",
    description: "Create a weekly action plan from the data you have available."
  }
] as const;

const STUDIO_DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" }
] as const;

type StudioResourceType = (typeof STUDIO_RESOURCE_TYPES)[number]["value"];
type StudioSetupStep = (typeof STUDIO_SETUP_STEPS)[number]["key"];

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
  operatingHours?: Record<string, Array<{ opensAt: string; closesAt: string }>>;
  logoUrl?: string;
  stripeAccountId?: string;
  brandColors?: { primary: string; secondary?: string; accent?: string };
  businessInfo?: { email?: string; phone?: string; website?: string };
  studioSettings?: {
    businessType?: string;
    defaultBufferMinutes?: number;
    averageSessionPriceCents?: number;
    softwareMonthlyCostCents?: number;
    targetMonthlyRevenueCents?: number;
    resourceTypesUsed?: StudioResourceType[];
  };
  setupWizard?: {
    currentStep?: StudioSetupStep;
    completedSteps?: StudioSetupStep[];
    completedAt?: string;
  };
  migrationChecklist?: {
    currentSoftware?: string;
    notes?: string;
    items: Partial<Record<(typeof MIGRATION_CHECKLIST_ITEMS)[number]["key"], boolean>>;
    details?: Partial<
      Record<
        (typeof MIGRATION_CHECKLIST_ITEMS)[number]["key"],
        {
          sourceType: (typeof MIGRATION_SOURCE_TYPES)[number]["value"];
          sourceName?: string;
          fieldNotes?: string;
          importNotes?: string;
          uploads?: {
            fileName: string;
            contentType: string;
            sizeBytes: number;
            base64Data: string;
            textPreview?: string;
          }[];
        }
      >
    >;
  };
}

interface StripeConnectAccountRecord {
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

interface StripeConnectSessionRecord {
  clientSecret: string;
  stripeAccountId: string;
  expiresAt: number;
  components: {
    accountOnboarding: boolean;
    notificationBanner: boolean;
    accountManagement: boolean;
    balances: boolean;
    payouts: boolean;
    payments: boolean;
  };
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

interface ResourceRecord {
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

interface FacilityReservationRecord {
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
  paymentReference?: string;
  note?: string;
}

interface ResourceAllocationRecord {
  id: string;
  gymId: string;
  resourceId: string;
  source: string;
  classSessionId?: string;
  facilityReservationId?: string;
  startsAt: string;
  endsAt: string;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  staffOverride: boolean;
  overrideReason?: string;
}

interface ResourceAllocationListResponse {
  allocations?: ResourceAllocationRecord[];
}

interface RoleRecord {
  id: string;
  name: string;
  permissions: string[];
  parentRoleId?: string;
  createsReservableResource?: boolean;
  isSystem?: boolean;
}

interface StaffRoleTemplateOption {
  key: string;
  label: string;
  defaultName: string;
  description: string;
  permissions: string[];
  source: "starter" | "saved";
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

interface ResourceListResponse {
  resources: ResourceRecord[];
}

interface FacilityReservationListResponse {
  reservations: FacilityReservationRecord[];
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
  recordStatus?: ConsumerRecordStatus;
  leadStage?: LeadStage;
  segments?: ConsumerSegment[];
  isLead?: boolean;
  isCustomer?: boolean;
  isMember?: boolean;
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

type CrmActivityType =
  | "note"
  | "call"
  | "email"
  | "text"
  | "reply"
  | "tour_booked"
  | "tour_completed"
  | "trial_started"
  | "trial_attended"
  | "follow_up"
  | "follow_up_outcome"
  | "cancellation_reason";

interface CrmActivityRecord {
  id: string;
  gymId: string;
  consumerId: string;
  type: CrmActivityType;
  title: string;
  description?: string;
  outcome?: string;
  occurredAt: string;
  followUpAt?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
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

interface StaffShiftRecord {
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

interface StaffTimeEntryRecord {
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

interface ConsumerListResponse {
  consumers: MemberRecord[];
}

interface MigrationMemberCsvUpload {
  fileName: string;
  contentType?: string;
  base64Data: string;
  delimiter: "auto" | "comma" | "tab";
  mapping?: Record<string, string>;
}

interface MigrationMemberCsvPreviewRow {
  rowNumber: number;
  source: Record<string, string>;
  input?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    barcode?: string;
    status?: MemberStatus;
    leadStage?: LeadStage;
    notes?: string;
    tagNames?: string[];
  };
  valid: boolean;
  warnings: string[];
  errors: string[];
}

interface MigrationMemberCsvPreviewResponse {
  delimiter: "comma" | "tab";
  headers: string[];
  mapping: Record<string, string>;
  rows: MigrationMemberCsvPreviewRow[];
  summary: {
    totalRows: number;
    validRows: number;
    skippedRows: number;
    warningRows: number;
    previewedRows: number;
    importedRows?: number;
  };
  imported?: Array<{ rowNumber: number; consumer: MemberRecord }>;
  skipped?: Array<{ rowNumber: number; reason: string }>;
}

interface MigrationMemberCsvAiMappingResponse {
  available: boolean;
  provider: "openai" | "deterministic";
  model?: string;
  category: string;
  confidence: number;
  mapping: Record<string, string>;
  warnings: string[];
  notes: string[];
  preview: MigrationMemberCsvPreviewResponse;
}

type CampaignImportType = (typeof CAMPAIGN_IMPORT_TYPES)[number]["value"];
type CampaignLayerPageKey = (typeof CAMPAIGN_LAYER_PAGES)[number]["key"];
type GeneratedCampaignType = (typeof CAMPAIGN_GENERATOR_TYPES)[number]["value"];

interface CampaignImportExpectedField {
  field: string;
  label: string;
  description: string;
  required?: boolean;
}

interface CampaignCsvUpload {
  importType: CampaignImportType;
  fileName: string;
  contentType?: string;
  base64Data: string;
  delimiter: "auto" | "comma" | "tab";
}

interface CampaignCsvMappingSuggestion {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  sampleValues: string[];
}

interface CampaignCsvPreviewResponse {
  importType: CampaignImportType;
  fileName: string;
  delimiter: "comma" | "tab";
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, string>[];
  expectedFields: CampaignImportExpectedField[];
  targetFields: string[];
  suggestedMappings: CampaignCsvMappingSuggestion[];
}

interface CampaignImportBatchRecord {
  id: string;
  gymId: string;
  importType: CampaignImportType;
  originalFilename: string;
  rowCount: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  mappingsJson: Record<string, string>;
  sampleRowsJson: Record<string, string>[];
  summaryJson: Record<string, unknown>;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignImportConfirmResponse {
  batch: CampaignImportBatchRecord;
  summary: {
    importType: CampaignImportType;
    rowsImported: number;
    rowsSkipped: number;
    rowsWithWarnings: number;
    rowsWithErrors: number;
    totalRows: number;
  };
}

interface GeneratedCampaignRecord {
  id: string;
  gymId: string;
  campaignType: GeneratedCampaignType;
  name: string;
  targetSegment: string;
  smsMessage: string;
  emailSubject: string;
  emailBody: string;
  recommendedSendTime: string;
  expectedGoal: string;
  estimatedRevenueCents: number;
  status: "draft" | "ready" | "queued" | "sent" | "archived";
  deliveryJson: Record<string, unknown>;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

interface GeneratedCampaignsResponse {
  campaigns: GeneratedCampaignRecord[];
}

interface GeneratedCampaignResponse {
  campaign: GeneratedCampaignRecord;
}

interface PremiumRecoveryProgramInput {
  title: string;
  description: string;
  targetAudience: string;
  includedServices: string[];
  recommendedPriceCents: number;
  capacity: number;
  schedule: string;
  durationWeeks: number;
  campaignCopy: string;
  postProgramUpsell: string;
  sourceJson?: Record<string, unknown>;
}

interface PremiumRecoveryProgramRecord extends PremiumRecoveryProgramInput {
  id: string;
  gymId: string;
  status: "draft" | "active" | "archived";
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

interface PremiumRecoveryProgramSuggestion extends PremiumRecoveryProgramInput {
  reason: string;
}

interface PremiumRecoveryProgramsResponse {
  programs: PremiumRecoveryProgramRecord[];
}

interface PremiumRecoveryProgramSuggestionsResponse {
  suggestions: PremiumRecoveryProgramSuggestion[];
  services: Array<{ name: string; category: string; priceCents: number }>;
}

interface PremiumRecoveryProgramResponse {
  program: PremiumRecoveryProgramRecord;
}

interface WeeklyRevenuePlanClientRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  reason: string;
}

interface WeeklyRevenuePlanResourceRecord {
  id: string;
  name: string;
  type: string;
  weakestTimeBlock: string;
  utilizationPercentage: number;
}

interface WeeklyRevenuePlanCampaignRecord {
  name: string;
  targetSegment: string;
  smsMessage: string;
  emailSubject: string;
  emailBody: string;
}

interface WeeklyRevenuePlanProgramIdeaRecord {
  title: string;
  description: string;
  schedule: string;
  recommendedPriceCents: number;
}

interface WeeklyRevenuePlanActionRecord {
  id: string;
  title: string;
  description: string;
  estimatedRevenueCents: number;
  ownerNote: string;
  campaign?: WeeklyRevenuePlanCampaignRecord;
  clients: WeeklyRevenuePlanClientRecord[];
  resources: WeeklyRevenuePlanResourceRecord[];
  premiumProgramIdea?: WeeklyRevenuePlanProgramIdeaRecord;
  done: boolean;
  completedAt?: string;
}

interface WeeklyRevenuePlanRecord {
  id: string;
  gymId: string;
  weekStartDate: string;
  summary: string;
  revenueLeaks: string[];
  totalEstimatedRevenueCents: number;
  actions: WeeklyRevenuePlanActionRecord[];
  sourceJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface WeeklyRevenuePlanResponse {
  plan: WeeklyRevenuePlanRecord;
}

interface RoiTrackingEntryRecord {
  id: string;
  gymId: string;
  sourceType: "campaign" | "weekly_action";
  sourceId: string;
  sourceLabel: string;
  bookingsGenerated: number;
  revenueGeneratedCents: number;
  membershipsSold: number;
  packagesSold: number;
  notes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

interface RoiTrackingSummary {
  totalRevenueGeneratedCents: number;
  revenueGeneratedThisMonthCents: number;
  topCampaignByRevenue: {
    sourceId: string;
    sourceLabel: string;
    revenueGeneratedCents: number;
  } | null;
  monthlySoftwareCostCents: number;
  estimatedRoiPercent: number;
  bookingsGenerated: number;
  membershipsSold: number;
  packagesSold: number;
}

interface RoiTrackingResponse {
  entries: RoiTrackingEntryRecord[];
  summary: RoiTrackingSummary;
}

interface RoiTrackingCreateResponse {
  entry: RoiTrackingEntryRecord;
  summary: RoiTrackingSummary;
}

interface CampaignRevenueAction {
  rank: number;
  category: string;
  action: string;
  detail: string;
  audience: number;
  impactCents: number;
}

type RevenueOpportunityType =
  | "UNDERUSED_RESOURCE"
  | "UNUSED_CREDITS"
  | "INACTIVE_MEMBER"
  | "FIRST_VISIT_NOT_CONVERTED"
  | "HIGH_USAGE_UPGRADE"
  | "UNDERUSED_SERVICE"
  | "PREMIUM_PROGRAM_OPPORTUNITY";

interface RevenueOpportunityRecord {
  id: string;
  gymId: string;
  type: RevenueOpportunityType;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  estimatedRevenue: number;
  estimatedRevenueCents: number;
  recommendedAction: string;
  evidence: Record<string, unknown>;
  createdAt: string;
}

interface RevenueOpportunityResponse {
  generatedAt: string;
  window: {
    from: string;
    to: string;
  };
  opportunities: RevenueOpportunityRecord[];
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
    estimatedRevenueCents: number;
    byType: Record<RevenueOpportunityType, number>;
  };
}

interface RoomDeviceUtilizationRecord {
  id: string;
  name: string;
  type: string;
  bookedHoursThisWeek: number;
  availableHoursThisWeek: number;
  utilizationPercentage: number;
  estimatedRevenue: number;
  estimatedRevenueCents: number;
  estimatedMissedRevenue: number;
  estimatedMissedRevenueCents: number;
  busiestDay: string;
  weakestDay: string;
  weakestTimeBlock: string;
  bookingCount: number;
  serviceCategories: string[];
}

interface RoomDeviceUtilizationResponse {
  generatedAt: string;
  window: {
    from: string;
    to: string;
  };
  resources: RoomDeviceUtilizationRecord[];
  summary: {
    bookedHours: number;
    availableHours: number;
    utilizationPercentage: number;
    estimatedRevenueCents: number;
    estimatedMissedRevenueCents: number;
    resourceCount: number;
  };
  filters: {
    resourceTypes: string[];
    serviceCategories: string[];
  };
}

type CampaignClientSegmentKey =
  | "inactive_members"
  | "unused_credit_members"
  | "first_time_visitors"
  | "high_value_clients"
  | "upsell_candidates"
  | "review_candidates";

interface CampaignClientSegmentRow {
  id: string;
  clientName: string;
  email?: string;
  phone?: string;
  lastVisitDate?: string;
  totalSpend: number;
  totalSpendCents: number;
  membershipStatus: string;
  recommendedAction: string;
  evidence: Record<string, unknown>;
}

interface CampaignClientSegment {
  key: CampaignClientSegmentKey;
  label: string;
  description: string;
  count: number;
  clients: CampaignClientSegmentRow[];
}

interface CampaignClientSegmentsResponse {
  generatedAt: string;
  averageClientSpend: number;
  averageClientSpendCents: number;
  segments: CampaignClientSegment[];
  summary: {
    totalClients: number;
    totalSegmentMatches: number;
  };
}

interface CampaignResourceUtilization {
  id: string;
  name: string;
  resourceType?: string;
  utilizationPercent: number;
  useCount: number;
}

interface CampaignLayerMetrics {
  estimatedMissedRevenueCents: number;
  averagePlanValueCents: number;
  activeMembers: MemberRecord[];
  inactiveMembers: MemberRecord[];
  unusedCreditMembers: MemberRecord[];
  firstTimeVisitorsNotConverted: MemberRecord[];
  resources: CampaignResourceUtilization[];
  underusedResources: CampaignResourceUtilization[];
  actions: CampaignRevenueAction[];
}

type MigrationFileType =
  | "members"
  | "staff"
  | "membership_plans"
  | "classes"
  | "attendance"
  | "billing"
  | "appointments"
  | "unknown";

interface MigrationBatchRecord {
  id: string;
  gymId: string;
  status: string;
  createdByUserId: string;
  approvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  finalizedAt?: string;
  summaryJson: Record<string, unknown>;
}

interface MigrationFileRecord {
  id: string;
  migrationBatchId: string;
  originalFilename: string;
  storedFilePath: string;
  contentType: string;
  sizeBytes: number;
  fileType: MigrationFileType;
  detectedFileType?: MigrationFileType;
  fileTypeConfidence?: number;
  detectionReason?: string;
  columnHeaders: string[];
  sampleRows: Record<string, string>[];
  rowCount: number;
  status: "uploaded" | "detecting" | "needs_review" | "confirmed" | "deleted";
  createdAt: string;
  updatedAt: string;
}

interface MigrationColumnMappingRecord {
  id: string;
  migrationBatchId: string;
  migrationFileId: string;
  sourceColumn: string;
  targetField?: string;
  confidence?: number;
  approved: boolean;
  approvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

interface MigrationMappingIssue {
  severity: "warning" | "critical";
  code: string;
  message: string;
  sourceColumn?: string;
  targetField?: string;
}

interface MigrationColumnMappingResponse {
  file: MigrationFileRecord;
  targetFields: string[];
  mappings: MigrationColumnMappingRecord[];
  issues: MigrationMappingIssue[];
  requiresHumanReview: boolean;
}

type MigrationStagedMemberValidationStatus = "pending" | "ready" | "warnings" | "critical" | "skipped";

interface MigrationStagedMemberRecord {
  id: string;
  migrationBatchId: string;
  migrationFileId: string;
  sourceRowNumber: number;
  sourceRowJson: Record<string, string>;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  membershipStatus?: string;
  membershipPlanName?: string;
  startDate?: string;
  cancellationDate?: string;
  nextBillingDate?: string;
  assignedTrainerName?: string;
  notes?: string;
  tagsJson: string[];
  duplicateGroupId?: string;
  validationStatus: MigrationStagedMemberValidationStatus;
  approved: boolean;
  importedMemberId?: string;
  createdAt: string;
  updatedAt: string;
}

interface MigrationValidationErrorRecord {
  id: string;
  migrationBatchId: string;
  migrationFileId: string;
  stagedRecordType: string;
  stagedRecordId?: string;
  severity: "info" | "warning" | "critical";
  errorCode: string;
  message: string;
  fieldName?: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MigrationStagedMembersResponse {
  file: MigrationFileRecord;
  stagedMembers: MigrationStagedMemberRecord[];
  validationErrors: MigrationValidationErrorRecord[];
  summary: {
    total: number;
    ready: number;
    warnings: number;
    critical: number;
    skipped: number;
    approved: number;
    validationErrors: number;
  };
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

interface StaffShiftListResponse {
  shifts: StaffShiftRecord[];
}

interface StaffTimeEntryListResponse {
  entries: StaffTimeEntryRecord[];
}

interface SchedulerCoverageRuleRecord {
  id: string;
  gymId: string;
  name: string;
  locationId?: string;
  roleId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  requiredStaff: number;
}

interface SchedulerAvailabilityRecord {
  id: string;
  gymId: string;
  userId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  preference: "available" | "preferred" | "unavailable";
  notes?: string;
}

interface SchedulerSettingsRecord {
  gymId: string;
  planningHorizonDays: number;
}

interface SchedulerPreferenceRequestRecord {
  id: string;
  gymId: string;
  userId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  preference: "available" | "preferred" | "unavailable";
  notes?: string;
  status: "open" | "approved" | "declined";
  resolutionNote?: string;
  createdAt: string;
}

interface SchedulerRequestRecord {
  id: string;
  gymId: string;
  userId: string;
  shiftId?: string;
  requestType: "time_off" | "swap" | "complaint";
  message: string;
  status: "open" | "resolved" | "declined";
  suggestedReplacementUserId?: string;
  resolutionNote?: string;
  createdAt: string;
}

interface ScheduleDraftAssignmentRecord {
  id: string;
  ruleId: string;
  date: string;
  userId?: string;
  roleId: string;
  locationId?: string;
  startsAt: string;
  endsAt: string;
  score: number;
  reason: string;
  warnings: string[];
}

interface ScheduleDraftRecord {
  startsOn: string;
  endsOn: string;
  assignments: ScheduleDraftAssignmentRecord[];
  warnings: string[];
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

type PosPurchaseResult =
  | { consumer: MemberRecord; membership?: { id: string }; anonymousSale?: false }
  | { anonymousSale: true; buyerName: string; membership?: never; consumer?: never };

type PosPurchaseRequest = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  amountCents: number;
  paymentMethod: StripePaymentMethod;
  note?: string;
  receiptEmail?: string;
  planId?: string;
};

type PosTerminalConnectionState = "not_connected" | "connecting" | "connected";
type PosTerminalPaymentState = "not_ready" | "ready" | "waiting_for_input" | "processing";

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
  resources: ResourceRecord[];
  selectedLocationId: string;
  platformGyms: GymRecord[];
  platformGymDirectoryLoaded: boolean;
  platformAccessDenied: boolean;
  members: MemberRecord[];
  staff: StaffRecord[];
  plans: PlanRecord[];
  classTypes: ClassTypeRecord[];
  selectedClassSessionId: string;
  classBookings: ClassBookingRecord[];
  classResourceAllocations: ResourceAllocationRecord[];
  facilityReservations: FacilityReservationRecord[];
  selectedReservationAgendaItemId: string;
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
  consumerSegment: ConsumerSegmentFilter;
  memberCsvImport?: MigrationMemberCsvUpload;
  memberCsvPreview?: MigrationMemberCsvPreviewResponse;
  memberCsvAiSuggestion?: MigrationMemberCsvAiMappingResponse;
  migrationBatches: MigrationBatchRecord[];
  migrationFiles: MigrationFileRecord[];
  migrationColumnMappings: Record<string, MigrationColumnMappingRecord[]>;
  migrationMappingIssues: Record<string, MigrationMappingIssue[]>;
  migrationMappingTargetFields: Record<string, string[]>;
  migrationStagedMembers: Record<string, MigrationStagedMemberRecord[]>;
  migrationValidationErrors: Record<string, MigrationValidationErrorRecord[]>;
  migrationStagedMemberFilter: "all" | "ready" | "warnings" | "critical";
  selectedMigrationBatchId: string;
  migrationAssistantStep: "upload" | "detect" | "map" | "stage";
  campaignImportType: CampaignImportType;
  campaignImportUpload?: CampaignCsvUpload;
  campaignImportPreview?: CampaignCsvPreviewResponse;
  campaignImportSummary?: CampaignImportConfirmResponse["summary"];
  campaignImports: CampaignImportBatchRecord[];
  generatedCampaigns: GeneratedCampaignRecord[];
  campaignGeneratorType: GeneratedCampaignType;
  premiumRecoveryPrograms: PremiumRecoveryProgramRecord[];
  premiumRecoveryProgramSuggestions: PremiumRecoveryProgramSuggestion[];
  weeklyRevenuePlan?: WeeklyRevenuePlanRecord;
  roiTrackingEntries: RoiTrackingEntryRecord[];
  roiTrackingSummary?: RoiTrackingSummary;
  revenueOpportunities: RevenueOpportunityRecord[];
  roomDeviceUtilization?: RoomDeviceUtilizationResponse;
  campaignClientSegments?: CampaignClientSegmentsResponse;
  selectedCampaignClientSegment: CampaignClientSegmentKey;
  campaignUtilizationFrom: string;
  campaignUtilizationTo: string;
  campaignUtilizationResourceType: string;
  campaignUtilizationServiceCategory: string;
  campaignLayerPage: CampaignLayerPageKey;
  roles: RoleRecord[];
  selectedRoleId: string;
  staffShifts: StaffShiftRecord[];
  staffTimeEntries: StaffTimeEntryRecord[];
  schedulerSettings: SchedulerSettingsRecord | null;
  schedulerRules: SchedulerCoverageRuleRecord[];
  schedulerAvailability: SchedulerAvailabilityRecord[];
  mySchedulerAvailability: SchedulerAvailabilityRecord[];
  schedulerPreferenceRequests: SchedulerPreferenceRequestRecord[];
  mySchedulerPreferenceRequests: SchedulerPreferenceRequestRecord[];
  schedulerRequests: SchedulerRequestRecord[];
  mySchedulerRequests: SchedulerRequestRecord[];
  schedulerDraft?: ScheduleDraftRecord;
  staffAccessSearch: string;
  staffAccessRoleFilter: string;
  staffAuthTreeExpandedRoleIds: string[];
  staffScheduleCalendarOpen: boolean;
  staffScheduleCalendarMonth: string;
  staffScheduleRequestModalOpen: boolean;
  staffPreferenceRequestModalOpen: boolean;
  staffClockModalOpen: boolean;
  staffRemovalUserId?: string;
  banner?: { tone: BannerTone; text: string };
  publicSuccess?: string;
  // Dashboard sub-views
  dashboardView:
    | "home"
    | "consumers"
    | "customers"
    | "customer_profile"
    | "customer_edit"
    | "leads"
    | "staff"
    | "scheduler"
    | "pos"
    | "plans"
    | "locations"
    | "classes"
    | "bookings"
    | "personal_training"
    | "access_control"
    | "contracts"
    | "member_portal"
    | "migration"
    | "campaign_layer"
    | "weekly_plan"
    | "roi_tracking"
    | "marketing"
    | "reports"
    | "settings"
    | "check_in"
    | "check_in_history";
  checkInRailExpanded: boolean;
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
  cameraCapture?: {
    formId: string;
    inputName: string;
    label: string;
    error?: string;
  };
  checkInDebug?: {
    title: string;
    message: string;
    details: string[];
  };
  checkInHistory: CheckInRecord[];
  memberCache: Record<string, { memberships: MemberMembershipRecord[]; checkIns: CheckInRecord[]; crmActivities: CrmActivityRecord[] }>;
  memberDesk: MemberDeskStore;
  posStripeConfig?: { enabled: boolean; publishableKey?: string };
  posTerminalConnectionState: PosTerminalConnectionState;
  posTerminalPaymentState: PosTerminalPaymentState;
  posTerminalReaderLabel?: string;
  posTerminalSimulated: boolean;
  stripeConnectAccount?: StripeConnectAccountRecord;
  stripeConnectSession?: StripeConnectSessionRecord;
  stripeConnectEmbeddedOpen: boolean;
}

const initialRoute = readRoute();
const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

const initialCampaignUtilizationRange = campaignDefaultUtilizationRange();

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
  resources: [],
  selectedLocationId: "",
  platformGyms: [],
  platformGymDirectoryLoaded: false,
  platformAccessDenied: false,
  members: [],
  staff: [],
  plans: [],
  classTypes: [],
  selectedClassSessionId: "",
  classBookings: [],
  classResourceAllocations: [],
  facilityReservations: [],
  selectedReservationAgendaItemId: "",
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
  consumerSegment: initialRoute.consumerSegment ?? "all",
  memberCsvImport: undefined,
  memberCsvPreview: undefined,
  memberCsvAiSuggestion: undefined,
  migrationBatches: [],
  migrationFiles: [],
  migrationColumnMappings: {},
  migrationMappingIssues: {},
  migrationMappingTargetFields: {},
  migrationStagedMembers: {},
  migrationValidationErrors: {},
  migrationStagedMemberFilter: "all",
  selectedMigrationBatchId: "",
  migrationAssistantStep: "upload",
  campaignImportType: "clients",
  campaignImportUpload: undefined,
  campaignImportPreview: undefined,
  campaignImportSummary: undefined,
  campaignImports: [],
  generatedCampaigns: [],
  campaignGeneratorType: "unused_credit_reminder",
  premiumRecoveryPrograms: [],
  premiumRecoveryProgramSuggestions: [],
  weeklyRevenuePlan: undefined,
  roiTrackingEntries: [],
  roiTrackingSummary: undefined,
  revenueOpportunities: [],
  roomDeviceUtilization: undefined,
  campaignClientSegments: undefined,
  selectedCampaignClientSegment: "inactive_members",
  campaignUtilizationFrom: initialCampaignUtilizationRange.from,
  campaignUtilizationTo: initialCampaignUtilizationRange.to,
  campaignUtilizationResourceType: "",
  campaignUtilizationServiceCategory: "",
  campaignLayerPage: initialRoute.campaignLayerPage ?? "dashboard",
  roles: [],
  selectedRoleId: "",
  staffShifts: [],
  staffTimeEntries: [],
  schedulerSettings: null,
  schedulerRules: [],
  schedulerAvailability: [],
  mySchedulerAvailability: [],
  schedulerPreferenceRequests: [],
  mySchedulerPreferenceRequests: [],
  schedulerRequests: [],
  mySchedulerRequests: [],
  schedulerDraft: undefined,
  staffAccessSearch: "",
  staffAccessRoleFilter: "",
  staffAuthTreeExpandedRoleIds: [],
  staffScheduleCalendarOpen: false,
  staffScheduleCalendarMonth: toMonthKey(new Date()),
  staffScheduleRequestModalOpen: false,
  staffPreferenceRequestModalOpen: false,
  staffClockModalOpen: false,
  staffRemovalUserId: undefined,
  dashboardView: initialRoute.dashboardView,
  checkInRailExpanded: initialRoute.checkInRailExpanded,
  checkInBarcode: "",
  checkInHistory: [],
  cameraCapture: undefined,
  checkInDebug: undefined,
  checkInReview: undefined,
  memberCache: {},
  memberDesk: loadMemberDeskStore(),
  posStripeConfig: undefined,
  posTerminalConnectionState: "not_connected",
  posTerminalPaymentState: "not_ready",
  posTerminalReaderLabel: undefined,
  posTerminalSimulated: true,
  stripeConnectAccount: undefined,
  stripeConnectSession: undefined,
  stripeConnectEmbeddedOpen: false,
};

const pendingCameraPhotos = new Map<string, { file: File; previewUrl: string }>();
let activeCameraStream: MediaStream | undefined;
let activeCameraSessionKey: string | undefined;
let cameraStartPromise: Promise<void> | undefined;
let stripePromise: Promise<Stripe | null> | undefined;
let stripePromiseKey: string | undefined;
let stripeElements: StripeElements | undefined;
let stripeCardElement: StripeCardElement | undefined;
let stripeCardThemeKey: string | undefined;
let stripeTerminalPromise: Promise<Awaited<ReturnType<typeof loadStripeTerminal>> | null> | undefined;
let stripeTerminalInstance: ReturnType<NonNullable<Awaited<ReturnType<typeof loadStripeTerminal>>>["create"]> | undefined;
let stripeConnectInstance: StripeConnectInstance | undefined;
let stripeConnectInstanceKey: string | undefined;

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

let staffClockTimerInterval: number | undefined;

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
  if (state.session) {
    await refreshDashboard();
    if (!gymSlugMatch) {
      await refreshPlatformGymDirectory();
    }
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
  if (!state.session) {
    state.platformGyms = [];
    state.platformGymDirectoryLoaded = false;
    state.platformAccessDenied = false;
    return;
  }
  try {
    const gymsData = (await client.listGyms()) as { gyms: GymRecord[] };
    state.platformGyms = gymsData.gyms || [];
    state.platformGymDirectoryLoaded = true;
    state.platformAccessDenied = false;
  } catch (error) {
    state.platformGyms = [];
    state.platformGymDirectoryLoaded = false;
    state.platformAccessDenied = error instanceof ApiError && (error.status === 401 || error.status === 403);
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

function currentGymSlugFromUrl() {
  return new URLSearchParams(window.location.search).get("gymSlug")?.trim().toLowerCase() ?? "";
}

function isPlatformAdminRoute() {
  return new URLSearchParams(window.location.search).get("admin") === "1";
}

function isNewGymSignupRoute() {
  return new URLSearchParams(window.location.search).get("createGym") === "1";
}

async function refreshDashboard(options: { silent?: boolean; renderAfter?: boolean } | boolean = {}) {
  if (!state.session) {
    return;
  }
  const normalizedOptions = typeof options === "boolean" ? { silent: !options } : options;
  const showLoading = !normalizedOptions.silent;
  const shouldRenderAfter = normalizedOptions.renderAfter ?? true;
  if (showLoading) {
    state.dashboardLoading = true;
    render();
  }
  try {
    const me = (await client.me()) as MeResponse;
    state.me = me;
    state.gym = me.activeGym ?? me.memberships[0]?.gym ?? null;
    const requestedGymSlug = currentGymSlugFromUrl();
    if (requestedGymSlug && state.gym?.slug !== requestedGymSlug) {
      clearDashboardState();
      state.publicSlug = requestedGymSlug;
      localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, requestedGymSlug);
      setBanner("error", `That login does not have access to ${state.publicGym?.name ?? requestedGymSlug}.`);
      return;
    }
    if (state.gym) {
      const canReadMembers = hasPermission(Permission.MemberRead);
      const canReadPlans = hasPermission(Permission.PlanRead);
      const canReadLocations = hasPermission(Permission.LocationRead);
      const canReadClasses = hasPermission(Permission.ClassRead);
      const canReadBookings = hasPermission(Permission.BookingRead);
      const canReadStaff = hasPermission(Permission.StaffRead);
      const canViewStaffDirectory =
        canReadStaff || hasPermission(Permission.StaffDirectoryView);
      const canReadOwnShifts = hasPermission(Permission.GymRead);
      const canReadAccess = hasPermission(Permission.AccessRead);
      const canReadScheduler = hasPermission(Permission.ScheduleRead);
      const canManageMigration = hasPermission(Permission.GymUpdate);
      const [gymSettings, consumers, plans, locations, checkIns, classTypes] = (await Promise.all([
        client.getGym(state.gym.id) as Promise<GymRecord>,
        loadPermittedDashboardData(
          canReadMembers,
          () => client.listConsumers(state.gym!.id) as Promise<ConsumerListResponse>,
          { consumers: [] }
        ),
        loadPermittedDashboardData(
          canReadPlans,
          () => client.listMembershipPlans(state.gym!.id) as Promise<PlanListResponse>,
          { plans: [] }
        ),
        loadPermittedDashboardData(
          canReadLocations,
          () => client.listLocations(state.gym!.id) as Promise<LocationListResponse>,
          { locations: [] }
        ),
        loadPermittedDashboardData(
          canReadMembers,
          () => client.listCheckIns(state.gym!.id) as Promise<{ checkIns?: CheckInRecord[] } | CheckInRecord[]>,
          { checkIns: [] }
        ),
        loadPermittedDashboardData(
          canReadClasses,
          () => client.listClassTypes(state.gym!.id) as Promise<ClassTypeListResponse>,
          { classTypes: [] }
        )
      ])) as [
        GymRecord,
        ConsumerListResponse,
        PlanListResponse,
        LocationListResponse,
        { checkIns?: CheckInRecord[] } | CheckInRecord[],
        ClassTypeListResponse
      ];
      state.gym = gymSettings;
      const consumerRecords = resolveConsumerRecords(consumers.consumers);
      state.members = consumerRecords;
      state.plans = plans.plans;
      state.locations = locations.locations;
      const resources = (await loadPermittedDashboardData(
        canReadLocations,
        () => client.listResources(state.gym!.id) as Promise<ResourceListResponse>,
        { resources: [] }
      )) as ResourceListResponse;
      state.resources = resources.resources ?? [];
      const facilityReservations = (await loadPermittedDashboardData(
        canReadBookings,
        () => client.listFacilityReservations(state.gym!.id) as Promise<FacilityReservationListResponse>,
        { reservations: [] }
      )) as FacilityReservationListResponse;
      state.facilityReservations = facilityReservations.reservations ?? [];
      state.classTypes = classTypes.classTypes;
      if (canManageMigration) {
        const migrationBatches = (await client.listMigrationBatches(state.gym.id)) as { batches: MigrationBatchRecord[] };
        state.migrationBatches = migrationBatches.batches ?? [];
        const selectedBatchId =
          state.selectedMigrationBatchId && state.migrationBatches.some((batch) => batch.id === state.selectedMigrationBatchId)
            ? state.selectedMigrationBatchId
            : state.migrationBatches[0]?.id ?? "";
        state.selectedMigrationBatchId = selectedBatchId;
        if (selectedBatchId) {
          const migrationFiles = (await client.listMigrationFiles(state.gym.id, selectedBatchId)) as { files: MigrationFileRecord[] };
          state.migrationFiles = migrationFiles.files ?? [];
          if (state.migrationAssistantStep === "map") {
            await loadMigrationColumnMappings(selectedBatchId);
          } else if (state.migrationAssistantStep === "stage") {
            await loadMigrationColumnMappings(selectedBatchId);
            await loadMigrationStagedMembers(selectedBatchId);
          } else {
            state.migrationColumnMappings = {};
            state.migrationMappingIssues = {};
            state.migrationMappingTargetFields = {};
            state.migrationStagedMembers = {};
            state.migrationValidationErrors = {};
          }
        } else {
          state.migrationFiles = [];
          state.migrationColumnMappings = {};
          state.migrationMappingIssues = {};
          state.migrationMappingTargetFields = {};
          state.migrationStagedMembers = {};
          state.migrationValidationErrors = {};
        }
      } else {
        state.migrationBatches = [];
        state.migrationFiles = [];
        state.migrationColumnMappings = {};
        state.migrationMappingIssues = {};
        state.migrationMappingTargetFields = {};
        state.migrationStagedMembers = {};
        state.migrationValidationErrors = {};
        state.selectedMigrationBatchId = "";
      }
      const campaignImports = (await loadPermittedDashboardData(
        canManageMigration,
        () => client.listCampaignImports(state.gym!.id) as Promise<{ imports?: CampaignImportBatchRecord[] }>,
        { imports: [] }
      )) as { imports?: CampaignImportBatchRecord[] };
      state.campaignImports = campaignImports.imports ?? [];
      const revenueOpportunities = (await loadPermittedDashboardData(
        canManageMigration,
        () => client.listRevenueOpportunities(state.gym!.id) as Promise<RevenueOpportunityResponse>,
        { opportunities: [] }
      )) as Partial<RevenueOpportunityResponse>;
      state.revenueOpportunities = revenueOpportunities.opportunities ?? [];
      const roomDeviceUtilization = (await loadPermittedDashboardData(
        canManageMigration,
        () =>
          client.listRoomDeviceUtilization(state.gym!.id, {
            from: state.campaignUtilizationFrom,
            to: state.campaignUtilizationTo,
            resourceType: state.campaignUtilizationResourceType,
            serviceCategory: state.campaignUtilizationServiceCategory
          }) as Promise<RoomDeviceUtilizationResponse>,
        undefined
      )) as RoomDeviceUtilizationResponse | undefined;
      state.roomDeviceUtilization = roomDeviceUtilization;
      const campaignClientSegments = (await loadPermittedDashboardData(
        canManageMigration,
        () => client.listClientSegments(state.gym!.id) as Promise<CampaignClientSegmentsResponse>,
        undefined
      )) as CampaignClientSegmentsResponse | undefined;
      state.campaignClientSegments = campaignClientSegments;
      const generatedCampaigns = (await loadPermittedDashboardData(
        canManageMigration,
        () => client.listGeneratedCampaigns(state.gym!.id) as Promise<GeneratedCampaignsResponse>,
        { campaigns: [] }
      )) as GeneratedCampaignsResponse;
      state.generatedCampaigns = generatedCampaigns.campaigns ?? [];
      const premiumRecoveryPrograms = (await loadPermittedDashboardData(
        canManageMigration,
        () => client.listPremiumRecoveryPrograms(state.gym!.id) as Promise<PremiumRecoveryProgramsResponse>,
        { programs: [] }
      )) as PremiumRecoveryProgramsResponse;
      state.premiumRecoveryPrograms = premiumRecoveryPrograms.programs ?? [];
      const premiumRecoverySuggestions = (await loadPermittedDashboardData(
        canManageMigration,
        () => client.suggestPremiumRecoveryPrograms(state.gym!.id) as Promise<PremiumRecoveryProgramSuggestionsResponse>,
        { suggestions: [], services: [] }
      )) as PremiumRecoveryProgramSuggestionsResponse;
      state.premiumRecoveryProgramSuggestions = premiumRecoverySuggestions.suggestions ?? [];
      const weeklyRevenuePlan = (await loadPermittedDashboardData(
        canManageMigration,
        () => client.getWeeklyRevenuePlan(state.gym!.id) as Promise<WeeklyRevenuePlanResponse>,
        undefined
      )) as WeeklyRevenuePlanResponse | undefined;
      state.weeklyRevenuePlan = weeklyRevenuePlan?.plan;
      const roiTracking = (await loadPermittedDashboardData(
        canManageMigration,
        () => client.listRoiTracking(state.gym!.id) as Promise<RoiTrackingResponse>,
        undefined
      )) as RoiTrackingResponse | undefined;
      state.roiTrackingEntries = roiTracking?.entries ?? [];
      state.roiTrackingSummary = roiTracking?.summary;
      try {
        state.posStripeConfig = (await client.getPosStripeConfig(state.gym.id)) as {
          enabled: boolean;
          publishableKey?: string;
        };
      } catch {
        state.posStripeConfig = undefined;
      }
      try {
        state.stripeConnectAccount = (await client.getStripeConnectAccount(state.gym.id)) as StripeConnectAccountRecord;
      } catch {
        state.stripeConnectAccount = undefined;
      }
      state.stripeConnectSession = undefined;
      if (!state.selectedLocationId || !state.locations.some((location) => location.id === state.selectedLocationId)) {
        state.selectedLocationId = state.locations[0]?.id ?? "";
      }
      const cachedMembers = consumerRecords
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6);
      state.memberCache = Object.fromEntries(
        await Promise.all(
          cachedMembers.map(async (member) => [member.id, await loadMemberCacheEntry(state.gym!.id, member.id)] as const)
        )
      );
      const checkInRecords = Array.isArray(checkIns) ? checkIns : checkIns.checkIns ?? [];
      state.checkInHistory = mergeCheckInHistory(checkInRecords);
      const [rolesResponse, staffResponse, staffShiftResponse, staffTimeEntryResponse] = await Promise.all([
        loadPermittedDashboardData(
          canReadStaff,
          () => client.listRoles(state.gym!.id) as Promise<{ roles?: RoleRecord[] } | RoleRecord[]>,
          { roles: [] }
        ),
        loadPermittedDashboardData(
          canViewStaffDirectory,
          () => client.listStaff(state.gym!.id) as Promise<{ staff?: StaffRecord[] }>,
          { staff: [] }
        ),
        loadPermittedDashboardData(
          canReadStaff || canReadOwnShifts,
          () => canReadStaff
            ? client.listStaffShifts(state.gym!.id) as Promise<StaffShiftListResponse>
            : client.listMyStaffShifts(state.gym!.id) as Promise<StaffShiftListResponse>,
          { shifts: [] }
        ),
        loadPermittedDashboardData(
          canViewStaffDirectory || canReadOwnShifts,
          () => canViewStaffDirectory
            ? client.listStaffTimeEntries(state.gym!.id) as Promise<StaffTimeEntryListResponse>
            : client.listMyStaffTimeEntries(state.gym!.id) as Promise<StaffTimeEntryListResponse>,
          { entries: [] }
        )
      ]);
      state.roles = Array.isArray(rolesResponse) ? rolesResponse : rolesResponse.roles ?? [];
      if (!state.selectedRoleId || !state.roles.some((role) => role.id === state.selectedRoleId)) {
        state.selectedRoleId = state.roles[0]?.id ?? "";
      }
      const availableRoleIds = new Set(state.roles.map((role) => role.id));
      state.staffAuthTreeExpandedRoleIds = state.staffAuthTreeExpandedRoleIds.filter((roleId) =>
        availableRoleIds.has(roleId)
      );
      state.staff = staffResponse.staff ?? [];
      state.staffShifts = staffShiftResponse.shifts ?? [];
      state.staffTimeEntries = staffTimeEntryResponse.entries ?? [];
      const [
        schedulerSettingsResponse,
        schedulerRulesResponse,
        schedulerAvailabilityResponse,
        mySchedulerAvailabilityResponse,
        schedulerPreferenceRequestsResponse,
        mySchedulerPreferenceRequestsResponse,
        schedulerRequestsResponse,
        mySchedulerRequestsResponse
      ] = await Promise.all([
        loadPermittedDashboardData(
          canReadScheduler,
          () => client.getSchedulerSettings(state.gym!.id) as Promise<SchedulerSettingsRecord>,
          null
        ),
        loadPermittedDashboardData(
          canReadScheduler,
          () => client.listSchedulerRules(state.gym!.id) as Promise<{ rules?: SchedulerCoverageRuleRecord[] }>,
          { rules: [] }
        ),
        loadPermittedDashboardData(
          canReadScheduler,
          () => client.listSchedulerAvailability(state.gym!.id) as Promise<{ availability?: SchedulerAvailabilityRecord[] }>,
          { availability: [] }
        ),
        loadPermittedDashboardData(
          canReadOwnShifts,
          () => client.listMySchedulerAvailability(state.gym!.id) as Promise<{ availability?: SchedulerAvailabilityRecord[] }>,
          { availability: [] }
        ),
        loadPermittedDashboardData(
          canReadScheduler,
          () => client.listSchedulerPreferenceRequests(state.gym!.id) as Promise<{ requests?: SchedulerPreferenceRequestRecord[] }>,
          { requests: [] }
        ),
        loadPermittedDashboardData(
          canReadOwnShifts,
          () => client.listMySchedulerPreferenceRequests(state.gym!.id) as Promise<{ requests?: SchedulerPreferenceRequestRecord[] }>,
          { requests: [] }
        ),
        loadPermittedDashboardData(
          hasPermission(Permission.ScheduleRequestsManage),
          () => client.listSchedulerRequests(state.gym!.id) as Promise<{ requests?: SchedulerRequestRecord[] }>,
          { requests: [] }
        ),
        loadPermittedDashboardData(
          canReadOwnShifts,
          () => client.listMySchedulerRequests(state.gym!.id) as Promise<{ requests?: SchedulerRequestRecord[] }>,
          { requests: [] }
        )
      ]);
      state.schedulerSettings = schedulerSettingsResponse;
      state.schedulerRules = schedulerRulesResponse.rules ?? [];
      state.schedulerAvailability = schedulerAvailabilityResponse.availability ?? [];
      state.mySchedulerAvailability = mySchedulerAvailabilityResponse.availability ?? [];
      state.schedulerPreferenceRequests = schedulerPreferenceRequestsResponse.requests ?? [];
      state.mySchedulerPreferenceRequests = mySchedulerPreferenceRequestsResponse.requests ?? [];
      state.schedulerRequests = schedulerRequestsResponse.requests ?? [];
      state.mySchedulerRequests = mySchedulerRequestsResponse.requests ?? [];
      const [devicesResponse, rulesResponse, eventsResponse] = (await Promise.all([
        loadPermittedDashboardData(
          canReadAccess,
          () => client.listAccessDevices(state.gym!.id) as Promise<AccessDeviceListResponse>,
          { devices: [] }
        ),
        loadPermittedDashboardData(
          canReadAccess,
          () => client.listAccessRules(state.gym!.id) as Promise<AccessRuleListResponse>,
          { rules: [] }
        ),
        loadPermittedDashboardData(
          canReadAccess,
          () => client.listAccessEvents(state.gym!.id) as Promise<AccessEventListResponse>,
          { events: [] }
        )
      ])) as [AccessDeviceListResponse, AccessRuleListResponse, AccessEventListResponse];
      state.accessDevices = devicesResponse.devices.map(enrichAccessDevice);
      state.accessRules = rulesResponse.rules.map(enrichAccessRule);
      state.accessEvents = eventsResponse.events.map(enrichAccessEvent);
      if (!state.publicSlug) {
        state.publicSlug = state.gym.slug;
        localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, state.publicSlug);
      }
    } else {
      state.members = [];
      state.roles = [];
      state.staff = [];
      state.staffShifts = [];
      state.staffTimeEntries = [];
      state.plans = [];
      state.locations = [];
      state.classTypes = [];
      state.classBookings = [];
      state.classResourceAllocations = [];
      state.facilityReservations = [];
      state.selectedReservationAgendaItemId = "";
      state.accessDevices = [];
      state.accessRules = [];
      state.accessEvents = [];
      state.selectedLocationId = "";
      state.resources = [];
      state.memberCache = {};
      state.posStripeConfig = undefined;
      state.stripeConnectAccount = undefined;
      state.stripeConnectEmbeddedOpen = false;
    }
    if (state.publicSlug) {
      await refreshPublic(state.publicSlug, false);
    }
  } catch (error) {
    if (showLoading) {
      clearDashboardState();
    }
    setBanner("error", describeError(error));
  } finally {
    state.dashboardLoading = false;
    if (shouldRenderAfter) {
      render();
    }
  }
}

async function loadMemberCacheEntry(gymId: string, memberId: string) {
  try {
    const [membershipResponse, checkInsResponse, activityResponse] = await Promise.all([
      client.listConsumerMemberships(gymId, memberId) as Promise<{ memberships?: MemberMembershipRecord[] } | MemberMembershipRecord[]>,
      client.listMemberCheckIns(gymId, memberId) as Promise<{ checkIns?: CheckInRecord[] } | CheckInRecord[]>,
      client.listConsumerActivities(gymId, memberId) as Promise<{ activities?: CrmActivityRecord[] } | CrmActivityRecord[]>
    ]);
    return {
      memberships: Array.isArray(membershipResponse)
        ? membershipResponse
        : membershipResponse.memberships ?? [],
      checkIns: Array.isArray(checkInsResponse)
        ? checkInsResponse
        : checkInsResponse.checkIns ?? [],
      crmActivities: Array.isArray(activityResponse)
        ? activityResponse
        : activityResponse.activities ?? []
    };
  } catch {
    return { memberships: [], checkIns: [], crmActivities: [] };
  }
}

async function ensureMemberCacheEntry(gymId: string, memberId: string) {
  if (state.memberCache[memberId]) {
    return;
  }
  state.memberCache = {
    ...state.memberCache,
    [memberId]: await loadMemberCacheEntry(gymId, memberId)
  };
}

async function refreshCreatedConsumerState(gymId: string, consumerId: string) {
  const consumers = (await client.listConsumers(gymId)) as ConsumerListResponse;
  const consumerRecords = resolveConsumerRecords(consumers.consumers);
  state.members = consumerRecords;
  const visibleConsumerIds = new Set(consumerRecords.map((member) => member.id));
  state.memberCache = Object.fromEntries(
    Object.entries(state.memberCache).filter(([memberId]) => visibleConsumerIds.has(memberId))
  );
  if (!visibleConsumerIds.has(consumerId)) {
    return;
  }
  state.memberCache = {
    ...state.memberCache,
    [consumerId]: await loadMemberCacheEntry(gymId, consumerId)
  };
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
    state.classResourceAllocations = [];
    state.selectedReservationAgendaItemId = "";
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
    state.classResourceAllocations = [];
    return;
  }
  try {
    const [bookingResponse, allocationResponse] = await Promise.all([
      client.listClassBookings(state.gym.id, session.id) as Promise<ClassBookingListResponse | ClassBookingRecord[]>,
      client.listClassSessionResourceAllocations(state.gym.id, session.id) as Promise<ResourceAllocationListResponse | ResourceAllocationRecord[]>
    ]);
    const response = bookingResponse;
    state.classBookings = Array.isArray(response) ? response : response.bookings ?? [];
    state.classResourceAllocations = Array.isArray(allocationResponse)
      ? allocationResponse
      : allocationResponse.allocations ?? [];
  } catch {
    state.classBookings = [];
    state.classResourceAllocations = [];
  }
}

function render() {
  const preservedForms = captureRenderableFormState();
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
  restoreRenderableFormState(preservedForms);
  bindEvents();
  startStaffClockTimers();
  void syncCameraCaptureModal();
  void syncPosStripePaymentField();
  void syncStripeConnectEmbed();
}

type PreservedFormValue =
  | { kind: "checkbox"; checked: boolean }
  | { kind: "radio"; checked: boolean }
  | { kind: "value"; value: string };

function captureRenderableFormState() {
  const preservedForms = new Map<string, Map<string, PreservedFormValue>>();
  app.querySelectorAll<HTMLFormElement>("form[id]").forEach((form) => {
    const formState = new Map<string, PreservedFormValue>();
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input[name], select[name], textarea[name]").forEach((field) => {
      const fieldName = field.name;
      if (!fieldName) {
        return;
      }
      if (field instanceof HTMLInputElement) {
        if (field.type === "file") {
          return;
        }
        if (field.type === "checkbox" || field.type === "radio") {
          const key = `${fieldName}::${field.value}`;
          formState.set(key, { kind: field.type, checked: field.checked });
          return;
        }
      }
      formState.set(fieldName, { kind: "value", value: field.value });
    });
    preservedForms.set(form.id, formState);
  });
  return preservedForms;
}

function restoreRenderableFormState(preservedForms: Map<string, Map<string, PreservedFormValue>>) {
  preservedForms.forEach((formState, formId) => {
    const form = app.querySelector<HTMLFormElement>(`#${CSS.escape(formId)}`);
    if (!form) {
      return;
    }
    formState.forEach((savedValue, fieldKey) => {
      if (savedValue.kind === "value") {
        const field = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          `[name="${CSS.escape(fieldKey)}"]`
        );
        if (field) {
          field.value = savedValue.value;
        }
        return;
      }
      const [fieldName, fieldValue] = fieldKey.split("::");
      const selector = `[name="${CSS.escape(fieldName)}"][value="${CSS.escape(fieldValue)}"]`;
      const field = form.querySelector<HTMLInputElement>(selector);
      if (field) {
        field.checked = savedValue.checked;
      }
    });
  });
}

function renderDashboard() {
  const bannerMarkup = state.banner ? renderBannerMarkup(state.banner.tone, state.banner.text) : "";
  if (state.dashboardLoading) {
    return `${bannerMarkup}<div class="empty-state"><h2>Loading dashboard</h2><p>Refreshing workspace data.</p></div>`;
  }

  const gymSlugMatch = new URLSearchParams(window.location.search).get("gymSlug");

  if (!gymSlugMatch && isPlatformAdminRoute()) {
    return renderPlatformDashboard();
  }

  if (!state.session || !state.me) {
    if (!gymSlugMatch) {
      return renderStaffLoginDashboard(bannerMarkup);
    }
    const gymNameTitle = state.publicGym ? state.publicGym.name : gymSlugMatch;
    const logoHtml = state.publicGym?.logoUrl
      ? `<img src="${escapeAttribute(state.publicGym.logoUrl)}" alt="${escapeAttribute(state.publicGym.name)} logo" style="max-height: 48px; margin-bottom: 0.5rem; display: block;" />`
      : '';

    return `
      ${bannerMarkup}
      <div class="section-head">
        <div>${logoHtml}
          <p class="eyebrow">Gym Authentication</p>
          <h2>Log in to ${gymNameTitle}</h2>
        </div>
        <a href="?admin=1#/dashboard" class="ghost-button route-link">Admin login</a>
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
      ${bannerMarkup}
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
  const contentView = dashboardContentView(state.dashboardView);
  switch (contentView) {
    case 'consumers':
      content = renderConsumersView();
      break;
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
    case 'scheduler':
      content = renderSchedulerView();
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
    case 'migration':
      content = renderMigrationAssistantView();
      break;
    case 'campaign_layer':
      content = renderCampaignLayerView();
      break;
    case 'weekly_plan':
      content = renderWeeklyPlanView();
      break;
    case 'roi_tracking':
      content = renderRoiTrackingView();
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
          ${renderTopbarStaffClock()}
          <div class="club-user">
            <div class="club-avatar">${userInitials()}</div>
            <div class="club-user-copy">
              <strong>${state.me?.user.firstName ?? "User"} ${state.me?.user.lastName ?? ""}</strong>
              <span>${currentMembership()?.role?.name ?? "Staff"}</span>
            </div>
          </div>
          <button id="logout-button" class="topbar-logout-button" type="button">Log out</button>
        </div>
      </header>

      <div class="club-tabs-shell">
        <nav class="club-tabs">
          <div class="club-tabs-primary">
            ${dashboardTab("home", "Club Home")}
            ${dashboardTab("consumers", "Consumers")}
            ${dashboardTab("staff", "Staff")}
            ${dashboardTab("scheduler", "Scheduler")}
            ${dashboardTab("pos", "Point Of Sale")}
            ${dashboardTab("plans", "Plans")}
            ${dashboardTab("locations", "Locations")}
            ${dashboardTab("classes", "Classes")}
            ${dashboardTab("bookings", "Reservations")}
            ${dashboardTab("personal_training", "Training")}
            ${dashboardTab("access_control", "Access")}
            ${dashboardTab("contracts", "Forms")}
            ${dashboardTab("member_portal", "Portal")}
            ${dashboardTab("migration", "Migration")}
            ${dashboardTab("campaign_layer", "Campaign Layer")}
            ${dashboardTab("weekly_plan", "Weekly Plan")}
            ${dashboardTab("roi_tracking", "ROI")}
            ${dashboardTab("marketing", "Marketing")}
            ${dashboardTab("reports", "Reporting")}
            ${dashboardTab("settings", "Settings")}
          </div>
        </nav>
        <div class="club-tabs-drawer-handle">
          ${dashboardTab("check_in", "Check In", {
            toggleRail: true,
            className: "club-tab-drawer-trigger"
          })}
        </div>
      </div>

      <div class="club-workspace${state.checkInRailExpanded ? " club-workspace-with-rail" : ""}">
        <main class="club-main">
          ${bannerMarkup}
          ${content}
        </main>
        ${state.checkInRailExpanded
          ? `<aside class="club-rail">
              ${renderCheckInRail()}
            </aside>`
          : ""}
      </div>
    </div>
    ${state.staffClockModalOpen ? renderStaffClockModal() : ""}
    ${state.checkInReview ? renderCheckInReviewModal(state.checkInReview) : ""}
    ${state.cameraCapture ? renderCameraCaptureModal(state.cameraCapture) : ""}
  `;
}

function dashboardTab(
  key: AppState["dashboardView"],
  label: string,
  options?: { toggleRail?: boolean; className?: string }
) {
  const active =
    options?.toggleRail
      ? state.checkInRailExpanded
      : dashboardTopLevelView(state.dashboardView) === key;
  const attributes = [
    `class="club-tab${options?.className ? ` ${options.className}` : ""}${active ? " active" : ""}"`,
    `data-dashboard-view="${key}"`
  ];
  if (options?.toggleRail) {
    attributes.push('data-check-in-rail-toggle="true"');
  }
  if (active) {
    attributes.push('aria-current="page"');
  }
  return `<a href="${dashboardViewToHash(key)}" ${attributes.join(" ")}>${label}</a>`;
}

function userInitials() {
  const user = state.me?.user;
  if (!user) {
    return "U";
  }
  return `${user.firstName?.trim().charAt(0) ?? ""}${user.lastName?.trim().charAt(0) ?? ""}`.toUpperCase() || "U";
}

function renderTopbarStaffClock() {
  return `
    <button
      type="button"
      class="topbar-clock-button"
      data-staff-clock-open
      aria-label="Open employee time clock"
    >
      <span class="topbar-clock-icon" aria-hidden="true"></span>
      <span class="topbar-clock-copy">
        <strong>Time clock</strong>
        <small>Employee sign in</small>
      </span>
    </button>
  `;
}

async function loadMigrationColumnMappings(batchId: string) {
  if (!state.gym) {
    return;
  }
  const mappingFiles = state.migrationFiles.filter((file) => isColumnMappingSupportedFile(file));
  const responses = await Promise.all(
    mappingFiles.map((file) =>
      client.listMigrationColumnMappings(state.gym!.id, batchId, file.id) as Promise<MigrationColumnMappingResponse>
    )
  );
  state.migrationColumnMappings = {};
  state.migrationMappingIssues = {};
  state.migrationMappingTargetFields = {};
  responses.forEach((response) => {
    state.migrationColumnMappings[response.file.id] = response.mappings;
    state.migrationMappingIssues[response.file.id] = response.issues;
    state.migrationMappingTargetFields[response.file.id] = response.targetFields;
  });
}

async function loadMigrationStagedMembers(batchId: string) {
  if (!state.gym) {
    return;
  }
  const memberFiles = state.migrationFiles.filter((file) => file.status === "confirmed" && file.fileType === "members");
  const responses = await Promise.all(
    memberFiles.map((file) =>
      client.listMigrationStagedMembers(state.gym!.id, batchId, file.id) as Promise<MigrationStagedMembersResponse>
    )
  );
  state.migrationStagedMembers = {};
  state.migrationValidationErrors = {};
  responses.forEach((response) => {
    state.migrationStagedMembers[response.file.id] = response.stagedMembers;
    state.migrationValidationErrors[response.file.id] = response.validationErrors;
  });
}

function renderMigrationAssistantView() {
  if (!hasPermission(Permission.GymUpdate)) {
    return `<section class="club-panel club-page"><div class="empty-state"><h3>Migration access needed</h3><p>Only gym owners or admins can manage migration uploads.</p></div></section>`;
  }
  const selectedBatch = state.migrationBatches.find((batch) => batch.id === state.selectedMigrationBatchId);
  const files = state.migrationFiles.filter((file) => file.status !== "deleted");
  const activeStep = state.migrationAssistantStep;
  const allFilesConfirmed =
    files.length > 0 && files.every((file) => file.status === "confirmed" && file.fileType !== "unknown");
  return `
    <section class="club-panel club-page migration-assistant-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Migration Assistant</p>
          <h2>Migration Assistant</h2>
        </div>
        <span class="club-kicker">${selectedBatch ? formatHeaderLabel(selectedBatch.status) : "No batch"}</span>
      </div>

      <div class="migration-stepper">
        <span class="${activeStep === "upload" ? "active" : ""}">1. Upload Files</span>
        <span class="${activeStep === "detect" ? "active" : ""}">2. File Type Detection</span>
        <span class="${activeStep === "map" ? "active" : ""}">3. Column Mapping</span>
        <span class="${activeStep === "stage" ? "active" : ""}">4. Staged Members</span>
      </div>

      <div class="migration-batch-bar">
        ${state.migrationBatches.length > 0
          ? `
            <label class="field">
              <span>Migration batch</span>
              <select data-migration-batch-select>
                ${state.migrationBatches
                  .map(
                    (batch) =>
                      `<option value="${escapeAttribute(batch.id)}" ${batch.id === state.selectedMigrationBatchId ? "selected" : ""}>${escapeHtml(formatDateLabel(batch.createdAt))} - ${escapeHtml(formatHeaderLabel(batch.status))}</option>`
                  )
                  .join("")}
              </select>
            </label>
          `
          : `<div class="empty-state"><p>No migration batch has been created yet.</p></div>`}
        <form id="migration-create-batch-form">
          <button type="submit">${selectedBatch ? "Create another batch" : "Create migration batch"}</button>
        </form>
      </div>

      ${selectedBatch
        ? activeStep === "upload"
          ? renderMigrationUploadStep(files)
          : activeStep === "detect"
            ? renderMigrationDetectionStep(files, allFilesConfirmed)
            : activeStep === "map"
              ? renderMigrationMappingStep(files)
              : renderMigrationStagedMembersStep(files)
        : ""}
    </section>
  `;
}

function renderMigrationUploadStep(files: MigrationFileRecord[]) {
  return `
    <div class="migration-assistant-grid">
      <form id="migration-file-upload-form" class="form-card migration-upload-card">
        <div class="card-head">
          <h3>Upload files</h3>
          <span>CSV or XLSX</span>
        </div>
        <label class="migration-dropzone">
          <span>Choose CSV/XLSX files</span>
          <input name="migrationFiles" type="file" multiple accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
        </label>
        <button type="submit">Upload files</button>
      </form>
      <div class="migration-files-panel">
        <div class="card-head">
          <h3>Uploaded files</h3>
          <span>${files.length} file${files.length === 1 ? "" : "s"}</span>
        </div>
        ${renderMigrationFilesTable(files, "upload")}
        <div class="migration-assistant-actions">
          <button type="button" data-migration-step="detect" ${files.length === 0 ? "disabled" : ""}>Continue to file type detection</button>
        </div>
      </div>
    </div>
  `;
}

function renderMigrationDetectionStep(files: MigrationFileRecord[], allFilesConfirmed: boolean) {
  return `
    <div class="migration-files-panel">
      <div class="card-head">
        <div>
          <h3>File type detection</h3>
          <p class="muted">AI sees only the file name, column headers, first 10 sample rows, and allowed file types.</p>
        </div>
        <button type="button" class="ghost-button" data-migration-detect-all ${files.length === 0 ? "disabled" : ""}>Run AI detection</button>
      </div>
      ${renderMigrationFilesTable(files, "detect")}
      <div class="migration-assistant-actions">
        <button type="button" class="ghost-button" data-migration-step="upload">Back to uploads</button>
        <button type="button" data-migration-step="map" ${!allFilesConfirmed ? "disabled" : ""}>Continue to column mapping</button>
      </div>
      ${!allFilesConfirmed
        ? `<p class="muted">Every uploaded file needs a confirmed file type before staging can begin.</p>`
        : `<p class="muted">Ready to map source columns into the staging fields.</p>`}
    </div>
  `;
}

function renderMigrationMappingStep(files: MigrationFileRecord[]) {
  const mappingFiles = files.filter((file) => file.status === "confirmed" && isColumnMappingSupportedFile(file));
  const unsupportedConfirmedFiles = files.filter((file) => file.status === "confirmed" && !isColumnMappingSupportedFile(file));
  const allApproved = mappingFiles.length > 0 && mappingFiles.every((file) =>
    migrationMappingRowsForFile(file).every((mapping) => mapping.approved)
      && !(state.migrationMappingIssues[file.id] ?? []).some((issue) => issue.severity === "critical")
  );
  return `
    <div class="migration-files-panel migration-mapping-panel">
      <div class="card-head">
        <div>
          <h3>Column mapping</h3>
          <p class="muted">Map old export columns into this system's staging fields. Nothing imports until a later staging step.</p>
        </div>
        <button type="button" class="ghost-button" data-migration-map-all ${mappingFiles.length === 0 ? "disabled" : ""}>AI map all files</button>
      </div>
      ${mappingFiles.length === 0
        ? `<div class="empty-state"><p>No confirmed member, staff, or membership plan files are ready for column mapping.</p></div>`
        : mappingFiles.map(renderMigrationMappingFile).join("")}
      ${unsupportedConfirmedFiles.length > 0
        ? `<p class="muted">Skipping ${unsupportedConfirmedFiles.length} confirmed file${unsupportedConfirmedFiles.length === 1 ? "" : "s"} because column mapping currently supports members, staff, and membership plans.</p>`
        : ""}
      <div class="migration-assistant-actions">
        <button type="button" class="ghost-button" data-migration-step="detect">Back to file type detection</button>
        <button type="button" data-migration-step="stage" ${!allApproved ? "disabled" : ""}>Continue to staging</button>
      </div>
      <p class="muted">${allApproved ? "Mappings are approved. Stage members next for review before any production import exists." : "Every supported file needs approved mappings before staging can begin."}</p>
    </div>
  `;
}

function renderMigrationMappingFile(file: MigrationFileRecord) {
  const mappings = migrationMappingRowsForFile(file);
  const issues = state.migrationMappingIssues[file.id] ?? [];
  const targetFields = state.migrationMappingTargetFields[file.id] ?? migrationTargetFieldsForType(file.fileType);
  const approved = mappings.length > 0 && mappings.every((mapping) => mapping.approved);
  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  return `
    <article class="migration-file-card migration-mapping-card">
      <div class="migration-file-main">
        <div>
          <strong>${escapeHtml(file.originalFilename)}</strong>
          <span>${escapeHtml(formatHeaderLabel(file.fileType))} - ${file.columnHeaders.length} source columns</span>
        </div>
        <div class="migration-mapping-actions">
          <span class="migration-file-status">${approved ? "Approved" : "Needs approval"}</span>
          <button type="button" class="ghost-button" data-migration-map-file="${escapeAttribute(file.id)}">AI map</button>
        </div>
      </div>
      ${issues.length > 0
        ? `<div class="migration-issue-list">
            ${issues.map((issue) => `
              <span class="${issue.severity}">${escapeHtml(formatHeaderLabel(issue.severity))}: ${escapeHtml(issue.message)}</span>
            `).join("")}
          </div>`
        : `<p class="muted">No mapping issues detected.</p>`}
      <form class="migration-column-mapping-form" data-migration-mapping-form="${escapeAttribute(file.id)}">
        <div class="table-wrap migration-column-table">
          <table>
            <thead>
              <tr>
                <th>Source column</th>
                <th>Sample values</th>
                <th>Target field</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              ${mappings.map((mapping) => renderMigrationMappingRow(file, mapping, targetFields)).join("")}
            </tbody>
          </table>
        </div>
        <div class="migration-assistant-actions">
          <span class="muted">${criticalCount} critical - ${warningCount} warning</span>
          <div>
            <button type="submit" class="ghost-button" name="mappingAction" value="save">Save mappings</button>
            <button type="submit" name="mappingAction" value="approve" ${criticalCount > 0 ? "disabled" : ""}>Approve mappings</button>
          </div>
        </div>
      </form>
    </article>
  `;
}

function renderMigrationMappingRow(
  file: MigrationFileRecord,
  mapping: MigrationColumnMappingRecord,
  targetFields: string[]
) {
  const confidence = mapping.confidence === undefined ? "-" : `${Math.round(mapping.confidence * 100)}%`;
  const sourceIssues = (state.migrationMappingIssues[file.id] ?? [])
    .filter((issue) => issue.sourceColumn === mapping.sourceColumn || issue.targetField === mapping.targetField);
  return `
    <tr>
      <td>
        <strong>${escapeHtml(mapping.sourceColumn)}</strong>
        ${sourceIssues.length > 0
          ? `<div class="migration-row-messages">${sourceIssues.map((issue) => `<span class="migration-row-${issue.severity === "critical" ? "error" : "warning"}">${escapeHtml(issue.message)}</span>`).join("")}</div>`
          : ""}
      </td>
      <td>${sampleValuesForColumn(file, mapping.sourceColumn).map((value) => `<span class="migration-sample-chip">${escapeHtml(value)}</span>`).join("") || `<span class="muted">No sample</span>`}</td>
      <td>
        <select name="targetField_${escapeAttribute(mapping.sourceColumn)}">
          ${targetFields.map((field) => `<option value="${escapeAttribute(field)}" ${field === (mapping.targetField ?? "ignore") ? "selected" : ""}>${escapeHtml(formatMigrationTargetField(field))}</option>`).join("")}
        </select>
      </td>
      <td>${confidence}</td>
    </tr>
  `;
}

function renderMigrationStagedMembersStep(files: MigrationFileRecord[]) {
  const memberFiles = files.filter((file) => file.status === "confirmed" && file.fileType === "members");
  const filters: Array<{ value: AppState["migrationStagedMemberFilter"]; label: string }> = [
    { value: "all", label: "All" },
    { value: "ready", label: "Ready" },
    { value: "warnings", label: "Warnings" },
    { value: "critical", label: "Critical" }
  ];
  return `
    <div class="migration-files-panel migration-staged-panel">
      <div class="card-head">
        <div>
          <h3>Staged members</h3>
          <p class="muted">Review transformed member records before any production import is built or run.</p>
        </div>
        <div class="migration-filter-pills">
          ${filters.map((filter) => `
            <button
              type="button"
              class="${state.migrationStagedMemberFilter === filter.value ? "active" : ""}"
              data-migration-staged-filter="${filter.value}"
            >${filter.label}</button>
          `).join("")}
        </div>
      </div>
      ${memberFiles.length === 0
        ? `<div class="empty-state"><p>No confirmed members files are ready for staging.</p></div>`
        : memberFiles.map(renderMigrationStagedMemberFile).join("")}
      <div class="migration-assistant-actions">
        <button type="button" class="ghost-button" data-migration-step="map">Back to column mapping</button>
      </div>
    </div>
  `;
}

function renderMigrationStagedMemberFile(file: MigrationFileRecord) {
  const stagedMembers = state.migrationStagedMembers[file.id] ?? [];
  const validationErrors = state.migrationValidationErrors[file.id] ?? [];
  const summary = stagedMembersSummary(stagedMembers, validationErrors);
  const filteredMembers = filterStagedMembers(stagedMembers);
  const approvedMappings = migrationMappingRowsForFile(file).every((mapping) => mapping.approved);
  return `
    <article class="migration-file-card migration-staged-file">
      <div class="migration-file-main">
        <div>
          <strong>${escapeHtml(file.originalFilename)}</strong>
          <span>${summary.total} staged - ${summary.ready} ready - ${summary.warnings} warnings - ${summary.critical} critical - ${summary.approved} approved</span>
        </div>
        <div class="migration-mapping-actions">
          <button type="button" class="ghost-button" data-migration-stage-file="${escapeAttribute(file.id)}" ${!approvedMappings ? "disabled" : ""}>
            ${stagedMembers.length > 0 ? "Restage members" : "Stage members"}
          </button>
          <button type="button" data-migration-bulk-approve-file="${escapeAttribute(file.id)}" ${stagedMembers.length === 0 || summary.critical > 0 ? "disabled" : ""}>
            Approve ready/warnings
          </button>
        </div>
      </div>
      ${!approvedMappings ? `<p class="muted">Approve column mappings before staging this file.</p>` : ""}
      ${stagedMembers.length === 0
        ? `<div class="empty-state"><p>No member rows staged yet. Stage this file to transform rows and run validation.</p></div>`
        : `
          <div class="migration-staged-list">
            ${filteredMembers.length === 0
              ? `<div class="empty-state"><p>No staged members match this filter.</p></div>`
              : filteredMembers.map((member) => renderMigrationStagedMemberCard(file, member, validationErrors)).join("")}
          </div>
        `}
    </article>
  `;
}

function renderMigrationStagedMemberCard(
  file: MigrationFileRecord,
  member: MigrationStagedMemberRecord,
  validationErrors: MigrationValidationErrorRecord[]
) {
  const memberErrors = validationErrors.filter((error) => error.stagedRecordId === member.id);
  const name = member.fullName || [member.firstName, member.lastName].filter(Boolean).join(" ") || "Unnamed member";
  const tags = member.tagsJson?.join(", ") ?? "";
  const statusClass = member.approved ? "approved" : member.validationStatus;
  return `
    <section class="migration-staged-member ${statusClass}">
      <div class="migration-staged-member-head">
        <div>
          <span class="migration-file-status">Row ${member.sourceRowNumber}</span>
          <strong>${escapeHtml(name)}</strong>
          <small>${escapeHtml([member.email, member.phone].filter(Boolean).join(" - ") || "No contact info")}</small>
        </div>
        <div class="migration-staged-actions">
          <span class="migration-status-pill ${statusClass}">${member.approved ? "Approved" : formatHeaderLabel(member.validationStatus)}</span>
          <button type="button" data-migration-approve-staged="${escapeAttribute(member.id)}" ${member.validationStatus === "critical" || member.validationStatus === "skipped" || member.approved ? "disabled" : ""}>Approve</button>
          <button type="button" class="ghost-button danger" data-migration-skip-staged="${escapeAttribute(member.id)}" ${member.validationStatus === "skipped" ? "disabled" : ""}>Skip</button>
        </div>
      </div>
      ${memberErrors.length > 0
        ? `<div class="migration-issue-list">
            ${memberErrors.map((error) => `<span class="${error.severity === "critical" ? "critical" : "warning"}">${escapeHtml(error.message)}</span>`).join("")}
          </div>`
        : `<p class="muted">No validation errors.</p>`}
      <details class="migration-staged-edit">
        <summary>Edit staged fields</summary>
        <form data-migration-staged-member-form="${escapeAttribute(member.id)}">
          <div class="migration-staged-edit-grid">
            ${renderTextInput("firstName", "First name", member.firstName)}
            ${renderTextInput("lastName", "Last name", member.lastName)}
            ${renderTextInput("fullName", "Full name", member.fullName)}
            ${renderTextInput("email", "Email", member.email)}
            ${renderTextInput("phone", "Phone", member.phone)}
            ${renderTextInput("dateOfBirth", "Date of birth", dateInputValue(member.dateOfBirth))}
            ${renderTextInput("membershipStatus", "Membership status", member.membershipStatus)}
            ${renderTextInput("membershipPlanName", "Membership plan", member.membershipPlanName)}
            ${renderTextInput("startDate", "Start date", dateInputValue(member.startDate))}
            ${renderTextInput("cancellationDate", "Cancellation date", dateInputValue(member.cancellationDate))}
            ${renderTextInput("nextBillingDate", "Next billing date", dateInputValue(member.nextBillingDate))}
            ${renderTextInput("assignedTrainerName", "Assigned trainer", member.assignedTrainerName)}
            ${renderTextInput("address", "Address", member.address)}
            ${renderTextInput("emergencyContact", "Emergency contact", member.emergencyContact)}
            ${renderTextInput("tags", "Tags", tags)}
            <label class="field migration-staged-notes">
              <span>Notes</span>
              <textarea name="notes">${escapeHtml(member.notes ?? "")}</textarea>
            </label>
          </div>
          <div class="migration-assistant-actions">
            <span class="muted">Saving re-runs validation for this file.</span>
            <button type="submit">Save staged member</button>
          </div>
        </form>
      </details>
    </section>
  `;
}

function renderTextInput(name: string, label: string, value: string | undefined) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input name="${escapeAttribute(name)}" value="${escapeAttribute(value ?? "")}" />
    </label>
  `;
}

function renderMigrationFilesTable(files: MigrationFileRecord[], mode: "upload" | "detect") {
  if (files.length === 0) {
    return `<div class="empty-state"><p>No files uploaded yet.</p></div>`;
  }
  return `
    <div class="migration-files-list">
      ${files.map((file) => renderMigrationFileCard(file, mode)).join("")}
    </div>
  `;
}

function renderMigrationFileCard(file: MigrationFileRecord, mode: "upload" | "detect") {
  const confidence = file.fileTypeConfidence === undefined ? "-" : `${Math.round(file.fileTypeConfidence * 100)}%`;
  const needsReview = file.status === "needs_review" || file.fileType === "unknown";
  return `
    <article class="migration-file-card ${needsReview ? "needs-review" : ""}">
      <div class="migration-file-main">
        <div>
          <strong>${escapeHtml(file.originalFilename)}</strong>
          <span>${file.rowCount} rows - ${file.columnHeaders.length} columns - ${formatFileSize(file.sizeBytes)}</span>
        </div>
        <span class="migration-file-status">${needsReview ? "Needs Review" : formatHeaderLabel(file.status)}</span>
      </div>
      <div class="migration-file-columns">
        ${file.columnHeaders.slice(0, 8).map((header) => `<span>${escapeHtml(header)}</span>`).join("")}
        ${file.columnHeaders.length > 8 ? `<span>+${file.columnHeaders.length - 8} more</span>` : ""}
      </div>
      ${mode === "detect"
        ? `
          <div class="migration-detection-row">
            <div>
              <span>Detected: ${escapeHtml(file.detectedFileType ? formatHeaderLabel(file.detectedFileType) : "-")}</span>
              <span>Confidence: ${confidence}</span>
            </div>
            ${renderSelect(`migrationFileType_${file.id}`, "Confirmed file type", migrationFileTypeOptions(), file.fileType, false)}
            <button type="button" class="ghost-button" data-migration-detect-file="${escapeAttribute(file.id)}">Detect</button>
          </div>
          ${file.detectionReason ? `<p class="muted">${escapeHtml(file.detectionReason)}</p>` : ""}
        `
        : ""}
      <details class="migration-sample-details">
        <summary>Sample rows</summary>
        ${renderMigrationSampleRows(file)}
      </details>
      ${mode === "upload"
        ? `<button type="button" class="ghost-button danger" data-migration-delete-file="${escapeAttribute(file.id)}">Delete file</button>`
        : ""}
    </article>
  `;
}

function renderMigrationSampleRows(file: MigrationFileRecord) {
  if (file.sampleRows.length === 0) {
    return `<div class="empty-state"><p>No sample rows captured.</p></div>`;
  }
  const columns = file.columnHeaders.slice(0, 6);
  return `
    <div class="table-wrap migration-sample-table">
      <table>
        <thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
        <tbody>
          ${file.sampleRows.slice(0, 3).map((row) => `
            <tr>${columns.map((column) => `<td>${escapeHtml(row[column] ?? "")}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function migrationFileTypeOptions() {
  return [
    { value: "unknown", label: "Unknown / needs review" },
    { value: "members", label: "Members" },
    { value: "staff", label: "Staff" },
    { value: "membership_plans", label: "Membership plans" },
    { value: "classes", label: "Classes" },
    { value: "attendance", label: "Attendance" },
    { value: "billing", label: "Billing" },
    { value: "appointments", label: "Appointments" }
  ];
}

function isColumnMappingSupportedFile(file: MigrationFileRecord) {
  return file.fileType === "members" || file.fileType === "staff" || file.fileType === "membership_plans";
}

function migrationTargetFieldsForType(fileType: MigrationFileType) {
  const fields: Record<string, string[]> = {
    members: [
      "ignore",
      "first_name",
      "last_name",
      "full_name",
      "email",
      "phone",
      "date_of_birth",
      "address",
      "emergency_contact",
      "membership_status",
      "membership_plan_name",
      "start_date",
      "cancellation_date",
      "next_billing_date",
      "assigned_trainer_name",
      "notes",
      "tags"
    ],
    staff: [
      "ignore",
      "full_name",
      "first_name",
      "last_name",
      "email",
      "phone",
      "old_role_name",
      "employment_status",
      "assigned_location",
      "trainer_flag",
      "instructor_flag",
      "permission_level",
      "pay_type",
      "hourly_rate",
      "notes"
    ],
    membership_plans: [
      "ignore",
      "plan_name",
      "plan_type",
      "price",
      "billing_frequency",
      "contract_length",
      "class_limit",
      "session_limit",
      "active",
      "notes"
    ]
  };
  return fields[fileType] ?? ["ignore"];
}

function migrationMappingRowsForFile(file: MigrationFileRecord) {
  const existing = state.migrationColumnMappings[file.id] ?? [];
  return file.columnHeaders.map((sourceColumn) => {
    const mapping = existing.find((candidate) => candidate.sourceColumn === sourceColumn);
    if (mapping) {
      return mapping;
    }
    return {
      id: `pending-${sourceColumn}`,
      migrationBatchId: file.migrationBatchId,
      migrationFileId: file.id,
      sourceColumn,
      targetField: "ignore",
      approved: false,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    };
  });
}

function sampleValuesForColumn(file: MigrationFileRecord, sourceColumn: string) {
  return [...new Set(file.sampleRows.map((row) => row[sourceColumn]?.trim()).filter((value): value is string => Boolean(value)))]
    .slice(0, 3);
}

function filterStagedMembers(stagedMembers: MigrationStagedMemberRecord[]) {
  const filter = state.migrationStagedMemberFilter;
  if (filter === "all") {
    return stagedMembers;
  }
  return stagedMembers.filter((member) => member.validationStatus === filter);
}

function stagedMembersSummary(
  stagedMembers: MigrationStagedMemberRecord[],
  validationErrors: MigrationValidationErrorRecord[]
) {
  return {
    total: stagedMembers.length,
    ready: stagedMembers.filter((member) => member.validationStatus === "ready").length,
    warnings: stagedMembers.filter((member) => member.validationStatus === "warnings").length,
    critical: stagedMembers.filter((member) => member.validationStatus === "critical").length,
    skipped: stagedMembers.filter((member) => member.validationStatus === "skipped").length,
    approved: stagedMembers.filter((member) => member.approved).length,
    validationErrors: validationErrors.length
  };
}

function dateInputValue(value: string | undefined) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
}

function formatMigrationTargetField(field: string) {
  if (field === "ignore") {
    return "Ignore this column";
  }
  return formatHeaderLabel(field);
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function renderStaffClockModal() {
  const activeLocations = locationSelectOptions();
  const selectedLocationId = state.selectedLocationId || activeLocations[0]?.value || "";
  return `
    <div class="staff-clock-backdrop" data-staff-clock-close>
      <section class="staff-clock-modal" role="dialog" aria-modal="true" aria-label="Employee time clock">
        <div class="card-head">
          <div>
            <p class="eyebrow">Employee Time Clock</p>
            <h3>Employee sign in</h3>
            <p class="club-copy">Each employee signs in here before clocking time. The dashboard account stays signed in.</p>
          </div>
          <button type="button" class="ghost-button" data-staff-clock-close>Close</button>
        </div>

        <div class="staff-clock-person">
          <div class="topbar-clock-icon" aria-hidden="true"></div>
          <div>
            <strong>Shared time clock</strong>
            <span>Use the employee's own login to clock in or out.</span>
          </div>
        </div>

        <div class="staff-clock-status-card">
          <span>Roster status</span>
          <strong>Check the Staff list</strong>
          <small>The roster still shows who is clocked in. This form only verifies the employee taking the action.</small>
        </div>

        <form class="staff-clock-form">
          <label class="field">
            <span>Employee email</span>
            <input name="email" type="email" autocomplete="username" placeholder="employee@example.com" />
          </label>
          <label class="field">
            <span>Password</span>
            <input name="password" type="password" autocomplete="current-password" />
          </label>
          <label class="field">
            <span>2FA code optional</span>
            <input name="twoFactorCode" inputmode="numeric" autocomplete="one-time-code" placeholder="Only if enabled" />
          </label>
          <label class="field">
            <span>Location</span>
            <select name="locationId" data-staff-clock-location>
              <option value="">No location</option>
              ${activeLocations.map((location) => `
                <option value="${escapeAttribute(location.value)}" ${location.value === selectedLocationId ? "selected" : ""}>${escapeHtml(location.label)}</option>
              `).join("")}
            </select>
          </label>
          <label class="field">
            <span>Note optional</span>
            <input name="notes" data-staff-clock-notes placeholder="Optional note" />
          </label>
          <div class="staff-clock-actions">
            <button type="button" class="ghost-button" data-staff-clock-close>Cancel</button>
            <button type="button" class="ghost-button" data-staff-clock-kiosk-action="clock-out">Sign in and clock out</button>
            <button type="button" class="ghost-button clock-button active" data-staff-clock-kiosk-action="clock-in">Sign in and clock in</button>
          </div>
        </form>
      </section>
    </div>
  `;
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
  const leadCount = state.members.filter(isLeadConsumerRecord).length;
  const activeCount = state.members.filter(isMemberConsumerRecord).length;
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
            <p class="eyebrow">Consumers</p>
            <h2>${state.gym?.name ?? "Consumer Cards"}</h2>
          </div>
          <span class="club-kicker">${state.members.length} consumers Â· ${activeCount} members Â· ${leadCount} leads</span>
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
                <button type="button" class="ghost-button" data-dashboard-view="customer_edit" data-preserve-context="true">Edit Consumer</button>
              </div>
            </div>
          </article>
        ` : `
          <div class="empty-state"><p>Tap a customer from the check-in list to load their card here.</p></div>
        `}
        <div class="club-customer-grid">
          ${recentMembers.length === 0
            ? `<div class="empty-state"><p>No consumer cards available.</p></div>`
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
        <p class="club-copy">Use the top navigation to jump between consumers, staff, POS, marketing, and reporting. Edit a consumer from the profile view and adjust barcodes or profile pictures at any time.</p>
        <div class="club-mini-nav">
          <button type="button" class="ghost-button" data-dashboard-view="consumers">Open Consumers</button>
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
                    <p>${member.status}${member.barcode ? ` Â· ${member.barcode}` : ""}</p>
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
          <button type="button" class="ghost-button" data-dashboard-view="consumers" data-preserve-context="true">View Consumers</button>
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

function renderConsumersView() {
  const canWriteConsumers = currentPermissions().includes(Permission.MemberWrite);
  const segmentConsumers = consumersForSegment(state.members, state.consumerSegment);
  const memberPage = buildMemberListPage({
    members: segmentConsumers,
    permissions: currentPermissions(),
    surface: "consumer",
    detailBasePath: "#/dashboard/consumers/profile",
    editBasePath: "#/dashboard/consumers/edit"
  });
  const leadPage = buildLeadListPage({
    members: state.members,
    permissions: currentPermissions(),
    detailBasePath: "#/dashboard/consumers/profile",
    editBasePath: "#/dashboard/consumers/edit"
  });
  const recentConsumers = segmentConsumers
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);
  const spotlight = selectedMember() ?? recentConsumers[0];
  const summary = consumerSummary(state.members);
  const table =
    state.consumerSegment === "leads"
      ? renderModelTable(leadPage.table, "No lead rows to display.")
      : renderModelTable(memberPage.table, "No consumer rows to display.");

  return `
    <section class="club-panel club-page consumer-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Consumers</p>
          <h2>Consumer Directory</h2>
        </div>
        <span class="club-kicker">${summary.total} total Â· ${summary.members} members Â· ${summary.customers} customers Â· ${summary.leads} leads</span>
      </div>

      <div class="consumer-segment-tabs">
        ${consumerSegmentTab("all", "All", summary.total)}
        ${consumerSegmentTab("members", "Members", summary.members)}
        ${consumerSegmentTab("customers", "Customers", summary.customers)}
        ${consumerSegmentTab("leads", "Leads", summary.leads)}
      </div>

      <div class="club-page-split">
        <div class="club-customer-grid consumer-card-grid">
          ${recentConsumers.length === 0
            ? `<div class="empty-state"><p>No consumers yet.</p></div>`
            : recentConsumers.map(renderConsumerCard).join("")}
        </div>
        <div class="club-panel club-focus-panel consumer-detail-panel">
          ${canWriteConsumers ? renderConsumerCreatePanel() : ""}
          ${canWriteConsumers ? renderMemberCsvImportPanel() : ""}
          ${spotlight
            ? `
              <div class="club-focus-card compact">
                <div class="club-focus-photo">
                  ${spotlight.profileImageUrl
                    ? `<img src="${escapeAttribute(spotlight.profileImageUrl)}" alt="${escapeAttribute(`${spotlight.firstName} ${spotlight.lastName}`.trim())}" />`
                    : customerInitials(spotlight)}
                </div>
                <div class="club-focus-copy">
                  <p class="eyebrow">Selected consumer</p>
                  <h3>${spotlight.firstName} ${spotlight.lastName}</h3>
                  <p>${consumerSegmentLabel(spotlight)}</p>
                </div>
                <div class="club-mini-nav consumer-card-actions">
                  <button type="button" class="ghost-button" data-dashboard-view="customer_profile" data-preserve-context="true">Open Profile</button>
                  <button type="button" class="ghost-button" data-dashboard-view="customer_edit" data-preserve-context="true">Edit Consumer</button>
                </div>
              </div>
            `
            : `<div class="empty-state"><p>Select a consumer to see details.</p></div>`}
          ${table}
        </div>
      </div>
    </section>
  `;
}

function renderMemberCsvImportPanel() {
  const preview = state.memberCsvPreview;
  const mappingEntries = preview
    ? Object.entries(preview.mapping).filter(([, header]) => Boolean(header))
    : [];
  const savedUploads = migrationMemberListCsvUploads();
  return `
    <div class="form-card compact-form migration-import-card">
      <div class="card-head">
        <h3>Import member CSV</h3>
        <span>${preview ? `${preview.summary.validRows} ready` : "Migration tool"}</span>
      </div>
      <p class="club-copy">Upload an old-system member list, preview how columns translate, then import clean rows into the consumer directory.</p>
      ${savedUploads.length > 0
        ? `
          <div class="migration-saved-uploads">
            <span>Saved checklist uploads</span>
            ${savedUploads
              .map(
                (upload, index) =>
                  `<button type="button" class="ghost-button" data-member-csv-saved-upload="${index}">${escapeHtml(upload.fileName)}</button>`
              )
              .join("")}
          </div>
        `
        : ""}
      <form id="member-csv-preview-form" class="migration-import-form">
        <label class="field">
          <span>CSV or TSV file</span>
          <input name="memberCsvFile" type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" />
        </label>
        ${renderSelect("delimiter", "Delimiter", [
          { value: "auto", label: "Auto-detect" },
          { value: "comma", label: "Comma CSV" },
          { value: "tab", label: "Tab TSV" }
        ], state.memberCsvImport?.delimiter ?? "auto")}
        <div class="migration-import-buttons">
          <button type="submit">Preview import</button>
          <button type="submit" name="aiMap" value="1" class="ghost-button">AI map and preview</button>
        </div>
      </form>
      ${state.memberCsvAiSuggestion ? renderMemberCsvAiSuggestion(state.memberCsvAiSuggestion) : ""}
      ${preview
        ? `
          <div class="migration-preview">
            <div class="migration-preview-summary">
              <span>${preview.summary.totalRows} rows found</span>
              <span>${preview.summary.validRows} importable</span>
              <span>${preview.summary.skippedRows} need review</span>
              <span>${preview.summary.warningRows} warnings</span>
            </div>
            ${mappingEntries.length > 0
              ? `
                <div class="migration-mapping-list">
                  ${mappingEntries
                    .map(([field, header]) => `<span>${migrationFieldLabel(field)} <strong>${escapeHtml(header)}</strong></span>`)
                    .join("")}
                </div>
              `
              : `<div class="empty-state"><p>No matching columns were detected. Check the CSV headers and preview again.</p></div>`}
            ${renderMemberCsvPreviewRows(preview)}
            <form id="member-csv-import-form" class="migration-import-actions">
              <button type="submit" ${!state.memberCsvImport || preview.summary.validRows === 0 ? "disabled" : ""}>Import ${preview.summary.validRows} rows</button>
            </form>
          </div>
        `
        : ""}
    </div>
  `;
}

function renderMemberCsvAiSuggestion(suggestion: MigrationMemberCsvAiMappingResponse) {
  const confidence = Math.round((suggestion.confidence ?? 0) * 100);
  const tone = suggestion.available ? "success" : "info";
  return `
    <div class="migration-ai-card ${tone}">
      <div>
        <strong>${suggestion.available ? "AI mapping applied" : "AI mapping unavailable"}</strong>
        <span>${suggestion.provider === "openai" ? `OpenAI${suggestion.model ? ` / ${escapeHtml(suggestion.model)}` : ""}` : "Built-in mapper"} - ${confidence}% confidence</span>
      </div>
      ${suggestion.warnings.length > 0
        ? `<ul>${suggestion.warnings.slice(0, 4).map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>`
        : ""}
      ${suggestion.notes.length > 0
        ? `<p>${escapeHtml(suggestion.notes.slice(0, 2).join(" "))}</p>`
        : ""}
    </div>
  `;
}

function renderMemberCsvPreviewRows(preview: MigrationMemberCsvPreviewResponse) {
  if (preview.rows.length === 0) {
    return `<div class="empty-state"><p>No data rows found in this file.</p></div>`;
  }
  return `
    <div class="migration-preview-rows">
      ${preview.rows
        .map((row) => {
          const input = row.input;
          const translatedName = input ? `${input.firstName} ${input.lastName}`.trim() : "Not mapped";
          const details = [
            input?.email,
            input?.phone,
            input?.barcode ? `Barcode ${input.barcode}` : undefined,
            input?.status
          ].filter(Boolean);
          return `
            <article class="migration-preview-row ${row.valid ? "valid" : "invalid"}">
              <div>
                <strong>Row ${row.rowNumber}: ${escapeHtml(translatedName)}</strong>
                <span>${details.length > 0 ? escapeHtml(details.join(" Â· ")) : "No contact details mapped"}</span>
              </div>
              <div class="migration-row-messages">
                ${row.errors.map((error) => `<span class="migration-row-error">${escapeHtml(error)}</span>`).join("")}
                ${row.warnings.map((warning) => `<span class="migration-row-warning">${escapeHtml(warning)}</span>`).join("")}
                ${row.valid ? `<span class="migration-row-ready">Ready</span>` : ""}
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function migrationFieldLabel(field: string) {
  const labels: Record<string, string> = {
    firstName: "First name <-",
    lastName: "Last name <-",
    fullName: "Full name <-",
    email: "Email <-",
    phone: "Phone <-",
    barcode: "Barcode/member ID <-",
    status: "Status <-",
    leadStage: "Lead stage <-",
    notes: "Notes <-",
    tags: "Tags <-",
    emergencyContactName: "Emergency contact <-",
    emergencyContactPhone: "Emergency phone <-",
    emergencyContactRelationship: "Emergency relationship <-"
  };
  return labels[field] ?? `${formatHeaderLabel(field)} <-`;
}

function renderConsumerCreatePanel() {
  const recurringPlans = recurringMembershipPlanOptions();
  const defaultPlanId = defaultRecurringPlanId(recurringPlans);
  const createKindOptions = consumerCreateKindOptions(recurringPlans);
  const defaultCreateKind = defaultConsumerCreateKind(recurringPlans);
  const recurringPlanNote =
    recurringPlans.length > 0
      ? "Members need at least an email or phone number and a recurring plan. Profile photos can be added now or later."
      : "No active monthly or yearly plans exist yet. Create a recurring plan before adding subscription members.";
  const recurringPlanChoices = [
    {
      value: "",
      label: recurringPlans.length > 0 ? "Choose a recurring plan" : "No recurring plans available"
    },
    ...recurringPlans.map((plan) => ({ value: plan.id, label: `${plan.name} Â· ${formatCurrency(plan.priceCents)}` }))
  ];
  return `
    <form id="create-member-form" class="form-card compact-form" style="margin-bottom:16px;">
      <div class="card-head">
        <h3>Add consumer</h3>
        <span>Consumer tab</span>
      </div>
      <p class="club-copy">Create a lead, standard consumer, or full member without leaving the directory.</p>
      ${renderSelect("createKind", "Create as", createKindOptions, defaultCreateKind)}
      ${renderInput("firstName", "First name")}
      ${renderInput("lastName", "Last name")}
      ${renderInput("email", "Email", "email")}
      ${renderInput("phone", "Phone", "tel")}
      ${renderCameraCaptureInput("create-member-form", "profileImageFile", "Take profile picture")}
      ${renderSelect("planId", "Recurring membership plan", recurringPlanChoices, defaultPlanId)}
      ${renderSelect("membershipStatus", "Membership status", [
        { value: MembershipStatus.Active, label: "Active" },
        { value: MembershipStatus.Trialing, label: "Trialing" },
        { value: MembershipStatus.PastDue, label: "Past due" },
        { value: MembershipStatus.Paused, label: "Frozen" }
      ], MembershipStatus.Active)}
      <div class="club-note">
        <p>${recurringPlanNote}</p>
      </div>
      <button type="submit">Add consumer</button>
    </form>
  `;
}

function consumerSegmentTab(segment: ConsumerSegmentFilter, label: string, count: number) {
  const active = state.consumerSegment === segment ? " active" : "";
  return `<button type="button" class="tab-btn${active}" data-consumer-segment="${segment}">${label}<span class="consumer-tab-count">${count}</span></button>`;
}

function renderConsumerCard(member: MemberRecord) {
  return `
    <button type="button" class="club-customer-card" data-action="view-member" data-member-id="${member.id}">
      <div class="club-customer-avatar">
        ${member.profileImageUrl
          ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(`${member.firstName} ${member.lastName}`.trim())}" />`
          : customerInitials(member)}
      </div>
      <strong>${member.firstName} ${member.lastName}</strong>
      <span class="consumer-card-segments">${consumerSegmentLabel(member)}</span>
    </button>
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
    return `<div class="empty-state"><h3>Consumer not found</h3><p>The selected consumer could not be found.</p></div>`;
  }
  const summary = buildCheckInMemberSummary(member);
  const planOptions = state.plans
    .filter((plan) => plan.status !== "archived")
    .map((plan) => ({ value: plan.id, label: `${plan.name} Â· ${formatCurrency(plan.priceCents)}` }));
  const photoMarkup = member.profileImageUrl
    ? `<img src="${escapeAttribute(member.profileImageUrl)}" alt="${escapeAttribute(`${member.firstName} ${member.lastName}`.trim() || "Customer")} profile picture" style="width:112px;height:112px;border-radius:28px;object-fit:cover;border:1px solid var(--line);background:#111;" />`
    : `<div style="width:112px;height:112px;border-radius:28px;display:grid;place-items:center;background:#262626;border:1px solid var(--line);font-weight:700;">${customerInitials(member)}</div>`;
  return `
    <div style="margin-bottom:1rem;">
      <button class="tab-btn active" data-dashboard-view="consumers" data-preserve-context="true">â† Back to Consumers</button>
    </div>
    <section class="club-panel profile-sheet">
      <div class="profile-header">
        <div class="profile-header-main">
          <div class="profile-avatar">${photoMarkup}</div>
          <div class="profile-header-copy">
            <p class="eyebrow">Consumer Profile</p>
            <h2>${member.firstName} ${member.lastName}</h2>
            <div class="checkin-sheet-badges">
              <span class="club-note-label">${summary.planLabel}</span>
              <span class="club-note-label">${summary.statusLabel}</span>
              ${summary.paidMember ? `<span class="checkin-paid-tag">Paid member</span>` : `<span class="checkin-due-tag">Payment needed</span>`}
            </div>
            <div class="checkin-sheet-meta">
              <span><strong>Amount due:</strong> ${summary.amountDueLabel}</span>
              <span><strong>Profile image:</strong> ${member.profileImageUrl || "Not set"}</span>
            </div>
            ${renderLinkedMemberChips(summary)}
          </div>
        </div>
        <div class="club-mini-nav">
          <button type="button" class="ghost-button" data-customer-action="edit" data-member-id="${member.id}">Edit consumer</button>
          <button type="button" class="ghost-button" data-dashboard-view="check_in" data-preserve-context="true">Open check-in</button>
          <button type="button" class="ghost-button" data-sheet-view="pos">POS</button>
        </div>
      </div>

      <div class="profile-tools-grid">
        ${planOptions.length === 0
          ? `<div class="settings-placeholder"><strong>No plans loaded</strong><p>Create a plan before adding a membership.</p></div>`
          : `
            <form id="member-add-membership-form" class="form-card compact-form">
              <input type="hidden" name="memberId" value="${member.id}" />
              <p class="muted">Monthly and yearly plans convert this consumer into a member. Recurring members need at least an email or phone number.</p>
              ${renderSelect("planId", "Add membership", planOptions, summary.primaryPlan?.id ?? planOptions[0]?.value ?? "")}
              ${renderSelect("status", "Membership status", [
                { value: MembershipStatus.Active, label: "Active" },
                { value: MembershipStatus.Trialing, label: "Trialing" },
                { value: MembershipStatus.PastDue, label: "Past due" },
                { value: MembershipStatus.Paused, label: "Frozen" },
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
              <div>
                <h3>CRM activity timeline</h3>
                <p class="muted">Calls, messages, tours, trials, cancellation notes, and follow-up outcomes.</p>
              </div>
              <span>${state.memberCache[member.id]?.crmActivities.length ?? 0}</span>
            </div>
            ${renderCrmTimeline(member)}
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
    return `<div class="empty-state"><h3>Consumer not found</h3><p>The selected consumer could not be found.</p></div>`;
  }
  return `
    <section class="data-card customer-edit-shell">
      <div class="card-head customer-edit-head">
        <div>
          <p class="eyebrow">Edit Consumer</p>
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
            <button type="submit" class="save-button">Save consumer</button>
            <button type="button" class="ghost-button" data-dashboard-view="consumers" data-preserve-context="true">Back to consumers</button>
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
            <p class="muted">Recurring memberships require at least one contact method plus a profile image. Capture both email and phone when you can.</p>
            ${renderInput("email", "Email", "email", member.email ?? "")}
            ${renderInput("phone", "Phone", "tel", member.phone ?? "")}
            ${renderCameraCaptureInput("update-member-form", "profileImageFile", "Take profile picture", member.profileImageUrl)}
          </section>

          <section class="customer-edit-card">
            <h4>Tags</h4>
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
          <button type="submit" class="save-button">Save consumer</button>
          <button type="button" class="ghost-button" data-dashboard-view="consumers" data-preserve-context="true">Cancel</button>
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
                  <span>${member.contactLabel} Â· ${member.tagLabel}</span>
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
  const directoryStaff = staffDirectoryRows();
  const assignableRoles = staffAssignableRoles();
  const activeStaff = directoryStaff.filter((staff) => staff.status === UserStatus.Active);
  const canInviteStaff = hasPermission(Permission.StaffInvite);
  const canScheduleStaff = hasPermission(Permission.StaffRoleAssign);
  const canViewPayroll = hasPermission(Permission.ReportRead) && hasPermission(Permission.StaffRead);
  const staffOptions = activeStaff.map((staff) => ({
    value: staff.userId,
    label: staffFullName(staff)
  }));
  const shiftRoleOptions = assignableRoles.map((role) => ({
    value: role.id,
    label: formatRoleLabel(role.name)
  }));
  const activeLocationOptions = locationSelectOptions();
  const locationOptions = [
    { value: "", label: "No location" },
    ...activeLocationOptions
  ];
  const defaultShiftDate = toDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const staffTools = [
    hasPermission(Permission.StaffRead) ? renderStaffAuthTree() : "",
    canInviteStaff ? renderCreateStaffAccountCard(assignableRoles) : "",
    canScheduleStaff ? renderScheduleShiftCard(staffOptions, shiftRoleOptions, locationOptions, defaultShiftDate) : "",
    renderStaffRoleCreator(),
    canViewPayroll ? renderStaffPayrollReport() : ""
  ].filter(Boolean).join("");
  return `
    <section class="club-panel club-page club-staff-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Staff</p>
          <h2>Team access</h2>
        </div>
        <span>${directoryStaff.length} staff Â· ${activeStaff.length} active</span>
      </div>
      <div class="club-page-split">
        <div class="section-stack">
          ${renderStaffAccessManagement(assignableRoles)}
          ${renderStaffShiftList()}
          ${renderStaffPersonalHoursReport()}
        </div>
        ${staffTools ? `<div class="section-stack">${staffTools}</div>` : ""}
      </div>
      ${state.staffScheduleCalendarOpen ? renderStaffShiftCalendarModal() : ""}
      ${state.staffScheduleRequestModalOpen ? renderStaffScheduleRequestModal() : ""}
      ${state.staffPreferenceRequestModalOpen ? renderStaffPreferenceRequestModal() : ""}
      ${state.staffRemovalUserId ? renderStaffRemovalModal() : ""}
    </section>
  `;
}

function renderSchedulerView() {
  const canRead = hasPermission(Permission.ScheduleRead);
  const canCreate = hasPermission(Permission.ScheduleCreate);
  const canPublish = hasPermission(Permission.SchedulePublish);
  const canManageRequests = hasPermission(Permission.ScheduleRequestsManage);
  const canAutoResolve = hasPermission(Permission.ScheduleAutoResolve);
  const roleOptions = staffAssignableRoles().map((role) => ({
    value: role.id,
    label: formatRoleLabel(role.name)
  }));
  const locationOptions = [
    { value: "", label: "Any location" },
    ...locationSelectOptions()
  ];
  const today = toDateInputValue(new Date());
  const horizonDays = state.schedulerSettings?.planningHorizonDays ?? 14;
  const openScheduleRequests = state.schedulerRequests.filter((request) => request.status === "open").length;
  const openPreferenceRequests = state.schedulerPreferenceRequests.filter((request) => request.status === "open").length;
  if (!canRead) {
    return `
      <section class="club-panel club-page">
        <p class="eyebrow">Scheduler</p>
        <h2>Automated scheduling</h2>
        <div class="settings-placeholder"><strong>No scheduler access</strong><p>Your role needs Scheduler permissions to use this workspace.</p></div>
      </section>
    `;
  }
  return `
    <section class="club-panel club-page scheduler-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Scheduler</p>
          <h2>Automated schedule builder</h2>
          <p class="club-copy">Create coverage rules, track availability, generate a draft schedule, then publish shifts to staff.</p>
        </div>
        <span>${state.schedulerRules.length} rules Â· ${openScheduleRequests + openPreferenceRequests} open requests</span>
      </div>
      <div class="club-page-split">
        <div class="section-stack">
          <div class="club-panel scheduler-generator">
            <div class="card-head">
              <div>
                <h3>Create schedule</h3>
                <p class="club-copy">Algorithmic draft first. Manager review stays in control before publishing.</p>
              </div>
            </div>
            <form id="scheduler-generate-form" class="scheduler-inline-form">
              ${renderInput("startsOn", "Starts on", "date", today)}
              ${renderSelect("locationId", "Location", locationOptions, "")}
              <button type="submit" ${canCreate ? "" : "disabled"}>Create schedule</button>
            </form>
            <p class="muted">Uses the saved planning horizon: ${horizonDays} days from the start date.</p>
            ${state.schedulerDraft ? renderSchedulerDraft(canPublish) : `<div class="settings-placeholder"><strong>No draft yet</strong><p>Create a schedule to preview assignments and coverage warnings.</p></div>`}
          </div>
          <div class="club-panel">
            <div class="card-head">
              <div>
                <h3>Requests and automatic replacement</h3>
                <p class="club-copy">Employee complaints, swap requests, and time-off notes land here for manager review.</p>
              </div>
            </div>
            ${renderSchedulerRequests(canAutoResolve, canManageRequests)}
          </div>
          <div class="club-panel">
            <div class="card-head">
              <div>
                <h3>Long-term preference requests</h3>
                <p class="club-copy">Approve or decline staff schedule preferences before the algorithm uses them.</p>
              </div>
              <span>${openPreferenceRequests} open</span>
            </div>
            ${renderSchedulerPreferenceRequests(canManageRequests)}
          </div>
        </div>
        <div class="section-stack">
          ${renderSchedulerSettingsCard(canCreate, horizonDays)}
          <details class="form-card expandable-card" ${canCreate ? "" : "open"}>
            <summary class="expandable-summary">
              <span>
                <h3>Business staffing need</h3>
                <p class="muted">Tell the scheduler what role needs coverage and at what time.</p>
              </span>
              <span class="expandable-action">Expand</span>
            </summary>
            <form id="scheduler-rule-form" class="expandable-body">
              ${renderInput("name", "Rule name", "text", "Front desk weekday coverage")}
              ${renderSelect("roleId", "Role needed", roleOptions.length ? roleOptions : [{ value: "", label: "No staff roles available" }], roleOptions[0]?.value ?? "")}
              ${renderSelect("locationId", "Location", locationOptions, "")}
              ${renderSchedulerDayPicker()}
              ${renderInput("startTime", "Start time", "time", "09:00")}
              ${renderInput("endTime", "End time", "time", "17:00")}
              ${renderInput("requiredStaff", "Employees needed", "number", "1")}
              <button type="submit" ${canCreate && roleOptions.length ? "" : "disabled"}>Save rule</button>
            </form>
          </details>
          <details class="form-card expandable-card">
            <summary class="expandable-summary">
              <span>
                <h3>Active staff preferences</h3>
                <p class="muted">Approved long-term preferences the algorithm considers.</p>
              </span>
              <span class="expandable-action">Expand</span>
            </summary>
            <div class="expandable-body">
              ${renderSchedulerAvailabilitySummary()}
            </div>
          </details>
          <details class="form-card expandable-card">
            <summary class="expandable-summary">
              <span>
                <h3>Employee request</h3>
                <p class="muted">Submit a complaint or swap request for the signed-in employee.</p>
              </span>
              <span class="expandable-action">Expand</span>
            </summary>
            <form id="scheduler-request-form" class="expandable-body">
              ${renderSchedulerRequestFields()}
              <button type="submit">Send request</button>
            </form>
          </details>
        </div>
      </div>
    </section>
  `;
}

function renderSchedulerSettingsCard(canCreate: boolean, horizonDays: number) {
  return `
    <details class="form-card expandable-card" open>
      <summary class="expandable-summary">
        <span>
          <h3>Schedule planning setup</h3>
          <p class="muted">Controls how far into the future the generator builds.</p>
        </span>
        <span class="expandable-action">Expand</span>
      </summary>
      <form id="scheduler-settings-form" class="expandable-body">
        ${renderInput("planningHorizonDays", "Generate this many days", "number", String(horizonDays))}
        <p class="muted">Allowed range is 1 to 90 days. Coverage rules decide which times need staff during that range.</p>
        <button type="submit" ${canCreate ? "" : "disabled"}>Save planning setup</button>
      </form>
    </details>
  `;
}

function renderSchedulerRequestFields() {
  const shiftOptions = [
    { value: "", label: "No specific shift" },
    ...signedInStaffShifts().map((shift) => ({
      value: shift.id,
      label: `${shiftTimeLabel(shift)}${shift.locationId ? ` Â· ${locationName(shift.locationId)}` : ""}`
    }))
  ];
  return `
    ${renderSelect("shiftId", "Related shift", shiftOptions, "")}
    ${renderSelect("requestType", "Request type", [
      { value: "complaint", label: "Schedule conflict or concern" },
      { value: "swap", label: "Need someone to cover this shift" },
      { value: "time_off", label: "Time off request" }
    ], "complaint")}
    <label class="field">
      <span>Message</span>
      <textarea name="message" rows="4" placeholder="Explain what needs to change and when"></textarea>
    </label>
    <p class="muted">This sends a request to the scheduler team. Your published schedule stays the same until someone with scheduler access applies a change.</p>
  `;
}

function renderSchedulerPreferenceRequestFields() {
  return `
    ${renderSelect("preference", "Preference type", [
      { value: "preferred", label: "I prefer being scheduled then" },
      { value: "available", label: "I am available then" },
      { value: "unavailable", label: "Please avoid scheduling me then" }
    ], "preferred")}
    ${renderSchedulerDayPicker()}
    ${renderInput("startTime", "Start time", "time", "09:00")}
    ${renderInput("endTime", "End time", "time", "17:00")}
    <label class="field">
      <span>Reason / notes</span>
      <textarea name="notes" rows="4" placeholder="Example: I prefer afternoon shifts because mornings conflict with classes."></textarea>
    </label>
    <p class="muted">Schedulers approve or decline this before the algorithm starts using it for future schedules.</p>
  `;
}

function renderSchedulerDayPicker() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `
    <fieldset class="scheduler-day-picker">
      <legend>Days</legend>
      <div>
        ${days.map((day, index) => `
          <label class="permission-chip active">
            <input type="checkbox" name="daysOfWeek" value="${index}" ${index >= 1 && index <= 5 ? "checked" : ""} />
            <span class="permission-chip-copy"><strong>${day}</strong></span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `;
}

function renderSchedulerDraft(canPublish: boolean) {
  const draft = state.schedulerDraft;
  if (!draft) {
    return "";
  }
  return `
    <div class="scheduler-draft">
      <div class="staff-shift-head-actions">
        <span>${draft.assignments.length} draft assignments Â· ${draft.warnings.length} warnings</span>
        <button type="button" class="ghost-button" data-scheduler-publish ${canPublish && draft.assignments.some((assignment) => assignment.userId) ? "" : "disabled"}>Publish shifts</button>
      </div>
      ${draft.warnings.length
        ? `<div class="staff-removal-warning"><strong>Coverage warnings</strong><ul>${draft.warnings.slice(0, 4).map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul></div>`
        : ""}
      <div class="staff-role-list">
        ${draft.assignments.slice(0, 12).map((assignment) => {
          const staff = assignment.userId ? staffByUserId(assignment.userId) : undefined;
          const role = state.roles.find((candidate) => candidate.id === assignment.roleId);
          return `
            <article class="staff-role-row">
              <div class="staff-role-copy">
                <strong>${escapeHtml(staff ? staffFullName(staff) : "Unassigned")}</strong>
                <p>${escapeHtml(new Date(assignment.startsAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }))} - ${escapeHtml(new Date(assignment.endsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }))}</p>
                <span class="staff-clock-chip">${escapeHtml(role ? formatRoleLabel(role.name) : "Staff")} Â· ${escapeHtml(assignment.reason)}</span>
              </div>
              <span class="staff-status-chip">${assignment.score}</span>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderSchedulerRequests(canAutoResolve: boolean, canManageRequests: boolean) {
  const requests = state.schedulerRequests.filter((request) => request.status === "open");
  if (requests.length === 0) {
    return `<div class="settings-placeholder"><strong>No open requests</strong><p>Accepted or declined schedule requests are cleared from this queue.</p></div>`;
  }
  return `
    <div class="staff-role-list">
      ${requests.slice(0, 8).map((request) => {
        const staff = staffByUserId(request.userId);
        const replacement = request.suggestedReplacementUserId ? staffByUserId(request.suggestedReplacementUserId) : undefined;
        const canApplyRequest = request.shiftId ? canAutoResolve : canManageRequests;
        return `
          <article class="staff-role-row">
            <div class="staff-role-copy">
              <div class="staff-role-title">
                <strong>${escapeHtml(staff ? staffFullName(staff) : "Employee")}</strong>
                <span class="staff-status-chip">${escapeHtml(formatRoleLabel(request.status))}</span>
              </div>
              <p>${escapeHtml(formatRoleLabel(request.requestType))} Â· ${escapeHtml(request.message)}</p>
              ${replacement ? `<span class="staff-clock-chip active">Replacement: ${escapeHtml(staffFullName(replacement))}</span>` : ""}
              ${request.resolutionNote ? `<span class="staff-clock-chip">${escapeHtml(request.resolutionNote)}</span>` : ""}
            </div>
            <div class="staff-role-actions">
              <button type="button" class="ghost-button" data-scheduler-resolve="${escapeAttribute(request.id)}" data-scheduler-resolve-auto="${request.shiftId ? "true" : "false"}" ${canApplyRequest ? "" : "disabled"}>${request.shiftId ? "Apply change" : "Mark reviewed"}</button>
              <button type="button" class="ghost-button danger" data-scheduler-decline="${escapeAttribute(request.id)}" ${canManageRequests ? "" : "disabled"}>Decline</button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderSchedulerPreferenceRequests(canManageRequests: boolean) {
  const requests = state.schedulerPreferenceRequests.filter((request) => request.status === "open");
  if (requests.length === 0) {
    return `<div class="settings-placeholder"><strong>No open preference requests</strong><p>Approved or declined long-term preferences are cleared from this queue.</p></div>`;
  }
  return `
    <div class="staff-role-list">
      ${requests.slice(0, 8).map((request) => {
        const staff = staffByUserId(request.userId);
        return `
          <article class="staff-role-row">
            <div class="staff-role-copy">
              <div class="staff-role-title">
                <strong>${escapeHtml(staff ? staffFullName(staff) : "Employee")}</strong>
                <span class="staff-status-chip">${escapeHtml(formatRoleLabel(request.status))}</span>
              </div>
              <p>${escapeHtml(formatPreferenceLabel(request.preference))} Â· ${escapeHtml(daysOfWeekLabel(request.daysOfWeek))} Â· ${escapeHtml(timeRangeLabel(request.startTime, request.endTime))}</p>
              ${request.notes ? `<span class="staff-clock-chip">${escapeHtml(request.notes)}</span>` : ""}
              ${request.resolutionNote ? `<span class="staff-clock-chip">${escapeHtml(request.resolutionNote)}</span>` : ""}
            </div>
            <div class="staff-role-actions">
              <button type="button" class="ghost-button" data-scheduler-preference-approve="${escapeAttribute(request.id)}" ${canManageRequests ? "" : "disabled"}>Approve</button>
              <button type="button" class="ghost-button danger" data-scheduler-preference-decline="${escapeAttribute(request.id)}" ${canManageRequests ? "" : "disabled"}>Decline</button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderSchedulerAvailabilitySummary() {
  if (state.schedulerAvailability.length === 0) {
    return `<div class="settings-placeholder"><strong>No active preferences saved</strong><p>Approved employee preferences and manually saved availability will appear here.</p></div>`;
  }
  return `
    <div class="staff-request-summary">
      ${state.schedulerAvailability.slice(0, 6).map((availability) => {
        const staff = staffByUserId(availability.userId);
        return `
          <article class="staff-request-summary-row">
            <span class="staff-status-chip">${escapeHtml(formatPreferenceLabel(availability.preference))}</span>
            <div>
              <strong>${escapeHtml(staff ? staffFullName(staff) : "Staff")}</strong>
              <p>${escapeHtml(daysOfWeekLabel(availability.daysOfWeek))} Â· ${escapeHtml(timeRangeLabel(availability.startTime, availability.endTime))}</p>
              ${availability.notes ? `<small>${escapeHtml(availability.notes)}</small>` : ""}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderPosView() {
  const selected = selectedMember() ?? state.members.find((member) => member.status !== MemberStatus.Archived);
  const canManagePayments = currentPermissions().includes(Permission.PaymentWrite);
  const canManageGym = currentPermissions().includes(Permission.GymUpdate);
  const posBlockedReason = !canManagePayments ? "Payment write permission is required." : undefined;
  const stripeAccount = state.stripeConnectAccount;
  const gymStripeAccountId = stripeAccount?.accountId ?? state.gym?.stripeAccountId;
  const stripeReady = Boolean(
    state.posStripeConfig?.enabled &&
      state.posStripeConfig.publishableKey &&
      stripeAccount?.accountId &&
      stripeAccount.onboardingComplete &&
      stripeAccount.chargesEnabled
  );
  const requirementCount = stripeAccount?.requirementsDue.length ?? 0;
  const stripeEmbedVisible = Boolean(
    canManageGym &&
      state.posStripeConfig?.publishableKey &&
      (state.stripeConnectEmbeddedOpen || (stripeAccount?.accountId && !stripeReady))
  );
  const stripeSessionComponents = state.stripeConnectSession?.components;
  const showStripeBanner = Boolean(stripeSessionComponents?.notificationBanner);
  const showStripeOnboarding = stripeSessionComponents?.accountOnboarding ?? stripeEmbedVisible;
  const showStripeAccountManagement = Boolean(stripeSessionComponents?.accountManagement);
  const showStripeBalances = Boolean(stripeSessionComponents?.balances);
  const showStripePayouts = Boolean(stripeSessionComponents?.payouts);
  const showStripePayments = Boolean(stripeSessionComponents?.payments);
  const showStripeBasicsGrid = showStripeAccountManagement || showStripeBalances || showStripePayouts;
  const showStripeBasics = showStripeBasicsGrid || showStripePayments;
  const posHelperMessage = posBlockedReason
    ? posBlockedReason
    : stripeReady
      ? "Card details are processed through Stripe. If the buyer email or phone matches an existing consumer, the successful payment updates that person instead of creating a duplicate."
      : stripeAccount?.accountId && !stripeAccount.onboardingComplete
        ? `Finish Stripe onboarding for ${stripeAccount.accountId} before collecting card payments.`
        : stripeAccount?.accountId && !stripeAccount.chargesEnabled
          ? `Stripe account ${stripeAccount.accountId} is connected, but card payments are not enabled yet.`
      : gymStripeAccountId
        ? "Stripe keys are present, but POS card collection is still unavailable for this gym. Check the connected account id and backend Stripe configuration."
        : "This gym does not have a Stripe connected account yet. Start Stripe onboarding below, or paste an existing acct_... id for sandbox import.";
  const planOptions = [
    { value: "", label: "No plan assignment" },
    ...planSelectOptions().map((plan) => ({ value: plan.value, label: plan.label }))
  ];
  const stripeStatusLabel = stripeReady
    ? "Connected"
    : stripeAccount?.accountId && !stripeAccount.onboardingComplete
      ? "Onboarding required"
    : gymStripeAccountId
      ? "Needs verification"
      : "Not connected";
  const stripeStatusReason = stripeReady
    ? `Connected account ${gymStripeAccountId ?? "configured"}`
    : stripeAccount?.accountId && !stripeAccount.onboardingComplete
      ? `${requirementCount} Stripe onboarding requirement${requirementCount === 1 ? "" : "s"} remaining for ${stripeAccount.accountId}.`
    : stripeAccount?.accountId && !state.posStripeConfig?.publishableKey
      ? `Connected account ${stripeAccount.accountId} is saved, but Stripe keys are not configured on this API instance.`
    : stripeAccount?.accountId && !stripeAccount.chargesEnabled
      ? `Connected account ${stripeAccount.accountId} is still waiting for payment capability approval.`
    : gymStripeAccountId
      ? `Saved account ${gymStripeAccountId}. Stripe POS is still disabled until API config and account access both succeed.`
      : "Create or connect a Stripe account for this gym to enable card collection for this location.";
  const posBannerMarkup = state.banner ? renderBannerMarkup(state.banner.tone, state.banner.text, "pos-inline-banner") : "";
  const activePlans = state.plans.filter((plan) => plan.status === PlanStatus.Active).slice(0, 6);
  const buyerCard = `
    <article class="mini-card">
      <span>Buyer</span>
      <strong>${selected ? escapeHtml(`${selected.firstName} ${selected.lastName}`.trim()) : "New customer"}</strong>
      <p class="muted">${selected ? "Selected consumer details are prefilled below. Edit them to record a sale for someone else." : "Record a sale and automatically add the buyer to the consumer directory as a customer."}</p>
    </article>
  `;
  const stripeCard = `
    <article class="mini-card">
      <span>Stripe</span>
      <strong>${stripeStatusLabel}</strong>
      <p class="muted">${escapeHtml(stripeStatusReason)}</p>
      ${stripeAccount?.businessName ? `<p class="muted">Business: ${escapeHtml(stripeAccount.businessName)}</p>` : ""}
      ${stripeAccount?.dashboardUrl ? `<p class="muted"><a href="${escapeHtml(stripeAccount.dashboardUrl)}" target="_blank" rel="noreferrer">Open Stripe dashboard</a></p>` : ""}
    </article>
  `;
  const plansPanel = `
    <article class="form-card pos-plan-panel">
      <div class="card-head">
        <div>
          <p class="eyebrow">Quick picks</p>
          <h3>Active plans</h3>
        </div>
        <span>${activePlans.length}</span>
      </div>
      <div class="club-product-grid compact pos-plan-grid">
        ${activePlans
          .map((plan) => `
            <article class="club-product">
              <div class="club-product-art"></div>
              <strong>${escapeHtml(plan.name)}</strong>
              <span>${formatCurrency(plan.priceCents)}</span>
            </article>
          `)
          .join("") || `<div class="empty-state"><p>No plans loaded.</p></div>`}
      </div>
    </article>
  `;
  const stripeSetupContent = `
    ${stripeCard}
    <form id="pos-stripe-setup-form" class="form-card compact-form pos-stripe-setup-card pos-focus-card">
      <h3>Set up Stripe for this gym</h3>
      <p class="muted">Choose one Stripe connection path for this gym. The onboarding buttons create or continue a Stripe-connected account. The manual import field is only for linking an account id you already created elsewhere.</p>
      <div class="pos-stripe-option-grid">
        <section class="pos-stripe-option-card">
          <div class="pos-stripe-option-head">
            <h4>Option 1: Create or continue Stripe onboarding</h4>
            <p class="muted">Use this if the gym should start fresh or continue setup for the Stripe account already linked to this gym.</p>
          </div>
          <div class="pos-stripe-setup-actions">
            <button type="button" class="ghost-button" data-pos-stripe-embed-toggle ${canManageGym && state.posStripeConfig?.publishableKey ? "" : "disabled"}>${stripeEmbedVisible ? "Hide in-app setup" : "Set up in app"}</button>
            <button type="button" data-pos-stripe-connect ${canManageGym ? "" : "disabled"}>${stripeAccount?.accountId ? "Continue Stripe setup" : "Create and connect Stripe account"}</button>
            ${stripeAccount?.accountId ? `<button type="button" class="ghost-button" data-pos-stripe-disconnect ${canManageGym ? "" : "disabled"}>Disconnect current Stripe account</button>` : ""}
          </div>
          <div class="club-note stripe-connect-note">
            <p>${canManageGym
              ? "This path ignores the textbox below. It uses the gym's saved Stripe account if one exists, or creates a new test connected account automatically when none is saved."
              : "You need gym update permission to start Stripe onboarding for this gym."}</p>
          </div>
        </section>
        <section class="pos-stripe-option-card">
          <div class="pos-stripe-option-head">
            <h4>Option 2: Import an existing Stripe account id</h4>
            <p class="muted">Use this only if you already created a connected test account in Stripe and want this gym to use that exact <code>acct_...</code> id.</p>
          </div>
          ${renderInput("stripeAccountId", "Stripe connected account id to import", "text", gymStripeAccountId ?? "")}
          <div class="pos-stripe-setup-actions">
            <button type="submit" ${canManageGym ? "" : "disabled"}>Save imported Stripe account id</button>
            ${gymStripeAccountId ? '<button type="button" class="ghost-button" data-pos-stripe-copy>Copy saved id</button>' : ""}
          </div>
          <div class="club-note stripe-connect-note">
            <p>${canManageGym
              ? "The import field does not start onboarding by itself. Saving this form only links the entered account id to this gym."
              : "You need gym update permission to save a Stripe connected account id for this gym."}</p>
          </div>
        </section>
      </div>
    </form>
    ${stripeEmbedVisible ? `
      <article class="form-card compact-form stripe-connect-embedded-card pos-focus-card">
        <div class="stripe-connect-embedded-head">
          <div>
            <h3>Stripe setup inside Gym Platform</h3>
            <p class="muted">Complete onboarding requirements and review required actions without leaving this page.</p>
          </div>
        </div>
        <div class="stripe-connect-embedded-shell">
          ${showStripeBanner ? '<div class="stripe-connect-banner" data-stripe-connect-banner></div>' : ''}
          ${showStripeOnboarding ? '<div class="stripe-connect-onboarding" data-stripe-connect-onboarding></div>' : ''}
          ${showStripeBasicsGrid ? `
            <div class="stripe-connect-basics-grid">
              ${showStripeAccountManagement ? `
                <section class="stripe-connect-panel">
                  <div class="stripe-connect-panel-head">
                    <h4>Account details</h4>
                    <p class="muted">Business profile, support details, and payout account management.</p>
                  </div>
                  <div class="stripe-connect-account-management" data-stripe-connect-account-management></div>
                </section>
              ` : ""}
              ${(showStripeBalances || showStripePayouts) ? `
                <section class="stripe-connect-panel">
                  <div class="stripe-connect-panel-head">
                    <h4>Balances and payouts</h4>
                    <p class="muted">Current Stripe balance and payout status for this connected account.</p>
                  </div>
                  ${showStripeBalances ? '<div class="stripe-connect-balances" data-stripe-connect-balances></div>' : ''}
                  ${showStripePayouts ? '<div class="stripe-connect-payouts" data-stripe-connect-payouts></div>' : ''}
                </section>
              ` : ""}
            </div>
          ` : ""}
          ${showStripePayments ? `
            <section class="stripe-connect-panel stripe-connect-panel-wide">
              <div class="stripe-connect-panel-head">
                <h4>Payments</h4>
                <p class="muted">Recent Stripe payments and refund or dispute tools inside the dashboard.</p>
              </div>
              <div class="stripe-connect-payments" data-stripe-connect-payments></div>
            </section>
          ` : ""}
          ${(!showStripeBasics && state.stripeConnectSession) ? `
            <div class="club-note stripe-connect-note">
              <p>Stripe is only exposing onboarding for this connected sandbox account right now. No extra Stripe dashboard setup is required on your side. These additional embedded panels should appear automatically once Stripe enables them for the account session.</p>
            </div>
          ` : ""}
        </div>
      </article>
    ` : ""}
  `;
  const paymentContent = `
    ${buyerCard}
    <form id="pos-purchase-form" class="form-card compact-form pos-focus-card">
      <h3>Collect payment</h3>
      ${renderInput("firstName", "First name", "text", selected?.firstName ?? "")}
      ${renderInput("lastName", "Last name", "text", selected?.lastName ?? "")}
      ${renderInput("email", "Email", "email", selected?.email ?? "")}
      ${renderInput("phone", "Phone", "tel", selected?.phone ?? "")}
      ${renderSelect("planId", "Assign plan", planOptions, "")}
      ${renderInput("amount", "Amount (USD)", "number", "")}
      ${renderSelect("paymentMethod", "Payment method", [
        { value: StripePaymentMethod.ManualEntry, label: "Keyed card entry" },
        { value: StripePaymentMethod.CardReader, label: "Terminal reader" }
      ], StripePaymentMethod.ManualEntry)}
      <div class="club-note" data-pos-keyed-note>
        <p>Use keyed entry for hand-entered cards. Switch to Terminal reader below to use Stripe's simulated reader flow during development.</p>
      </div>
      <section class="form-card pos-terminal-panel" data-pos-terminal-panel hidden>
        <div class="card-head">
          <div>
            <p class="eyebrow">Stripe Terminal</p>
            <h4>Simulated reader</h4>
          </div>
          <span class="club-note-label" data-pos-terminal-status>${escapeHtml(formatPosTerminalStatus())}</span>
        </div>
        <div class="club-note">
          <p>${escapeHtml(posTerminalHelperText())}</p>
        </div>
        <div class="club-mini-nav">
          <button type="button" class="ghost-button" data-pos-terminal-connect>Connect simulated reader</button>
          <button type="button" class="ghost-button" data-pos-terminal-disconnect ${state.posTerminalConnectionState === "connected" ? "" : "disabled"}>Disconnect reader</button>
        </div>
      </section>
      ${stripeReady ? `
        <label class="field" data-pos-keyed-card-field>
          <span>Keyed card details</span>
          <div class="stripe-card-field" data-pos-stripe-card></div>
        </label>
      ` : ""}
      ${renderInput("receiptEmail", "Receipt email", "email", selected?.email ?? "")}
      ${renderInput("note", "Payment note")}
      ${posBannerMarkup}
      <div class="club-note">
        <p>${posHelperMessage}</p>
      </div>
      <button type="submit" ${posBlockedReason ? "disabled" : ""}>Collect payment</button>
    </form>
  `;
  return `
    <section class="club-panel club-page club-pos-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Point Of Sale</p>
          <h2>Payments and memberships</h2>
        </div>
        <span>${stripeStatusLabel}</span>
      </div>
      <div class="club-pos-layout${stripeReady ? ' ready' : ' setup'}">
        <div class="club-pos-main section-stack">
          ${stripeReady ? paymentContent : stripeSetupContent}
        </div>
        <aside class="club-pos-side section-stack">
          ${stripeReady ? stripeCard : buyerCard}
          ${plansPanel}
          <div class="club-mini-nav">
            <button type="button" class="ghost-button" data-dashboard-view="plans">Manage plans</button>
            <button type="button" class="ghost-button" data-dashboard-view="customer_profile" data-preserve-context="true">Open selected customer</button>
          </div>
        </aside>
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
  const locationOptions = locationSelectOptions();
  const activeResources = state.resources.filter((resource) => resource.status === "active" && !resource.linkedStaffUserId);
  const selectedLocationResources = page.selectedLocation
    ? activeResources.filter((resource) => resource.locationId === page.selectedLocation?.id)
    : activeResources;
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Locations</p>
          <h2>Facilities and rooms</h2>
        </div>
        <span>${page.summary.activeCount} active · ${page.summary.archivedCount} archived · ${activeResources.length} resources</span>
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
          <div class="club-note" style="margin-top: 14px;">
            <span class="club-note-label">Reservable resources</span>
            <p>${page.selectedLocation
              ? `${escapeHtml(page.selectedLocation.name)} has ${selectedLocationResources.length} active reservable resource${selectedLocationResources.length === 1 ? "" : "s"}.`
              : `${activeResources.length} active reservable resource${activeResources.length === 1 ? "" : "s"} are configured.`}</p>
            ${selectedLocationResources.length > 0
              ? `<div class="location-resource-summary">${selectedLocationResources
                  .map((resource) => renderLocationResourceChip(resource))
                  .join("")}</div>`
              : ""}
          </div>
        </div>
        <div class="location-action-stack">
          <details class="form-card location-action-menu">
            <summary class="location-action-summary">Add Location</summary>
            <form id="create-location-form" class="location-action-form">
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
          </details>
          <details class="form-card location-action-menu">
            <summary class="location-action-summary">Add Resource</summary>
            <form id="create-resource-form" class="location-action-form">
              ${renderInput("name", "Resource name")}
              ${renderInput("resourceType", "Type", "text", "room")}
              ${renderSelect("locationId", "Location", locationOptions, state.selectedLocationId)}
              ${renderInput("amountCents", "Price cents", "number", "0")}
              <button type="submit" ${locationOptions.length > 0 ? "" : "disabled"}>Create resource</button>
            </form>
          </details>
        </div>
      </div>
    </section>
  `;
}

function renderLocationResourceChip(resource: ResourceRecord) {
  const typeLabel = resource.resourceType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return `<span class="location-resource-chip"><strong>${escapeHtml(resource.name)}</strong><small>${escapeHtml(typeLabel)}</small></span>`;
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
        <button type="button" class="ghost-button" data-dashboard-view="bookings">Open reservations</button>
        <button type="button" class="ghost-button" data-dashboard-view="locations">Locations</button>
      </div>
    </section>
  `;
}

function renderBookingsView() {
  const agenda = reservationAgendaItems();
  const selected = selectedReservationAgendaItem(agenda);
  const classCount = agenda.filter((item) => item.kind === "class").length;
  const facilityCount = agenda.filter((item) => item.kind === "facility").length;
  const selectedDetail = selected ? renderReservationAgendaDetail(selected) : "";
  return `
    <section class="club-panel club-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Reservations</p>
          <h2>Unified agenda</h2>
        </div>
        <span>${classCount} classes · ${facilityCount} resource reservations</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Agenda items</span><strong>${agenda.length}</strong></article>
        <article class="mini-card"><span>Classes</span><strong>${classCount}</strong></article>
        <article class="mini-card"><span>Resources</span><strong>${facilityCount}</strong></article>
        <article class="mini-card"><span>Bookable</span><strong>${bookableResourceOptions().length}</strong></article>
      </div>
      <div class="club-page-split reservations-hub-split">
        <div class="section-stack">
          <div class="data-card">
            <div class="card-head">
              <div>
                <h3>Agenda</h3>
                <p class="club-copy">Classes and staff-created resource reservations share this operational view.</p>
              </div>
            </div>
            ${renderReservationAgendaTable(agenda, selected?.id)}
          </div>
          ${selectedDetail}
        </div>
        <div class="section-stack">
          ${renderCreateResourceReservationForm()}
        </div>
      </div>
    </section>
  `;
}

function reservationAgendaItems() {
  return buildReservationAgendaItems({
    classes: dashboardClassSessions().map((session) => {
      const bookingSession = bookingSessionView(session);
      return {
        id: session.id,
        title: bookingSession.className,
        locationName: bookingSession.locationName,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        capacity: session.capacity,
        waitlistCapacity: session.waitlistCapacity,
        status: session.status
      };
    }),
    facilityReservations: state.facilityReservations.map((reservation) => ({
      id: reservation.id,
      resourceId: reservation.resourceId,
      memberId: reservation.memberId,
      resourceName: resourceDisplayName(reservation.resourceId),
      memberName: memberDisplayName(reservation.memberId),
      locationName: locationDisplayName(reservation.locationId ?? resourceById(reservation.resourceId)?.locationId),
      startsAt: reservation.startsAt,
      endsAt: reservation.endsAt,
      status: reservation.status,
      paymentLabel: reservationPaymentLabel(reservation)
    }))
  });
}

function selectedReservationAgendaItem(agenda: ReservationAgendaItem[]) {
  const preferredId =
    state.selectedReservationAgendaItemId ||
    (state.selectedClassSessionId ? `class:${state.selectedClassSessionId}` : "");
  return agenda.find((item) => item.id === preferredId) ?? agenda[0];
}

function renderReservationAgendaTable(agenda: ReservationAgendaItem[], selectedId?: string) {
  if (agenda.length === 0) {
    return `<div class="empty-state"><p>No classes or resource reservations are visible in the current schedule window.</p></div>`;
  }
  return `
    <div class="table-wrap">
      <table class="reservations-agenda-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Time</th>
            <th>Name / Resource</th>
            <th>Location</th>
            <th>Customer / Capacity</th>
            <th>Status</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          ${agenda.map((item) => `
            <tr class="${item.id === selectedId ? "selected-row" : ""}">
              <td>${item.kind === "class" ? "Class" : "Resource"}</td>
              <td>${escapeHtml(formatDateTimeRange(item.startsAt, item.endsAt))}</td>
              <td>
                <button type="button" class="table-link-button" data-reservation-agenda-select="${escapeAttribute(item.id)}">
                  ${escapeHtml(item.title)}
                </button>
              </td>
              <td>${escapeHtml(item.locationName)}</td>
              <td>${escapeHtml(item.customerOrCapacity)}</td>
              <td>${escapeHtml(formatReservationStatus(item.status))}</td>
              <td>${escapeHtml(item.paymentLabel)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderReservationAgendaDetail(item: ReservationAgendaItem) {
  return item.kind === "class" ? renderClassReservationDetail(item.sourceId) : renderFacilityReservationDetail(item.sourceId);
}

function renderClassReservationDetail(sessionId: string) {
  const session = dashboardClassSessions().find((candidate) => candidate.id === sessionId);
  if (!session) {
    return `<div class="data-card"><div class="empty-state"><p>Class session not found.</p></div></div>`;
  }
  const bookingPage = buildBookingListPage({
    session: bookingSessionView(session),
    bookings: state.classBookings,
    members: state.members,
    permissions: currentPermissions()
  });
  const sessions = dashboardClassSessions();
  return `
    <div class="data-card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(bookingPage.session.className)}</h3>
          <p class="club-copy">${escapeHtml(formatDateTimeRange(session.startsAt, session.endsAt))}</p>
        </div>
        <span>${bookingPage.summaryLabel}</span>
      </div>
      <label class="field">
        <span>Class session</span>
        <select data-class-session-select>
          ${sessions.map((item) => {
            const option = bookingSessionView(item);
            return `<option value="${escapeAttribute(item.id)}" ${item.id === session.id ? "selected" : ""}>${escapeHtml(option.className)} · ${escapeHtml(formatDateTimeRange(option.startsAt, option.endsAt))}</option>`;
          }).join("")}
        </select>
      </label>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Booked</span><strong>${bookingPage.summary.bookedCount}</strong></article>
        <article class="mini-card"><span>Waitlisted</span><strong>${bookingPage.summary.waitlistedCount}</strong></article>
        <article class="mini-card"><span>Cancelled</span><strong>${bookingPage.summary.cancelledCount}</strong></article>
        <article class="mini-card"><span>Staff-created</span><strong>${bookingPage.summary.staffCreatedCount}</strong></article>
      </div>
      ${renderClassResourceAllocationPanel(session)}
      ${renderModelTable(bookingPage.table, "No bookings for this class session.")}
    </div>
  `;
}

function renderClassResourceAllocationPanel(session: PublicSessionRecord) {
  const allocations = state.classResourceAllocations.filter((allocation) => allocation.classSessionId === session.id);
  const options = classResourceAllocationOptions(session);
  const canAllocate = currentPermissions().includes(Permission.ClassWrite);
  const disabled = !canAllocate || options.length === 0;
  return `
    <section class="class-resource-panel">
      <div class="class-resource-head">
        <div>
          <h4>Class resources</h4>
          <p class="club-copy">Attach rooms, courts, equipment, or staff-linked human resources to this session.</p>
        </div>
        <span>${allocations.length} allocated</span>
      </div>
      <div class="class-resource-list">
        ${allocations.length > 0
          ? allocations.map((allocation) => renderClassResourceAllocation(allocation)).join("")
          : `<div class="empty-state compact"><p>No resources allocated to this class yet.</p></div>`}
      </div>
      <form id="allocate-class-resource-form" class="compact-form class-resource-form">
        <input type="hidden" name="sessionId" value="${escapeAttribute(session.id)}" />
        ${renderSelect(
          "resourceId",
          "Add resource",
          options.length > 0 ? options : [{ value: "", label: "No eligible resources available" }],
          options[0]?.value ?? "",
          disabled
        )}
        <div class="two-up stacked-mobile">
          ${renderInput("startsAt", "Custom starts at", "datetime-local", "", disabled)}
          ${renderInput("endsAt", "Custom ends at", "datetime-local", "", disabled)}
        </div>
        <label class="permission-chip">
          <input type="checkbox" name="overrideConflict" value="true" ${disabled ? "disabled" : ""} />
          <span class="permission-chip-copy">
            <strong>Override conflicts</strong>
            <small>Requires a reason and records the staff override.</small>
          </span>
        </label>
        ${renderInput("overrideReason", "Override reason", "text", "", disabled)}
        <button type="submit" ${disabled ? "disabled" : ""}>Add class resource</button>
      </form>
    </section>
  `;
}

function renderClassResourceAllocation(allocation: ResourceAllocationRecord) {
  const resource = resourceById(allocation.resourceId);
  const resourceType = resource?.linkedStaffUserId ? "Human resource" : formatReservationStatus(resource?.resourceType ?? "Resource");
  const bufferLabel =
    allocation.bufferBeforeMinutes > 0 || allocation.bufferAfterMinutes > 0
      ? ` · Buffer ${allocation.bufferBeforeMinutes}/${allocation.bufferAfterMinutes} min`
      : "";
  return `
    <article class="class-resource-item">
      <div>
        <strong>${escapeHtml(resourceDisplayName(allocation.resourceId))}</strong>
        <p class="club-copy">${escapeHtml(formatDateTimeRange(allocation.startsAt, allocation.endsAt))}${escapeHtml(bufferLabel)}</p>
      </div>
      <span>${escapeHtml(resourceType)}${allocation.staffOverride ? " · Override" : ""}</span>
    </article>
  `;
}

function renderFacilityReservationDetail(reservationId: string) {
  const reservation = state.facilityReservations.find((candidate) => candidate.id === reservationId);
  if (!reservation) {
    return `<div class="data-card"><div class="empty-state"><p>Resource reservation not found.</p></div></div>`;
  }
  const canCancel = currentPermissions().includes(Permission.BookingWrite) && reservation.status !== "cancelled";
  return `
    <div class="data-card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(resourceDisplayName(reservation.resourceId))}</h3>
          <p class="club-copy">${escapeHtml(formatDateTimeRange(reservation.startsAt, reservation.endsAt))}</p>
        </div>
        <span>${escapeHtml(formatReservationStatus(reservation.status))}</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Customer</span><strong>${escapeHtml(memberDisplayName(reservation.memberId))}</strong></article>
        <article class="mini-card"><span>Location</span><strong>${escapeHtml(locationDisplayName(reservation.locationId ?? resourceById(reservation.resourceId)?.locationId))}</strong></article>
        <article class="mini-card"><span>Price</span><strong>${escapeHtml(formatReservationCurrency(reservation.amountCents))}</strong></article>
        <article class="mini-card"><span>Payment</span><strong>${escapeHtml(formatReservationStatus(reservation.paymentStatus))}</strong></article>
      </div>
      ${reservation.note ? `<div class="club-note"><span class="club-note-label">Note</span><p>${escapeHtml(reservation.note)}</p></div>` : ""}
      <form id="cancel-resource-reservation-form" class="compact-form reservation-cancel-form">
        <input type="hidden" name="reservationId" value="${escapeAttribute(reservation.id)}" />
        ${renderInput("reason", "Cancellation reason")}
        <button type="submit" class="danger-button" ${canCancel ? "" : "disabled"}>Cancel reservation</button>
      </form>
    </div>
  `;
}

function renderCreateResourceReservationForm() {
  const canBook = currentPermissions().includes(Permission.BookingWrite);
  const resources = bookableResourceOptions();
  const members = reservationMemberOptions();
  const now = new Date();
  const startsAt = isoToDatetimeLocal(new Date(now.getTime() + 60 * 60 * 1000));
  const endsAt = isoToDatetimeLocal(new Date(now.getTime() + 2 * 60 * 60 * 1000));
  const disabled = !canBook || resources.length === 0 || members.length === 0;
  return `
    <form id="create-resource-reservation-form" class="form-card">
      <div>
        <h3>Create resource reservation</h3>
        <p class="club-copy">Reserve a room, court, scarce equipment, or staff-linked resource for one customer.</p>
      </div>
      ${renderSelect("resourceId", "Resource", resources, resources[0]?.value ?? "")}
      ${renderSelect("memberId", "Customer", members, members[0]?.value ?? "")}
      <div class="two-up stacked-mobile">
        ${renderInput("startsAt", "Starts at", "datetime-local", startsAt)}
        ${renderInput("endsAt", "Ends at", "datetime-local", endsAt)}
      </div>
      ${renderInput("note", "Note")}
      <label class="permission-chip">
        <input type="checkbox" name="overrideConflict" value="true" />
        <span class="permission-chip-copy">
          <strong>Override conflicts</strong>
          <small>Requires a reason and records the staff override.</small>
        </span>
      </label>
      ${renderInput("overrideReason", "Override reason")}
      <button type="submit" ${disabled ? "disabled" : ""}>Create reservation</button>
    </form>
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
        <span>${deviceList.devices.length} devices Â· ${events.deniedCount} denied events</span>
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

function renderWeeklyPlanView() {
  const plan = state.weeklyRevenuePlan;
  if (!plan) {
    return `
      <section class="club-panel club-page weekly-plan-page">
        <div class="card-head">
          <div>
            <p class="eyebrow">Weekly Plan</p>
            <h2>Weekly revenue action plan</h2>
          </div>
        </div>
        <div class="empty-state">
          <h3>No weekly plan ready yet</h3>
          <p>Import campaign data or refresh the dashboard so the system can generate this week's plan.</p>
        </div>
      </section>
    `;
  }
  const campaignAction = plan.actions.find((action) => action.campaign);
  const clients = weeklyPlanClients(plan);
  const resources = weeklyPlanResources(plan);
  return `
    <section class="club-panel club-page weekly-plan-page">
      <div class="weekly-plan-hero">
        <div>
          <p class="eyebrow">Weekly Plan</p>
          <h2>Weekly revenue action plan</h2>
          <p>${escapeHtml(plan.summary)}</p>
        </div>
        <div class="weekly-plan-total">
          <span>Estimated opportunity</span>
          <strong>${escapeHtml(formatCurrency(plan.totalEstimatedRevenueCents))}</strong>
          <small>Week of ${escapeHtml(formatWeekDate(plan.weekStartDate))}</small>
        </div>
      </div>
      <div class="weekly-plan-grid">
        <section class="migration-files-panel weekly-plan-leaks">
          <div class="card-head">
            <div>
              <h3>Revenue leaks to watch</h3>
              <p class="muted">Plain-English things costing the gym money this week.</p>
            </div>
          </div>
          <ul>
            ${plan.revenueLeaks.map((leak) => `<li>${escapeHtml(leak)}</li>`).join("")}
          </ul>
        </section>
        <section class="migration-files-panel">
          <div class="card-head">
            <div>
              <h3>Campaign to run</h3>
              <p class="muted">Copy this into your SMS/email tool for now.</p>
            </div>
            ${campaignAction ? `<button type="button" class="ghost-button" data-weekly-copy-action="${escapeAttribute(campaignAction.id)}">Copy text</button>` : ""}
          </div>
          ${campaignAction?.campaign
            ? renderWeeklyCampaignCopy(campaignAction.campaign)
            : `<div class="empty-state"><h3>No campaign selected</h3><p>Generate a plan after importing clients and bookings.</p></div>`}
        </section>
      </div>
      <section class="migration-files-panel">
        <div class="card-head">
          <div>
            <h3>Top 3 actions</h3>
            <p class="muted">Do these first. Keep the week simple.</p>
          </div>
          <span>${plan.actions.filter((action) => action.done).length} of ${plan.actions.length} done</span>
        </div>
        <div class="weekly-action-list">
          ${plan.actions.map(renderWeeklyActionCard).join("")}
        </div>
      </section>
      <div class="weekly-plan-grid">
        <section class="migration-files-panel">
          <div class="card-head">
            <div>
              <h3>Clients to contact</h3>
              <p class="muted">The warmest people to message first.</p>
            </div>
            <span>${clients.length} clients</span>
          </div>
          ${clients.length ? `
            <div class="weekly-client-list">
              ${clients.map((client) => `
                <article>
                  <strong>${escapeHtml(client.name)}</strong>
                  <span>${escapeHtml(client.reason)}</span>
                  <small>${escapeHtml([client.email, client.phone].filter(Boolean).join(" - ") || "No contact info")}</small>
                </article>
              `).join("")}
            </div>
          ` : `<div class="empty-state"><h3>No client list yet</h3><p>Import clients, bookings, and memberships to fill this in.</p></div>`}
        </section>
        <section class="migration-files-panel">
          <div class="card-head">
            <div>
              <h3>Resources/devices to fix</h3>
              <p class="muted">The clearest schedule gaps to address.</p>
            </div>
            <span>${resources.length} related</span>
          </div>
          ${resources.length ? `
            <div class="weekly-resource-list">
              ${resources.map((resource) => `
                <article>
                  <strong>${escapeHtml(resource.name)}</strong>
                  <span>${escapeHtml(resource.type)} - ${Math.round(resource.utilizationPercentage)}% utilized</span>
                  <small>${escapeHtml(resource.weakestTimeBlock)}</small>
                </article>
              `).join("")}
            </div>
          ` : `<div class="empty-state"><h3>No underused resource yet</h3><p>Import rooms/devices and bookings to find weak windows.</p></div>`}
        </section>
      </div>
    </section>
  `;
}

function renderWeeklyActionCard(action: WeeklyRevenuePlanActionRecord) {
  return `
    <article class="weekly-action-card ${action.done ? "done" : ""}">
      <div class="card-head">
        <div>
          <h4>${escapeHtml(action.title)}</h4>
          <p class="muted">${escapeHtml(action.description)}</p>
        </div>
        <button type="button" class="${action.done ? "ghost-button" : ""}" data-weekly-action-id="${escapeAttribute(action.id)}" data-weekly-action-done="${action.done ? "false" : "true"}">
          ${action.done ? "Undo" : "Mark done"}
        </button>
      </div>
      <div class="campaign-draft-meta weekly-action-meta">
        <span><strong>Opportunity</strong>${escapeHtml(formatCurrency(action.estimatedRevenueCents))}</span>
        <span><strong>Clients</strong>${action.clients.length}</span>
        <span><strong>Resources</strong>${action.resources.length}</span>
      </div>
      <p>${escapeHtml(action.ownerNote)}</p>
      ${action.premiumProgramIdea ? `
        <div class="weekly-program-idea">
          <strong>${escapeHtml(action.premiumProgramIdea.title)}</strong>
          <span>${escapeHtml(action.premiumProgramIdea.schedule)} - ${escapeHtml(formatCurrency(action.premiumProgramIdea.recommendedPriceCents))}</span>
          <p>${escapeHtml(action.premiumProgramIdea.description)}</p>
        </div>
      ` : ""}
    </article>
  `;
}

function renderWeeklyCampaignCopy(campaign: WeeklyRevenuePlanCampaignRecord) {
  return `
    <div class="campaign-message-box">
      <strong>${escapeHtml(campaign.name)}</strong>
      <span class="muted">${escapeHtml(campaign.targetSegment)}</span>
      <p><strong>SMS:</strong> ${escapeHtml(campaign.smsMessage)}</p>
      <p><strong>Email subject:</strong> ${escapeHtml(campaign.emailSubject)}</p>
      <pre>${escapeHtml(campaign.emailBody)}</pre>
    </div>
  `;
}

function renderRoiTrackingView() {
  const summary = state.roiTrackingSummary ?? emptyRoiSummary();
  const sourceOptions = roiSourceOptions();
  const topCampaign = summary.topCampaignByRevenue;
  return `
    <section class="club-panel club-page roi-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">ROI</p>
          <h2>ROI tracking</h2>
          <p class="muted">Manually log results from campaigns and weekly actions so owners can see what the app is helping produce.</p>
        </div>
        <span>${state.roiTrackingEntries.length} entries</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Total revenue generated by app</span><strong>${escapeHtml(formatCurrency(summary.totalRevenueGeneratedCents))}</strong></article>
        <article class="mini-card"><span>Revenue this month</span><strong>${escapeHtml(formatCurrency(summary.revenueGeneratedThisMonthCents))}</strong></article>
        <article class="mini-card"><span>Top campaign</span><strong>${escapeHtml(topCampaign ? topCampaign.sourceLabel : "None yet")}</strong><p class="muted">${escapeHtml(topCampaign ? formatCurrency(topCampaign.revenueGeneratedCents) : "Log campaign revenue to fill this in.")}</p></article>
        <article class="mini-card"><span>Estimated ROI</span><strong>${summary.estimatedRoiPercent}%</strong><p class="muted">Compared to ${escapeHtml(formatCurrency(summary.monthlySoftwareCostCents))}/mo software cost.</p></article>
      </div>
      <div class="roi-grid">
        <section class="migration-files-panel">
          <div class="card-head">
            <div>
              <h3>Log a result</h3>
              <p class="muted">Pick a campaign or weekly action and enter what happened.</p>
            </div>
          </div>
          <form id="roi-tracking-form" class="roi-form">
            <label class="field roi-form-span">
              <span>Campaign or weekly action</span>
              <select name="sourceKey" ${sourceOptions.length ? "" : "disabled"}>
                ${sourceOptions.length
                  ? sourceOptions.map((option) => `<option value="${escapeAttribute(option.key)}">${escapeHtml(option.label)}</option>`).join("")
                  : `<option>No campaigns or weekly actions loaded</option>`}
              </select>
            </label>
            ${renderInput("bookingsGenerated", "Bookings generated", "number", "0")}
            ${renderInput("revenueGenerated", "Revenue generated", "number", "0")}
            ${renderInput("membershipsSold", "Memberships sold", "number", "0")}
            ${renderInput("packagesSold", "Packages sold", "number", "0")}
            <label class="field roi-form-span">
              <span>Notes</span>
              <textarea name="notes" placeholder="Example: 3 people booked from the SMS and one upgraded at the desk."></textarea>
            </label>
            <div class="roi-form-actions roi-form-span">
              <button type="submit" ${sourceOptions.length ? "" : "disabled"}>Save ROI entry</button>
            </div>
          </form>
        </section>
        <section class="migration-files-panel">
          <div class="card-head">
            <div>
              <h3>Outcome totals</h3>
              <p class="muted">Manual results entered so far.</p>
            </div>
          </div>
          <div class="campaign-draft-meta roi-mini-metrics">
            <span><strong>Bookings</strong>${summary.bookingsGenerated}</span>
            <span><strong>Memberships</strong>${summary.membershipsSold}</span>
            <span><strong>Packages</strong>${summary.packagesSold}</span>
          </div>
          <div class="weekly-program-idea">
            <strong>ROI estimate</strong>
            <span>${escapeHtml(formatCurrency(summary.revenueGeneratedThisMonthCents))} this month - ${escapeHtml(formatCurrency(summary.monthlySoftwareCostCents))} software cost</span>
            <p>${summary.estimatedRoiPercent >= 0
              ? `Estimated return is ${summary.estimatedRoiPercent}% above monthly software cost.`
              : `Revenue has not covered the monthly software cost yet.`}</p>
          </div>
        </section>
      </div>
      <section class="migration-files-panel">
        <div class="card-head">
          <div>
            <h3>ROI entries</h3>
            <p class="muted">The latest manual campaign and action outcomes.</p>
          </div>
        </div>
        ${state.roiTrackingEntries.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Revenue</th>
                  <th>Bookings</th>
                  <th>Memberships</th>
                  <th>Packages</th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${state.roiTrackingEntries.map((entry) => `
                  <tr>
                    <td>${escapeHtml(entry.sourceLabel)}<br /><small class="muted">${entry.sourceType === "campaign" ? "Campaign" : "Weekly action"}</small></td>
                    <td>${escapeHtml(formatCurrency(entry.revenueGeneratedCents))}</td>
                    <td>${entry.bookingsGenerated}</td>
                    <td>${entry.membershipsSold}</td>
                    <td>${entry.packagesSold}</td>
                    <td>${escapeHtml(entry.notes || "")}</td>
                    <td>${escapeHtml(formatDateLabel(entry.createdAt))}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : `<div class="empty-state"><h3>No ROI entries yet</h3><p>Log the result of a campaign or weekly action after it produces bookings, sales, or revenue.</p></div>`}
      </section>
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

function renderCampaignLayerView() {
  if (!hasPermission(Permission.GymUpdate)) {
    return `
      <section class="club-panel club-page">
        <div class="empty-state">
          <h3>Campaign layer access needed</h3>
          <p>Only gym owners or admins can view campaign revenue tools.</p>
        </div>
      </section>
    `;
  }
  const metrics = campaignLayerMetrics();
  return `
    <section class="club-panel club-page campaign-layer-page">
      <div class="card-head">
        <div>
          <p class="eyebrow">Campaign Layer</p>
          <h2>${escapeHtml(campaignLayerPageLabel(state.campaignLayerPage))}</h2>
          <p class="club-copy">Find missed revenue, underused capacity, and clients who need the next best action.</p>
        </div>
        <span>${escapeHtml(campaignLayerPageLabel(state.campaignLayerPage))}</span>
      </div>
      ${renderCampaignLayerNav()}
      <div class="campaign-layer-scroll">
        ${renderCampaignLayerContent(metrics)}
      </div>
    </section>
  `;
}

function renderCampaignLayerNav() {
  return `
    <nav class="campaign-layer-nav" aria-label="Campaign layer sections">
      ${CAMPAIGN_LAYER_PAGES.map((page) => `
        <a
          href="${campaignLayerPageToHash(page.key)}"
          class="module-nav-button ${state.campaignLayerPage === page.key ? "active" : ""}"
        >
          ${escapeHtml(page.label)}
        </a>
      `).join("")}
    </nav>
  `;
}

function renderCampaignLayerContent(metrics: CampaignLayerMetrics) {
  switch (state.campaignLayerPage) {
    case "imports":
      return renderCampaignImportsPage();
    case "opportunities":
      return renderCampaignOpportunitiesPage(metrics);
    case "utilization":
      return renderCampaignUtilizationPage(metrics);
    case "clients":
      return renderCampaignClientsPage(metrics);
    case "campaigns":
      return renderCampaignCampaignsPage(metrics);
    case "programs":
      return renderCampaignProgramsPage(metrics);
    case "settings":
      return renderCampaignSettingsPage(metrics);
    case "dashboard":
    default:
      return renderCampaignDashboardHome(metrics);
  }
}

function renderCampaignDashboardHome(metrics: CampaignLayerMetrics) {
  return `
    <div class="campaign-kpi-grid">
      <article class="mini-card campaign-kpi-card accent">
        <span>Estimated missed revenue this month</span>
        <strong>${formatCurrency(metrics.estimatedMissedRevenueCents)}</strong>
        <p class="muted">Calculated from inactive clients, low-usage members, unconverted visitors, and idle capacity.</p>
      </article>
      <article class="mini-card">
        <span>Underused rooms/devices</span>
        <strong>${metrics.underusedResources.length}</strong>
        <p class="muted">${metrics.resources.length ? "No activity this month." : "Import rooms/devices to measure this."}</p>
      </article>
      <article class="mini-card">
        <span>Inactive members</span>
        <strong>${metrics.inactiveMembers.length}</strong>
        <p class="muted">Cancelled, expired, frozen, past due, archived, or inactive records.</p>
      </article>
      <article class="mini-card">
        <span>Unused credit members</span>
        <strong>${metrics.unusedCreditMembers.length}</strong>
        <p class="muted">Active members with no recent check-in signal.</p>
      </article>
      <article class="mini-card">
        <span>First-time visitors not converted</span>
        <strong>${metrics.firstTimeVisitorsNotConverted.length}</strong>
        <p class="muted">Leads and trials that should be followed up.</p>
      </article>
    </div>

    <div class="campaign-dashboard-grid">
      <section class="migration-files-panel">
        <div class="card-head">
          <div>
            <h3>Top 5 recommended revenue actions</h3>
            <p class="muted">Sorted by estimated impact for this month.</p>
          </div>
          <span>${metrics.actions.length} actions</span>
        </div>
        ${renderCampaignActionsTable(metrics.actions)}
      </section>

      <section class="migration-files-panel campaign-chart-card">
        <div class="card-head">
          <div>
            <h3>Opportunity mix</h3>
            <p class="muted">Where the campaign layer sees revenue leakage.</p>
          </div>
        </div>
        ${renderCampaignOpportunityChart(metrics)}
      </section>
    </div>
  `;
}

function renderCampaignImportsPage() {
  const preview = state.campaignImportPreview;
  const selectedType = preview?.importType ?? state.campaignImportType;
  const expectedFields = preview?.expectedFields ?? CAMPAIGN_IMPORT_EXPECTED_FIELDS[selectedType];
  const targetFields = preview?.targetFields ?? ["ignore", ...expectedFields.map((field) => field.field)];
  return `
    <div class="campaign-page-stack">
      <div class="card-head">
        <div>
          <h3>Import operational CSVs</h3>
          <p class="club-copy">Import operational CSVs into a clean campaign data layer, even when you only have part of the old system export.</p>
        </div>
        <span>${state.campaignImports.length} imports</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card">
          <span>Audience segments</span>
          <strong>${state.members.length}</strong>
          <p class="muted">Use members, customers, and leads as campaign audiences.</p>
        </article>
        <article class="mini-card">
          <span>Leads</span>
          <strong>${state.members.filter((member) => member.status === MemberStatus.Lead).length}</strong>
          <p class="muted">Future follow-up and tour booking campaigns can start here.</p>
        </article>
        <article class="mini-card">
          <span>Offers</span>
          <strong>${state.publicPlans.length}</strong>
          <p class="muted">Connect campaigns to public plans, trials, and packages.</p>
        </article>
        <article class="mini-card">
          <span>Status</span>
          <strong>${preview ? "Mapping" : "Ready"}</strong>
          <p class="muted">Upload one CSV at a time. Partial imports are supported.</p>
        </article>
      </div>
      <div class="migration-assistant-grid">
        <form id="campaign-csv-preview-form" class="form-card migration-upload-card">
          <div class="card-head">
            <div>
              <h3>CSV import</h3>
              <p class="muted">Choose a data type, upload a CSV, then map columns before saving.</p>
            </div>
            <span>Upload</span>
          </div>
          <label class="field">
            <span>Import type</span>
            <select name="importType" data-campaign-import-type>
              ${CAMPAIGN_IMPORT_TYPES.map(
                (type) =>
                  `<option value="${type.value}" ${type.value === selectedType ? "selected" : ""}>${type.label}</option>`
              ).join("")}
            </select>
          </label>
          <label class="migration-dropzone">
            <span>Choose CSV file</span>
            <input name="campaignCsvFile" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" />
          </label>
          <label class="field">
            <span>Delimiter</span>
            <select name="delimiter">
              <option value="auto">Auto detect</option>
              <option value="comma">Comma</option>
              <option value="tab">Tab</option>
            </select>
          </label>
          <button type="submit" class="save-button">Preview CSV</button>
        </form>

        <div class="migration-files-panel">
          <div class="card-head">
            <div>
              <h3>Expected fields</h3>
              <p class="muted">${escapeHtml(campaignImportTypeLabel(selectedType))} can be imported with any subset of these columns.</p>
            </div>
            <span>${expectedFields.length} fields</span>
          </div>
          <div class="campaign-field-grid">
            ${expectedFields.map((field) => `
              <article class="mini-card">
                <span>${escapeHtml(field.required ? "Recommended" : "Optional")}</span>
                <strong>${escapeHtml(field.label)}</strong>
                <p class="muted">${escapeHtml(field.description)}</p>
              </article>
            `).join("")}
          </div>
        </div>
      </div>

      ${preview ? renderCampaignImportPreview(preview, targetFields) : ""}
      ${state.campaignImportSummary ? renderCampaignImportSummary(state.campaignImportSummary) : ""}
      ${renderCampaignImportHistory()}
    </div>
  `;
}

function renderCampaignOpportunitiesPage(metrics: CampaignLayerMetrics) {
  return `
    <div class="campaign-page-stack">
      <section class="migration-files-panel">
        <div class="card-head">
          <div>
            <h3>Revenue opportunities</h3>
            <p class="muted">Prioritized actions the campaign layer can eventually automate.</p>
          </div>
          <span>${formatCurrency(metrics.estimatedMissedRevenueCents)} potential</span>
        </div>
        ${renderCampaignActionsTable(metrics.actions)}
      </section>
      <div class="stat-grid compact">
        ${metrics.actions.map((action) => `
          <article class="mini-card">
            <span>${escapeHtml(action.category)}</span>
            <strong>${formatCurrency(action.impactCents)}</strong>
            <p class="muted">${escapeHtml(action.detail)}</p>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderCampaignUtilizationPage(metrics: CampaignLayerMetrics) {
  const utilization = state.roomDeviceUtilization;
  const rows = utilization?.resources ?? fallbackRoomDeviceUtilization(metrics);
  const summary = utilization?.summary ?? summarizeFallbackUtilization(rows);
  const resourceTypes = utilization?.filters.resourceTypes ?? uniqueStrings(rows.map((row) => row.type));
  const serviceCategories = utilization?.filters.serviceCategories ?? uniqueStrings(rows.flatMap((row) => row.serviceCategories));
  const topRows = rows.slice(0, 8);
  return `
    <div class="campaign-page-stack">
      <form id="campaign-utilization-filter-form" class="migration-files-panel campaign-utilization-filters" data-campaign-utilization-form>
        <div class="card-head">
          <div>
            <h3>Room and device utilization</h3>
            <p class="muted">Filter resource performance by date range, type, and service category.</p>
          </div>
          <span>${rows.length} resources</span>
        </div>
        <div class="campaign-filter-grid">
          <label class="field">
            <span>Date from</span>
            <input name="from" type="date" value="${escapeAttribute(state.campaignUtilizationFrom)}" />
          </label>
          <label class="field">
            <span>Date to</span>
            <input name="to" type="date" value="${escapeAttribute(state.campaignUtilizationTo)}" />
          </label>
          <label class="field">
            <span>Resource type</span>
            <select name="resourceType">
              <option value="">All resource types</option>
              ${resourceTypes.map((type) => `
                <option value="${escapeAttribute(type)}" ${type === state.campaignUtilizationResourceType ? "selected" : ""}>${escapeHtml(type)}</option>
              `).join("")}
            </select>
          </label>
          <label class="field">
            <span>Service category</span>
            <select name="serviceCategory">
              <option value="">All service categories</option>
              ${serviceCategories.map((category) => `
                <option value="${escapeAttribute(category)}" ${category === state.campaignUtilizationServiceCategory ? "selected" : ""}>${escapeHtml(category)}</option>
              `).join("")}
            </select>
          </label>
          <button type="submit" class="save-button">Apply filters</button>
        </div>
      </form>

      <div class="stat-grid compact">
        <article class="mini-card">
          <span>Booked hours</span>
          <strong>${formatHours(summary.bookedHours)}</strong>
          <p class="muted">Detected bookings in the selected window.</p>
        </article>
        <article class="mini-card">
          <span>Available hours</span>
          <strong>${formatHours(summary.availableHours)}</strong>
          <p class="muted">Estimated bookable capacity for matching resources.</p>
        </article>
        <article class="mini-card">
          <span>Utilization</span>
          <strong>${summary.utilizationPercentage}%</strong>
          <p class="muted">Booked hours divided by available hours.</p>
        </article>
        <article class="mini-card">
          <span>Estimated revenue</span>
          <strong>${formatCurrency(summary.estimatedRevenueCents)}</strong>
          <p class="muted">Revenue tied to detected bookings.</p>
        </article>
        <article class="mini-card">
          <span>Missed revenue</span>
          <strong>${formatCurrency(summary.estimatedMissedRevenueCents)}</strong>
          <p class="muted">Gap to a ${Math.round(45)}% utilization target.</p>
        </article>
      </div>

      <div class="campaign-dashboard-grid">
        <section class="migration-files-panel campaign-chart-card">
          <div class="card-head">
            <div>
              <h3>Utilization bar chart</h3>
              <p class="muted">Lowest utilization appears first so off-peak opportunities are easy to spot.</p>
            </div>
            <span>${summary.utilizationPercentage}% average</span>
          </div>
          ${topRows.length
            ? `
              <div class="campaign-utilization-list">
                ${topRows.map((resource) => `
                  <div class="campaign-utilization-row">
                    <div>
                      <strong>${escapeHtml(resource.name)}</strong>
                      <span>${escapeHtml(resource.type)}</span>
                    </div>
                    <div class="campaign-meter"><span style="width: ${Math.max(3, Math.min(100, resource.utilizationPercentage))}%"></span></div>
                    <small>${resource.utilizationPercentage}%</small>
                  </div>
                `).join("")}
              </div>
            `
            : `<div class="empty-state"><h3>No utilization data</h3><p>Import rooms/devices and bookings, or create resources and reservations.</p></div>`}
        </section>

        <section class="migration-files-panel">
          <div class="card-head">
            <h3>Weakest windows</h3>
            <span>${rows.filter((row) => row.utilizationPercentage < 25).length} underused</span>
          </div>
          ${rows.length
            ? rows.slice(0, 6).map((resource) => `
              <article class="campaign-action-card">
                <strong>${escapeHtml(resource.name)}</strong>
                <span>${escapeHtml(resource.weakestDay)} · ${escapeHtml(resource.weakestTimeBlock)}</span>
              </article>
            `).join("")
            : `<div class="empty-state"><h3>No weak windows yet</h3><p>Once bookings are loaded, this will show the clearest off-peak gaps.</p></div>`}
        </section>
      </div>

      <section class="migration-files-panel">
        <div class="card-head">
          <div>
            <h3>Room/device table</h3>
            <p class="muted">Includes booked hours, available hours, revenue estimates, and suggested action entry points.</p>
          </div>
          <span>${rows.length} shown</span>
        </div>
        ${rows.length
          ? `
            <div class="table-wrap campaign-utilization-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Booked</th>
                    <th>Available</th>
                    <th>Util.</th>
                    <th>Revenue</th>
                    <th>Missed</th>
                    <th>Busiest</th>
                    <th>Weakest</th>
                    <th>Weakest time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map((resource) => `
                    <tr>
                      <td><strong>${escapeHtml(resource.name)}</strong></td>
                      <td>${escapeHtml(resource.type)}</td>
                      <td>${formatHours(resource.bookedHoursThisWeek)}</td>
                      <td>${formatHours(resource.availableHoursThisWeek)}</td>
                      <td>${resource.utilizationPercentage}%</td>
                      <td>${formatCurrency(resource.estimatedRevenueCents)}</td>
                      <td>${formatCurrency(resource.estimatedMissedRevenueCents)}</td>
                      <td>${escapeHtml(resource.busiestDay)}</td>
                      <td>${escapeHtml(resource.weakestDay)}</td>
                      <td>${escapeHtml(resource.weakestTimeBlock)}</td>
                      <td>
                        <div class="campaign-table-actions">
                          <button type="button" class="ghost-button" data-utilization-action="campaign" data-resource-name="${escapeAttribute(resource.name)}">Generate off-peak campaign</button>
                          <button type="button" class="ghost-button" data-utilization-action="program" data-resource-name="${escapeAttribute(resource.name)}">Suggest premium program</button>
                          <button type="button" class="ghost-button" data-utilization-action="bookings" data-resource-name="${escapeAttribute(resource.name)}">View bookings</button>
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          `
          : `<div class="empty-state"><h3>No rooms or devices match</h3><p>Change the filters or import rooms/devices and bookings in Campaign Layer Imports.</p></div>`}
      </section>
    </div>
  `;
}

function fallbackRoomDeviceUtilization(metrics: CampaignLayerMetrics): RoomDeviceUtilizationRecord[] {
  return metrics.resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    type: resource.resourceType ?? "Resource",
    bookedHoursThisWeek: resource.useCount,
    availableHoursThisWeek: 40,
    utilizationPercentage: resource.utilizationPercent,
    estimatedRevenue: 0,
    estimatedRevenueCents: 0,
    estimatedMissedRevenue: Math.max(0, 18 - resource.useCount) * 35,
    estimatedMissedRevenueCents: Math.max(0, 18 - resource.useCount) * 3500,
    busiestDay: resource.useCount > 0 ? "Loaded from reservations" : "No bookings yet",
    weakestDay: "Needs booking import",
    weakestTimeBlock: "Needs booking times",
    bookingCount: resource.useCount,
    serviceCategories: []
  }));
}

function summarizeFallbackUtilization(rows: RoomDeviceUtilizationRecord[]): RoomDeviceUtilizationResponse["summary"] {
  const bookedHours = rows.reduce((total, row) => total + row.bookedHoursThisWeek, 0);
  const availableHours = rows.reduce((total, row) => total + row.availableHoursThisWeek, 0);
  return {
    bookedHours,
    availableHours,
    utilizationPercentage: availableHours > 0 ? Math.round((bookedHours / availableHours) * 1000) / 10 : 0,
    estimatedRevenueCents: rows.reduce((total, row) => total + row.estimatedRevenueCents, 0),
    estimatedMissedRevenueCents: rows.reduce((total, row) => total + row.estimatedMissedRevenueCents, 0),
    resourceCount: rows.length
  };
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function formatHours(value: number) {
  return `${Math.round(value * 10) / 10}h`;
}

function renderCampaignClientsPage(metrics: CampaignLayerMetrics) {
  const segmentation = state.campaignClientSegments ?? fallbackCampaignClientSegments(metrics);
  const selectedSegment =
    segmentation.segments.find((segment) => segment.key === state.selectedCampaignClientSegment) ??
    segmentation.segments[0];
  const rows = selectedSegment?.clients ?? [];
  return `
    <div class="campaign-page-stack">
      <div class="stat-grid compact">
        <article class="mini-card">
          <span>Total clients</span>
          <strong>${segmentation.summary.totalClients}</strong>
          <p class="muted">Loaded from app records and campaign imports.</p>
        </article>
        <article class="mini-card">
          <span>Segment matches</span>
          <strong>${segmentation.summary.totalSegmentMatches}</strong>
          <p class="muted">Clients can appear in more than one segment.</p>
        </article>
        <article class="mini-card">
          <span>Average spend</span>
          <strong>${formatCurrency(segmentation.averageClientSpendCents)}</strong>
          <p class="muted">Used to detect high-value clients.</p>
        </article>
        ${segmentation.segments.slice(0, 2).map((segment) => `
          <article class="mini-card">
            <span>${escapeHtml(segment.label)}</span>
            <strong>${segment.count}</strong>
            <p class="muted">${escapeHtml(segment.description)}</p>
          </article>
        `).join("")}
      </div>

      <section class="migration-files-panel">
        <div class="card-head">
          <div>
            <h3>Client segments</h3>
            <p class="muted">Use tabs to pick the audience, then send the matching recommended action.</p>
          </div>
          <span>${segmentation.segments.length} segments</span>
        </div>
        <div class="campaign-segment-tabs">
          ${segmentation.segments.map((segment) => `
            <button
              type="button"
              class="tab-btn ${segment.key === selectedSegment?.key ? "active" : ""}"
              data-campaign-client-segment="${escapeAttribute(segment.key)}"
            >
              ${escapeHtml(segment.label)}
              <span class="consumer-tab-count">${segment.count}</span>
            </button>
          `).join("")}
        </div>
        ${selectedSegment ? `
          <div class="campaign-segment-head">
            <div>
              <h4>${escapeHtml(selectedSegment.label)}</h4>
              <p class="muted">${escapeHtml(selectedSegment.description)}</p>
            </div>
            <span>${selectedSegment.count} clients</span>
          </div>
        ` : ""}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Last visit</th>
                <th>Total spend</th>
                <th>Membership status</th>
                <th>Recommended action</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length
                ? rows.map((row) => `
                  <tr>
                    <td><strong>${escapeHtml(row.clientName)}</strong></td>
                    <td>${escapeHtml(row.email ?? "No email")}</td>
                    <td>${escapeHtml(row.phone ?? "No phone")}</td>
                    <td>${escapeHtml(formatClientSegmentDate(row.lastVisitDate))}</td>
                    <td>${formatCurrency(row.totalSpendCents)}</td>
                    <td>${escapeHtml(formatHeaderLabel(row.membershipStatus))}</td>
                    <td>${escapeHtml(row.recommendedAction)}</td>
                  </tr>
                `).join("")
                : `<tr><td colspan="7">No clients currently match this segment.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function fallbackCampaignClientSegments(metrics: CampaignLayerMetrics): CampaignClientSegmentsResponse {
  const now = new Date().toISOString();
  const inactiveRows = metrics.inactiveMembers.map((member) => fallbackSegmentRow(member, "Send a reactivation message with a class invite."));
  const unusedCreditRows = metrics.unusedCreditMembers.map((member) => fallbackSegmentRow(member, "Send a use-your-credits reminder."));
  const firstVisitRows = metrics.firstTimeVisitorsNotConverted.map((member) => fallbackSegmentRow(member, "Send a first-visit follow-up."));
  const segments: CampaignClientSegment[] = [
    {
      key: "inactive_members",
      label: "Inactive Members",
      description: "Active membershipStatus but lastVisitDate older than 21 days.",
      count: inactiveRows.length,
      clients: inactiveRows
    },
    {
      key: "unused_credit_members",
      label: "Unused Credit Members",
      description: "Active members with remainingCredits > 0 and no recent booking.",
      count: unusedCreditRows.length,
      clients: unusedCreditRows
    },
    {
      key: "first_time_visitors",
      label: "First-Time Visitors",
      description: "Clients with one completed booking and no membership.",
      count: firstVisitRows.length,
      clients: firstVisitRows
    },
    {
      key: "high_value_clients",
      label: "High-Value Clients",
      description: "Clients with totalSpend above studio average by at least 50%.",
      count: 0,
      clients: []
    },
    {
      key: "upsell_candidates",
      label: "Upsell Candidates",
      description: "Clients who booked the same service 3+ times in the last 60 days but have no membership.",
      count: 0,
      clients: []
    },
    {
      key: "review_candidates",
      label: "Review Candidates",
      description: "Clients with 5+ completed visits in the last 90 days.",
      count: 0,
      clients: []
    }
  ];
  return {
    generatedAt: now,
    averageClientSpend: 0,
    averageClientSpendCents: 0,
    segments,
    summary: {
      totalClients: state.members.length,
      totalSegmentMatches: segments.reduce((total, segment) => total + segment.count, 0)
    }
  };
}

function fallbackSegmentRow(member: MemberRecord, recommendedAction: string): CampaignClientSegmentRow {
  return {
    id: member.id,
    clientName: `${member.firstName} ${member.lastName}`.trim() || "Client",
    email: member.email,
    phone: member.phone,
    lastVisitDate: member.updatedAt,
    totalSpend: 0,
    totalSpendCents: 0,
    membershipStatus: member.status,
    recommendedAction,
    evidence: {}
  };
}

function formatClientSegmentDate(value: string | undefined) {
  if (!value) {
    return "No visit recorded";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function renderCampaignCampaignsPage(_metrics: CampaignLayerMetrics) {
  const campaigns = state.generatedCampaigns;
  return `
    <section class="migration-files-panel campaign-generator-panel">
      <div class="card-head">
        <div>
          <h3>Campaign generator</h3>
          <p class="muted">Generate draft SMS and email copy from the current revenue segments. Nothing sends yet.</p>
        </div>
        <span>${campaigns.length} saved</span>
      </div>
      <form id="campaign-generator-form" class="campaign-generator-form">
        <label>
          Campaign type
          <select name="campaignType">
            ${CAMPAIGN_GENERATOR_TYPES.map((type) => `
              <option value="${type.value}" ${state.campaignGeneratorType === type.value ? "selected" : ""}>
                ${escapeHtml(type.label)}
              </option>
            `).join("")}
          </select>
        </label>
        <button type="submit">Generate campaign</button>
      </form>
      <div class="campaign-readiness-list">
        <span class="ready">SMS: draft only, Twilio-ready</span>
        <span class="ready">Email: draft only, SendGrid-ready</span>
        <span>Saved campaigns can be copied from this page</span>
      </div>
    </section>
    <section class="migration-files-panel">
      <div class="card-head">
        <div>
          <h3>Saved campaign drafts</h3>
          <p class="muted">Copy the generated content now; delivery status is stored for future send integrations.</p>
        </div>
        <span>${campaigns.length} draft${campaigns.length === 1 ? "" : "s"}</span>
      </div>
      ${campaigns.length === 0 ? `
        <div class="empty-state">
          <strong>No campaigns generated yet</strong>
          <p>Choose a campaign type above to create your first saved draft.</p>
        </div>
      ` : `
        <div class="generated-campaign-list">
          ${campaigns.map((campaign) => renderGeneratedCampaignCard(campaign)).join("")}
        </div>
      `}
    </section>
  `;
}

function renderGeneratedCampaignCard(campaign: GeneratedCampaignRecord) {
  return `
    <article class="generated-campaign-card">
      <div class="card-head">
        <div>
          <h4>${escapeHtml(campaign.name)}</h4>
          <p class="muted">${escapeHtml(campaignGeneratorTypeLabel(campaign.campaignType))} - ${escapeHtml(campaign.targetSegment)}</p>
        </div>
        <span class="status-pill">${escapeHtml(campaign.status)}</span>
      </div>
      <div class="campaign-draft-meta">
        <span><strong>Send time</strong>${escapeHtml(formatDateLabel(campaign.recommendedSendTime))}</span>
        <span><strong>Goal</strong>${escapeHtml(campaign.expectedGoal)}</span>
        <span><strong>Est. revenue</strong>${escapeHtml(formatCurrency(campaign.estimatedRevenueCents))}</span>
      </div>
      <div class="campaign-copy-grid">
        <div class="campaign-message-box">
          <div class="message-box-head">
            <strong>SMS</strong>
            <button type="button" class="ghost-button" data-campaign-copy="${escapeHtml(campaign.id)}" data-copy-type="sms">Copy SMS</button>
          </div>
          <p>${escapeHtml(campaign.smsMessage)}</p>
        </div>
        <div class="campaign-message-box">
          <div class="message-box-head">
            <strong>Email</strong>
            <button type="button" class="ghost-button" data-campaign-copy="${escapeHtml(campaign.id)}" data-copy-type="email">Copy email</button>
          </div>
          <p><strong>Subject:</strong> ${escapeHtml(campaign.emailSubject)}</p>
          <pre>${escapeHtml(campaign.emailBody)}</pre>
        </div>
      </div>
    </article>
  `;
}

function renderCampaignProgramsPage(metrics: CampaignLayerMetrics) {
  const importedProgramCount = state.campaignImports
    .filter((batch) => batch.importType === "services" || batch.importType === "memberships_packages")
    .reduce((total, batch) => total + batch.importedCount, 0);
  const programCards = [
    { label: "Saved programs", count: state.premiumRecoveryPrograms.length, description: "Premium recovery programs saved to the database." },
    { label: "Generated suggestions", count: state.premiumRecoveryProgramSuggestions.length, description: "Ideas based on underused rooms/devices." },
    { label: "Imported services/packages", count: importedProgramCount, description: "Rows saved in the campaign import layer." },
    { label: "Underused resources", count: metrics.underusedResources.length, description: "Rooms/devices that can anchor a premium offer." }
  ];
  return `
    <div class="stat-grid compact">
      ${programCards.map((card) => `
        <article class="mini-card">
          <span>${escapeHtml(card.label)}</span>
          <strong>${card.count}</strong>
          <p class="muted">${escapeHtml(card.description)}</p>
        </article>
      `).join("")}
    </div>
    <div class="campaign-dashboard-grid">
      <section class="migration-files-panel">
        <div class="card-head">
          <div>
            <h3>Premium recovery program builder</h3>
            <p class="muted">Create a sellable recovery program from services, rooms, devices, and an underused schedule window.</p>
          </div>
        </div>
        <form id="premium-program-builder-form" class="premium-program-form">
          ${renderInput("title", "Program title", "text", "Sunday Nervous System Reset")}
          ${renderInput("targetAudience", "Target audience", "text", "High-stress members and recovery-focused clients")}
          <label class="field">
            <span>Description</span>
            <textarea name="description">A guided recovery session that turns unused room time into a premium reset experience.</textarea>
          </label>
          <label class="field">
            <span>Included services</span>
            <input name="includedServices" type="text" value="Sauna, breathwork, recovery coaching" />
          </label>
          ${renderInput("recommendedPrice", "Recommended price", "number", "49")}
          ${renderInput("capacity", "Capacity", "number", "8")}
          ${renderInput("schedule", "Schedule", "text", "Sunday Evening")}
          ${renderInput("durationWeeks", "Duration in weeks", "number", "1")}
          <label class="field premium-program-span">
            <span>Campaign copy</span>
            <textarea name="campaignCopy">Reset before Monday with a guided recovery session designed to help your nervous system settle.</textarea>
          </label>
          <label class="field premium-program-span">
            <span>Post-program upsell</span>
            <textarea name="postProgramUpsell">Offer a monthly recovery membership, sauna add-on, or recovery room pack.</textarea>
          </label>
          <div class="premium-program-actions premium-program-span">
            <button type="submit">Save program</button>
          </div>
        </form>
      </section>
      <section class="migration-files-panel">
        <div class="card-head">
          <div>
            <h3>Suggested programs</h3>
            <p class="muted">Generated from weak utilization windows and matching services.</p>
          </div>
          <span>${state.premiumRecoveryProgramSuggestions.length} ideas</span>
        </div>
        <div class="premium-program-list">
          ${state.premiumRecoveryProgramSuggestions.length
            ? state.premiumRecoveryProgramSuggestions.map((program, index) => renderPremiumProgramSuggestion(program, index)).join("")
            : `<div class="empty-state"><h3>No suggestions ready</h3><p>Import services and room/device data, or create a program manually.</p></div>`}
        </div>
      </section>
    </div>
    <section class="migration-files-panel">
      <div class="card-head">
        <div>
          <h3>Saved premium programs</h3>
          <p class="muted">Draft recovery offers ready to connect to campaigns, bookings, and checkout later.</p>
        </div>
        <span>${state.premiumRecoveryPrograms.length} saved</span>
      </div>
      <div class="premium-program-list">
        ${state.premiumRecoveryPrograms.length
          ? state.premiumRecoveryPrograms.map(renderPremiumProgramCard).join("")
          : `<div class="empty-state"><h3>No programs saved yet</h3><p>Save a suggestion or create a custom recovery program above.</p></div>`}
      </div>
    </section>
  `;
}

function renderPremiumProgramSuggestion(program: PremiumRecoveryProgramSuggestion, index: number) {
  return `
    <article class="premium-program-card">
      <div class="card-head">
        <div>
          <h4>${escapeHtml(program.title)}</h4>
          <p class="muted">${escapeHtml(program.reason)}</p>
        </div>
        <button type="button" class="ghost-button" data-save-program-suggestion="${index}">Save</button>
      </div>
      ${renderPremiumProgramDetails(program)}
    </article>
  `;
}

function renderPremiumProgramCard(program: PremiumRecoveryProgramRecord) {
  return `
    <article class="premium-program-card">
      <div class="card-head">
        <div>
          <h4>${escapeHtml(program.title)}</h4>
          <p class="muted">${escapeHtml(program.description)}</p>
        </div>
        <span class="status-pill">${escapeHtml(program.status)}</span>
      </div>
      ${renderPremiumProgramDetails(program)}
    </article>
  `;
}

function renderPremiumProgramDetails(program: PremiumRecoveryProgramInput) {
  return `
    <div class="campaign-draft-meta premium-program-meta">
      <span><strong>Audience</strong>${escapeHtml(program.targetAudience)}</span>
      <span><strong>Schedule</strong>${escapeHtml(program.schedule)}</span>
      <span><strong>Price</strong>${escapeHtml(formatCurrency(program.recommendedPriceCents))}</span>
      <span><strong>Capacity</strong>${program.capacity}</span>
      <span><strong>Duration</strong>${program.durationWeeks} week${program.durationWeeks === 1 ? "" : "s"}</span>
      <span><strong>Services</strong>${escapeHtml(program.includedServices.join(", ") || "Not set")}</span>
    </div>
    <div class="campaign-copy-grid">
      <div class="campaign-message-box">
        <strong>Campaign copy</strong>
        <p>${escapeHtml(program.campaignCopy)}</p>
      </div>
      <div class="campaign-message-box">
        <strong>Post-program upsell</strong>
        <p>${escapeHtml(program.postProgramUpsell)}</p>
      </div>
    </div>
  `;
}

function renderCampaignSettingsPage(metrics: CampaignLayerMetrics) {
  const settings = studioSettings();
  const resourceLabels = (settings.resourceTypesUsed ?? [])
    .map((type) => STUDIO_RESOURCE_TYPES.find((resource) => resource.value === type)?.label ?? type)
    .join(", ");
  return `
    <div class="campaign-dashboard-grid">
      <section class="form-card">
        <div class="card-head">
          <div>
            <h3>Revenue assumptions</h3>
            <p class="muted">These are pulled from Settings so the campaign layer and ROI use the same studio assumptions.</p>
          </div>
        </div>
        ${renderInput("averageSessionValue", "Average session price", "text", formatCurrency(settings.averageSessionPriceCents ?? metrics.averagePlanValueCents), true)}
        ${renderInput("softwareMonthlyCost", "Software monthly cost", "text", formatCurrency(settings.softwareMonthlyCostCents ?? 29900), true)}
        ${renderInput("targetMonthlyRevenue", "Target monthly revenue", "text", formatCurrency(settings.targetMonthlyRevenueCents ?? 0), true)}
        <div class="settings-placeholder">
          <strong>Resources</strong>
          <p>${escapeHtml(resourceLabels || "No resource types selected yet.")}</p>
          <a class="ghost-button" href="#/dashboard/settings/setup">Edit studio settings</a>
        </div>
      </section>
      <section class="migration-files-panel">
        <div class="card-head">
          <h3>Data readiness</h3>
          <span>${state.campaignImports.length} imports</span>
        </div>
        <div class="campaign-readiness-list">
          ${CAMPAIGN_IMPORT_TYPES.map((type) => {
            const imported = state.campaignImports.some((batch) => batch.importType === type.value);
            return `<span class="${imported ? "ready" : ""}">${escapeHtml(type.label)} ${imported ? "ready" : "not imported"}</span>`;
          }).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderCampaignImportPreview(preview: CampaignCsvPreviewResponse, targetFields: string[]) {
  const headers = preview.headers;
  return `
    <form id="campaign-csv-confirm-form" class="migration-files-panel migration-mapping-panel">
      <div class="card-head">
        <div>
          <h3>Map columns</h3>
          <p class="muted">${escapeHtml(preview.fileName)} - ${preview.rowCount} rows detected. Preview shows the first ${Math.min(preview.sampleRows.length, 10)} rows.</p>
        </div>
        <span>${escapeHtml(campaignImportTypeLabel(preview.importType))}</span>
      </div>
      <details class="migration-sample-details" open>
        <summary>Preview rows</summary>
        <div class="migration-sample-table">
          <table>
            <thead>
              <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${preview.sampleRows.map((row) => `
                <tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </details>
      <div class="migration-column-table">
        <table>
          <thead>
            <tr>
              <th>CSV column</th>
              <th>Map to</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            ${preview.suggestedMappings.map((mapping) => `
              <tr>
                <td>
                  <strong>${escapeHtml(mapping.sourceColumn)}</strong>
                  ${mapping.sampleValues.length
                    ? `<small>${mapping.sampleValues.map((value) => `<span class="migration-sample-chip">${escapeHtml(value)}</span>`).join("")}</small>`
                    : `<small class="muted">No sample values</small>`}
                </td>
                <td>
                  <select data-campaign-mapping data-source-column="${escapeAttribute(mapping.sourceColumn)}">
                    ${renderCampaignTargetOptions(targetFields, mapping.targetField, preview.expectedFields)}
                  </select>
                </td>
                <td>${Math.round(mapping.confidence * 100)}%</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="migration-mapping-actions">
        <button type="submit" class="save-button">Confirm import</button>
      </div>
    </form>
  `;
}

function renderCampaignTargetOptions(
  targetFields: string[],
  selected: string,
  expectedFields: CampaignImportExpectedField[]
) {
  return targetFields.map((field) => {
    const label = field === "ignore"
      ? "Ignore this column"
      : expectedFields.find((expected) => expected.field === field)?.label ?? formatHeaderLabel(field);
    return `<option value="${escapeAttribute(field)}" ${field === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function renderCampaignImportSummary(summary: CampaignImportConfirmResponse["summary"]) {
  return `
    <div class="migration-files-panel">
      <div class="card-head">
        <div>
          <h3>Import summary</h3>
          <p class="muted">${escapeHtml(campaignImportTypeLabel(summary.importType))} saved to the campaign import ledger.</p>
        </div>
        <span>${summary.totalRows} rows</span>
      </div>
      <div class="stat-grid compact">
        <article class="mini-card"><span>Imported</span><strong>${summary.rowsImported}</strong></article>
        <article class="mini-card"><span>Skipped</span><strong>${summary.rowsSkipped}</strong></article>
        <article class="mini-card"><span>Warnings</span><strong>${summary.rowsWithWarnings}</strong></article>
        <article class="mini-card"><span>Errors</span><strong>${summary.rowsWithErrors}</strong></article>
      </div>
    </div>
  `;
}

function renderCampaignImportHistory() {
  const imports = state.campaignImports.slice(0, 8);
  return `
    <div class="migration-files-panel">
      <div class="card-head">
        <div>
          <h3>Uploaded imports</h3>
          <p class="muted">Saved CSV imports stay separate by type, so clients and bookings can arrive before everything else.</p>
        </div>
        <span>${state.campaignImports.length} total</span>
      </div>
      ${imports.length
        ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Rows imported</th>
                  <th>Skipped</th>
                  <th>Errors</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${imports.map((batch) => `
                  <tr>
                    <td>${escapeHtml(batch.originalFilename)}</td>
                    <td>${escapeHtml(campaignImportTypeLabel(batch.importType))}</td>
                    <td>${batch.importedCount} / ${batch.rowCount}</td>
                    <td>${batch.skippedCount}</td>
                    <td>${batch.errorCount}</td>
                    <td>${escapeHtml(formatDateLabel(batch.createdAt))}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `
        : `<div class="empty-state"><h3>No CSV imports yet</h3><p>Upload clients, bookings, services, memberships/packages, payments, or rooms/devices to start building the campaign layer.</p></div>`}
    </div>
  `;
}

function campaignImportTypeLabel(type: CampaignImportType) {
  return CAMPAIGN_IMPORT_TYPES.find((item) => item.value === type)?.label ?? formatHeaderLabel(type);
}

function campaignImportTypeFromValue(value: string | undefined): CampaignImportType {
  return CAMPAIGN_IMPORT_TYPES.some((item) => item.value === value)
    ? (value as CampaignImportType)
    : "clients";
}

function campaignGeneratorTypeLabel(type: GeneratedCampaignType) {
  return CAMPAIGN_GENERATOR_TYPES.find((item) => item.value === type)?.label ?? formatHeaderLabel(type);
}

function campaignGeneratorTypeFromValue(value: string | undefined): GeneratedCampaignType {
  return CAMPAIGN_GENERATOR_TYPES.some((item) => item.value === value)
    ? (value as GeneratedCampaignType)
    : "unused_credit_reminder";
}

function campaignCopyText(campaign: GeneratedCampaignRecord, copyType: "sms" | "email") {
  if (copyType === "sms") {
    return campaign.smsMessage;
  }
  return `Subject: ${campaign.emailSubject}\n\n${campaign.emailBody}`;
}

function weeklyCampaignCopyText(campaign: WeeklyRevenuePlanCampaignRecord) {
  return [
    `Campaign: ${campaign.name}`,
    `Target: ${campaign.targetSegment}`,
    "",
    `SMS: ${campaign.smsMessage}`,
    "",
    `Email subject: ${campaign.emailSubject}`,
    "",
    campaign.emailBody
  ].join("\n");
}

function weeklyPlanClients(plan: WeeklyRevenuePlanRecord) {
  const byKey = new Map<string, WeeklyRevenuePlanClientRecord>();
  for (const action of plan.actions) {
    for (const client of action.clients) {
      const key = client.email || client.phone || client.id || client.name;
      if (!byKey.has(key)) {
        byKey.set(key, client);
      }
    }
  }
  return [...byKey.values()];
}

function weeklyPlanResources(plan: WeeklyRevenuePlanRecord) {
  const byKey = new Map<string, WeeklyRevenuePlanResourceRecord>();
  for (const action of plan.actions) {
    for (const resource of action.resources) {
      const key = resource.id || resource.name;
      if (!byKey.has(key)) {
        byKey.set(key, resource);
      }
    }
  }
  return [...byKey.values()];
}

function formatWeekDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function emptyRoiSummary(): RoiTrackingSummary {
  return {
    totalRevenueGeneratedCents: 0,
    revenueGeneratedThisMonthCents: 0,
    topCampaignByRevenue: null,
    monthlySoftwareCostCents: 29900,
    estimatedRoiPercent: -100,
    bookingsGenerated: 0,
    membershipsSold: 0,
    packagesSold: 0
  };
}

function roiSourceOptions() {
  const campaigns = state.generatedCampaigns.map((campaign) => ({
    key: `campaign:${campaign.id}`,
    sourceType: "campaign" as const,
    sourceId: campaign.id,
    sourceLabel: campaign.name,
    label: `Campaign - ${campaign.name}`
  }));
  const weeklyActions = (state.weeklyRevenuePlan?.actions ?? []).map((action) => ({
    key: `weekly_action:${action.id}`,
    sourceType: "weekly_action" as const,
    sourceId: action.id,
    sourceLabel: action.title,
    label: `Weekly action - ${action.title}`
  }));
  return [...campaigns, ...weeklyActions];
}

function roiInputFromForm(form: HTMLFormElement) {
  const formData = new FormData(form);
  const selectedKey = String(formData.get("sourceKey") ?? "");
  const source = roiSourceOptions().find((option) => option.key === selectedKey);
  if (!source) {
    throw new Error("Choose a campaign or weekly action before saving ROI.");
  }
  return {
    sourceType: source.sourceType,
    sourceId: source.sourceId,
    sourceLabel: source.sourceLabel,
    bookingsGenerated: integerFromForm(formData, "bookingsGenerated", 0),
    revenueGeneratedCents: dollarsToCents(stringFromForm(formData, "revenueGenerated")),
    membershipsSold: integerFromForm(formData, "membershipsSold", 0),
    packagesSold: integerFromForm(formData, "packagesSold", 0),
    notes: stringFromForm(formData, "notes")
  };
}

function premiumRecoveryProgramInputFromForm(form: HTMLFormElement): PremiumRecoveryProgramInput {
  const formData = new FormData(form);
  return {
    title: stringFromForm(formData, "title"),
    description: stringFromForm(formData, "description"),
    targetAudience: stringFromForm(formData, "targetAudience"),
    includedServices: splitCommaList(stringFromForm(formData, "includedServices")),
    recommendedPriceCents: dollarsToCents(stringFromForm(formData, "recommendedPrice")),
    capacity: integerFromForm(formData, "capacity", 8),
    schedule: stringFromForm(formData, "schedule"),
    durationWeeks: integerFromForm(formData, "durationWeeks", 1),
    campaignCopy: stringFromForm(formData, "campaignCopy"),
    postProgramUpsell: stringFromForm(formData, "postProgramUpsell"),
    sourceJson: { source: "manual" }
  };
}

function stringFromForm(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function dollarsToCents(value: string) {
  const amount = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function integerFromForm(formData: FormData, key: string, fallback: number) {
  const value = Number.parseInt(String(formData.get(key) ?? ""), 10);
  return Number.isFinite(value) ? value : fallback;
}

async function copyText(text: string) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for browsers that expose Clipboard but block it in the current context.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function campaignLayerPageLabel(page: CampaignLayerPageKey) {
  return CAMPAIGN_LAYER_PAGES.find((item) => item.key === page)?.label ?? "Dashboard";
}

function campaignLayerMetrics(): CampaignLayerMetrics {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const recentCutoff = new Date(now);
  recentCutoff.setDate(recentCutoff.getDate() - 30);
  const averagePlanValueCents = averageMembershipPlanValueCents();
  const inactiveMembers = state.members.filter((member) => isInactiveCampaignMember(member));
  const activeMembers = state.members.filter((member) => !isInactiveCampaignMember(member));
  const recentCheckInMemberIds = new Set(
    state.checkInHistory
      .filter((checkIn) => new Date(checkIn.checkedInAt).getTime() >= recentCutoff.getTime())
      .map((checkIn) => checkIn.memberId)
      .filter(Boolean)
  );
  const unusedCreditMembers = activeMembers.filter(
    (member) => member.status === MemberStatus.Active && !recentCheckInMemberIds.has(member.id)
  );
  const firstTimeVisitorsNotConverted = state.members.filter(
    (member) =>
      member.status === MemberStatus.Lead ||
      member.status === MemberStatus.Trial ||
      (member.isLead === true && member.isMember !== true)
  );
  const resourceUseCounts = new Map<string, number>();
  state.facilityReservations.forEach((reservation) => {
    if (reservation.status !== "cancelled" && new Date(reservation.startsAt).getTime() >= monthStart.getTime()) {
      resourceUseCounts.set(reservation.resourceId, (resourceUseCounts.get(reservation.resourceId) ?? 0) + 1);
    }
  });
  state.classResourceAllocations.forEach((allocation) => {
    if (new Date(allocation.startsAt).getTime() >= monthStart.getTime()) {
      resourceUseCounts.set(allocation.resourceId, (resourceUseCounts.get(allocation.resourceId) ?? 0) + 1);
    }
  });
  const resources = state.resources
    .filter((resource) => resource.status !== "archived")
    .map((resource) => {
      const useCount = resourceUseCounts.get(resource.id) ?? 0;
      return {
        id: resource.id,
        name: resource.name,
        resourceType: resource.resourceType,
        utilizationPercent: Math.min(100, Math.round(useCount * 20)),
        useCount
      };
    });
  const underusedResources = resources.filter((resource) => resource.useCount === 0);
  const rawActions = [
    {
      category: "Win back inactive members",
      action: "Send a reactivation offer",
      detail: "Cancelled, expired, frozen, past-due, or archived members are the fastest recovery audience.",
      audience: inactiveMembers.length,
      impactCents: inactiveMembers.length * averagePlanValueCents
    },
    {
      category: "Unused credits",
      action: "Prompt members to book",
      detail: "Active members without recent check-ins need a credit-use or class-booking reminder.",
      audience: unusedCreditMembers.length,
      impactCents: unusedCreditMembers.length * 3500
    },
    {
      category: "First visit follow-up",
      action: "Ask visitors to convert",
      detail: "Leads and trials should get a tour, intro offer, or membership follow-up.",
      audience: firstTimeVisitorsNotConverted.length,
      impactCents: firstTimeVisitorsNotConverted.length * 4900
    },
    {
      category: "Idle rooms/devices",
      action: "Promote open capacity",
      detail: "Underused rooms and devices can be turned into bookable offers or staff-led sessions.",
      audience: underusedResources.length,
      impactCents: underusedResources.length * 12000
    },
    {
      category: "Data completion",
      action: "Import missing files",
      detail: "More complete clients, bookings, services, payments, and resources data improves recommendations.",
      audience: Math.max(0, CAMPAIGN_IMPORT_TYPES.length - uniqueCampaignImportTypeCount()),
      impactCents: Math.max(0, CAMPAIGN_IMPORT_TYPES.length - uniqueCampaignImportTypeCount()) * 7500
    }
  ];
  const backendActions = state.revenueOpportunities.map((opportunity, index) => ({
    rank: index + 1,
    category: campaignOpportunityTypeLabel(opportunity.type),
    action: opportunity.title,
    detail: `${opportunity.description} ${opportunity.recommendedAction}`,
    audience: campaignOpportunityAudience(opportunity),
    impactCents: opportunity.estimatedRevenueCents
  }));
  const actions = (backendActions.length ? backendActions : rawActions)
    .sort((left, right) => right.impactCents - left.impactCents)
    .slice(0, 5)
    .map((action, index) => ({ ...action, rank: index + 1 }));
  return {
    estimatedMissedRevenueCents: actions.reduce((total, action) => total + action.impactCents, 0),
    averagePlanValueCents,
    activeMembers,
    inactiveMembers,
    unusedCreditMembers,
    firstTimeVisitorsNotConverted,
    resources,
    underusedResources,
    actions
  };
}

function isInactiveCampaignMember(member: MemberRecord) {
  return (
    member.status === MemberStatus.Cancelled ||
    member.status === MemberStatus.Expired ||
    member.status === MemberStatus.Frozen ||
    member.status === MemberStatus.PastDue ||
    member.status === MemberStatus.Archived ||
    member.recordStatus === "inactive" ||
    member.recordStatus === "archived"
  );
}

function campaignOpportunityTypeLabel(type: RevenueOpportunityType) {
  const labels: Record<RevenueOpportunityType, string> = {
    UNDERUSED_RESOURCE: "Underused resource",
    UNUSED_CREDITS: "Unused credits",
    INACTIVE_MEMBER: "Inactive member",
    FIRST_VISIT_NOT_CONVERTED: "First visit follow-up",
    HIGH_USAGE_UPGRADE: "Upgrade candidate",
    UNDERUSED_SERVICE: "Underused service",
    PREMIUM_PROGRAM_OPPORTUNITY: "Premium program"
  };
  return labels[type];
}

function campaignOpportunityAudience(opportunity: RevenueOpportunityRecord) {
  const evidence = opportunity.evidence ?? {};
  if (typeof evidence.audience === "number") {
    return evidence.audience;
  }
  if (typeof evidence.remainingCredits === "number") {
    return evidence.remainingCredits;
  }
  if (typeof evidence.completedBookings === "number") {
    return evidence.completedBookings;
  }
  return 1;
}

function averageMembershipPlanValueCents() {
  const pricedPlans = state.plans.filter((plan) => plan.priceCents > 0);
  if (pricedPlans.length === 0) {
    return 9900;
  }
  return Math.round(
    pricedPlans.reduce((total, plan) => total + plan.priceCents, 0) / pricedPlans.length
  );
}

function uniqueCampaignImportTypeCount() {
  return new Set(state.campaignImports.map((batch) => batch.importType)).size;
}

function renderCampaignActionsTable(actions: CampaignRevenueAction[]) {
  return `
    <div class="table-wrap">
      <table class="campaign-action-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Action</th>
            <th>Audience</th>
            <th>Est. impact</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          ${actions.map((action) => `
            <tr>
              <td>${action.rank}</td>
              <td><strong>${escapeHtml(action.action)}</strong><br /><small>${escapeHtml(action.category)}</small></td>
              <td>${action.audience}</td>
              <td>${formatCurrency(action.impactCents)}</td>
              <td>${escapeHtml(action.detail)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCampaignOpportunityChart(metrics: CampaignLayerMetrics) {
  const values = [
    { label: "Inactive", value: metrics.inactiveMembers.length },
    { label: "Unused credits", value: metrics.unusedCreditMembers.length },
    { label: "Visitors", value: metrics.firstTimeVisitorsNotConverted.length },
    { label: "Idle resources", value: metrics.underusedResources.length }
  ];
  const max = Math.max(1, ...values.map((entry) => entry.value));
  return `
    <div class="campaign-chart-bars">
      ${values.map((entry) => `
        <div class="campaign-chart-row">
          <span>${escapeHtml(entry.label)}</span>
          <div class="campaign-meter"><span style="width: ${Math.max(4, Math.round((entry.value / max) * 100))}%"></span></div>
          <strong>${entry.value}</strong>
        </div>
      `).join("")}
    </div>
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

function formatTechnicalPermissionLabel(permission: string) {
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

function permissionDetails(permission: string) {
  return PERMISSION_DETAILS[permission] ?? {
    label: formatTechnicalPermissionLabel(permission),
    description: "Advanced access for this gym."
  };
}

function formatPermissionLabel(permission: string) {
  return permissionDetails(permission).label;
}

function renderPermissionCheckboxes(selectedPermissions: string[] = []) {
  return ROLE_PERMISSION_OPTIONS.map(
    (permission) => {
      const details = permissionDetails(permission);
      return `
        <label class="permission-chip${selectedPermissions.includes(permission) ? " active" : ""}">
          <input type="checkbox" name="permissions" value="${permission}" ${selectedPermissions.includes(permission) ? "checked" : ""} />
          <span class="permission-chip-copy">
            <strong>${escapeHtml(details.label)}</strong>
            <small>${escapeHtml(details.description)}</small>
          </span>
        </label>
      `;
    }
  ).join("");
}

function renderReservableResourceRoleToggle(checked: boolean) {
  return `
    <label class="permission-chip${checked ? " active" : ""}">
      <input type="checkbox" name="createsReservableResource" value="true" ${checked ? "checked" : ""} />
      <span class="permission-chip-copy">
        <strong>Creates reservable resource</strong>
        <small>Active staff assigned to this role can be booked as a resource.</small>
      </span>
    </label>
  `;
}

function staffAssignableRoles() {
  return state.roles
    .filter((role) => role.name !== RoleName.Owner && role.name !== RoleName.Member)
    .sort((left, right) => formatRoleLabel(left.name).localeCompare(formatRoleLabel(right.name)));
}

function renderCreateStaffAccountCard(assignableRoles: RoleRecord[]) {
  return `
    <details class="form-card expandable-card">
      <summary class="expandable-summary">
        <span>
          <h3>Create staff account</h3>
          <p class="muted">Creates a staff login and assigns backend access for this gym.</p>
        </span>
        <span class="expandable-action">Expand</span>
      </summary>
      <form id="create-staff-form" class="expandable-body">
        ${renderInput("firstName", "First name")}
        ${renderInput("lastName", "Last name")}
        ${renderInput("email", "Email", "email")}
        ${renderInput("password", "Temporary password", "password")}
        ${renderSelect(
          "roleId",
          "Position / role",
          assignableRoles.length > 0
            ? assignableRoles.map((role) => ({ value: role.id, label: formatRoleLabel(role.name) }))
            : [{ value: "", label: "No staff roles available" }],
          assignableRoles[0]?.id ?? ""
        )}
        <button type="submit" ${assignableRoles.length === 0 ? "disabled" : ""}>Create staff</button>
      </form>
    </details>
  `;
}

function renderScheduleShiftCard(
  staffOptions: Array<{ value: string; label: string }>,
  shiftRoleOptions: Array<{ value: string; label: string }>,
  locationOptions: Array<{ value: string; label: string }>,
  defaultShiftDate: string
) {
  return `
    <details class="form-card expandable-card">
      <summary class="expandable-summary">
        <span>
          <h3>Schedule shift</h3>
          <p class="muted">Adds a backend shift for the selected staff member.</p>
        </span>
        <span class="expandable-action">Expand</span>
      </summary>
      <form id="create-staff-shift-form" class="expandable-body">
        ${renderSelect("userId", "Staff member", staffOptions.length ? staffOptions : [{ value: "", label: "No active staff available" }], staffOptions[0]?.value ?? "")}
        ${renderSelect("roleId", "Shift position", shiftRoleOptions.length ? shiftRoleOptions : [{ value: "", label: "No staff roles available" }], shiftRoleOptions[0]?.value ?? "")}
        ${renderSelect("locationId", "Location", locationOptions, locationOptions[0]?.value ?? "")}
        ${renderInput("shiftDate", "Date", "date", defaultShiftDate)}
        ${renderInput("startsAt", "Start time", "time", "09:00")}
        ${renderInput("endsAt", "End time", "time", "17:00")}
        <label class="field">
          <span>Notes</span>
          <textarea name="notes" rows="3"></textarea>
        </label>
        <button type="submit" ${staffOptions.length === 0 || shiftRoleOptions.length === 0 ? "disabled" : ""}>Create shift</button>
      </form>
    </details>
  `;
}

function renderStaffAccessManagement(assignableRoles: RoleRecord[]) {
  const staffRows = staffDirectoryRows();
  const canManageDirectory = hasPermission(Permission.StaffRoleAssign) || hasPermission(Permission.StaffRemove);
  const canViewFullDirectory = hasPermission(Permission.StaffRead) || hasPermission(Permission.StaffDirectoryView);
  const roleOptions = staffAccessRoleOptions();
  const selectedRoleFilter = roleOptions.some((option) => option.value === state.staffAccessRoleFilter)
    ? state.staffAccessRoleFilter
    : "";
  const staffAccessRows = staffRows
    .map((staff) => {
      const openTimeEntry = openStaffTimeEntry(staff.userId);
      return {
        staff,
        openTimeEntry,
        rowVisible: staffMatchesAccessFilters(staff, selectedRoleFilter, state.staffAccessSearch)
      };
    })
    .sort((left, right) => {
      if (Boolean(left.openTimeEntry) !== Boolean(right.openTimeEntry)) {
        return left.openTimeEntry ? -1 : 1;
      }
      if (left.openTimeEntry && right.openTimeEntry) {
        return new Date(right.openTimeEntry.clockedInAt).getTime() - new Date(left.openTimeEntry.clockedInAt).getTime();
      }
      return staffFullName(left.staff).localeCompare(staffFullName(right.staff));
    });
  const clockedInRows = staffAccessRows.filter((row) => row.openTimeEntry);
  const directoryRows = staffAccessRows.filter((row) => !row.openTimeEntry);
  const visibleStaffCount = staffAccessRows.filter((row) => row.rowVisible).length;
  const directoryCopy = canManageDirectory
    ? "Search staff, review account status, update positions, or remove gym access."
    : canViewFullDirectory
      ? "Search staff, review roles, and see who is currently clocked in. This view is read-only."
      : "Review your role and current clock status.";
  const renderAccessSection = (
    section: "clocked-in" | "directory",
    label: string,
    rows: typeof staffAccessRows
  ) => {
    if (rows.length === 0) {
      return "";
    }
    const visibleSectionCount = rows.filter((row) => row.rowVisible).length;
    return `
      <div
        class="staff-access-subhead"
        data-staff-access-section-heading="${section}"
        ${visibleSectionCount > 0 ? "" : "hidden"}
      >
        <span>${label}</span>
        <small>${visibleSectionCount} ${visibleSectionCount === 1 ? "person" : "people"}</small>
      </div>
      ${rows.map((row) => renderStaffAccessRow(row.staff, assignableRoles, canManageDirectory, row.openTimeEntry, section, row.rowVisible)).join("")}
    `;
  };
  return `
    <div class="club-panel">
      <div class="card-head">
        <div>
          <h3>Staff directory and access</h3>
          <p class="club-copy">${directoryCopy}</p>
        </div>
        <span data-staff-access-filter-count>${visibleStaffCount} of ${staffRows.length} staff</span>
      </div>
      <div class="staff-filter-bar">
        <label class="field staff-filter-field">
          <span>Search staff</span>
          <input
            type="search"
            data-staff-access-search
            placeholder="Search by name or email"
            value="${escapeAttribute(state.staffAccessSearch)}"
          />
        </label>
        <label class="field staff-filter-field">
          <span>Role</span>
          <select data-staff-access-role-filter>
            <option value="">All roles</option>
            ${roleOptions
              .map(
                (role) =>
                  `<option value="${escapeAttribute(role.value)}" ${role.value === selectedRoleFilter ? "selected" : ""}>${escapeHtml(role.label)}</option>`
              )
              .join("")}
          </select>
        </label>
      </div>
      <div class="staff-role-list staff-access-list">
        ${staffRows.length === 0
          ? `<div class="settings-placeholder"><strong>No staff loaded</strong><p>Create staff accounts before managing roles.</p></div>`
          : `
            ${renderAccessSection("clocked-in", "Clocked in now", clockedInRows)}
            ${renderAccessSection("directory", clockedInRows.length > 0 ? "Not clocked in" : "Directory", directoryRows)}
            <div class="settings-placeholder" data-staff-access-empty ${visibleStaffCount > 0 ? "hidden" : ""}>
              <strong>No staff match this filter</strong>
              <p>Try another role or search term.</p>
            </div>
          `}
      </div>
    </div>
  `;
}

function renderStaffAccessRow(
  staff: StaffRecord,
  assignableRoles: RoleRecord[],
  canManageDirectory: boolean,
  openTimeEntry: StaffTimeEntryRecord | undefined,
  section: "clocked-in" | "directory",
  rowVisible: boolean
) {
  const canAssign = canAssignStaffRole(staff);
  const canRemove = canRemoveStaffAccess(staff);
  const roleChoices = assignableRoles.some((role) => role.id === staff.roleId)
    ? assignableRoles
    : [{ id: staff.roleId, name: staff.roleName, permissions: [] }, ...assignableRoles];
  return `
    <article
      class="staff-role-row"
      data-staff-access-row
      data-staff-access-section="${section}"
      data-staff-role-id="${escapeAttribute(staff.roleId)}"
      data-staff-filter-text="${escapeAttribute(staffAccessSearchText(staff))}"
      ${rowVisible ? "" : "hidden"}
    >
      <div class="staff-role-copy">
        <div class="staff-role-title">
          <strong>${escapeHtml(staffFullName(staff))}</strong>
          <span class="staff-status-chip">${escapeHtml(formatRoleLabel(staff.status))}</span>
        </div>
        <p>
          <span>${escapeHtml(staff.email)}</span>
          <span>${escapeHtml(formatRoleLabel(staff.roleName))}</span>
        </p>
        ${openTimeEntry
          ? `<span class="staff-clock-chip active">Clocked in <span data-staff-clock-timer data-clocked-in-at="${escapeAttribute(openTimeEntry.clockedInAt)}">${escapeHtml(formatElapsedSince(openTimeEntry.clockedInAt))}</span></span>`
          : `<span class="staff-clock-chip">Not clocked in</span>`}
      </div>
      <div class="staff-role-actions${canManageDirectory ? "" : " staff-role-actions-readonly"}">
        ${canManageDirectory
          ? `
            <select data-staff-role-select="${escapeAttribute(staff.userId)}" ${canAssign ? "" : "disabled"}>
              ${roleChoices
                .map(
                  (role) =>
                    `<option value="${escapeAttribute(role.id)}" ${role.id === staff.roleId ? "selected" : ""}>${escapeHtml(formatRoleLabel(role.name))}</option>`
                )
                .join("")}
            </select>
            <button type="button" class="ghost-button" data-staff-role-assign="${escapeAttribute(staff.userId)}" ${canAssign ? "" : "disabled"}>Assign</button>
            ${canRemove
              ? `<button type="button" class="ghost-button danger" data-staff-access-remove="${escapeAttribute(staff.userId)}">Remove</button>`
              : `<span class="staff-protection-chip">${escapeHtml(staffRemovalProtectionLabel(staff))}</span>`}
          `
          : `<span class="staff-protection-chip">Read-only view</span>`}
      </div>
    </article>
  `;
}

function renderStaffRoleCreator() {
  if (!canCreateRolesFromStaffPage()) {
    return "";
  }
  const templates = staffRoleTemplateOptions();
  const preset = templates[0];
  const parentRoles = roleParentRoles();
  return `
    <details class="form-card expandable-card staff-role-creator">
      <summary class="expandable-summary">
        <span>
          <h3>Create role</h3>
          <p class="muted">Start from a preset or saved role, then adjust employee access.</p>
        </span>
        <span class="expandable-action">Expand</span>
      </summary>
      <form id="create-staff-role-form" class="expandable-body">
        ${renderStaffRoleTemplateSelect(templates)}
        <p class="club-copy staff-role-preset-copy" data-staff-role-preset-description>${escapeHtml(preset.description)}</p>
        ${renderInput("staffRoleName", "Role name", "text", preset.defaultName)}
        ${renderRoleParentPicker(parentRoles)}
        ${renderReservableResourceRoleToggle(false)}
        <div class="permissions-grid staff-role-permissions">
          ${renderPermissionCheckboxes([...preset.permissions])}
        </div>
        <button type="submit">Create role</button>
      </form>
    </details>
  `;
}

function staffRoleTemplateOptions(): StaffRoleTemplateOption[] {
  const starterTemplates: StaffRoleTemplateOption[] = STAFF_ROLE_PRESETS.map((preset) => ({
    key: `starter:${preset.key}`,
    label: preset.label,
    defaultName: preset.defaultName,
    description: preset.description,
    permissions: [...preset.permissions],
    source: "starter"
  }));
  const savedTemplates: StaffRoleTemplateOption[] = state.roles
    .filter((role) => !role.isSystem && role.name !== RoleName.Owner && role.name !== RoleName.Member)
    .sort((left, right) => formatRoleLabel(left.name).localeCompare(formatRoleLabel(right.name)))
    .map((role) => {
      const roleLabel = formatRoleLabel(role.name);
      return {
        key: `saved:${role.id}`,
        label: roleLabel,
        defaultName: `${roleLabel} Copy`,
        description: `Saved gym role. Reuse these privileges here, or assign this exact role from the staff directory.`,
        permissions: [...role.permissions],
        source: "saved"
      };
    });
  return [...starterTemplates, ...savedTemplates];
}

function renderStaffRoleTemplateSelect(templates: StaffRoleTemplateOption[]) {
  const starters = templates.filter((template) => template.source === "starter");
  const saved = templates.filter((template) => template.source === "saved");
  return `
    <label class="field">
      <span>Start from</span>
      <select name="rolePreset" data-staff-role-preset>
        <optgroup label="Starter presets">
          ${starters.map((option) => `<option value="${escapeAttribute(option.key)}">${escapeHtml(option.label)}</option>`).join("")}
        </optgroup>
        ${saved.length
          ? `<optgroup label="Saved gym roles">
              ${saved.map((option) => `<option value="${escapeAttribute(option.key)}">${escapeHtml(option.label)}</option>`).join("")}
            </optgroup>`
          : ""}
      </select>
    </label>
  `;
}

function renderStaffAuthTree() {
  const visibleRoles = state.roles.filter((role) => role.name !== RoleName.Member);
  if (visibleRoles.length === 0) {
    return "";
  }
  const visibleRoleIds = new Set(visibleRoles.map((role) => role.id));
  const roots = visibleRoles.filter((role) => !role.parentRoleId || !visibleRoleIds.has(role.parentRoleId));
  const renderNode = (role: RoleRecord): string => {
    const children = visibleRoles
      .filter((candidate) => candidate.parentRoleId === role.id)
      .sort((left, right) => formatRoleLabel(left.name).localeCompare(formatRoleLabel(right.name)));
    const assignedCount = staffAssignedToRoleCount(role.id);
    const canDelete = canDeleteRole(role);
    const isExpanded = state.staffAuthTreeExpandedRoleIds.includes(role.id);
    const hasChildren = children.length > 0;
    const childLabel = hasChildren
      ? ` - ${children.length} ${children.length === 1 ? "branch" : "branches"}`
      : "";
    return `
      <li>
        <div class="auth-tree-node${hasChildren ? " is-expandable" : ""}${isExpanded ? " is-expanded" : ""}">
          ${hasChildren
            ? `<button
                type="button"
                class="auth-tree-toggle"
                data-auth-tree-toggle="${escapeAttribute(role.id)}"
                aria-expanded="${isExpanded ? "true" : "false"}"
              >
                <span class="auth-tree-icon" aria-hidden="true">${isExpanded ? "-" : "+"}</span>
                <span class="auth-tree-copy">
                  <strong>${escapeHtml(formatRoleLabel(role.name))}</strong>
                  <span>${role.permissions.length} privileges - ${assignedCount} assigned${escapeHtml(childLabel)}</span>
                </span>
              </button>`
            : `<div class="auth-tree-static">
                <span class="auth-tree-icon" aria-hidden="true"></span>
                <span class="auth-tree-copy">
                  <strong>${escapeHtml(formatRoleLabel(role.name))}</strong>
                  <span>${role.permissions.length} privileges - ${assignedCount} assigned</span>
                </span>
              </div>`}
          ${canDelete
            ? `<button type="button" class="ghost-button danger" data-staff-role-delete="${escapeAttribute(role.id)}">Delete</button>`
            : `<span class="staff-protection-chip">${escapeHtml(roleDeleteProtectionLabel(role))}</span>`}
        </div>
        ${hasChildren && isExpanded ? `<ul>${children.map(renderNode).join("")}</ul>` : ""}
      </li>
    `;
  };
  return `
    <div class="club-panel auth-tree-card">
      <div class="card-head">
        <div>
          <h3>Authorization tree</h3>
          <p class="club-copy">Shows your role branch and every role below it. Parent branches stay hidden.</p>
        </div>
      </div>
      <ul class="auth-tree-list">
        ${roots.map(renderNode).join("")}
      </ul>
    </div>
  `;
}

function renderRoleParentPicker(parentRoles: RoleRecord[]) {
  if (parentRoles.length === 0) {
    return `<div class="settings-placeholder"><strong>No parent roles available</strong><p>Create a role after a staff branch exists.</p></div>`;
  }
  return `
    <fieldset class="role-parent-picker">
      <legend>Place under</legend>
      <div class="role-parent-options">
        ${parentRoles.map((role, index) => `
          <label class="role-parent-option">
            <input type="radio" name="parentRoleId" value="${escapeAttribute(role.id)}" ${index === 0 ? "checked" : ""} />
            <span>
              <strong>${escapeHtml(formatRoleLabel(role.name))}</strong>
              <small>${role.permissions.length} privileges</small>
            </span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `;
}

function roleParentRoles() {
  return state.roles
    .filter((role) => role.name !== RoleName.Member)
    .sort((left, right) => formatRoleLabel(left.name).localeCompare(formatRoleLabel(right.name)));
}

function staffAssignedToRoleCount(roleId: string) {
  return state.staff.filter((staff) => staff.roleId === roleId).length;
}

function roleChildCount(roleId: string) {
  return state.roles.filter((role) => role.parentRoleId === roleId).length;
}

function canDeleteRole(role: RoleRecord) {
  return (
    hasPermission(Permission.StaffRoleAssign) &&
    !role.isSystem &&
    role.name !== RoleName.Owner &&
    role.name !== RoleName.Member &&
    staffAssignedToRoleCount(role.id) === 0 &&
    roleChildCount(role.id) === 0
  );
}

function roleDeleteProtectionLabel(role: RoleRecord) {
  if (role.isSystem || role.name === RoleName.Owner || role.name === RoleName.Member) {
    return "System role";
  }
  if (roleChildCount(role.id) > 0) {
    return "Has children";
  }
  if (staffAssignedToRoleCount(role.id) > 0) {
    return "In use";
  }
  return "Protected";
}

function renderStaffRemovalModal() {
  const staff = selectedStaffRemovalCandidate();
  if (!staff || !canRemoveStaffAccess(staff)) {
    return "";
  }
  const name = staffFullName(staff);
  return `
    <div class="staff-removal-backdrop" data-staff-removal-close>
      <section class="staff-removal-modal" role="dialog" aria-modal="true" aria-label="Remove staff access confirmation">
        <div class="card-head">
          <div>
            <p class="eyebrow">Staff Access</p>
            <h3>Confirm removal</h3>
            <p class="club-copy">This removes gym access for the selected user. It does not delete historical payroll, schedule, or audit records.</p>
          </div>
          <button type="button" class="ghost-button" data-staff-removal-close>Close</button>
        </div>
        <div class="staff-removal-person">
          <div class="club-customer-avatar">${escapeHtml(staffInitials(staff))}</div>
          <div>
            <strong>${escapeHtml(name)}</strong>
            <span>${escapeHtml(staff.email)}</span>
            <span>${escapeHtml(formatRoleLabel(staff.roleName))} Â· ${escapeHtml(formatRoleLabel(staff.status))}</span>
          </div>
        </div>
        <div class="staff-removal-warning">
          <strong>What happens next</strong>
          <ul>
            <li>The user will no longer be able to access this gym.</li>
            <li>Their role assignment is disabled, but existing records stay available for reporting.</li>
            <li>You can invite or recreate access later if they return.</li>
          </ul>
        </div>
        <form id="staff-remove-confirm-form" class="staff-removal-form">
          <input type="hidden" name="userId" value="${escapeAttribute(staff.userId)}" />
          <label class="field">
            <span>Reason</span>
            <textarea name="reason" rows="3" placeholder="Optional note for the staff audit log"></textarea>
          </label>
          <label class="field">
            <span>Type REMOVE to confirm</span>
            <input name="confirmText" autocomplete="off" placeholder="REMOVE" data-staff-removal-confirm-input />
          </label>
          <div class="staff-removal-actions">
            <button type="button" class="ghost-button" data-staff-removal-close>Cancel</button>
            <button type="submit" class="danger-button" data-staff-removal-submit disabled>Remove access</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function canCreateRolesFromStaffPage() {
  return hasPermission(Permission.StaffRoleAssign);
}

function staffAccessRoleOptions() {
  const roleOptions = new Map<string, string>();
  for (const staff of staffDirectoryRows()) {
    roleOptions.set(staff.roleId, formatRoleLabel(staff.roleName));
  }
  return [...roleOptions.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function staffMatchesAccessFilters(staff: StaffRecord, roleFilter: string, search: string) {
  const matchesRole = !roleFilter || staff.roleId === roleFilter;
  const query = search.trim().toLowerCase();
  const matchesSearch = !query || staffAccessSearchText(staff).includes(query);
  return matchesRole && matchesSearch;
}

function staffAccessSearchText(staff: StaffRecord) {
  return `${staffFullName(staff)} ${staff.email} ${formatRoleLabel(staff.roleName)} ${staff.status}`.toLowerCase();
}

function staffByUserId(userId: string) {
  return staffDirectoryRows().find((staff) => staff.userId === userId);
}

function openStaffTimeEntry(userId: string) {
  return state.staffTimeEntries.find((entry) => entry.userId === userId && !entry.clockedOutAt);
}

function signedInOpenStaffTimeEntry() {
  const userId = state.me?.user.id;
  return userId ? openStaffTimeEntry(userId) : undefined;
}

async function clockEmployeeFromTimeClock(input: {
  action: "clock-in" | "clock-out";
  email: string;
  password: string;
  twoFactorCode?: string;
  locationId?: string;
  notes?: string;
}) {
  if (!state.gym) {
    throw new Error("Choose a gym before clocking time.");
  }
  const timeClockAuthClient = new GymApiClient({ baseUrl: API_BASE_URL });
  const login = (await timeClockAuthClient.login({
    email: input.email,
    password: input.password,
    ...(input.twoFactorCode ? { twoFactorCode: input.twoFactorCode } : {})
  })) as AuthResponse;
  if (login.twoFactorRequired) {
    throw new Error("Enter this employee's 2FA code before clocking time.");
  }
  if (!login.accessToken || !login.refreshToken) {
    throw new Error("Employee sign in did not return a time clock session.");
  }
  const employeeClockClient = new GymApiClient({
    baseUrl: API_BASE_URL,
    accessToken: login.accessToken
  });
  try {
    if (input.action === "clock-in") {
      await employeeClockClient.clockMyStaffIn(state.gym.id, {
        ...(input.locationId ? { locationId: input.locationId } : {}),
        ...(input.notes ? { notes: input.notes } : {})
      });
    } else {
      await employeeClockClient.clockMyStaffOut(state.gym.id, {
        ...(input.notes ? { notes: input.notes } : {})
      });
    }
  } finally {
    await timeClockAuthClient.logout(login.refreshToken).catch(() => undefined);
  }
  return login.user;
}

function formatElapsedSince(isoDate: string) {
  const elapsedMs = Math.max(0, Date.now() - new Date(isoDate).getTime());
  return formatDuration(elapsedMs);
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderStaffShiftList() {
  const shifts = upcomingStaffShifts();
  const myShifts = signedInStaffShifts();
  const openRequests = state.mySchedulerRequests.filter((request) => request.status === "open");
  const openPreferenceRequests = state.mySchedulerPreferenceRequests.filter((request) => request.status === "open");
  return `
    <div class="club-panel">
      <div class="card-head">
        <div>
          <h3>Scheduled shifts</h3>
          <p class="club-copy">Upcoming staff coverage pulled from the backend schedule.</p>
        </div>
        <div class="staff-shift-head-actions">
          <span>${shifts.length} upcoming</span>
          <button type="button" class="ghost-button" data-staff-schedule-request-open>
            Request change${openRequests.length ? ` (${openRequests.length})` : ""}
          </button>
          <button type="button" class="ghost-button" data-staff-preference-request-open>
            Request preferences${openPreferenceRequests.length ? ` (${openPreferenceRequests.length})` : ""}
          </button>
          <button type="button" class="ghost-button" data-staff-calendar-open>
            My calendar${myShifts.length ? ` (${myShifts.length})` : ""}
          </button>
        </div>
      </div>
      <div class="staff-role-list">
        ${shifts.length === 0
          ? `<div class="settings-placeholder"><strong>No shifts scheduled</strong><p>Create a shift from the staff management form.</p></div>`
          : shifts.slice(0, 8).map((shift) => `
              <article class="staff-role-row">
                <div>
                  <strong>${escapeHtml(staffNameForShift(shift))}</strong>
                  <p>${escapeHtml(shiftTimeLabel(shift))}${shift.locationId ? ` Â· ${escapeHtml(locationName(shift.locationId))}` : ""}</p>
                </div>
                <span class="club-note-label">${escapeHtml(roleLabelForShift(shift))}</span>
              </article>
            `).join("")}
      </div>
      ${renderMySchedulerRequestsSummary()}
      ${renderMySchedulerPreferencesSummary()}
    </div>
  `;
}

function renderMySchedulerRequestsSummary() {
  const requests = state.mySchedulerRequests;
  if (requests.length === 0) {
    return "";
  }
  return `
    <div class="staff-request-summary">
      <div class="staff-shift-head-actions">
        <strong>My schedule requests</strong>
        <span>${requests.filter((request) => request.status === "open").length} open</span>
      </div>
      ${requests.slice(0, 3).map((request) => `
        <article class="staff-request-summary-row">
          <span class="staff-status-chip">${escapeHtml(formatRoleLabel(request.status))}</span>
          <div>
            <strong>${escapeHtml(formatRoleLabel(request.requestType))}</strong>
            <p>${escapeHtml(request.message)}</p>
            ${request.resolutionNote ? `<small>${escapeHtml(request.resolutionNote)}</small>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderMySchedulerPreferencesSummary() {
  const activePreferences = state.mySchedulerAvailability;
  const requests = state.mySchedulerPreferenceRequests;
  if (activePreferences.length === 0 && requests.length === 0) {
    return "";
  }
  return `
    <div class="staff-request-summary">
      <div class="staff-shift-head-actions">
        <strong>My long-term preferences</strong>
        <span>${requests.filter((request) => request.status === "open").length} pending</span>
      </div>
      ${activePreferences.slice(0, 3).map((availability) => `
        <article class="staff-request-summary-row">
          <span class="staff-status-chip">${escapeHtml(formatPreferenceLabel(availability.preference))}</span>
          <div>
            <strong>Approved preference</strong>
            <p>${escapeHtml(daysOfWeekLabel(availability.daysOfWeek))} Â· ${escapeHtml(timeRangeLabel(availability.startTime, availability.endTime))}</p>
            ${availability.notes ? `<small>${escapeHtml(availability.notes)}</small>` : ""}
          </div>
        </article>
      `).join("")}
      ${requests.slice(0, 3).map((request) => `
        <article class="staff-request-summary-row">
          <span class="staff-status-chip">${escapeHtml(formatRoleLabel(request.status))}</span>
          <div>
            <strong>${escapeHtml(formatPreferenceLabel(request.preference))}</strong>
            <p>${escapeHtml(daysOfWeekLabel(request.daysOfWeek))} Â· ${escapeHtml(timeRangeLabel(request.startTime, request.endTime))}</p>
            ${request.resolutionNote ? `<small>${escapeHtml(request.resolutionNote)}</small>` : request.notes ? `<small>${escapeHtml(request.notes)}</small>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderStaffShiftCalendarModal() {
  const month = calendarMonthDate();
  const myShifts = signedInStaffShifts();
  const visibleDays = calendarVisibleDays(month);
  const monthLabel = month.toLocaleDateString([], { month: "long", year: "numeric" });
  return `
    <div class="staff-calendar-backdrop" data-staff-calendar-close>
      <section class="staff-calendar-modal" role="dialog" aria-modal="true" aria-label="My shift calendar">
        <div class="card-head">
          <div>
            <p class="eyebrow">My Schedule</p>
            <h3>Shift calendar</h3>
            <p class="club-copy">Shows shifts assigned to the signed-in account.</p>
          </div>
          <button type="button" class="ghost-button" data-staff-calendar-close>Close</button>
        </div>
        <div class="staff-calendar-toolbar">
          <button type="button" class="ghost-button" data-staff-calendar-prev>Previous</button>
          <strong>${escapeHtml(monthLabel)}</strong>
          <button type="button" class="ghost-button" data-staff-calendar-next>Next</button>
          <button type="button" class="ghost-button" data-staff-calendar-today>Today</button>
        </div>
        <div class="staff-calendar-weekdays">
          ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${day}</span>`).join("")}
        </div>
        <div class="staff-calendar-grid">
          ${visibleDays.map((day) => renderStaffCalendarDay(day, month, myShifts)).join("")}
        </div>
        ${myShifts.length === 0
          ? `<div class="settings-placeholder"><strong>No shifts assigned to you</strong><p>When your account is scheduled, those shifts will appear on this calendar.</p></div>`
          : ""}
      </section>
    </div>
  `;
}

function renderStaffScheduleRequestModal() {
  const openRequests = state.mySchedulerRequests.filter((request) => request.status === "open");
  return `
    <div class="staff-schedule-request-backdrop" data-staff-schedule-request-close>
      <section class="staff-schedule-request-modal" role="dialog" aria-modal="true" aria-label="Request schedule change">
        <div class="card-head">
          <div>
            <p class="eyebrow">My Schedule</p>
            <h3>Request schedule change</h3>
            <p class="club-copy">Send a schedule issue to the people who can edit and publish shifts.</p>
          </div>
          <button type="button" class="ghost-button" data-staff-schedule-request-close>Close</button>
        </div>
        ${openRequests.length
          ? `<div class="staff-clock-status-card"><span>Open requests</span><strong>${openRequests.length}</strong><small>Your schedule stays unchanged until a scheduler applies a change.</small></div>`
          : ""}
        <form id="scheduler-request-form" class="staff-schedule-request-form" data-scheduler-request-modal="true">
          ${renderSchedulerRequestFields()}
          <div class="staff-schedule-request-actions">
            <button type="button" class="ghost-button" data-staff-schedule-request-close>Cancel</button>
            <button type="submit">Send request</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderStaffPreferenceRequestModal() {
  const openRequests = state.mySchedulerPreferenceRequests.filter((request) => request.status === "open");
  return `
    <div class="staff-schedule-request-backdrop" data-staff-preference-request-close>
      <section class="staff-schedule-request-modal" role="dialog" aria-modal="true" aria-label="Request long-term scheduling preferences">
        <div class="card-head">
          <div>
            <p class="eyebrow">My Schedule</p>
            <h3>Request long-term preferences</h3>
            <p class="club-copy">Ask the scheduler to save preferred or blocked working windows for future schedules.</p>
          </div>
          <button type="button" class="ghost-button" data-staff-preference-request-close>Close</button>
        </div>
        ${openRequests.length
          ? `<div class="staff-clock-status-card"><span>Pending preference requests</span><strong>${openRequests.length}</strong><small>Approved preferences replace your currently saved long-term preference.</small></div>`
          : ""}
        <form id="scheduler-preference-request-form" class="staff-schedule-request-form">
          ${renderSchedulerPreferenceRequestFields()}
          <div class="staff-schedule-request-actions">
            <button type="button" class="ghost-button" data-staff-preference-request-close>Cancel</button>
            <button type="submit">Send preferences</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderStaffCalendarDay(day: Date, month: Date, shifts: StaffShiftRecord[]) {
  const dayKey = toDateInputValue(day);
  const dayShifts = shifts.filter((shift) => toDateInputValue(new Date(shift.startsAt)) === dayKey);
  const isCurrentMonth = day.getMonth() === month.getMonth();
  const isToday = dayKey === toDateInputValue(new Date());
  return `
    <article class="staff-calendar-day${isCurrentMonth ? "" : " muted"}${isToday ? " today" : ""}">
      <div class="staff-calendar-date">
        <strong>${day.getDate()}</strong>
        ${dayShifts.length ? `<span>${dayShifts.length}</span>` : ""}
      </div>
      <div class="staff-calendar-shifts">
        ${dayShifts.length === 0
          ? `<small>No shift</small>`
          : dayShifts.map((shift) => `
              <div class="staff-calendar-shift">
                <strong>${escapeHtml(shiftTimeOnlyLabel(shift))}</strong>
                <span>${escapeHtml(roleLabelForShift(shift))}${shift.locationId ? ` Â· ${escapeHtml(locationName(shift.locationId))}` : ""}</span>
              </div>
            `).join("")}
      </div>
    </article>
  `;
}

function renderStaffPayrollReport() {
  const rows = staffPayrollRows();
  return `
    <div class="club-panel">
      <div class="card-head">
        <div>
          <h3>Payroll report</h3>
          <p class="club-copy">Clocked hours by staff member, ready for payroll review.</p>
        </div>
        <button type="button" class="ghost-button" data-staff-payroll-export ${rows.length === 0 ? "disabled" : ""}>Export CSV</button>
      </div>
      ${rows.length === 0
        ? `<div class="settings-placeholder"><strong>No payroll hours yet</strong><p>Clock staff in and out to build payroll hours.</p></div>`
        : `
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Staff</th><th>Role</th><th>Entries</th><th>Hours</th></tr>
              </thead>
              <tbody>
                ${rows.map((row) => `
                  <tr>
                    <td>${escapeHtml(row.name)}</td>
                    <td>${escapeHtml(row.role)}</td>
                    <td>${row.shiftCount}</td>
                    <td>${row.hoursLabel}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `}
    </div>
  `;
}

function renderStaffPersonalHoursReport() {
  const entries = signedInStaffTimeEntries();
  const totalMinutes = entries.reduce((sum, entry) => sum + staffTimeEntryDurationMinutes(entry), 0);
  const openEntry = entries.find((entry) => !entry.clockedOutAt);
  return `
    <div class="club-panel">
      <div class="card-head">
        <div>
          <h3>My hours</h3>
          <p class="club-copy">Your own clocked time only. This does not include anyone else on the roster.</p>
        </div>
        <button type="button" class="ghost-button" data-staff-my-hours-export ${entries.length === 0 ? "disabled" : ""}>Export CSV</button>
      </div>
      <div class="card-grid compact">
        <article class="mini-card">
          <span>Total hours</span>
          <strong>${(totalMinutes / 60).toFixed(2)}</strong>
        </article>
        <article class="mini-card">
          <span>Status</span>
          <strong>${openEntry ? "Clocked in" : "Not clocked in"}</strong>
          ${openEntry ? `<small data-staff-clock-timer data-clocked-in-at="${escapeAttribute(openEntry.clockedInAt)}">${escapeHtml(formatElapsedSince(openEntry.clockedInAt))}</small>` : ""}
        </article>
      </div>
      ${entries.length === 0
        ? `<div class="settings-placeholder"><strong>No personal hours yet</strong><p>Clock in from your staff row to start building your hours.</p></div>`
        : `
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Clock in</th><th>Clock out</th><th>Hours</th></tr>
              </thead>
              <tbody>
                ${entries.slice(0, 8).map((entry) => `
                  <tr>
                    <td>${escapeHtml(new Date(entry.clockedInAt).toLocaleDateString())}</td>
                    <td>${escapeHtml(new Date(entry.clockedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }))}</td>
                    <td>${entry.clockedOutAt ? escapeHtml(new Date(entry.clockedOutAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })) : "Active"}</td>
                    <td>${(staffTimeEntryDurationMinutes(entry) / 60).toFixed(2)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `}
    </div>
  `;
}

function upcomingStaffShifts() {
  const now = Date.now();
  return [...state.staffShifts]
    .filter((shift) => new Date(shift.endsAt).getTime() >= now)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
}

function signedInStaffShifts() {
  const userId = state.me?.user.id;
  if (!userId) {
    return [];
  }
  return [...state.staffShifts]
    .filter((shift) => shift.userId === userId)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
}

function signedInStaffTimeEntries() {
  const userId = state.me?.user.id;
  if (!userId) {
    return [];
  }
  return [...state.staffTimeEntries]
    .filter((entry) => entry.userId === userId)
    .sort((left, right) => new Date(right.clockedInAt).getTime() - new Date(left.clockedInAt).getTime());
}

function calendarMonthDate() {
  const [year, month] = state.staffScheduleCalendarMonth.split("-").map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  }
  return new Date(year, month - 1, 1);
}

function calendarVisibleDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function staffPayrollRows() {
  const rows = new Map<string, { name: string; role: string; shiftCount: number; minutes: number }>();
  for (const entry of state.staffTimeEntries) {
    const staff = state.staff.find((candidate) => candidate.userId === entry.userId);
    const role = staff ? state.roles.find((candidate) => candidate.id === staff.roleId) : undefined;
    const existing = rows.get(entry.userId) ?? {
      name: staff ? staffFullName(staff) : "Unknown staff",
      role: role ? formatRoleLabel(role.name) : staff ? formatRoleLabel(staff.roleName) : "Staff",
      shiftCount: 0,
      minutes: 0
    };
    existing.shiftCount += 1;
    existing.minutes += staffTimeEntryDurationMinutes(entry);
    rows.set(entry.userId, existing);
  }
  return [...rows.values()]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((row) => ({
      ...row,
      hoursLabel: (row.minutes / 60).toFixed(2)
    }));
}

function canAssignStaffRole(staff: StaffRecord) {
  return (
    hasPermission(Permission.StaffRoleAssign) &&
    staff.status === UserStatus.Active &&
    staff.roleName !== RoleName.Owner &&
    staff.userId !== state.me?.user.id &&
    canManageStaffInVisibleRoleTree(staff)
  );
}

function canRemoveStaffAccess(staff: StaffRecord) {
  return (
    hasPermission(Permission.StaffRemove) &&
    staff.status === UserStatus.Active &&
    staff.roleName !== RoleName.Owner &&
    staff.userId !== state.me?.user.id &&
    canManageStaffInVisibleRoleTree(staff)
  );
}

function canManageStaffInVisibleRoleTree(staff: StaffRecord) {
  const membership = currentMembership();
  const actorRole = membership?.role;
  if (!actorRole) {
    return false;
  }
  if (actorRole.name === RoleName.Owner) {
    return true;
  }
  return descendantRoleIds(actorRole.id).has(staff.roleId);
}

function descendantRoleIds(rootRoleId: string) {
  const ids = new Set<string>();
  const queue = state.roles.filter((role) => role.parentRoleId === rootRoleId).map((role) => role.id);
  while (queue.length > 0) {
    const roleId = queue.shift();
    if (!roleId || ids.has(roleId)) {
      continue;
    }
    ids.add(roleId);
    for (const child of state.roles) {
      if (child.parentRoleId === roleId) {
        queue.push(child.id);
      }
    }
  }
  return ids;
}

function staffRemovalProtectionLabel(staff: StaffRecord) {
  if (staff.userId === state.me?.user.id) {
    return "Current user";
  }
  if (staff.roleName === RoleName.Owner) {
    return "Owner locked";
  }
  if (staff.status !== UserStatus.Active) {
    return "Inactive";
  }
  if (!canManageStaffInVisibleRoleTree(staff)) {
    return "Outside branch";
  }
  return "Protected";
}

function selectedStaffRemovalCandidate() {
  if (!state.staffRemovalUserId) {
    return undefined;
  }
  return staffDirectoryRows().find((staff) => staff.userId === state.staffRemovalUserId);
}

function staffDirectoryRows() {
  if (state.staff.length > 0) {
    return state.staff;
  }
  const self = signedInStaffRecord();
  return self ? [self] : [];
}

function signedInStaffRecord(): StaffRecord | undefined {
  if (!state.gym || !state.me) {
    return undefined;
  }
  const membership = currentMembership();
  const role = membership?.role;
  if (!membership || !role || role.name === RoleName.Member) {
    return undefined;
  }
  const now = new Date().toISOString();
  return {
    membershipId: membership.id,
    gymId: state.gym.id,
    userId: state.me.user.id,
    email: state.me.user.email,
    firstName: state.me.user.firstName,
    lastName: state.me.user.lastName,
    roleId: role.id,
    roleName: role.name,
    status: UserStatus.Active,
    createdAt: now,
    updatedAt: now
  };
}

function staffFullName(staff: Pick<StaffRecord, "firstName" | "lastName" | "email">) {
  return `${staff.firstName} ${staff.lastName}`.trim() || staff.email;
}

function staffInitials(staff: Pick<StaffRecord, "firstName" | "lastName" | "email">) {
  return initialsFromDisplayName(staffFullName(staff));
}

function staffNameForShift(shift: StaffShiftRecord) {
  const staff = state.staff.find((candidate) => candidate.userId === shift.userId);
  if (staff) {
    return staffFullName(staff);
  }
  if (shift.userId === state.me?.user.id) {
    return `${state.me.user.firstName} ${state.me.user.lastName}`.trim() || "Your shift";
  }
  return "Unknown staff";
}

function roleLabelForShift(shift: StaffShiftRecord) {
  const role = state.roles.find((candidate) => candidate.id === shift.roleId);
  if (role) {
    return formatRoleLabel(role.name);
  }
  const membership = currentMembership();
  if (shift.userId === state.me?.user.id && membership?.role?.id === shift.roleId) {
    return formatRoleLabel(membership.role.name);
  }
  return "Staff";
}

function locationName(locationId: string) {
  return state.locations.find((location) => location.id === locationId)?.name ?? locationId;
}

function shiftTimeLabel(shift: StaffShiftRecord) {
  const startsAt = new Date(shift.startsAt);
  const endsAt = new Date(shift.endsAt);
  return `${startsAt.toLocaleDateString()} ${startsAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${endsAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function shiftTimeOnlyLabel(shift: StaffShiftRecord) {
  const startsAt = new Date(shift.startsAt);
  const endsAt = new Date(shift.endsAt);
  return `${startsAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${endsAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function timeRangeLabel(startTime: string, endTime: string) {
  const date = toDateInputValue(new Date());
  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startTime} - ${endTime}`;
  }
  return `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function daysOfWeekLabel(days: number[]) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const normalized = [...new Set(days)].filter((day) => day >= 0 && day <= 6).sort();
  return normalized.length ? normalized.map((day) => labels[day] ?? String(day)).join(", ") : "No days selected";
}

function formatPreferenceLabel(preference: SchedulerAvailabilityRecord["preference"]) {
  if (preference === "preferred") {
    return "Preferred";
  }
  if (preference === "unavailable") {
    return "Avoid";
  }
  return "Available";
}

function shiftDurationMinutes(shift: StaffShiftRecord) {
  return Math.max(0, Math.round((new Date(shift.endsAt).getTime() - new Date(shift.startsAt).getTime()) / 60000));
}

function staffTimeEntryDurationMinutes(entry: StaffTimeEntryRecord) {
  const endTime = entry.clockedOutAt ? new Date(entry.clockedOutAt).getTime() : Date.now();
  return Math.max(0, Math.round((endTime - new Date(entry.clockedInAt).getTime()) / 60000));
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function campaignDefaultUtilizationRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const day = from.getDay();
  from.setDate(from.getDate() + (day === 0 ? -6 : 1 - day));
  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to)
  };
}

function toMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function localDateTimeToIso(date: string, time: string) {
  const value = new Date(`${date}T${time}:00`);
  if (Number.isNaN(value.getTime())) {
    throw new Error("Enter a valid shift date and time.");
  }
  return value.toISOString();
}

function payrollCsv() {
  const header = ["Staff", "Role", "Entries", "Hours"];
  const rows = staffPayrollRows().map((row) => [row.name, row.role, String(row.shiftCount), row.hoursLabel]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function personalHoursCsv() {
  const header = ["Date", "Clock in", "Clock out", "Hours"];
  const rows = signedInStaffTimeEntries().map((entry) => {
    const clockedInAt = new Date(entry.clockedInAt);
    const clockedOutAt = entry.clockedOutAt ? new Date(entry.clockedOutAt) : undefined;
    return [
      clockedInAt.toLocaleDateString(),
      clockedInAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      clockedOutAt ? clockedOutAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Active",
      (staffTimeEntryDurationMinutes(entry) / 60).toFixed(2)
    ];
  });
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function downloadTextFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function studioSettings() {
  return state.gym?.studioSettings ?? {};
}

function studioSetupWizard() {
  return state.gym?.setupWizard ?? { currentStep: "profile" as StudioSetupStep, completedSteps: [] };
}

function studioSetupCompletedSteps() {
  return new Set(studioSetupWizard().completedSteps ?? []);
}

function nextStudioSetupStep(completedSteps: Set<StudioSetupStep>): StudioSetupStep | undefined {
  return STUDIO_SETUP_STEPS.find((step) => !completedSteps.has(step.key))?.key;
}

function centsToDollarsInput(cents?: number) {
  return typeof cents === "number" ? (cents / 100).toFixed(2) : "";
}

function studioOperatingHours() {
  return state.gym?.operatingHours ?? {};
}

function renderStudioSetupWizard() {
  const completed = studioSetupCompletedSteps();
  const completedCount = completed.size;
  const totalCount = STUDIO_SETUP_STEPS.length;
  return `
    <div class="club-panel studio-setup-wizard">
      <div class="card-head">
        <div>
          <h3>Setup wizard</h3>
          <p class="club-copy">A simple path from empty account to first usable revenue plan.</p>
        </div>
        <span>${completedCount} of ${totalCount} complete</span>
      </div>
      <div class="studio-setup-progress" aria-label="Setup progress">
        <span style="width: ${Math.round((completedCount / totalCount) * 100)}%"></span>
      </div>
      <div class="studio-setup-steps">
        ${STUDIO_SETUP_STEPS.map((step, index) => renderStudioSetupStep(step, index, completed.has(step.key))).join("")}
      </div>
    </div>
  `;
}

function renderStudioSetupStep(
  step: (typeof STUDIO_SETUP_STEPS)[number],
  index: number,
  complete: boolean
) {
  const action = setupStepAction(step.key);
  return `
    <article class="studio-setup-step${complete ? " complete" : ""}">
      <div class="studio-setup-number">${complete ? "OK" : index + 1}</div>
      <div>
        <strong>${escapeHtml(step.label)}</strong>
        <p>${escapeHtml(step.description)}</p>
      </div>
      <div class="studio-setup-actions">
        ${action}
        <button type="button" class="ghost-button" data-studio-setup-complete="${step.key}" ${complete ? "disabled" : ""}>
          ${complete ? "Done" : "Mark done"}
        </button>
      </div>
    </article>
  `;
}

function setupStepAction(step: StudioSetupStep) {
  switch (step) {
    case "rooms_devices":
      return `<button type="button" class="ghost-button" data-dashboard-view="locations">Open resources</button>`;
    case "services":
      return `<a class="ghost-button" href="#/dashboard/campaign-layer/imports">Import services</a>`;
    case "first_csv":
      return `<a class="ghost-button" href="#/dashboard/campaign-layer/imports">Upload CSV</a>`;
    case "first_revenue_plan":
      return `<button type="button" class="ghost-button" data-dashboard-view="weekly_plan">Open weekly plan</button>`;
    case "profile":
    default:
      return `<button type="button" class="ghost-button" data-studio-profile-focus>Profile settings</button>`;
  }
}

function renderStudioSettingsForm() {
  const gym = state.gym;
  const settings = studioSettings();
  const canEdit = hasPermission(Permission.GymUpdate);
  return `
    <form id="studio-settings-form" class="form-card studio-settings-form">
      <div class="card-head">
        <div>
          <h3>Studio profile and revenue settings</h3>
          <p class="club-copy">These values power setup, utilization estimates, ROI, and future campaign recommendations.</p>
        </div>
        <span>${canEdit ? "Editable" : "Read only"}</span>
      </div>
      <div class="two-up stacked-mobile">
        ${renderInput("studioName", "Studio name", "text", gym?.name ?? "", !canEdit)}
        <label class="field">
          <span>Business type</span>
          <select name="businessType" ${canEdit ? "" : "disabled"}>
            ${STUDIO_BUSINESS_TYPES.map((type) => `
              <option value="${escapeAttribute(type)}" ${settings.businessType === type ? "selected" : ""}>${escapeHtml(type)}</option>
            `).join("")}
          </select>
        </label>
      </div>
      <div class="two-up stacked-mobile">
        ${renderInput("timezone", "Timezone", "text", gym?.timezone ?? "America/New_York", !canEdit)}
        ${renderInput("defaultBufferMinutes", "Default buffer time (minutes)", "number", String(settings.defaultBufferMinutes ?? 15), !canEdit)}
      </div>
      <div class="three-up stacked-mobile">
        ${renderInput("averageSessionPrice", "Average session price", "number", centsToDollarsInput(settings.averageSessionPriceCents), !canEdit)}
        ${renderInput("softwareMonthlyCost", "Software monthly cost", "number", centsToDollarsInput(settings.softwareMonthlyCostCents), !canEdit)}
        ${renderInput("targetMonthlyRevenue", "Target monthly revenue", "number", centsToDollarsInput(settings.targetMonthlyRevenueCents), !canEdit)}
      </div>
      ${renderOperatingHoursEditor(canEdit)}
      <div class="studio-resource-picker">
        <span class="club-note-label">Resource types used</span>
        <div class="studio-resource-grid">
          ${STUDIO_RESOURCE_TYPES.map((resource) => {
            const checked = (settings.resourceTypesUsed ?? []).includes(resource.value);
            return `
              <label class="permission-chip${checked ? " active" : ""}">
                <input type="checkbox" name="resourceTypesUsed" value="${resource.value}" ${checked ? "checked" : ""} ${canEdit ? "" : "disabled"} />
                <span>${escapeHtml(resource.label)}</span>
              </label>
            `;
          }).join("")}
        </div>
      </div>
      <button type="submit" class="save-button" ${canEdit ? "" : "disabled"}>Save studio settings</button>
    </form>
  `;
}

function renderOperatingHoursEditor(canEdit: boolean) {
  const hours = studioOperatingHours();
  return `
    <fieldset class="studio-hours-fieldset">
      <legend>Operating hours by day</legend>
      <div class="studio-hours-grid">
        ${STUDIO_DAYS.map((day) => {
          const firstRange = hours[day.key]?.[0];
          const isOpen = Boolean(firstRange);
          return `
            <div class="studio-hours-row">
              <label class="studio-hours-open">
                <input type="checkbox" name="open_${day.key}" value="true" ${isOpen ? "checked" : ""} ${canEdit ? "" : "disabled"} />
                <span>${day.label}</span>
              </label>
              <input name="opensAt_${day.key}" type="time" value="${escapeAttribute(firstRange?.opensAt ?? "09:00")}" ${canEdit ? "" : "disabled"} />
              <input name="closesAt_${day.key}" type="time" value="${escapeAttribute(firstRange?.closesAt ?? "17:00")}" ${canEdit ? "" : "disabled"} />
            </div>
          `;
        }).join("")}
      </div>
    </fieldset>
  `;
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
  const editableRoles = staffAssignableRoles();
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
            <article class="mini-card"><span>Business type</span><strong>${escapeHtml(studioSettings().businessType ?? "Not set")}</strong></article>
            <article class="mini-card"><span>Target revenue</span><strong>${formatCurrency(studioSettings().targetMonthlyRevenueCents ?? 0)}</strong></article>
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
                <div class="settings-placeholder" style="margin-bottom: 14px;">
                  <strong>Reservable resource</strong>
                  <p>${selectedRole.createsReservableResource ? "Staff assigned to this role get a reservable resource." : "Staff assigned to this role do not get reservable resources."}</p>
                </div>
                ${selectedRole.isSystem
                  ? `<p class="muted">System roles cannot be edited from the UI.</p>`
                  : `
                    <form id="edit-role-form" class="form-card">
                      ${renderInput("roleName", "Role name", "text", selectedRole.name)}
                      ${renderReservableResourceRoleToggle(selectedRole.createsReservableResource === true)}
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
                        <p>${escapeHtml(staff.email)} Â· ${escapeHtml(staff.roleName)}</p>
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
              ${renderReservableResourceRoleToggle(false)}
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
        <div class="settings-grid settings-grid-wide">
          <div class="club-panel">
            <h3>Featured Items</h3>
            <p class="club-copy">Highlight products, offers, or services for the front desk and POS.</p>
            <div class="settings-placeholder">
              <strong>${state.plans.length} plans available</strong>
              <p>Use this section for pinned items and quick-sale highlights.</p>
            </div>
          </div>
          <div class="club-panel">
            <h3>Point Of Sale rules</h3>
            <p class="club-copy">Control whether simple one-time sales can be collected without attaching them to a customer record.</p>
            <form id="pos-settings-form" class="form-card compact-form">
              <label class="permission-chip active">
                <input type="checkbox" name="allowAnonymousWalkInPos" value="true" ${state.gym?.featureFlags.includes(FeatureFlag.AnonymousWalkInPos) ? "checked" : ""} />
                <span>Allow anonymous walk-in POS sales</span>
              </label>
              <div class="club-note">
                <p>When enabled, staff can collect a one-time walk-in payment with only a buyer name. Plan assignments still require customer contact details.</p>
              </div>
              <button type="submit" ${hasPermission(Permission.GymUpdate) ? "" : "disabled"}>Save POS rules</button>
            </form>
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
          ${renderStudioSetupWizard()}
          ${renderStudioSettingsForm()}
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

function reservationMemberOptions() {
  return state.members
    .filter((member) => member.status !== MemberStatus.Archived)
    .map((member) => ({ value: member.id, label: memberDisplayName(member.id) }));
}

function bookableResourceOptions() {
  return state.resources
    .filter((resource) => resource.status === "active" && resource.isBookable)
    .map((resource) => ({ value: resource.id, label: resourceDisplayName(resource.id) }));
}

function classResourceAllocationOptions(session: PublicSessionRecord) {
  const allocatedResourceIds = new Set(
    state.classResourceAllocations
      .filter((allocation) => allocation.classSessionId === session.id)
      .map((allocation) => allocation.resourceId)
  );
  return state.resources
    .filter(
      (resource) =>
        resource.status === "active" &&
        resource.isBookable &&
        !allocatedResourceIds.has(resource.id) &&
        (!resource.locationId || resource.locationId === session.locationId)
    )
    .map((resource) => ({
      value: resource.id,
      label: `${resource.linkedStaffUserId ? "Staff: " : ""}${resourceDisplayName(resource.id)}`
    }));
}

function resourceById(resourceId: string) {
  return state.resources.find((resource) => resource.id === resourceId);
}

function resourceDisplayName(resourceId: string) {
  const resource = resourceById(resourceId);
  if (!resource) {
    return resourceId;
  }
  const locationName = locationDisplayName(resource.locationId);
  return locationName === "Gym-wide" ? resource.name : `${resource.name} · ${locationName}`;
}

function memberDisplayName(memberId: string) {
  const member = state.members.find((candidate) => candidate.id === memberId);
  if (!member) {
    return memberId;
  }
  return `${member.firstName} ${member.lastName}`.trim() || member.email || member.id;
}

function locationDisplayName(locationId?: string) {
  if (!locationId) {
    return "Gym-wide";
  }
  return state.locations.find((location) => location.id === locationId)?.name ?? locationId;
}

function reservationPaymentLabel(reservation: FacilityReservationRecord) {
  if (reservation.amountCents <= 0 || reservation.paymentStatus === "not_required") {
    return "Not required";
  }
  return `${formatReservationStatus(reservation.paymentStatus)} / ${formatReservationCurrency(reservation.amountCents)}`;
}

function formatDateTimeRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startsAt} - ${endsAt}`;
  }
  const sameDay = start.toDateString() === end.toDateString();
  const startText = start.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  const endText = end.toLocaleString([], sameDay
    ? { hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return `${startText} - ${endText}`;
}

function formatReservationStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatReservationCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

function planSelectOptions() {
  return state.plans
    .filter((plan) => plan.status === PlanStatus.Active)
    .map((plan) => ({ value: plan.id, label: plan.name }));
}

function recurringMembershipPlanOptions() {
  return state.plans.filter(
    (plan) =>
      plan.status === PlanStatus.Active &&
      (plan.billingInterval === BillingInterval.Monthly || plan.billingInterval === BillingInterval.Yearly)
  );
}

function recurringMembershipPlanById(planId: string) {
  return recurringMembershipPlanOptions().find((plan) => plan.id === planId);
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
  const seeded: MemberDeskSignatureRecord[] = DEFAULT_SIGNATURE_REQUIREMENTS.map((label) => ({
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
            <small>Starts ${new Date(membership.startsAt).toLocaleDateString()} Â· ${endsAtLabel}</small>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

const crmActivityTypeOptions: Array<{ value: CrmActivityType; label: string }> = [
  { value: "note", label: "General note" },
  { value: "call", label: "Phone call" },
  { value: "email", label: "Email sent" },
  { value: "text", label: "Text message" },
  { value: "reply", label: "Customer reply" },
  { value: "tour_booked", label: "Tour booked" },
  { value: "tour_completed", label: "Tour completed" },
  { value: "trial_started", label: "Trial started" },
  { value: "trial_attended", label: "Trial attended" },
  { value: "follow_up", label: "Follow-up needed" },
  { value: "follow_up_outcome", label: "Follow-up outcome" },
  { value: "cancellation_reason", label: "Cancellation reason" }
];

function renderCrmTimeline(member: MemberRecord) {
  const activities = [...(state.memberCache[member.id]?.crmActivities ?? [])].sort(
    (left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
  );
  const canWriteConsumers = hasPermission(Permission.MemberWrite);
  return `
    <div class="section-stack crm-timeline-shell">
      ${canWriteConsumers
        ? `<form id="crm-activity-form" class="form-card compact-form crm-activity-form">
            <input type="hidden" name="consumerId" value="${member.id}" />
            ${renderSelect("type", "Activity type", crmActivityTypeOptions, "call")}
            ${renderInput("title", "What happened?", "text", "")}
            <label class="field">
              <span>Details</span>
              <textarea name="description" rows="3" placeholder="Example: Left voicemail about a free tour and intro class."></textarea>
            </label>
            ${renderInput("outcome", "Outcome", "text", "")}
            ${renderInput("occurredAt", "When it happened", "datetime-local", "")}
            ${renderInput("followUpAt", "Follow up on", "datetime-local", "")}
            <button type="submit">Log activity</button>
          </form>`
        : ""}
      ${activities.length === 0
        ? `<div class="settings-placeholder"><strong>No CRM activity yet</strong><p>Log the first call, message, tour, trial, or follow-up outcome here.</p></div>`
        : `<div class="crm-timeline-list">
            ${activities.map(renderCrmActivityCard).join("")}
          </div>`}
    </div>
  `;
}

function renderCrmActivityCard(activity: CrmActivityRecord) {
  return `
    <article class="crm-activity-card">
      <div class="crm-activity-marker">${escapeHtml(crmActivityInitial(activity.type))}</div>
      <div class="crm-activity-body">
        <div class="invoice-card-head">
          <strong>${escapeHtml(activity.title)}</strong>
          <span>${escapeHtml(formatCrmActivityDate(activity.occurredAt))}</span>
        </div>
        <p>${escapeHtml(formatCrmActivityType(activity.type))}</p>
        ${activity.description ? `<small>${escapeHtml(activity.description)}</small>` : ""}
        ${activity.outcome ? `<span class="club-note-label">Outcome: ${escapeHtml(activity.outcome)}</span>` : ""}
        ${activity.followUpAt ? `<span class="club-note-label">Follow up ${escapeHtml(formatCrmActivityDate(activity.followUpAt))}</span>` : ""}
      </div>
    </article>
  `;
}

function formatCrmActivityType(type: CrmActivityType) {
  return crmActivityTypeOptions.find((option) => option.value === type)?.label ?? formatRoleLabel(type);
}

function crmActivityInitial(type: CrmActivityType) {
  const label = formatCrmActivityType(type);
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatCrmActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
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
        <p style="margin:0.5rem 0 0;color:var(--muted);">${member.email || "No email"} Â· ${member.phone || "No phone"}</p>
      </article>
      <article class="mini-card">
        <strong>Emergency contact</strong>
        ${emergencyContact
          ? `<p style="margin:0.5rem 0 0;color:var(--muted);">${escapeHtml(emergencyContact.name)} Â· ${escapeHtml(emergencyContact.phone)}${emergencyContact.relationship ? ` Â· ${escapeHtml(emergencyContact.relationship)}` : ""}</p>`
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
    .map((plan) => ({ value: plan.id, label: `${plan.name} Â· ${formatCurrency(plan.priceCents)}` }));
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

function renderCameraCaptureModal(capture: NonNullable<AppState["cameraCapture"]>) {
  return `
    <div class="checkin-modal-backdrop">
      <div class="checkin-modal camera-capture-modal allowed">
        <div class="camera-capture-shell">
          <div class="checkin-modal-copy">
            <p class="eyebrow">Device camera</p>
            <h3>${escapeHtml(capture.label)}</h3>
            <p>${capture.error ?? "Frame the photo, then capture it from the device camera."}</p>
          </div>
          <div class="camera-capture-stage">
            ${capture.error
              ? `<div class="camera-capture-error">${escapeHtml(capture.error)}</div>`
              : `<video class="camera-capture-video" data-camera-capture-video autoplay playsinline muted></video>`}
          </div>
          <div class="checkin-modal-actions">
            <button type="button" class="ghost-button" data-camera-capture-close>Cancel</button>
            ${capture.error
              ? ""
              : `<button type="button" class="module-nav-button active" data-camera-capture-take>Take picture</button>`}
          </div>
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



function renderPlatformGymOptions(gyms: GymRecord[], selectedGymSlug = "") {
  if (gyms.length === 0) {
    return '<option value="" selected>No gyms available</option>';
  }

  return gyms
    .map(
      (gym) => `
        <option value="${escapeAttribute(gym.slug)}" ${gym.slug === selectedGymSlug ? "selected" : ""}>
          ${escapeHtml(gym.name)} (${escapeHtml(gym.slug)})
        </option>
      `
    )
    .join("");
}

function filterPlatformGyms(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return state.platformGyms;
  }

  return state.platformGyms.filter((gym) => `${gym.name} ${gym.slug}`.toLowerCase().includes(normalizedQuery));
}

function renderMigrationChecklistFields() {
  return `
    <section class="migration-intake">
      <div class="migration-intake-head">
        <div>
          <p class="eyebrow">Pre-migration checklist</p>
          <h3>What needs to move?</h3>
        </div>
        <span>${MIGRATION_CHECKLIST_ITEMS.length} categories</span>
      </div>
      <label class="field">
        <span>Current gym software</span>
        <input name="migrationCurrentSoftware" type="text" placeholder="Mindbody, ClubReady, Pike13, spreadsheets, etc." />
      </label>
      <div class="migration-checklist-grid">
        ${MIGRATION_CHECKLIST_ITEMS.map((item) => `
          <article class="migration-check-item">
            <label class="migration-check-header">
              <input type="checkbox" name="migrationItems" value="${escapeAttribute(item.key)}" />
              <span>
                <strong>${escapeHtml(item.label)}</strong>
                <small>${escapeHtml(item.description)}</small>
              </span>
            </label>
            <details class="migration-source-details">
              <summary>How will this data be provided?</summary>
              <div class="migration-source-grid">
                <label class="field">
                  <span>Export/source type</span>
                  <select name="migrationSourceType_${escapeAttribute(item.key)}">
                    ${MIGRATION_SOURCE_TYPES.map((type) => `
                      <option value="${escapeAttribute(type.value)}">${escapeHtml(type.label)}</option>
                    `).join("")}
                  </select>
                </label>
                <label class="field">
                  <span>File, report, or source name</span>
                  <input
                    name="migrationSourceName_${escapeAttribute(item.key)}"
                    type="text"
                    placeholder="members.csv, Billing Detail report, API endpoint, etc."
                  />
                </label>
                <label class="field migration-upload-field">
                  <span>Upload export files</span>
                  <input
                    name="migrationUploads_${escapeAttribute(item.key)}"
                    type="file"
                    accept="${escapeAttribute(MIGRATION_UPLOAD_ACCEPT)}"
                    multiple
                  />
                  <small>CSV, Excel, JSON, TXT, or PDF. Up to ${MIGRATION_UPLOAD_MAX_FILES} files, ${Math.round(MIGRATION_UPLOAD_MAX_BYTES / 1024 / 1024)} MB each.</small>
                </label>
                <label class="field">
                  <span>Fields or columns included</span>
                  <textarea
                    name="migrationFieldNotes_${escapeAttribute(item.key)}"
                    rows="3"
                    placeholder="Example: first_name, last_name, email, phone, status, next_billing_date"
                  ></textarea>
                </label>
                <label class="field">
                  <span>Import notes</span>
                  <textarea
                    name="migrationImportNotes_${escapeAttribute(item.key)}"
                    rows="3"
                    placeholder="Anything special: duplicate cleanup, missing fields, date format, processor limitations."
                  ></textarea>
                </label>
              </div>
            </details>
          </article>
        `).join("")}
      </div>
      <label class="field">
        <span>Migration notes</span>
        <textarea
          name="migrationNotes"
          rows="4"
          placeholder="Add anything unusual: old system exports, payment processor limits, dirty data, duplicate members, or must-have go-live timing."
        ></textarea>
      </label>
    </section>
  `;
}

function renderNewGymSignupDashboard(bannerMarkup: string) {
  return `
    ${bannerMarkup}
    <div class="section-head">
      <div>
        <p class="eyebrow">Create new gym</p>
        <h2>Owner account and migration intake</h2>
        <p class="club-copy">Start a workspace and capture what needs to move from the old gym system.</p>
      </div>
      <div class="head-actions">
        <button type="submit" form="register-form" class="save-button">Create gym</button>
        <a href="?#/dashboard" class="ghost-button route-link">Back to login</a>
        <a href="?admin=1#/dashboard" class="ghost-button route-link">Admin login</a>
      </div>
    </div>
    <form id="register-form" class="form-card create-gym-onboarding-form">
      <div class="signup-form-grid">
        <section class="signup-account-section">
          <p class="eyebrow">Owner account</p>
          <h3>Account details</h3>
          ${renderInput("firstName", "Owner first name")}
          ${renderInput("lastName", "Owner last name")}
          ${renderInput("email", "Owner email", "email")}
          ${renderInput("password", "Owner password", "password")}
          ${renderInput("gymName", "Gym name")}
        </section>
        ${renderMigrationChecklistFields()}
      </div>
      <div class="form-actions">
        <a href="?#/dashboard" class="ghost-button route-link">Cancel</a>
        <button type="submit">Create new gym</button>
      </div>
    </form>
  `;
}

function renderStaffLoginDashboard(bannerMarkup: string) {
  if (isNewGymSignupRoute()) {
    return renderNewGymSignupDashboard(bannerMarkup);
  }

  return `
    ${bannerMarkup}
    <div class="section-head">
      <div>
        <p class="eyebrow">Staff login</p>
        <h2>Log in to your workspace</h2>
        <p class="club-copy">Your assigned gym opens automatically after you sign in.</p>
      </div>
      <div class="head-actions">
        <a href="?createGym=1#/dashboard" class="ghost-button route-link">Create new gym</a>
        <a href="?admin=1#/dashboard" class="ghost-button route-link">Admin login</a>
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

function renderPlatformDashboard() {
  if (!state.session) {
    return `
      <div class="section-head">
        <div>
          <p class="eyebrow">Platform Dashboard</p>
          <h2>Admin login</h2>
          <p class="club-copy">Sign in with a platform admin account to add, remove, or inspect gyms.</p>
        </div>
        <a href="?#/dashboard" class="ghost-button route-link">Staff login</a>
      </div>
      <div class="two-up">
        <form id="login-form" class="form-card">
          <h3>Admin login</h3>
          ${renderInput("email", "Email", "email")}
          ${renderInput("password", "Password", "password")}
          <button type="submit">Log in</button>
        </form>
      </div>
    `;
  }
  if (state.platformAccessDenied) {
    return `
      <div class="section-head">
        <div>
          <p class="eyebrow">Platform Dashboard</p>
          <h2>Workspace Admin</h2>
        </div>
        <div class="head-actions">
          <a href="?#/dashboard" class="ghost-button route-link">Staff login</a>
          <button id="logout-button" class="ghost-button" type="button">Log out</button>
        </div>
      </div>
      <section class="data-card">
        <div class="empty-state">
          <h3>Platform admin access required</h3>
          <p>This account can only access its assigned gym. Open that gym's login page, or sign in here with a platform admin account.</p>
        </div>
      </section>
    `;
  }
  if (!state.platformGymDirectoryLoaded) {
    return `
      <div class="section-head">
        <div>
          <p class="eyebrow">Platform Dashboard</p>
          <h2>Workspace Admin</h2>
        </div>
        <div class="head-actions">
          <a href="?#/dashboard" class="ghost-button route-link">Staff login</a>
          <button id="logout-button" class="ghost-button" type="button">Log out</button>
        </div>
      </div>
      <div class="empty-state"><h3>Loading gyms</h3><p>Checking platform admin access.</p></div>
    `;
  }

  const selectedGymSlug = state.platformGyms.some((gym) => gym.slug === state.publicSlug)
    ? state.publicSlug
    : state.platformGyms[0]?.slug ?? "";

  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Platform Dashboard</p>
        <h2>Workspace Admin</h2>
      </div>
      <div class="head-actions">
        <a href="?#/dashboard" class="ghost-button route-link">Staff login</a>
        <button id="logout-button" class="ghost-button" type="button">Log out</button>
      </div>
    </div>

    <div class="list-grid">
      <section class="data-card">
        <div class="card-head">
          <h3>All Gyms</h3>
          <span>${state.platformGyms.length} total</span>
        </div>
        <form id="platform-gym-picker-form" class="platform-gym-picker">
          <label class="field">
            <span>Search gyms</span>
            <input
              id="platform-gym-search"
              name="gymSearch"
              type="search"
              placeholder="Search by gym name or slug"
              autocomplete="off"
            />
          </label>
          <label class="field">
            <span>Gym</span>
            <select id="platform-gym-select" name="gymSlug" ${state.platformGyms.length === 0 ? "disabled" : ""}>
              ${renderPlatformGymOptions(state.platformGyms, selectedGymSlug)}
            </select>
          </label>
          <button id="platform-gym-picker-submit" type="submit" ${state.platformGyms.length === 0 ? "disabled" : ""}>Open Gym</button>
        </form>
        <p id="platform-gym-search-status" class="muted platform-gym-picker-status">
          Search by name or slug across ${state.platformGyms.length} gyms.
        </p>
        <div class="gym-cards" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; padding: 1rem;">
          ${state.platformGyms.map(gym => `
            <article class="form-card platform-gym-card">
              <a href="?gymSlug=${escapeAttribute(gym.slug)}#/dashboard" style="text-decoration:none; color:inherit;">
                <h4>${escapeHtml(gym.name)}</h4>
                <small>${escapeHtml(gym.slug)}</small>
              </a>
              <button type="button" class="ghost-button danger" data-platform-gym-archive="${escapeAttribute(gym.id)}">Remove</button>
            </article>
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

function bindPlatformGymPicker() {
  const searchInput = app.querySelector<HTMLInputElement>("#platform-gym-search");
  const select = app.querySelector<HTMLSelectElement>("#platform-gym-select");
  const status = app.querySelector<HTMLElement>("#platform-gym-search-status");
  const submitButton = app.querySelector<HTMLButtonElement>("#platform-gym-picker-submit");
  if (!searchInput || !select || !status || !submitButton) {
    return;
  }

  const updateOptions = () => {
    const filteredGyms = filterPlatformGyms(searchInput.value);
    const selectedGymSlug = filteredGyms.some((gym) => gym.slug === select.value)
      ? select.value
      : filteredGyms[0]?.slug ?? "";

    select.innerHTML = renderPlatformGymOptions(filteredGyms, selectedGymSlug);
    const hasMatches = filteredGyms.length > 0;
    select.disabled = !hasMatches;
    submitButton.disabled = !hasMatches;

    if (!searchInput.value.trim()) {
      status.textContent = `Search by name or slug across ${state.platformGyms.length} gyms.`;
      return;
    }

    status.textContent = hasMatches
      ? `${filteredGyms.length} ${filteredGyms.length === 1 ? "gym" : "gyms"} match your search.`
      : `No gyms match \"${searchInput.value.trim()}\".`;
  };

  searchInput.addEventListener("input", updateOptions);
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
        if (btn.dataset.checkInRailToggle === "true") {
          toggleCheckInRail();
          return;
        }
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

  app.querySelectorAll<HTMLButtonElement>("[data-consumer-segment]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const segment = button.dataset.consumerSegment as ConsumerSegmentFilter | undefined;
      if (!segment) {
        return;
      }
      navigateConsumerSegment(segment);
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
    el.addEventListener("click", async () => {
      state.selectedMemberId = el.dataset.memberId;
      if (state.gym && state.selectedMemberId) {
        await ensureMemberCacheEntry(state.gym.id, state.selectedMemberId);
      }
      navigateDashboardView(el.dataset.viewTarget === "check_in" ? "check_in" : "customer_profile", { preserveContext: true });
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-check-in-member-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selectedMemberId = button.dataset.checkInMemberId;
      if (state.gym && state.selectedMemberId) {
        await ensureMemberCacheEntry(state.gym.id, state.selectedMemberId);
      }
      openCheckInRail();
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
          await refreshDashboard({ silent: true });
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

  app.querySelectorAll<HTMLButtonElement>("[data-studio-profile-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest(".settings-content")?.querySelector("#studio-settings-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-studio-setup-complete]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym) {
          return;
        }
        if (!hasPermission(Permission.GymUpdate)) {
          throw new Error("Gym update permission is required to update setup progress.");
        }
        const step = button.dataset.studioSetupComplete as StudioSetupStep | undefined;
        if (!step) {
          return;
        }
        const completedSteps = studioSetupCompletedSteps();
        completedSteps.add(step);
        const currentStep = nextStudioSetupStep(completedSteps);
        const updatedGym = (await client.updateGym(state.gym.id, {
          setupWizard: {
            currentStep: currentStep ?? step,
            completedSteps: [...completedSteps],
            ...(completedSteps.size === STUDIO_SETUP_STEPS.length ? { completedAt: new Date().toISOString() } : {})
          }
        })) as GymRecord;
        state.gym = updatedGym;
        setBanner("success", "Setup progress updated.");
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLSelectElement>("[data-class-session-select]").forEach((select) => {
    select.addEventListener("change", async () => {
      state.selectedClassSessionId = select.value;
      state.selectedReservationAgendaItemId = `class:${select.value}`;
      await refreshSelectedClassBookings();
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-reservation-agenda-select]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        const itemId = button.dataset.reservationAgendaSelect;
        if (!itemId) {
          return;
        }
        state.selectedReservationAgendaItemId = itemId;
        if (itemId.startsWith("class:")) {
          state.selectedClassSessionId = itemId.slice("class:".length);
          await refreshSelectedClassBookings();
        }
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  const staffAccessSearch = app.querySelector<HTMLInputElement>("[data-staff-access-search]");
  staffAccessSearch?.addEventListener("input", () => {
    applyStaffAccessFilters();
  });
  const staffAccessRoleFilter = app.querySelector<HTMLSelectElement>("[data-staff-access-role-filter]");
  staffAccessRoleFilter?.addEventListener("change", () => {
    applyStaffAccessFilters();
  });

  const staffRolePreset = app.querySelector<HTMLSelectElement>("[data-staff-role-preset]");
  staffRolePreset?.addEventListener("change", () => {
    applyStaffRolePreset(staffRolePreset);
  });
  app.querySelectorAll<HTMLButtonElement>("[data-auth-tree-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const roleId = button.dataset.authTreeToggle;
      if (!roleId) {
        return;
      }
      const expandedRoleIds = new Set(state.staffAuthTreeExpandedRoleIds);
      if (expandedRoleIds.has(roleId)) {
        expandedRoleIds.delete(roleId);
      } else {
        expandedRoleIds.add(roleId);
      }
      state.staffAuthTreeExpandedRoleIds = Array.from(expandedRoleIds);
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-role-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) return;
      const roleId = button.dataset.staffRoleDelete;
      const role = state.roles.find((candidate) => candidate.id === roleId);
      if (!role || !canDeleteRole(role)) return;
      if (!window.confirm(`Delete the ${formatRoleLabel(role.name)} role? This can only be done because nobody is assigned to it.`)) {
        return;
      }
      try {
        await client.deleteCustomRole(state.gym.id, role.id);
        setBanner("success", "Role deleted from the authorization tree.");
        await refreshDashboard({ silent: true });
        navigateDashboardView("staff", { preserveContext: true });
      } catch (error) {
        setBanner("error", describeError(error));
      }
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-scheduler-publish]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym || !state.schedulerDraft) return;
      try {
        await client.publishSchedule(state.gym.id, {
          startsOn: state.schedulerDraft.startsOn,
          endsOn: state.schedulerDraft.endsOn,
          replaceExisting: false
        });
        setBanner("success", "Generated schedule published to staff shifts.");
        state.schedulerDraft = undefined;
        await refreshDashboard({ silent: true });
        navigateDashboardView("scheduler", { preserveContext: true });
      } catch (error) {
        setBanner("error", describeError(error));
      }
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-scheduler-resolve]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) return;
      const requestId = button.dataset.schedulerResolve;
      if (!requestId) return;
      const autoAssignReplacement = button.dataset.schedulerResolveAuto === "true";
      try {
        await client.resolveSchedulerRequest(state.gym.id, requestId, {
          decision: "apply",
          autoAssignReplacement
        });
        setBanner("success", "Schedule request reviewed and change applied when a replacement was available.");
        await refreshDashboard({ silent: true });
        navigateDashboardView("scheduler", { preserveContext: true });
      } catch (error) {
        setBanner("error", describeError(error));
      }
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-scheduler-decline]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) return;
      const requestId = button.dataset.schedulerDecline;
      if (!requestId) return;
      const resolutionNote = window.prompt("Why is this schedule request being declined?", "Declined after scheduler review.");
      if (resolutionNote === null) return;
      try {
        await client.resolveSchedulerRequest(state.gym.id, requestId, {
          decision: "decline",
          autoAssignReplacement: false,
          resolutionNote: resolutionNote.trim() || "Declined after scheduler review."
        });
        setBanner("success", "Schedule request declined.");
        await refreshDashboard({ silent: true });
        navigateDashboardView("scheduler", { preserveContext: true });
      } catch (error) {
        setBanner("error", describeError(error));
      }
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-scheduler-preference-approve]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) return;
      const requestId = button.dataset.schedulerPreferenceApprove;
      if (!requestId) return;
      try {
        await client.resolveSchedulerPreferenceRequest(state.gym.id, requestId, {
          decision: "approve",
          resolutionNote: "Approved for future schedule generation."
        });
        setBanner("success", "Long-term preference approved and saved.");
        await refreshDashboard({ silent: true });
        navigateDashboardView("scheduler", { preserveContext: true });
      } catch (error) {
        setBanner("error", describeError(error));
      }
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-scheduler-preference-decline]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) return;
      const requestId = button.dataset.schedulerPreferenceDecline;
      if (!requestId) return;
      const resolutionNote = window.prompt("Why is this long-term preference being declined?", "Preference is too restrictive for coverage needs.");
      if (resolutionNote === null) return;
      try {
        await client.resolveSchedulerPreferenceRequest(state.gym.id, requestId, {
          decision: "decline",
          resolutionNote: resolutionNote.trim() || "Preference is too restrictive for coverage needs."
        });
        setBanner("success", "Long-term preference declined.");
        await refreshDashboard({ silent: true });
        navigateDashboardView("scheduler", { preserveContext: true });
      } catch (error) {
        setBanner("error", describeError(error));
      }
    });
  });

  app.querySelectorAll<HTMLElement>("[data-staff-calendar-close]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (element.classList.contains("staff-calendar-backdrop") && event.target !== element) {
        return;
      }
      state.staffScheduleCalendarOpen = false;
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-calendar-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextShift = signedInStaffShifts().find((shift) => new Date(shift.endsAt).getTime() >= Date.now());
      state.staffScheduleCalendarMonth = toMonthKey(nextShift ? new Date(nextShift.startsAt) : new Date());
      state.staffScheduleCalendarOpen = true;
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-calendar-prev]").forEach((button) => {
    button.addEventListener("click", () => {
      state.staffScheduleCalendarMonth = toMonthKey(addMonths(calendarMonthDate(), -1));
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-calendar-next]").forEach((button) => {
    button.addEventListener("click", () => {
      state.staffScheduleCalendarMonth = toMonthKey(addMonths(calendarMonthDate(), 1));
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-calendar-today]").forEach((button) => {
    button.addEventListener("click", () => {
      state.staffScheduleCalendarMonth = toMonthKey(new Date());
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-staff-schedule-request-open]").forEach((button) => {
    button.addEventListener("click", () => {
      state.staffScheduleRequestModalOpen = true;
      render();
    });
  });
  app.querySelectorAll<HTMLElement>("[data-staff-schedule-request-close]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (element.classList.contains("staff-schedule-request-backdrop") && event.target !== element) {
        return;
      }
      state.staffScheduleRequestModalOpen = false;
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-preference-request-open]").forEach((button) => {
    button.addEventListener("click", () => {
      state.staffPreferenceRequestModalOpen = true;
      render();
    });
  });
  app.querySelectorAll<HTMLElement>("[data-staff-preference-request-close]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (element.classList.contains("staff-schedule-request-backdrop") && event.target !== element) {
        return;
      }
      state.staffPreferenceRequestModalOpen = false;
      render();
    });
  });

  app.querySelectorAll<HTMLElement>("[data-staff-removal-close]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (element.classList.contains("staff-removal-backdrop") && event.target !== element) {
        return;
      }
      state.staffRemovalUserId = undefined;
      render();
    });
  });
  const staffRemovalConfirmInput = app.querySelector<HTMLInputElement>("[data-staff-removal-confirm-input]");
  const staffRemovalSubmit = app.querySelector<HTMLButtonElement>("[data-staff-removal-submit]");
  staffRemovalConfirmInput?.addEventListener("input", () => {
    if (staffRemovalSubmit) {
      staffRemovalSubmit.disabled = staffRemovalConfirmInput.value.trim().toUpperCase() !== "REMOVE";
    }
  });

  app.querySelectorAll<HTMLButtonElement>("[data-staff-clock-open]").forEach((button) => {
    button.addEventListener("click", () => {
      state.staffClockModalOpen = true;
      render();
    });
  });
  app.querySelectorAll<HTMLElement>("[data-staff-clock-close]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (element.classList.contains("staff-clock-backdrop") && event.target !== element) {
        return;
      }
      state.staffClockModalOpen = false;
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-clock-kiosk-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) return;
      const action = button.dataset.staffClockKioskAction === "clock-out" ? "clock-out" : "clock-in";
      const form = button.closest<HTMLFormElement>("form");
      const data = form ? formData(form) : {};
      const email = data.email?.trim();
      const password = data.password;
      const notes = data.notes?.trim();
      const twoFactorCode = data.twoFactorCode?.trim();
      if (!email || !password) {
        setBanner("error", "Enter the employee email and password before clocking time.");
        return;
      }
      try {
        const employee = await clockEmployeeFromTimeClock({
          action,
          email,
          password,
          ...(twoFactorCode ? { twoFactorCode } : {}),
          ...(data.locationId ? { locationId: data.locationId } : {}),
          ...(notes ? { notes } : {})
        });
        state.staffClockModalOpen = false;
        setBanner("success", `${employee.firstName} ${employee.lastName} clocked ${action === "clock-in" ? "in" : "out"}.`);
        await refreshDashboard({ silent: true });
        render();
      } catch (error) {
        setBanner("error", describeError(error));
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-staff-clock-in]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) return;
      const userId = button.dataset.staffClockIn;
      if (!userId) return;
      try {
        const locationInput = state.selectedLocationId ? { locationId: state.selectedLocationId } : {};
        if (userId === state.me?.user.id && !hasPermission(Permission.StaffRoleAssign)) {
          await client.clockMyStaffIn(state.gym.id, locationInput);
        } else {
          await client.clockStaffIn(state.gym.id, {
            userId,
            ...locationInput
          });
        }
        setBanner("success", "Staff member clocked in.");
        await refreshDashboard({ silent: true });
        navigateDashboardView("staff", { preserveContext: true });
      } catch (error) {
        setBanner("error", describeError(error));
      }
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-clock-out]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) return;
      const userId = button.dataset.staffClockOut;
      if (!userId) return;
      try {
        if (userId === state.me?.user.id && !hasPermission(Permission.StaffRoleAssign)) {
          await client.clockMyStaffOut(state.gym.id);
        } else {
          await client.clockStaffOut(state.gym.id, { userId });
        }
        setBanner("success", "Staff member clocked out.");
        await refreshDashboard({ silent: true });
        navigateDashboardView("staff", { preserveContext: true });
      } catch (error) {
        setBanner("error", describeError(error));
      }
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
        await refreshDashboard({ silent: true });
      } catch (error) {
        setBanner("error", describeError(error));
      }
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-access-remove]").forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = button.dataset.staffAccessRemove;
      const staff = staffDirectoryRows().find((candidate) => candidate.userId === userId);
      if (!userId || !staff) return;
      if (!canRemoveStaffAccess(staff)) {
        return;
      }
      state.staffRemovalUserId = userId;
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-payroll-export]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      downloadTextFile("staff-payroll-report.csv", payrollCsv(), "text/csv;charset=utf-8");
      setBanner("success", "Payroll report exported.");
      render();
    });
  });
  app.querySelectorAll<HTMLButtonElement>("[data-staff-my-hours-export]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      downloadTextFile("my-hours-report.csv", personalHoursCsv(), "text/csv;charset=utf-8");
      setBanner("success", "My hours report exported.");
      render();
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

  app.querySelectorAll<HTMLButtonElement>("[data-camera-capture-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const formId = button.dataset.cameraCaptureFormId;
      const inputName = button.dataset.cameraCaptureOpen;
      const label = button.dataset.cameraCaptureLabel ?? "Take picture";
      if (!formId || !inputName) {
        return;
      }
      state.cameraCapture = { formId, inputName, label };
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-photo-picker-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const inputId = button.dataset.photoPickerOpen;
      if (!inputId) {
        return;
      }
      app.querySelector<HTMLInputElement>(`#${CSS.escape(inputId)}`)?.click();
    });
  });

  app.querySelectorAll<HTMLInputElement>("[data-photo-picker-input]").forEach((input) => {
    input.addEventListener("change", () => {
      const formId = input.dataset.photoPickerFormId;
      const inputName = input.dataset.photoPickerInput;
      const file = input.files?.[0];
      if (!formId || !inputName || !file) {
        return;
      }
      setPendingCameraPhoto(formId, inputName, file);
      setBanner("success", "Photo selected.");
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-camera-capture-close]").forEach((button) => {
    button.addEventListener("click", () => {
      closeCameraCapture();
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-camera-capture-take]").forEach((button) => {
    button.addEventListener("click", async () => {
      const capture = state.cameraCapture;
      if (!capture) {
        return;
      }
      const video = app.querySelector<HTMLVideoElement>("[data-camera-capture-video]");
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        setBanner("error", "Camera is not ready yet. Try again in a moment.");
        return;
      }
      try {
        const file = await capturePhotoFromVideo(video, capture.inputName);
        setPendingCameraPhoto(capture.formId, capture.inputName, file);
        closeCameraCapture();
        setBanner("success", "Photo captured.");
        render();
      } catch (error) {
        setBanner("error", describeError(error));
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
    await refreshDashboard({ silent: true });
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
      permissions: permissions as Permission[],
      createsReservableResource: data.createsReservableResource === "true"
    });
    setBanner("success", "Custom role created.");
    await refreshDashboard({ silent: true });
  });

  bindForm("create-staff-role-form", async (form) => {
    if (!state.gym) {
      return;
    }
    if (!canCreateRolesFromStaffPage()) {
      throw new Error("Only the owner can create roles from the Staff page.");
    }
    const data = formData(form);
    const permissions = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="permissions"]:checked')).map(
      (input) => input.value
    );
    if (permissions.length === 0) {
      throw new Error("Choose at least one permission for the new role.");
    }
    const role = (await client.createCustomRole(state.gym.id, {
      name: data.staffRoleName,
      ...(data.parentRoleId ? { parentRoleId: data.parentRoleId } : {}),
      permissions: permissions as Permission[],
      createsReservableResource: data.createsReservableResource === "true"
    })) as RoleRecord;
    state.selectedRoleId = role.id ?? state.selectedRoleId;
    setBanner("success", "Role saved. You can assign it from the staff directory.");
    await refreshDashboard({ silent: true });
    navigateDashboardView("staff", { preserveContext: true });
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
      permissions: permissions as Permission[],
      createsReservableResource: data.createsReservableResource === "true"
    });
    setBanner("success", "Role updated.");
    await refreshDashboard({ silent: true });
  });

  bindForm("create-staff-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const roleId = data.roleId;
    if (!roleId) {
      throw new Error("Choose a staff role before creating the account.");
    }
    const inviteResponse = (await client.createStaffInvite(state.gym.id, {
      email: data.email,
      roleId,
      message: "Created from staff management."
    })) as { inviteToken?: string };
    if (!inviteResponse.inviteToken) {
      throw new Error("Staff invite did not return a creation token.");
    }
    await client.acceptStaffInvite({
      token: inviteResponse.inviteToken,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password
    });
    setBanner("success", "Staff account created and assigned to this gym.");
    await refreshDashboard({ silent: true });
    navigateDashboardView("staff", { preserveContext: true });
  });

  bindForm("staff-remove-confirm-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const staff = staffDirectoryRows().find((candidate) => candidate.userId === data.userId);
    if (!staff || !canRemoveStaffAccess(staff)) {
      throw new Error("You do not have permission to remove this staff access.");
    }
    if (data.confirmText.trim().toUpperCase() !== "REMOVE") {
      throw new Error("Type REMOVE to confirm staff access removal.");
    }
    const reason = data.reason.trim() || "Removed from staff management.";
    await client.removeStaffAccess(state.gym.id, staff.userId, { reason });
    state.staffRemovalUserId = undefined;
    setBanner("success", `Removed gym access for ${staffFullName(staff)}.`);
    await refreshDashboard({ silent: true });
    navigateDashboardView("staff", { preserveContext: true });
  });

  bindForm("create-staff-shift-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    if (!data.userId || !data.roleId) {
      throw new Error("Choose a staff member and shift position.");
    }
    const startsAt = localDateTimeToIso(data.shiftDate, data.startsAt);
    const endsAt = localDateTimeToIso(data.shiftDate, data.endsAt);
    await client.createStaffShift(state.gym.id, {
      userId: data.userId,
      roleId: data.roleId,
      ...(data.locationId ? { locationId: data.locationId } : {}),
      startsAt,
      endsAt,
      ...(data.notes?.trim() ? { notes: data.notes.trim() } : {})
    });
    setBanner("success", "Staff shift scheduled.");
    await refreshDashboard({ silent: true });
    navigateDashboardView("staff", { preserveContext: true });
  });

  bindForm("scheduler-rule-form", async (form) => {
    if (!state.gym) return;
    const data = formData(form);
    const daysOfWeek = schedulerDaysFromForm(form);
    if (!data.roleId || daysOfWeek.length === 0) {
      throw new Error("Choose a role and at least one day for the coverage rule.");
    }
    await client.createSchedulerRule(state.gym.id, {
      name: data.name,
      roleId: data.roleId,
      ...(data.locationId ? { locationId: data.locationId } : {}),
      daysOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      requiredStaff: Number(data.requiredStaff || 1)
    });
    setBanner("success", "Scheduler coverage rule saved.");
    await refreshDashboard({ silent: true });
    navigateDashboardView("scheduler", { preserveContext: true });
  });

  bindForm("scheduler-settings-form", async (form) => {
    if (!state.gym) return;
    const data = formData(form);
    const planningHorizonDays = Number(data.planningHorizonDays || 14);
    await client.updateSchedulerSettings(state.gym.id, {
      planningHorizonDays
    });
    setBanner("success", "Scheduler planning setup saved.");
    await refreshDashboard({ silent: true });
    navigateDashboardView("scheduler", { preserveContext: true });
  });

  bindForm("scheduler-availability-form", async (form) => {
    if (!state.gym) return;
    const data = formData(form);
    const daysOfWeek = schedulerDaysFromForm(form);
    if (!data.userId || daysOfWeek.length === 0) {
      throw new Error("Choose staff and at least one availability day.");
    }
    await client.createSchedulerAvailability(state.gym.id, {
      userId: data.userId,
      daysOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      preference: data.preference as "available" | "preferred" | "unavailable",
      ...(data.notes?.trim() ? { notes: data.notes.trim() } : {})
    });
    setBanner("success", "Availability saved.");
    await refreshDashboard({ silent: true });
    navigateDashboardView("scheduler", { preserveContext: true });
  });

  bindForm("scheduler-preference-request-form", async (form) => {
    if (!state.gym) return;
    const data = formData(form);
    const daysOfWeek = schedulerDaysFromForm(form);
    if (daysOfWeek.length === 0) {
      throw new Error("Choose at least one day for the preference request.");
    }
    await client.createSchedulerPreferenceRequest(state.gym.id, {
      daysOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      preference: data.preference as "available" | "preferred" | "unavailable",
      ...(data.notes?.trim() ? { notes: data.notes.trim() } : {})
    });
    const returnToScheduler = hasPermission(Permission.ScheduleRead) && state.dashboardView === "scheduler";
    state.staffPreferenceRequestModalOpen = false;
    setBanner("success", "Long-term preference request sent.");
    await refreshDashboard({ silent: true });
    navigateDashboardView(returnToScheduler ? "scheduler" : "staff", { preserveContext: true });
  });

  bindForm("scheduler-generate-form", async (form) => {
    if (!state.gym) return;
    const data = formData(form);
    const draft = (await client.generateSchedule(state.gym.id, {
      startsOn: data.startsOn,
      ...(data.locationId ? { locationId: data.locationId } : {})
    })) as ScheduleDraftRecord;
    state.schedulerDraft = draft;
    setBanner("success", "Schedule draft created.");
    render();
  });

  bindForm("scheduler-request-form", async (form) => {
    if (!state.gym) return;
    const data = formData(form);
    if (!data.message?.trim()) {
      throw new Error("Add a message before sending a schedule request.");
    }
    await client.createSchedulerRequest(state.gym.id, {
      ...(data.shiftId ? { shiftId: data.shiftId } : {}),
      requestType: data.requestType as "time_off" | "swap" | "complaint",
      message: data.message.trim()
    });
    const returnToScheduler = hasPermission(Permission.ScheduleRead) && state.dashboardView === "scheduler";
    state.staffScheduleRequestModalOpen = false;
    setBanner("success", "Schedule request sent.");
    await refreshDashboard({ silent: true });
    navigateDashboardView(returnToScheduler ? "scheduler" : "staff", { preserveContext: true });
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
    const uploadedProfileImageUrl = await uploadProfileImageFromForm(state.gym.id, form, memberId);
    await client.updateMember(state.gym.id, memberId, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      profileImageUrl: uploadedProfileImageUrl ?? memberProfileImageUrl(memberId),
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
    await refreshDashboard({ silent: true });
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
    const member = state.members.find((candidate) => candidate.id === memberId);
    if (member && recurringMembershipPlanById(planId)) {
      assertRecurringMembershipRequirements(member, "before assigning a recurring membership.");
    }
    await client.assignMemberMembership(state.gym.id, memberId, {
      planId,
      status: (data.status as MembershipStatus) || MembershipStatus.Active
    });
    await refreshDashboard({ silent: true });
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

  bindForm("crm-activity-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const consumerId = data.consumerId;
    if (!consumerId) {
      return;
    }
    await client.createConsumerActivity(state.gym.id, consumerId, {
      type: (data.type as CrmActivityType) || "note",
      title: data.title,
      ...(data.description.trim() ? { description: data.description.trim() } : {}),
      ...(data.outcome.trim() ? { outcome: data.outcome.trim() } : {}),
      ...(data.occurredAt ? { occurredAt: new Date(data.occurredAt).toISOString() } : {}),
      ...(data.followUpAt ? { followUpAt: new Date(data.followUpAt).toISOString() } : {})
    });
    state.memberCache = {
      ...state.memberCache,
      [consumerId]: await loadMemberCacheEntry(state.gym.id, consumerId)
    };
    setBanner("success", "CRM activity logged.");
    navigateDashboardView("customer_profile", { preserveContext: true });
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

  bindPlatformGymPicker();

  bindForm("platform-gym-picker-form", async (form) => {
    const data = formData(form);
    const selectedGymSlug = data.gymSlug?.trim();
    if (!selectedGymSlug) {
      setBanner("error", "Select a gym before opening the dashboard.");
      render();
      return;
    }

    window.location.assign(`?gymSlug=${encodeURIComponent(selectedGymSlug)}#/dashboard`);
  });

  bindForm("platform-create-gym-form", async (form) => {
    const data = await registerInputFromForm(form, { requireGymName: true });
    if (!data) {
      return;
    }
    try {
      const response = (await client.createPlatformGymOwner(data)) as AuthResponse;
      setBanner("success", "Gym and owner created successfully.");
      if (response.gym?.slug) {
        state.publicSlug = response.gym.slug;
        localStorage.setItem(PUBLIC_SLUG_STORAGE_KEY, state.publicSlug);
      }
      await refreshPlatformGymDirectory();
      if (state.publicSlug) {
        await refreshPublic(state.publicSlug, false);
      }
      await refreshDashboard({ silent: true });
    } catch (error) {
      setBanner("error", describeError(error));
      render();
    }
  });

  app.querySelectorAll<HTMLButtonElement>("[data-platform-gym-archive]").forEach((button) => {
    button.addEventListener("click", async () => {
      const gymId = button.dataset.platformGymArchive;
      const gym = state.platformGyms.find((candidate) => candidate.id === gymId);
      if (!gymId || !gym) return;
      if (!window.confirm(`Remove ${gym.name} from the platform gym list? This archives the gym but keeps its records.`)) {
        return;
      }
      try {
        await client.archivePlatformGym(gymId);
        setBanner("success", `${gym.name} was removed from the active gym list.`);
        await refreshPlatformGymDirectory();
        render();
      } catch (error) {
        setBanner("error", describeError(error));
        render();
      }
    });
  });

  bindForm("register-form", async (form) => {
    const data = await registerInputFromForm(form, { requireGymName: true });
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
    await refreshDashboard({ silent: true });
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
    await refreshDashboard({ silent: true });
    if (isPlatformAdminRoute()) {
      await refreshPlatformGymDirectory();
      render();
    }
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
    await refreshDashboard({ silent: true });
  });

  bindForm("studio-settings-form", async (form) => {
    if (!state.gym) {
      return;
    }
    if (!hasPermission(Permission.GymUpdate)) {
      throw new Error("Gym update permission is required to save studio settings.");
    }
    const updatedGym = (await client.updateGym(state.gym.id, studioSettingsUpdateFromForm(form))) as GymRecord;
    state.gym = updatedGym;
    setBanner("success", "Studio setup settings saved.");
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
      autoRenew: true,
      isPublic: true
    });
    setBanner("success", "Public plan created.");
    await refreshDashboard({ silent: true });
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
    await refreshDashboard({ silent: true });
    navigateDashboardView(state.dashboardView === "locations" ? "locations" : "settings", { preserveContext: true });
  });

  bindForm("create-resource-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const name = data.name.trim();
    const resourceType = data.resourceType.trim();
    const locationId = data.locationId || state.selectedLocationId || state.locations[0]?.id;
    const amountCents = Number.parseInt(data.amountCents || "0", 10);
    if (!name || !resourceType || !locationId) {
      throw new Error("Resource name, type, and location are required.");
    }
    if (!Number.isFinite(amountCents) || amountCents < 0) {
      throw new Error("Resource price must be zero or greater.");
    }
    await client.createResource(state.gym.id, {
      locationId,
      name,
      resourceType,
      pricing: { amountCents },
      paymentRequirement:
        amountCents > 0 ? ReservationPaymentRequirement.PayLater : ReservationPaymentRequirement.Free
    });
    setBanner("success", "Resource created.");
    await refreshDashboard();
    navigateDashboardView("locations", { preserveContext: true });
  });

  bindForm("create-resource-reservation-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const input = createResourceReservationSubmission({
      resourceId: data.resourceId,
      memberId: data.memberId,
      startsAtLocal: data.startsAt,
      endsAtLocal: data.endsAt,
      note: data.note,
      overrideConflict: data.overrideConflict === "true",
      overrideReason: data.overrideReason
    });
    const reservation = (await client.createFacilityReservation(
      state.gym.id,
      input
    )) as FacilityReservationRecord;
    state.selectedReservationAgendaItemId = `facility:${reservation.id}`;
    setBanner("success", "Resource reservation created.");
    await refreshDashboard(false);
    navigateDashboardView("bookings", { preserveContext: true });
  });

  bindForm("cancel-resource-reservation-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const reservationId = data.reservationId;
    if (!reservationId) {
      throw new Error("Reservation is required.");
    }
    await client.cancelFacilityReservation(
      state.gym.id,
      reservationId,
      createResourceReservationCancelSubmission({ reason: data.reason })
    );
    state.selectedReservationAgendaItemId = `facility:${reservationId}`;
    setBanner("success", "Resource reservation cancelled.");
    await refreshDashboard(false);
    navigateDashboardView("bookings", { preserveContext: true });
  });

  bindForm("allocate-class-resource-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const sessionId = data.sessionId;
    if (!sessionId) {
      throw new Error("Class session is required.");
    }
    const input = createClassResourceAllocationSubmission({
      resourceId: data.resourceId,
      startsAtLocal: data.startsAt,
      endsAtLocal: data.endsAt,
      overrideConflict: data.overrideConflict === "true",
      overrideReason: data.overrideReason
    });
    await client.allocateClassSessionResource(state.gym.id, sessionId, input);
    state.selectedClassSessionId = sessionId;
    state.selectedReservationAgendaItemId = `class:${sessionId}`;
    setBanner("success", "Class resource allocated.");
    await refreshSelectedClassBookings();
    render();
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
    await refreshDashboard({ silent: true });
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
    await refreshDashboard({ silent: true });
    navigateDashboardView("access_control", { preserveContext: true });
  });

  bindForm("pos-purchase-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const purchaseInput = buildPosPurchaseInput(data);
    const purchase = state.posStripeConfig?.enabled && state.posStripeConfig.publishableKey
      ? purchaseInput.paymentMethod === StripePaymentMethod.CardReader
        ? await submitStripeTerminalPosPurchase(state.gym.id, purchaseInput)
        : await submitStripePosPurchase(state.gym.id, purchaseInput)
      : await client.createPosPurchase(state.gym.id, purchaseInput);
    const resolvedPurchase = purchase as PosPurchaseResult;
    if ("consumer" in resolvedPurchase && resolvedPurchase.consumer) {
      state.selectedMemberId = resolvedPurchase.consumer.id;
      state.editingMemberId = resolvedPurchase.consumer.id;
      await refreshCreatedConsumerState(state.gym.id, resolvedPurchase.consumer.id);
      navigateDashboardView("customer_profile", { preserveContext: true });
      setBanner(
        "success",
        resolvedPurchase.membership
          ? "Payment collected. Buyer added to the consumer directory and plan assigned."
          : "Payment collected. Buyer added to the consumer directory as a customer."
      );
    } else if (resolvedPurchase.anonymousSale) {
      setBanner("success", `Payment collected for ${resolvedPurchase.buyerName}. This sale was recorded as an anonymous walk-in purchase.`);
    }
    void refreshDashboard({ silent: true });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-pos-terminal-connect]").forEach((button) => {
    button.addEventListener("click", () => {
      void connectSimulatedPosTerminal().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-pos-terminal-disconnect]").forEach((button) => {
    button.addEventListener("click", () => {
      void disconnectPosTerminal().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLSelectElement>('select[name="paymentMethod"]').forEach((select) => {
    select.addEventListener("change", () => {
      void syncPosStripePaymentField();
    });
  });

  bindForm("pos-stripe-setup-form", async (form) => {
    if (!state.gym) {
      return;
    }
    if (!currentPermissions().includes(Permission.GymUpdate)) {
      throw new Error("Gym update permission is required to save a Stripe connected account id.");
    }
    const data = formData(form);
    const stripeAccountId = data.stripeAccountId.trim();
    if (!stripeAccountId) {
      throw new Error("Enter the Stripe connected account id for this gym.");
    }
    await client.updateGym(state.gym.id, { stripeAccountId });
    setBanner("success", "Stripe connected account id saved for this gym.");
    await refreshDashboard({ silent: true });
    navigateDashboardView("pos", { preserveContext: true });
  });

  bindForm("pos-settings-form", async (form) => {
    if (!state.gym) {
      return;
    }
    if (!currentPermissions().includes(Permission.GymUpdate)) {
      throw new Error("Gym update permission is required to save POS rules.");
    }
    const allowAnonymousWalkInPos = form.querySelector<HTMLInputElement>('input[name="allowAnonymousWalkInPos"]')?.checked === true;
    const currentFlags = state.gym.featureFlags ?? [];
    const nextFlags = (allowAnonymousWalkInPos
      ? [...new Set([...currentFlags, FeatureFlag.AnonymousWalkInPos])]
      : currentFlags.filter((flag) => flag !== FeatureFlag.AnonymousWalkInPos)) as FeatureFlag[];
    await client.updateGym(state.gym.id, { featureFlags: nextFlags });
    setBanner("success", allowAnonymousWalkInPos ? "Anonymous walk-in POS sales enabled." : "Anonymous walk-in POS sales disabled.");
    await refreshDashboard(false);
    navigateSettingsSection("featured_items");
  });

  app.querySelectorAll<HTMLButtonElement>("[data-pos-stripe-connect]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym) {
          return;
        }
        if (!currentPermissions().includes(Permission.GymUpdate)) {
          throw new Error("Gym update permission is required to start Stripe onboarding.");
        }
        await launchStripeConnectOnboarding(state.gym.id);
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-pos-stripe-embed-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      state.stripeConnectEmbeddedOpen = !state.stripeConnectEmbeddedOpen;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-pos-stripe-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const stripeAccountId = state.gym?.stripeAccountId;
      if (!stripeAccountId) {
        return;
      }
      try {
        await navigator.clipboard.writeText(stripeAccountId);
        setBanner("success", "Stripe connected account id copied.");
      } catch {
        setBanner("error", "Could not copy the Stripe connected account id from this browser.");
      }
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-pos-stripe-disconnect]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym) {
          return;
        }
        if (!currentPermissions().includes(Permission.GymUpdate)) {
          throw new Error("Gym update permission is required to disconnect Stripe.");
        }
        await client.disconnectStripeConnectAccount(state.gym.id);
        setBanner("success", "Stripe connected account removed from this gym.");
        await refreshDashboard(false);
        navigateDashboardView("pos", { preserveContext: true });
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  bindForm("create-member-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const data = formData(form);
    const createKind = data.createKind || "member";
    const email = data.email || undefined;
    const phone = data.phone || undefined;
    const uploadedProfileImageUrl = await uploadProfileImageFromForm(state.gym.id, form);
    const profileImageUrl = uploadedProfileImageUrl ?? (data.profileImageUrl || undefined);
    const planId = data.planId || undefined;
    if (createKind === "member") {
      assertRecurringMembershipRequirements({ email, phone }, "before creating a member.");
      if (!planId || !recurringMembershipPlanById(planId)) {
        throw new Error("Choose a recurring monthly or yearly plan to create a member.");
      }
    }
    const created = (await client.createConsumer(state.gym.id, {
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      phone,
      status: createKind === "lead" ? MemberStatus.Lead : MemberStatus.Active,
      profileImageUrl,
      tagNames: []
    })) as MemberRecord;
    let membershipError: unknown;
    if (createKind === "member" && planId) {
      try {
        await client.assignConsumerMembership(state.gym.id, created.id, {
          planId,
          status: (data.membershipStatus as MembershipStatus) || MembershipStatus.Active
        });
      } catch (error) {
        membershipError = error;
      }
    }
    state.selectedMemberId = created.id;
    state.editingMemberId = created.id;
    await refreshCreatedConsumerState(state.gym.id, created.id);
    navigateDashboardView("customer_profile", { preserveContext: true });
    if (membershipError) {
      throw new Error(`Consumer created, but the recurring membership could not be assigned. ${describeError(membershipError)}`);
    }
    setBanner(
      "success",
      createKind === "lead"
        ? "Lead created."
        : createKind === "member"
          ? "Member created."
          : "Consumer created."
    );
    void refreshDashboard({ silent: true });
  });

  const campaignImportTypeSelect = app.querySelector<HTMLSelectElement>("[data-campaign-import-type]");
  campaignImportTypeSelect?.addEventListener("change", () => {
    const nextType = campaignImportTypeFromValue(campaignImportTypeSelect.value);
    state.campaignImportType = nextType;
    state.campaignImportUpload = undefined;
    state.campaignImportPreview = undefined;
    state.campaignImportSummary = undefined;
    render();
  });

  bindForm("campaign-csv-preview-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const upload = await campaignCsvUploadFromForm(form);
    state.campaignImportType = upload.importType;
    const preview = (await client.previewCampaignCsvImport(state.gym.id, upload)) as CampaignCsvPreviewResponse;
    state.campaignImportUpload = upload;
    state.campaignImportPreview = preview;
    state.campaignImportSummary = undefined;
    setBanner("success", "CSV preview ready. Review the suggested column mappings.");
    render();
  });

  bindForm("campaign-csv-confirm-form", async () => {
    if (!state.gym || !state.campaignImportUpload || !state.campaignImportPreview) {
      throw new Error("Preview a campaign CSV before confirming the import.");
    }
    const mappings = Array.from(app.querySelectorAll<HTMLSelectElement>("[data-campaign-mapping]")).map((select) => ({
      sourceColumn: select.dataset.sourceColumn ?? "",
      targetField: select.value
    }));
    const response = (await client.confirmCampaignCsvImport(state.gym.id, {
      ...state.campaignImportUpload,
      importType: state.campaignImportPreview.importType,
      mappings
    })) as CampaignImportConfirmResponse;
    state.campaignImportSummary = response.summary;
    state.campaignImports = [
      response.batch,
      ...state.campaignImports.filter((batch) => batch.id !== response.batch.id)
    ];
    setBanner("success", `${response.summary.rowsImported} rows imported into the campaign layer.`);
    render();
  });

  bindForm("campaign-utilization-filter-form", async (form) => {
    const formData = new FormData(form);
    state.campaignUtilizationFrom = String(formData.get("from") ?? state.campaignUtilizationFrom);
    state.campaignUtilizationTo = String(formData.get("to") ?? state.campaignUtilizationTo);
    state.campaignUtilizationResourceType = String(formData.get("resourceType") ?? "");
    state.campaignUtilizationServiceCategory = String(formData.get("serviceCategory") ?? "");
    await refreshDashboard({ silent: true });
    setBanner("success", "Room and device utilization refreshed.");
    render();
  });

  bindForm("campaign-generator-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const formData = new FormData(form);
    const campaignType = campaignGeneratorTypeFromValue(String(formData.get("campaignType") ?? ""));
    state.campaignGeneratorType = campaignType;
    const response = (await client.generateCampaign(state.gym.id, {
      campaignType
    })) as GeneratedCampaignResponse;
    state.generatedCampaigns = [
      response.campaign,
      ...state.generatedCampaigns.filter((campaign) => campaign.id !== response.campaign.id)
    ];
    setBanner("success", `${response.campaign.name} campaign generated and saved as a draft.`);
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-campaign-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const campaign = state.generatedCampaigns.find((item) => item.id === button.dataset.campaignCopy);
      const copyType = button.dataset.copyType === "email" ? "email" : "sms";
      if (!campaign) {
        return;
      }
      await copyText(campaignCopyText(campaign, copyType));
      setBanner("success", `${copyType === "email" ? "Email" : "SMS"} copy placed on clipboard.`);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-weekly-copy-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = state.weeklyRevenuePlan?.actions.find((item) => item.id === button.dataset.weeklyCopyAction);
      if (!action?.campaign) {
        return;
      }
      await copyText(weeklyCampaignCopyText(action.campaign));
      setBanner("success", "Weekly campaign text placed on clipboard.");
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-weekly-action-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) {
        return;
      }
      const actionId = button.dataset.weeklyActionId;
      if (!actionId) {
        return;
      }
      const response = (await client.updateWeeklyRevenuePlanAction(state.gym.id, actionId, {
        done: button.dataset.weeklyActionDone === "true"
      })) as WeeklyRevenuePlanResponse;
      state.weeklyRevenuePlan = response.plan;
      setBanner("success", "Weekly action updated.");
      render();
    });
  });

  bindForm("roi-tracking-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const response = (await client.createRoiTrackingEntry(
      state.gym.id,
      roiInputFromForm(form)
    )) as RoiTrackingCreateResponse;
    state.roiTrackingEntries = [
      response.entry,
      ...state.roiTrackingEntries.filter((entry) => entry.id !== response.entry.id)
    ];
    state.roiTrackingSummary = response.summary;
    setBanner("success", "ROI result saved.");
    render();
  });

  bindForm("premium-program-builder-form", async (form) => {
    if (!state.gym) {
      return;
    }
    const response = (await client.createPremiumRecoveryProgram(
      state.gym.id,
      premiumRecoveryProgramInputFromForm(form)
    )) as PremiumRecoveryProgramResponse;
    state.premiumRecoveryPrograms = [
      response.program,
      ...state.premiumRecoveryPrograms.filter((program) => program.id !== response.program.id)
    ];
    setBanner("success", `${response.program.title} saved as a premium recovery program.`);
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-save-program-suggestion]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.gym) {
        return;
      }
      const index = Number(button.dataset.saveProgramSuggestion ?? "-1");
      const suggestion = state.premiumRecoveryProgramSuggestions[index];
      if (!suggestion) {
        return;
      }
      const response = (await client.createPremiumRecoveryProgram(
        state.gym.id,
        suggestion
      )) as PremiumRecoveryProgramResponse;
      state.premiumRecoveryPrograms = [
        response.program,
        ...state.premiumRecoveryPrograms.filter((program) => program.id !== response.program.id)
      ];
      setBanner("success", `${response.program.title} saved.`);
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-campaign-client-segment]").forEach((button) => {
    button.addEventListener("click", () => {
      const segment = button.dataset.campaignClientSegment as CampaignClientSegmentKey | undefined;
      if (!segment) {
        return;
      }
      state.selectedCampaignClientSegment = segment;
      render();
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-utilization-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const resourceName = button.dataset.resourceName ?? "this resource";
      const action = button.dataset.utilizationAction;
      if (action === "bookings") {
        setBanner("info", `Showing bookings so you can inspect demand around ${resourceName}.`);
        navigateDashboardView("bookings", { preserveContext: true });
        return;
      }
      if (action === "program") {
        state.campaignLayerPage = "programs";
        setBanner("info", `Premium program ideas are ready for ${resourceName}.`);
        navigateDashboardView("campaign_layer", { preserveContext: true });
        return;
      }
      setBanner("success", `Off-peak campaign idea generated for ${resourceName}.`);
      render();
    });
  });

  bindForm("migration-create-batch-form", async () => {
    if (!state.gym) {
      return;
    }
    const batch = (await client.createMigrationBatch(state.gym.id, {})) as MigrationBatchRecord;
    state.selectedMigrationBatchId = batch.id;
    state.migrationAssistantStep = "upload";
    setBanner("success", "Migration batch created.");
    await refreshDashboard({ silent: true });
    render();
  });

  bindForm("migration-file-upload-form", async (form) => {
    if (!state.gym || !state.selectedMigrationBatchId) {
      throw new Error("Create a migration batch before uploading files.");
    }
    const input = form.querySelector<HTMLInputElement>('input[name="migrationFiles"]');
    const files = Array.from(input?.files ?? []);
    if (files.length === 0) {
      throw new Error("Choose at least one CSV or XLSX file.");
    }
    for (const file of files) {
      const upload = await migrationUploadPayloadFromFile(file);
      await client.uploadMigrationFile(state.gym.id, state.selectedMigrationBatchId, upload);
    }
    setBanner("success", `${files.length} migration file${files.length === 1 ? "" : "s"} uploaded.`);
    await refreshDashboard({ silent: true });
    render();
  });

  const migrationBatchSelect = app.querySelector<HTMLSelectElement>("[data-migration-batch-select]");
  if (migrationBatchSelect) {
    migrationBatchSelect.addEventListener("change", () => {
      state.selectedMigrationBatchId = migrationBatchSelect.value;
      state.migrationAssistantStep = "upload";
      state.migrationColumnMappings = {};
      state.migrationMappingIssues = {};
      state.migrationMappingTargetFields = {};
      state.migrationStagedMembers = {};
      state.migrationValidationErrors = {};
      void refreshDashboard({ silent: true }).then(render).catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  }

  app.querySelectorAll<HTMLButtonElement>("[data-migration-step]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        const step = button.dataset.migrationStep;
        if (step === "upload" || step === "detect" || step === "map" || step === "stage") {
          state.migrationAssistantStep = step;
          if (step === "map" && state.selectedMigrationBatchId) {
            await loadMigrationColumnMappings(state.selectedMigrationBatchId);
          }
          if (step === "stage" && state.selectedMigrationBatchId) {
            await loadMigrationColumnMappings(state.selectedMigrationBatchId);
            await loadMigrationStagedMembers(state.selectedMigrationBatchId);
          }
          render();
        }
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-migration-delete-file]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const fileId = button.dataset.migrationDeleteFile;
        if (!fileId) {
          return;
        }
        await client.deleteMigrationFile(state.gym.id, state.selectedMigrationBatchId, fileId);
        setBanner("success", "Migration file deleted.");
        await refreshDashboard({ silent: true });
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-migration-detect-file]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const fileId = button.dataset.migrationDetectFile;
        if (!fileId) {
          return;
        }
        await client.detectMigrationFileType(state.gym.id, state.selectedMigrationBatchId, fileId);
        setBanner("success", "File type detection completed.");
        await refreshDashboard({ silent: true });
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  const detectAllButton = app.querySelector<HTMLButtonElement>("[data-migration-detect-all]");
  if (detectAllButton) {
    detectAllButton.addEventListener("click", () => {
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        await client.detectMigrationBatchFileTypes(state.gym.id, state.selectedMigrationBatchId);
        setBanner("success", "AI file type detection completed for uploaded files.");
        await refreshDashboard({ silent: true });
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  }

  app.querySelectorAll<HTMLSelectElement>('select[name^="migrationFileType_"]').forEach((select) => {
    select.addEventListener("change", () => {
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const fileId = select.name.replace("migrationFileType_", "");
        await client.updateMigrationFileType(state.gym.id, state.selectedMigrationBatchId, fileId, {
          fileType: select.value as MigrationFileType
        });
        setBanner("success", "File type updated.");
        await refreshDashboard({ silent: true });
        state.migrationAssistantStep = "detect";
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-migration-map-file]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const fileId = button.dataset.migrationMapFile;
        if (!fileId) {
          return;
        }
        const response = (await client.detectMigrationColumnMappings(
          state.gym.id,
          state.selectedMigrationBatchId,
          fileId
        )) as MigrationColumnMappingResponse;
        state.migrationColumnMappings[fileId] = response.mappings;
        state.migrationMappingIssues[fileId] = response.issues;
        state.migrationMappingTargetFields[fileId] = response.targetFields;
        setBanner("success", "AI column mapping completed.");
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  const mapAllButton = app.querySelector<HTMLButtonElement>("[data-migration-map-all]");
  if (mapAllButton) {
    mapAllButton.addEventListener("click", () => {
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const response = (await client.detectMigrationBatchColumnMappings(
          state.gym.id,
          state.selectedMigrationBatchId
        )) as { files: MigrationColumnMappingResponse[] };
        response.files.forEach((mappingResponse) => {
          state.migrationColumnMappings[mappingResponse.file.id] = mappingResponse.mappings;
          state.migrationMappingIssues[mappingResponse.file.id] = mappingResponse.issues;
          state.migrationMappingTargetFields[mappingResponse.file.id] = mappingResponse.targetFields;
        });
        setBanner("success", "AI column mapping completed for confirmed files.");
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  }

  app.querySelectorAll<HTMLFormElement>("[data-migration-mapping-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const fileId = form.dataset.migrationMappingForm;
        const file = state.migrationFiles.find((candidate) => candidate.id === fileId);
        if (!fileId || !file) {
          return;
        }
        const submitter = event instanceof SubmitEvent && event.submitter instanceof HTMLElement
          ? event.submitter
          : undefined;
        const approve = submitter?.getAttribute("value") === "approve";
        const formValues = new FormData(form);
        const mappings = file.columnHeaders.map((sourceColumn) => ({
          sourceColumn,
          targetField: String(formValues.get(`targetField_${sourceColumn}`) ?? "ignore")
        }));
        const response = (await client.updateMigrationColumnMappings(
          state.gym.id,
          state.selectedMigrationBatchId,
          fileId,
          { mappings, approve }
        )) as MigrationColumnMappingResponse;
        state.migrationColumnMappings[fileId] = response.mappings;
        state.migrationMappingIssues[fileId] = response.issues;
        state.migrationMappingTargetFields[fileId] = response.targetFields;
        setBanner("success", approve ? "Column mappings approved." : "Column mappings saved.");
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-migration-staged-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.migrationStagedFilter;
      if (filter === "all" || filter === "ready" || filter === "warnings" || filter === "critical") {
        state.migrationStagedMemberFilter = filter;
        render();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-migration-stage-file]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const fileId = button.dataset.migrationStageFile;
        if (!fileId) {
          return;
        }
        const response = (await client.stageMigrationMembers(
          state.gym.id,
          state.selectedMigrationBatchId,
          fileId
        )) as MigrationStagedMembersResponse;
        state.migrationStagedMembers[fileId] = response.stagedMembers;
        state.migrationValidationErrors[fileId] = response.validationErrors;
        setBanner("success", `Staged ${response.summary.total} member records.`);
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-migration-bulk-approve-file]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const fileId = button.dataset.migrationBulkApproveFile;
        if (!fileId) {
          return;
        }
        const response = (await client.approveMigrationStagedMembers(
          state.gym.id,
          state.selectedMigrationBatchId,
          fileId,
          {}
        )) as MigrationStagedMembersResponse;
        state.migrationStagedMembers[fileId] = response.stagedMembers;
        state.migrationValidationErrors[fileId] = response.validationErrors;
        setBanner("success", "Ready staged members approved.");
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-migration-approve-staged]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const stagedMemberId = button.dataset.migrationApproveStaged;
        if (!stagedMemberId) {
          return;
        }
        const response = (await client.approveMigrationStagedMember(
          state.gym.id,
          state.selectedMigrationBatchId,
          stagedMemberId
        )) as MigrationStagedMembersResponse;
        state.migrationStagedMembers[response.file.id] = response.stagedMembers;
        state.migrationValidationErrors[response.file.id] = response.validationErrors;
        setBanner("success", "Staged member approved.");
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>("[data-migration-skip-staged]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const stagedMemberId = button.dataset.migrationSkipStaged;
        if (!stagedMemberId) {
          return;
        }
        const response = (await client.skipMigrationStagedMember(
          state.gym.id,
          state.selectedMigrationBatchId,
          stagedMemberId
        )) as MigrationStagedMembersResponse;
        state.migrationStagedMembers[response.file.id] = response.stagedMembers;
        state.migrationValidationErrors[response.file.id] = response.validationErrors;
        setBanner("success", "Staged member skipped.");
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  app.querySelectorAll<HTMLFormElement>("[data-migration-staged-member-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void (async () => {
        if (!state.gym || !state.selectedMigrationBatchId) {
          return;
        }
        const stagedMemberId = form.dataset.migrationStagedMemberForm;
        if (!stagedMemberId) {
          return;
        }
        const data = formData(form);
        const tags = data.tags
          ? data.tags.split(/[,;|]/).map((tag) => tag.trim()).filter(Boolean)
          : [];
        const response = (await client.updateMigrationStagedMember(
          state.gym.id,
          state.selectedMigrationBatchId,
          stagedMemberId,
          {
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            address: data.address,
            emergencyContact: data.emergencyContact,
            membershipStatus: data.membershipStatus,
            membershipPlanName: data.membershipPlanName,
            startDate: data.startDate,
            cancellationDate: data.cancellationDate,
            nextBillingDate: data.nextBillingDate,
            assignedTrainerName: data.assignedTrainerName,
            notes: data.notes,
            tags
          }
        )) as MigrationStagedMembersResponse;
        state.migrationStagedMembers[response.file.id] = response.stagedMembers;
        state.migrationValidationErrors[response.file.id] = response.validationErrors;
        setBanner("success", "Staged member saved and revalidated.");
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  bindForm("member-csv-preview-form", async (form, submitter) => {
    if (!state.gym) {
      return;
    }
    const upload = await memberCsvUploadFromForm(form);
    const useAiMapping = submitter?.getAttribute("name") === "aiMap";
    state.memberCsvAiSuggestion = undefined;
    if (useAiMapping) {
      const aiSuggestion = (await client.suggestMemberCsvAiMapping(
        state.gym.id,
        upload
      )) as MigrationMemberCsvAiMappingResponse;
      state.memberCsvAiSuggestion = aiSuggestion;
      state.memberCsvImport = {
        ...upload,
        mapping: aiSuggestion.mapping
      };
      state.memberCsvPreview = aiSuggestion.preview;
      setBanner(
        aiSuggestion.available ? "success" : "info",
        aiSuggestion.available
          ? `AI mapped this file. ${aiSuggestion.preview.summary.validRows} of ${aiSuggestion.preview.summary.totalRows} rows can be imported.`
          : `AI mapping was not available, so the built-in mapper previewed ${aiSuggestion.preview.summary.validRows} importable rows.`
      );
      render();
      return;
    }
    state.memberCsvImport = upload;
    state.memberCsvPreview = (await client.previewMemberCsvImport(
      state.gym.id,
      upload
    )) as MigrationMemberCsvPreviewResponse;
    setBanner(
      "info",
      `Preview ready: ${state.memberCsvPreview.summary.validRows} of ${state.memberCsvPreview.summary.totalRows} rows can be imported.`
    );
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-member-csv-saved-upload]").forEach((button) => {
    button.addEventListener("click", () => {
      void (async () => {
        if (!state.gym) {
          return;
        }
        const uploadIndex = Number.parseInt(button.dataset.memberCsvSavedUpload ?? "", 10);
        const upload = migrationMemberListCsvUploads()[uploadIndex];
        if (!upload) {
          throw new Error("Saved migration upload was not found.");
        }
        state.memberCsvImport = {
          fileName: upload.fileName,
          contentType: upload.contentType,
          base64Data: upload.base64Data,
          delimiter: "auto"
        };
        state.memberCsvAiSuggestion = undefined;
        state.memberCsvPreview = (await client.previewMemberCsvImport(
          state.gym.id,
          state.memberCsvImport
        )) as MigrationMemberCsvPreviewResponse;
        setBanner(
          "info",
          `Preview ready from saved checklist file: ${state.memberCsvPreview.summary.validRows} of ${state.memberCsvPreview.summary.totalRows} rows can be imported.`
        );
        render();
      })().catch((error) => {
        setBanner("error", describeError(error));
        render();
      });
    });
  });

  bindForm("member-csv-import-form", async () => {
    if (!state.gym || !state.memberCsvImport) {
      throw new Error("Preview a CSV before importing it.");
    }
    const result = (await client.importMemberCsv(
      state.gym.id,
      state.memberCsvImport
    )) as MigrationMemberCsvPreviewResponse;
    state.memberCsvPreview = result;
    state.memberCsvImport = undefined;
    await refreshDashboard({ silent: true });
    setBanner(
      "success",
      `Imported ${result.summary.importedRows ?? 0} consumers. ${result.summary.skippedRows} rows were skipped.`
    );
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
      await refreshDashboard({ silent: true });
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

function renderBannerMarkup(tone: BannerTone, text: string, className = "") {
  return `<div class="banner ${tone}${className ? ` ${className}` : ""}">${escapeHtml(text)}</div>`;
}

function applyStaffAccessFilters() {
  const searchInput = app.querySelector<HTMLInputElement>("[data-staff-access-search]");
  const roleSelect = app.querySelector<HTMLSelectElement>("[data-staff-access-role-filter]");
  const query = searchInput?.value.trim().toLowerCase() ?? "";
  const roleFilter = roleSelect?.value ?? "";
  state.staffAccessSearch = searchInput?.value ?? "";
  state.staffAccessRoleFilter = roleFilter;

  let visibleCount = 0;
  let totalCount = 0;
  const visibleSectionCounts = new Map<string, number>();
  app.querySelectorAll<HTMLElement>("[data-staff-access-row]").forEach((row) => {
    totalCount += 1;
    const rowText = row.dataset.staffFilterText ?? "";
    const rowRoleId = row.dataset.staffRoleId ?? "";
    const rowSection = row.dataset.staffAccessSection ?? "";
    const matchesSearch = !query || rowText.includes(query);
    const matchesRole = !roleFilter || rowRoleId === roleFilter;
    const visible = matchesSearch && matchesRole;
    row.hidden = !visible;
    if (visible) {
      visibleCount += 1;
      visibleSectionCounts.set(rowSection, (visibleSectionCounts.get(rowSection) ?? 0) + 1);
    }
  });

  app.querySelectorAll<HTMLElement>("[data-staff-access-section-heading]").forEach((heading) => {
    const section = heading.dataset.staffAccessSectionHeading ?? "";
    const sectionCount = visibleSectionCounts.get(section) ?? 0;
    heading.hidden = sectionCount === 0;
    const counter = heading.querySelector("small");
    if (counter) {
      counter.textContent = `${sectionCount} ${sectionCount === 1 ? "person" : "people"}`;
    }
  });

  const count = app.querySelector<HTMLElement>("[data-staff-access-filter-count]");
  if (count) {
    count.textContent = `${visibleCount} of ${totalCount} staff`;
  }
  const empty = app.querySelector<HTMLElement>("[data-staff-access-empty]");
  if (empty) {
    empty.hidden = visibleCount > 0 || totalCount === 0;
  }
}

function applyStaffRolePreset(select: HTMLSelectElement) {
  const templates = staffRoleTemplateOptions();
  const preset = templates.find((option) => option.key === select.value) ?? templates[0];
  const form = select.closest<HTMLFormElement>("form");
  if (!form || !preset) {
    return;
  }
  const nameInput = form.querySelector<HTMLInputElement>('input[name="staffRoleName"]');
  if (nameInput) {
    nameInput.value = preset.defaultName;
  }
  const description = form.querySelector<HTMLElement>("[data-staff-role-preset-description]");
  if (description) {
    description.textContent = preset.description;
  }
  form.querySelectorAll<HTMLInputElement>('input[name="permissions"]').forEach((input) => {
    const checked = preset.permissions.includes(input.value as Permission);
    input.checked = checked;
    input.closest(".permission-chip")?.classList.toggle("active", checked);
  });
}

function startStaffClockTimers() {
  if (staffClockTimerInterval) {
    window.clearInterval(staffClockTimerInterval);
    staffClockTimerInterval = undefined;
  }
  updateStaffClockTimers();
  if (app.querySelector("[data-staff-clock-timer]")) {
    staffClockTimerInterval = window.setInterval(updateStaffClockTimers, 1000);
  }
}

function updateStaffClockTimers() {
  app.querySelectorAll<HTMLElement>("[data-staff-clock-timer]").forEach((timer) => {
    const clockedInAt = timer.dataset.clockedInAt;
    if (clockedInAt) {
      timer.textContent = formatElapsedSince(clockedInAt);
    }
  });
}

function bindForm(id: string, handler: (form: HTMLFormElement, submitter?: HTMLElement) => Promise<void>) {
  const form = app.querySelector<HTMLFormElement>(`#${id}`);
  if (!form) {
    return;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const submitter = event instanceof SubmitEvent && event.submitter instanceof HTMLElement
        ? event.submitter
        : undefined;
      await handler(form, submitter);
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

function schedulerDaysFromForm(form: HTMLFormElement) {
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[name="daysOfWeek"]:checked'))
    .map((input) => Number(input.value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
}

function renderInput(name: string, label: string, type = "text", value = "", disabled = false) {
  return `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" type="${type}" value="${escapeAttribute(value)}" ${disabled ? "disabled" : ""} />
    </label>
  `;
}

function _renderFileInput(name: string, label: string, accept = "image/*") {
  return `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" type="file" accept="${escapeAttribute(accept)}" />
    </label>
  `;
}

function renderCameraCaptureInput(
  formId: string,
  name: string,
  label: string,
  existingImageUrl?: string
) {
  const pendingPhoto = getPendingCameraPhoto(formId, name);
  const previewUrl = pendingPhoto?.previewUrl ?? existingImageUrl;
  const status = pendingPhoto
    ? "New photo captured and ready to save"
    : existingImageUrl
      ? "Existing photo on file"
      : "No photo captured yet";
  return `
    <label class="field">
      <span>${label}</span>
      <div class="camera-capture-control">
        <div class="camera-capture-actions">
          <button
            type="button"
            class="module-nav-button"
            data-camera-capture-open="${name}"
            data-camera-capture-form-id="${formId}"
            data-camera-capture-label="${escapeAttribute(label)}"
          >
            ${pendingPhoto || existingImageUrl ? "Retake picture" : "Take picture"}
          </button>
          <button
            type="button"
            class="ghost-button"
            data-photo-picker-open="${formId}-${name}"
          >
            Choose from files
          </button>
        </div>
        <span class="camera-capture-status">${status}</span>
      </div>
      <input
        id="${formId}-${name}"
        class="camera-capture-input"
        name="${name}"
        type="file"
        accept="image/*"
        data-photo-picker-input="${name}"
        data-photo-picker-form-id="${formId}"
      />
      ${previewUrl
        ? `<div class="camera-capture-preview"><img src="${escapeAttribute(previewUrl)}" alt="${escapeAttribute(label)} preview" /></div>`
        : ""}
    </label>
  `;
}

function renderSelect(
  name: string,
  label: string,
  options: Array<{ value: string; label: string }>,
  selectedValue: string,
  disabled = false
) {
  return `
    <label class="field">
      <span>${label}</span>
      <select name="${name}" ${disabled ? "disabled" : ""}>
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

async function uploadProfileImageFromForm(gymId: string, form: HTMLFormElement, consumerId?: string) {
  const pendingPhoto = getPendingCameraPhoto(form.id, "profileImageFile")?.file;
  const formFile = new FormData(form).get("profileImageFile");
  const file = pendingPhoto ?? (formFile instanceof File && formFile.size > 0 ? formFile : undefined);
  if (!file) {
    return undefined;
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Profile photos must be image files.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Profile photos must be 5 MB or smaller.");
  }
  const upload = (await client.uploadConsumerProfileImage(gymId, {
    consumerId,
    fileName: file.name || "profile-image",
    contentType: file.type || "image/jpeg",
    base64Data: arrayBufferToBase64(await file.arrayBuffer())
  })) as { url: string };
  clearPendingCameraPhoto(form.id, "profileImageFile");
  return upload.url;
}

async function memberCsvUploadFromForm(form: HTMLFormElement): Promise<MigrationMemberCsvUpload> {
  const fileInput = form.querySelector<HTMLInputElement>('input[name="memberCsvFile"]');
  const file = fileInput?.files?.[0];
  if (!file) {
    throw new Error("Choose a CSV or TSV file to preview.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("CSV imports must be 5 MB or smaller.");
  }
  if (!isCsvLikeMigrationFile(file.name, file.type)) {
    throw new Error("This importer reads CSV, TSV, or plain text files. Export spreadsheets to CSV first.");
  }
  const data = formData(form);
  const delimiter = data.delimiter === "comma" || data.delimiter === "tab" ? data.delimiter : "auto";
  return {
    fileName: file.name || "member-list.csv",
    contentType: file.type || migrationContentTypeFromName(file.name),
    base64Data: arrayBufferToBase64(await file.arrayBuffer()),
    delimiter
  };
}

async function campaignCsvUploadFromForm(form: HTMLFormElement): Promise<CampaignCsvUpload> {
  const fileInput = form.querySelector<HTMLInputElement>('input[name="campaignCsvFile"]');
  const file = fileInput?.files?.[0];
  if (!file) {
    throw new Error("Choose a CSV file to preview.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Campaign imports must be 10 MB or smaller.");
  }
  if (!isCsvLikeMigrationFile(file.name, file.type)) {
    throw new Error("Campaign imports read CSV or TSV files. Export spreadsheets to CSV first.");
  }
  const data = formData(form);
  const importType = campaignImportTypeFromValue(data.importType);
  const delimiter = data.delimiter === "comma" || data.delimiter === "tab" ? data.delimiter : "auto";
  return {
    importType,
    fileName: file.name || `${importType}.csv`,
    contentType: file.type || migrationContentTypeFromName(file.name),
    base64Data: arrayBufferToBase64(await file.arrayBuffer()),
    delimiter
  };
}

async function migrationUploadPayloadFromFile(file: File) {
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".xlsx")) {
    throw new Error(`${file.name} is not supported. Upload CSV or XLSX files only.`);
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`${file.name} is too large. Migration files must be 10 MB or smaller.`);
  }
  return {
    fileName: file.name,
    contentType: file.type || migrationContentTypeFromName(file.name),
    base64Data: arrayBufferToBase64(await file.arrayBuffer())
  };
}

function migrationMemberListCsvUploads() {
  return (state.gym?.migrationChecklist?.details?.memberList?.uploads ?? []).filter((upload) =>
    isCsvLikeMigrationFile(upload.fileName, upload.contentType)
  );
}

function isCsvLikeMigrationFile(fileName: string, contentType?: string) {
  const lowerName = fileName.toLowerCase();
  const lowerType = (contentType ?? "").toLowerCase();
  return (
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".tsv") ||
    lowerName.endsWith(".txt") ||
    lowerType.includes("csv") ||
    lowerType.includes("tab-separated") ||
    lowerType.includes("text/plain")
  );
}

async function syncCameraCaptureModal() {
  if (!state.cameraCapture) {
    stopCameraStream();
    return;
  }
  if (cameraStartPromise) {
    return;
  }
  const sessionKey = cameraCaptureKey(state.cameraCapture.formId, state.cameraCapture.inputName);
  const video = app.querySelector<HTMLVideoElement>("[data-camera-capture-video]");
  if (!video) {
    return;
  }
  if (activeCameraStream && activeCameraSessionKey === sessionKey) {
    if (video.srcObject !== activeCameraStream) {
      video.srcObject = activeCameraStream;
      await video.play().catch(() => undefined);
    }
    return;
  }
  cameraStartPromise = (async () => {
    try {
      stopCameraStream();
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This device or browser does not expose a usable camera API.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      });
      activeCameraStream = stream;
      activeCameraSessionKey = sessionKey;
      const activeVideo = app.querySelector<HTMLVideoElement>("[data-camera-capture-video]");
      if (!activeVideo || !state.cameraCapture || cameraCaptureKey(state.cameraCapture.formId, state.cameraCapture.inputName) !== sessionKey) {
        stopCameraStream();
        return;
      }
      activeVideo.srcObject = stream;
      await activeVideo.play().catch(() => undefined);
    } catch (error) {
      if (state.cameraCapture && cameraCaptureKey(state.cameraCapture.formId, state.cameraCapture.inputName) === sessionKey) {
        state.cameraCapture = {
          ...state.cameraCapture,
          error: describeError(error)
        };
        render();
      }
    } finally {
      cameraStartPromise = undefined;
    }
  })();
  await cameraStartPromise;
}

async function syncPosStripePaymentField() {
  const mount = app.querySelector<HTMLDivElement>("[data-pos-stripe-card]");
  const paymentMethod = app.querySelector<HTMLSelectElement>('select[name="paymentMethod"]')?.value as StripePaymentMethod | undefined;
  const keyedField = app.querySelector<HTMLElement>("[data-pos-keyed-card-field]");
  const keyedNote = app.querySelector<HTMLElement>("[data-pos-keyed-note]");
  const terminalPanel = app.querySelector<HTMLElement>("[data-pos-terminal-panel]");
  const useTerminal = paymentMethod === StripePaymentMethod.CardReader;
  if (keyedField) {
    keyedField.hidden = useTerminal;
  }
  if (keyedNote) {
    keyedNote.hidden = useTerminal;
  }
  if (terminalPanel) {
    terminalPanel.hidden = !useTerminal;
  }
  syncPosTerminalUi();
  if (useTerminal || !mount || !state.posStripeConfig?.publishableKey) {
    if (stripeCardElement) {
      stripeCardElement.unmount();
    }
    return;
  }
  if (!stripePromise || stripePromiseKey !== state.posStripeConfig.publishableKey) {
    stripePromiseKey = state.posStripeConfig.publishableKey;
    stripePromise = loadStripe(state.posStripeConfig.publishableKey);
    stripeElements = undefined;
    stripeCardElement = undefined;
    stripeCardThemeKey = undefined;
  }
  const stripe = await stripePromise;
  if (!stripe) {
    setBanner("error", "Stripe.js could not be initialized in this browser.");
    render();
    return;
  }
  if (mount.childElementCount > 0) {
    const nextThemeKey = buildStripeCardThemeKey();
    if (stripeCardThemeKey === nextThemeKey) {
      return;
    }
    if (stripeCardElement) {
      stripeCardElement.unmount();
      stripeCardElement.destroy();
      stripeCardElement = undefined;
    }
  }
  if (!stripeElements) {
    stripeElements = stripe.elements();
  }
  const nextThemeKey = buildStripeCardThemeKey();
  if (!stripeCardElement) {
    stripeCardElement = stripeElements.create("card", buildStripeCardOptions());
    stripeCardThemeKey = nextThemeKey;
  }
  stripeCardElement.mount(mount);
}

async function ensurePosTerminalInstance() {
  if (!state.gym) {
    throw new Error("Choose a gym before connecting a Stripe reader.");
  }
  if (!stripeTerminalPromise) {
    stripeTerminalPromise = loadStripeTerminal();
  }
  const StripeTerminal = await stripeTerminalPromise;
  if (!StripeTerminal) {
    throw new Error("Stripe Terminal could not be initialized in this browser.");
  }
  if (!stripeTerminalInstance) {
    stripeTerminalInstance = StripeTerminal.create({
      onFetchConnectionToken: async () => {
        const response = (await client.createPosTerminalConnectionToken(state.gym!.id)) as { secret?: string };
        if (!response.secret) {
          throw new Error("Stripe Terminal connection token response was empty.");
        }
        return response.secret;
      },
      onUnexpectedReaderDisconnect: () => {
        state.posTerminalConnectionState = "not_connected";
        state.posTerminalPaymentState = "not_ready";
        state.posTerminalReaderLabel = undefined;
        setBanner("info", "The Stripe Terminal reader disconnected.");
        render();
      },
      onConnectionStatusChange: (status) => {
        state.posTerminalConnectionState = normalizePosTerminalConnectionState(status);
        syncPosTerminalUi();
      },
      onPaymentStatusChange: (status) => {
        state.posTerminalPaymentState = normalizePosTerminalPaymentState(status);
        syncPosTerminalUi();
      }
    });
  }
  return stripeTerminalInstance;
}

function syncPosTerminalUi() {
  const status = app.querySelector<HTMLElement>("[data-pos-terminal-status]");
  const disconnectButton = app.querySelector<HTMLButtonElement>("[data-pos-terminal-disconnect]");
  if (status) {
    status.textContent = formatPosTerminalStatus();
  }
  if (disconnectButton) {
    disconnectButton.disabled = state.posTerminalConnectionState !== "connected";
  }
}

function normalizePosTerminalConnectionState(value: unknown): PosTerminalConnectionState {
  const raw = extractPosTerminalStatus(value);
  if (raw === "connected") {
    return "connected";
  }
  if (raw === "connecting") {
    return "connecting";
  }
  return "not_connected";
}

function normalizePosTerminalPaymentState(value: unknown): PosTerminalPaymentState {
  const raw = extractPosTerminalStatus(value);
  if (raw === "ready" || raw === "waiting_for_input" || raw === "processing") {
    return raw;
  }
  return "not_ready";
}

function extractPosTerminalStatus(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object") {
    const status = "status" in value ? value.status : "connectionStatus" in value ? value.connectionStatus : "paymentStatus" in value ? value.paymentStatus : undefined;
    return typeof status === "string" ? status : "";
  }
  return "";
}

function getPosTerminalError(value: unknown) {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return undefined;
  }
  const error = value.error;
  return error && typeof error === "object" ? error as { message?: string } : undefined;
}

function getPosTerminalDiscoveredReaders(value: unknown) {
  if (!value || typeof value !== "object" || !("discoveredReaders" in value)) {
    return [] as Array<{ label?: string }>;
  }
  return Array.isArray(value.discoveredReaders) ? value.discoveredReaders as Array<{ label?: string }> : [];
}

function getPosTerminalReader(value: unknown) {
  if (!value || typeof value !== "object" || !("reader" in value)) {
    return undefined;
  }
  const reader = value.reader;
  return reader && typeof reader === "object" ? reader as { label?: string } : undefined;
}

function getPosTerminalPaymentIntent(value: unknown) {
  if (!value || typeof value !== "object" || !("paymentIntent" in value)) {
    return undefined;
  }
  const paymentIntent = value.paymentIntent;
  return paymentIntent && typeof paymentIntent === "object" ? paymentIntent as { id?: string } : undefined;
}

function formatPosTerminalStatus() {
  const readerName = state.posTerminalReaderLabel ? `: ${state.posTerminalReaderLabel}` : "";
  switch (state.posTerminalConnectionState) {
    case "connected":
      return state.posTerminalPaymentState === "waiting_for_input"
        ? `Connected${readerName} • waiting for card`
        : state.posTerminalPaymentState === "processing"
          ? `Connected${readerName} • processing`
          : `Connected${readerName}`;
    case "connecting":
      return "Connecting simulated reader";
    default:
      return "Not connected";
  }
}

function posTerminalHelperText() {
  if (state.posTerminalConnectionState === "connected") {
    return "This browser is connected to Stripe's simulated reader on this machine. Submit the sale to run a local Terminal payment flow.";
  }
  if (state.posTerminalConnectionState === "connecting") {
    return "Connecting to Stripe's simulated reader in this browser.";
  }
  return "Connect Stripe's simulated reader in this browser to test Terminal without physical hardware.";
}

async function connectSimulatedPosTerminal() {
  const terminal = await ensurePosTerminalInstance();
  type PosTerminalReader = Parameters<typeof terminal.connectReader>[0];
  state.posTerminalConnectionState = "connecting";
  syncPosTerminalUi();
  const discoverResult = await terminal.discoverReaders({ simulated: true });
  const discoverError = getPosTerminalError(discoverResult);
  if (discoverError) {
    state.posTerminalConnectionState = "not_connected";
    syncPosTerminalUi();
    throw new Error(discoverError.message ?? "Stripe could not discover a simulated reader.");
  }
  const reader = getPosTerminalDiscoveredReaders(discoverResult)[0] as PosTerminalReader | undefined;
  if (!reader) {
    state.posTerminalConnectionState = "not_connected";
    syncPosTerminalUi();
    throw new Error("No simulated Stripe Terminal reader was available.");
  }
  const connectResult = await terminal.connectReader(reader);
  const connectError = getPosTerminalError(connectResult);
  if (connectError) {
    state.posTerminalConnectionState = "not_connected";
    syncPosTerminalUi();
    throw new Error(connectError.message ?? "Stripe could not connect to the simulated reader.");
  }
  state.posTerminalConnectionState = "connected";
  state.posTerminalPaymentState = normalizePosTerminalPaymentState(terminal.getPaymentStatus());
  state.posTerminalReaderLabel = getPosTerminalReader(connectResult)?.label ?? "Simulated reader";
  syncPosTerminalUi();
}

async function disconnectPosTerminal() {
  if (!stripeTerminalInstance) {
    state.posTerminalConnectionState = "not_connected";
    state.posTerminalPaymentState = "not_ready";
    state.posTerminalReaderLabel = undefined;
    syncPosTerminalUi();
    return;
  }
  await stripeTerminalInstance.disconnectReader();
  state.posTerminalConnectionState = "not_connected";
  state.posTerminalPaymentState = "not_ready";
  state.posTerminalReaderLabel = undefined;
  syncPosTerminalUi();
}

async function submitStripePosPurchase(gymId: string, input: PosPurchaseRequest) {
  if (!stripePromise || !stripeCardElement) {
    throw new Error("Stripe card entry is not ready yet. Try again in a moment.");
  }
  const stripe = await stripePromise;
  if (!stripe) {
    throw new Error("Stripe.js failed to initialize.");
  }
  const paymentIntent = (await client.createPosPaymentIntent(gymId, input)) as {
    paymentIntentId: string;
    clientSecret: string;
  };
  const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
    paymentIntent.clientSecret,
    {
      payment_method: {
        card: stripeCardElement,
        billing_details: {
          name: `${input.firstName} ${input.lastName}`.trim(),
          ...(input.email ? { email: input.email } : {}),
          ...(input.phone ? { phone: input.phone } : {})
        }
      }
    }
  );
  if (error) {
    throw new Error(error.message ?? "Stripe payment confirmation failed.");
  }
  const paymentIntentId = confirmedIntent?.id ?? paymentIntent.paymentIntentId;
  return client.finalizePosPaymentIntent(gymId, paymentIntentId);
}

async function submitStripeTerminalPosPurchase(gymId: string, input: PosPurchaseRequest) {
  const terminal = await ensurePosTerminalInstance();
  type PosTerminalPaymentIntent = Parameters<typeof terminal.processPayment>[0];
  if (state.posTerminalConnectionState !== "connected") {
    await connectSimulatedPosTerminal();
  }
  await terminal.setSimulatorConfiguration({
    testCardNumber: "4242424242424242"
  });
  const paymentIntent = (await client.createPosPaymentIntent(gymId, input)) as {
    paymentIntentId: string;
    clientSecret: string;
  };
  const collectResult = await terminal.collectPaymentMethod(paymentIntent.clientSecret);
  const collectError = getPosTerminalError(collectResult);
  if (collectError) {
    throw new Error(collectError.message ?? "Stripe Terminal could not collect a payment method.");
  }
  const collectedPaymentIntent = getPosTerminalPaymentIntent(collectResult) as PosTerminalPaymentIntent | undefined;
  if (!collectedPaymentIntent) {
    throw new Error("Stripe Terminal did not return a collected payment intent.");
  }
  const processResult = await terminal.processPayment(collectedPaymentIntent);
  const processError = getPosTerminalError(processResult);
  if (processError) {
    throw new Error(processError.message ?? "Stripe Terminal could not process the payment.");
  }
  const paymentIntentId = getPosTerminalPaymentIntent(processResult)?.id ?? paymentIntent.paymentIntentId;
  return client.finalizePosPaymentIntent(gymId, paymentIntentId);
}

async function syncStripeConnectEmbed() {
  const onboardingMount = app.querySelector<HTMLDivElement>("[data-stripe-connect-onboarding]");
  const bannerMount = app.querySelector<HTMLDivElement>("[data-stripe-connect-banner]");
  const accountManagementMount = app.querySelector<HTMLDivElement>("[data-stripe-connect-account-management]");
  const balancesMount = app.querySelector<HTMLDivElement>("[data-stripe-connect-balances]");
  const payoutsMount = app.querySelector<HTMLDivElement>("[data-stripe-connect-payouts]");
  const paymentsMount = app.querySelector<HTMLDivElement>("[data-stripe-connect-payments]");
  if (!state.gym || !state.posStripeConfig?.publishableKey || !currentPermissions().includes(Permission.GymUpdate)) {
    return;
  }
  if (!onboardingMount && !bannerMount && !accountManagementMount && !balancesMount && !payoutsMount && !paymentsMount) {
    return;
  }

  const connectKey = `${state.gym.id}:${state.posStripeConfig.publishableKey}`;
  if (!stripeConnectInstance || stripeConnectInstanceKey !== connectKey) {
    stripeConnectInstance = loadConnectAndInitialize({
      publishableKey: state.posStripeConfig.publishableKey,
      fetchClientSecret: async () => {
        const response = (await client.createStripeConnectAccountSession(state.gym!.id)) as StripeConnectSessionRecord;
        const previousSession = state.stripeConnectSession;
        state.stripeConnectSession = response;
        if (JSON.stringify(previousSession?.components) !== JSON.stringify(response.components)) {
          render();
        }
        return response.clientSecret;
      },
      appearance: {
        overlays: "dialog"
      }
    });
    stripeConnectInstanceKey = connectKey;
  }

  if (bannerMount && bannerMount.childElementCount === 0) {
    const notificationBanner = stripeConnectInstance.create("notification-banner");
    notificationBanner.setOnLoadError(({ error }) => {
      setBanner("error", error.message ?? "Stripe could not load the in-app notification banner.");
      render();
    });
    bannerMount.appendChild(notificationBanner);
  }

  if (onboardingMount && onboardingMount.childElementCount === 0) {
    const accountOnboarding = stripeConnectInstance.create("account-onboarding");
    accountOnboarding.setCollectionOptions({
      fields: "eventually_due",
      futureRequirements: "include"
    });
    accountOnboarding.setOnExit(() => {
      void refreshDashboard(false);
    });
    accountOnboarding.setOnLoadError(({ error }) => {
      setBanner("error", error.message ?? "Stripe could not load the in-app onboarding flow.");
      render();
    });
    onboardingMount.appendChild(accountOnboarding);
  }

  if (accountManagementMount && accountManagementMount.childElementCount === 0) {
    const accountManagement = stripeConnectInstance.create("account-management");
    accountManagement.setOnLoadError(({ error }) => {
      setBanner("error", error.message ?? "Stripe could not load account management.");
    });
    accountManagementMount.appendChild(accountManagement);
  }

  if (balancesMount && balancesMount.childElementCount === 0) {
    const balances = stripeConnectInstance.create("balances");
    balances.setOnLoadError(({ error }) => {
      setBanner("error", error.message ?? "Stripe could not load balances.");
    });
    balancesMount.appendChild(balances);
  }

  if (payoutsMount && payoutsMount.childElementCount === 0) {
    const payouts = stripeConnectInstance.create("payouts");
    payouts.setOnLoadError(({ error }) => {
      setBanner("error", error.message ?? "Stripe could not load payouts.");
    });
    payoutsMount.appendChild(payouts);
  }

  if (paymentsMount && paymentsMount.childElementCount === 0) {
    const payments = stripeConnectInstance.create("payments");
    payments.setOnLoadError(({ error }) => {
      setBanner("error", error.message ?? "Stripe could not load payments.");
    });
    paymentsMount.appendChild(payments);
  }
}

function buildStripeCardOptions() {
  const rootStyle = getComputedStyle(document.documentElement);
  const textColor = rootStyle.getPropertyValue("--ink").trim() || "#0f172a";
  const mutedColor = rootStyle.getPropertyValue("--muted").trim() || "#64748b";
  const errorColor = rootStyle.getPropertyValue("--error").trim() || "#dc2626";
  return {
    hidePostalCode: true,
    style: {
      base: {
        color: textColor,
        fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
        fontSize: "16px",
        fontSmoothing: "antialiased",
        iconColor: mutedColor,
        "::placeholder": {
          color: mutedColor
        }
      },
      invalid: {
        color: errorColor,
        iconColor: errorColor
      }
    }
  };
}

function buildStripeCardThemeKey() {
  const rootStyle = getComputedStyle(document.documentElement);
  return [
    state.theme,
    rootStyle.getPropertyValue("--ink").trim(),
    rootStyle.getPropertyValue("--muted").trim(),
    rootStyle.getPropertyValue("--error").trim()
  ].join("|");
}

function buildPosPurchaseInput(data: Record<string, string>) {
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const email = data.email.trim() || undefined;
  const phone = data.phone.trim() || undefined;
  const planId = data.planId || undefined;
  const anonymousWalkInEnabled = state.gym?.featureFlags.includes(FeatureFlag.AnonymousWalkInPos) ?? false;
  if (!firstName || !lastName) {
    throw new Error("Buyer first and last name are required for POS sales.");
  }
  if (!email && !phone && (planId || !anonymousWalkInEnabled)) {
    throw new Error(
      planId
        ? "A customer email or phone number is required before collecting payment when a membership plan is being assigned."
        : anonymousWalkInEnabled
          ? "Enter an email or phone number to attach this sale to a customer record, or leave plan assignment empty to treat it as an anonymous walk-in sale."
          : "Enter at least an email or phone number before collecting payment. This gym currently requires POS sales to attach to a customer record."
    );
  }
  const amountCents = dollarsToCents(data.amount || "0");
  if (amountCents <= 0) {
    throw new Error("Enter an amount greater than $0.00 before collecting payment.");
  }
  if (amountCents > 99_999_999) {
    throw new Error("Stripe POS payments must be less than $1,000,000. Enter $999,999.99 or less.");
  }
  if (planId && recurringMembershipPlanById(planId)) {
    assertRecurringMembershipRequirements({ email, phone }, "before assigning a recurring membership from POS.");
  }
  return {
    firstName,
    lastName,
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    amountCents,
    paymentMethod: (data.paymentMethod as StripePaymentMethod) || StripePaymentMethod.ManualEntry,
    ...(data.note.trim() ? { note: data.note.trim() } : {}),
    ...(data.receiptEmail.trim() ? { receiptEmail: data.receiptEmail.trim() } : {}),
    ...(planId ? { planId } : {})
  } satisfies PosPurchaseRequest;
}


async function launchStripeConnectOnboarding(gymId: string) {
  const response = (await client.createStripeConnectOnboardingLink(gymId, {
    returnUrl: window.location.href,
    refreshUrl: window.location.href
  })) as { url: string };
  if (!response.url) {
    throw new Error("Stripe did not return an onboarding URL.");
  }
  window.location.assign(response.url);
}

function closeCameraCapture() {
  state.cameraCapture = undefined;
  stopCameraStream();
}

function stopCameraStream() {
  if (activeCameraStream) {
    activeCameraStream.getTracks().forEach((track) => track.stop());
  }
  activeCameraStream = undefined;
  activeCameraSessionKey = undefined;
}

async function capturePhotoFromVideo(video: HTMLVideoElement, inputName: string) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("The browser could not capture a photo from the camera.");
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });
  if (!blob) {
    throw new Error("The browser could not encode the camera image.");
  }
  return new File([blob], `${inputName}-${Date.now()}.jpg`, { type: "image/jpeg" });
}

function setPendingCameraPhoto(formId: string, inputName: string, file: File) {
  const key = cameraCaptureKey(formId, inputName);
  const existing = pendingCameraPhotos.get(key);
  if (existing) {
    URL.revokeObjectURL(existing.previewUrl);
  }
  pendingCameraPhotos.set(key, {
    file,
    previewUrl: URL.createObjectURL(file)
  });
}

function getPendingCameraPhoto(formId: string, inputName: string) {
  return pendingCameraPhotos.get(cameraCaptureKey(formId, inputName));
}

function clearPendingCameraPhoto(formId: string, inputName: string) {
  const key = cameraCaptureKey(formId, inputName);
  const existing = pendingCameraPhotos.get(key);
  if (!existing) {
    return;
  }
  URL.revokeObjectURL(existing.previewUrl);
  pendingCameraPhotos.delete(key);
}

function cameraCaptureKey(formId: string, inputName: string) {
  return `${formId}:${inputName}`;
}

function memberProfileImageUrl(memberId: string) {
  return state.members.find((member) => member.id === memberId)?.profileImageUrl ?? "";
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
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

function hasPermission(permission: Permission) {
  return currentPermissions().includes(permission);
}

async function loadPermittedDashboardData<T>(
  allowed: boolean,
  loader: () => Promise<T>,
  fallback: T
) {
  if (!allowed) {
    return fallback;
  }
  try {
    return await loader();
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return fallback;
    }
    throw error;
  }
}

function clearDashboardState() {
  tokenStore.clearTokens();
  state.me = null;
  state.gym = null;
  state.platformGyms = [];
  state.platformGymDirectoryLoaded = false;
  state.platformAccessDenied = false;
  state.members = [];
  state.resources = [];
  state.staff = [];
  state.staffShifts = [];
  state.staffTimeEntries = [];
  state.schedulerSettings = null;
  state.schedulerRules = [];
  state.schedulerAvailability = [];
  state.mySchedulerAvailability = [];
  state.schedulerPreferenceRequests = [];
  state.mySchedulerPreferenceRequests = [];
  state.schedulerRequests = [];
  state.mySchedulerRequests = [];
  state.schedulerDraft = undefined;
  state.staffAccessSearch = "";
  state.staffAccessRoleFilter = "";
  state.staffAuthTreeExpandedRoleIds = [];
  state.staffScheduleCalendarOpen = false;
  state.staffScheduleCalendarMonth = toMonthKey(new Date());
  state.staffScheduleRequestModalOpen = false;
  state.staffPreferenceRequestModalOpen = false;
  state.staffClockModalOpen = false;
  state.staffRemovalUserId = undefined;
  state.roles = [];
  state.plans = [];
  state.classTypes = [];
  state.classBookings = [];
  state.classResourceAllocations = [];
  state.facilityReservations = [];
  state.selectedReservationAgendaItemId = "";
  state.accessDevices = [];
  state.accessRules = [];
  state.accessEvents = [];
  state.memberCache = {};
  state.checkInDebug = undefined;
  state.checkInReview = undefined;
  state.memberCsvImport = undefined;
  state.memberCsvPreview = undefined;
  state.memberCsvAiSuggestion = undefined;
  state.migrationBatches = [];
  state.migrationFiles = [];
  state.migrationColumnMappings = {};
  state.migrationMappingIssues = {};
  state.migrationMappingTargetFields = {};
  state.migrationStagedMembers = {};
  state.migrationValidationErrors = {};
  state.migrationStagedMemberFilter = "all";
  state.selectedMigrationBatchId = "";
  state.migrationAssistantStep = "upload";
  state.campaignImportType = "clients";
  state.campaignImportUpload = undefined;
  state.campaignImportPreview = undefined;
  state.campaignImportSummary = undefined;
  state.campaignImports = [];
  state.revenueOpportunities = [];
  state.roomDeviceUtilization = undefined;
  state.campaignClientSegments = undefined;
  state.selectedCampaignClientSegment = "inactive_members";
  const utilizationRange = campaignDefaultUtilizationRange();
  state.campaignUtilizationFrom = utilizationRange.from;
  state.campaignUtilizationTo = utilizationRange.to;
  state.campaignUtilizationResourceType = "";
  state.campaignUtilizationServiceCategory = "";
  state.campaignLayerPage = "dashboard";
  state.posStripeConfig = undefined;
  state.posTerminalConnectionState = "not_connected";
  state.posTerminalPaymentState = "not_ready";
  state.posTerminalReaderLabel = undefined;
  state.stripeConnectAccount = undefined;
  state.stripeConnectSession = undefined;
  state.stripeConnectEmbeddedOpen = false;
  state.selectedRoleId = "";
}

function setBanner(tone: BannerTone, text: string) {
  state.banner = { tone, text };
}

function readRoute(): {
  view: ViewName;
  dashboardView: AppState["dashboardView"];
  checkInRailExpanded: boolean;
  settingsSection?: SettingsSectionKey;
  campaignLayerPage?: CampaignLayerPageKey;
  consumerSegment?: ConsumerSegmentFilter;
} {
  const segments = getHashSegments();
  if (segments[0] === "public") {
    return { view: "public", dashboardView: "home", checkInRailExpanded: false };
  }
  if (segments[0] === "dashboard") {
    return { view: "dashboard", ...parseDashboardRoute(segments.slice(1)) };
  }
  return { view: "dashboard", dashboardView: "home", checkInRailExpanded: false };
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
    state.checkInRailExpanded = route.checkInRailExpanded;
    if (route.dashboardView === "settings") {
      state.settingsSection = route.settingsSection ?? "setup";
    }
    if (route.dashboardView === "campaign_layer") {
      state.campaignLayerPage = route.campaignLayerPage ?? "dashboard";
    }
    if (route.consumerSegment) {
      state.consumerSegment = route.consumerSegment;
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
      return { dashboardView: "home" as const, checkInRailExpanded: false };
    case "check-in":
      return {
        dashboardView: subsection === "history" ? "check_in_history" as const : "home" as const,
        checkInRailExpanded: true
      };
    case "consumers":
      if (subsection === "profile") {
        return {
          dashboardView: "customer_profile" as const,
          consumerSegment: "all" as const,
          checkInRailExpanded: false
        };
      }
      if (subsection === "edit") {
        return {
          dashboardView: "customer_edit" as const,
          consumerSegment: "all" as const,
          checkInRailExpanded: false
        };
      }
      return {
        dashboardView: "consumers" as const,
        consumerSegment: parseConsumerSegmentRoute(subsection),
        checkInRailExpanded: false
      };
    case "customers":
      if (subsection === "profile") {
        return {
          dashboardView: "customer_profile" as const,
          consumerSegment: "all" as const,
          checkInRailExpanded: false
        };
      }
      if (subsection === "edit") {
        return {
          dashboardView: "customer_edit" as const,
          consumerSegment: "all" as const,
          checkInRailExpanded: false
        };
      }
      return {
        dashboardView: "consumers" as const,
        consumerSegment: "customers" as const,
        checkInRailExpanded: false
      };
    case "leads":
      return { dashboardView: "consumers" as const, consumerSegment: "leads" as const, checkInRailExpanded: false };
    case "staff":
      return { dashboardView: "staff" as const, checkInRailExpanded: false };
    case "scheduler":
      return { dashboardView: "scheduler" as const, checkInRailExpanded: false };
    case "point-of-sale":
    case "pos":
      return { dashboardView: "pos" as const, checkInRailExpanded: false };
    case "plans":
    case "membership-plans":
      return { dashboardView: "plans" as const, checkInRailExpanded: false };
    case "locations":
      return { dashboardView: "locations" as const, checkInRailExpanded: false };
    case "classes":
      return { dashboardView: "classes" as const, checkInRailExpanded: false };
    case "bookings":
      return { dashboardView: "bookings" as const, checkInRailExpanded: false };
    case "personal-training":
    case "training":
      return { dashboardView: "personal_training" as const, checkInRailExpanded: false };
    case "access-control":
    case "access":
      return { dashboardView: "access_control" as const, checkInRailExpanded: false };
    case "contracts":
    case "forms":
      return { dashboardView: "contracts" as const, checkInRailExpanded: false };
    case "member-portal":
    case "portal":
      return { dashboardView: "member_portal" as const, checkInRailExpanded: false };
    case "migration":
    case "migration-assistant":
      return { dashboardView: "migration" as const, checkInRailExpanded: false };
    case "campaign-layer":
      return {
        dashboardView: "campaign_layer" as const,
        campaignLayerPage: parseCampaignLayerPageRoute(subsection),
        checkInRailExpanded: false
      };
    case "imports":
    case "opportunities":
    case "utilization":
    case "clients":
    case "campaigns":
    case "programs":
      return {
        dashboardView: "campaign_layer" as const,
        campaignLayerPage: parseCampaignLayerPageRoute(section),
        checkInRailExpanded: false
      };
    case "weekly-plan":
      return { dashboardView: "weekly_plan" as const, checkInRailExpanded: false };
    case "roi":
    case "roi-tracking":
      return { dashboardView: "roi_tracking" as const, checkInRailExpanded: false };
    case "marketing":
      return { dashboardView: "marketing" as const, checkInRailExpanded: false };
    case "reporting":
    case "reports":
      return { dashboardView: "reports" as const, checkInRailExpanded: false };
    case "settings":
      return {
        dashboardView: "settings" as const,
        settingsSection: parseSettingsSectionRoute(subsection),
        checkInRailExpanded: false
      };
    default:
      return { dashboardView: "home" as const, checkInRailExpanded: false };
  }
}

function dashboardContentView(view: AppState["dashboardView"]) {
  return view === "check_in" ? "home" : view;
}

function parseCampaignLayerPageRoute(section?: string): CampaignLayerPageKey {
  switch (section) {
    case "imports":
    case "opportunities":
    case "utilization":
    case "clients":
    case "campaigns":
    case "programs":
    case "settings":
      return section;
    case "dashboard":
    case undefined:
    case "":
      return "dashboard";
    default:
      return "dashboard";
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

function parseConsumerSegmentRoute(section?: string): ConsumerSegmentFilter {
  switch (section) {
    case "members":
    case "customers":
    case "leads":
      return section;
    default:
      return "all";
  }
}

function consumerSegmentToRoute(segment: ConsumerSegmentFilter) {
  return segment === "all" ? "" : `/${segment}`;
}

function dashboardTopLevelView(view: AppState["dashboardView"]) {
  switch (view) {
    case "consumers":
    case "customer_profile":
    case "customer_edit":
    case "customers":
    case "leads":
      return "consumers";
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
    case "consumers":
      return `#/dashboard/consumers${consumerSegmentToRoute(state.consumerSegment)}`;
    case "customers":
      return "#/dashboard/consumers/customers";
    case "customer_profile":
      return "#/dashboard/consumers/profile";
    case "customer_edit":
      return "#/dashboard/consumers/edit";
    case "leads":
      return "#/dashboard/consumers/leads";
    case "staff":
      return "#/dashboard/staff";
    case "scheduler":
      return "#/dashboard/scheduler";
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
    case "migration":
      return "#/dashboard/migration";
    case "campaign_layer":
      return campaignLayerPageToHash(state.campaignLayerPage);
    case "weekly_plan":
      return "#/dashboard/weekly-plan";
    case "roi_tracking":
      return "#/dashboard/roi";
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

function campaignLayerPageToHash(page: CampaignLayerPageKey) {
  const route = CAMPAIGN_LAYER_PAGES.find((candidate) => candidate.key === page)?.path ?? "";
  return route ? `#/dashboard/campaign-layer/${route}` : "#/dashboard/campaign-layer";
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
  if (view === "check_in") {
    openCheckInRail();
    return;
  }
  const previousTopLevel = dashboardTopLevelView(state.dashboardView);
  const nextTopLevel = dashboardTopLevelView(view);
  if (!options?.preserveContext && previousTopLevel !== nextTopLevel) {
    resetDashboardTransientState();
  }
  state.dashboardView = view;
  state.checkInRailExpanded = false;
  const targetHash = dashboardViewToHash(view);
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
    return;
  }
  render();
}

function openCheckInRail() {
  state.checkInRailExpanded = true;
  render();
}

function toggleCheckInRail() {
  state.checkInRailExpanded = !state.checkInRailExpanded;
  render();
}

function navigateConsumerSegment(segment: ConsumerSegmentFilter) {
  state.consumerSegment = segment;
  state.dashboardView = "consumers";
  const targetHash = dashboardViewToHash("consumers");
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

function resolveConsumerRecords(consumers: MemberRecord[]) {
  return consumers;
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
  state.classResourceAllocations = [];
  state.selectedReservationAgendaItemId = "";
  state.selectedPlanId = "";
  localStorage.removeItem(PUBLIC_SLUG_STORAGE_KEY);
}

async function registerInputFromForm(form: HTMLFormElement, options: { requireGymName?: boolean } = {}) {
  const data = formData(form);
  const gymName = data.gymName?.trim() ?? "";
  const migrationChecklist = await migrationChecklistFromForm(form);
  const input = {
    email: data.email?.trim().toLowerCase() ?? "",
    password: data.password ?? "",
    firstName: data.firstName?.trim() ?? "",
    lastName: data.lastName?.trim() ?? "",
    ...(gymName ? { gymName } : {}),
    ...(migrationChecklist ? { migrationChecklist } : {}),
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

function studioSettingsUpdateFromForm(form: HTMLFormElement) {
  const data = formData(form);
  const completedSteps = studioSetupCompletedSteps();
  completedSteps.add("profile");
  const currentStep = nextStudioSetupStep(completedSteps);
  return {
    name: data.studioName?.trim() || state.gym?.name || "Gym",
    timezone: data.timezone?.trim() || state.gym?.timezone || "America/New_York",
    operatingHours: operatingHoursFromStudioForm(form),
    studioSettings: {
      businessType: data.businessType?.trim() || undefined,
      defaultBufferMinutes: safeInteger(data.defaultBufferMinutes, 15),
      averageSessionPriceCents: dollarsToCents(data.averageSessionPrice || "0"),
      softwareMonthlyCostCents: dollarsToCents(data.softwareMonthlyCost || "0"),
      targetMonthlyRevenueCents: dollarsToCents(data.targetMonthlyRevenue || "0"),
      resourceTypesUsed: Array.from(form.querySelectorAll<HTMLInputElement>('input[name="resourceTypesUsed"]:checked'))
        .map((input) => input.value)
        .filter((value): value is StudioResourceType =>
          STUDIO_RESOURCE_TYPES.some((resource) => resource.value === value)
        )
    },
    setupWizard: {
      currentStep: currentStep ?? "first_revenue_plan",
      completedSteps: [...completedSteps],
      ...(completedSteps.size === STUDIO_SETUP_STEPS.length ? { completedAt: new Date().toISOString() } : {})
    }
  };
}

function operatingHoursFromStudioForm(form: HTMLFormElement) {
  const hours: Record<string, Array<{ opensAt: string; closesAt: string }>> = {};
  for (const day of STUDIO_DAYS) {
    const open = form.querySelector<HTMLInputElement>(`input[name="open_${day.key}"]`)?.checked === true;
    if (!open) {
      hours[day.key] = [];
      continue;
    }
    const opensAt = form.querySelector<HTMLInputElement>(`input[name="opensAt_${day.key}"]`)?.value || "09:00";
    const closesAt = form.querySelector<HTMLInputElement>(`input[name="closesAt_${day.key}"]`)?.value || "17:00";
    if (opensAt >= closesAt) {
      throw new Error(`${day.label} closing time must be after opening time.`);
    }
    hours[day.key] = [{ opensAt, closesAt }];
  }
  return hours;
}

async function migrationChecklistFromForm(form: HTMLFormElement) {
  const selectedItems = new Set(Array.from(form.querySelectorAll<HTMLInputElement>('input[name="migrationItems"]:checked'))
    .map((input) => input.value)
    .filter((value): value is (typeof MIGRATION_CHECKLIST_ITEMS)[number]["key"] =>
      MIGRATION_CHECKLIST_ITEMS.some((item) => item.key === value)
    ));
  const currentSoftware = form
    .querySelector<HTMLInputElement>('input[name="migrationCurrentSoftware"]')
    ?.value.trim();
  const notes = form.querySelector<HTMLTextAreaElement>('textarea[name="migrationNotes"]')?.value.trim();
  const detailsEntries = [];
  for (const item of MIGRATION_CHECKLIST_ITEMS) {
    const sourceType = form
      .querySelector<HTMLSelectElement>(`select[name="migrationSourceType_${item.key}"]`)
      ?.value as (typeof MIGRATION_SOURCE_TYPES)[number]["value"] | undefined;
    const sourceName = form
      .querySelector<HTMLInputElement>(`input[name="migrationSourceName_${item.key}"]`)
      ?.value.trim();
    const fieldNotes = form
      .querySelector<HTMLTextAreaElement>(`textarea[name="migrationFieldNotes_${item.key}"]`)
      ?.value.trim();
    const importNotes = form
      .querySelector<HTMLTextAreaElement>(`textarea[name="migrationImportNotes_${item.key}"]`)
      ?.value.trim();
    const uploads = await migrationFileUploadsFromForm(form, item.key);
    const hasDetails = Boolean(
      sourceName ||
        fieldNotes ||
        importNotes ||
        uploads.length > 0 ||
        (sourceType && sourceType !== "unknown")
    );
    if (!hasDetails) {
      continue;
    }
    selectedItems.add(item.key);
    detailsEntries.push(
      [
        item.key,
        {
          sourceType: sourceType ?? "unknown",
          ...(sourceName ? { sourceName } : {}),
          ...(fieldNotes ? { fieldNotes } : {}),
          ...(importNotes ? { importNotes } : {}),
          ...(uploads.length > 0 ? { uploads } : {})
        }
      ]
    );
  }

  if (selectedItems.size === 0 && detailsEntries.length === 0 && !currentSoftware && !notes) {
    return undefined;
  }

  const items = Object.fromEntries(MIGRATION_CHECKLIST_ITEMS.map((item) => [item.key, selectedItems.has(item.key)]));
  return {
    ...(currentSoftware ? { currentSoftware } : {}),
    ...(notes ? { notes } : {}),
    items,
    ...(detailsEntries.length > 0 ? { details: Object.fromEntries(detailsEntries) } : {})
  };
}

async function migrationFileUploadsFromForm(
  form: HTMLFormElement,
  itemKey: (typeof MIGRATION_CHECKLIST_ITEMS)[number]["key"]
) {
  const input = form.querySelector<HTMLInputElement>(`input[name="migrationUploads_${itemKey}"]`);
  const files = Array.from(input?.files ?? []).filter((file) => file.size > 0);
  if (files.length === 0) {
    return [];
  }
  if (files.length > MIGRATION_UPLOAD_MAX_FILES) {
    throw new Error(`Upload no more than ${MIGRATION_UPLOAD_MAX_FILES} files for each migration category.`);
  }

  return Promise.all(
    files.map(async (file) => {
      if (file.size > MIGRATION_UPLOAD_MAX_BYTES) {
        throw new Error(`${file.name} is too large. Migration upload files must be ${Math.round(MIGRATION_UPLOAD_MAX_BYTES / 1024 / 1024)} MB or smaller.`);
      }
      const buffer = await file.arrayBuffer();
      const textPreview = await migrationTextPreview(file, buffer);
      return {
        fileName: file.name,
        contentType: file.type || migrationContentTypeFromName(file.name),
        sizeBytes: file.size,
        base64Data: arrayBufferToBase64(buffer),
        ...(textPreview ? { textPreview } : {})
      };
    })
  );
}

async function migrationTextPreview(file: File, buffer: ArrayBuffer) {
  const lowerName = file.name.toLowerCase();
  const isTextLike =
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".tsv") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".json");
  if (!isTextLike) {
    return undefined;
  }
  return new TextDecoder().decode(buffer.slice(0, 20_000));
}

function migrationContentTypeFromName(fileName: string) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".csv")) return "text/csv";
  if (lowerName.endsWith(".tsv")) return "text/tab-separated-values";
  if (lowerName.endsWith(".json")) return "application/json";
  if (lowerName.endsWith(".txt")) return "text/plain";
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lowerName.endsWith(".xls")) return "application/vnd.ms-excel";
  return "application/octet-stream";
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
