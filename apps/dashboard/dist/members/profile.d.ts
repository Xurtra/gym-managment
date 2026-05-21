import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
import { type MemberContactInformationSection, type MemberEmergencyContactSection, type MemberNotesSection, type MemberProfileSection } from "./profileSections.js";
import { type MemberStatusBadge } from "./statusBadges.js";
import type { MemberProfileMembershipView, MemberView } from "./types.js";
export interface MemberProfileAction {
    key: "back_to_members" | "edit" | "check_in" | "assign_plan" | "portal_invite" | "archive";
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
    portalStatusLabel: string;
    portalActionLabel: string;
    contactSection: MemberContactInformationSection;
    emergencyContactSection: MemberEmergencyContactSection;
    notesSection: MemberNotesSection;
    sections: MemberProfileSection[];
    sectionCount: number;
    memberships: MemberProfileMembershipRow[];
    membershipCount: number;
    membershipSummary: {
        totalCount: number;
        activeCount: number;
        trialingCount: number;
        pausedCount: number;
        cancelledCount: number;
        expiredCount: number;
    };
    membershipSummaryLabel: string;
    actions: MemberProfileAction[];
    actionCount: number;
    membershipEmpty?: EmptyStateModel;
}
export declare function buildMemberProfilePage(inputModel: {
    member: MemberView;
    memberships?: MemberProfileMembershipView[];
    permissions: string[];
}): MemberProfilePage;
//# sourceMappingURL=profile.d.ts.map