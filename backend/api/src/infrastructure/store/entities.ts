import type {
  AccessDeviceStatus,
  AccessDeviceType,
  AccessEventDecision,
  BillingInterval,
  BookingSource,
  BookingStatus,
  CheckInMethod,
  CheckInStatus,
  ClassSessionStatus,
  ConsumerRecordStatus,
  ConsumerSegment,
  FeatureFlag,
  GymStatus,
  LeadStage,
  LocationStatus,
  MemberStatus,
  MembershipStatus,
  NotificationEventStatus,
  NotificationEventType,
  Permission,
  PlanStatus,
  FacilityReservationStatus,
  ReservableResourceStatus,
  ReservationConfirmationMode,
  ReservationPaymentRequirement,
  ReservationPaymentStatus,
  ResourceAllocationSource,
  RoleName,
  StaffAuditAction,
  StaffInviteStatus,
  UserStatus
} from "@gym-platform/constants";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  emailVerifiedAt?: Date;
  twoFactorSecret?: string;
  twoFactorEnabledAt?: Date;
  recoveryCodeHashes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Gym {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  status: GymStatus;
  timezone: string;
  locale: string;
  logoUrl?: string;
  stripeAccountId?: string;
  brandColors?: BrandColors;
  businessInfo?: GymBusinessInfo;
  operatingHours: OperatingHours;
  featureFlags: FeatureFlag[];
  onboardingCompletedSteps: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandColors {
  primary: string;
  secondary?: string;
  accent?: string;
}

export interface GymBusinessInfo {
  legalName?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  address?: Address;
}

export interface Role {
  id: string;
  gymId: string;
  name: RoleName | string;
  permissions: Permission[];
  parentRoleId?: string;
  createsReservableResource: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GymUser {
  id: string;
  gymId: string;
  userId: string;
  roleId: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffInvite {
  id: string;
  gymId: string;
  email: string;
  roleId: string;
  invitedByUserId: string;
  tokenHash: string;
  status: StaffInviteStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffAuditLog {
  id: string;
  gymId: string;
  actorUserId: string;
  targetUserId: string;
  action: StaffAuditAction;
  previousRoleId?: string;
  nextRoleId?: string;
  previousStatus?: UserStatus;
  nextStatus?: UserStatus;
  reason?: string;
  createdAt: Date;
}

export interface StaffShift {
  id: string;
  gymId: string;
  userId: string;
  locationId?: string;
  roleId: string;
  startsAt: Date;
  endsAt: Date;
  notes?: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffTimeEntry {
  id: string;
  gymId: string;
  userId: string;
  locationId?: string;
  clockedInAt: Date;
  clockedOutAt?: Date;
  clockedInByUserId: string;
  clockedOutByUserId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchedulerCoverageRule {
  id: string;
  gymId: string;
  name: string;
  locationId?: string;
  roleId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  requiredStaff: number;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchedulerAvailability {
  id: string;
  gymId: string;
  userId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  preference: "available" | "preferred" | "unavailable";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchedulerSettings {
  gymId: string;
  planningHorizonDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchedulerPreferenceRequest {
  id: string;
  gymId: string;
  userId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  preference: SchedulerAvailability["preference"];
  notes?: string;
  status: "open" | "approved" | "declined";
  resolutionNote?: string;
  resolvedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface SchedulerRequest {
  id: string;
  gymId: string;
  userId: string;
  shiftId?: string;
  requestType: "time_off" | "swap" | "complaint";
  message: string;
  status: "open" | "resolved" | "declined";
  suggestedReplacementUserId?: string;
  resolutionNote?: string;
  resolvedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface HoursRange {
  opensAt: string;
  closesAt: string;
}

export type OperatingHours = Partial<
  Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", HoursRange[]>
>;

export interface Location {
  id: string;
  gymId: string;
  name: string;
  address: Address;
  timezone: string;
  phone?: string;
  operatingHours: OperatingHours;
  status: LocationStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

export interface Member {
  id: string;
  gymId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  barcode?: string;
  profileImageUrl?: string;
  status: MemberStatus;
  recordStatus: ConsumerRecordStatus;
  leadStage: LeadStage;
  emergencyContact?: EmergencyContact;
  notes?: string;
  tagNames: string[];
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface Consumer extends Member {
  segments: ConsumerSegment[];
  isLead: boolean;
  isCustomer: boolean;
  isMember: boolean;
}

export interface MembershipPlan {
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
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface MemberMembership {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  status: MembershipStatus;
  startsAt: Date;
  endsAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassType {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  defaultDurationMinutes: number;
  defaultCapacity: number;
  defaultWaitlistCapacity: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassSession {
  id: string;
  gymId: string;
  classTypeId: string;
  locationId: string;
  trainerUserId?: string;
  roomName?: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  waitlistCapacity: number;
  cancellationCutoffMinutes: number;
  lateCancellationFeeCents: number;
  status: ClassSessionStatus;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
}

export interface ClassBooking {
  id: string;
  gymId: string;
  classSessionId: string;
  memberId: string;
  status: BookingStatus;
  waitlistPosition?: number;
  source: BookingSource;
  createdByUserId?: string;
  bookedAt: Date;
  cancelledAt?: Date;
  cancelledByUserId?: string;
  cancellationReason?: string;
  isLateCancellation: boolean;
  lateCancellationFeeCents: number;
  staffOverride: boolean;
  overrideReason?: string;
  promotedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceSlotRules {
  minDurationMinutes: number;
  maxDurationMinutes: number;
  incrementMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}

export interface ResourcePricingConfig {
  amountCents: number;
}

export interface ResourceCancellationPolicy {
  cutoffMinutes: number;
  feeCents: number;
}

export interface ReservableResource {
  id: string;
  gymId: string;
  locationId?: string;
  parentResourceId?: string;
  name: string;
  resourceType: string;
  status: ReservableResourceStatus;
  isBookable: boolean;
  isExclusive: boolean;
  capacity: number;
  amenities: string[];
  rentableHours?: OperatingHours;
  slotRules: ResourceSlotRules;
  pricing: ResourcePricingConfig;
  paymentRequirement: ReservationPaymentRequirement;
  confirmationMode: ReservationConfirmationMode;
  cancellationPolicy: ResourceCancellationPolicy;
  linkedStaffUserId?: string;
  createdFromRoleId?: string;
  autoManaged?: boolean;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface ResourceAllocation {
  id: string;
  gymId: string;
  resourceId: string;
  source: ResourceAllocationSource;
  classSessionId?: string;
  facilityReservationId?: string;
  startsAt: Date;
  endsAt: Date;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  staffOverride: boolean;
  overrideReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacilityReservation {
  id: string;
  gymId: string;
  resourceId: string;
  allocationId?: string;
  locationId?: string;
  memberId: string;
  createdByUserId: string;
  status: FacilityReservationStatus;
  startsAt: Date;
  endsAt: Date;
  amountCents: number;
  paymentRequirement: ReservationPaymentRequirement;
  paymentStatus: ReservationPaymentStatus;
  paymentReference?: string;
  cancellationFeeCents: number;
  refundAmountCents: number;
  cancelledAt?: Date;
  cancelledByUserId?: string;
  cancellationReason?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationEvent {
  id: string;
  gymId: string;
  type: NotificationEventType;
  status: NotificationEventStatus;
  recipientMemberId: string;
  relatedBookingId?: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckIn {
  id: string;
  gymId: string;
  memberId: string;
  locationId: string;
  classSessionId?: string;
  bookingId?: string;
  status: CheckInStatus;
  method: CheckInMethod;
  deniedReason?: string;
  staffOverride: boolean;
  overrideReason?: string;
  checkedInAt: Date;
  createdByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessDevice {
  id: string;
  gymId: string;
  locationId: string;
  name: string;
  deviceType: AccessDeviceType;
  status: AccessDeviceStatus;
  apiKeyHash: string;
  apiKeyPreview: string;
  lastHeartbeatAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  rotatedAt?: Date;
}

export interface AccessRule {
  id: string;
  gymId: string;
  locationId: string;
  name: string;
  planId?: string;
  allowAllActiveMembers: boolean;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessEvent {
  id: string;
  gymId: string;
  deviceId: string;
  locationId: string;
  memberId?: string;
  decision: AccessEventDecision;
  reason: string;
  occurredAt: Date;
  createdAt: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  gymId?: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByTokenId?: string;
  createdAt: Date;
}

export interface PurposeToken {
  id: string;
  userId: string;
  tokenHash: string;
  purpose: "password_reset" | "email_verification";
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface StoreSnapshot {
  users: User[];
  gyms: Gym[];
  roles: Role[];
  gymUsers: GymUser[];
  staffInvites: StaffInvite[];
  staffAuditLogs: StaffAuditLog[];
  staffShifts: StaffShift[];
  staffTimeEntries: StaffTimeEntry[];
  schedulerCoverageRules: SchedulerCoverageRule[];
  schedulerAvailabilities: SchedulerAvailability[];
  schedulerSettings: SchedulerSettings[];
  schedulerPreferenceRequests: SchedulerPreferenceRequest[];
  schedulerRequests: SchedulerRequest[];
  locations: Location[];
  members: Member[];
  membershipPlans: MembershipPlan[];
  memberMemberships: MemberMembership[];
  classTypes: ClassType[];
  classSessions: ClassSession[];
  classBookings: ClassBooking[];
  reservableResources: ReservableResource[];
  resourceAllocations: ResourceAllocation[];
  facilityReservations: FacilityReservation[];
  notificationEvents: NotificationEvent[];
  checkIns: CheckIn[];
  accessDevices: AccessDevice[];
  accessRules: AccessRule[];
  accessEvents: AccessEvent[];
  refreshTokens: RefreshToken[];
  purposeTokens: PurposeToken[];
}
