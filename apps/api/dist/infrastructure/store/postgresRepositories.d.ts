import type { Pool, QueryResult, QueryResultRow } from "pg";
import type { AccessDevice, AccessEvent, AccessRule, Gym, GymUser, ClassBooking, CheckIn, ClassSession, ClassType, Location, Member, MemberMembership, MembershipPlan, NotificationEvent, PurposeToken, RefreshToken, Role, StaffAuditLog, StaffInvite, StaffShift, User } from "./entities.js";
import type { Repositories } from "./repositories.js";
interface QueryExecutor {
    query<R extends QueryResultRow = QueryResultRow>(text: string, values?: readonly unknown[]): Promise<QueryResult<R>>;
}
interface TransactionClient extends QueryExecutor {
    release(): void;
}
interface TransactionPool {
    connect(): Promise<TransactionClient>;
}
export declare class PostgresRepositories implements Repositories {
    private readonly executor;
    private readonly pool?;
    readonly users: {
        createUser: (user: User) => Promise<User>;
        getUser: (userId: string) => Promise<User | undefined>;
        findUserByEmail: (email: string) => Promise<User | undefined>;
        updateUser: (user: User) => Promise<User>;
    };
    readonly gyms: {
        createGym: (gym: Gym) => Promise<Gym>;
        getGym: (gymId: string) => Promise<Gym | undefined>;
        findGymBySlug: (slug: string) => Promise<Gym | undefined>;
        listGyms: () => Promise<Gym[]>;
        updateGym: (gym: Gym) => Promise<Gym>;
    };
    readonly roles: {
        createRole: (role: Role) => Promise<Role>;
        createRoles: (roles: Role[]) => Promise<Role[]>;
        getRole: (roleId: string) => Promise<Role | undefined>;
        listRolesForGym: (gymId: string) => Promise<Role[]>;
        updateRole: (role: Role) => Promise<Role>;
    };
    readonly gymUsers: {
        createGymUser: (gymUser: GymUser) => Promise<GymUser>;
        findGymUser: (gymId: string, userId: string) => Promise<GymUser | undefined>;
        listGymUsersForGym: (gymId: string) => Promise<GymUser[]>;
        listGymMemberships: (userId: string) => Promise<GymUser[]>;
        updateGymUser: (gymUser: GymUser) => Promise<GymUser>;
    };
    readonly staffInvites: {
        createStaffInvite: (invite: StaffInvite) => Promise<StaffInvite>;
        getStaffInvite: (inviteId: string) => Promise<StaffInvite | undefined>;
        findStaffInviteByTokenHash: (tokenHash: string) => Promise<StaffInvite | undefined>;
        findPendingStaffInvite: (gymId: string, email: string) => Promise<StaffInvite | undefined>;
        listStaffInvitesForGym: (gymId: string) => Promise<StaffInvite[]>;
        updateStaffInvite: (invite: StaffInvite) => Promise<StaffInvite>;
    };
    readonly staffAuditLogs: {
        createStaffAuditLog: (entry: StaffAuditLog) => Promise<StaffAuditLog>;
        listStaffAuditLogsForGym: (gymId: string) => Promise<StaffAuditLog[]>;
    };
    readonly staffShifts: {
        createStaffShift: (shift: StaffShift) => Promise<StaffShift>;
        listStaffShiftsForStaff: (gymId: string, userId: string) => Promise<StaffShift[]>;
    };
    readonly locations: {
        createLocation: (location: Location) => Promise<Location>;
        getLocation: (locationId: string) => Promise<Location | undefined>;
        listLocationsForGym: (gymId: string) => Promise<Location[]>;
        updateLocation: (location: Location) => Promise<Location>;
    };
    readonly members: {
        createMember: (member: Member) => Promise<Member>;
        getMember: (memberId: string) => Promise<Member | undefined>;
        listMembersForGym: (gymId: string) => Promise<Member[]>;
        updateMember: (member: Member) => Promise<Member>;
    };
    readonly membershipPlans: {
        createMembershipPlan: (plan: MembershipPlan) => Promise<MembershipPlan>;
        getMembershipPlan: (planId: string) => Promise<MembershipPlan | undefined>;
        listMembershipPlansForGym: (gymId: string) => Promise<MembershipPlan[]>;
        updateMembershipPlan: (plan: MembershipPlan) => Promise<MembershipPlan>;
    };
    readonly memberMemberships: {
        createMemberMembership: (membership: MemberMembership) => Promise<MemberMembership>;
        getMemberMembership: (membershipId: string) => Promise<MemberMembership | undefined>;
        listMemberMembershipsForMember: (memberId: string) => Promise<MemberMembership[]>;
        updateMemberMembership: (membership: MemberMembership) => Promise<MemberMembership>;
    };
    readonly classes: {
        createClassType: (classType: ClassType) => Promise<ClassType>;
        getClassType: (classTypeId: string) => Promise<ClassType | undefined>;
        listClassTypesForGym: (gymId: string) => Promise<ClassType[]>;
        createClassSession: (session: ClassSession) => Promise<ClassSession>;
        getClassSession: (sessionId: string) => Promise<ClassSession | undefined>;
        listClassSessionsForGym: (gymId: string) => Promise<ClassSession[]>;
        listPublicClassSessionsForGym: (gymId: string, from: Date, to: Date) => Promise<ClassSession[]>;
    };
    readonly bookings: {
        createClassBooking: (booking: ClassBooking) => Promise<ClassBooking>;
        getClassBooking: (bookingId: string) => Promise<ClassBooking | undefined>;
        listClassBookingsForSession: (classSessionId: string) => Promise<ClassBooking[]>;
        listClassBookingsForMember: (memberId: string) => Promise<ClassBooking[]>;
        updateClassBooking: (booking: ClassBooking) => Promise<ClassBooking>;
    };
    readonly notifications: {
        createNotificationEvent: (event: NotificationEvent) => Promise<NotificationEvent>;
        listNotificationEventsForGym: (gymId: string) => Promise<NotificationEvent[]>;
    };
    readonly checkIns: {
        createCheckIn: (checkIn: CheckIn) => Promise<CheckIn>;
        listCheckInsForMember: (memberId: string) => Promise<CheckIn[]>;
        listCheckInsForGym: (gymId: string) => Promise<CheckIn[]>;
        deleteCheckIn: (checkInId: string, gymId: string) => Promise<boolean>;
    };
    readonly accessControl: {
        createAccessDevice: (device: AccessDevice) => Promise<AccessDevice>;
        getAccessDevice: (deviceId: string) => Promise<AccessDevice | undefined>;
        findAccessDeviceByApiKeyHash: (apiKeyHash: string) => Promise<AccessDevice | undefined>;
        listAccessDevicesForGym: (gymId: string) => Promise<AccessDevice[]>;
        updateAccessDevice: (device: AccessDevice) => Promise<AccessDevice>;
        createAccessRule: (rule: AccessRule) => Promise<AccessRule>;
        listAccessRulesForGym: (gymId: string) => Promise<AccessRule[]>;
        createAccessEvent: (event: AccessEvent) => Promise<AccessEvent>;
        listAccessEventsForGym: (gymId: string) => Promise<AccessEvent[]>;
    };
    readonly tokens: {
        createRefreshToken: (refreshToken: RefreshToken) => Promise<RefreshToken>;
        findRefreshTokenByHash: (tokenHash: string) => Promise<RefreshToken | undefined>;
        listRefreshTokensForUser: (userId: string) => Promise<RefreshToken[]>;
        updateRefreshToken: (refreshToken: RefreshToken) => Promise<RefreshToken>;
        createPurposeToken: (purposeToken: PurposeToken) => Promise<PurposeToken>;
        findPurposeTokenByHash: (tokenHash: string, purpose: PurposeToken["purpose"]) => Promise<PurposeToken | undefined>;
        updatePurposeToken: (purposeToken: PurposeToken) => Promise<PurposeToken>;
    };
    constructor(executor: QueryExecutor, pool?: TransactionPool | undefined);
    transaction<T>(work: (repositories: Repositories) => Promise<T>): Promise<T>;
    createUser(user: User): Promise<User>;
    getUser(userId: string): Promise<User | undefined>;
    findUserByEmail(email: string): Promise<User | undefined>;
    updateUser(user: User): Promise<User>;
    createGym(gym: Gym): Promise<Gym>;
    getGym(gymId: string): Promise<Gym | undefined>;
    findGymBySlug(slug: string): Promise<Gym | undefined>;
    listGyms(): Promise<Gym[]>;
    updateGym(gym: Gym): Promise<Gym>;
    createRole(role: Role): Promise<Role>;
    createRoles(roles: Role[]): Promise<Role[]>;
    getRole(roleId: string): Promise<Role | undefined>;
    listRolesForGym(gymId: string): Promise<Role[]>;
    updateRole(role: Role): Promise<Role>;
    createGymUser(gymUser: GymUser): Promise<GymUser>;
    findGymUser(gymId: string, userId: string): Promise<GymUser | undefined>;
    listGymUsersForGym(gymId: string): Promise<GymUser[]>;
    listGymMemberships(userId: string): Promise<GymUser[]>;
    updateGymUser(gymUser: GymUser): Promise<GymUser>;
    createStaffInvite(invite: StaffInvite): Promise<StaffInvite>;
    getStaffInvite(inviteId: string): Promise<StaffInvite | undefined>;
    findStaffInviteByTokenHash(tokenHash: string): Promise<StaffInvite | undefined>;
    findPendingStaffInvite(gymId: string, email: string): Promise<StaffInvite | undefined>;
    listStaffInvitesForGym(gymId: string): Promise<StaffInvite[]>;
    updateStaffInvite(invite: StaffInvite): Promise<StaffInvite>;
    createStaffAuditLog(entry: StaffAuditLog): Promise<StaffAuditLog>;
    listStaffAuditLogsForGym(gymId: string): Promise<StaffAuditLog[]>;
    createStaffShift(shift: StaffShift): Promise<StaffShift>;
    listStaffShiftsForStaff(gymId: string, userId: string): Promise<StaffShift[]>;
    createLocation(location: Location): Promise<Location>;
    getLocation(locationId: string): Promise<Location | undefined>;
    listLocationsForGym(gymId: string): Promise<Location[]>;
    updateLocation(location: Location): Promise<Location>;
    createMember(member: Member): Promise<Member>;
    getMember(memberId: string): Promise<Member | undefined>;
    listMembersForGym(gymId: string): Promise<Member[]>;
    updateMember(member: Member): Promise<Member>;
    createMembershipPlan(plan: MembershipPlan): Promise<MembershipPlan>;
    getMembershipPlan(planId: string): Promise<MembershipPlan | undefined>;
    listMembershipPlansForGym(gymId: string): Promise<MembershipPlan[]>;
    updateMembershipPlan(plan: MembershipPlan): Promise<MembershipPlan>;
    createMemberMembership(membership: MemberMembership): Promise<MemberMembership>;
    getMemberMembership(membershipId: string): Promise<MemberMembership | undefined>;
    listMemberMembershipsForMember(memberId: string): Promise<MemberMembership[]>;
    updateMemberMembership(membership: MemberMembership): Promise<MemberMembership>;
    createClassType(classType: ClassType): Promise<ClassType>;
    getClassType(classTypeId: string): Promise<ClassType | undefined>;
    listClassTypesForGym(gymId: string): Promise<ClassType[]>;
    createClassSession(session: ClassSession): Promise<ClassSession>;
    getClassSession(sessionId: string): Promise<ClassSession | undefined>;
    listClassSessionsForGym(gymId: string): Promise<ClassSession[]>;
    listPublicClassSessionsForGym(gymId: string, from: Date, to: Date): Promise<ClassSession[]>;
    createClassBooking(booking: ClassBooking): Promise<ClassBooking>;
    getClassBooking(bookingId: string): Promise<ClassBooking | undefined>;
    listClassBookingsForSession(classSessionId: string): Promise<ClassBooking[]>;
    listClassBookingsForMember(memberId: string): Promise<ClassBooking[]>;
    updateClassBooking(booking: ClassBooking): Promise<ClassBooking>;
    createNotificationEvent(event: NotificationEvent): Promise<NotificationEvent>;
    listNotificationEventsForGym(gymId: string): Promise<NotificationEvent[]>;
    createCheckIn(checkIn: CheckIn): Promise<CheckIn>;
    listCheckInsForMember(memberId: string): Promise<CheckIn[]>;
    listCheckInsForGym(gymId: string): Promise<CheckIn[]>;
    deleteCheckIn(checkInId: string, gymId: string): Promise<boolean>;
    createAccessDevice(device: AccessDevice): Promise<AccessDevice>;
    getAccessDevice(deviceId: string): Promise<AccessDevice | undefined>;
    findAccessDeviceByApiKeyHash(apiKeyHash: string): Promise<AccessDevice | undefined>;
    listAccessDevicesForGym(gymId: string): Promise<AccessDevice[]>;
    updateAccessDevice(device: AccessDevice): Promise<AccessDevice>;
    createAccessRule(rule: AccessRule): Promise<AccessRule>;
    listAccessRulesForGym(gymId: string): Promise<AccessRule[]>;
    createAccessEvent(event: AccessEvent): Promise<AccessEvent>;
    listAccessEventsForGym(gymId: string): Promise<AccessEvent[]>;
    createRefreshToken(refreshToken: RefreshToken): Promise<RefreshToken>;
    findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined>;
    listRefreshTokensForUser(userId: string): Promise<RefreshToken[]>;
    updateRefreshToken(refreshToken: RefreshToken): Promise<RefreshToken>;
    createPurposeToken(purposeToken: PurposeToken): Promise<PurposeToken>;
    findPurposeTokenByHash(tokenHash: string, purpose: PurposeToken["purpose"]): Promise<PurposeToken | undefined>;
    updatePurposeToken(purposeToken: PurposeToken): Promise<PurposeToken>;
}
export declare function createPostgresRepositories(pool: Pool): PostgresRepositories;
export {};
//# sourceMappingURL=postgresRepositories.d.ts.map