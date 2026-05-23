import { isLeadConsumer } from "../members/segments.js";
import { buildMemberStatusBadge, type MemberStatusBadge } from "../members/statusBadges.js";
import {
  findMemberDirectorySearchFields,
  type MemberSearchField
} from "../members/search.js";
import type { MemberView } from "../members/types.js";

export interface LeadDirectorySearchResult extends MemberView {
  fullName: string;
  statusBadge: MemberStatusBadge;
  matchedFields: MemberSearchField[];
  matchSummary: string;
  detailHref: string;
}

export interface LeadDirectorySearchScreen {
  screen: "lead_directory_search";
  query: string;
  results: LeadDirectorySearchResult[];
  selectedLead?: LeadDirectorySearchResult;
  searchableFields: MemberSearchField[];
  resultCount: number;
  searchableFieldCount: number;
  selectedLeadId?: string;
  summaryLabel: string;
  emptyState: boolean;
}

const SEARCHABLE_FIELDS: MemberSearchField[] = ["name", "email", "phone", "barcode"];

export function buildLeadDirectorySearchScreen(
  members: MemberView[],
  query: string,
  selectedLeadId?: string
): LeadDirectorySearchScreen {
  const normalizedQuery = normalizeSearchText(query);
  const results = resultsForQuery(members, query);
  const selectedLead = selectedLeadId ? results.find((lead) => lead.id === selectedLeadId) : undefined;

  return {
    screen: "lead_directory_search",
    query,
    results,
    ...(selectedLead ? { selectedLead } : {}),
    searchableFields: SEARCHABLE_FIELDS,
    resultCount: results.length,
    searchableFieldCount: SEARCHABLE_FIELDS.length,
    ...(selectedLead ? { selectedLeadId: selectedLead.id } : {}),
    summaryLabel: buildSummaryLabel(results.length, normalizedQuery),
    emptyState: results.length === 0
  };
}

function buildLeadSearchResult(
  lead: MemberView,
  normalizedQuery: string
): LeadDirectorySearchResult {
  const matchedFields = normalizedQuery
    ? findMemberDirectorySearchFields(lead, normalizedQuery)
    : [];

  return {
    ...lead,
    fullName: memberName(lead),
    statusBadge: buildMemberStatusBadge(lead.status),
    matchedFields,
    matchSummary: matchedFields.length > 0 ? matchedFieldSummary(matchedFields) : "Browse leads",
    detailHref: `/leads/${lead.id}`
  };
}

function resultsForQuery(members: MemberView[], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const leads = members.filter(isLeadConsumer);

  return (
    normalizedQuery
      ? leads.filter((lead) => findMemberDirectorySearchFields(lead, normalizedQuery).length > 0)
      : leads
  )
    .map((lead) => buildLeadSearchResult(lead, normalizedQuery))
    .sort(compareResults)
    .slice(0, 25);
}

function compareResults(left: LeadDirectorySearchResult, right: LeadDirectorySearchResult) {
  return (
    right.matchedFields.length - left.matchedFields.length ||
    left.fullName.localeCompare(right.fullName) ||
    left.id.localeCompare(right.id)
  );
}

function matchedFieldSummary(fields: MemberSearchField[]) {
  return `Matched on ${fields.join(", ")}`;
}

function memberName(lead: MemberView) {
  return `${lead.firstName} ${lead.lastName}`.trim() || lead.email || lead.phone || lead.id;
}

function normalizeSearchText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildSummaryLabel(resultCount: number, normalizedQuery: string) {
  if (!normalizedQuery) {
    return `Browsing ${resultCount} lead${resultCount === 1 ? "" : "s"}`;
  }
  return `Found ${resultCount} lead${resultCount === 1 ? "" : "s"}`;
}
