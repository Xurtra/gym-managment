import type { CheckInCreateInput } from "@gym-platform/validation";
import type { CheckIn } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
interface CheckInCode {
    qrPayload: string;
    barcodeFallback: string;
    barcode?: string;
}
export declare class CheckInService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    listForMember(gymId: string, memberId: string): Promise<CheckIn[]>;
    listForGym(gymId: string): Promise<CheckIn[]>;
    deleteCheckIn(gymId: string, checkInId: string): Promise<{
        deleted: boolean;
    }>;
    checkIn(gymId: string, staffUserId: string, input: CheckInCreateInput): Promise<CheckIn>;
    checkInCode(gymId: string, memberId: string): Promise<CheckInCode>;
    private resolveMember;
    private getScopedMember;
    private getDenialReason;
    private getMembershipDenial;
    private getClassBookingDenial;
    private findBookedClassBooking;
}
export {};
//# sourceMappingURL=checkIn.service.d.ts.map