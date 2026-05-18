import type { ClassSessionCreateInput, ClassTypeCreateInput } from "@gym-platform/validation";
import type { ClassSession, ClassType } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
export declare class ClassScheduleService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    createClassType(gymId: string, input: ClassTypeCreateInput): Promise<ClassType>;
    listClassTypes(gymId: string): Promise<ClassType[]>;
    createSession(gymId: string, input: ClassSessionCreateInput): Promise<ClassSession>;
    publicSchedule(gymSlug: string, from: Date, to: Date, filters?: {
        locationId?: string;
    }): Promise<ClassSession[]>;
}
//# sourceMappingURL=classSchedule.service.d.ts.map