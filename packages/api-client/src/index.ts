import type {
  AccessDeviceCreateInput,
  AccessDeviceEventInput,
  AccessDeviceHeartbeatInput,
  AccessRuleCreateInput,
  ClassBookingCreateInput,
  CheckInCreateInput,
  ClassSessionCreateInput,
  ClassTypeCreateInput,
  ContractWaiverAssignmentCreateInput,
  ContractWaiverCreateInput,
  ContractWaiverSignatureCreateInput,
  ContractWaiverUpdateInput,
  CustomRoleCreateInput,
  CustomRoleUpdateInput,
  GymCreateInput,
  GymUpdateInput,
  LocationCreateInput,
  LocationUpdateInput,
  LoginInput,
  MemberCreateInput,
  MemberMembershipAssignInput,
  MemberPortalAccountInput,
  MemberPortalTokenAcceptInput,
  MemberUpdateInput,
  MembershipPlanCreateInput,
  MembershipPlanUpdateInput,
  PublicSignupInput,
  RegisterInput,
  ResetPasswordInput,
  RoleAssignmentInput,
  StaffAccessRemoveInput,
  StaffAvailabilityCreateInput,
  StaffInviteAcceptInput,
  StaffInviteCreateInput,
  StaffTaskCreateInput,
  StaffTaskUpdateInput,
  StaffShiftCreateInput,
  StaffManualBookingInput,
  StripePaymentCollectInput,
  StripePaymentRefundInput,
  StripeSubscriptionCheckoutInput,
  NotificationProcessInput
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

  createStaffShift(gymId: string, input: StaffShiftCreateInput) {
    return this.request("POST", `/gyms/${gymId}/staff/shifts`, input);
  }

  listStaffShifts(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/staff/shifts`);
  }

  listStaffAvailability(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/staff/availability`);
  }

  createStaffAvailability(gymId: string, input: StaffAvailabilityCreateInput) {
    return this.request("POST", `/gyms/${gymId}/staff/availability`, input);
  }

  listStaffTasks(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/staff/tasks`);
  }

  createStaffTask(gymId: string, input: StaffTaskCreateInput) {
    return this.request("POST", `/gyms/${gymId}/staff/tasks`, input);
  }

  updateStaffTask(gymId: string, taskId: string, input: StaffTaskUpdateInput) {
    return this.request("PATCH", `/gyms/${gymId}/staff/tasks/${taskId}`, input);
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

  enableMemberPortalAccount(gymId: string, memberId: string, input: MemberPortalAccountInput) {
    return this.request("POST", `/gyms/${gymId}/members/${memberId}/portal-account`, input);
  }

  createMemberPortalInvite(gymId: string, memberId: string) {
    return this.request("POST", `/gyms/${gymId}/members/${memberId}/portal-invite`);
  }

  setupMemberPortalPassword(input: MemberPortalTokenAcceptInput) {
    return this.request("POST", "/member-auth/setup-password", input);
  }

  listMemberPortalClasses(from?: string, to?: string, locationId?: string) {
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
    return this.request("GET", `/member-portal/classes${query}`);
  }

  listMemberPortalBookings() {
    return this.request("GET", "/member-portal/bookings");
  }

  createMemberPortalBooking(sessionId: string) {
    return this.request("POST", `/member-portal/class-sessions/${sessionId}/bookings`);
  }

  joinMemberPortalWaitlist(sessionId: string) {
    return this.request("POST", `/member-portal/class-sessions/${sessionId}/waitlist`);
  }

  cancelMemberPortalBooking(bookingId: string) {
    return this.request("DELETE", `/member-portal/bookings/${bookingId}`);
  }

  leaveMemberPortalWaitlist(bookingId: string) {
    return this.request("DELETE", `/member-portal/bookings/${bookingId}/waitlist`);
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

  getStripePaymentAccount(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/payments/stripe-account`);
  }

  connectStripePaymentAccount(gymId: string) {
    return this.request("POST", `/gyms/${gymId}/payments/stripe-account/connect`);
  }

  listPayments(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/payments`);
  }

  listSubscriptions(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/payments/subscriptions`);
  }

  createSubscriptionCheckout(gymId: string, input: StripeSubscriptionCheckoutInput) {
    return this.request("POST", `/gyms/${gymId}/payments/subscriptions/checkout`, input);
  }

  collectPayment(gymId: string, input: StripePaymentCollectInput) {
    return this.request("POST", `/gyms/${gymId}/payments`, input);
  }

  refundPayment(gymId: string, paymentId: string, input: StripePaymentRefundInput = {}) {
    return this.request("POST", `/gyms/${gymId}/payments/${paymentId}/refund`, input);
  }

  listNotifications(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/notifications`);
  }

  processNotification(gymId: string, notificationId: string, input: NotificationProcessInput = {}) {
    return this.request("POST", `/gyms/${gymId}/notifications/${notificationId}/process`, input);
  }

  retryNotification(gymId: string, notificationId: string) {
    return this.request("POST", `/gyms/${gymId}/notifications/${notificationId}/retry`);
  }

  listContractWaiverDocuments(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/contracts-waivers`);
  }

  createContractWaiverDocument(gymId: string, input: ContractWaiverCreateInput) {
    return this.request("POST", `/gyms/${gymId}/contracts-waivers`, input);
  }

  listContractWaiverAssignments(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/contracts-waivers/assignments`);
  }

  assignContractWaiver(
    gymId: string,
    documentId: string,
    input: ContractWaiverAssignmentCreateInput
  ) {
    return this.request("POST", `/gyms/${gymId}/contracts-waivers/${documentId}/assignments`, input);
  }

  listMemberContractWaivers(gymId: string, memberId: string) {
    return this.request("GET", `/gyms/${gymId}/members/${memberId}/contracts-waivers`);
  }

  signContractWaiverAssignment(
    gymId: string,
    assignmentId: string,
    input: ContractWaiverSignatureCreateInput
  ) {
    return this.request(
      "POST",
      `/gyms/${gymId}/contracts-waivers/assignments/${assignmentId}/sign`,
      input
    );
  }

  updateContractWaiverDocument(
    gymId: string,
    documentId: string,
    input: ContractWaiverUpdateInput
  ) {
    return this.request("PATCH", `/gyms/${gymId}/contracts-waivers/${documentId}`, input);
  }

  archiveContractWaiverDocument(gymId: string, documentId: string) {
    return this.request("DELETE", `/gyms/${gymId}/contracts-waivers/${documentId}`);
  }

  reportOverview(gymId: string) {
    return this.request("GET", `/gyms/${gymId}/reports/overview`);
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
