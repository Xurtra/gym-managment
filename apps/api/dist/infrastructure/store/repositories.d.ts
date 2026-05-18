import type { AccessDevice, AccessEvent, AccessRule, Gym, GymUser, ClassBooking, CheckIn, ClassSession, ClassType, Location, Member, MemberMembership, MembershipPlan, NotificationEvent, PurposeToken, RefreshToken, Role, StaffAuditLog, StaffInvite, StaffShift, User } from "./entities.js";
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
}
export interface RoleRepository {
    createRole(role: Role): RepositoryResult<Role>;
    createRoles(roles: Role[]): RepositoryResult<Role[]>;
    getRole(roleId: string): RepositoryResult<Role | undefined>;
    listRolesForGym(gymId: string): RepositoryResult<Role[]>;
    updateRole(role: Role): RepositoryResult<Role>;
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
    listStaffShiftsForStaff(gymId: string, userId: string): RepositoryResult<StaffShift[]>;
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
    listPublicClassSessionsForGym(gymId: string, from: Date, to: Date): RepositoryResult<ClassSession[]>;
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
    findPurposeTokenByHash(tokenHash: string, purpose: PurposeToken["purpose"]): RepositoryResult<PurposeToken | undefined>;
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
//# sourceMappingURL=repositories.d.ts.map