import type { Pool, QueryResult, QueryResultRow } from "pg";
import type {
  AccessDevice,
  AccessEvent,
  AccessRule,
  Address,
  Gym,
  GymUser,
  ClassBooking,
  CheckIn,
  ClassSession,
  ClassType,
  FacilityReservation,
  Location,
  Member,
  MemberMembership,
  MembershipPlan,
  NotificationEvent,
  OperatingHours,
  PurposeToken,
  ReservableResource,
  RefreshToken,
  ResourceAllocation,
  ResourceCancellationPolicy,
  ResourcePricingConfig,
  ResourceSlotRules,
  Role,
  SchedulerAvailability,
  SchedulerCoverageRule,
  SchedulerPreferenceRequest,
  SchedulerSettings,
  SchedulerRequest,
  StaffAuditLog,
  StaffInvite,
  StaffShift,
  StaffTimeEntry,
  User
} from "./entities.js";
import type { Repositories } from "./repositories.js";

interface QueryExecutor {
  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[]
  ): Promise<QueryResult<R>>;
}

interface TransactionClient extends QueryExecutor {
  release(): void;
}

interface TransactionPool {
  connect(): Promise<TransactionClient>;
}

interface UserRow extends QueryResultRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: User["status"];
  email_verified_at: Date | null;
  two_factor_secret: string | null;
  two_factor_enabled_at: Date | null;
  recovery_code_hashes: unknown;
  created_at: Date;
  updated_at: Date;
}

interface GymRow extends QueryResultRow {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  status: Gym["status"];
  timezone: string;
  locale: string;
  logo_url: string | null;
  stripe_account_id: string | null;
  brand_colors: unknown;
  business_info: unknown;
  operating_hours: unknown;
  feature_flags: unknown;
  onboarding_completed_steps: unknown;
  created_at: Date;
  updated_at: Date;
}

interface RoleRow extends QueryResultRow {
  id: string;
  gym_id: string;
  name: Role["name"];
  permissions: unknown;
  parent_role_id: string | null;
  creates_reservable_resource: boolean;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

interface GymUserRow extends QueryResultRow {
  id: string;
  gym_id: string;
  user_id: string;
  role_id: string;
  status: GymUser["status"];
  created_at: Date;
  updated_at: Date;
}

interface StaffInviteRow extends QueryResultRow {
  id: string;
  gym_id: string;
  email: string;
  role_id: string;
  invited_by_user_id: string;
  token_hash: string;
  status: StaffInvite["status"];
  expires_at: Date;
  accepted_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface StaffAuditLogRow extends QueryResultRow {
  id: string;
  gym_id: string;
  actor_user_id: string;
  target_user_id: string;
  action: StaffAuditLog["action"];
  previous_role_id: string | null;
  next_role_id: string | null;
  previous_status: StaffAuditLog["previousStatus"] | null;
  next_status: StaffAuditLog["nextStatus"] | null;
  reason: string | null;
  created_at: Date;
}

interface StaffShiftRow extends QueryResultRow {
  id: string;
  gym_id: string;
  user_id: string;
  location_id: string | null;
  role_id: string;
  starts_at: Date;
  ends_at: Date;
  notes: string | null;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
}

interface StaffTimeEntryRow extends QueryResultRow {
  id: string;
  gym_id: string;
  user_id: string;
  location_id: string | null;
  clocked_in_at: Date;
  clocked_out_at: Date | null;
  clocked_in_by_user_id: string;
  clocked_out_by_user_id: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

interface SchedulerCoverageRuleRow extends QueryResultRow {
  id: string;
  gym_id: string;
  name: string;
  location_id: string | null;
  role_id: string;
  days_of_week: unknown;
  start_time: string;
  end_time: string;
  required_staff: number;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
}

interface SchedulerAvailabilityRow extends QueryResultRow {
  id: string;
  gym_id: string;
  user_id: string;
  days_of_week: unknown;
  start_time: string;
  end_time: string;
  preference: SchedulerAvailability["preference"];
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

interface SchedulerSettingsRow extends QueryResultRow {
  gym_id: string;
  planning_horizon_days: number;
  created_at: Date;
  updated_at: Date;
}

interface SchedulerPreferenceRequestRow extends QueryResultRow {
  id: string;
  gym_id: string;
  user_id: string;
  days_of_week: unknown;
  start_time: string;
  end_time: string;
  preference: SchedulerAvailability["preference"];
  notes: string | null;
  status: SchedulerPreferenceRequest["status"];
  resolution_note: string | null;
  resolved_by_user_id: string | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface SchedulerRequestRow extends QueryResultRow {
  id: string;
  gym_id: string;
  user_id: string;
  shift_id: string | null;
  request_type: SchedulerRequest["requestType"];
  message: string;
  status: SchedulerRequest["status"];
  suggested_replacement_user_id: string | null;
  resolution_note: string | null;
  resolved_by_user_id: string | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface LocationRow extends QueryResultRow {
  id: string;
  gym_id: string;
  name: string;
  address: unknown;
  timezone: string;
  phone: string | null;
  operating_hours: unknown;
  status: Location["status"];
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface MemberRow extends QueryResultRow {
  id: string;
  gym_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  barcode: string | null;
  profile_image_url: string | null;
  status: Member["status"];
  record_status: Member["recordStatus"];
  lead_stage: Member["leadStage"];
  emergency_contact: unknown;
  notes: string | null;
  tag_names: unknown;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface MembershipPlanRow extends QueryResultRow {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  billing_interval: MembershipPlan["billingInterval"];
  price_cents: number;
  signup_fee_cents: number;
  trial_days: number;
  auto_renew: boolean;
  contract_length_months: number | null;
  class_access_limit: number | null;
  is_public: boolean;
  status: MembershipPlan["status"];
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface MemberMembershipRow extends QueryResultRow {
  id: string;
  gym_id: string;
  member_id: string;
  plan_id: string;
  status: MemberMembership["status"];
  starts_at: Date;
  ends_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface ClassTypeRow extends QueryResultRow {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  default_duration_minutes: number;
  default_capacity: number;
  default_waitlist_capacity: number;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ClassSessionRow extends QueryResultRow {
  id: string;
  gym_id: string;
  class_type_id: string;
  location_id: string;
  trainer_user_id: string | null;
  room_name: string | null;
  starts_at: Date;
  ends_at: Date;
  capacity: number;
  waitlist_capacity: number;
  cancellation_cutoff_minutes: number;
  late_cancellation_fee_cents: number;
  status: ClassSession["status"];
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface ClassBookingRow extends QueryResultRow {
  id: string;
  gym_id: string;
  class_session_id: string;
  member_id: string;
  status: ClassBooking["status"];
  waitlist_position: number | null;
  source: ClassBooking["source"];
  created_by_user_id: string | null;
  booked_at: Date;
  cancelled_at: Date | null;
  cancelled_by_user_id: string | null;
  cancellation_reason: string | null;
  is_late_cancellation: boolean;
  late_cancellation_fee_cents: number;
  staff_override: boolean;
  override_reason: string | null;
  promoted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface ReservableResourceRow extends QueryResultRow {
  id: string;
  gym_id: string;
  location_id: string | null;
  parent_resource_id: string | null;
  name: string;
  resource_type: string;
  status: ReservableResource["status"];
  is_bookable: boolean;
  is_exclusive: boolean;
  capacity: number;
  amenities: unknown;
  rentable_hours: unknown;
  slot_rules: unknown;
  pricing: unknown;
  payment_requirement: ReservableResource["paymentRequirement"];
  confirmation_mode: ReservableResource["confirmationMode"];
  cancellation_policy: unknown;
  linked_staff_user_id: string | null;
  created_from_role_id: string | null;
  auto_managed: boolean;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface ResourceAllocationRow extends QueryResultRow {
  id: string;
  gym_id: string;
  resource_id: string;
  source: ResourceAllocation["source"];
  class_session_id: string | null;
  facility_reservation_id: string | null;
  starts_at: Date;
  ends_at: Date;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  staff_override: boolean;
  override_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

interface FacilityReservationRow extends QueryResultRow {
  id: string;
  gym_id: string;
  resource_id: string;
  allocation_id: string | null;
  location_id: string | null;
  member_id: string;
  created_by_user_id: string;
  status: FacilityReservation["status"];
  starts_at: Date;
  ends_at: Date;
  amount_cents: number;
  payment_requirement: FacilityReservation["paymentRequirement"];
  payment_status: FacilityReservation["paymentStatus"];
  payment_reference: string | null;
  cancellation_fee_cents: number;
  refund_amount_cents: number;
  cancelled_at: Date | null;
  cancelled_by_user_id: string | null;
  cancellation_reason: string | null;
  note: string | null;
  created_at: Date;
  updated_at: Date;
}

interface NotificationEventRow extends QueryResultRow {
  id: string;
  gym_id: string;
  type: NotificationEvent["type"];
  status: NotificationEvent["status"];
  recipient_member_id: string;
  related_booking_id: string | null;
  payload: unknown;
  created_at: Date;
  updated_at: Date;
}

interface CheckInRow extends QueryResultRow {
  id: string;
  gym_id: string;
  member_id: string;
  location_id: string;
  class_session_id: string | null;
  booking_id: string | null;
  status: CheckIn["status"];
  method: CheckIn["method"];
  denied_reason: string | null;
  staff_override: boolean;
  override_reason: string | null;
  checked_in_at: Date;
  created_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface AccessDeviceRow extends QueryResultRow {
  id: string;
  gym_id: string;
  location_id: string;
  name: string;
  device_type: AccessDevice["deviceType"];
  status: AccessDevice["status"];
  api_key_hash: string;
  api_key_preview: string;
  last_heartbeat_at: Date | null;
  created_at: Date;
  updated_at: Date;
  rotated_at: Date | null;
}

interface AccessRuleRow extends QueryResultRow {
  id: string;
  gym_id: string;
  location_id: string;
  name: string;
  plan_id: string | null;
  allow_all_active_members: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface AccessEventRow extends QueryResultRow {
  id: string;
  gym_id: string;
  device_id: string;
  location_id: string;
  member_id: string | null;
  decision: AccessEvent["decision"];
  reason: string;
  occurred_at: Date;
  created_at: Date;
}

interface RefreshTokenRow extends QueryResultRow {
  id: string;
  user_id: string;
  gym_id: string | null;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_token_id: string | null;
  created_at: Date;
}

interface PurposeTokenRow extends QueryResultRow {
  id: string;
  user_id: string;
  token_hash: string;
  purpose: PurposeToken["purpose"];
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export class PostgresRepositories implements Repositories {
  readonly users = {
    createUser: (user: User) => this.createUser(user),
    getUser: (userId: string) => this.getUser(userId),
    findUserByEmail: (email: string) => this.findUserByEmail(email),
    updateUser: (user: User) => this.updateUser(user)
  };

  readonly gyms = {
    createGym: (gym: Gym) => this.createGym(gym),
    getGym: (gymId: string) => this.getGym(gymId),
    findGymBySlug: (slug: string) => this.findGymBySlug(slug),
    listGyms: () => this.listGyms(),
    updateGym: (gym: Gym) => this.updateGym(gym)
  };

  readonly roles = {
    createRole: (role: Role) => this.createRole(role),
    createRoles: (roles: Role[]) => this.createRoles(roles),
    getRole: (roleId: string) => this.getRole(roleId),
    listRolesForGym: (gymId: string) => this.listRolesForGym(gymId),
    updateRole: (role: Role) => this.updateRole(role),
    deleteRole: (roleId: string) => this.deleteRole(roleId)
  };

  readonly gymUsers = {
    createGymUser: (gymUser: GymUser) => this.createGymUser(gymUser),
    findGymUser: (gymId: string, userId: string) => this.findGymUser(gymId, userId),
    listGymUsersForGym: (gymId: string) => this.listGymUsersForGym(gymId),
    listGymMemberships: (userId: string) => this.listGymMemberships(userId),
    updateGymUser: (gymUser: GymUser) => this.updateGymUser(gymUser)
  };

  readonly staffInvites = {
    createStaffInvite: (invite: StaffInvite) => this.createStaffInvite(invite),
    getStaffInvite: (inviteId: string) => this.getStaffInvite(inviteId),
    findStaffInviteByTokenHash: (tokenHash: string) => this.findStaffInviteByTokenHash(tokenHash),
    findPendingStaffInvite: (gymId: string, email: string) =>
      this.findPendingStaffInvite(gymId, email),
    listStaffInvitesForGym: (gymId: string) => this.listStaffInvitesForGym(gymId),
    updateStaffInvite: (invite: StaffInvite) => this.updateStaffInvite(invite)
  };

  readonly staffAuditLogs = {
    createStaffAuditLog: (entry: StaffAuditLog) => this.createStaffAuditLog(entry),
    listStaffAuditLogsForGym: (gymId: string) => this.listStaffAuditLogsForGym(gymId)
  };

  readonly staffShifts = {
    createStaffShift: (shift: StaffShift) => this.createStaffShift(shift),
    updateStaffShift: (shift: StaffShift) => this.updateStaffShift(shift),
    listStaffShiftsForGym: (gymId: string) => this.listStaffShiftsForGym(gymId),
    listStaffShiftsForStaff: (gymId: string, userId: string) =>
      this.listStaffShiftsForStaff(gymId, userId)
  };

  readonly staffTimeEntries = {
    createStaffTimeEntry: (entry: StaffTimeEntry) => this.createStaffTimeEntry(entry),
    updateStaffTimeEntry: (entry: StaffTimeEntry) => this.updateStaffTimeEntry(entry),
    listStaffTimeEntriesForGym: (gymId: string) => this.listStaffTimeEntriesForGym(gymId),
    listStaffTimeEntriesForStaff: (gymId: string, userId: string) =>
      this.listStaffTimeEntriesForStaff(gymId, userId),
    findOpenStaffTimeEntry: (gymId: string, userId: string) =>
      this.findOpenStaffTimeEntry(gymId, userId)
  };

  readonly scheduler = {
    getSettings: (gymId: string) => this.getSchedulerSettings(gymId),
    upsertSettings: (settings: SchedulerSettings) => this.upsertSchedulerSettings(settings),
    createCoverageRule: (rule: SchedulerCoverageRule) => this.createCoverageRule(rule),
    listCoverageRulesForGym: (gymId: string) => this.listCoverageRulesForGym(gymId),
    createAvailability: (availability: SchedulerAvailability) =>
      this.createAvailability(availability),
    replaceAvailabilitiesForStaff: (
      gymId: string,
      userId: string,
      availabilities: SchedulerAvailability[]
    ) => this.replaceAvailabilitiesForStaff(gymId, userId, availabilities),
    listAvailabilitiesForGym: (gymId: string) => this.listAvailabilitiesForGym(gymId),
    listAvailabilitiesForStaff: (gymId: string, userId: string) =>
      this.listAvailabilitiesForStaff(gymId, userId),
    createPreferenceRequest: (request: SchedulerPreferenceRequest) =>
      this.createPreferenceRequest(request),
    updatePreferenceRequest: (request: SchedulerPreferenceRequest) =>
      this.updatePreferenceRequest(request),
    getPreferenceRequest: (requestId: string) => this.getPreferenceRequest(requestId),
    listPreferenceRequestsForGym: (gymId: string) => this.listPreferenceRequestsForGym(gymId),
    listPreferenceRequestsForStaff: (gymId: string, userId: string) =>
      this.listPreferenceRequestsForStaff(gymId, userId),
    createRequest: (request: SchedulerRequest) => this.createRequest(request),
    updateRequest: (request: SchedulerRequest) => this.updateRequest(request),
    getRequest: (requestId: string) => this.getRequest(requestId),
    listRequestsForGym: (gymId: string) => this.listRequestsForGym(gymId),
    listRequestsForStaff: (gymId: string, userId: string) =>
      this.listRequestsForStaff(gymId, userId)
  };

  readonly locations = {
    createLocation: (location: Location) => this.createLocation(location),
    getLocation: (locationId: string) => this.getLocation(locationId),
    listLocationsForGym: (gymId: string) => this.listLocationsForGym(gymId),
    updateLocation: (location: Location) => this.updateLocation(location)
  };

  readonly members = {
    createMember: (member: Member) => this.createMember(member),
    getMember: (memberId: string) => this.getMember(memberId),
    listMembersForGym: (gymId: string) => this.listMembersForGym(gymId),
    updateMember: (member: Member) => this.updateMember(member)
  };

  readonly membershipPlans = {
    createMembershipPlan: (plan: MembershipPlan) => this.createMembershipPlan(plan),
    getMembershipPlan: (planId: string) => this.getMembershipPlan(planId),
    listMembershipPlansForGym: (gymId: string) => this.listMembershipPlansForGym(gymId),
    updateMembershipPlan: (plan: MembershipPlan) => this.updateMembershipPlan(plan)
  };

  readonly memberMemberships = {
    createMemberMembership: (membership: MemberMembership) =>
      this.createMemberMembership(membership),
    getMemberMembership: (membershipId: string) => this.getMemberMembership(membershipId),
    listMemberMembershipsForMember: (memberId: string) =>
      this.listMemberMembershipsForMember(memberId),
    updateMemberMembership: (membership: MemberMembership) =>
      this.updateMemberMembership(membership)
  };

  readonly classes = {
    createClassType: (classType: ClassType) => this.createClassType(classType),
    getClassType: (classTypeId: string) => this.getClassType(classTypeId),
    listClassTypesForGym: (gymId: string) => this.listClassTypesForGym(gymId),
    createClassSession: (session: ClassSession) => this.createClassSession(session),
    getClassSession: (sessionId: string) => this.getClassSession(sessionId),
    listClassSessionsForGym: (gymId: string) => this.listClassSessionsForGym(gymId),
    listPublicClassSessionsForGym: (gymId: string, from: Date, to: Date) =>
      this.listPublicClassSessionsForGym(gymId, from, to)
  };

  readonly bookings = {
    createClassBooking: (booking: ClassBooking) => this.createClassBooking(booking),
    getClassBooking: (bookingId: string) => this.getClassBooking(bookingId),
    listClassBookingsForSession: (classSessionId: string) =>
      this.listClassBookingsForSession(classSessionId),
    listClassBookingsForMember: (memberId: string) => this.listClassBookingsForMember(memberId),
    updateClassBooking: (booking: ClassBooking) => this.updateClassBooking(booking)
  };

  readonly reservationResources = {
    createResource: (resource: ReservableResource) => this.createResource(resource),
    getResource: (resourceId: string) => this.getResource(resourceId),
    listResourcesForGym: (gymId: string) => this.listResourcesForGym(gymId),
    updateResource: (resource: ReservableResource) => this.updateResource(resource),
    createAllocation: (allocation: ResourceAllocation) => this.createAllocation(allocation),
    getAllocation: (allocationId: string) => this.getAllocation(allocationId),
    listAllocationsForGym: (gymId: string) => this.listAllocationsForGym(gymId),
    listAllocationsForResource: (resourceId: string) =>
      this.listAllocationsForResource(resourceId),
    listAllocationsForClassSession: (classSessionId: string) =>
      this.listAllocationsForClassSession(classSessionId),
    updateAllocation: (allocation: ResourceAllocation) => this.updateAllocation(allocation),
    createFacilityReservation: (reservation: FacilityReservation) =>
      this.createFacilityReservation(reservation),
    getFacilityReservation: (reservationId: string) =>
      this.getFacilityReservation(reservationId),
    listFacilityReservationsForGym: (gymId: string) =>
      this.listFacilityReservationsForGym(gymId),
    updateFacilityReservation: (reservation: FacilityReservation) =>
      this.updateFacilityReservation(reservation)
  };

  readonly notifications = {
    createNotificationEvent: (event: NotificationEvent) => this.createNotificationEvent(event),
    listNotificationEventsForGym: (gymId: string) => this.listNotificationEventsForGym(gymId)
  };

  readonly checkIns = {
    createCheckIn: (checkIn: CheckIn) => this.createCheckIn(checkIn),
    listCheckInsForMember: (memberId: string) => this.listCheckInsForMember(memberId),
    listCheckInsForGym: (gymId: string) => this.listCheckInsForGym(gymId),
    deleteCheckIn: (checkInId: string, gymId: string) => this.deleteCheckIn(checkInId, gymId)
  };

  readonly accessControl = {
    createAccessDevice: (device: AccessDevice) => this.createAccessDevice(device),
    getAccessDevice: (deviceId: string) => this.getAccessDevice(deviceId),
    findAccessDeviceByApiKeyHash: (apiKeyHash: string) =>
      this.findAccessDeviceByApiKeyHash(apiKeyHash),
    listAccessDevicesForGym: (gymId: string) => this.listAccessDevicesForGym(gymId),
    updateAccessDevice: (device: AccessDevice) => this.updateAccessDevice(device),
    createAccessRule: (rule: AccessRule) => this.createAccessRule(rule),
    listAccessRulesForGym: (gymId: string) => this.listAccessRulesForGym(gymId),
    createAccessEvent: (event: AccessEvent) => this.createAccessEvent(event),
    listAccessEventsForGym: (gymId: string) => this.listAccessEventsForGym(gymId)
  };

  readonly tokens = {
    createRefreshToken: (refreshToken: RefreshToken) => this.createRefreshToken(refreshToken),
    findRefreshTokenByHash: (tokenHash: string) => this.findRefreshTokenByHash(tokenHash),
    listRefreshTokensForUser: (userId: string) => this.listRefreshTokensForUser(userId),
    updateRefreshToken: (refreshToken: RefreshToken) => this.updateRefreshToken(refreshToken),
    createPurposeToken: (purposeToken: PurposeToken) => this.createPurposeToken(purposeToken),
    findPurposeTokenByHash: (tokenHash: string, purpose: PurposeToken["purpose"]) =>
      this.findPurposeTokenByHash(tokenHash, purpose),
    updatePurposeToken: (purposeToken: PurposeToken) => this.updatePurposeToken(purposeToken)
  };

  constructor(
    private readonly executor: QueryExecutor,
    private readonly pool?: TransactionPool
  ) {}

  async transaction<T>(work: (repositories: Repositories) => Promise<T>): Promise<T> {
    if (!this.pool) {
      return work(this);
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(new PostgresRepositories(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createUser(user: User) {
    const result = await this.executor.query<UserRow>(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, status, email_verified_at,
        two_factor_secret, two_factor_enabled_at, recovery_code_hashes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.status,
        user.emailVerifiedAt ?? null,
        user.twoFactorSecret ?? null,
        user.twoFactorEnabledAt ?? null,
        JSON.stringify(user.recoveryCodeHashes),
        user.createdAt,
        user.updatedAt
      ]
    );
    return mapUser(one(result));
  }

  async getUser(userId: string) {
    const result = await this.executor.query<UserRow>("SELECT * FROM users WHERE id = $1", [
      userId
    ]);
    return result.rows[0] ? mapUser(result.rows[0]) : undefined;
  }

  async findUserByEmail(email: string) {
    const result = await this.executor.query<UserRow>("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase()
    ]);
    return result.rows[0] ? mapUser(result.rows[0]) : undefined;
  }

  async updateUser(user: User) {
    const result = await this.executor.query<UserRow>(
      `UPDATE users
      SET email = $2,
          password_hash = $3,
          first_name = $4,
          last_name = $5,
          status = $6,
          email_verified_at = $7,
          two_factor_secret = $8,
          two_factor_enabled_at = $9,
          recovery_code_hashes = $10,
          updated_at = $11
      WHERE id = $1
      RETURNING *`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.status,
        user.emailVerifiedAt ?? null,
        user.twoFactorSecret ?? null,
        user.twoFactorEnabledAt ?? null,
        JSON.stringify(user.recoveryCodeHashes),
        user.updatedAt
      ]
    );
    return mapUser(one(result));
  }

  async createGym(gym: Gym) {
    const result = await this.executor.query<GymRow>(
      `INSERT INTO gyms (
        id, name, slug, owner_user_id, status, timezone, locale, logo_url, stripe_account_id, brand_colors,
        business_info, operating_hours, feature_flags, onboarding_completed_steps, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16)
      RETURNING *`,
      [
        gym.id,
        gym.name,
        gym.slug,
        gym.ownerUserId,
        gym.status,
        gym.timezone,
        gym.locale,
        gym.logoUrl ?? null,
        gym.stripeAccountId ?? null,
        JSON.stringify(gym.brandColors ?? {}),
        JSON.stringify(gym.businessInfo ?? {}),
        JSON.stringify(gym.operatingHours),
        JSON.stringify(gym.featureFlags),
        JSON.stringify(gym.onboardingCompletedSteps),
        gym.createdAt,
        gym.updatedAt
      ]
    );
    return mapGym(one(result));
  }

  async getGym(gymId: string) {
    const result = await this.executor.query<GymRow>("SELECT * FROM gyms WHERE id = $1", [gymId]);
    return result.rows[0] ? mapGym(result.rows[0]) : undefined;
  }

  async findGymBySlug(slug: string) {
    const result = await this.executor.query<GymRow>("SELECT * FROM gyms WHERE slug = $1", [slug]);
    return result.rows[0] ? mapGym(result.rows[0]) : undefined;
  }

  async listGyms() {
    const result = await this.executor.query<GymRow>("SELECT * FROM gyms");
    return result.rows.map(mapGym);
  }

  async updateGym(gym: Gym) {
    const result = await this.executor.query<GymRow>(
      `UPDATE gyms
       SET name = $2,
           timezone = $3,
           locale = $4,
           logo_url = $5,
           stripe_account_id = $6,
           brand_colors = $7::jsonb,
           business_info = $8::jsonb,
           operating_hours = $9::jsonb,
           feature_flags = $10::jsonb,
           onboarding_completed_steps = $11::jsonb,
           status = $12,
           updated_at = $13
       WHERE id = $1
       RETURNING *`,
      [
        gym.id,
        gym.name,
        gym.timezone,
        gym.locale,
        gym.logoUrl ?? null,
        gym.stripeAccountId ?? null,
        JSON.stringify(gym.brandColors ?? {}),
        JSON.stringify(gym.businessInfo ?? {}),
        JSON.stringify(gym.operatingHours),
        JSON.stringify(gym.featureFlags),
        JSON.stringify(gym.onboardingCompletedSteps),
        gym.status,
        gym.updatedAt
      ]
    );
    return mapGym(one(result));
  }

  async createRole(role: Role) {
    const result = await this.executor.query<RoleRow>(
      `INSERT INTO roles (
        id, gym_id, name, permissions, parent_role_id, creates_reservable_resource,
        is_system, created_at, updated_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        role.id,
        role.gymId,
        role.name,
        JSON.stringify(role.permissions),
        role.parentRoleId ?? null,
        role.createsReservableResource,
        role.isSystem,
        role.createdAt,
        role.updatedAt
      ]
    );
    return mapRole(one(result));
  }

  async createRoles(roles: Role[]) {
    const created: Role[] = [];
    for (const role of roles) {
      const result = await this.executor.query<RoleRow>(
        `INSERT INTO roles (
          id, gym_id, name, permissions, parent_role_id, creates_reservable_resource,
          is_system, created_at, updated_at
        ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          role.id,
          role.gymId,
          role.name,
          JSON.stringify(role.permissions),
          role.parentRoleId ?? null,
          role.createsReservableResource,
          role.isSystem,
          role.createdAt,
          role.updatedAt
        ]
      );
      created.push(mapRole(one(result)));
    }
    return created;
  }

  async getRole(roleId: string) {
    const result = await this.executor.query<RoleRow>("SELECT * FROM roles WHERE id = $1", [
      roleId
    ]);
    return result.rows[0] ? mapRole(result.rows[0]) : undefined;
  }

  async listRolesForGym(gymId: string) {
    const result = await this.executor.query<RoleRow>(
      "SELECT * FROM roles WHERE gym_id = $1 ORDER BY name",
      [gymId]
    );
    return result.rows.map(mapRole);
  }

  async updateRole(role: Role) {
    const result = await this.executor.query<RoleRow>(
      `UPDATE roles
       SET name = $2,
           permissions = $3::jsonb,
           parent_role_id = $4,
           creates_reservable_resource = $5,
           updated_at = $6
       WHERE id = $1
       RETURNING *`,
      [
        role.id,
        role.name,
        JSON.stringify(role.permissions),
        role.parentRoleId ?? null,
        role.createsReservableResource,
        role.updatedAt
      ]
    );
    return mapRole(one(result));
  }

  async deleteRole(roleId: string) {
    await this.executor.query("DELETE FROM roles WHERE id = $1", [roleId]);
  }

  async createGymUser(gymUser: GymUser) {
    const result = await this.executor.query<GymUserRow>(
      `INSERT INTO gym_users (
        id, gym_id, user_id, role_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        gymUser.id,
        gymUser.gymId,
        gymUser.userId,
        gymUser.roleId,
        gymUser.status,
        gymUser.createdAt,
        gymUser.updatedAt
      ]
    );
    return mapGymUser(one(result));
  }

  async findGymUser(gymId: string, userId: string) {
    const result = await this.executor.query<GymUserRow>(
      "SELECT * FROM gym_users WHERE gym_id = $1 AND user_id = $2",
      [gymId, userId]
    );
    return result.rows[0] ? mapGymUser(result.rows[0]) : undefined;
  }

  async listGymUsersForGym(gymId: string) {
    const result = await this.executor.query<GymUserRow>(
      "SELECT * FROM gym_users WHERE gym_id = $1 ORDER BY created_at",
      [gymId]
    );
    return result.rows.map(mapGymUser);
  }

  async listGymMemberships(userId: string) {
    const result = await this.executor.query<GymUserRow>(
      "SELECT * FROM gym_users WHERE user_id = $1 ORDER BY created_at",
      [userId]
    );
    return result.rows.map(mapGymUser);
  }

  async updateGymUser(gymUser: GymUser) {
    const result = await this.executor.query<GymUserRow>(
      `UPDATE gym_users
      SET role_id = $2,
          status = $3,
          updated_at = $4
      WHERE id = $1
      RETURNING *`,
      [gymUser.id, gymUser.roleId, gymUser.status, gymUser.updatedAt]
    );
    return mapGymUser(one(result));
  }

  async createStaffInvite(invite: StaffInvite) {
    const result = await this.executor.query<StaffInviteRow>(
      `INSERT INTO staff_invites (
        id, gym_id, email, role_id, invited_by_user_id, token_hash, status,
        expires_at, accepted_at, revoked_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        invite.id,
        invite.gymId,
        invite.email,
        invite.roleId,
        invite.invitedByUserId,
        invite.tokenHash,
        invite.status,
        invite.expiresAt,
        invite.acceptedAt ?? null,
        invite.revokedAt ?? null,
        invite.createdAt,
        invite.updatedAt
      ]
    );
    return mapStaffInvite(one(result));
  }

  async getStaffInvite(inviteId: string) {
    const result = await this.executor.query<StaffInviteRow>(
      "SELECT * FROM staff_invites WHERE id = $1",
      [inviteId]
    );
    return result.rows[0] ? mapStaffInvite(result.rows[0]) : undefined;
  }

  async findStaffInviteByTokenHash(tokenHash: string) {
    const result = await this.executor.query<StaffInviteRow>(
      "SELECT * FROM staff_invites WHERE token_hash = $1",
      [tokenHash]
    );
    return result.rows[0] ? mapStaffInvite(result.rows[0]) : undefined;
  }

  async findPendingStaffInvite(gymId: string, email: string) {
    const result = await this.executor.query<StaffInviteRow>(
      "SELECT * FROM staff_invites WHERE gym_id = $1 AND email = $2 AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
      [gymId, email.toLowerCase()]
    );
    return result.rows[0] ? mapStaffInvite(result.rows[0]) : undefined;
  }

  async listStaffInvitesForGym(gymId: string) {
    const result = await this.executor.query<StaffInviteRow>(
      "SELECT * FROM staff_invites WHERE gym_id = $1 ORDER BY created_at DESC",
      [gymId]
    );
    return result.rows.map(mapStaffInvite);
  }

  async updateStaffInvite(invite: StaffInvite) {
    const result = await this.executor.query<StaffInviteRow>(
      `UPDATE staff_invites
      SET role_id = $2,
          status = $3,
          expires_at = $4,
          accepted_at = $5,
          revoked_at = $6,
          updated_at = $7
      WHERE id = $1
      RETURNING *`,
      [
        invite.id,
        invite.roleId,
        invite.status,
        invite.expiresAt,
        invite.acceptedAt ?? null,
        invite.revokedAt ?? null,
        invite.updatedAt
      ]
    );
    return mapStaffInvite(one(result));
  }

  async createStaffAuditLog(entry: StaffAuditLog) {
    const result = await this.executor.query<StaffAuditLogRow>(
      `INSERT INTO staff_audit_logs (
        id, gym_id, actor_user_id, target_user_id, action, previous_role_id,
        next_role_id, previous_status, next_status, reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        entry.id,
        entry.gymId,
        entry.actorUserId,
        entry.targetUserId,
        entry.action,
        entry.previousRoleId ?? null,
        entry.nextRoleId ?? null,
        entry.previousStatus ?? null,
        entry.nextStatus ?? null,
        entry.reason ?? null,
        entry.createdAt
      ]
    );
    return mapStaffAuditLog(one(result));
  }

  async listStaffAuditLogsForGym(gymId: string) {
    const result = await this.executor.query<StaffAuditLogRow>(
      "SELECT * FROM staff_audit_logs WHERE gym_id = $1 ORDER BY created_at DESC",
      [gymId]
    );
    return result.rows.map(mapStaffAuditLog);
  }

  async createStaffShift(shift: StaffShift) {
    const result = await this.executor.query<StaffShiftRow>(
      `INSERT INTO staff_shifts (
        id, gym_id, user_id, location_id, role_id, starts_at, ends_at,
        notes, created_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        shift.id,
        shift.gymId,
        shift.userId,
        shift.locationId ?? null,
        shift.roleId,
        shift.startsAt,
        shift.endsAt,
        shift.notes ?? null,
        shift.createdByUserId,
        shift.createdAt,
        shift.updatedAt
      ]
    );
    return mapStaffShift(one(result));
  }

  async updateStaffShift(shift: StaffShift) {
    const result = await this.executor.query<StaffShiftRow>(
      `UPDATE staff_shifts
       SET user_id = $2,
           location_id = $3,
           role_id = $4,
           starts_at = $5,
           ends_at = $6,
           notes = $7,
           updated_at = $8
       WHERE id = $1
       RETURNING *`,
      [
        shift.id,
        shift.userId,
        shift.locationId ?? null,
        shift.roleId,
        shift.startsAt,
        shift.endsAt,
        shift.notes ?? null,
        shift.updatedAt
      ]
    );
    return mapStaffShift(one(result));
  }

  async listStaffShiftsForGym(gymId: string) {
    const result = await this.executor.query<StaffShiftRow>(
      "SELECT * FROM staff_shifts WHERE gym_id = $1 ORDER BY starts_at",
      [gymId]
    );
    return result.rows.map(mapStaffShift);
  }

  async listStaffShiftsForStaff(gymId: string, userId: string) {
    const result = await this.executor.query<StaffShiftRow>(
      "SELECT * FROM staff_shifts WHERE gym_id = $1 AND user_id = $2 ORDER BY starts_at",
      [gymId, userId]
    );
    return result.rows.map(mapStaffShift);
  }

  async createStaffTimeEntry(entry: StaffTimeEntry) {
    const result = await this.executor.query<StaffTimeEntryRow>(
      `INSERT INTO staff_time_entries (
        id, gym_id, user_id, location_id, clocked_in_at, clocked_out_at,
        clocked_in_by_user_id, clocked_out_by_user_id, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        entry.id,
        entry.gymId,
        entry.userId,
        entry.locationId ?? null,
        entry.clockedInAt,
        entry.clockedOutAt ?? null,
        entry.clockedInByUserId,
        entry.clockedOutByUserId ?? null,
        entry.notes ?? null,
        entry.createdAt,
        entry.updatedAt
      ]
    );
    return mapStaffTimeEntry(one(result));
  }

  async updateStaffTimeEntry(entry: StaffTimeEntry) {
    const result = await this.executor.query<StaffTimeEntryRow>(
      `UPDATE staff_time_entries
       SET location_id = $4,
           clocked_out_at = $5,
           clocked_out_by_user_id = $6,
           notes = $7,
           updated_at = $8
       WHERE id = $1 AND gym_id = $2 AND user_id = $3
       RETURNING *`,
      [
        entry.id,
        entry.gymId,
        entry.userId,
        entry.locationId ?? null,
        entry.clockedOutAt ?? null,
        entry.clockedOutByUserId ?? null,
        entry.notes ?? null,
        entry.updatedAt
      ]
    );
    return mapStaffTimeEntry(one(result));
  }

  async listStaffTimeEntriesForGym(gymId: string) {
    const result = await this.executor.query<StaffTimeEntryRow>(
      "SELECT * FROM staff_time_entries WHERE gym_id = $1 ORDER BY clocked_in_at DESC",
      [gymId]
    );
    return result.rows.map(mapStaffTimeEntry);
  }

  async listStaffTimeEntriesForStaff(gymId: string, userId: string) {
    const result = await this.executor.query<StaffTimeEntryRow>(
      `SELECT * FROM staff_time_entries
       WHERE gym_id = $1 AND user_id = $2
       ORDER BY clocked_in_at DESC`,
      [gymId, userId]
    );
    return result.rows.map(mapStaffTimeEntry);
  }

  async findOpenStaffTimeEntry(gymId: string, userId: string) {
    const result = await this.executor.query<StaffTimeEntryRow>(
      `SELECT * FROM staff_time_entries
       WHERE gym_id = $1 AND user_id = $2 AND clocked_out_at IS NULL
       ORDER BY clocked_in_at DESC
       LIMIT 1`,
      [gymId, userId]
    );
    return result.rows[0] ? mapStaffTimeEntry(result.rows[0]) : undefined;
  }

  async getSchedulerSettings(gymId: string) {
    const result = await this.executor.query<SchedulerSettingsRow>(
      "SELECT * FROM scheduler_settings WHERE gym_id = $1",
      [gymId]
    );
    return result.rows[0] ? mapSchedulerSettings(result.rows[0]) : undefined;
  }

  async upsertSchedulerSettings(settings: SchedulerSettings) {
    const result = await this.executor.query<SchedulerSettingsRow>(
      `INSERT INTO scheduler_settings (
        gym_id, planning_horizon_days, created_at, updated_at
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (gym_id) DO UPDATE
        SET planning_horizon_days = EXCLUDED.planning_horizon_days,
            updated_at = EXCLUDED.updated_at
      RETURNING *`,
      [
        settings.gymId,
        settings.planningHorizonDays,
        settings.createdAt,
        settings.updatedAt
      ]
    );
    return mapSchedulerSettings(one(result));
  }

  async createCoverageRule(rule: SchedulerCoverageRule) {
    const result = await this.executor.query<SchedulerCoverageRuleRow>(
      `INSERT INTO scheduler_coverage_rules (
        id, gym_id, name, location_id, role_id, days_of_week, start_time, end_time,
        required_staff, created_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        rule.id,
        rule.gymId,
        rule.name,
        rule.locationId ?? null,
        rule.roleId,
        JSON.stringify(rule.daysOfWeek),
        rule.startTime,
        rule.endTime,
        rule.requiredStaff,
        rule.createdByUserId,
        rule.createdAt,
        rule.updatedAt
      ]
    );
    return mapSchedulerCoverageRule(one(result));
  }

  async listCoverageRulesForGym(gymId: string) {
    const result = await this.executor.query<SchedulerCoverageRuleRow>(
      "SELECT * FROM scheduler_coverage_rules WHERE gym_id = $1 ORDER BY name, start_time",
      [gymId]
    );
    return result.rows.map(mapSchedulerCoverageRule);
  }

  async createAvailability(availability: SchedulerAvailability) {
    const result = await this.executor.query<SchedulerAvailabilityRow>(
      `INSERT INTO scheduler_availabilities (
        id, gym_id, user_id, days_of_week, start_time, end_time, preference,
        notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        availability.id,
        availability.gymId,
        availability.userId,
        JSON.stringify(availability.daysOfWeek),
        availability.startTime,
        availability.endTime,
        availability.preference,
        availability.notes ?? null,
        availability.createdAt,
        availability.updatedAt
      ]
    );
    return mapSchedulerAvailability(one(result));
  }

  async replaceAvailabilitiesForStaff(
    gymId: string,
    userId: string,
    availabilities: SchedulerAvailability[]
  ) {
    await this.executor.query(
      "DELETE FROM scheduler_availabilities WHERE gym_id = $1 AND user_id = $2",
      [gymId, userId]
    );
    const created: SchedulerAvailability[] = [];
    for (const availability of availabilities) {
      created.push(await this.createAvailability(availability));
    }
    return created;
  }

  async listAvailabilitiesForGym(gymId: string) {
    const result = await this.executor.query<SchedulerAvailabilityRow>(
      "SELECT * FROM scheduler_availabilities WHERE gym_id = $1 ORDER BY user_id, start_time",
      [gymId]
    );
    return result.rows.map(mapSchedulerAvailability);
  }

  async listAvailabilitiesForStaff(gymId: string, userId: string) {
    const result = await this.executor.query<SchedulerAvailabilityRow>(
      `SELECT * FROM scheduler_availabilities
       WHERE gym_id = $1 AND user_id = $2
       ORDER BY start_time`,
      [gymId, userId]
    );
    return result.rows.map(mapSchedulerAvailability);
  }

  async createPreferenceRequest(request: SchedulerPreferenceRequest) {
    const result = await this.executor.query<SchedulerPreferenceRequestRow>(
      `INSERT INTO scheduler_preference_requests (
        id, gym_id, user_id, days_of_week, start_time, end_time, preference,
        notes, status, resolution_note, resolved_by_user_id, resolved_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        request.id,
        request.gymId,
        request.userId,
        JSON.stringify(request.daysOfWeek),
        request.startTime,
        request.endTime,
        request.preference,
        request.notes ?? null,
        request.status,
        request.resolutionNote ?? null,
        request.resolvedByUserId ?? null,
        request.resolvedAt ?? null,
        request.createdAt,
        request.updatedAt
      ]
    );
    return mapSchedulerPreferenceRequest(one(result));
  }

  async updatePreferenceRequest(request: SchedulerPreferenceRequest) {
    const result = await this.executor.query<SchedulerPreferenceRequestRow>(
      `UPDATE scheduler_preference_requests
       SET status = $2,
           resolution_note = $3,
           resolved_by_user_id = $4,
           resolved_at = $5,
           updated_at = $6
       WHERE id = $1
       RETURNING *`,
      [
        request.id,
        request.status,
        request.resolutionNote ?? null,
        request.resolvedByUserId ?? null,
        request.resolvedAt ?? null,
        request.updatedAt
      ]
    );
    return mapSchedulerPreferenceRequest(one(result));
  }

  async getPreferenceRequest(requestId: string) {
    const result = await this.executor.query<SchedulerPreferenceRequestRow>(
      "SELECT * FROM scheduler_preference_requests WHERE id = $1",
      [requestId]
    );
    return result.rows[0] ? mapSchedulerPreferenceRequest(result.rows[0]) : undefined;
  }

  async listPreferenceRequestsForGym(gymId: string) {
    const result = await this.executor.query<SchedulerPreferenceRequestRow>(
      "SELECT * FROM scheduler_preference_requests WHERE gym_id = $1 ORDER BY created_at DESC",
      [gymId]
    );
    return result.rows.map(mapSchedulerPreferenceRequest);
  }

  async listPreferenceRequestsForStaff(gymId: string, userId: string) {
    const result = await this.executor.query<SchedulerPreferenceRequestRow>(
      `SELECT * FROM scheduler_preference_requests
       WHERE gym_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [gymId, userId]
    );
    return result.rows.map(mapSchedulerPreferenceRequest);
  }

  async createRequest(request: SchedulerRequest) {
    const result = await this.executor.query<SchedulerRequestRow>(
      `INSERT INTO scheduler_requests (
        id, gym_id, user_id, shift_id, request_type, message, status,
        suggested_replacement_user_id, resolution_note, resolved_by_user_id,
        resolved_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        request.id,
        request.gymId,
        request.userId,
        request.shiftId ?? null,
        request.requestType,
        request.message,
        request.status,
        request.suggestedReplacementUserId ?? null,
        request.resolutionNote ?? null,
        request.resolvedByUserId ?? null,
        request.resolvedAt ?? null,
        request.createdAt,
        request.updatedAt
      ]
    );
    return mapSchedulerRequest(one(result));
  }

  async updateRequest(request: SchedulerRequest) {
    const result = await this.executor.query<SchedulerRequestRow>(
      `UPDATE scheduler_requests
       SET status = $2,
           suggested_replacement_user_id = $3,
           resolution_note = $4,
           resolved_by_user_id = $5,
           resolved_at = $6,
           updated_at = $7
       WHERE id = $1
       RETURNING *`,
      [
        request.id,
        request.status,
        request.suggestedReplacementUserId ?? null,
        request.resolutionNote ?? null,
        request.resolvedByUserId ?? null,
        request.resolvedAt ?? null,
        request.updatedAt
      ]
    );
    return mapSchedulerRequest(one(result));
  }

  async getRequest(requestId: string) {
    const result = await this.executor.query<SchedulerRequestRow>(
      "SELECT * FROM scheduler_requests WHERE id = $1",
      [requestId]
    );
    return result.rows[0] ? mapSchedulerRequest(result.rows[0]) : undefined;
  }

  async listRequestsForGym(gymId: string) {
    const result = await this.executor.query<SchedulerRequestRow>(
      "SELECT * FROM scheduler_requests WHERE gym_id = $1 ORDER BY created_at DESC",
      [gymId]
    );
    return result.rows.map(mapSchedulerRequest);
  }

  async listRequestsForStaff(gymId: string, userId: string) {
    const result = await this.executor.query<SchedulerRequestRow>(
      `SELECT * FROM scheduler_requests
       WHERE gym_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [gymId, userId]
    );
    return result.rows.map(mapSchedulerRequest);
  }

  async createLocation(location: Location) {
    const result = await this.executor.query<LocationRow>(
      `INSERT INTO locations (
        id, gym_id, name, address, timezone, phone, operating_hours, status,
        archived_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb, $8, $9, $10, $11)
      RETURNING *`,
      [
        location.id,
        location.gymId,
        location.name,
        JSON.stringify(location.address),
        location.timezone,
        location.phone ?? null,
        JSON.stringify(location.operatingHours),
        location.status,
        location.archivedAt ?? null,
        location.createdAt,
        location.updatedAt
      ]
    );
    return mapLocation(one(result));
  }

  async getLocation(locationId: string) {
    const result = await this.executor.query<LocationRow>("SELECT * FROM locations WHERE id = $1", [
      locationId
    ]);
    return result.rows[0] ? mapLocation(result.rows[0]) : undefined;
  }

  async listLocationsForGym(gymId: string) {
    const result = await this.executor.query<LocationRow>(
      "SELECT * FROM locations WHERE gym_id = $1 ORDER BY created_at",
      [gymId]
    );
    return result.rows.map(mapLocation);
  }

  async updateLocation(location: Location) {
    const result = await this.executor.query<LocationRow>(
      `UPDATE locations
      SET name = $2,
          address = $3::jsonb,
          timezone = $4,
          phone = $5,
          operating_hours = $6::jsonb,
          status = $7,
          archived_at = $8,
          updated_at = $9
      WHERE id = $1
      RETURNING *`,
      [
        location.id,
        location.name,
        JSON.stringify(location.address),
        location.timezone,
        location.phone ?? null,
        JSON.stringify(location.operatingHours),
        location.status,
        location.archivedAt ?? null,
        location.updatedAt
      ]
    );
    return mapLocation(one(result));
  }

  async createMember(member: Member) {
    const result = await this.executor.query<MemberRow>(
      `INSERT INTO members (
        id, gym_id, first_name, last_name, email, phone, barcode, profile_image_url, status,
        record_status, lead_stage, emergency_contact, notes, tag_names, archived_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14::jsonb, $15, $16, $17)
      RETURNING *`,
      [
        member.id,
        member.gymId,
        member.firstName,
        member.lastName,
        member.email ?? null,
        member.phone ?? null,
        member.barcode ?? null,
        member.profileImageUrl ?? null,
        member.status,
        member.recordStatus,
        member.leadStage,
        member.emergencyContact ? JSON.stringify(member.emergencyContact) : null,
        member.notes ?? null,
        JSON.stringify(member.tagNames),
        member.archivedAt ?? null,
        member.createdAt,
        member.updatedAt
      ]
    );
    return mapMember(one(result));
  }

  async getMember(memberId: string) {
    const result = await this.executor.query<MemberRow>("SELECT * FROM members WHERE id = $1", [
      memberId
    ]);
    return result.rows[0] ? mapMember(result.rows[0]) : undefined;
  }

  async listMembersForGym(gymId: string) {
    const result = await this.executor.query<MemberRow>(
      "SELECT * FROM members WHERE gym_id = $1 ORDER BY created_at",
      [gymId]
    );
    return result.rows.map(mapMember);
  }

  async updateMember(member: Member) {
    const result = await this.executor.query<MemberRow>(
      `UPDATE members
      SET first_name = $2,
          last_name = $3,
          email = $4,
          phone = $5,
          barcode = $6,
          profile_image_url = $7,
          status = $8,
          record_status = $9,
          lead_stage = $10,
          emergency_contact = $11::jsonb,
          notes = $12,
          tag_names = $13::jsonb,
          archived_at = $14,
          updated_at = $15
      WHERE id = $1
      RETURNING *`,
      [
        member.id,
        member.firstName,
        member.lastName,
        member.email ?? null,
        member.phone ?? null,
        member.barcode ?? null,
        member.profileImageUrl ?? null,
        member.status,
        member.recordStatus,
        member.leadStage,
        member.emergencyContact ? JSON.stringify(member.emergencyContact) : null,
        member.notes ?? null,
        JSON.stringify(member.tagNames),
        member.archivedAt ?? null,
        member.updatedAt
      ]
    );
    return mapMember(one(result));
  }

  async createMembershipPlan(plan: MembershipPlan) {
    const result = await this.executor.query<MembershipPlanRow>(
      `INSERT INTO membership_plans (
        id, gym_id, name, description, billing_interval, price_cents, signup_fee_cents,
        trial_days, auto_renew, contract_length_months, class_access_limit, is_public,
        status, archived_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        plan.id,
        plan.gymId,
        plan.name,
        plan.description ?? null,
        plan.billingInterval,
        plan.priceCents,
        plan.signupFeeCents,
        plan.trialDays,
        plan.autoRenew,
        plan.contractLengthMonths ?? null,
        plan.classAccessLimit ?? null,
        plan.isPublic,
        plan.status,
        plan.archivedAt ?? null,
        plan.createdAt,
        plan.updatedAt
      ]
    );
    return mapMembershipPlan(one(result));
  }

  async getMembershipPlan(planId: string) {
    const result = await this.executor.query<MembershipPlanRow>(
      "SELECT * FROM membership_plans WHERE id = $1",
      [planId]
    );
    return result.rows[0] ? mapMembershipPlan(result.rows[0]) : undefined;
  }

  async listMembershipPlansForGym(gymId: string) {
    const result = await this.executor.query<MembershipPlanRow>(
      "SELECT * FROM membership_plans WHERE gym_id = $1 ORDER BY created_at",
      [gymId]
    );
    return result.rows.map(mapMembershipPlan);
  }

  async updateMembershipPlan(plan: MembershipPlan) {
    const result = await this.executor.query<MembershipPlanRow>(
      `UPDATE membership_plans
      SET name = $2,
          description = $3,
          billing_interval = $4,
          price_cents = $5,
          signup_fee_cents = $6,
          trial_days = $7,
          auto_renew = $8,
          contract_length_months = $9,
          class_access_limit = $10,
          is_public = $11,
          status = $12,
          archived_at = $13,
          updated_at = $14
      WHERE id = $1
      RETURNING *`,
      [
        plan.id,
        plan.name,
        plan.description ?? null,
        plan.billingInterval,
        plan.priceCents,
        plan.signupFeeCents,
        plan.trialDays,
        plan.autoRenew,
        plan.contractLengthMonths ?? null,
        plan.classAccessLimit ?? null,
        plan.isPublic,
        plan.status,
        plan.archivedAt ?? null,
        plan.updatedAt
      ]
    );
    return mapMembershipPlan(one(result));
  }

  async createMemberMembership(membership: MemberMembership) {
    const result = await this.executor.query<MemberMembershipRow>(
      `INSERT INTO member_memberships (
        id, gym_id, member_id, plan_id, status, starts_at, ends_at,
        cancelled_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        membership.id,
        membership.gymId,
        membership.memberId,
        membership.planId,
        membership.status,
        membership.startsAt,
        membership.endsAt ?? null,
        membership.cancelledAt ?? null,
        membership.createdAt,
        membership.updatedAt
      ]
    );
    return mapMemberMembership(one(result));
  }

  async getMemberMembership(membershipId: string) {
    const result = await this.executor.query<MemberMembershipRow>(
      "SELECT * FROM member_memberships WHERE id = $1",
      [membershipId]
    );
    return result.rows[0] ? mapMemberMembership(result.rows[0]) : undefined;
  }

  async listMemberMembershipsForMember(memberId: string) {
    const result = await this.executor.query<MemberMembershipRow>(
      `SELECT * FROM member_memberships
      WHERE member_id = $1
      ORDER BY starts_at`,
      [memberId]
    );
    return result.rows.map(mapMemberMembership);
  }

  async updateMemberMembership(membership: MemberMembership) {
    const result = await this.executor.query<MemberMembershipRow>(
      `UPDATE member_memberships
      SET plan_id = $2,
          status = $3,
          starts_at = $4,
          ends_at = $5,
          cancelled_at = $6,
          updated_at = $7
      WHERE id = $1
      RETURNING *`,
      [
        membership.id,
        membership.planId,
        membership.status,
        membership.startsAt,
        membership.endsAt ?? null,
        membership.cancelledAt ?? null,
        membership.updatedAt
      ]
    );
    return mapMemberMembership(one(result));
  }

  async createClassType(classType: ClassType) {
    const result = await this.executor.query<ClassTypeRow>(
      `INSERT INTO class_types (
        id, gym_id, name, description, default_duration_minutes, default_capacity,
        default_waitlist_capacity, is_public, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        classType.id,
        classType.gymId,
        classType.name,
        classType.description ?? null,
        classType.defaultDurationMinutes,
        classType.defaultCapacity,
        classType.defaultWaitlistCapacity,
        classType.isPublic,
        classType.createdAt,
        classType.updatedAt
      ]
    );
    return mapClassType(one(result));
  }

  async getClassType(classTypeId: string) {
    const result = await this.executor.query<ClassTypeRow>(
      "SELECT * FROM class_types WHERE id = $1",
      [classTypeId]
    );
    return result.rows[0] ? mapClassType(result.rows[0]) : undefined;
  }

  async listClassTypesForGym(gymId: string) {
    const result = await this.executor.query<ClassTypeRow>(
      "SELECT * FROM class_types WHERE gym_id = $1 ORDER BY created_at",
      [gymId]
    );
    return result.rows.map(mapClassType);
  }

  async createClassSession(session: ClassSession) {
    const result = await this.executor.query<ClassSessionRow>(
      `INSERT INTO class_sessions (
        id, gym_id, class_type_id, location_id, trainer_user_id, room_name,
        starts_at, ends_at, capacity, waitlist_capacity, cancellation_cutoff_minutes,
        late_cancellation_fee_cents, status, cancelled_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        session.id,
        session.gymId,
        session.classTypeId,
        session.locationId,
        session.trainerUserId ?? null,
        session.roomName ?? null,
        session.startsAt,
        session.endsAt,
        session.capacity,
        session.waitlistCapacity,
        session.cancellationCutoffMinutes,
        session.lateCancellationFeeCents,
        session.status,
        session.cancelledAt ?? null,
        session.createdAt,
        session.updatedAt
      ]
    );
    return mapClassSession(one(result));
  }

  async getClassSession(sessionId: string) {
    const result = await this.executor.query<ClassSessionRow>(
      "SELECT * FROM class_sessions WHERE id = $1",
      [sessionId]
    );
    return result.rows[0] ? mapClassSession(result.rows[0]) : undefined;
  }

  async listClassSessionsForGym(gymId: string) {
    const result = await this.executor.query<ClassSessionRow>(
      "SELECT * FROM class_sessions WHERE gym_id = $1 ORDER BY starts_at",
      [gymId]
    );
    return result.rows.map(mapClassSession);
  }

  async listPublicClassSessionsForGym(gymId: string, from: Date, to: Date) {
    const result = await this.executor.query<ClassSessionRow>(
      `SELECT class_sessions.*
      FROM class_sessions
      JOIN class_types ON class_types.id = class_sessions.class_type_id
      WHERE class_sessions.gym_id = $1
        AND class_types.is_public = true
        AND class_sessions.status = 'scheduled'
        AND class_sessions.starts_at >= $2
        AND class_sessions.starts_at <= $3
      ORDER BY class_sessions.starts_at`,
      [gymId, from, to]
    );
    return result.rows.map(mapClassSession);
  }

  async createClassBooking(booking: ClassBooking) {
    const result = await this.executor.query<ClassBookingRow>(
      `INSERT INTO class_bookings (
        id, gym_id, class_session_id, member_id, status, waitlist_position, source,
        created_by_user_id, booked_at, cancelled_at, cancelled_by_user_id, cancellation_reason,
        is_late_cancellation, late_cancellation_fee_cents, staff_override, override_reason,
        promoted_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        booking.id,
        booking.gymId,
        booking.classSessionId,
        booking.memberId,
        booking.status,
        booking.waitlistPosition ?? null,
        booking.source,
        booking.createdByUserId ?? null,
        booking.bookedAt,
        booking.cancelledAt ?? null,
        booking.cancelledByUserId ?? null,
        booking.cancellationReason ?? null,
        booking.isLateCancellation,
        booking.lateCancellationFeeCents,
        booking.staffOverride,
        booking.overrideReason ?? null,
        booking.promotedAt ?? null,
        booking.createdAt,
        booking.updatedAt
      ]
    );
    return mapClassBooking(one(result));
  }

  async getClassBooking(bookingId: string) {
    const result = await this.executor.query<ClassBookingRow>(
      "SELECT * FROM class_bookings WHERE id = $1",
      [bookingId]
    );
    return result.rows[0] ? mapClassBooking(result.rows[0]) : undefined;
  }

  async listClassBookingsForSession(classSessionId: string) {
    const result = await this.executor.query<ClassBookingRow>(
      `SELECT * FROM class_bookings
      WHERE class_session_id = $1
      ORDER BY waitlist_position NULLS LAST, created_at`,
      [classSessionId]
    );
    return result.rows.map(mapClassBooking);
  }

  async listClassBookingsForMember(memberId: string) {
    const result = await this.executor.query<ClassBookingRow>(
      `SELECT * FROM class_bookings
      WHERE member_id = $1
      ORDER BY created_at`,
      [memberId]
    );
    return result.rows.map(mapClassBooking);
  }

  async updateClassBooking(booking: ClassBooking) {
    const result = await this.executor.query<ClassBookingRow>(
      `UPDATE class_bookings
      SET status = $2,
          waitlist_position = $3,
          source = $4,
          created_by_user_id = $5,
          booked_at = $6,
          cancelled_at = $7,
          cancelled_by_user_id = $8,
          cancellation_reason = $9,
          is_late_cancellation = $10,
          late_cancellation_fee_cents = $11,
          staff_override = $12,
          override_reason = $13,
          promoted_at = $14,
          updated_at = $15
      WHERE id = $1
      RETURNING *`,
      [
        booking.id,
        booking.status,
        booking.waitlistPosition ?? null,
        booking.source,
        booking.createdByUserId ?? null,
        booking.bookedAt,
        booking.cancelledAt ?? null,
        booking.cancelledByUserId ?? null,
        booking.cancellationReason ?? null,
        booking.isLateCancellation,
        booking.lateCancellationFeeCents,
        booking.staffOverride,
        booking.overrideReason ?? null,
        booking.promotedAt ?? null,
        booking.updatedAt
      ]
    );
    return mapClassBooking(one(result));
  }

  async createResource(resource: ReservableResource) {
    const result = await this.executor.query<ReservableResourceRow>(
      `INSERT INTO reservable_resources (
        id, gym_id, location_id, parent_resource_id, name, resource_type, status,
        is_bookable, is_exclusive, capacity, amenities, rentable_hours, slot_rules,
        pricing, payment_requirement, confirmation_mode, cancellation_policy,
        linked_staff_user_id, created_from_role_id, auto_managed,
        archived_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16, $17::jsonb, $18, $19, $20, $21, $22, $23)
      RETURNING *`,
      [
        resource.id,
        resource.gymId,
        resource.locationId ?? null,
        resource.parentResourceId ?? null,
        resource.name,
        resource.resourceType,
        resource.status,
        resource.isBookable,
        resource.isExclusive,
        resource.capacity,
        JSON.stringify(resource.amenities),
        resource.rentableHours ? JSON.stringify(resource.rentableHours) : null,
        JSON.stringify(resource.slotRules),
        JSON.stringify(resource.pricing),
        resource.paymentRequirement,
        resource.confirmationMode,
        JSON.stringify(resource.cancellationPolicy),
        resource.linkedStaffUserId ?? null,
        resource.createdFromRoleId ?? null,
        resource.autoManaged ?? false,
        resource.archivedAt ?? null,
        resource.createdAt,
        resource.updatedAt
      ]
    );
    return mapReservableResource(one(result));
  }

  async getResource(resourceId: string) {
    const result = await this.executor.query<ReservableResourceRow>(
      "SELECT * FROM reservable_resources WHERE id = $1",
      [resourceId]
    );
    return result.rows[0] ? mapReservableResource(result.rows[0]) : undefined;
  }

  async listResourcesForGym(gymId: string) {
    const result = await this.executor.query<ReservableResourceRow>(
      "SELECT * FROM reservable_resources WHERE gym_id = $1 ORDER BY name",
      [gymId]
    );
    return result.rows.map(mapReservableResource);
  }

  async updateResource(resource: ReservableResource) {
    const result = await this.executor.query<ReservableResourceRow>(
      `UPDATE reservable_resources
      SET name = $2,
          resource_type = $3,
          status = $4,
          is_bookable = $5,
          is_exclusive = $6,
          capacity = $7,
          amenities = $8::jsonb,
          rentable_hours = $9::jsonb,
          slot_rules = $10::jsonb,
          pricing = $11::jsonb,
          payment_requirement = $12,
          confirmation_mode = $13,
          cancellation_policy = $14::jsonb,
          linked_staff_user_id = $15,
          created_from_role_id = $16,
          auto_managed = $17,
          archived_at = $18,
          updated_at = $19
      WHERE id = $1
      RETURNING *`,
      [
        resource.id,
        resource.name,
        resource.resourceType,
        resource.status,
        resource.isBookable,
        resource.isExclusive,
        resource.capacity,
        JSON.stringify(resource.amenities),
        resource.rentableHours ? JSON.stringify(resource.rentableHours) : null,
        JSON.stringify(resource.slotRules),
        JSON.stringify(resource.pricing),
        resource.paymentRequirement,
        resource.confirmationMode,
        JSON.stringify(resource.cancellationPolicy),
        resource.linkedStaffUserId ?? null,
        resource.createdFromRoleId ?? null,
        resource.autoManaged ?? false,
        resource.archivedAt ?? null,
        resource.updatedAt
      ]
    );
    return mapReservableResource(one(result));
  }

  async createAllocation(allocation: ResourceAllocation) {
    const result = await this.executor.query<ResourceAllocationRow>(
      `INSERT INTO resource_allocations (
        id, gym_id, resource_id, source, class_session_id, facility_reservation_id,
        starts_at, ends_at, buffer_before_minutes, buffer_after_minutes,
        staff_override, override_reason, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        allocation.id,
        allocation.gymId,
        allocation.resourceId,
        allocation.source,
        allocation.classSessionId ?? null,
        allocation.facilityReservationId ?? null,
        allocation.startsAt,
        allocation.endsAt,
        allocation.bufferBeforeMinutes,
        allocation.bufferAfterMinutes,
        allocation.staffOverride,
        allocation.overrideReason ?? null,
        allocation.createdAt,
        allocation.updatedAt
      ]
    );
    return mapResourceAllocation(one(result));
  }

  async getAllocation(allocationId: string) {
    const result = await this.executor.query<ResourceAllocationRow>(
      "SELECT * FROM resource_allocations WHERE id = $1",
      [allocationId]
    );
    return result.rows[0] ? mapResourceAllocation(result.rows[0]) : undefined;
  }

  async listAllocationsForGym(gymId: string) {
    const result = await this.executor.query<ResourceAllocationRow>(
      "SELECT * FROM resource_allocations WHERE gym_id = $1 ORDER BY starts_at, id",
      [gymId]
    );
    return result.rows.map(mapResourceAllocation);
  }

  async listAllocationsForResource(resourceId: string) {
    const result = await this.executor.query<ResourceAllocationRow>(
      "SELECT * FROM resource_allocations WHERE resource_id = $1 ORDER BY starts_at, id",
      [resourceId]
    );
    return result.rows.map(mapResourceAllocation);
  }

  async listAllocationsForClassSession(classSessionId: string) {
    const result = await this.executor.query<ResourceAllocationRow>(
      "SELECT * FROM resource_allocations WHERE class_session_id = $1 ORDER BY starts_at, id",
      [classSessionId]
    );
    return result.rows.map(mapResourceAllocation);
  }

  async updateAllocation(allocation: ResourceAllocation) {
    const result = await this.executor.query<ResourceAllocationRow>(
      `UPDATE resource_allocations
      SET starts_at = $2,
          ends_at = $3,
          buffer_before_minutes = $4,
          buffer_after_minutes = $5,
          staff_override = $6,
          override_reason = $7,
          updated_at = $8
      WHERE id = $1
      RETURNING *`,
      [
        allocation.id,
        allocation.startsAt,
        allocation.endsAt,
        allocation.bufferBeforeMinutes,
        allocation.bufferAfterMinutes,
        allocation.staffOverride,
        allocation.overrideReason ?? null,
        allocation.updatedAt
      ]
    );
    return mapResourceAllocation(one(result));
  }

  async createFacilityReservation(reservation: FacilityReservation) {
    const result = await this.executor.query<FacilityReservationRow>(
      `INSERT INTO facility_reservations (
        id, gym_id, resource_id, allocation_id, location_id, member_id, created_by_user_id, status,
        starts_at, ends_at, amount_cents, payment_requirement, payment_status,
        payment_reference, cancellation_fee_cents, refund_amount_cents, cancelled_at,
        cancelled_by_user_id, cancellation_reason, note, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        reservation.id,
        reservation.gymId,
        reservation.resourceId,
        reservation.allocationId ?? null,
        reservation.locationId ?? null,
        reservation.memberId,
        reservation.createdByUserId,
        reservation.status,
        reservation.startsAt,
        reservation.endsAt,
        reservation.amountCents,
        reservation.paymentRequirement,
        reservation.paymentStatus,
        reservation.paymentReference ?? null,
        reservation.cancellationFeeCents,
        reservation.refundAmountCents,
        reservation.cancelledAt ?? null,
        reservation.cancelledByUserId ?? null,
        reservation.cancellationReason ?? null,
        reservation.note ?? null,
        reservation.createdAt,
        reservation.updatedAt
      ]
    );
    return mapFacilityReservation(one(result));
  }

  async getFacilityReservation(reservationId: string) {
    const result = await this.executor.query<FacilityReservationRow>(
      "SELECT * FROM facility_reservations WHERE id = $1",
      [reservationId]
    );
    return result.rows[0] ? mapFacilityReservation(result.rows[0]) : undefined;
  }

  async listFacilityReservationsForGym(gymId: string) {
    const result = await this.executor.query<FacilityReservationRow>(
      "SELECT * FROM facility_reservations WHERE gym_id = $1 ORDER BY starts_at, id",
      [gymId]
    );
    return result.rows.map(mapFacilityReservation);
  }

  async updateFacilityReservation(reservation: FacilityReservation) {
    const result = await this.executor.query<FacilityReservationRow>(
      `UPDATE facility_reservations
      SET allocation_id = $2,
          status = $3,
          payment_status = $4,
          payment_reference = $5,
          location_id = $6,
          cancellation_fee_cents = $7,
          refund_amount_cents = $8,
          cancelled_at = $9,
          cancelled_by_user_id = $10,
          cancellation_reason = $11,
          note = $12,
          updated_at = $13
      WHERE id = $1
      RETURNING *`,
      [
        reservation.id,
        reservation.allocationId ?? null,
        reservation.status,
        reservation.paymentStatus,
        reservation.paymentReference ?? null,
        reservation.locationId ?? null,
        reservation.cancellationFeeCents,
        reservation.refundAmountCents,
        reservation.cancelledAt ?? null,
        reservation.cancelledByUserId ?? null,
        reservation.cancellationReason ?? null,
        reservation.note ?? null,
        reservation.updatedAt
      ]
    );
    return mapFacilityReservation(one(result));
  }

  async createNotificationEvent(event: NotificationEvent) {
    const result = await this.executor.query<NotificationEventRow>(
      `INSERT INTO notification_events (
        id, gym_id, type, status, recipient_member_id, related_booking_id,
        payload, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
      RETURNING *`,
      [
        event.id,
        event.gymId,
        event.type,
        event.status,
        event.recipientMemberId,
        event.relatedBookingId ?? null,
        JSON.stringify(event.payload),
        event.createdAt,
        event.updatedAt
      ]
    );
    return mapNotificationEvent(one(result));
  }

  async listNotificationEventsForGym(gymId: string) {
    const result = await this.executor.query<NotificationEventRow>(
      "SELECT * FROM notification_events WHERE gym_id = $1 ORDER BY created_at",
      [gymId]
    );
    return result.rows.map(mapNotificationEvent);
  }

  async createCheckIn(checkIn: CheckIn) {
    const result = await this.executor.query<CheckInRow>(
      `INSERT INTO check_ins (
        id, gym_id, member_id, location_id, class_session_id, booking_id, status,
        method, denied_reason, staff_override, override_reason, checked_in_at,
        created_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        checkIn.id,
        checkIn.gymId,
        checkIn.memberId,
        checkIn.locationId,
        checkIn.classSessionId ?? null,
        checkIn.bookingId ?? null,
        checkIn.status,
        checkIn.method,
        checkIn.deniedReason ?? null,
        checkIn.staffOverride,
        checkIn.overrideReason ?? null,
        checkIn.checkedInAt,
        checkIn.createdByUserId ?? null,
        checkIn.createdAt,
        checkIn.updatedAt
      ]
    );
    return mapCheckIn(one(result));
  }

  async listCheckInsForMember(memberId: string) {
    const result = await this.executor.query<CheckInRow>(
      "SELECT * FROM check_ins WHERE member_id = $1 ORDER BY checked_in_at",
      [memberId]
    );
    return result.rows.map(mapCheckIn);
  }

  async listCheckInsForGym(gymId: string) {
    const result = await this.executor.query<CheckInRow>(
      "SELECT * FROM check_ins WHERE gym_id = $1 ORDER BY checked_in_at",
      [gymId]
    );
    return result.rows.map(mapCheckIn);
  }

  async deleteCheckIn(checkInId: string, gymId: string) {
    const result = await this.executor.query(
      "DELETE FROM check_ins WHERE id = $1 AND gym_id = $2",
      [checkInId, gymId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async createAccessDevice(device: AccessDevice) {
    const result = await this.executor.query<AccessDeviceRow>(
      `INSERT INTO access_devices (
        id, gym_id, location_id, name, device_type, status, api_key_hash,
        api_key_preview, last_heartbeat_at, created_at, updated_at, rotated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        device.id,
        device.gymId,
        device.locationId,
        device.name,
        device.deviceType,
        device.status,
        device.apiKeyHash,
        device.apiKeyPreview,
        device.lastHeartbeatAt ?? null,
        device.createdAt,
        device.updatedAt,
        device.rotatedAt ?? null
      ]
    );
    return mapAccessDevice(one(result));
  }

  async getAccessDevice(deviceId: string) {
    const result = await this.executor.query<AccessDeviceRow>(
      "SELECT * FROM access_devices WHERE id = $1",
      [deviceId]
    );
    return result.rows[0] ? mapAccessDevice(result.rows[0]) : undefined;
  }

  async findAccessDeviceByApiKeyHash(apiKeyHash: string) {
    const result = await this.executor.query<AccessDeviceRow>(
      "SELECT * FROM access_devices WHERE api_key_hash = $1",
      [apiKeyHash]
    );
    return result.rows[0] ? mapAccessDevice(result.rows[0]) : undefined;
  }

  async listAccessDevicesForGym(gymId: string) {
    const result = await this.executor.query<AccessDeviceRow>(
      "SELECT * FROM access_devices WHERE gym_id = $1 ORDER BY name",
      [gymId]
    );
    return result.rows.map(mapAccessDevice);
  }

  async updateAccessDevice(device: AccessDevice) {
    const result = await this.executor.query<AccessDeviceRow>(
      `UPDATE access_devices
       SET location_id = $2, name = $3, device_type = $4, status = $5, api_key_hash = $6,
           api_key_preview = $7, last_heartbeat_at = $8, updated_at = $9, rotated_at = $10
       WHERE id = $1
       RETURNING *`,
      [
        device.id,
        device.locationId,
        device.name,
        device.deviceType,
        device.status,
        device.apiKeyHash,
        device.apiKeyPreview,
        device.lastHeartbeatAt ?? null,
        device.updatedAt,
        device.rotatedAt ?? null
      ]
    );
    return mapAccessDevice(one(result));
  }

  async createAccessRule(rule: AccessRule) {
    const result = await this.executor.query<AccessRuleRow>(
      `INSERT INTO access_rules (
        id, gym_id, location_id, name, plan_id, allow_all_active_members,
        starts_at, ends_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        rule.id,
        rule.gymId,
        rule.locationId,
        rule.name,
        rule.planId ?? null,
        rule.allowAllActiveMembers,
        rule.startsAt ?? null,
        rule.endsAt ?? null,
        rule.createdAt,
        rule.updatedAt
      ]
    );
    return mapAccessRule(one(result));
  }

  async listAccessRulesForGym(gymId: string) {
    const result = await this.executor.query<AccessRuleRow>(
      "SELECT * FROM access_rules WHERE gym_id = $1 ORDER BY created_at",
      [gymId]
    );
    return result.rows.map(mapAccessRule);
  }

  async createAccessEvent(event: AccessEvent) {
    const result = await this.executor.query<AccessEventRow>(
      `INSERT INTO access_events (
        id, gym_id, device_id, location_id, member_id, decision, reason, occurred_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        event.id,
        event.gymId,
        event.deviceId,
        event.locationId,
        event.memberId ?? null,
        event.decision,
        event.reason,
        event.occurredAt,
        event.createdAt
      ]
    );
    return mapAccessEvent(one(result));
  }

  async listAccessEventsForGym(gymId: string) {
    const result = await this.executor.query<AccessEventRow>(
      "SELECT * FROM access_events WHERE gym_id = $1 ORDER BY occurred_at DESC",
      [gymId]
    );
    return result.rows.map(mapAccessEvent);
  }

  async createRefreshToken(refreshToken: RefreshToken) {
    const result = await this.executor.query<RefreshTokenRow>(
      `INSERT INTO refresh_tokens (
        id, user_id, gym_id, token_hash, expires_at, revoked_at, replaced_by_token_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        refreshToken.id,
        refreshToken.userId,
        refreshToken.gymId ?? null,
        refreshToken.tokenHash,
        refreshToken.expiresAt,
        refreshToken.revokedAt ?? null,
        refreshToken.replacedByTokenId ?? null,
        refreshToken.createdAt
      ]
    );
    return mapRefreshToken(one(result));
  }

  async findRefreshTokenByHash(tokenHash: string) {
    const result = await this.executor.query<RefreshTokenRow>(
      "SELECT * FROM refresh_tokens WHERE token_hash = $1",
      [tokenHash]
    );
    return result.rows[0] ? mapRefreshToken(result.rows[0]) : undefined;
  }

  async listRefreshTokensForUser(userId: string) {
    const result = await this.executor.query<RefreshTokenRow>(
      "SELECT * FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at",
      [userId]
    );
    return result.rows.map(mapRefreshToken);
  }

  async updateRefreshToken(refreshToken: RefreshToken) {
    const result = await this.executor.query<RefreshTokenRow>(
      `UPDATE refresh_tokens
      SET revoked_at = $2,
          replaced_by_token_id = $3
      WHERE id = $1
      RETURNING *`,
      [refreshToken.id, refreshToken.revokedAt ?? null, refreshToken.replacedByTokenId ?? null]
    );
    return mapRefreshToken(one(result));
  }

  async createPurposeToken(purposeToken: PurposeToken) {
    const result = await this.executor.query<PurposeTokenRow>(
      `INSERT INTO purpose_tokens (
        id, user_id, token_hash, purpose, expires_at, used_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        purposeToken.id,
        purposeToken.userId,
        purposeToken.tokenHash,
        purposeToken.purpose,
        purposeToken.expiresAt,
        purposeToken.usedAt ?? null,
        purposeToken.createdAt
      ]
    );
    return mapPurposeToken(one(result));
  }

  async findPurposeTokenByHash(tokenHash: string, purpose: PurposeToken["purpose"]) {
    const result = await this.executor.query<PurposeTokenRow>(
      "SELECT * FROM purpose_tokens WHERE token_hash = $1 AND purpose = $2",
      [tokenHash, purpose]
    );
    return result.rows[0] ? mapPurposeToken(result.rows[0]) : undefined;
  }

  async updatePurposeToken(purposeToken: PurposeToken) {
    const result = await this.executor.query<PurposeTokenRow>(
      `UPDATE purpose_tokens
      SET used_at = $2
      WHERE id = $1
      RETURNING *`,
      [purposeToken.id, purposeToken.usedAt ?? null]
    );
    return mapPurposeToken(one(result));
  }
}

export function createPostgresRepositories(pool: Pool) {
  return new PostgresRepositories(pool, pool);
}

function one<R extends QueryResultRow>(result: QueryResult<R>) {
  const row = result.rows[0];
  if (!row) {
    throw new Error("Expected database query to return one row.");
  }
  return row;
}

function mapUser(row: UserRow): User {
  const user: User = {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status,
    recoveryCodeHashes: stringArray(row.recovery_code_hashes),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.email_verified_at) {
    user.emailVerifiedAt = row.email_verified_at;
  }
  if (row.two_factor_secret) {
    user.twoFactorSecret = row.two_factor_secret;
  }
  if (row.two_factor_enabled_at) {
    user.twoFactorEnabledAt = row.two_factor_enabled_at;
  }
  return user;
}

function mapGym(row: GymRow): Gym {
  const gym: Gym = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerUserId: row.owner_user_id,
    status: row.status,
    timezone: row.timezone,
    locale: row.locale,
    operatingHours: operatingHours(row.operating_hours),
    featureFlags: stringArray(row.feature_flags) as Gym["featureFlags"],
    onboardingCompletedSteps: stringArray(row.onboarding_completed_steps),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.logo_url) {
    gym.logoUrl = row.logo_url;
  }
  if (row.stripe_account_id) {
    gym.stripeAccountId = row.stripe_account_id;
  }
  if (isRecord(row.brand_colors) && typeof row.brand_colors.primary === "string") {
    gym.brandColors = row.brand_colors as unknown as NonNullable<Gym["brandColors"]>;
  }
  if (isRecord(row.business_info) && Object.keys(row.business_info).length > 0) {
    gym.businessInfo = row.business_info as unknown as NonNullable<Gym["businessInfo"]>;
  }
  return gym;
}

function mapRole(row: RoleRow): Role {
  const role: Role = {
    id: row.id,
    gymId: row.gym_id,
    name: row.name,
    permissions: stringArray(row.permissions) as Role["permissions"],
    createsReservableResource: row.creates_reservable_resource,
    isSystem: row.is_system,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.parent_role_id) {
    role.parentRoleId = row.parent_role_id;
  }
  return role;
}

function mapGymUser(row: GymUserRow): GymUser {
  return {
    id: row.id,
    gymId: row.gym_id,
    userId: row.user_id,
    roleId: row.role_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapStaffInvite(row: StaffInviteRow): StaffInvite {
  const invite: StaffInvite = {
    id: row.id,
    gymId: row.gym_id,
    email: row.email,
    roleId: row.role_id,
    invitedByUserId: row.invited_by_user_id,
    tokenHash: row.token_hash,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.accepted_at) {
    invite.acceptedAt = row.accepted_at;
  }
  if (row.revoked_at) {
    invite.revokedAt = row.revoked_at;
  }
  return invite;
}

function mapStaffAuditLog(row: StaffAuditLogRow): StaffAuditLog {
  const entry: StaffAuditLog = {
    id: row.id,
    gymId: row.gym_id,
    actorUserId: row.actor_user_id,
    targetUserId: row.target_user_id,
    action: row.action,
    createdAt: row.created_at
  };
  if (row.previous_role_id) {
    entry.previousRoleId = row.previous_role_id;
  }
  if (row.next_role_id) {
    entry.nextRoleId = row.next_role_id;
  }
  if (row.previous_status) {
    entry.previousStatus = row.previous_status;
  }
  if (row.next_status) {
    entry.nextStatus = row.next_status;
  }
  if (row.reason) {
    entry.reason = row.reason;
  }
  return entry;
}

function mapStaffShift(row: StaffShiftRow): StaffShift {
  const shift: StaffShift = {
    id: row.id,
    gymId: row.gym_id,
    userId: row.user_id,
    roleId: row.role_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.location_id) {
    shift.locationId = row.location_id;
  }
  if (row.notes) {
    shift.notes = row.notes;
  }
  return shift;
}

function mapStaffTimeEntry(row: StaffTimeEntryRow): StaffTimeEntry {
  const entry: StaffTimeEntry = {
    id: row.id,
    gymId: row.gym_id,
    userId: row.user_id,
    clockedInAt: row.clocked_in_at,
    clockedInByUserId: row.clocked_in_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.location_id) {
    entry.locationId = row.location_id;
  }
  if (row.clocked_out_at) {
    entry.clockedOutAt = row.clocked_out_at;
  }
  if (row.clocked_out_by_user_id) {
    entry.clockedOutByUserId = row.clocked_out_by_user_id;
  }
  if (row.notes) {
    entry.notes = row.notes;
  }
  return entry;
}

function mapSchedulerCoverageRule(row: SchedulerCoverageRuleRow): SchedulerCoverageRule {
  const rule: SchedulerCoverageRule = {
    id: row.id,
    gymId: row.gym_id,
    name: row.name,
    roleId: row.role_id,
    daysOfWeek: numberArray(row.days_of_week),
    startTime: row.start_time,
    endTime: row.end_time,
    requiredStaff: row.required_staff,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.location_id) {
    rule.locationId = row.location_id;
  }
  return rule;
}

function mapSchedulerAvailability(row: SchedulerAvailabilityRow): SchedulerAvailability {
  const availability: SchedulerAvailability = {
    id: row.id,
    gymId: row.gym_id,
    userId: row.user_id,
    daysOfWeek: numberArray(row.days_of_week),
    startTime: row.start_time,
    endTime: row.end_time,
    preference: row.preference,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.notes) {
    availability.notes = row.notes;
  }
  return availability;
}

function mapSchedulerSettings(row: SchedulerSettingsRow): SchedulerSettings {
  return {
    gymId: row.gym_id,
    planningHorizonDays: row.planning_horizon_days,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSchedulerPreferenceRequest(row: SchedulerPreferenceRequestRow): SchedulerPreferenceRequest {
  const request: SchedulerPreferenceRequest = {
    id: row.id,
    gymId: row.gym_id,
    userId: row.user_id,
    daysOfWeek: numberArray(row.days_of_week),
    startTime: row.start_time,
    endTime: row.end_time,
    preference: row.preference,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.notes) {
    request.notes = row.notes;
  }
  if (row.resolution_note) {
    request.resolutionNote = row.resolution_note;
  }
  if (row.resolved_by_user_id) {
    request.resolvedByUserId = row.resolved_by_user_id;
  }
  if (row.resolved_at) {
    request.resolvedAt = row.resolved_at;
  }
  return request;
}

function mapSchedulerRequest(row: SchedulerRequestRow): SchedulerRequest {
  const request: SchedulerRequest = {
    id: row.id,
    gymId: row.gym_id,
    userId: row.user_id,
    requestType: row.request_type,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.shift_id) {
    request.shiftId = row.shift_id;
  }
  if (row.suggested_replacement_user_id) {
    request.suggestedReplacementUserId = row.suggested_replacement_user_id;
  }
  if (row.resolution_note) {
    request.resolutionNote = row.resolution_note;
  }
  if (row.resolved_by_user_id) {
    request.resolvedByUserId = row.resolved_by_user_id;
  }
  if (row.resolved_at) {
    request.resolvedAt = row.resolved_at;
  }
  return request;
}

function mapLocation(row: LocationRow): Location {
  const location: Location = {
    id: row.id,
    gymId: row.gym_id,
    name: row.name,
    address: address(row.address),
    timezone: row.timezone,
    operatingHours: operatingHours(row.operating_hours),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.phone) {
    location.phone = row.phone;
  }
  if (row.archived_at) {
    location.archivedAt = row.archived_at;
  }
  return location;
}

function mapMember(row: MemberRow): Member {
  const member: Member = {
    id: row.id,
    gymId: row.gym_id,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status,
    recordStatus: row.record_status,
    leadStage: row.lead_stage,
    tagNames: stringArray(row.tag_names),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.email) {
    member.email = row.email;
  }
  if (row.phone) {
    member.phone = row.phone;
  }
  if (row.barcode) {
    member.barcode = row.barcode;
  }
  if (row.profile_image_url !== null) {
    member.profileImageUrl = row.profile_image_url;
  }
  if (isRecord(row.emergency_contact)) {
    member.emergencyContact = emergencyContact(row.emergency_contact);
  }
  if (row.notes) {
    member.notes = row.notes;
  }
  if (row.archived_at) {
    member.archivedAt = row.archived_at;
  }
  return member;
}

function mapMembershipPlan(row: MembershipPlanRow): MembershipPlan {
  const plan: MembershipPlan = {
    id: row.id,
    gymId: row.gym_id,
    name: row.name,
    billingInterval: row.billing_interval,
    priceCents: row.price_cents,
    signupFeeCents: row.signup_fee_cents,
    trialDays: row.trial_days,
    autoRenew: row.auto_renew,
    isPublic: row.is_public,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.description) {
    plan.description = row.description;
  }
  if (row.contract_length_months !== null) {
    plan.contractLengthMonths = row.contract_length_months;
  }
  if (row.class_access_limit !== null) {
    plan.classAccessLimit = row.class_access_limit;
  }
  if (row.archived_at) {
    plan.archivedAt = row.archived_at;
  }
  return plan;
}

function mapMemberMembership(row: MemberMembershipRow): MemberMembership {
  const membership: MemberMembership = {
    id: row.id,
    gymId: row.gym_id,
    memberId: row.member_id,
    planId: row.plan_id,
    status: row.status,
    startsAt: row.starts_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.ends_at) {
    membership.endsAt = row.ends_at;
  }
  if (row.cancelled_at) {
    membership.cancelledAt = row.cancelled_at;
  }
  return membership;
}

function mapClassType(row: ClassTypeRow): ClassType {
  const classType: ClassType = {
    id: row.id,
    gymId: row.gym_id,
    name: row.name,
    defaultDurationMinutes: row.default_duration_minutes,
    defaultCapacity: row.default_capacity,
    defaultWaitlistCapacity: row.default_waitlist_capacity,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.description) {
    classType.description = row.description;
  }
  return classType;
}

function mapClassSession(row: ClassSessionRow): ClassSession {
  const session: ClassSession = {
    id: row.id,
    gymId: row.gym_id,
    classTypeId: row.class_type_id,
    locationId: row.location_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    waitlistCapacity: row.waitlist_capacity,
    cancellationCutoffMinutes: row.cancellation_cutoff_minutes,
    lateCancellationFeeCents: row.late_cancellation_fee_cents,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.trainer_user_id) {
    session.trainerUserId = row.trainer_user_id;
  }
  if (row.room_name) {
    session.roomName = row.room_name;
  }
  if (row.cancelled_at) {
    session.cancelledAt = row.cancelled_at;
  }
  return session;
}

function mapClassBooking(row: ClassBookingRow): ClassBooking {
  const booking: ClassBooking = {
    id: row.id,
    gymId: row.gym_id,
    classSessionId: row.class_session_id,
    memberId: row.member_id,
    status: row.status,
    source: row.source,
    bookedAt: row.booked_at,
    isLateCancellation: row.is_late_cancellation,
    lateCancellationFeeCents: row.late_cancellation_fee_cents,
    staffOverride: row.staff_override,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.waitlist_position !== null) {
    booking.waitlistPosition = row.waitlist_position;
  }
  if (row.cancelled_at) {
    booking.cancelledAt = row.cancelled_at;
  }
  if (row.created_by_user_id) {
    booking.createdByUserId = row.created_by_user_id;
  }
  if (row.cancelled_by_user_id) {
    booking.cancelledByUserId = row.cancelled_by_user_id;
  }
  if (row.cancellation_reason) {
    booking.cancellationReason = row.cancellation_reason;
  }
  if (row.override_reason) {
    booking.overrideReason = row.override_reason;
  }
  if (row.promoted_at) {
    booking.promotedAt = row.promoted_at;
  }
  return booking;
}

function mapReservableResource(row: ReservableResourceRow): ReservableResource {
  const resource: ReservableResource = {
    id: row.id,
    gymId: row.gym_id,
    name: row.name,
    resourceType: row.resource_type,
    status: row.status,
    isBookable: row.is_bookable,
    isExclusive: row.is_exclusive,
    capacity: row.capacity,
    amenities: stringArray(row.amenities),
    slotRules: resourceSlotRules(row.slot_rules),
    pricing: resourcePricing(row.pricing),
    paymentRequirement: row.payment_requirement,
    confirmationMode: row.confirmation_mode,
    cancellationPolicy: resourceCancellationPolicy(row.cancellation_policy),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.location_id) {
    resource.locationId = row.location_id;
  }
  if (row.parent_resource_id) {
    resource.parentResourceId = row.parent_resource_id;
  }
  if (row.linked_staff_user_id) {
    resource.linkedStaffUserId = row.linked_staff_user_id;
  }
  if (row.created_from_role_id) {
    resource.createdFromRoleId = row.created_from_role_id;
  }
  if (row.auto_managed) {
    resource.autoManaged = true;
  }
  if (isRecord(row.rentable_hours)) {
    resource.rentableHours = row.rentable_hours as OperatingHours;
  }
  if (row.archived_at) {
    resource.archivedAt = row.archived_at;
  }
  return resource;
}

function mapResourceAllocation(row: ResourceAllocationRow): ResourceAllocation {
  const allocation: ResourceAllocation = {
    id: row.id,
    gymId: row.gym_id,
    resourceId: row.resource_id,
    source: row.source,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    bufferBeforeMinutes: row.buffer_before_minutes,
    bufferAfterMinutes: row.buffer_after_minutes,
    staffOverride: row.staff_override,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.class_session_id) {
    allocation.classSessionId = row.class_session_id;
  }
  if (row.facility_reservation_id) {
    allocation.facilityReservationId = row.facility_reservation_id;
  }
  if (row.override_reason) {
    allocation.overrideReason = row.override_reason;
  }
  return allocation;
}

function mapFacilityReservation(row: FacilityReservationRow): FacilityReservation {
  const reservation: FacilityReservation = {
    id: row.id,
    gymId: row.gym_id,
    resourceId: row.resource_id,
    memberId: row.member_id,
    createdByUserId: row.created_by_user_id,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    amountCents: row.amount_cents,
    paymentRequirement: row.payment_requirement,
    paymentStatus: row.payment_status,
    cancellationFeeCents: row.cancellation_fee_cents,
    refundAmountCents: row.refund_amount_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.allocation_id) {
    reservation.allocationId = row.allocation_id;
  }
  if (row.location_id) {
    reservation.locationId = row.location_id;
  }
  if (row.payment_reference) {
    reservation.paymentReference = row.payment_reference;
  }
  if (row.cancelled_at) {
    reservation.cancelledAt = row.cancelled_at;
  }
  if (row.cancelled_by_user_id) {
    reservation.cancelledByUserId = row.cancelled_by_user_id;
  }
  if (row.cancellation_reason) {
    reservation.cancellationReason = row.cancellation_reason;
  }
  if (row.note) {
    reservation.note = row.note;
  }
  return reservation;
}

function mapNotificationEvent(row: NotificationEventRow): NotificationEvent {
  const event: NotificationEvent = {
    id: row.id,
    gymId: row.gym_id,
    type: row.type,
    status: row.status,
    recipientMemberId: row.recipient_member_id,
    payload: isRecord(row.payload) ? row.payload : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.related_booking_id) {
    event.relatedBookingId = row.related_booking_id;
  }
  return event;
}

function mapCheckIn(row: CheckInRow): CheckIn {
  const checkIn: CheckIn = {
    id: row.id,
    gymId: row.gym_id,
    memberId: row.member_id,
    locationId: row.location_id,
    status: row.status,
    method: row.method,
    staffOverride: row.staff_override,
    checkedInAt: row.checked_in_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.class_session_id) {
    checkIn.classSessionId = row.class_session_id;
  }
  if (row.booking_id) {
    checkIn.bookingId = row.booking_id;
  }
  if (row.denied_reason) {
    checkIn.deniedReason = row.denied_reason;
  }
  if (row.override_reason) {
    checkIn.overrideReason = row.override_reason;
  }
  if (row.created_by_user_id) {
    checkIn.createdByUserId = row.created_by_user_id;
  }
  return checkIn;
}

function mapAccessDevice(row: AccessDeviceRow): AccessDevice {
  const device: AccessDevice = {
    id: row.id,
    gymId: row.gym_id,
    locationId: row.location_id,
    name: row.name,
    deviceType: row.device_type,
    status: row.status,
    apiKeyHash: row.api_key_hash,
    apiKeyPreview: row.api_key_preview,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.last_heartbeat_at) {
    device.lastHeartbeatAt = row.last_heartbeat_at;
  }
  if (row.rotated_at) {
    device.rotatedAt = row.rotated_at;
  }
  return device;
}

function mapAccessRule(row: AccessRuleRow): AccessRule {
  const rule: AccessRule = {
    id: row.id,
    gymId: row.gym_id,
    locationId: row.location_id,
    name: row.name,
    allowAllActiveMembers: row.allow_all_active_members,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.plan_id) {
    rule.planId = row.plan_id;
  }
  if (row.starts_at) {
    rule.startsAt = row.starts_at;
  }
  if (row.ends_at) {
    rule.endsAt = row.ends_at;
  }
  return rule;
}

function mapAccessEvent(row: AccessEventRow): AccessEvent {
  const event: AccessEvent = {
    id: row.id,
    gymId: row.gym_id,
    deviceId: row.device_id,
    locationId: row.location_id,
    decision: row.decision,
    reason: row.reason,
    occurredAt: row.occurred_at,
    createdAt: row.created_at
  };
  if (row.member_id) {
    event.memberId = row.member_id;
  }
  return event;
}

function mapRefreshToken(row: RefreshTokenRow): RefreshToken {
  const refreshToken: RefreshToken = {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
  if (row.gym_id) {
    refreshToken.gymId = row.gym_id;
  }
  if (row.revoked_at) {
    refreshToken.revokedAt = row.revoked_at;
  }
  if (row.replaced_by_token_id) {
    refreshToken.replacedByTokenId = row.replaced_by_token_id;
  }
  return refreshToken;
}

function mapPurposeToken(row: PurposeTokenRow): PurposeToken {
  const purposeToken: PurposeToken = {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    purpose: row.purpose,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
  if (row.used_at) {
    purposeToken.usedAt = row.used_at;
  }
  return purposeToken;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function numberArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === "number")
    : [];
}

function address(value: unknown): Address {
  if (!isRecord(value)) {
    throw new Error("Database address value is invalid.");
  }
  const line1 = stringField(value, "line1");
  const city = stringField(value, "city");
  const region = stringField(value, "region");
  const postalCode = stringField(value, "postalCode");
  const country = stringField(value, "country");
  const mapped: Address = { line1, city, region, postalCode, country };
  const line2 = value.line2;
  if (typeof line2 === "string" && line2) {
    mapped.line2 = line2;
  }
  return mapped;
}

function emergencyContact(record: Record<string, unknown>) {
  const contact = {
    name: stringField(record, "name"),
    phone: stringField(record, "phone")
  };
  const relationship = record.relationship;
  return typeof relationship === "string" && relationship ? { ...contact, relationship } : contact;
}

function operatingHours(value: unknown): OperatingHours {
  return isRecord(value) ? (value as OperatingHours) : {};
}

function resourceSlotRules(value: unknown): ResourceSlotRules {
  const record = isRecord(value) ? value : {};
  return {
    minDurationMinutes: numberField(record, "minDurationMinutes", 30),
    maxDurationMinutes: numberField(record, "maxDurationMinutes", 120),
    incrementMinutes: numberField(record, "incrementMinutes", 30),
    bufferBeforeMinutes: numberField(record, "bufferBeforeMinutes", 0),
    bufferAfterMinutes: numberField(record, "bufferAfterMinutes", 0)
  };
}

function resourcePricing(value: unknown): ResourcePricingConfig {
  const record = isRecord(value) ? value : {};
  return {
    amountCents: numberField(record, "amountCents", 0)
  };
}

function resourceCancellationPolicy(value: unknown): ResourceCancellationPolicy {
  const record = isRecord(value) ? value : {};
  return {
    cutoffMinutes: numberField(record, "cutoffMinutes", 0),
    feeCents: numberField(record, "feeCents", 0)
  };
}

function stringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`Database field ${key} is invalid.`);
  }
  return value;
}

function numberField(record: Record<string, unknown>, key: string, fallback: number) {
  const value = record[key];
  return typeof value === "number" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
