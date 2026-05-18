import type { MemberMembershipAssignInput } from "@gym-platform/validation";
import type { MemberMembership } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
export declare class MemberMembershipService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    list(gymId: string, memberId: string): Promise<MemberMembership[]>;
    assignPlan(gymId: string, memberId: string, input: MemberMembershipAssignInput): Promise<MemberMembership>;
    private getScopedMember;
}
//# sourceMappingURL=memberMembership.service.d.ts.map