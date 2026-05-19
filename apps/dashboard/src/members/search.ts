import { MemberStatus } from "@gym-platform/constants";
import { buildMemberStatusBadge, type MemberStatusBadge } from "./statusBadges.js";
import type { MemberView } from "./types.js";

export type MemberSearchField = "name" | "email" | "phone" | "barcode";

export interface MemberDirectorySearchResult extends MemberView {
  fullName: string;
  statusBadge: MemberStatusBadge;
  matchedFields: MemberSearchField[];
  matchSummary: string;
  detailHref: string;
}

export interface MemberDirectorySearchScreen {
  screen: "member_directory_search";
  query: string;
  results: MemberDirectorySearchResult[];
  selectedMember?: MemberDirectorySearchResult;
  searchableFields: MemberSearchField[];
  resultCount: number;
  searchableFieldCount: number;
  selectedMemberId?: string;
  summaryLabel: string;
  emptyState: boolean;
}

const SEARCHABLE_FIELDS: MemberSearchField[] = ["name", "email", "phone", "barcode"];

export function buildMemberDirectorySearchScreen(
  members: MemberView[],
  query: string,
  selectedMemberId?: string
): MemberDirectorySearchScreen {
  const normalizedQuery = normalizeSearchText(query);
  const results = resultsForQuery(members, query);
  const selectedMember = selectedMemberId
    ? results.find((member) => member.id === selectedMemberId)
    : undefined;

  return {
    screen: "member_directory_search",
    query,
    results,
    ...(selectedMember ? { selectedMember } : {}),
    searchableFields: SEARCHABLE_FIELDS,
    resultCount: results.length,
    searchableFieldCount: SEARCHABLE_FIELDS.length,
    ...(selectedMember ? { selectedMemberId: selectedMember.id } : {}),
    summaryLabel: buildSummaryLabel(results.length, normalizedQuery),
    emptyState: results.length === 0
  };
}

export function matchesMemberDirectoryQuery(member: MemberView, query: string) {
  return findMemberDirectorySearchFields(member, query).length > 0;
}

export function findMemberDirectorySearchFields(
  member: MemberView,
  query: string
): MemberSearchField[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  const matchingFields: MemberSearchField[] = [];
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

function buildMemberSearchResult(
  member: MemberView,
  normalizedQuery: string
): MemberDirectorySearchResult {
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

function compareResults(left: MemberDirectorySearchResult, right: MemberDirectorySearchResult) {
  return (
    right.matchedFields.length - left.matchedFields.length ||
    statusSort(left.status) - statusSort(right.status) ||
    left.fullName.localeCompare(right.fullName) ||
    left.id.localeCompare(right.id)
  );
}

function matchedFieldSummary(fields: MemberSearchField[]) {
  return `Matched on ${fields.map(fieldLabel).join(", ")}`;
}

function fieldLabel(field: MemberSearchField) {
  return {
    name: "name",
    email: "email",
    phone: "phone",
    barcode: "barcode"
  }[field];
}

function statusSort(status: MemberStatus) {
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

function memberName(member: MemberView) {
  return (
    `${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id
  );
}

function normalizeSearchText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizePhone(value: string | undefined) {
  return value?.replace(/\D+/g, "") ?? "";
}

function resultsForQuery(members: MemberView[], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return (
    normalizedQuery
      ? members.filter((member) => matchesMemberDirectoryQuery(member, query))
      : members
  )
    .map((member) => buildMemberSearchResult(member, normalizedQuery))
    .sort(compareResults)
    .slice(0, 25);
}

function buildSummaryLabel(resultCount: number, normalizedQuery: string) {
  if (!normalizedQuery) {
    return `Browsing ${resultCount} member${resultCount === 1 ? "" : "s"}`;
  }
  return `Found ${resultCount} member${resultCount === 1 ? "" : "s"}`;
}
