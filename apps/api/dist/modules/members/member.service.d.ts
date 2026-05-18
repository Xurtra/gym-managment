import type { MemberCreateInput, MemberUpdateInput } from "@gym-platform/validation";
import type { Member } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
export declare class MemberService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    list(gymId: string): Promise<Member[]>;
    create(gymId: string, input: MemberCreateInput): Promise<Member>;
    update(gymId: string, memberId: string, input: MemberUpdateInput): Promise<Member>;
    archive(gymId: string, memberId: string): Promise<Member>;
    private getActive;
    private ensureUnique;
}
//# sourceMappingURL=member.service.d.ts.map