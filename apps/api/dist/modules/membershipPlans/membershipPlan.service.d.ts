import type { MembershipPlanCreateInput, MembershipPlanUpdateInput } from "@gym-platform/validation";
import type { MembershipPlan } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
export declare class MembershipPlanService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    list(gymId: string): Promise<MembershipPlan[]>;
    create(gymId: string, input: MembershipPlanCreateInput): Promise<MembershipPlan>;
    update(gymId: string, planId: string, input: MembershipPlanUpdateInput): Promise<MembershipPlan>;
    archive(gymId: string, planId: string): Promise<MembershipPlan>;
    private getActive;
    private ensureUniqueName;
}
//# sourceMappingURL=membershipPlan.service.d.ts.map