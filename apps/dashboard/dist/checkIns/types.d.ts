import type { CheckInMethod, CheckInStatus, MemberStatus } from "@gym-platform/constants";
export interface MemberSearchResult {
    id: string;
    firstName: string;
    lastName: string;
    status: MemberStatus;
    email?: string;
    phone?: string;
    barcode?: string;
}
export interface CheckInLocationOption {
    id: string;
    name: string;
}
export interface CheckInClassOption {
    id: string;
    name: string;
    startsAt: string;
}
export interface CheckInRecord {
    id: string;
    memberId: string;
    memberName?: string;
    locationId: string;
    locationName?: string;
    classSessionId?: string;
    className?: string;
    bookingId?: string;
    status: CheckInStatus;
    method: CheckInMethod;
    staffOverride: boolean;
    deniedReason?: string;
    overrideReason?: string;
    checkedInAt: string;
}
export interface CheckInScreenContext {
    gymId: string;
    locationId?: string;
    classSessionId?: string;
}
export interface CheckInSubmission {
    memberId?: string;
    barcode?: string;
    qrPayload?: string;
    locationId: string;
    classSessionId?: string;
    method: CheckInMethod;
    overrideEligibility?: boolean;
    overrideReason?: string;
}
//# sourceMappingURL=types.d.ts.map