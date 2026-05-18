import { CheckInMethod, CheckInStatus, MemberStatus } from "@gym-platform/constants";
export function buildFrontDeskCheckInScreen(input) {
    const screen = {
        screen: "front_desk_check_in",
        members: input.members,
        locations: input.locations,
        classes: input.classes ?? [],
        canSubmit: Boolean(input.selectedLocationId && input.members.length > 0)
    };
    if (input.selectedLocationId) {
        screen.selectedLocationId = input.selectedLocationId;
    }
    if (input.selectedClassSessionId) {
        screen.selectedClassSessionId = input.selectedClassSessionId;
    }
    return screen;
}
export function createManualCheckInSubmission(input) {
    const submission = {
        memberId: input.memberId,
        locationId: input.locationId,
        method: CheckInMethod.StaffManual
    };
    if (input.classSessionId) {
        submission.classSessionId = input.classSessionId;
    }
    if (input.overrideEligibility) {
        submission.overrideEligibility = true;
        if (input.overrideReason) {
            submission.overrideReason = input.overrideReason;
        }
    }
    return submission;
}
export function buildCheckInResultScreen(record) {
    const denied = record.status === CheckInStatus.Denied;
    const screen = {
        screen: denied ? "check_in_denied" : "check_in_success",
        status: record.status,
        title: denied ? "Check-in denied" : "Check-in allowed",
        memberId: record.memberId,
        checkedInAt: record.checkedInAt,
        method: record.method,
        locationId: record.locationId,
        canOverride: denied
    };
    if (record.classSessionId) {
        screen.classSessionId = record.classSessionId;
    }
    if (record.bookingId) {
        screen.bookingId = record.bookingId;
    }
    if (record.deniedReason) {
        screen.deniedReason = record.deniedReason;
        const warning = warningForDeniedReason(record.deniedReason);
        if (warning) {
            screen.warning = warning;
        }
    }
    return screen;
}
export function warningForMember(member) {
    if (member.status === MemberStatus.PastDue) {
        return "Payment past due";
    }
    return undefined;
}
export function warningForDeniedReason(reason) {
    if (reason === "member_status_past_due" || reason === "membership_not_active") {
        return "Payment or membership needs review";
    }
    return undefined;
}
//# sourceMappingURL=screens.js.map