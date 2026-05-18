import type { StaffShiftCreateInput } from "@gym-platform/validation";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
export interface PublicStaffShift {
    id: string;
    gymId: string;
    userId: string;
    locationId?: string;
    roleId: string;
    startsAt: string;
    endsAt: string;
    notes?: string;
    createdByUserId: string;
    createdAt: string;
    updatedAt: string;
}
export declare class StaffScheduleService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    createShift(gymId: string, createdByUserId: string, input: StaffShiftCreateInput): Promise<PublicStaffShift>;
}
//# sourceMappingURL=staffSchedule.service.d.ts.map