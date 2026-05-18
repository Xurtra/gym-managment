import type { LocationCreateInput, LocationUpdateInput } from "@gym-platform/validation";
import type { Location } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
export declare class LocationService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    list(gymId: string): Promise<Location[]>;
    get(gymId: string, locationId: string): Promise<Location>;
    listRooms(gymId: string, locationId: string): Promise<{
        locationId: string;
        name: string;
        sessionCount: number;
        nextSessionAt?: Date;
    }[]>;
    create(gymId: string, input: LocationCreateInput): Promise<Location>;
    update(gymId: string, locationId: string, input: LocationUpdateInput): Promise<Location>;
    archive(gymId: string, locationId: string): Promise<Location>;
    private getActive;
}
//# sourceMappingURL=location.service.d.ts.map