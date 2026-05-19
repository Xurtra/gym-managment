export class PostgresRepositories {
    executor;
    pool;
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
        listGyms: () => this.listGyms(),
        updateGym: (gym) => this.updateGym(gym)
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
        listNotificationEventsForGym: (gymId) => this.listNotificationEventsForGym(gymId)
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
    tokens = {
        createRefreshToken: (refreshToken) => this.createRefreshToken(refreshToken),
        findRefreshTokenByHash: (tokenHash) => this.findRefreshTokenByHash(tokenHash),
        listRefreshTokensForUser: (userId) => this.listRefreshTokensForUser(userId),
        updateRefreshToken: (refreshToken) => this.updateRefreshToken(refreshToken),
        createPurposeToken: (purposeToken) => this.createPurposeToken(purposeToken),
        findPurposeTokenByHash: (tokenHash, purpose) => this.findPurposeTokenByHash(tokenHash, purpose),
        updatePurposeToken: (purposeToken) => this.updatePurposeToken(purposeToken)
    };
    constructor(executor, pool) {
        this.executor = executor;
        this.pool = pool;
    }
    async transaction(work) {
        if (!this.pool) {
            return work(this);
        }
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const result = await work(new PostgresRepositories(client));
            await client.query("COMMIT");
            return result;
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    async createUser(user) {
        const result = await this.executor.query(`INSERT INTO users (
        id, email, password_hash, first_name, last_name, status, email_verified_at,
        two_factor_secret, two_factor_enabled_at, recovery_code_hashes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`, [
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
        ]);
        return mapUser(one(result));
    }
    async getUser(userId) {
        const result = await this.executor.query("SELECT * FROM users WHERE id = $1", [
            userId
        ]);
        return result.rows[0] ? mapUser(result.rows[0]) : undefined;
    }
    async findUserByEmail(email) {
        const result = await this.executor.query("SELECT * FROM users WHERE email = $1", [
            email.toLowerCase()
        ]);
        return result.rows[0] ? mapUser(result.rows[0]) : undefined;
    }
    async updateUser(user) {
        const result = await this.executor.query(`UPDATE users
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
      RETURNING *`, [
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
        ]);
        return mapUser(one(result));
    }
    async createGym(gym) {
        const result = await this.executor.query(`INSERT INTO gyms (
        id, name, slug, owner_user_id, status, timezone, locale, logo_url, brand_colors,
        business_info, operating_hours, feature_flags, onboarding_completed_steps, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14, $15)
      RETURNING *`, [
            gym.id,
            gym.name,
            gym.slug,
            gym.ownerUserId,
            gym.status,
            gym.timezone,
            gym.locale,
            gym.logoUrl ?? null,
            JSON.stringify(gym.brandColors ?? {}),
            JSON.stringify(gym.businessInfo ?? {}),
            JSON.stringify(gym.operatingHours),
            JSON.stringify(gym.featureFlags),
            JSON.stringify(gym.onboardingCompletedSteps),
            gym.createdAt,
            gym.updatedAt
        ]);
        return mapGym(one(result));
    }
    async getGym(gymId) {
        const result = await this.executor.query("SELECT * FROM gyms WHERE id = $1", [gymId]);
        return result.rows[0] ? mapGym(result.rows[0]) : undefined;
    }
    async findGymBySlug(slug) {
        const result = await this.executor.query("SELECT * FROM gyms WHERE slug = $1", [slug]);
        return result.rows[0] ? mapGym(result.rows[0]) : undefined;
    }
    async listGyms() {
        const result = await this.executor.query("SELECT * FROM gyms");
        return result.rows.map(mapGym);
    }
    async updateGym(gym) {
        const result = await this.executor.query(`UPDATE gyms
       SET name = $2,
           timezone = $3,
           locale = $4,
           logo_url = $5,
           brand_colors = $6::jsonb,
           business_info = $7::jsonb,
           operating_hours = $8::jsonb,
           feature_flags = $9::jsonb,
           onboarding_completed_steps = $10::jsonb,
           updated_at = $11
       WHERE id = $1
       RETURNING *`, [
            gym.id,
            gym.name,
            gym.timezone,
            gym.locale,
            gym.logoUrl ?? null,
            JSON.stringify(gym.brandColors ?? {}),
            JSON.stringify(gym.businessInfo ?? {}),
            JSON.stringify(gym.operatingHours),
            JSON.stringify(gym.featureFlags),
            JSON.stringify(gym.onboardingCompletedSteps),
            gym.updatedAt
        ]);
        return mapGym(one(result));
    }
    async createRole(role) {
        const result = await this.executor.query(`INSERT INTO roles (
        id, gym_id, name, permissions, is_system, created_at, updated_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
      RETURNING *`, [
            role.id,
            role.gymId,
            role.name,
            JSON.stringify(role.permissions),
            role.isSystem,
            role.createdAt,
            role.updatedAt
        ]);
        return mapRole(one(result));
    }
    async createRoles(roles) {
        const created = [];
        for (const role of roles) {
            const result = await this.executor.query(`INSERT INTO roles (
          id, gym_id, name, permissions, is_system, created_at, updated_at
        ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
        RETURNING *`, [
                role.id,
                role.gymId,
                role.name,
                JSON.stringify(role.permissions),
                role.isSystem,
                role.createdAt,
                role.updatedAt
            ]);
            created.push(mapRole(one(result)));
        }
        return created;
    }
    async getRole(roleId) {
        const result = await this.executor.query("SELECT * FROM roles WHERE id = $1", [
            roleId
        ]);
        return result.rows[0] ? mapRole(result.rows[0]) : undefined;
    }
    async listRolesForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM roles WHERE gym_id = $1 ORDER BY name", [gymId]);
        return result.rows.map(mapRole);
    }
    async updateRole(role) {
        const result = await this.executor.query(`UPDATE roles
       SET name = $2,
           permissions = $3::jsonb,
           updated_at = $4
       WHERE id = $1
       RETURNING *`, [role.id, role.name, JSON.stringify(role.permissions), role.updatedAt]);
        return mapRole(one(result));
    }
    async createGymUser(gymUser) {
        const result = await this.executor.query(`INSERT INTO gym_users (
        id, gym_id, user_id, role_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`, [
            gymUser.id,
            gymUser.gymId,
            gymUser.userId,
            gymUser.roleId,
            gymUser.status,
            gymUser.createdAt,
            gymUser.updatedAt
        ]);
        return mapGymUser(one(result));
    }
    async findGymUser(gymId, userId) {
        const result = await this.executor.query("SELECT * FROM gym_users WHERE gym_id = $1 AND user_id = $2", [gymId, userId]);
        return result.rows[0] ? mapGymUser(result.rows[0]) : undefined;
    }
    async listGymUsersForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM gym_users WHERE gym_id = $1 ORDER BY created_at", [gymId]);
        return result.rows.map(mapGymUser);
    }
    async listGymMemberships(userId) {
        const result = await this.executor.query("SELECT * FROM gym_users WHERE user_id = $1 ORDER BY created_at", [userId]);
        return result.rows.map(mapGymUser);
    }
    async updateGymUser(gymUser) {
        const result = await this.executor.query(`UPDATE gym_users
      SET role_id = $2,
          status = $3,
          updated_at = $4
      WHERE id = $1
      RETURNING *`, [gymUser.id, gymUser.roleId, gymUser.status, gymUser.updatedAt]);
        return mapGymUser(one(result));
    }
    async createStaffInvite(invite) {
        const result = await this.executor.query(`INSERT INTO staff_invites (
        id, gym_id, email, role_id, invited_by_user_id, token_hash, status,
        expires_at, accepted_at, revoked_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`, [
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
        ]);
        return mapStaffInvite(one(result));
    }
    async getStaffInvite(inviteId) {
        const result = await this.executor.query("SELECT * FROM staff_invites WHERE id = $1", [inviteId]);
        return result.rows[0] ? mapStaffInvite(result.rows[0]) : undefined;
    }
    async findStaffInviteByTokenHash(tokenHash) {
        const result = await this.executor.query("SELECT * FROM staff_invites WHERE token_hash = $1", [tokenHash]);
        return result.rows[0] ? mapStaffInvite(result.rows[0]) : undefined;
    }
    async findPendingStaffInvite(gymId, email) {
        const result = await this.executor.query("SELECT * FROM staff_invites WHERE gym_id = $1 AND email = $2 AND status = 'pending' ORDER BY created_at DESC LIMIT 1", [gymId, email.toLowerCase()]);
        return result.rows[0] ? mapStaffInvite(result.rows[0]) : undefined;
    }
    async listStaffInvitesForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM staff_invites WHERE gym_id = $1 ORDER BY created_at DESC", [gymId]);
        return result.rows.map(mapStaffInvite);
    }
    async updateStaffInvite(invite) {
        const result = await this.executor.query(`UPDATE staff_invites
      SET role_id = $2,
          status = $3,
          expires_at = $4,
          accepted_at = $5,
          revoked_at = $6,
          updated_at = $7
      WHERE id = $1
      RETURNING *`, [
            invite.id,
            invite.roleId,
            invite.status,
            invite.expiresAt,
            invite.acceptedAt ?? null,
            invite.revokedAt ?? null,
            invite.updatedAt
        ]);
        return mapStaffInvite(one(result));
    }
    async createStaffAuditLog(entry) {
        const result = await this.executor.query(`INSERT INTO staff_audit_logs (
        id, gym_id, actor_user_id, target_user_id, action, previous_role_id,
        next_role_id, previous_status, next_status, reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`, [
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
        ]);
        return mapStaffAuditLog(one(result));
    }
    async listStaffAuditLogsForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM staff_audit_logs WHERE gym_id = $1 ORDER BY created_at DESC", [gymId]);
        return result.rows.map(mapStaffAuditLog);
    }
    async createStaffShift(shift) {
        const result = await this.executor.query(`INSERT INTO staff_shifts (
        id, gym_id, user_id, location_id, role_id, starts_at, ends_at,
        notes, created_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`, [
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
        ]);
        return mapStaffShift(one(result));
    }
    async listStaffShiftsForStaff(gymId, userId) {
        const result = await this.executor.query("SELECT * FROM staff_shifts WHERE gym_id = $1 AND user_id = $2 ORDER BY starts_at", [gymId, userId]);
        return result.rows.map(mapStaffShift);
    }
    async createLocation(location) {
        const result = await this.executor.query(`INSERT INTO locations (
        id, gym_id, name, address, timezone, phone, operating_hours, status,
        archived_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb, $8, $9, $10, $11)
      RETURNING *`, [
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
        ]);
        return mapLocation(one(result));
    }
    async getLocation(locationId) {
        const result = await this.executor.query("SELECT * FROM locations WHERE id = $1", [
            locationId
        ]);
        return result.rows[0] ? mapLocation(result.rows[0]) : undefined;
    }
    async listLocationsForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM locations WHERE gym_id = $1 ORDER BY created_at", [gymId]);
        return result.rows.map(mapLocation);
    }
    async updateLocation(location) {
        const result = await this.executor.query(`UPDATE locations
      SET name = $2,
          address = $3::jsonb,
          timezone = $4,
          phone = $5,
          operating_hours = $6::jsonb,
          status = $7,
          archived_at = $8,
          updated_at = $9
      WHERE id = $1
      RETURNING *`, [
            location.id,
            location.name,
            JSON.stringify(location.address),
            location.timezone,
            location.phone ?? null,
            JSON.stringify(location.operatingHours),
            location.status,
            location.archivedAt ?? null,
            location.updatedAt
        ]);
        return mapLocation(one(result));
    }
    async createMember(member) {
        const result = await this.executor.query(`INSERT INTO members (
        id, gym_id, first_name, last_name, email, phone, barcode, profile_image_url, status,
        emergency_contact, notes, tag_names, archived_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12::jsonb, $13, $14, $15)
      RETURNING *`, [
            member.id,
            member.gymId,
            member.firstName,
            member.lastName,
            member.email ?? null,
            member.phone ?? null,
            member.barcode ?? null,
            member.profileImageUrl ?? null,
            member.status,
            member.emergencyContact ? JSON.stringify(member.emergencyContact) : null,
            member.notes ?? null,
            JSON.stringify(member.tagNames),
            member.archivedAt ?? null,
            member.createdAt,
            member.updatedAt
        ]);
        return mapMember(one(result));
    }
    async getMember(memberId) {
        const result = await this.executor.query("SELECT * FROM members WHERE id = $1", [
            memberId
        ]);
        return result.rows[0] ? mapMember(result.rows[0]) : undefined;
    }
    async listMembersForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM members WHERE gym_id = $1 ORDER BY created_at", [gymId]);
        return result.rows.map(mapMember);
    }
    async updateMember(member) {
        const result = await this.executor.query(`UPDATE members
      SET first_name = $2,
          last_name = $3,
          email = $4,
          phone = $5,
          barcode = $6,
          profile_image_url = $7,
          status = $8,
          emergency_contact = $9::jsonb,
          notes = $10,
          tag_names = $11::jsonb,
          archived_at = $12,
          updated_at = $13
      WHERE id = $1
      RETURNING *`, [
            member.id,
            member.firstName,
            member.lastName,
            member.email ?? null,
            member.phone ?? null,
            member.barcode ?? null,
            member.profileImageUrl ?? null,
            member.status,
            member.emergencyContact ? JSON.stringify(member.emergencyContact) : null,
            member.notes ?? null,
            JSON.stringify(member.tagNames),
            member.archivedAt ?? null,
            member.updatedAt
        ]);
        return mapMember(one(result));
    }
    async createMembershipPlan(plan) {
        const result = await this.executor.query(`INSERT INTO membership_plans (
        id, gym_id, name, description, billing_interval, price_cents, signup_fee_cents,
        trial_days, auto_renew, contract_length_months, class_access_limit, is_public,
        status, archived_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`, [
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
        ]);
        return mapMembershipPlan(one(result));
    }
    async getMembershipPlan(planId) {
        const result = await this.executor.query("SELECT * FROM membership_plans WHERE id = $1", [planId]);
        return result.rows[0] ? mapMembershipPlan(result.rows[0]) : undefined;
    }
    async listMembershipPlansForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM membership_plans WHERE gym_id = $1 ORDER BY created_at", [gymId]);
        return result.rows.map(mapMembershipPlan);
    }
    async updateMembershipPlan(plan) {
        const result = await this.executor.query(`UPDATE membership_plans
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
      RETURNING *`, [
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
        ]);
        return mapMembershipPlan(one(result));
    }
    async createMemberMembership(membership) {
        const result = await this.executor.query(`INSERT INTO member_memberships (
        id, gym_id, member_id, plan_id, status, starts_at, ends_at,
        cancelled_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`, [
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
        ]);
        return mapMemberMembership(one(result));
    }
    async getMemberMembership(membershipId) {
        const result = await this.executor.query("SELECT * FROM member_memberships WHERE id = $1", [membershipId]);
        return result.rows[0] ? mapMemberMembership(result.rows[0]) : undefined;
    }
    async listMemberMembershipsForMember(memberId) {
        const result = await this.executor.query(`SELECT * FROM member_memberships
      WHERE member_id = $1
      ORDER BY starts_at`, [memberId]);
        return result.rows.map(mapMemberMembership);
    }
    async updateMemberMembership(membership) {
        const result = await this.executor.query(`UPDATE member_memberships
      SET plan_id = $2,
          status = $3,
          starts_at = $4,
          ends_at = $5,
          cancelled_at = $6,
          updated_at = $7
      WHERE id = $1
      RETURNING *`, [
            membership.id,
            membership.planId,
            membership.status,
            membership.startsAt,
            membership.endsAt ?? null,
            membership.cancelledAt ?? null,
            membership.updatedAt
        ]);
        return mapMemberMembership(one(result));
    }
    async createClassType(classType) {
        const result = await this.executor.query(`INSERT INTO class_types (
        id, gym_id, name, description, default_duration_minutes, default_capacity,
        default_waitlist_capacity, is_public, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`, [
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
        ]);
        return mapClassType(one(result));
    }
    async getClassType(classTypeId) {
        const result = await this.executor.query("SELECT * FROM class_types WHERE id = $1", [classTypeId]);
        return result.rows[0] ? mapClassType(result.rows[0]) : undefined;
    }
    async listClassTypesForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM class_types WHERE gym_id = $1 ORDER BY created_at", [gymId]);
        return result.rows.map(mapClassType);
    }
    async createClassSession(session) {
        const result = await this.executor.query(`INSERT INTO class_sessions (
        id, gym_id, class_type_id, location_id, trainer_user_id, room_name,
        starts_at, ends_at, capacity, waitlist_capacity, cancellation_cutoff_minutes,
        late_cancellation_fee_cents, status, cancelled_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`, [
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
        ]);
        return mapClassSession(one(result));
    }
    async getClassSession(sessionId) {
        const result = await this.executor.query("SELECT * FROM class_sessions WHERE id = $1", [sessionId]);
        return result.rows[0] ? mapClassSession(result.rows[0]) : undefined;
    }
    async listClassSessionsForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM class_sessions WHERE gym_id = $1 ORDER BY starts_at", [gymId]);
        return result.rows.map(mapClassSession);
    }
    async listPublicClassSessionsForGym(gymId, from, to) {
        const result = await this.executor.query(`SELECT class_sessions.*
      FROM class_sessions
      JOIN class_types ON class_types.id = class_sessions.class_type_id
      WHERE class_sessions.gym_id = $1
        AND class_types.is_public = true
        AND class_sessions.status = 'scheduled'
        AND class_sessions.starts_at >= $2
        AND class_sessions.starts_at <= $3
      ORDER BY class_sessions.starts_at`, [gymId, from, to]);
        return result.rows.map(mapClassSession);
    }
    async createClassBooking(booking) {
        const result = await this.executor.query(`INSERT INTO class_bookings (
        id, gym_id, class_session_id, member_id, status, waitlist_position, source,
        created_by_user_id, booked_at, cancelled_at, cancelled_by_user_id, cancellation_reason,
        is_late_cancellation, late_cancellation_fee_cents, staff_override, override_reason,
        promoted_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`, [
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
        ]);
        return mapClassBooking(one(result));
    }
    async getClassBooking(bookingId) {
        const result = await this.executor.query("SELECT * FROM class_bookings WHERE id = $1", [bookingId]);
        return result.rows[0] ? mapClassBooking(result.rows[0]) : undefined;
    }
    async listClassBookingsForSession(classSessionId) {
        const result = await this.executor.query(`SELECT * FROM class_bookings
      WHERE class_session_id = $1
      ORDER BY waitlist_position NULLS LAST, created_at`, [classSessionId]);
        return result.rows.map(mapClassBooking);
    }
    async listClassBookingsForMember(memberId) {
        const result = await this.executor.query(`SELECT * FROM class_bookings
      WHERE member_id = $1
      ORDER BY created_at`, [memberId]);
        return result.rows.map(mapClassBooking);
    }
    async updateClassBooking(booking) {
        const result = await this.executor.query(`UPDATE class_bookings
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
      RETURNING *`, [
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
        ]);
        return mapClassBooking(one(result));
    }
    async createNotificationEvent(event) {
        const result = await this.executor.query(`INSERT INTO notification_events (
        id, gym_id, type, status, recipient_member_id, related_booking_id,
        payload, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
      RETURNING *`, [
            event.id,
            event.gymId,
            event.type,
            event.status,
            event.recipientMemberId,
            event.relatedBookingId ?? null,
            JSON.stringify(event.payload),
            event.createdAt,
            event.updatedAt
        ]);
        return mapNotificationEvent(one(result));
    }
    async listNotificationEventsForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM notification_events WHERE gym_id = $1 ORDER BY created_at", [gymId]);
        return result.rows.map(mapNotificationEvent);
    }
    async createCheckIn(checkIn) {
        const result = await this.executor.query(`INSERT INTO check_ins (
        id, gym_id, member_id, location_id, class_session_id, booking_id, status,
        method, denied_reason, staff_override, override_reason, checked_in_at,
        created_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`, [
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
        ]);
        return mapCheckIn(one(result));
    }
    async listCheckInsForMember(memberId) {
        const result = await this.executor.query("SELECT * FROM check_ins WHERE member_id = $1 ORDER BY checked_in_at", [memberId]);
        return result.rows.map(mapCheckIn);
    }
    async listCheckInsForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM check_ins WHERE gym_id = $1 ORDER BY checked_in_at", [gymId]);
        return result.rows.map(mapCheckIn);
    }
    async deleteCheckIn(checkInId, gymId) {
        const result = await this.executor.query("DELETE FROM check_ins WHERE id = $1 AND gym_id = $2", [checkInId, gymId]);
        return (result.rowCount ?? 0) > 0;
    }
    async createAccessDevice(device) {
        const result = await this.executor.query(`INSERT INTO access_devices (
        id, gym_id, location_id, name, device_type, status, api_key_hash,
        api_key_preview, last_heartbeat_at, created_at, updated_at, rotated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`, [
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
        ]);
        return mapAccessDevice(one(result));
    }
    async getAccessDevice(deviceId) {
        const result = await this.executor.query("SELECT * FROM access_devices WHERE id = $1", [deviceId]);
        return result.rows[0] ? mapAccessDevice(result.rows[0]) : undefined;
    }
    async findAccessDeviceByApiKeyHash(apiKeyHash) {
        const result = await this.executor.query("SELECT * FROM access_devices WHERE api_key_hash = $1", [apiKeyHash]);
        return result.rows[0] ? mapAccessDevice(result.rows[0]) : undefined;
    }
    async listAccessDevicesForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM access_devices WHERE gym_id = $1 ORDER BY name", [gymId]);
        return result.rows.map(mapAccessDevice);
    }
    async updateAccessDevice(device) {
        const result = await this.executor.query(`UPDATE access_devices
       SET location_id = $2, name = $3, device_type = $4, status = $5, api_key_hash = $6,
           api_key_preview = $7, last_heartbeat_at = $8, updated_at = $9, rotated_at = $10
       WHERE id = $1
       RETURNING *`, [
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
        ]);
        return mapAccessDevice(one(result));
    }
    async createAccessRule(rule) {
        const result = await this.executor.query(`INSERT INTO access_rules (
        id, gym_id, location_id, name, plan_id, allow_all_active_members,
        starts_at, ends_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`, [
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
        ]);
        return mapAccessRule(one(result));
    }
    async listAccessRulesForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM access_rules WHERE gym_id = $1 ORDER BY created_at", [gymId]);
        return result.rows.map(mapAccessRule);
    }
    async createAccessEvent(event) {
        const result = await this.executor.query(`INSERT INTO access_events (
        id, gym_id, device_id, location_id, member_id, decision, reason, occurred_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`, [
            event.id,
            event.gymId,
            event.deviceId,
            event.locationId,
            event.memberId ?? null,
            event.decision,
            event.reason,
            event.occurredAt,
            event.createdAt
        ]);
        return mapAccessEvent(one(result));
    }
    async listAccessEventsForGym(gymId) {
        const result = await this.executor.query("SELECT * FROM access_events WHERE gym_id = $1 ORDER BY occurred_at DESC", [gymId]);
        return result.rows.map(mapAccessEvent);
    }
    async createRefreshToken(refreshToken) {
        const result = await this.executor.query(`INSERT INTO refresh_tokens (
        id, user_id, gym_id, token_hash, expires_at, revoked_at, replaced_by_token_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`, [
            refreshToken.id,
            refreshToken.userId,
            refreshToken.gymId ?? null,
            refreshToken.tokenHash,
            refreshToken.expiresAt,
            refreshToken.revokedAt ?? null,
            refreshToken.replacedByTokenId ?? null,
            refreshToken.createdAt
        ]);
        return mapRefreshToken(one(result));
    }
    async findRefreshTokenByHash(tokenHash) {
        const result = await this.executor.query("SELECT * FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
        return result.rows[0] ? mapRefreshToken(result.rows[0]) : undefined;
    }
    async listRefreshTokensForUser(userId) {
        const result = await this.executor.query("SELECT * FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at", [userId]);
        return result.rows.map(mapRefreshToken);
    }
    async updateRefreshToken(refreshToken) {
        const result = await this.executor.query(`UPDATE refresh_tokens
      SET revoked_at = $2,
          replaced_by_token_id = $3
      WHERE id = $1
      RETURNING *`, [refreshToken.id, refreshToken.revokedAt ?? null, refreshToken.replacedByTokenId ?? null]);
        return mapRefreshToken(one(result));
    }
    async createPurposeToken(purposeToken) {
        const result = await this.executor.query(`INSERT INTO purpose_tokens (
        id, user_id, token_hash, purpose, expires_at, used_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`, [
            purposeToken.id,
            purposeToken.userId,
            purposeToken.tokenHash,
            purposeToken.purpose,
            purposeToken.expiresAt,
            purposeToken.usedAt ?? null,
            purposeToken.createdAt
        ]);
        return mapPurposeToken(one(result));
    }
    async findPurposeTokenByHash(tokenHash, purpose) {
        const result = await this.executor.query("SELECT * FROM purpose_tokens WHERE token_hash = $1 AND purpose = $2", [tokenHash, purpose]);
        return result.rows[0] ? mapPurposeToken(result.rows[0]) : undefined;
    }
    async updatePurposeToken(purposeToken) {
        const result = await this.executor.query(`UPDATE purpose_tokens
      SET used_at = $2
      WHERE id = $1
      RETURNING *`, [purposeToken.id, purposeToken.usedAt ?? null]);
        return mapPurposeToken(one(result));
    }
}
export function createPostgresRepositories(pool) {
    return new PostgresRepositories(pool, pool);
}
function one(result) {
    const row = result.rows[0];
    if (!row) {
        throw new Error("Expected database query to return one row.");
    }
    return row;
}
function mapUser(row) {
    const user = {
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
function mapGym(row) {
    const gym = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        ownerUserId: row.owner_user_id,
        status: row.status,
        timezone: row.timezone,
        locale: row.locale,
        operatingHours: operatingHours(row.operating_hours),
        featureFlags: stringArray(row.feature_flags),
        onboardingCompletedSteps: stringArray(row.onboarding_completed_steps),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
    if (row.logo_url) {
        gym.logoUrl = row.logo_url;
    }
    if (isRecord(row.brand_colors) && typeof row.brand_colors.primary === "string") {
        gym.brandColors = row.brand_colors;
    }
    if (isRecord(row.business_info) && Object.keys(row.business_info).length > 0) {
        gym.businessInfo = row.business_info;
    }
    return gym;
}
function mapRole(row) {
    return {
        id: row.id,
        gymId: row.gym_id,
        name: row.name,
        permissions: stringArray(row.permissions),
        isSystem: row.is_system,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
function mapGymUser(row) {
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
function mapStaffInvite(row) {
    const invite = {
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
function mapStaffAuditLog(row) {
    const entry = {
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
function mapStaffShift(row) {
    const shift = {
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
function mapLocation(row) {
    const location = {
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
function mapMember(row) {
    const member = {
        id: row.id,
        gymId: row.gym_id,
        firstName: row.first_name,
        lastName: row.last_name,
        status: row.status,
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
function mapMembershipPlan(row) {
    const plan = {
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
function mapMemberMembership(row) {
    const membership = {
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
function mapClassType(row) {
    const classType = {
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
function mapClassSession(row) {
    const session = {
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
function mapClassBooking(row) {
    const booking = {
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
function mapNotificationEvent(row) {
    const event = {
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
function mapCheckIn(row) {
    const checkIn = {
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
function mapAccessDevice(row) {
    const device = {
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
function mapAccessRule(row) {
    const rule = {
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
function mapAccessEvent(row) {
    const event = {
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
function mapRefreshToken(row) {
    const refreshToken = {
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
function mapPurposeToken(row) {
    const purposeToken = {
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
function stringArray(value) {
    return Array.isArray(value)
        ? value.filter((item) => typeof item === "string")
        : [];
}
function address(value) {
    if (!isRecord(value)) {
        throw new Error("Database address value is invalid.");
    }
    const line1 = stringField(value, "line1");
    const city = stringField(value, "city");
    const region = stringField(value, "region");
    const postalCode = stringField(value, "postalCode");
    const country = stringField(value, "country");
    const mapped = { line1, city, region, postalCode, country };
    const line2 = value.line2;
    if (typeof line2 === "string" && line2) {
        mapped.line2 = line2;
    }
    return mapped;
}
function emergencyContact(record) {
    const contact = {
        name: stringField(record, "name"),
        phone: stringField(record, "phone")
    };
    const relationship = record.relationship;
    return typeof relationship === "string" && relationship ? { ...contact, relationship } : contact;
}
function operatingHours(value) {
    return isRecord(value) ? value : {};
}
function stringField(record, key) {
    const value = record[key];
    if (typeof value !== "string") {
        throw new Error(`Database field ${key} is invalid.`);
    }
    return value;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=postgresRepositories.js.map