export function buildMemberSearchScreen(members, query, selectedMemberId) {
    const normalizedQuery = normalize(query);
    const results = normalizedQuery
        ? members.filter((member) => matchesMember(member, normalizedQuery)).slice(0, 25)
        : members.slice(0, 25);
    const selectedMember = selectedMemberId
        ? members.find((member) => member.id === selectedMemberId)
        : undefined;
    return {
        query,
        results,
        ...(selectedMember ? { selectedMember } : {}),
        emptyState: results.length === 0
    };
}
function matchesMember(member, normalizedQuery) {
    return searchableText(member).includes(normalizedQuery);
}
function searchableText(member) {
    return normalize([member.firstName, member.lastName, member.email, member.phone, member.barcode].filter(Boolean).join(" "));
}
function normalize(value) {
    return value.trim().toLowerCase();
}
//# sourceMappingURL=search.js.map