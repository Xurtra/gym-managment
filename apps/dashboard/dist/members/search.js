import { MemberStatus } from "@gym-platform/constants";
import { buildMemberStatusBadge } from "./statusBadges.js";
const SEARCHABLE_FIELDS = ["name", "email", "phone", "barcode"];
export function buildMemberDirectorySearchScreen(members, query, selectedMemberId) {
    const normalizedQuery = normalizeSearchText(query);
    const results = (normalizedQuery
        ? members.filter((member) => matchesMemberDirectoryQuery(member, query))
        : members)
        .map((member) => buildMemberSearchResult(member, normalizedQuery))
        .sort(compareResults)
        .slice(0, 25);
    const selectedMember = selectedMemberId
        ? results.find((member) => member.id === selectedMemberId)
        : undefined;
    return {
        screen: "member_directory_search",
        query,
        results,
        ...(selectedMember ? { selectedMember } : {}),
        searchableFields: SEARCHABLE_FIELDS,
        emptyState: results.length === 0
    };
}
export function matchesMemberDirectoryQuery(member, query) {
    return findMemberDirectorySearchFields(member, query).length > 0;
}
export function findMemberDirectorySearchFields(member, query) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
        return [];
    }
    const matchingFields = [];
    const phoneQuery = normalizePhone(query);
    if (memberName(member).toLowerCase().includes(normalizedQuery)) {
        matchingFields.push("name");
    }
    if (member.email?.trim().toLowerCase().includes(normalizedQuery)) {
        matchingFields.push("email");
    }
    if (phoneQuery && normalizePhone(member.phone).includes(phoneQuery)) {
        matchingFields.push("phone");
    }
    if (member.barcode?.trim().toLowerCase().includes(normalizedQuery)) {
        matchingFields.push("barcode");
    }
    return matchingFields;
}
function buildMemberSearchResult(member, normalizedQuery) {
    const matchedFields = normalizedQuery
        ? findMemberDirectorySearchFields(member, normalizedQuery)
        : [];
    return {
        ...member,
        fullName: memberName(member),
        statusBadge: buildMemberStatusBadge(member.status),
        matchedFields,
        matchSummary: matchedFields.length > 0 ? matchedFieldSummary(matchedFields) : "Browse members",
        detailHref: `/members/${member.id}`
    };
}
function compareResults(left, right) {
    return (right.matchedFields.length - left.matchedFields.length ||
        statusSort(left.status) - statusSort(right.status) ||
        left.fullName.localeCompare(right.fullName) ||
        left.id.localeCompare(right.id));
}
function matchedFieldSummary(fields) {
    return `Matched on ${fields.map(fieldLabel).join(", ")}`;
}
function fieldLabel(field) {
    return {
        name: "name",
        email: "email",
        phone: "phone",
        barcode: "barcode"
    }[field];
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
function memberName(member) {
    return (`${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id);
}
function normalizeSearchText(value) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
}
function normalizePhone(value) {
    return value?.replace(/\D+/g, "") ?? "";
}
//# sourceMappingURL=search.js.map