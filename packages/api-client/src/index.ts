import type {
  AccessDeviceCreateInput,
  AccessDeviceEventInput,
  AccessDeviceHeartbeatInput,
  AccessRuleCreateInput,
  ClassBookingCreateInput,
  CheckInCreateInput,
  ClassSessionCreateInput,
  ClassTypeCreateInput,
  CustomRoleCreateInput,
  CustomRoleUpdateInput,
  GymCreateInput,
  GymUpdateInput,
  LocationCreateInput,
  LocationUpdateInput,
  LoginInput,
  MemberCreateInput,
  MemberMembershipAssignInput,
  MemberUpdateInput,
  MembershipPlanCreateInput,
  MembershipPlanUpdateInput,
  PublicSignupInput,
  RegisterInput,
  ResetPasswordInput,
  RoleAssignmentInput,
  SchedulerAvailabilityCreateInput,
  SchedulerCoverageRuleCreateInput,
  SchedulerGenerateInput,
  SchedulerPreferenceRequestCreateInput,
  SchedulerPreferenceRequestResolveInput,
  SchedulerPublishInput,
  SchedulerRequestCreateInput,
  SchedulerRequestResolveInput,
  SchedulerSettingsUpdateInput,
  StaffAccessRemoveInput,
  StaffClockInInput,
  StaffClockOutInput,
  StaffInviteAcceptInput,
  StaffInviteCreateInput,
  StaffShiftCreateInput,
  StaffSelfClockInInput,
  StaffSelfClockOutInput,
  StaffManualBookingInput
} from "@gym-platform/validation";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

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
  setTokens(tokens: { accessToken: string; refreshToken: string }): void;
  clearTokens(): void;
}

export class ApiError extends Error {
  public readonly issues: { path: string; message: string }[] | undefined;
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    issues?: { path: string; message: string }[]
  ) {
    super(message);
    this.issues = issues;
  }
}

export class GymApiClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: ApiClientOptions) {
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  register(input: RegisterInput) {
    return this.request("POST", "/auth/register", input);
  }

  login(input: LoginInput) {
    return this.request("POST", "/auth/login", input);
  }

  refresh(refreshToken: string) {
    return this.request("POST", "/auth/refresh", { refreshToken });
  }

  logout(refreshToken: string) {
    return this.request("POST", "/auth/logout", { refreshToken });
  }

  forgotPassword(email: string) {
    return this.request("POST", "/auth/forgot-password", { email });
  }

  resetPassword(input: ResetPasswordInput) {
    return this.request("POST", "/auth/reset-password", input);
  }

  setupTwoFactor() {
    return this.request("POST", "/auth/2fa/setup");
  }

  verifyTwoFactor(code: string) {
    return this.request("POST", "/auth/2fa/verify", { code });
  }

  regenerateTwoFactorRecoveryCodes() {
    return this.request("POST", "/auth/2fa/recovery-codes");
  }

  acceptStaffInvite(input: StaffInviteAcceptInput) {
    return this.request("POST", "/staff/invites/accept", input);
  }

  me() {
    return this.request("GET", "/auth/me");
  }

  listGyms() {
    return this.request("GET", "/gyms");
  }

  createGym(input: GymCreateInput) {
    return this.request("POST", "/gyms", input);
  }

  getGym(gymId: string) {
    return this.request("GET", `/gyms/${gymId}`);
  }

  updateGym(gymId: string, input: GymUpdateInput) {
    return this.request("PATCH", `/gyms/${gymId}`, input);
  }

  listLocations(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/locations`);
  }

  getLocation(gymId: string, locationId: string) {
    return this.request("GET", `/gyms/${gymId}/locations/${locationId}`);
  }

  listLocationRooms(gymId: string, locationId: string) {
    return this.request("GET", `/gyms/${gymId}/locations/${locationId}/rooms`);
  }

  createLocation(gymId: string, input: LocationCreateInput) {
    return this.request("POST", `/gyms/${gymId}/locations`, input);
  }

  updateLocation(gymId: string, locationId: string, input: LocationUpdateInput) {
    return this.request("PATCH", `/gyms/${gymId}/locations/${locationId}`, input);
  }

  archiveLocation(gymId: string, locationId: string) {
    return this.request("DELETE", `/gyms/${gymId}/locations/${locationId}`);
  }

  listStaffInvites(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/staff/invites`);
  }

  createStaffInvite(gymId: string, input: StaffInviteCreateInput) {
    return this.request("POST", `/gyms/${gymId}/staff/invites`, input);
  }

  listRoles(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/roles`);
  }

  createCustomRole(gymId: string, input: CustomRoleCreateInput) {
    return this.request("POST", `/gyms/${gymId}/roles`, input);
  }

  updateCustomRole(gymId: string, roleId: string, input: CustomRoleUpdateInput) {
    return this.request("PATCH", `/gyms/${gymId}/roles/${roleId}`, input);
  }

  deleteCustomRole(gymId: string, roleId: string) {
    return this.request("DELETE", `/gyms/${gymId}/roles/${roleId}`);
  }

  listStaff(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/staff`);
  }

  assignStaffRole(gymId: string, input: RoleAssignmentInput) {
    return this.request("POST", `/gyms/${gymId}/roles/assign`, input);
  }

  removeStaffAccess(gymId: string, userId: string, input: StaffAccessRemoveInput = {}) {
    return this.request("DELETE", `/gyms/${gymId}/staff/${userId}`, input);
  }

  listStaffAuditLogs(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/staff/audit`);
  }

  listStaffShifts(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/staff/shifts`);
  }

  listMyStaffShifts(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/staff/shifts/me`);
  }

  createStaffShift(gymId: string, input: StaffShiftCreateInput) {
    return this.request("POST", `/gyms/${gymId}/staff/shifts`, input);
  }

  listSchedulerRules(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/scheduler/rules`);
  }

  createSchedulerRule(gymId: string, input: SchedulerCoverageRuleCreateInput) {
    return this.request("POST", `/gyms/${gymId}/scheduler/rules`, input);
  }

  listSchedulerAvailability(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/scheduler/availability`);
  }

  createSchedulerAvailability(gymId: string, input: SchedulerAvailabilityCreateInput) {
    return this.request("POST", `/gyms/${gymId}/scheduler/availability`, input);
  }

  listMySchedulerAvailability(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/scheduler/availability/me`);
  }

  getSchedulerSettings(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/scheduler/settings`);
  }

  updateSchedulerSettings(gymId: string, input: SchedulerSettingsUpdateInput) {
    return this.request("PATCH", `/gyms/${gymId}/scheduler/settings`, input);
  }

  listSchedulerPreferenceRequests(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/scheduler/preference-requests`);
  }

  listMySchedulerPreferenceRequests(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/scheduler/preference-requests/me`);
  }

  createSchedulerPreferenceRequest(gymId: string, input: SchedulerPreferenceRequestCreateInput) {
    return this.request("POST", `/gyms/${gymId}/scheduler/preference-requests`, input);
  }

  resolveSchedulerPreferenceRequest(
    gymId: string,
    requestId: string,
    input: SchedulerPreferenceRequestResolveInput
  ) {
    return this.request(
      "POST",
      `/gyms/${gymId}/scheduler/preference-requests/${requestId}/resolve`,
      input
    );
  }

  listSchedulerRequests(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/scheduler/requests`);
  }

  listMySchedulerRequests(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/scheduler/requests/me`);
  }

  createSchedulerRequest(gymId: string, input: SchedulerRequestCreateInput) {
    return this.request("POST", `/gyms/${gymId}/scheduler/requests`, input);
  }

  generateSchedule(gymId: string, input: SchedulerGenerateInput) {
    return this.request("POST", `/gyms/${gymId}/scheduler/generate`, input);
  }

  publishSchedule(gymId: string, input: SchedulerPublishInput) {
    return this.request("POST", `/gyms/${gymId}/scheduler/publish`, input);
  }

  resolveSchedulerRequest(
    gymId: string,
    requestId: string,
    input: SchedulerRequestResolveInput
  ) {
    return this.request("POST", `/gyms/${gymId}/scheduler/requests/${requestId}/resolve`, input);
  }

  listStaffTimeEntries(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/staff/time-entries`);
  }

  listMyStaffTimeEntries(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/staff/time-entries/me`);
  }

  clockStaffIn(gymId: string, input: StaffClockInInput) {
    return this.request("POST", `/gyms/${gymId}/staff/time-entries/clock-in`, input);
  }

  clockMyStaffIn(gymId: string, input: StaffSelfClockInInput = {}) {
    return this.request("POST", `/gyms/${gymId}/staff/time-entries/me/clock-in`, input);
  }

  clockStaffOut(gymId: string, input: StaffClockOutInput) {
    return this.request("POST", `/gyms/${gymId}/staff/time-entries/clock-out`, input);
  }

  clockMyStaffOut(gymId: string, input: StaffSelfClockOutInput = {}) {
    return this.request("POST", `/gyms/${gymId}/staff/time-entries/me/clock-out`, input);
  }

  listMembers(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/members`);
  }

  createMember(gymId: string, input: MemberCreateInput) {
    return this.request("POST", `/gyms/${gymId}/members`, input);
  }

  updateMember(gymId: string, memberId: string, input: MemberUpdateInput) {
    return this.request("PATCH", `/gyms/${gymId}/members/${memberId}`, input);
  }

  archiveMember(gymId: string, memberId: string) {
    return this.request("DELETE", `/gyms/${gymId}/members/${memberId}`);
  }

  listMemberMemberships(gymId: string, memberId: string) {
    return this.request("GET", `/gyms/${gymId}/members/${memberId}/memberships`);
  }

  assignMemberMembership(gymId: string, memberId: string, input: MemberMembershipAssignInput) {
    return this.request("POST", `/gyms/${gymId}/members/${memberId}/memberships`, input);
  }

  listMembershipPlans(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/membership-plans`);
  }

  createMembershipPlan(gymId: string, input: MembershipPlanCreateInput) {
    return this.request("POST", `/gyms/${gymId}/membership-plans`, input);
  }

  updateMembershipPlan(gymId: string, planId: string, input: MembershipPlanUpdateInput) {
    return this.request("PATCH", `/gyms/${gymId}/membership-plans/${planId}`, input);
  }

  archiveMembershipPlan(gymId: string, planId: string) {
    return this.request("DELETE", `/gyms/${gymId}/membership-plans/${planId}`);
  }

  listClassTypes(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/class-types`);
  }

  createClassType(gymId: string, input: ClassTypeCreateInput) {
    return this.request("POST", `/gyms/${gymId}/class-types`, input);
  }

  createClassSession(gymId: string, input: ClassSessionCreateInput) {
    return this.request("POST", `/gyms/${gymId}/class-sessions`, input);
  }

  listClassBookings(gymId: string, sessionId: string) {
    return this.request("GET", `/gyms/${gymId}/class-sessions/${sessionId}/bookings`);
  }

  createClassBooking(gymId: string, sessionId: string, input: ClassBookingCreateInput) {
    return this.request("POST", `/gyms/${gymId}/class-sessions/${sessionId}/bookings`, input);
  }

  createStaffManualBooking(gymId: string, sessionId: string, input: StaffManualBookingInput) {
    return this.request(
      "POST",
      `/gyms/${gymId}/class-sessions/${sessionId}/bookings/manual`,
      input
    );
  }

  cancelClassBooking(gymId: string, bookingId: string) {
    return this.request("DELETE", `/gyms/${gymId}/class-bookings/${bookingId}`);
  }

  joinClassWaitlist(gymId: string, sessionId: string, input: ClassBookingCreateInput) {
    return this.request("POST", `/gyms/${gymId}/class-sessions/${sessionId}/waitlist`, input);
  }

  leaveClassWaitlist(gymId: string, bookingId: string) {
    return this.request("DELETE", `/gyms/${gymId}/class-bookings/${bookingId}/waitlist`);
  }

  memberCheckInCode(gymId: string, memberId: string) {
    return this.request("GET", `/gyms/${gymId}/members/${memberId}/check-in-code`);
  }

  listMemberCheckIns(gymId: string, memberId: string) {
    return this.request("GET", `/gyms/${gymId}/members/${memberId}/check-ins`);
  }

  listCheckIns(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/check-ins`);
  }

  createCheckIn(gymId: string, input: CheckInCreateInput) {
    return this.request("POST", `/gyms/${gymId}/check-ins`, input);
  }

  deleteCheckIn(gymId: string, checkInId: string) {
    return this.request("DELETE", `/gyms/${gymId}/check-ins/${checkInId}`);
  }

  listAccessDevices(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/access/devices`);
  }

  createAccessDevice(gymId: string, input: AccessDeviceCreateInput) {
    return this.request("POST", `/gyms/${gymId}/access/devices`, input);
  }

  rotateAccessDeviceKey(gymId: string, deviceId: string) {
    return this.request("POST", `/gyms/${gymId}/access/devices/${deviceId}/rotate-key`);
  }

  listAccessRules(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/access/rules`);
  }

  createAccessRule(gymId: string, input: AccessRuleCreateInput) {
    return this.request("POST", `/gyms/${gymId}/access/rules`, input);
  }

  listAccessEvents(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/access/events`);
  }

  createAccessDeviceEvent(input: AccessDeviceEventInput) {
    return this.request("POST", "/access/device-events", input);
  }

  createAccessDeviceHeartbeat(input: AccessDeviceHeartbeatInput) {
    return this.request("POST", "/access/device-heartbeats", input);
  }

  publicSchedule(gymSlug: string, from?: string, to?: string, locationId?: string) {
    const params = new URLSearchParams();
    if (from) {
      params.set("from", from);
    }
    if (to) {
      params.set("to", to);
    }
    if (locationId) {
      params.set("locationId", locationId);
    }
    const query = params.size > 0 ? `?${params.toString()}` : "";
    return this.request("GET", `/public/gyms/${gymSlug}/schedule${query}`);
  }

  publicGym(gymSlug: string) {
    return this.request("GET", `/public/gyms/${gymSlug}`);
  }

  publicPlans(gymSlug: string) {
    return this.request("GET", `/public/gyms/${gymSlug}/plans`);
  }

  publicSignup(gymSlug: string, input: PublicSignupInput) {
    return this.request("POST", `/public/gyms/${gymSlug}/signup`, input);
  }

  private async request(
    method: HttpMethod,
    path: string,
    body?: unknown,
    retryOnUnauthorized = true
  ): Promise<unknown> {
    const response = await this.send(method, path, body);
    const data: unknown = await response.json().catch(() => undefined);
    if (response.status === 401 && retryOnUnauthorized && (await this.refreshStoredTokens())) {
      return this.request(method, path, body, false);
    }
    if (!response.ok) {
      if (response.status === 401) {
        this.options.tokenStore?.clearTokens();
        this.options.onSessionExpired?.();
      }
      const error = isErrorResponse(data) ? data.error : undefined;
      throw new ApiError(
        error?.message ?? "Request failed.",
        response.status,
        error?.code ?? "request_failed",
        error?.issues
      );
    }
    return data;
  }

  private async send(method: HttpMethod, path: string, body?: unknown) {
    const headers = new Headers({ Accept: "application/json" });
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    const accessToken = this.options.tokenStore?.getAccessToken() ?? this.options.accessToken;
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    const requestInit: RequestInit = {
      method,
      headers
    };
    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }
    return this.fetchImpl(new URL(path, this.options.baseUrl), requestInit);
  }

  private async refreshStoredTokens() {
    const tokenStore = this.options.tokenStore;
    const refreshToken = tokenStore?.getRefreshToken();
    if (!tokenStore || !refreshToken) {
      return false;
    }
    const response = await this.send("POST", "/auth/refresh", { refreshToken });
    const data: unknown = await response.json().catch(() => undefined);
    if (!response.ok || !isTokenResponse(data)) {
      tokenStore.clearTokens();
      this.options.onSessionExpired?.();
      return false;
    }
    tokenStore.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    });
    return true;
  }
}

function isErrorResponse(value: unknown): value is { error: { message?: string; code?: string; issues?: { path: string; message: string }[] } } {
  return typeof value === "object" && value !== null && "error" in value;
}

function isTokenResponse(value: unknown): value is { accessToken: string; refreshToken: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    "refreshToken" in value &&
    typeof (value as { accessToken: unknown }).accessToken === "string" &&
    typeof (value as { refreshToken: unknown }).refreshToken === "string"
  );
}
