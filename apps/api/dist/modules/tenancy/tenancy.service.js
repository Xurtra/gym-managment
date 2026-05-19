import { FeatureFlag, GymStatus, RoleName, UserStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { forbidden, notFound } from "../../http/errors.js";
import { slugify } from "../../shared/slug.js";
import { RoleService } from "../roles/role.service.js";
export class TenancyService {
    repositories;
    clock;
    constructor(repositories, clock) {
        this.repositories = repositories;
        this.clock = clock;
    }
    async createGym(ownerUserId, input) {
        return this.repositories.transaction(async (repositories) => {
            const owner = await repositories.users.getUser(ownerUserId);
            if (!owner) {
                throw notFound("Owner user was not found.");
            }
            const slug = await this.uniqueSlug(input.slug ?? slugify(input.name), repositories);
            const now = this.clock.now();
            const gym = {
                id: randomUUID(),
                name: input.name,
                slug,
                ownerUserId,
                status: GymStatus.Active,
                timezone: input.timezone,
                locale: input.locale,
                operatingHours: {},
                featureFlags: input.featureFlags.length > 0 ? input.featureFlags : defaultFeatureFlags(),
                onboardingCompletedSteps: ["gym-details"],
                createdAt: now,
                updatedAt: now
            };
            await repositories.gyms.createGym(gym);
            const roleService = new RoleService(repositories, this.clock);
            const roles = await roleService.createDefaultRoles(gym.id);
            const ownerRole = roles.find((role) => role.name === RoleName.Owner);
            if (!ownerRole) {
                throw new Error("Owner role was not created.");
            }
            const membershipId = randomUUID();
            await repositories.gymUsers.createGymUser({
                id: membershipId,
                gymId: gym.id,
                userId: ownerUserId,
                roleId: ownerRole.id,
                status: UserStatus.Active,
                createdAt: now,
                updatedAt: now
            });
            return gym;
        });
    }
    async resolveGymForUser(userId, requestedGymId) {
        const memberships = (await this.repositories.gymUsers.listGymMemberships(userId)).filter((membership) => membership.status === UserStatus.Active);
        const membership = requestedGymId
            ? memberships.find((candidate) => candidate.gymId === requestedGymId)
            : memberships[0];
        if (!membership) {
            throw forbidden("User does not have access to this gym.");
        }
        const gym = await this.repositories.gyms.getGym(membership.gymId);
        if (!gym || gym.status !== GymStatus.Active) {
            throw forbidden("Gym is not active.");
        }
        return { gym, membership };
    }
    async ensureGymAccess(userId, gymId) {
        return this.resolveGymForUser(userId, gymId);
    }
    async getGym(gymId) {
        const gym = await this.repositories.gyms.getGym(gymId);
        if (!gym || gym.status !== GymStatus.Active) {
            throw notFound("Gym was not found.");
        }
        return gym;
    }
    async listSettingsGyms() {
        return this.repositories.gyms.listGyms();
    }
    async updateGym(gymId, input) {
        const gym = await this.getGym(gymId);
        const updated = {
            ...gym,
            updatedAt: this.clock.now()
        };
        if (input.name)
            updated.name = input.name;
        if (input.timezone)
            updated.timezone = input.timezone;
        if (input.locale)
            updated.locale = input.locale;
        if (input.logoUrl)
            updated.logoUrl = input.logoUrl;
        if (input.brandColors)
            updated.brandColors = cleanBrandColors(input.brandColors);
        if (input.businessInfo)
            updated.businessInfo = cleanBusinessInfo(input.businessInfo);
        if (input.operatingHours)
            updated.operatingHours = input.operatingHours;
        if (input.featureFlags)
            updated.featureFlags = input.featureFlags;
        if (input.onboardingCompletedSteps) {
            updated.onboardingCompletedSteps = input.onboardingCompletedSteps;
        }
        return this.repositories.gyms.updateGym(updated);
    }
    async uniqueSlug(baseSlug, repositories = this.repositories) {
        const safeBase = slugify(baseSlug) || "gym";
        let candidate = safeBase;
        let suffix = 2;
        while (await repositories.gyms.findGymBySlug(candidate)) {
            candidate = `${safeBase}-${suffix}`;
            suffix += 1;
        }
        return candidate;
    }
}
function cleanBrandColors(input) {
    const colors = { primary: input.primary };
    if (input.secondary)
        colors.secondary = input.secondary;
    if (input.accent)
        colors.accent = input.accent;
    return colors;
}
function cleanBusinessInfo(input) {
    const business = {};
    if (input.legalName)
        business.legalName = input.legalName;
    if (input.phone)
        business.phone = input.phone;
    if (input.email)
        business.email = input.email;
    if (input.website)
        business.website = input.website;
    if (input.taxId)
        business.taxId = input.taxId;
    if (input.address) {
        const address = {
            line1: input.address.line1,
            city: input.address.city,
            region: input.address.region,
            postalCode: input.address.postalCode,
            country: input.address.country
        };
        if (input.address.line2) {
            business.address = { ...address, line2: input.address.line2 };
        }
        else {
            business.address = address;
        }
    }
    return business;
}
function defaultFeatureFlags() {
    return [
        FeatureFlag.OnlineSignup,
        FeatureFlag.ClassBooking,
        FeatureFlag.MemberPortal,
        FeatureFlag.WebsiteBuilder
    ];
}
//# sourceMappingURL=tenancy.service.js.map