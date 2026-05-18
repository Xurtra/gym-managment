import type { MemberSearchResult } from "./types.js";

export interface MemberSearchScreen {
  query: string;
  results: MemberSearchResult[];
  selectedMember?: MemberSearchResult;
  emptyState: boolean;
}

export function buildMemberSearchScreen(
  members: MemberSearchResult[],
  query: string,
  selectedMemberId?: string
): MemberSearchScreen {
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

function matchesMember(member: MemberSearchResult, normalizedQuery: string) {
  return searchableText(member).includes(normalizedQuery);
}

function searchableText(member: MemberSearchResult) {
  return normalize(
    [member.firstName, member.lastName, member.email, member.phone, member.barcode].filter(Boolean).join(" ")
  );
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
