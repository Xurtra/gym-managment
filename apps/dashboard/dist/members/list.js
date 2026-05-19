import { MemberStatus, Permission } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
import { matchesMemberDirectoryQuery } from "./search.js";
import { buildMemberStatusBadge, memberStatusLabel } from "./statusBadges.js";
export function buildMemberListPage(inputModel) {
    const query = normalizeText(inputModel.filters?.query).toLowerCase();
    const filters = {
        query,
        ...(inputModel.filters?.status ? { status: inputModel.filters.status } : {}),
        ...(inputModel.filters?.tagName ? { tagName: normalizeText(inputModel.filters.tagName) } : {})
    };
    const canWriteMembers = inputModel.permissions.includes(Permission.MemberWrite);
    const statusOptions = Object.values(MemberStatus).map((status) => ({
        value: status,
        label: memberStatusLabel(status),
        selected: status === filters.status
    }));
    const tagFilterOptions = tagOptions(inputModel.members, filters.tagName);
    const rows = inputModel.members
        .filter((member) => matchesFilters(member, filters))
        .sort(compareMembers)
        .map((member) => buildMemberListRow(member, canWriteMembers));
    const empty = rows.length === 0
        ? emptyState({
            title: hasActiveFilters(filters) ? "No members match your filters" : "No members",
            body: hasActiveFilters(filters)
                ? "Adjust the member filters and try again."
                : "Create or import members to start managing member profiles."
        })
        : undefined;
    return {
        screen: "member_list",
        filters,
        searchField: input({
            name: "memberSearch",
            label: "Search members",
            value: query,
            type: "text",
            required: false
        }),
        statusOptions,
        tagOptions: tagFilterOptions,
        summary: buildSummary(inputModel.members, rows.length),
        summaryLabel: `Showing ${rows.length} of ${inputModel.members.length} members`,
        rowCount: rows.length,
        activeFilterCount: countActiveFilters(filters),
        statusOptionCount: statusOptions.length,
        tagOptionCount: tagFilterOptions.length,
        rows,
        table: table({
            columns: [
                { key: "fullName", label: "Name" },
                { key: "contactLabel", label: "Contact" },
                { key: "statusLabel", label: "Status" },
                { key: "tagLabel", label: "Tags" }
            ],
            rows,
            ...(empty ? { empty } : {})
        }),
        ...(empty ? { empty } : {}),
        createMemberAction: button({
            label: "Create member",
            icon: "user-plus",
            disabled: !canWriteMembers
        }),
        importMembersAction: button({
            label: "Import members",
            icon: "upload",
            intent: "secondary",
            disabled: !canWriteMembers
        })
    };
}
function buildMemberListRow(member, canWriteMembers) {
    const fullName = memberName(member);
    const archived = member.status === MemberStatus.Archived || Boolean(member.archivedAt);
    return {
        ...member,
        fullName,
        initials: buildInitials(member.firstName, member.lastName, member.email),
        contactLabel: contactLabel(member),
        statusLabel: memberStatusLabel(member.status),
        statusBadge: buildMemberStatusBadge(member.status),
        tagLabel: member.tagNames.length > 0 ? member.tagNames.join(", ") : "No tags",
        active: member.status === MemberStatus.Active,
        detailHref: `/members/${member.id}`,
        actions: [
            {
                key: "view",
                href: `/members/${member.id}`,
                button: button({ label: "View", icon: "eye", intent: "secondary" })
            },
            {
                key: "edit",
                href: `/members/${member.id}/edit`,
                button: button({
                    label: "Edit",
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
        ]
    };
}
function matchesFilters(member, filters) {
    if (filters.status && member.status !== filters.status) {
        return false;
    }
    if (filters.tagName &&
        !member.tagNames.some((tag) => tag.toLowerCase() === filters.tagName?.toLowerCase())) {
        return false;
    }
    if (!filters.query) {
        return true;
    }
    return matchesMemberDirectoryQuery(member, filters.query);
}
function compareMembers(left, right) {
    return (statusSort(left.status) - statusSort(right.status) ||
        memberName(left).localeCompare(memberName(right)) ||
        left.id.localeCompare(right.id));
}
function buildSummary(members, visibleCount) {
    return {
        totalCount: members.length,
        leadCount: countByStatus(members, MemberStatus.Lead),
        trialCount: countByStatus(members, MemberStatus.Trial),
        activeCount: countByStatus(members, MemberStatus.Active),
        pastDueCount: countByStatus(members, MemberStatus.PastDue),
        frozenCount: countByStatus(members, MemberStatus.Frozen),
        cancelledCount: countByStatus(members, MemberStatus.Cancelled),
        expiredCount: countByStatus(members, MemberStatus.Expired),
        archivedCount: countByStatus(members, MemberStatus.Archived),
        visibleCount
    };
}
function tagOptions(members, selectedTag) {
    return [
        ...new Set(members.flatMap((member) => member.tagNames.map(normalizeText)).filter(Boolean))
    ]
        .sort((left, right) => left.localeCompare(right))
        .map((tag) => ({
        value: tag,
        label: tag,
        selected: tag.toLowerCase() === selectedTag?.toLowerCase()
    }));
}
function countByStatus(members, status) {
    return members.filter((member) => member.status === status).length;
}
function memberName(member) {
    return (`${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id);
}
function contactLabel(member) {
    return member.email ?? member.phone ?? member.barcode ?? "No contact";
}
function buildInitials(firstName, lastName, fallback) {
    const letters = [firstName, lastName].map((value) => value.trim().charAt(0)).filter(Boolean);
    if (letters.length > 0) {
        return letters.join("").toUpperCase();
    }
    return (fallback?.charAt(0) ?? "?").toUpperCase();
}
function statusSort(status) {
    return {
        [MemberStatus.Active]: 0,
        [MemberStatus.Trial]: 1,
        [MemberStatus.Lead]: 2,
        [MemberStatus.PastDue]: 3,
        [MemberStatus.Frozen]: 4,
        [MemberStatus.Cancelled]: 5,
        [MemberStatus.Expired]: 6,
        [MemberStatus.Archived]: 7
    }[status];
}
function normalizeText(value) {
    return value?.trim().replace(/\s+/g, " ") ?? "";
}
function hasActiveFilters(filters) {
    return Boolean(filters.query || filters.status || filters.tagName);
}
function countActiveFilters(filters) {
    return [filters.query, filters.status, filters.tagName].filter(Boolean).length;
}
//# sourceMappingURL=list.js.map