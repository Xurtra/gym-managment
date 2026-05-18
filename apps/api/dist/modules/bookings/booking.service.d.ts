import type { ClassBookingCreateInput, StaffManualBookingInput } from "@gym-platform/validation";
import type { ClassBooking } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
export declare class BookingService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    listForSession(gymId: string, classSessionId: string): Promise<ClassBooking[]>;
    createBooking(gymId: string, classSessionId: string, input: ClassBookingCreateInput): Promise<ClassBooking>;
    joinWaitlist(gymId: string, classSessionId: string, input: ClassBookingCreateInput): Promise<ClassBooking>;
    createStaffManualBooking(gymId: string, classSessionId: string, staffUserId: string, input: StaffManualBookingInput): Promise<ClassBooking>;
    cancelBooking(gymId: string, bookingId: string, cancelledByUserId?: string): Promise<{
        booking: ClassBooking;
        promotedBooking: ClassBooking;
    } | {
        booking: ClassBooking;
        promotedBooking?: never;
    }>;
    leaveWaitlist(gymId: string, bookingId: string, cancelledByUserId?: string): Promise<{
        booking: ClassBooking;
    }>;
    private getBookableSession;
    private getScopedSession;
    private getBookableMember;
    private getScopedBooking;
    private ensureNoActiveBooking;
    private cancelActiveBooking;
    private promoteNextWaitlistedBooking;
    private compactWaitlistPositions;
    private getActiveMembershipEligibility;
    private ensurePlanLimitAvailable;
    private countUpcomingBookedClasses;
    private canPromoteWaitlistedBooking;
    private createWaitlistPromotionNotification;
}
//# sourceMappingURL=booking.service.d.ts.map