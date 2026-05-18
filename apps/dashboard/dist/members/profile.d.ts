import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
import { type MemberContactInformationSection, type MemberEmergencyContactSection, type MemberNotesSection, type MemberProfileSection } from "./profileSections.js";
import { type MemberStatusBadge } from "./statusBadges.js";
import type { MemberProfileMembershipView, MemberView } from "./types.js";
export interface MemberProfileAction {
    key: "back_to_members" | "edit" | "check_in" | "assign_plan" | "archive";
    button: ButtonModel;
    href?: string;
}
export interface MemberProfileMembershipRow extends MemberProfileMembershipView {
    statusLabel: string;
    active: boolean;
    dateRangeLabel: string;
    detailHref: string;
}
export interface MemberProfilePage {
    screen: "member_profile";
    member: MemberView;
    fullName: string;
    initials: string;
    statusLabel: string;
    statusBadge: MemberStatusBadge;
    active: boolean;
    archived: boolean;
    contactSection: MemberContactInformationSection;
    emergencyContactSection: MemberEmergencyContactSection;
    notesSection: MemberNotesSection;
    sections: MemberProfileSection[];
    memberships: MemberProfileMembershipRow[];
    membershipSummary: {
        totalCount: number;
        activeCount: number;
        trialingCount: number;
        pausedCount: number;
        cancelledCount: number;
        expiredCount: number;
    };
    actions: MemberProfileAction[];
    membershipEmpty?: EmptyStateModel;
}
export declare function buildMemberProfilePage(inputModel: {
    member: MemberView;
    memberships?: MemberProfileMembershipView[];
    permissions: string[];
}): MemberProfilePage;
//# sourceMappingURL=profile.d.ts.map