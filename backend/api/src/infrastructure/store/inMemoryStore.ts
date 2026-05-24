import { ClassSessionStatus, StaffInviteStatus } from "@gym-platform/constants";
import type {
  AccessDevice,
  AccessEvent,
  AccessRule,
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
  PurposeToken,
  ReservableResource,
  RefreshToken,
  ResourceAllocation,
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
  StoreSnapshot,
  User
} from "./entities.js";
import type {
  GymRepository,
  GymUserRepository,
  AccessControlRepository,
  BookingRepository,
  CheckInRepository,
  ClassRepository,
  LocationRepository,
  MemberRepository,
  MemberMembershipRepository,
  MembershipPlanRepository,
  NotificationRepository,
  ReservationResourceRepository,
  Repositories,
  RoleRepository,
  SchedulerRepository,
  StaffAuditLogRepository,
  StaffInviteRepository,
  StaffShiftRepository,
  StaffTimeEntryRepository,
  TokenRepository,
  UserRepository
} from "./repositories.js";

export class InMemoryStore implements Repositories {
  private readonly userRecords = new Map<string, User>();
  private readonly gymRecords = new Map<string, Gym>();
  private readonly roleRecords = new Map<string, Role>();
  private readonly gymUserRecords = new Map<string, GymUser>();
  private readonly staffInviteRecords = new Map<string, StaffInvite>();
  private readonly staffAuditLogRecords = new Map<string, StaffAuditLog>();
  private readonly staffShiftRecords = new Map<string, StaffShift>();
  private readonly staffTimeEntryRecords = new Map<string, StaffTimeEntry>();
  private readonly schedulerCoverageRuleRecords = new Map<string, SchedulerCoverageRule>();
  private readonly schedulerAvailabilityRecords = new Map<string, SchedulerAvailability>();
  private readonly schedulerSettingsRecords = new Map<string, SchedulerSettings>();
  private readonly schedulerPreferenceRequestRecords = new Map<string, SchedulerPreferenceRequest>();
  private readonly schedulerRequestRecords = new Map<string, SchedulerRequest>();
  private readonly locationRecords = new Map<string, Location>();
  private readonly memberRecords = new Map<string, Member>();
  private readonly membershipPlanRecords = new Map<string, MembershipPlan>();
  private readonly memberMembershipRecords = new Map<string, MemberMembership>();
  private readonly classTypeRecords = new Map<string, ClassType>();
  private readonly classSessionRecords = new Map<string, ClassSession>();
  private readonly classBookingRecords = new Map<string, ClassBooking>();
  private readonly reservableResourceRecords = new Map<string, ReservableResource>();
  private readonly resourceAllocationRecords = new Map<string, ResourceAllocation>();
  private readonly facilityReservationRecords = new Map<string, FacilityReservation>();
  private readonly notificationEventRecords = new Map<string, NotificationEvent>();
  private readonly checkInRecords = new Map<string, CheckIn>();
  private readonly accessDeviceRecords = new Map<string, AccessDevice>();
  private readonly accessRuleRecords = new Map<string, AccessRule>();
  private readonly accessEventRecords = new Map<string, AccessEvent>();
  private readonly refreshTokenRecords = new Map<string, RefreshToken>();
  private readonly purposeTokenRecords = new Map<string, PurposeToken>();

  readonly users: UserRepository = {
    createUser: (user) => this.createUser(user),
    getUser: (userId) => this.getUser(userId),
    findUserByEmail: (email) => this.findUserByEmail(email),
    updateUser: (user) => this.updateUser(user)
  };

  readonly gyms: GymRepository = {
    createGym: (gym) => this.createGym(gym),
    getGym: (gymId) => this.getGym(gymId),
    findGymBySlug: (slug) => this.findGymBySlug(slug),
    updateGym: (gym) => this.updateGym(gym),
    listGyms: () => this.listGyms(),
  };

  readonly roles: RoleRepository = {
    createRole: (role) => this.createRole(role),
    createRoles: (roles) => this.createRoles(roles),
    getRole: (roleId) => this.getRole(roleId),
    listRolesForGym: (gymId) => this.listRolesForGym(gymId),
    updateRole: (role) => this.updateRole(role),
    deleteRole: (roleId) => this.deleteRole(roleId)
  };

  readonly gymUsers: GymUserRepository = {
    createGymUser: (gymUser) => this.createGymUser(gymUser),
    findGymUser: (gymId, userId) => this.findGymUser(gymId, userId),
    listGymUsersForGym: (gymId) => this.listGymUsersForGym(gymId),
    listGymMemberships: (userId) => this.listGymMemberships(userId),
    updateGymUser: (gymUser) => this.updateGymUser(gymUser)
  };

  readonly staffInvites: StaffInviteRepository = {
    createStaffInvite: (invite) => this.createStaffInvite(invite),
    getStaffInvite: (inviteId) => this.getStaffInvite(inviteId),
    findStaffInviteByTokenHash: (tokenHash) => this.findStaffInviteByTokenHash(tokenHash),
    findPendingStaffInvite: (gymId, email) => this.findPendingStaffInvite(gymId, email),
    listStaffInvitesForGym: (gymId) => this.listStaffInvitesForGym(gymId),
    updateStaffInvite: (invite) => this.updateStaffInvite(invite)
  };

  readonly staffAuditLogs: StaffAuditLogRepository = {
    createStaffAuditLog: (entry) => this.createStaffAuditLog(entry),
    listStaffAuditLogsForGym: (gymId) => this.listStaffAuditLogsForGym(gymId)
  };

  readonly staffShifts: StaffShiftRepository = {
    createStaffShift: (shift) => this.createStaffShift(shift),
    updateStaffShift: (shift) => this.updateStaffShift(shift),
    listStaffShiftsForGym: (gymId) => this.listStaffShiftsForGym(gymId),
    listStaffShiftsForStaff: (gymId, userId) => this.listStaffShiftsForStaff(gymId, userId)
  };

  readonly staffTimeEntries: StaffTimeEntryRepository = {
    createStaffTimeEntry: (entry) => this.createStaffTimeEntry(entry),
    updateStaffTimeEntry: (entry) => this.updateStaffTimeEntry(entry),
    listStaffTimeEntriesForGym: (gymId) => this.listStaffTimeEntriesForGym(gymId),
    listStaffTimeEntriesForStaff: (gymId, userId) =>
      this.listStaffTimeEntriesForStaff(gymId, userId),
    findOpenStaffTimeEntry: (gymId, userId) => this.findOpenStaffTimeEntry(gymId, userId)
  };

  readonly scheduler: SchedulerRepository = {
    getSettings: (gymId) => this.getSchedulerSettings(gymId),
    upsertSettings: (settings) => this.upsertSchedulerSettings(settings),
    createCoverageRule: (rule) => this.createCoverageRule(rule),
    listCoverageRulesForGym: (gymId) => this.listCoverageRulesForGym(gymId),
    createAvailability: (availability) => this.createAvailability(availability),
    replaceAvailabilitiesForStaff: (gymId, userId, availabilities) =>
      this.replaceAvailabilitiesForStaff(gymId, userId, availabilities),
    listAvailabilitiesForGym: (gymId) => this.listAvailabilitiesForGym(gymId),
    listAvailabilitiesForStaff: (gymId, userId) => this.listAvailabilitiesForStaff(gymId, userId),
    createPreferenceRequest: (request) => this.createPreferenceRequest(request),
    updatePreferenceRequest: (request) => this.updatePreferenceRequest(request),
    getPreferenceRequest: (requestId) => this.getPreferenceRequest(requestId),
    listPreferenceRequestsForGym: (gymId) => this.listPreferenceRequestsForGym(gymId),
    listPreferenceRequestsForStaff: (gymId, userId) =>
      this.listPreferenceRequestsForStaff(gymId, userId),
    createRequest: (request) => this.createRequest(request),
    updateRequest: (request) => this.updateRequest(request),
    getRequest: (requestId) => this.getRequest(requestId),
    listRequestsForGym: (gymId) => this.listRequestsForGym(gymId),
    listRequestsForStaff: (gymId, userId) => this.listRequestsForStaff(gymId, userId)
  };

  readonly locations: LocationRepository = {
    createLocation: (location) => this.createLocation(location),
    getLocation: (locationId) => this.getLocation(locationId),
    listLocationsForGym: (gymId) => this.listLocationsForGym(gymId),
    updateLocation: (location) => this.updateLocation(location)
  };

  readonly members: MemberRepository = {
    createMember: (member) => this.createMember(member),
    getMember: (memberId) => this.getMember(memberId),
    listMembersForGym: (gymId) => this.listMembersForGym(gymId),
    updateMember: (member) => this.updateMember(member)
  };

  readonly membershipPlans: MembershipPlanRepository = {
    createMembershipPlan: (plan) => this.createMembershipPlan(plan),
    getMembershipPlan: (planId) => this.getMembershipPlan(planId),
    listMembershipPlansForGym: (gymId) => this.listMembershipPlansForGym(gymId),
    updateMembershipPlan: (plan) => this.updateMembershipPlan(plan)
  };

  readonly memberMemberships: MemberMembershipRepository = {
    createMemberMembership: (membership) => this.createMemberMembership(membership),
    getMemberMembership: (membershipId) => this.getMemberMembership(membershipId),
    listMemberMembershipsForMember: (memberId) => this.listMemberMembershipsForMember(memberId),
    updateMemberMembership: (membership) => this.updateMemberMembership(membership)
  };

  readonly classes: ClassRepository = {
    createClassType: (classType) => this.createClassType(classType),
    getClassType: (classTypeId) => this.getClassType(classTypeId),
    listClassTypesForGym: (gymId) => this.listClassTypesForGym(gymId),
    createClassSession: (session) => this.createClassSession(session),
    getClassSession: (sessionId) => this.getClassSession(sessionId),
    listClassSessionsForGym: (gymId) => this.listClassSessionsForGym(gymId),
    listPublicClassSessionsForGym: (gymId, from, to) =>
      this.listPublicClassSessionsForGym(gymId, from, to)
  };

  readonly bookings: BookingRepository = {
    createClassBooking: (booking) => this.createClassBooking(booking),
    getClassBooking: (bookingId) => this.getClassBooking(bookingId),
    listClassBookingsForSession: (classSessionId) =>
      this.listClassBookingsForSession(classSessionId),
    listClassBookingsForMember: (memberId) => this.listClassBookingsForMember(memberId),
    updateClassBooking: (booking) => this.updateClassBooking(booking)
  };

  readonly reservationResources: ReservationResourceRepository = {
    createResource: (resource) => this.createResource(resource),
    getResource: (resourceId) => this.getResource(resourceId),
    listResourcesForGym: (gymId) => this.listResourcesForGym(gymId),
    updateResource: (resource) => this.updateResource(resource),
    createAllocation: (allocation) => this.createAllocation(allocation),
    getAllocation: (allocationId) => this.getAllocation(allocationId),
    listAllocationsForGym: (gymId) => this.listAllocationsForGym(gymId),
    listAllocationsForResource: (resourceId) => this.listAllocationsForResource(resourceId),
    listAllocationsForClassSession: (classSessionId) =>
      this.listAllocationsForClassSession(classSessionId),
    updateAllocation: (allocation) => this.updateAllocation(allocation),
    createFacilityReservation: (reservation) => this.createFacilityReservation(reservation),
    getFacilityReservation: (reservationId) => this.getFacilityReservation(reservationId),
    listFacilityReservationsForGym: (gymId) => this.listFacilityReservationsForGym(gymId),
    updateFacilityReservation: (reservation) => this.updateFacilityReservation(reservation)
  };

  readonly notifications: NotificationRepository = {
    createNotificationEvent: (event) => this.createNotificationEvent(event),
    listNotificationEventsForGym: (gymId) => this.listNotificationEventsForGym(gymId)
  };

  readonly checkIns: CheckInRepository = {
    createCheckIn: (checkIn) => this.createCheckIn(checkIn),
    listCheckInsForMember: (memberId) => this.listCheckInsForMember(memberId),
    listCheckInsForGym: (gymId) => this.listCheckInsForGym(gymId),
    deleteCheckIn: (checkInId, gymId) => this.deleteCheckIn(checkInId, gymId)
  };

  readonly accessControl: AccessControlRepository = {
    createAccessDevice: (device) => this.createAccessDevice(device),
    getAccessDevice: (deviceId) => this.getAccessDevice(deviceId),
    findAccessDeviceByApiKeyHash: (apiKeyHash) => this.findAccessDeviceByApiKeyHash(apiKeyHash),
    listAccessDevicesForGym: (gymId) => this.listAccessDevicesForGym(gymId),
    updateAccessDevice: (device) => this.updateAccessDevice(device),
    createAccessRule: (rule) => this.createAccessRule(rule),
    listAccessRulesForGym: (gymId) => this.listAccessRulesForGym(gymId),
    createAccessEvent: (event) => this.createAccessEvent(event),
    listAccessEventsForGym: (gymId) => this.listAccessEventsForGym(gymId)
  };

  readonly tokens: TokenRepository = {
    createRefreshToken: (refreshToken) => this.createRefreshToken(refreshToken),
    findRefreshTokenByHash: (tokenHash) => this.findRefreshTokenByHash(tokenHash),
    listRefreshTokensForUser: (userId) => this.listRefreshTokensForUser(userId),
    updateRefreshToken: (refreshToken) => this.updateRefreshToken(refreshToken),
    createPurposeToken: (purposeToken) => this.createPurposeToken(purposeToken),
    findPurposeTokenByHash: (tokenHash, purpose) => this.findPurposeTokenByHash(tokenHash, purpose),
    updatePurposeToken: (purposeToken) => this.updatePurposeToken(purposeToken)
  };

  async transaction<T>(work: (repositories: Repositories) => Promise<T>): Promise<T> {
    return work(this);
  }

  async createUser(user: User) {
    this.userRecords.set(user.id, user);
    return user;
  }

  async getUser(userId: string) {
    return this.userRecords.get(userId);
  }

  async findUserByEmail(email: string) {
    const normalized = email.toLowerCase();
    return [...this.userRecords.values()].find((user) => user.email === normalized);
  }

  async updateUser(user: User) {
    this.userRecords.set(user.id, user);
    return user;
  }

  async createGym(gym: Gym) {
    this.gymRecords.set(gym.id, gym);
    return gym;
  }

  async getGym(gymId: string) {
    return this.gymRecords.get(gymId);
  }

  async findGymBySlug(slug: string) {
    return [...this.gymRecords.values()].find((gym) => gym.slug === slug);
  }

  async updateGym(gym: Gym) {
    this.gymRecords.set(gym.id, gym);
    return gym;
  }
  async listGyms() {
    return Array.from(this.gymRecords.values());
  }
  async createRole(role: Role) {
    this.roleRecords.set(role.id, role);
    return role;
  }

  async createRoles(roles: Role[]) {
    for (const role of roles) {
      this.roleRecords.set(role.id, role);
    }
    return roles;
  }

  async getRole(roleId: string) {
    return this.roleRecords.get(roleId);
  }

  async listRolesForGym(gymId: string) {
    return [...this.roleRecords.values()].filter((role) => role.gymId === gymId);
  }

  async updateRole(role: Role) {
    this.roleRecords.set(role.id, role);
    return role;
  }

  async deleteRole(roleId: string) {
    this.roleRecords.delete(roleId);
  }

  async createGymUser(gymUser: GymUser) {
    this.gymUserRecords.set(gymUser.id, gymUser);
    return gymUser;
  }

  async findGymUser(gymId: string, userId: string) {
    return [...this.gymUserRecords.values()].find(
      (membership) => membership.gymId === gymId && membership.userId === userId
    );
  }

  async listGymUsersForGym(gymId: string) {
    return [...this.gymUserRecords.values()]
      .filter((membership) => membership.gymId === gymId)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  async listGymMemberships(userId: string) {
    return [...this.gymUserRecords.values()].filter((membership) => membership.userId === userId);
  }

  async updateGymUser(gymUser: GymUser) {
    this.gymUserRecords.set(gymUser.id, gymUser);
    return gymUser;
  }

  async createStaffInvite(invite: StaffInvite) {
    this.staffInviteRecords.set(invite.id, invite);
    return invite;
  }

  async getStaffInvite(inviteId: string) {
    return this.staffInviteRecords.get(inviteId);
  }

  async findStaffInviteByTokenHash(tokenHash: string) {
    return [...this.staffInviteRecords.values()].find((invite) => invite.tokenHash === tokenHash);
  }

  async findPendingStaffInvite(gymId: string, email: string) {
    const normalized = email.toLowerCase();
    return [...this.staffInviteRecords.values()].find(
      (invite) =>
        invite.gymId === gymId &&
        invite.email === normalized &&
        invite.status === StaffInviteStatus.Pending
    );
  }

  async listStaffInvitesForGym(gymId: string) {
    return [...this.staffInviteRecords.values()]
      .filter((invite) => invite.gymId === gymId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async updateStaffInvite(invite: StaffInvite) {
    this.staffInviteRecords.set(invite.id, invite);
    return invite;
  }

  async createStaffAuditLog(entry: StaffAuditLog) {
    this.staffAuditLogRecords.set(entry.id, entry);
    return entry;
  }

  async listStaffAuditLogsForGym(gymId: string) {
    return [...this.staffAuditLogRecords.values()]
      .filter((entry) => entry.gymId === gymId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async createStaffShift(shift: StaffShift) {
    this.staffShiftRecords.set(shift.id, shift);
    return shift;
  }

  async updateStaffShift(shift: StaffShift) {
    this.staffShiftRecords.set(shift.id, shift);
    return shift;
  }

  async listStaffShiftsForGym(gymId: string) {
    return [...this.staffShiftRecords.values()]
      .filter((shift) => shift.gymId === gymId)
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  }

  async listStaffShiftsForStaff(gymId: string, userId: string) {
    return [...this.staffShiftRecords.values()]
      .filter((shift) => shift.gymId === gymId && shift.userId === userId)
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  }

  async createStaffTimeEntry(entry: StaffTimeEntry) {
    this.staffTimeEntryRecords.set(entry.id, entry);
    return entry;
  }

  async updateStaffTimeEntry(entry: StaffTimeEntry) {
    this.staffTimeEntryRecords.set(entry.id, entry);
    return entry;
  }

  async listStaffTimeEntriesForGym(gymId: string) {
    return [...this.staffTimeEntryRecords.values()]
      .filter((entry) => entry.gymId === gymId)
      .sort((left, right) => right.clockedInAt.getTime() - left.clockedInAt.getTime());
  }

  async listStaffTimeEntriesForStaff(gymId: string, userId: string) {
    return [...this.staffTimeEntryRecords.values()]
      .filter((entry) => entry.gymId === gymId && entry.userId === userId)
      .sort((left, right) => right.clockedInAt.getTime() - left.clockedInAt.getTime());
  }

  async findOpenStaffTimeEntry(gymId: string, userId: string) {
    return [...this.staffTimeEntryRecords.values()].find(
      (entry) => entry.gymId === gymId && entry.userId === userId && !entry.clockedOutAt
    );
  }

  async getSchedulerSettings(gymId: string) {
    return this.schedulerSettingsRecords.get(gymId);
  }

  async upsertSchedulerSettings(settings: SchedulerSettings) {
    this.schedulerSettingsRecords.set(settings.gymId, settings);
    return settings;
  }

  async createCoverageRule(rule: SchedulerCoverageRule) {
    this.schedulerCoverageRuleRecords.set(rule.id, rule);
    return rule;
  }

  async listCoverageRulesForGym(gymId: string) {
    return [...this.schedulerCoverageRuleRecords.values()]
      .filter((rule) => rule.gymId === gymId)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async createAvailability(availability: SchedulerAvailability) {
    this.schedulerAvailabilityRecords.set(availability.id, availability);
    return availability;
  }

  async replaceAvailabilitiesForStaff(
    gymId: string,
    userId: string,
    availabilities: SchedulerAvailability[]
  ) {
    for (const availability of this.schedulerAvailabilityRecords.values()) {
      if (availability.gymId === gymId && availability.userId === userId) {
        this.schedulerAvailabilityRecords.delete(availability.id);
      }
    }
    for (const availability of availabilities) {
      this.schedulerAvailabilityRecords.set(availability.id, availability);
    }
    return availabilities;
  }

  async listAvailabilitiesForGym(gymId: string) {
    return [...this.schedulerAvailabilityRecords.values()]
      .filter((availability) => availability.gymId === gymId)
      .sort((left, right) => left.userId.localeCompare(right.userId));
  }

  async listAvailabilitiesForStaff(gymId: string, userId: string) {
    return [...this.schedulerAvailabilityRecords.values()]
      .filter((availability) => availability.gymId === gymId && availability.userId === userId)
      .sort((left, right) => left.startTime.localeCompare(right.startTime));
  }

  async createPreferenceRequest(request: SchedulerPreferenceRequest) {
    this.schedulerPreferenceRequestRecords.set(request.id, request);
    return request;
  }

  async updatePreferenceRequest(request: SchedulerPreferenceRequest) {
    this.schedulerPreferenceRequestRecords.set(request.id, request);
    return request;
  }

  async getPreferenceRequest(requestId: string) {
    return this.schedulerPreferenceRequestRecords.get(requestId);
  }

  async listPreferenceRequestsForGym(gymId: string) {
    return [...this.schedulerPreferenceRequestRecords.values()]
      .filter((request) => request.gymId === gymId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async listPreferenceRequestsForStaff(gymId: string, userId: string) {
    return [...this.schedulerPreferenceRequestRecords.values()]
      .filter((request) => request.gymId === gymId && request.userId === userId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async createRequest(request: SchedulerRequest) {
    this.schedulerRequestRecords.set(request.id, request);
    return request;
  }

  async updateRequest(request: SchedulerRequest) {
    this.schedulerRequestRecords.set(request.id, request);
    return request;
  }

  async getRequest(requestId: string) {
    return this.schedulerRequestRecords.get(requestId);
  }

  async listRequestsForGym(gymId: string) {
    return [...this.schedulerRequestRecords.values()]
      .filter((request) => request.gymId === gymId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async listRequestsForStaff(gymId: string, userId: string) {
    return [...this.schedulerRequestRecords.values()]
      .filter((request) => request.gymId === gymId && request.userId === userId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async createLocation(location: Location) {
    this.locationRecords.set(location.id, location);
    return location;
  }

  async getLocation(locationId: string) {
    return this.locationRecords.get(locationId);
  }

  async listLocationsForGym(gymId: string) {
    return [...this.locationRecords.values()].filter((location) => location.gymId === gymId);
  }

  async updateLocation(location: Location) {
    this.locationRecords.set(location.id, location);
    return location;
  }

  async createMember(member: Member) {
    this.memberRecords.set(member.id, member);
    return member;
  }

  async getMember(memberId: string) {
    return this.memberRecords.get(memberId);
  }

  async listMembersForGym(gymId: string) {
    return [...this.memberRecords.values()].filter((member) => member.gymId === gymId);
  }

  async updateMember(member: Member) {
    this.memberRecords.set(member.id, member);
    return member;
  }

  async createMembershipPlan(plan: MembershipPlan) {
    this.membershipPlanRecords.set(plan.id, plan);
    return plan;
  }

  async getMembershipPlan(planId: string) {
    return this.membershipPlanRecords.get(planId);
  }

  async listMembershipPlansForGym(gymId: string) {
    return [...this.membershipPlanRecords.values()].filter((plan) => plan.gymId === gymId);
  }

  async updateMembershipPlan(plan: MembershipPlan) {
    this.membershipPlanRecords.set(plan.id, plan);
    return plan;
  }

  async createMemberMembership(membership: MemberMembership) {
    this.memberMembershipRecords.set(membership.id, membership);
    return membership;
  }

  async getMemberMembership(membershipId: string) {
    return this.memberMembershipRecords.get(membershipId);
  }

  async listMemberMembershipsForMember(memberId: string) {
    return [...this.memberMembershipRecords.values()]
      .filter((membership) => membership.memberId === memberId)
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  }

  async updateMemberMembership(membership: MemberMembership) {
    this.memberMembershipRecords.set(membership.id, membership);
    return membership;
  }

  async createClassType(classType: ClassType) {
    this.classTypeRecords.set(classType.id, classType);
    return classType;
  }

  async getClassType(classTypeId: string) {
    return this.classTypeRecords.get(classTypeId);
  }

  async listClassTypesForGym(gymId: string) {
    return [...this.classTypeRecords.values()].filter((classType) => classType.gymId === gymId);
  }

  async createClassSession(session: ClassSession) {
    this.classSessionRecords.set(session.id, session);
    return session;
  }

  async getClassSession(sessionId: string) {
    return this.classSessionRecords.get(sessionId);
  }

  async listClassSessionsForGym(gymId: string) {
    return [...this.classSessionRecords.values()].filter((session) => session.gymId === gymId);
  }

  async listPublicClassSessionsForGym(gymId: string, from: Date, to: Date) {
    return [...this.classSessionRecords.values()].filter(
      (session) =>
        session.gymId === gymId &&
        session.status === ClassSessionStatus.Scheduled &&
        this.classTypeRecords.get(session.classTypeId)?.isPublic === true &&
        session.startsAt >= from &&
        session.startsAt <= to
    );
  }

  async createClassBooking(booking: ClassBooking) {
    this.classBookingRecords.set(booking.id, booking);
    return booking;
  }

  async getClassBooking(bookingId: string) {
    return this.classBookingRecords.get(bookingId);
  }

  async listClassBookingsForSession(classSessionId: string) {
    return [...this.classBookingRecords.values()]
      .filter((booking) => booking.classSessionId === classSessionId)
      .sort(compareBookings);
  }

  async listClassBookingsForMember(memberId: string) {
    return [...this.classBookingRecords.values()]
      .filter((booking) => booking.memberId === memberId)
      .sort(compareBookings);
  }

  async updateClassBooking(booking: ClassBooking) {
    this.classBookingRecords.set(booking.id, booking);
    return booking;
  }

  async createResource(resource: ReservableResource) {
    this.reservableResourceRecords.set(resource.id, resource);
    return resource;
  }

  async getResource(resourceId: string) {
    return this.reservableResourceRecords.get(resourceId);
  }

  async listResourcesForGym(gymId: string) {
    return [...this.reservableResourceRecords.values()]
      .filter((resource) => resource.gymId === gymId)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async updateResource(resource: ReservableResource) {
    this.reservableResourceRecords.set(resource.id, resource);
    return resource;
  }

  async createAllocation(allocation: ResourceAllocation) {
    this.resourceAllocationRecords.set(allocation.id, allocation);
    return allocation;
  }

  async getAllocation(allocationId: string) {
    return this.resourceAllocationRecords.get(allocationId);
  }

  async listAllocationsForGym(gymId: string) {
    return [...this.resourceAllocationRecords.values()]
      .filter((allocation) => allocation.gymId === gymId)
      .sort(compareAllocations);
  }

  async listAllocationsForResource(resourceId: string) {
    return [...this.resourceAllocationRecords.values()]
      .filter((allocation) => allocation.resourceId === resourceId)
      .sort(compareAllocations);
  }

  async listAllocationsForClassSession(classSessionId: string) {
    return [...this.resourceAllocationRecords.values()]
      .filter((allocation) => allocation.classSessionId === classSessionId)
      .sort(compareAllocations);
  }

  async updateAllocation(allocation: ResourceAllocation) {
    this.resourceAllocationRecords.set(allocation.id, allocation);
    return allocation;
  }

  async createFacilityReservation(reservation: FacilityReservation) {
    this.facilityReservationRecords.set(reservation.id, reservation);
    return reservation;
  }

  async getFacilityReservation(reservationId: string) {
    return this.facilityReservationRecords.get(reservationId);
  }

  async listFacilityReservationsForGym(gymId: string) {
    return [...this.facilityReservationRecords.values()]
      .filter((reservation) => reservation.gymId === gymId)
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  }

  async updateFacilityReservation(reservation: FacilityReservation) {
    this.facilityReservationRecords.set(reservation.id, reservation);
    return reservation;
  }

  async createNotificationEvent(event: NotificationEvent) {
    this.notificationEventRecords.set(event.id, event);
    return event;
  }

  async listNotificationEventsForGym(gymId: string) {
    return [...this.notificationEventRecords.values()].filter((event) => event.gymId === gymId);
  }

  async createCheckIn(checkIn: CheckIn) {
    this.checkInRecords.set(checkIn.id, checkIn);
    return checkIn;
  }

  async listCheckInsForMember(memberId: string) {
    return [...this.checkInRecords.values()].filter((checkIn) => checkIn.memberId === memberId);
  }

  async listCheckInsForGym(gymId: string) {
    return [...this.checkInRecords.values()].filter((checkIn) => checkIn.gymId === gymId);
  }

  async deleteCheckIn(checkInId: string, gymId: string) {
    const existing = this.checkInRecords.get(checkInId);
    if (!existing || existing.gymId !== gymId) {
      return false;
    }
    this.checkInRecords.delete(checkInId);
    return true;
  }

  async createAccessDevice(device: AccessDevice) {
    this.accessDeviceRecords.set(device.id, device);
    return device;
  }

  async getAccessDevice(deviceId: string) {
    return this.accessDeviceRecords.get(deviceId);
  }

  async findAccessDeviceByApiKeyHash(apiKeyHash: string) {
    return [...this.accessDeviceRecords.values()].find(
      (device) => device.apiKeyHash === apiKeyHash
    );
  }

  async listAccessDevicesForGym(gymId: string) {
    return [...this.accessDeviceRecords.values()].filter((device) => device.gymId === gymId);
  }

  async updateAccessDevice(device: AccessDevice) {
    this.accessDeviceRecords.set(device.id, device);
    return device;
  }

  async createAccessRule(rule: AccessRule) {
    this.accessRuleRecords.set(rule.id, rule);
    return rule;
  }

  async listAccessRulesForGym(gymId: string) {
    return [...this.accessRuleRecords.values()].filter((rule) => rule.gymId === gymId);
  }

  async createAccessEvent(event: AccessEvent) {
    this.accessEventRecords.set(event.id, event);
    return event;
  }

  async listAccessEventsForGym(gymId: string) {
    return [...this.accessEventRecords.values()]
      .filter((event) => event.gymId === gymId)
      .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
  }

  async createRefreshToken(refreshToken: RefreshToken) {
    this.refreshTokenRecords.set(refreshToken.id, refreshToken);
    return refreshToken;
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return [...this.refreshTokenRecords.values()].find(
      (refreshToken) => refreshToken.tokenHash === tokenHash
    );
  }

  async listRefreshTokensForUser(userId: string) {
    return [...this.refreshTokenRecords.values()].filter(
      (refreshToken) => refreshToken.userId === userId
    );
  }

  async updateRefreshToken(refreshToken: RefreshToken) {
    this.refreshTokenRecords.set(refreshToken.id, refreshToken);
    return refreshToken;
  }

  async createPurposeToken(purposeToken: PurposeToken) {
    this.purposeTokenRecords.set(purposeToken.id, purposeToken);
    return purposeToken;
  }

  async findPurposeTokenByHash(tokenHash: string, purpose: PurposeToken["purpose"]) {
    return [...this.purposeTokenRecords.values()].find(
      (purposeToken) => purposeToken.purpose === purpose && purposeToken.tokenHash === tokenHash
    );
  }

  async updatePurposeToken(purposeToken: PurposeToken) {
    this.purposeTokenRecords.set(purposeToken.id, purposeToken);
    return purposeToken;
  }

  snapshot(): StoreSnapshot {
    return {
      users: [...this.userRecords.values()],
      gyms: [...this.gymRecords.values()],
      roles: [...this.roleRecords.values()],
      gymUsers: [...this.gymUserRecords.values()],
      staffInvites: [...this.staffInviteRecords.values()],
      staffAuditLogs: [...this.staffAuditLogRecords.values()],
      staffShifts: [...this.staffShiftRecords.values()],
      staffTimeEntries: [...this.staffTimeEntryRecords.values()],
      schedulerCoverageRules: [...this.schedulerCoverageRuleRecords.values()],
      schedulerAvailabilities: [...this.schedulerAvailabilityRecords.values()],
      schedulerSettings: [...this.schedulerSettingsRecords.values()],
      schedulerPreferenceRequests: [...this.schedulerPreferenceRequestRecords.values()],
      schedulerRequests: [...this.schedulerRequestRecords.values()],
      locations: [...this.locationRecords.values()],
      members: [...this.memberRecords.values()],
      membershipPlans: [...this.membershipPlanRecords.values()],
      memberMemberships: [...this.memberMembershipRecords.values()],
      classTypes: [...this.classTypeRecords.values()],
      classSessions: [...this.classSessionRecords.values()],
      classBookings: [...this.classBookingRecords.values()],
      reservableResources: [...this.reservableResourceRecords.values()],
      resourceAllocations: [...this.resourceAllocationRecords.values()],
      facilityReservations: [...this.facilityReservationRecords.values()],
      notificationEvents: [...this.notificationEventRecords.values()],
      checkIns: [...this.checkInRecords.values()],
      accessDevices: [...this.accessDeviceRecords.values()],
      accessRules: [...this.accessRuleRecords.values()],
      accessEvents: [...this.accessEventRecords.values()],
      refreshTokens: [...this.refreshTokenRecords.values()],
      purposeTokens: [...this.purposeTokenRecords.values()]
    };
  }
}

function compareBookings(left: ClassBooking, right: ClassBooking) {
  return (
    (left.waitlistPosition ?? Number.MAX_SAFE_INTEGER) -
      (right.waitlistPosition ?? Number.MAX_SAFE_INTEGER) ||
    left.createdAt.getTime() - right.createdAt.getTime()
  );
}

function compareAllocations(left: ResourceAllocation, right: ResourceAllocation) {
  return left.startsAt.getTime() - right.startsAt.getTime() || left.id.localeCompare(right.id);
}
