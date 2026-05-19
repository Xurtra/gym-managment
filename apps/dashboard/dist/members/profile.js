import { MemberStatus, MembershipStatus, Permission } from "@gym-platform/constants";
import { button, emptyState } from "@gym-platform/ui";
import { buildMemberContactInformationSection, buildMemberEmergencyContactSection, buildMemberNotesSection } from "./profileSections.js";
import { buildMemberStatusBadge } from "./statusBadges.js";
export function buildMemberProfilePage(inputModel) {
    const canWriteMembers = inputModel.permissions.includes(Permission.MemberWrite);
    const archived = isArchived(inputModel.member);
    const statusBadge = buildMemberStatusBadge(inputModel.member.status);
    const contactSection = buildMemberContactInformationSection(inputModel.member);
    const emergencyContactSection = buildMemberEmergencyContactSection(inputModel.member);
    const notesSection = buildMemberNotesSection(inputModel.member);
    const sections = buildSections(inputModel.member, statusBadge, contactSection, emergencyContactSection, notesSection);
    const memberships = (inputModel.memberships ?? [])
        .slice()
        .sort(compareMemberships)
        .map(buildMembershipRow);
    const membershipSummary = {
        totalCount: memberships.length,
        activeCount: memberships.filter((membership) => membership.status === MembershipStatus.Active)
            .length,
        trialingCount: memberships.filter((membership) => membership.status === MembershipStatus.Trialing).length,
        pausedCount: memberships.filter((membership) => membership.status === MembershipStatus.Paused)
            .length,
        cancelledCount: memberships.filter((membership) => membership.status === MembershipStatus.Canceled).length,
        expiredCount: memberships.filter((membership) => membership.status === MembershipStatus.Expired)
            .length
    };
    const actions = buildActions(inputModel.member, canWriteMembers, archived);
    return {
        screen: "member_profile",
        member: inputModel.member,
        fullName: memberName(inputModel.member),
        initials: buildInitials(inputModel.member),
        statusLabel: statusBadge.label,
        statusBadge,
        active: inputModel.member.status === MemberStatus.Active,
        archived,
        contactSection,
        emergencyContactSection,
        notesSection,
        sections,
        sectionCount: sections.length,
        memberships,
        membershipCount: memberships.length,
        membershipSummary,
        membershipSummaryLabel: `Showing ${memberships.length} membership${memberships.length === 1 ? "" : "s"}`,
        actions,
        actionCount: actions.length,
        ...(memberships.length === 0
            ? {
                membershipEmpty: emptyState({
                    title: "No memberships",
                    body: "Assigned plans and membership history for this member will appear here."
                })
            }
            : {})
    };
}
function buildSections(member, statusBadge, contactSection, emergencyContactSection, notesSection) {
    return [
        {
            key: "identity",
            title: "Identity",
            details: [
                { key: "status", label: "Status", value: statusBadge.label },
                { key: "barcode", label: "Barcode", value: member.barcode ?? "Not provided" },
                { key: "created", label: "Created", value: member.createdAt },
                { key: "updated", label: "Last updated", value: member.updatedAt }
            ]
        },
        contactSection,
        emergencyContactSection,
        {
            key: "tags",
            title: "Tags",
            details: [{ key: "tags", label: "Tags", value: member.tagNames.join(", ") || "No tags" }]
        },
        notesSection
    ];
}
function buildActions(member, canWriteMembers, archived) {
    const checkInDisabled = !canWriteMembers ||
        archived ||
        member.status === MemberStatus.Cancelled ||
        member.status === MemberStatus.Expired;
    return [
        {
            key: "back_to_members",
            href: "/members",
            button: button({ label: "Back to members", icon: "arrow-left", intent: "secondary" })
        },
        {
            key: "edit",
            href: `/members/${member.id}/edit`,
            button: button({
                label: "Edit member",
                icon: "pencil",
                intent: "secondary",
                disabled: !canWriteMembers || archived
            })
        },
        {
            key: "check_in",
            href: `/check-ins?memberId=${member.id}`,
            button: button({
                label: "Check in",
                icon: "scan-line",
                intent: "secondary",
                disabled: checkInDisabled
            })
        },
        {
            key: "assign_plan",
            href: `/members/${member.id}/memberships/new`,
            button: button({
                label: "Assign plan",
                icon: "badge-plus",
                intent: "secondary",
                disabled: !canWriteMembers || archived
            })
        },
        {
            key: "archive",
            button: button({
                label: "Archive",
                icon: "archive",
                intent: "danger",
                disabled: !canWriteMembers || archived
            })
        }
    ];
}
function buildMembershipRow(membership) {
    return {
        ...membership,
        statusLabel: membershipStatusLabel(membership.status),
        active: membership.status === MembershipStatus.Active ||
            membership.status === MembershipStatus.Trialing,
        dateRangeLabel: membership.endsAt
            ? `${membership.startsAt} to ${membership.endsAt}`
            : `${membership.startsAt} to ongoing`,
        detailHref: `/members/${membership.memberId}/memberships/${membership.id}`
    };
}
function compareMemberships(left, right) {
    return (membershipStatusSort(left.status) - membershipStatusSort(right.status) ||
        Date.parse(right.startsAt) - Date.parse(left.startsAt) ||
        left.planName.localeCompare(right.planName));
}
function membershipStatusSort(status) {
    return {
        [MembershipStatus.Active]: 0,
        [MembershipStatus.Trialing]: 1,
        [MembershipStatus.PastDue]: 2,
        [MembershipStatus.Paused]: 3,
        [MembershipStatus.Canceled]: 4,
        [MembershipStatus.Expired]: 5
    }[status];
}
function membershipStatusLabel(status) {
    return {
        [MembershipStatus.Active]: "Active",
        [MembershipStatus.Trialing]: "Trialing",
        [MembershipStatus.PastDue]: "Past due",
        [MembershipStatus.Paused]: "Paused",
        [MembershipStatus.Canceled]: "Canceled",
        [MembershipStatus.Expired]: "Expired"
    }[status];
}
function isArchived(member) {
    return member.status === MemberStatus.Archived || Boolean(member.archivedAt);
}
function memberName(member) {
    return (`${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id);
}
function buildInitials(member) {
    const letters = [member.firstName, member.lastName]
        .map((value) => value.trim().charAt(0))
        .filter(Boolean);
    if (letters.length > 0) {
        return letters.join("").toUpperCase();
    }
    return (member.email?.charAt(0) ?? "?").toUpperCase();
}
//# sourceMappingURL=profile.js.map