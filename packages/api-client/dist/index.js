export class ApiError extends Error {
    status;
    code;
    issues;
    constructor(message, status, code, issues) {
        super(message);
        this.status = status;
        this.code = code;
        this.issues = issues;
    }
}
export class GymApiClient {
    options;
    fetchImpl;
    constructor(options) {
        this.options = options;
        this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    }
    register(input) {
        return this.request("POST", "/auth/register", input);
    }
    login(input) {
        return this.request("POST", "/auth/login", input);
    }
    refresh(refreshToken) {
        return this.request("POST", "/auth/refresh", { refreshToken });
    }
    logout(refreshToken) {
        return this.request("POST", "/auth/logout", { refreshToken });
    }
    forgotPassword(email) {
        return this.request("POST", "/auth/forgot-password", { email });
    }
    resetPassword(input) {
        return this.request("POST", "/auth/reset-password", input);
    }
    setupTwoFactor() {
        return this.request("POST", "/auth/2fa/setup");
    }
    verifyTwoFactor(code) {
        return this.request("POST", "/auth/2fa/verify", { code });
    }
    regenerateTwoFactorRecoveryCodes() {
        return this.request("POST", "/auth/2fa/recovery-codes");
    }
    acceptStaffInvite(input) {
        return this.request("POST", "/staff/invites/accept", input);
    }
    me() {
        return this.request("GET", "/auth/me");
    }
    listGyms() {
        return this.request("GET", "/gyms");
    }
    createGym(input) {
        return this.request("POST", "/gyms", input);
    }
    getGym(gymId) {
        return this.request("GET", `/gyms/${gymId}`);
    }
    updateGym(gymId, input) {
        return this.request("PATCH", `/gyms/${gymId}`, input);
    }
    listLocations(gymId) {
        return this.request("GET", `/gyms/${gymId}/locations`);
    }
    getLocation(gymId, locationId) {
        return this.request("GET", `/gyms/${gymId}/locations/${locationId}`);
    }
    listLocationRooms(gymId, locationId) {
        return this.request("GET", `/gyms/${gymId}/locations/${locationId}/rooms`);
    }
    createLocation(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/locations`, input);
    }
    updateLocation(gymId, locationId, input) {
        return this.request("PATCH", `/gyms/${gymId}/locations/${locationId}`, input);
    }
    archiveLocation(gymId, locationId) {
        return this.request("DELETE", `/gyms/${gymId}/locations/${locationId}`);
    }
    listStaffInvites(gymId) {
        return this.request("GET", `/gyms/${gymId}/staff/invites`);
    }
    createStaffInvite(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/staff/invites`, input);
    }
    listRoles(gymId) {
        return this.request("GET", `/gyms/${gymId}/roles`);
    }
    createCustomRole(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/roles`, input);
    }
    updateCustomRole(gymId, roleId, input) {
        return this.request("PATCH", `/gyms/${gymId}/roles/${roleId}`, input);
    }
    deleteCustomRole(gymId, roleId) {
        return this.request("DELETE", `/gyms/${gymId}/roles/${roleId}`);
    }
    listStaff(gymId) {
        return this.request("GET", `/gyms/${gymId}/staff`);
    }
    assignStaffRole(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/roles/assign`, input);
    }
    removeStaffAccess(gymId, userId, input = {}) {
        return this.request("DELETE", `/gyms/${gymId}/staff/${userId}`, input);
    }
    listStaffAuditLogs(gymId) {
        return this.request("GET", `/gyms/${gymId}/staff/audit`);
    }
    listStaffShifts(gymId) {
        return this.request("GET", `/gyms/${gymId}/staff/shifts`);
    }
    listMyStaffShifts(gymId) {
        return this.request("GET", `/gyms/${gymId}/staff/shifts/me`);
    }
    createStaffShift(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/staff/shifts`, input);
    }
    listSchedulerRules(gymId) {
        return this.request("GET", `/gyms/${gymId}/scheduler/rules`);
    }
    createSchedulerRule(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/scheduler/rules`, input);
    }
    listSchedulerAvailability(gymId) {
        return this.request("GET", `/gyms/${gymId}/scheduler/availability`);
    }
    createSchedulerAvailability(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/scheduler/availability`, input);
    }
    listSchedulerRequests(gymId) {
        return this.request("GET", `/gyms/${gymId}/scheduler/requests`);
    }
    listMySchedulerRequests(gymId) {
        return this.request("GET", `/gyms/${gymId}/scheduler/requests/me`);
    }
    createSchedulerRequest(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/scheduler/requests`, input);
    }
    generateSchedule(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/scheduler/generate`, input);
    }
    publishSchedule(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/scheduler/publish`, input);
    }
    resolveSchedulerRequest(gymId, requestId, input) {
        return this.request("POST", `/gyms/${gymId}/scheduler/requests/${requestId}/resolve`, input);
    }
    listStaffTimeEntries(gymId) {
        return this.request("GET", `/gyms/${gymId}/staff/time-entries`);
    }
    listMyStaffTimeEntries(gymId) {
        return this.request("GET", `/gyms/${gymId}/staff/time-entries/me`);
    }
    clockStaffIn(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/staff/time-entries/clock-in`, input);
    }
    clockMyStaffIn(gymId, input = {}) {
        return this.request("POST", `/gyms/${gymId}/staff/time-entries/me/clock-in`, input);
    }
    clockStaffOut(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/staff/time-entries/clock-out`, input);
    }
    clockMyStaffOut(gymId, input = {}) {
        return this.request("POST", `/gyms/${gymId}/staff/time-entries/me/clock-out`, input);
    }
    listMembers(gymId) {
        return this.request("GET", `/gyms/${gymId}/members`);
    }
    createMember(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/members`, input);
    }
    updateMember(gymId, memberId, input) {
        return this.request("PATCH", `/gyms/${gymId}/members/${memberId}`, input);
    }
    archiveMember(gymId, memberId) {
        return this.request("DELETE", `/gyms/${gymId}/members/${memberId}`);
    }
    listMemberMemberships(gymId, memberId) {
        return this.request("GET", `/gyms/${gymId}/members/${memberId}/memberships`);
    }
    assignMemberMembership(gymId, memberId, input) {
        return this.request("POST", `/gyms/${gymId}/members/${memberId}/memberships`, input);
    }
    listMembershipPlans(gymId) {
        return this.request("GET", `/gyms/${gymId}/membership-plans`);
    }
    createMembershipPlan(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/membership-plans`, input);
    }
    updateMembershipPlan(gymId, planId, input) {
        return this.request("PATCH", `/gyms/${gymId}/membership-plans/${planId}`, input);
    }
    archiveMembershipPlan(gymId, planId) {
        return this.request("DELETE", `/gyms/${gymId}/membership-plans/${planId}`);
    }
    listClassTypes(gymId) {
        return this.request("GET", `/gyms/${gymId}/class-types`);
    }
    createClassType(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/class-types`, input);
    }
    createClassSession(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/class-sessions`, input);
    }
    listClassBookings(gymId, sessionId) {
        return this.request("GET", `/gyms/${gymId}/class-sessions/${sessionId}/bookings`);
    }
    createClassBooking(gymId, sessionId, input) {
        return this.request("POST", `/gyms/${gymId}/class-sessions/${sessionId}/bookings`, input);
    }
    createStaffManualBooking(gymId, sessionId, input) {
        return this.request("POST", `/gyms/${gymId}/class-sessions/${sessionId}/bookings/manual`, input);
    }
    cancelClassBooking(gymId, bookingId) {
        return this.request("DELETE", `/gyms/${gymId}/class-bookings/${bookingId}`);
    }
    joinClassWaitlist(gymId, sessionId, input) {
        return this.request("POST", `/gyms/${gymId}/class-sessions/${sessionId}/waitlist`, input);
    }
    leaveClassWaitlist(gymId, bookingId) {
        return this.request("DELETE", `/gyms/${gymId}/class-bookings/${bookingId}/waitlist`);
    }
    memberCheckInCode(gymId, memberId) {
        return this.request("GET", `/gyms/${gymId}/members/${memberId}/check-in-code`);
    }
    listMemberCheckIns(gymId, memberId) {
        return this.request("GET", `/gyms/${gymId}/members/${memberId}/check-ins`);
    }
    listCheckIns(gymId) {
        return this.request("GET", `/gyms/${gymId}/check-ins`);
    }
    createCheckIn(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/check-ins`, input);
    }
    deleteCheckIn(gymId, checkInId) {
        return this.request("DELETE", `/gyms/${gymId}/check-ins/${checkInId}`);
    }
    listAccessDevices(gymId) {
        return this.request("GET", `/gyms/${gymId}/access/devices`);
    }
    createAccessDevice(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/access/devices`, input);
    }
    rotateAccessDeviceKey(gymId, deviceId) {
        return this.request("POST", `/gyms/${gymId}/access/devices/${deviceId}/rotate-key`);
    }
    listAccessRules(gymId) {
        return this.request("GET", `/gyms/${gymId}/access/rules`);
    }
    createAccessRule(gymId, input) {
        return this.request("POST", `/gyms/${gymId}/access/rules`, input);
    }
    listAccessEvents(gymId) {
        return this.request("GET", `/gyms/${gymId}/access/events`);
    }
    createAccessDeviceEvent(input) {
        return this.request("POST", "/access/device-events", input);
    }
    createAccessDeviceHeartbeat(input) {
        return this.request("POST", "/access/device-heartbeats", input);
    }
    publicSchedule(gymSlug, from, to, locationId) {
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
    publicGym(gymSlug) {
        return this.request("GET", `/public/gyms/${gymSlug}`);
    }
    publicPlans(gymSlug) {
        return this.request("GET", `/public/gyms/${gymSlug}/plans`);
    }
    publicSignup(gymSlug, input) {
        return this.request("POST", `/public/gyms/${gymSlug}/signup`, input);
    }
    async request(method, path, body, retryOnUnauthorized = true) {
        const response = await this.send(method, path, body);
        const data = await response.json().catch(() => undefined);
        if (response.status === 401 && retryOnUnauthorized && (await this.refreshStoredTokens())) {
            return this.request(method, path, body, false);
        }
        if (!response.ok) {
            if (response.status === 401) {
                this.options.tokenStore?.clearTokens();
                this.options.onSessionExpired?.();
            }
            const error = isErrorResponse(data) ? data.error : undefined;
            throw new ApiError(error?.message ?? "Request failed.", response.status, error?.code ?? "request_failed", error?.issues);
        }
        return data;
    }
    async send(method, path, body) {
        const headers = new Headers({ Accept: "application/json" });
        if (body !== undefined) {
            headers.set("Content-Type", "application/json");
        }
        const accessToken = this.options.tokenStore?.getAccessToken() ?? this.options.accessToken;
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }
        const requestInit = {
            method,
            headers
        };
        if (body !== undefined) {
            requestInit.body = JSON.stringify(body);
        }
        return this.fetchImpl(new URL(path, this.options.baseUrl), requestInit);
    }
    async refreshStoredTokens() {
        const tokenStore = this.options.tokenStore;
        const refreshToken = tokenStore?.getRefreshToken();
        if (!tokenStore || !refreshToken) {
            return false;
        }
        const response = await this.send("POST", "/auth/refresh", { refreshToken });
        const data = await response.json().catch(() => undefined);
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
function isErrorResponse(value) {
    return typeof value === "object" && value !== null && "error" in value;
}
function isTokenResponse(value) {
    return (typeof value === "object" &&
        value !== null &&
        "accessToken" in value &&
        "refreshToken" in value &&
        typeof value.accessToken === "string" &&
        typeof value.refreshToken === "string");
}
//# sourceMappingURL=index.js.map