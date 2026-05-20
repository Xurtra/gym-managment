import { ClassSessionStatus, StaffInviteStatus } from "@gym-platform/constants";
export class InMemoryStore {
    userRecords = new Map();
    gymRecords = new Map();
    roleRecords = new Map();
    gymUserRecords = new Map();
    staffInviteRecords = new Map();
    staffAuditLogRecords = new Map();
    staffShiftRecords = new Map();
    locationRecords = new Map();
    memberRecords = new Map();
    membershipPlanRecords = new Map();
    memberMembershipRecords = new Map();
    classTypeRecords = new Map();
    classSessionRecords = new Map();
    classBookingRecords = new Map();
    notificationEventRecords = new Map();
    checkInRecords = new Map();
    accessDeviceRecords = new Map();
    accessRuleRecords = new Map();
    accessEventRecords = new Map();
    stripePaymentAccountRecords = new Map();
    stripePaymentTransactionRecords = new Map();
    contractWaiverDocumentRecords = new Map();
    refreshTokenRecords = new Map();
    purposeTokenRecords = new Map();
    users = {
        createUser: (user) => this.createUser(user),
        getUser: (userId) => this.getUser(userId),
        findUserByEmail: (email) => this.findUserByEmail(email),
        updateUser: (user) => this.updateUser(user)
    };
    gyms = {
        createGym: (gym) => this.createGym(gym),
        getGym: (gymId) => this.getGym(gymId),
        findGymBySlug: (slug) => this.findGymBySlug(slug),
        updateGym: (gym) => this.updateGym(gym),
        listGyms: () => this.listGyms(),
    };
    roles = {
        createRole: (role) => this.createRole(role),
        createRoles: (roles) => this.createRoles(roles),
        getRole: (roleId) => this.getRole(roleId),
        listRolesForGym: (gymId) => this.listRolesForGym(gymId),
        updateRole: (role) => this.updateRole(role)
    };
    gymUsers = {
        createGymUser: (gymUser) => this.createGymUser(gymUser),
        findGymUser: (gymId, userId) => this.findGymUser(gymId, userId),
        listGymUsersForGym: (gymId) => this.listGymUsersForGym(gymId),
        listGymMemberships: (userId) => this.listGymMemberships(userId),
        updateGymUser: (gymUser) => this.updateGymUser(gymUser)
    };
    staffInvites = {
        createStaffInvite: (invite) => this.createStaffInvite(invite),
        getStaffInvite: (inviteId) => this.getStaffInvite(inviteId),
        findStaffInviteByTokenHash: (tokenHash) => this.findStaffInviteByTokenHash(tokenHash),
        findPendingStaffInvite: (gymId, email) => this.findPendingStaffInvite(gymId, email),
        listStaffInvitesForGym: (gymId) => this.listStaffInvitesForGym(gymId),
        updateStaffInvite: (invite) => this.updateStaffInvite(invite)
    };
    staffAuditLogs = {
        createStaffAuditLog: (entry) => this.createStaffAuditLog(entry),
        listStaffAuditLogsForGym: (gymId) => this.listStaffAuditLogsForGym(gymId)
    };
    staffShifts = {
        createStaffShift: (shift) => this.createStaffShift(shift),
        listStaffShiftsForStaff: (gymId, userId) => this.listStaffShiftsForStaff(gymId, userId)
    };
    locations = {
        createLocation: (location) => this.createLocation(location),
        getLocation: (locationId) => this.getLocation(locationId),
        listLocationsForGym: (gymId) => this.listLocationsForGym(gymId),
        updateLocation: (location) => this.updateLocation(location)
    };
    members = {
        createMember: (member) => this.createMember(member),
        getMember: (memberId) => this.getMember(memberId),
        listMembersForGym: (gymId) => this.listMembersForGym(gymId),
        updateMember: (member) => this.updateMember(member)
    };
    membershipPlans = {
        createMembershipPlan: (plan) => this.createMembershipPlan(plan),
        getMembershipPlan: (planId) => this.getMembershipPlan(planId),
        listMembershipPlansForGym: (gymId) => this.listMembershipPlansForGym(gymId),
        updateMembershipPlan: (plan) => this.updateMembershipPlan(plan)
    };
    memberMemberships = {
        createMemberMembership: (membership) => this.createMemberMembership(membership),
        getMemberMembership: (membershipId) => this.getMemberMembership(membershipId),
        listMemberMembershipsForMember: (memberId) => this.listMemberMembershipsForMember(memberId),
        updateMemberMembership: (membership) => this.updateMemberMembership(membership)
    };
    classes = {
        createClassType: (classType) => this.createClassType(classType),
        getClassType: (classTypeId) => this.getClassType(classTypeId),
        listClassTypesForGym: (gymId) => this.listClassTypesForGym(gymId),
        createClassSession: (session) => this.createClassSession(session),
        getClassSession: (sessionId) => this.getClassSession(sessionId),
        listClassSessionsForGym: (gymId) => this.listClassSessionsForGym(gymId),
        listPublicClassSessionsForGym: (gymId, from, to) => this.listPublicClassSessionsForGym(gymId, from, to)
    };
    bookings = {
        createClassBooking: (booking) => this.createClassBooking(booking),
        getClassBooking: (bookingId) => this.getClassBooking(bookingId),
        listClassBookingsForSession: (classSessionId) => this.listClassBookingsForSession(classSessionId),
        listClassBookingsForMember: (memberId) => this.listClassBookingsForMember(memberId),
        updateClassBooking: (booking) => this.updateClassBooking(booking)
    };
    notifications = {
        createNotificationEvent: (event) => this.createNotificationEvent(event),
        getNotificationEvent: (eventId) => this.getNotificationEvent(eventId),
        listNotificationEventsForGym: (gymId) => this.listNotificationEventsForGym(gymId),
        updateNotificationEvent: (event) => this.updateNotificationEvent(event)
    };
    checkIns = {
        createCheckIn: (checkIn) => this.createCheckIn(checkIn),
        listCheckInsForMember: (memberId) => this.listCheckInsForMember(memberId),
        listCheckInsForGym: (gymId) => this.listCheckInsForGym(gymId),
        deleteCheckIn: (checkInId, gymId) => this.deleteCheckIn(checkInId, gymId)
    };
    accessControl = {
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
    payments = {
        upsertStripeAccount: (account) => this.upsertStripeAccount(account),
        getStripeAccountForGym: (gymId) => this.getStripeAccountForGym(gymId),
        getStripeAccountByStripeAccountId: (stripeAccountId) => this.getStripeAccountByStripeAccountId(stripeAccountId),
        createPaymentTransaction: (transaction) => this.createPaymentTransaction(transaction),
        getPaymentTransaction: (paymentId) => this.getPaymentTransaction(paymentId),
        getPaymentTransactionByStripePaymentIntentId: (stripePaymentIntentId) => this.getPaymentTransactionByStripePaymentIntentId(stripePaymentIntentId),
        listPaymentTransactionsForGym: (gymId) => this.listPaymentTransactionsForGym(gymId),
        updatePaymentTransaction: (transaction) => this.updatePaymentTransaction(transaction)
    };
    contractWaivers = {
        createDocument: (document) => this.createContractWaiverDocument(document),
        getDocument: (documentId) => this.getContractWaiverDocument(documentId),
        listDocumentsForGym: (gymId) => this.listContractWaiverDocumentsForGym(gymId),
        updateDocument: (document) => this.updateContractWaiverDocument(document)
    };
    tokens = {
        createRefreshToken: (refreshToken) => this.createRefreshToken(refreshToken),
        findRefreshTokenByHash: (tokenHash) => this.findRefreshTokenByHash(tokenHash),
        listRefreshTokensForUser: (userId) => this.listRefreshTokensForUser(userId),
        updateRefreshToken: (refreshToken) => this.updateRefreshToken(refreshToken),
        createPurposeToken: (purposeToken) => this.createPurposeToken(purposeToken),
        findPurposeTokenByHash: (tokenHash, purpose) => this.findPurposeTokenByHash(tokenHash, purpose),
        updatePurposeToken: (purposeToken) => this.updatePurposeToken(purposeToken)
    };
    async transaction(work) {
        return work(this);
    }
    async createUser(user) {
        this.userRecords.set(user.id, user);
        return user;
    }
    async getUser(userId) {
        return this.userRecords.get(userId);
    }
    async findUserByEmail(email) {
        const normalized = email.toLowerCase();
        return [...this.userRecords.values()].find((user) => user.email === normalized);
    }
    async updateUser(user) {
        this.userRecords.set(user.id, user);
        return user;
    }
    async createGym(gym) {
        this.gymRecords.set(gym.id, gym);
        return gym;
    }
    async getGym(gymId) {
        return this.gymRecords.get(gymId);
    }
    async findGymBySlug(slug) {
        return [...this.gymRecords.values()].find((gym) => gym.slug === slug);
    }
    async updateGym(gym) {
        this.gymRecords.set(gym.id, gym);
        return gym;
    }
    async listGyms() {
        return Array.from(this.gymRecords.values());
    }
    async createRole(role) {
        this.roleRecords.set(role.id, role);
        return role;
    }
    async createRoles(roles) {
        for (const role of roles) {
            this.roleRecords.set(role.id, role);
        }
        return roles;
    }
    async getRole(roleId) {
        return this.roleRecords.get(roleId);
    }
    async listRolesForGym(gymId) {
        return [...this.roleRecords.values()].filter((role) => role.gymId === gymId);
    }
    async updateRole(role) {
        this.roleRecords.set(role.id, role);
        return role;
    }
    async createGymUser(gymUser) {
        this.gymUserRecords.set(gymUser.id, gymUser);
        return gymUser;
    }
    async findGymUser(gymId, userId) {
        return [...this.gymUserRecords.values()].find((membership) => membership.gymId === gymId && membership.userId === userId);
    }
    async listGymUsersForGym(gymId) {
        return [...this.gymUserRecords.values()]
            .filter((membership) => membership.gymId === gymId)
            .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    }
    async listGymMemberships(userId) {
        return [...this.gymUserRecords.values()].filter((membership) => membership.userId === userId);
    }
    async updateGymUser(gymUser) {
        this.gymUserRecords.set(gymUser.id, gymUser);
        return gymUser;
    }
    async createStaffInvite(invite) {
        this.staffInviteRecords.set(invite.id, invite);
        return invite;
    }
    async getStaffInvite(inviteId) {
        return this.staffInviteRecords.get(inviteId);
    }
    async findStaffInviteByTokenHash(tokenHash) {
        return [...this.staffInviteRecords.values()].find((invite) => invite.tokenHash === tokenHash);
    }
    async findPendingStaffInvite(gymId, email) {
        const normalized = email.toLowerCase();
        return [...this.staffInviteRecords.values()].find((invite) => invite.gymId === gymId &&
            invite.email === normalized &&
            invite.status === StaffInviteStatus.Pending);
    }
    async listStaffInvitesForGym(gymId) {
        return [...this.staffInviteRecords.values()]
            .filter((invite) => invite.gymId === gymId)
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    }
    async updateStaffInvite(invite) {
        this.staffInviteRecords.set(invite.id, invite);
        return invite;
    }
    async createStaffAuditLog(entry) {
        this.staffAuditLogRecords.set(entry.id, entry);
        return entry;
    }
    async listStaffAuditLogsForGym(gymId) {
        return [...this.staffAuditLogRecords.values()]
            .filter((entry) => entry.gymId === gymId)
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    }
    async createStaffShift(shift) {
        this.staffShiftRecords.set(shift.id, shift);
        return shift;
    }
    async listStaffShiftsForStaff(gymId, userId) {
        return [...this.staffShiftRecords.values()]
            .filter((shift) => shift.gymId === gymId && shift.userId === userId)
            .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
    }
    async createLocation(location) {
        this.locationRecords.set(location.id, location);
        return location;
    }
    async getLocation(locationId) {
        return this.locationRecords.get(locationId);
    }
    async listLocationsForGym(gymId) {
        return [...this.locationRecords.values()].filter((location) => location.gymId === gymId);
    }
    async updateLocation(location) {
        this.locationRecords.set(location.id, location);
        return location;
    }
    async createMember(member) {
        this.memberRecords.set(member.id, member);
        return member;
    }
    async getMember(memberId) {
        return this.memberRecords.get(memberId);
    }
    async listMembersForGym(gymId) {
        return [...this.memberRecords.values()].filter((member) => member.gymId === gymId);
    }
    async updateMember(member) {
        this.memberRecords.set(member.id, member);
        return member;
    }
    async createMembershipPlan(plan) {
        this.membershipPlanRecords.set(plan.id, plan);
        return plan;
    }
    async getMembershipPlan(planId) {
        return this.membershipPlanRecords.get(planId);
    }
    async listMembershipPlansForGym(gymId) {
        return [...this.membershipPlanRecords.values()].filter((plan) => plan.gymId === gymId);
    }
    async updateMembershipPlan(plan) {
        this.membershipPlanRecords.set(plan.id, plan);
        return plan;
    }
    async createMemberMembership(membership) {
        this.memberMembershipRecords.set(membership.id, membership);
        return membership;
    }
    async getMemberMembership(membershipId) {
        return this.memberMembershipRecords.get(membershipId);
    }
    async listMemberMembershipsForMember(memberId) {
        return [...this.memberMembershipRecords.values()]
            .filter((membership) => membership.memberId === memberId)
            .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
    }
    async updateMemberMembership(membership) {
        this.memberMembershipRecords.set(membership.id, membership);
        return membership;
    }
    async createClassType(classType) {
        this.classTypeRecords.set(classType.id, classType);
        return classType;
    }
    async getClassType(classTypeId) {
        return this.classTypeRecords.get(classTypeId);
    }
    async listClassTypesForGym(gymId) {
        return [...this.classTypeRecords.values()].filter((classType) => classType.gymId === gymId);
    }
    async createClassSession(session) {
        this.classSessionRecords.set(session.id, session);
        return session;
    }
    async getClassSession(sessionId) {
        return this.classSessionRecords.get(sessionId);
    }
    async listClassSessionsForGym(gymId) {
        return [...this.classSessionRecords.values()].filter((session) => session.gymId === gymId);
    }
    async listPublicClassSessionsForGym(gymId, from, to) {
        return [...this.classSessionRecords.values()].filter((session) => session.gymId === gymId &&
            session.status === ClassSessionStatus.Scheduled &&
            this.classTypeRecords.get(session.classTypeId)?.isPublic === true &&
            session.startsAt >= from &&
            session.startsAt <= to);
    }
    async createClassBooking(booking) {
        this.classBookingRecords.set(booking.id, booking);
        return booking;
    }
    async getClassBooking(bookingId) {
        return this.classBookingRecords.get(bookingId);
    }
    async listClassBookingsForSession(classSessionId) {
        return [...this.classBookingRecords.values()]
            .filter((booking) => booking.classSessionId === classSessionId)
            .sort(compareBookings);
    }
    async listClassBookingsForMember(memberId) {
        return [...this.classBookingRecords.values()]
            .filter((booking) => booking.memberId === memberId)
            .sort(compareBookings);
    }
    async updateClassBooking(booking) {
        this.classBookingRecords.set(booking.id, booking);
        return booking;
    }
    async createNotificationEvent(event) {
        this.notificationEventRecords.set(event.id, event);
        return event;
    }
    async getNotificationEvent(eventId) {
        return this.notificationEventRecords.get(eventId);
    }
    async listNotificationEventsForGym(gymId) {
        return [...this.notificationEventRecords.values()]
            .filter((event) => event.gymId === gymId)
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    }
    async updateNotificationEvent(event) {
        this.notificationEventRecords.set(event.id, event);
        return event;
    }
    async createCheckIn(checkIn) {
        this.checkInRecords.set(checkIn.id, checkIn);
        return checkIn;
    }
    async listCheckInsForMember(memberId) {
        return [...this.checkInRecords.values()].filter((checkIn) => checkIn.memberId === memberId);
    }
    async listCheckInsForGym(gymId) {
        return [...this.checkInRecords.values()].filter((checkIn) => checkIn.gymId === gymId);
    }
    async deleteCheckIn(checkInId, gymId) {
        const existing = this.checkInRecords.get(checkInId);
        if (!existing || existing.gymId !== gymId) {
            return false;
        }
        this.checkInRecords.delete(checkInId);
        return true;
    }
    async createAccessDevice(device) {
        this.accessDeviceRecords.set(device.id, device);
        return device;
    }
    async getAccessDevice(deviceId) {
        return this.accessDeviceRecords.get(deviceId);
    }
    async findAccessDeviceByApiKeyHash(apiKeyHash) {
        return [...this.accessDeviceRecords.values()].find((device) => device.apiKeyHash === apiKeyHash);
    }
    async listAccessDevicesForGym(gymId) {
        return [...this.accessDeviceRecords.values()].filter((device) => device.gymId === gymId);
    }
    async updateAccessDevice(device) {
        this.accessDeviceRecords.set(device.id, device);
        return device;
    }
    async createAccessRule(rule) {
        this.accessRuleRecords.set(rule.id, rule);
        return rule;
    }
    async listAccessRulesForGym(gymId) {
        return [...this.accessRuleRecords.values()].filter((rule) => rule.gymId === gymId);
    }
    async createAccessEvent(event) {
        this.accessEventRecords.set(event.id, event);
        return event;
    }
    async listAccessEventsForGym(gymId) {
        return [...this.accessEventRecords.values()]
            .filter((event) => event.gymId === gymId)
            .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
    }
    async upsertStripeAccount(account) {
        this.stripePaymentAccountRecords.set(account.gymId, account);
        return account;
    }
    async getStripeAccountForGym(gymId) {
        return this.stripePaymentAccountRecords.get(gymId);
    }
    async getStripeAccountByStripeAccountId(stripeAccountId) {
        return [...this.stripePaymentAccountRecords.values()].find((account) => account.stripeAccountId === stripeAccountId);
    }
    async createPaymentTransaction(transaction) {
        this.stripePaymentTransactionRecords.set(transaction.id, transaction);
        return transaction;
    }
    async getPaymentTransaction(paymentId) {
        return this.stripePaymentTransactionRecords.get(paymentId);
    }
    async getPaymentTransactionByStripePaymentIntentId(stripePaymentIntentId) {
        return [...this.stripePaymentTransactionRecords.values()].find((transaction) => transaction.stripePaymentIntentId === stripePaymentIntentId);
    }
    async listPaymentTransactionsForGym(gymId) {
        return [...this.stripePaymentTransactionRecords.values()]
            .filter((transaction) => transaction.gymId === gymId)
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    }
    async updatePaymentTransaction(transaction) {
        this.stripePaymentTransactionRecords.set(transaction.id, transaction);
        return transaction;
    }
    async createContractWaiverDocument(document) {
        this.contractWaiverDocumentRecords.set(document.id, document);
        return document;
    }
    async getContractWaiverDocument(documentId) {
        return this.contractWaiverDocumentRecords.get(documentId);
    }
    async listContractWaiverDocumentsForGym(gymId) {
        return [...this.contractWaiverDocumentRecords.values()]
            .filter((document) => document.gymId === gymId)
            .sort((left, right) => left.title.localeCompare(right.title) || right.version - left.version);
    }
    async updateContractWaiverDocument(document) {
        this.contractWaiverDocumentRecords.set(document.id, document);
        return document;
    }
    async createRefreshToken(refreshToken) {
        this.refreshTokenRecords.set(refreshToken.id, refreshToken);
        return refreshToken;
    }
    async findRefreshTokenByHash(tokenHash) {
        return [...this.refreshTokenRecords.values()].find((refreshToken) => refreshToken.tokenHash === tokenHash);
    }
    async listRefreshTokensForUser(userId) {
        return [...this.refreshTokenRecords.values()].filter((refreshToken) => refreshToken.userId === userId);
    }
    async updateRefreshToken(refreshToken) {
        this.refreshTokenRecords.set(refreshToken.id, refreshToken);
        return refreshToken;
    }
    async createPurposeToken(purposeToken) {
        this.purposeTokenRecords.set(purposeToken.id, purposeToken);
        return purposeToken;
    }
    async findPurposeTokenByHash(tokenHash, purpose) {
        return [...this.purposeTokenRecords.values()].find((purposeToken) => purposeToken.purpose === purpose && purposeToken.tokenHash === tokenHash);
    }
    async updatePurposeToken(purposeToken) {
        this.purposeTokenRecords.set(purposeToken.id, purposeToken);
        return purposeToken;
    }
    snapshot() {
        return {
            users: [...this.userRecords.values()],
            gyms: [...this.gymRecords.values()],
            roles: [...this.roleRecords.values()],
            gymUsers: [...this.gymUserRecords.values()],
            staffInvites: [...this.staffInviteRecords.values()],
            staffAuditLogs: [...this.staffAuditLogRecords.values()],
            staffShifts: [...this.staffShiftRecords.values()],
            locations: [...this.locationRecords.values()],
            members: [...this.memberRecords.values()],
            membershipPlans: [...this.membershipPlanRecords.values()],
            memberMemberships: [...this.memberMembershipRecords.values()],
            classTypes: [...this.classTypeRecords.values()],
            classSessions: [...this.classSessionRecords.values()],
            classBookings: [...this.classBookingRecords.values()],
            notificationEvents: [...this.notificationEventRecords.values()],
            checkIns: [...this.checkInRecords.values()],
            accessDevices: [...this.accessDeviceRecords.values()],
            accessRules: [...this.accessRuleRecords.values()],
            accessEvents: [...this.accessEventRecords.values()],
            stripePaymentAccounts: [...this.stripePaymentAccountRecords.values()],
            stripePaymentTransactions: [...this.stripePaymentTransactionRecords.values()],
            contractWaiverDocuments: [...this.contractWaiverDocumentRecords.values()],
            refreshTokens: [...this.refreshTokenRecords.values()],
            purposeTokens: [...this.purposeTokenRecords.values()]
        };
    }
}
function compareBookings(left, right) {
    return ((left.waitlistPosition ?? Number.MAX_SAFE_INTEGER) -
        (right.waitlistPosition ?? Number.MAX_SAFE_INTEGER) ||
        left.createdAt.getTime() - right.createdAt.getTime());
}
//# sourceMappingURL=inMemoryStore.js.map