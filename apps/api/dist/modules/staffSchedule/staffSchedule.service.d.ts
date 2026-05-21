import type { StaffAvailabilityCreateInput, StaffShiftCreateInput, StaffTaskCreateInput, StaffTaskUpdateInput } from "@gym-platform/validation";
import type { StaffAvailability, StaffTask } from "../../infrastructure/store/entities.js";
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
    listShifts(gymId: string): Promise<PublicStaffShift[]>;
    createAvailability(gymId: string, input: StaffAvailabilityCreateInput): Promise<StaffAvailability>;
    listAvailability(gymId: string): Promise<StaffAvailability[]>;
    createTask(gymId: string, createdByUserId: string, input: StaffTaskCreateInput): Promise<StaffTask>;
    listTasks(gymId: string): Promise<StaffTask[]>;
    updateTask(gymId: string, taskId: string, input: StaffTaskUpdateInput): Promise<StaffTask>;
    private ensureStaffUser;
    private ensureLocation;
}
//# sourceMappingURL=staffSchedule.service.d.ts.map