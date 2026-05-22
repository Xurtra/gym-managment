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
  Location,
  Member,
  MemberMembership,
  MembershipPlan,
  NotificationEvent,
  PurposeToken,
  RefreshToken,
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

export type RepositoryResult<T> = Promise<T>;

export interface UserRepository {
  createUser(user: User): RepositoryResult<User>;
  getUser(userId: string): RepositoryResult<User | undefined>;
  findUserByEmail(email: string): RepositoryResult<User | undefined>;
  updateUser(user: User): RepositoryResult<User>;
}

export interface GymRepository {
  createGym(gym: Gym): RepositoryResult<Gym>;
  getGym(gymId: string): RepositoryResult<Gym | undefined>;
  findGymBySlug(slug: string): RepositoryResult<Gym | undefined>;
  updateGym(gym: Gym): RepositoryResult<Gym>;
  listGyms(): RepositoryResult<Gym[]>;
}

export interface RoleRepository {
  createRole(role: Role): RepositoryResult<Role>;
  createRoles(roles: Role[]): RepositoryResult<Role[]>;
  getRole(roleId: string): RepositoryResult<Role | undefined>;
  listRolesForGym(gymId: string): RepositoryResult<Role[]>;
  updateRole(role: Role): RepositoryResult<Role>;
  deleteRole(roleId: string): RepositoryResult<void>;
}

export interface GymUserRepository {
  createGymUser(gymUser: GymUser): RepositoryResult<GymUser>;
  findGymUser(gymId: string, userId: string): RepositoryResult<GymUser | undefined>;
  listGymUsersForGym(gymId: string): RepositoryResult<GymUser[]>;
  listGymMemberships(userId: string): RepositoryResult<GymUser[]>;
  updateGymUser(gymUser: GymUser): RepositoryResult<GymUser>;
}

export interface StaffInviteRepository {
  createStaffInvite(invite: StaffInvite): RepositoryResult<StaffInvite>;
  getStaffInvite(inviteId: string): RepositoryResult<StaffInvite | undefined>;
  findStaffInviteByTokenHash(tokenHash: string): RepositoryResult<StaffInvite | undefined>;
  findPendingStaffInvite(gymId: string, email: string): RepositoryResult<StaffInvite | undefined>;
  listStaffInvitesForGym(gymId: string): RepositoryResult<StaffInvite[]>;
  updateStaffInvite(invite: StaffInvite): RepositoryResult<StaffInvite>;
}

export interface StaffAuditLogRepository {
  createStaffAuditLog(entry: StaffAuditLog): RepositoryResult<StaffAuditLog>;
  listStaffAuditLogsForGym(gymId: string): RepositoryResult<StaffAuditLog[]>;
}

export interface StaffShiftRepository {
  createStaffShift(shift: StaffShift): RepositoryResult<StaffShift>;
  updateStaffShift(shift: StaffShift): RepositoryResult<StaffShift>;
  listStaffShiftsForGym(gymId: string): RepositoryResult<StaffShift[]>;
  listStaffShiftsForStaff(gymId: string, userId: string): RepositoryResult<StaffShift[]>;
}

export interface StaffTimeEntryRepository {
  createStaffTimeEntry(entry: StaffTimeEntry): RepositoryResult<StaffTimeEntry>;
  updateStaffTimeEntry(entry: StaffTimeEntry): RepositoryResult<StaffTimeEntry>;
  listStaffTimeEntriesForGym(gymId: string): RepositoryResult<StaffTimeEntry[]>;
  listStaffTimeEntriesForStaff(gymId: string, userId: string): RepositoryResult<StaffTimeEntry[]>;
  findOpenStaffTimeEntry(gymId: string, userId: string): RepositoryResult<StaffTimeEntry | undefined>;
}

export interface SchedulerRepository {
  getSettings(gymId: string): RepositoryResult<SchedulerSettings | undefined>;
  upsertSettings(settings: SchedulerSettings): RepositoryResult<SchedulerSettings>;
  createCoverageRule(rule: SchedulerCoverageRule): RepositoryResult<SchedulerCoverageRule>;
  listCoverageRulesForGym(gymId: string): RepositoryResult<SchedulerCoverageRule[]>;
  createAvailability(availability: SchedulerAvailability): RepositoryResult<SchedulerAvailability>;
  replaceAvailabilitiesForStaff(
    gymId: string,
    userId: string,
    availabilities: SchedulerAvailability[]
  ): RepositoryResult<SchedulerAvailability[]>;
  listAvailabilitiesForGym(gymId: string): RepositoryResult<SchedulerAvailability[]>;
  listAvailabilitiesForStaff(gymId: string, userId: string): RepositoryResult<SchedulerAvailability[]>;
  createPreferenceRequest(request: SchedulerPreferenceRequest): RepositoryResult<SchedulerPreferenceRequest>;
  updatePreferenceRequest(request: SchedulerPreferenceRequest): RepositoryResult<SchedulerPreferenceRequest>;
  getPreferenceRequest(requestId: string): RepositoryResult<SchedulerPreferenceRequest | undefined>;
  listPreferenceRequestsForGym(gymId: string): RepositoryResult<SchedulerPreferenceRequest[]>;
  listPreferenceRequestsForStaff(gymId: string, userId: string): RepositoryResult<SchedulerPreferenceRequest[]>;
  createRequest(request: SchedulerRequest): RepositoryResult<SchedulerRequest>;
  updateRequest(request: SchedulerRequest): RepositoryResult<SchedulerRequest>;
  getRequest(requestId: string): RepositoryResult<SchedulerRequest | undefined>;
  listRequestsForGym(gymId: string): RepositoryResult<SchedulerRequest[]>;
  listRequestsForStaff(gymId: string, userId: string): RepositoryResult<SchedulerRequest[]>;
}

export interface LocationRepository {
  createLocation(location: Location): RepositoryResult<Location>;
  getLocation(locationId: string): RepositoryResult<Location | undefined>;
  listLocationsForGym(gymId: string): RepositoryResult<Location[]>;
  updateLocation(location: Location): RepositoryResult<Location>;
}

export interface MemberRepository {
  createMember(member: Member): RepositoryResult<Member>;
  getMember(memberId: string): RepositoryResult<Member | undefined>;
  listMembersForGym(gymId: string): RepositoryResult<Member[]>;
  updateMember(member: Member): RepositoryResult<Member>;
}

export interface MembershipPlanRepository {
  createMembershipPlan(plan: MembershipPlan): RepositoryResult<MembershipPlan>;
  getMembershipPlan(planId: string): RepositoryResult<MembershipPlan | undefined>;
  listMembershipPlansForGym(gymId: string): RepositoryResult<MembershipPlan[]>;
  updateMembershipPlan(plan: MembershipPlan): RepositoryResult<MembershipPlan>;
}

export interface MemberMembershipRepository {
  createMemberMembership(membership: MemberMembership): RepositoryResult<MemberMembership>;
  getMemberMembership(membershipId: string): RepositoryResult<MemberMembership | undefined>;
  listMemberMembershipsForMember(memberId: string): RepositoryResult<MemberMembership[]>;
  updateMemberMembership(membership: MemberMembership): RepositoryResult<MemberMembership>;
}

export interface ClassRepository {
  createClassType(classType: ClassType): RepositoryResult<ClassType>;
  getClassType(classTypeId: string): RepositoryResult<ClassType | undefined>;
  listClassTypesForGym(gymId: string): RepositoryResult<ClassType[]>;
  createClassSession(session: ClassSession): RepositoryResult<ClassSession>;
  getClassSession(sessionId: string): RepositoryResult<ClassSession | undefined>;
  listClassSessionsForGym(gymId: string): RepositoryResult<ClassSession[]>;
  listPublicClassSessionsForGym(
    gymId: string,
    from: Date,
    to: Date
  ): RepositoryResult<ClassSession[]>;
}

export interface BookingRepository {
  createClassBooking(booking: ClassBooking): RepositoryResult<ClassBooking>;
  getClassBooking(bookingId: string): RepositoryResult<ClassBooking | undefined>;
  listClassBookingsForSession(classSessionId: string): RepositoryResult<ClassBooking[]>;
  listClassBookingsForMember(memberId: string): RepositoryResult<ClassBooking[]>;
  updateClassBooking(booking: ClassBooking): RepositoryResult<ClassBooking>;
}

export interface NotificationRepository {
  createNotificationEvent(event: NotificationEvent): RepositoryResult<NotificationEvent>;
  listNotificationEventsForGym(gymId: string): RepositoryResult<NotificationEvent[]>;
}

export interface CheckInRepository {
  createCheckIn(checkIn: CheckIn): RepositoryResult<CheckIn>;
  listCheckInsForMember(memberId: string): RepositoryResult<CheckIn[]>;
  listCheckInsForGym(gymId: string): RepositoryResult<CheckIn[]>;
  deleteCheckIn(checkInId: string, gymId: string): RepositoryResult<boolean>;
}

export interface AccessControlRepository {
  createAccessDevice(device: AccessDevice): RepositoryResult<AccessDevice>;
  getAccessDevice(deviceId: string): RepositoryResult<AccessDevice | undefined>;
  findAccessDeviceByApiKeyHash(apiKeyHash: string): RepositoryResult<AccessDevice | undefined>;
  listAccessDevicesForGym(gymId: string): RepositoryResult<AccessDevice[]>;
  updateAccessDevice(device: AccessDevice): RepositoryResult<AccessDevice>;
  createAccessRule(rule: AccessRule): RepositoryResult<AccessRule>;
  listAccessRulesForGym(gymId: string): RepositoryResult<AccessRule[]>;
  createAccessEvent(event: AccessEvent): RepositoryResult<AccessEvent>;
  listAccessEventsForGym(gymId: string): RepositoryResult<AccessEvent[]>;
}

export interface TokenRepository {
  createRefreshToken(refreshToken: RefreshToken): RepositoryResult<RefreshToken>;
  findRefreshTokenByHash(tokenHash: string): RepositoryResult<RefreshToken | undefined>;
  listRefreshTokensForUser(userId: string): RepositoryResult<RefreshToken[]>;
  updateRefreshToken(refreshToken: RefreshToken): RepositoryResult<RefreshToken>;
  createPurposeToken(purposeToken: PurposeToken): RepositoryResult<PurposeToken>;
  findPurposeTokenByHash(
    tokenHash: string,
    purpose: PurposeToken["purpose"]
  ): RepositoryResult<PurposeToken | undefined>;
  updatePurposeToken(purposeToken: PurposeToken): RepositoryResult<PurposeToken>;
}

export interface Repositories {
  users: UserRepository;
  gyms: GymRepository;
  roles: RoleRepository;
  gymUsers: GymUserRepository;
  staffInvites: StaffInviteRepository;
  staffAuditLogs: StaffAuditLogRepository;
  staffShifts: StaffShiftRepository;
  staffTimeEntries: StaffTimeEntryRepository;
  scheduler: SchedulerRepository;
  locations: LocationRepository;
  members: MemberRepository;
  membershipPlans: MembershipPlanRepository;
  memberMemberships: MemberMembershipRepository;
  classes: ClassRepository;
  bookings: BookingRepository;
  notifications: NotificationRepository;
  checkIns: CheckInRepository;
  accessControl: AccessControlRepository;
  tokens: TokenRepository;
  transaction<T>(work: (repositories: Repositories) => Promise<T>): Promise<T>;
}
