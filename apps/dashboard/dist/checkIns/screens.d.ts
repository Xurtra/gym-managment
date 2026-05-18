import { CheckInMethod, CheckInStatus } from "@gym-platform/constants";
import type { CheckInClassOption, CheckInLocationOption, CheckInRecord, CheckInSubmission, MemberSearchResult } from "./types.js";
export interface FrontDeskCheckInScreen {
    screen: "front_desk_check_in";
    members: MemberSearchResult[];
    locations: CheckInLocationOption[];
    classes: CheckInClassOption[];
    selectedLocationId?: string;
    selectedClassSessionId?: string;
    canSubmit: boolean;
}
export interface CheckInResultScreen {
    screen: "check_in_success" | "check_in_denied";
    status: CheckInStatus;
    title: string;
    memberId: string;
    checkedInAt: string;
    method: CheckInMethod;
    locationId: string;
    classSessionId?: string;
    bookingId?: string;
    deniedReason?: string;
    warning?: string;
    canOverride: boolean;
}
export declare function buildFrontDeskCheckInScreen(input: {
    members: MemberSearchResult[];
    locations: CheckInLocationOption[];
    classes?: CheckInClassOption[];
    selectedLocationId?: string;
    selectedClassSessionId?: string;
}): FrontDeskCheckInScreen;
export declare function createManualCheckInSubmission(input: {
    memberId: string;
    locationId: string;
    classSessionId?: string;
    overrideEligibility?: boolean;
    overrideReason?: string;
}): CheckInSubmission;
export declare function buildCheckInResultScreen(record: CheckInRecord): CheckInResultScreen;
export declare function warningForMember(member: MemberSearchResult): "Payment past due" | undefined;
export declare function warningForDeniedReason(reason: string): "Payment or membership needs review" | undefined;
//# sourceMappingURL=screens.d.ts.map