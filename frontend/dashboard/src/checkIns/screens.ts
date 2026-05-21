import { CheckInMethod, CheckInStatus, MemberStatus } from "@gym-platform/constants";
import type {
  CheckInClassOption,
  CheckInLocationOption,
  CheckInRecord,
  CheckInSubmission,
  MemberSearchResult
} from "./types.js";

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

export function buildFrontDeskCheckInScreen(input: {
  members: MemberSearchResult[];
  locations: CheckInLocationOption[];
  classes?: CheckInClassOption[];
  selectedLocationId?: string;
  selectedClassSessionId?: string;
}): FrontDeskCheckInScreen {
  const screen: FrontDeskCheckInScreen = {
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

export function createManualCheckInSubmission(input: {
  memberId: string;
  locationId: string;
  classSessionId?: string;
  overrideEligibility?: boolean;
  overrideReason?: string;
}): CheckInSubmission {
  const submission: CheckInSubmission = {
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

export function buildCheckInResultScreen(record: CheckInRecord): CheckInResultScreen {
  const denied = record.status === CheckInStatus.Denied;
  const screen: CheckInResultScreen = {
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

export function warningForMember(member: MemberSearchResult) {
  if (member.status === MemberStatus.PastDue) {
    return "Payment past due";
  }
  return undefined;
}

export function warningForDeniedReason(reason: string) {
  if (reason === "member_status_past_due" || reason === "membership_not_active") {
    return "Payment or membership needs review";
  }
  return undefined;
}
