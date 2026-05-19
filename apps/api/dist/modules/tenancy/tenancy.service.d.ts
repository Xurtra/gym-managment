import type { GymCreateInput, GymUpdateInput } from "@gym-platform/validation";
import type { Gym } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
export declare class TenancyService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    createGym(ownerUserId: string, input: GymCreateInput): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        name: string;
        slug: string;
        ownerUserId: string;
        status: "active";
        timezone: string;
        locale: string;
        operatingHours: {};
        featureFlags: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control")[];
        onboardingCompletedSteps: string[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    resolveGymForUser(userId: string, requestedGymId?: string): Promise<{
        gym: Gym;
        membership: import("../../infrastructure/store/entities.js").GymUser;
    }>;
    ensureGymAccess(userId: string, gymId: string): Promise<{
        gym: Gym;
        membership: import("../../infrastructure/store/entities.js").GymUser;
    }>;
    getGym(gymId: string): Promise<Gym>;
    listSettingsGyms(): Promise<Gym[]>;
    updateGym(gymId: string, input: GymUpdateInput): Promise<Gym>;
    private uniqueSlug;
}
//# sourceMappingURL=tenancy.service.d.ts.map