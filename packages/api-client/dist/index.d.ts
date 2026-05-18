import type { AccessDeviceCreateInput, AccessDeviceEventInput, AccessDeviceHeartbeatInput, AccessRuleCreateInput, ClassBookingCreateInput, CheckInCreateInput, ClassSessionCreateInput, ClassTypeCreateInput, CustomRoleCreateInput, CustomRoleUpdateInput, GymCreateInput, GymUpdateInput, LocationCreateInput, LocationUpdateInput, LoginInput, MemberCreateInput, MemberMembershipAssignInput, MemberUpdateInput, MembershipPlanCreateInput, MembershipPlanUpdateInput, RegisterInput, ResetPasswordInput, RoleAssignmentInput, StaffAccessRemoveInput, StaffInviteAcceptInput, StaffInviteCreateInput, StaffShiftCreateInput, StaffManualBookingInput } from "@gym-platform/validation";
export interface ApiClientOptions {
    baseUrl: string;
    accessToken?: string;
    tokenStore?: ApiTokenStore;
    fetchImpl?: typeof fetch;
    onSessionExpired?: () => void;
}
export interface ApiTokenStore {
    getAccessToken(): string | undefined;
    getRefreshToken(): string | undefined;
    setTokens(tokens: {
        accessToken: string;
        refreshToken: string;
    }): void;
    clearTokens(): void;
}
export declare class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(message: string, status: number, code: string);
}
export declare class GymApiClient {
    private readonly options;
    private readonly fetchImpl;
    constructor(options: ApiClientOptions);
    register(input: RegisterInput): Promise<unknown>;
    login(input: LoginInput): Promise<unknown>;
    refresh(refreshToken: string): Promise<unknown>;
    logout(refreshToken: string): Promise<unknown>;
    forgotPassword(email: string): Promise<unknown>;
    resetPassword(input: ResetPasswordInput): Promise<unknown>;
    setupTwoFactor(): Promise<unknown>;
    verifyTwoFactor(code: string): Promise<unknown>;
    regenerateTwoFactorRecoveryCodes(): Promise<unknown>;
    acceptStaffInvite(input: StaffInviteAcceptInput): Promise<unknown>;
    me(): Promise<unknown>;
    createGym(input: GymCreateInput): Promise<unknown>;
    getGym(gymId: string): Promise<unknown>;
    updateGym(gymId: string, input: GymUpdateInput): Promise<unknown>;
    listLocations(gymId: string): Promise<unknown>;
    getLocation(gymId: string, locationId: string): Promise<unknown>;
    listLocationRooms(gymId: string, locationId: string): Promise<unknown>;
    createLocation(gymId: string, input: LocationCreateInput): Promise<unknown>;
    updateLocation(gymId: string, locationId: string, input: LocationUpdateInput): Promise<unknown>;
    archiveLocation(gymId: string, locationId: string): Promise<unknown>;
    listStaffInvites(gymId: string): Promise<unknown>;
    createStaffInvite(gymId: string, input: StaffInviteCreateInput): Promise<unknown>;
    listRoles(gymId: string): Promise<unknown>;
    createCustomRole(gymId: string, input: CustomRoleCreateInput): Promise<unknown>;
    updateCustomRole(gymId: string, roleId: string, input: CustomRoleUpdateInput): Promise<unknown>;
    listStaff(gymId: string): Promise<unknown>;
    assignStaffRole(gymId: string, input: RoleAssignmentInput): Promise<unknown>;
    removeStaffAccess(gymId: string, userId: string, input?: StaffAccessRemoveInput): Promise<unknown>;
    listStaffAuditLogs(gymId: string): Promise<unknown>;
    createStaffShift(gymId: string, input: StaffShiftCreateInput): Promise<unknown>;
    listMembers(gymId: string): Promise<unknown>;
    createMember(gymId: string, input: MemberCreateInput): Promise<unknown>;
    updateMember(gymId: string, memberId: string, input: MemberUpdateInput): Promise<unknown>;
    archiveMember(gymId: string, memberId: string): Promise<unknown>;
    listMemberMemberships(gymId: string, memberId: string): Promise<unknown>;
    assignMemberMembership(gymId: string, memberId: string, input: MemberMembershipAssignInput): Promise<unknown>;
    listMembershipPlans(gymId: string): Promise<unknown>;
    createMembershipPlan(gymId: string, input: MembershipPlanCreateInput): Promise<unknown>;
    updateMembershipPlan(gymId: string, planId: string, input: MembershipPlanUpdateInput): Promise<unknown>;
    archiveMembershipPlan(gymId: string, planId: string): Promise<unknown>;
    listClassTypes(gymId: string): Promise<unknown>;
    createClassType(gymId: string, input: ClassTypeCreateInput): Promise<unknown>;
    createClassSession(gymId: string, input: ClassSessionCreateInput): Promise<unknown>;
    listClassBookings(gymId: string, sessionId: string): Promise<unknown>;
    createClassBooking(gymId: string, sessionId: string, input: ClassBookingCreateInput): Promise<unknown>;
    createStaffManualBooking(gymId: string, sessionId: string, input: StaffManualBookingInput): Promise<unknown>;
    cancelClassBooking(gymId: string, bookingId: string): Promise<unknown>;
    joinClassWaitlist(gymId: string, sessionId: string, input: ClassBookingCreateInput): Promise<unknown>;
    leaveClassWaitlist(gymId: string, bookingId: string): Promise<unknown>;
    memberCheckInCode(gymId: string, memberId: string): Promise<unknown>;
    listMemberCheckIns(gymId: string, memberId: string): Promise<unknown>;
    createCheckIn(gymId: string, input: CheckInCreateInput): Promise<unknown>;
    listAccessDevices(gymId: string): Promise<unknown>;
    createAccessDevice(gymId: string, input: AccessDeviceCreateInput): Promise<unknown>;
    rotateAccessDeviceKey(gymId: string, deviceId: string): Promise<unknown>;
    listAccessRules(gymId: string): Promise<unknown>;
    createAccessRule(gymId: string, input: AccessRuleCreateInput): Promise<unknown>;
    listAccessEvents(gymId: string): Promise<unknown>;
    createAccessDeviceEvent(input: AccessDeviceEventInput): Promise<unknown>;
    createAccessDeviceHeartbeat(input: AccessDeviceHeartbeatInput): Promise<unknown>;
    publicSchedule(gymSlug: string, from?: string, to?: string, locationId?: string): Promise<unknown>;
    private request;
    private send;
    private refreshStoredTokens;
}
//# sourceMappingURL=index.d.ts.map