import { Permission } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";
import { matchesMemberDirectoryQuery } from "../members/search.js";
import { isLeadConsumer } from "../members/segments.js";
import { buildMemberStatusBadge, type MemberStatusBadge } from "../members/statusBadges.js";
import type { MemberView } from "../members/types.js";

export interface LeadListFilters {
  query?: string;
  tagName?: string;
}

export interface LeadListTagFilterOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface LeadListAction {
  key: "view" | "edit";
  button: ButtonModel;
  href: string;
}

export interface LeadListRow extends MemberView {
  fullName: string;
  initials: string;
  contactLabel: string;
  tagLabel: string;
  statusBadge: MemberStatusBadge;
  detailHref: string;
  actions: LeadListAction[];
}

export interface LeadListPage {
  screen: "lead_list";
  filters: Required<Pick<LeadListFilters, "query">> & Omit<LeadListFilters, "query">;
  searchField: InputModel;
  tagOptions: LeadListTagFilterOption[];
  totalLeadCount: number;
  visibleLeadCount: number;
  rowCount: number;
  activeFilterCount: number;
  tagOptionCount: number;
  summaryLabel: string;
  rows: LeadListRow[];
  table: TableModel<LeadListRow>;
  empty?: EmptyStateModel;
  createLeadAction: ButtonModel;
}

export function buildLeadListPage(inputModel: {
  members: MemberView[];
  permissions: string[];
  filters?: LeadListFilters;
  detailBasePath?: string;
  editBasePath?: string;
}): LeadListPage {
  const query = normalizeText(inputModel.filters?.query).toLowerCase();
  const filters: LeadListPage["filters"] = {
    query,
    ...(inputModel.filters?.tagName ? { tagName: normalizeText(inputModel.filters.tagName) } : {})
  };
  const leads = inputModel.members.filter(isLeadConsumer);
  const canWriteMembers = inputModel.permissions.includes(Permission.MemberWrite);
  const detailBasePath = inputModel.detailBasePath ?? "/leads";
  const editBasePath = inputModel.editBasePath ?? "/members";
  const tagOptions = buildTagOptions(leads, filters.tagName);
  const rows = leads
    .filter((member) => matchesFilters(member, filters))
    .sort(compareLeads)
    .map((member) => buildLeadListRow(member, canWriteMembers, detailBasePath, editBasePath));
  const empty =
    rows.length === 0
      ? emptyState({
          title: hasActiveFilters(filters) ? "No leads match your filters" : "No leads",
          body: hasActiveFilters(filters)
            ? "Adjust the lead filters and try again."
            : "Create leads to start tracking prospective members."
        })
      : undefined;

  return {
    screen: "lead_list",
    filters,
    searchField: input({
      name: "leadSearch",
      label: "Search leads",
      value: query,
      type: "text",
      required: false
    }),
    tagOptions,
    totalLeadCount: leads.length,
    visibleLeadCount: rows.length,
    rowCount: rows.length,
    activeFilterCount: countActiveFilters(filters),
    tagOptionCount: tagOptions.length,
    summaryLabel: `Showing ${rows.length} of ${leads.length} lead${leads.length === 1 ? "" : "s"}`,
    rows,
    table: table({
      columns: [
        { key: "fullName", label: "Lead" },
        { key: "contactLabel", label: "Contact" },
        { key: "tagLabel", label: "Tags" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    createLeadAction: button({
      label: "Create lead",
      icon: "user-plus",
      disabled: !canWriteMembers
    })
  };
}

function matchesFilters(member: MemberView, filters: LeadListPage["filters"]) {
  if (
    filters.tagName &&
    !member.tagNames.some((tag) => normalizeText(tag).toLowerCase() === filters.tagName?.toLowerCase())
  ) {
    return false;
  }
  if (!filters.query) {
    return true;
  }
  return matchesMemberDirectoryQuery(member, filters.query);
}

function buildLeadListRow(
  member: MemberView,
  canWriteMembers: boolean,
  detailBasePath: string,
  editBasePath: string
): LeadListRow {
  const detailHref = `${detailBasePath}/${member.id}`;
  const editHref = `${editBasePath}/${member.id}/edit`;
  return {
    ...member,
    fullName: memberName(member),
    initials: buildInitials(member),
    contactLabel: member.email ?? member.phone ?? "No contact",
    tagLabel: member.tagNames.length > 0 ? member.tagNames.join(", ") : "No tags",
    statusBadge: buildMemberStatusBadge(member.status),
    detailHref,
    actions: [
      {
        key: "view",
        href: detailHref,
        button: button({ label: "View", icon: "eye", intent: "secondary" })
      },
      {
        key: "edit",
        href: editHref,
        button: button({
          label: "Edit",
          icon: "pencil",
          intent: "secondary",
          disabled: !canWriteMembers
        })
      }
    ]
  };
}

function compareLeads(left: MemberView, right: MemberView) {
  return (
    memberName(left).localeCompare(memberName(right)) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  );
}

function memberName(member: MemberView) {
  return (
    `${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id
  );
}

function buildInitials(member: MemberView) {
  const letters = [member.firstName, member.lastName]
    .map((value) => value.trim().charAt(0))
    .filter(Boolean);
  if (letters.length > 0) {
    return letters.join("").toUpperCase();
  }
  return (member.email?.charAt(0) ?? "?").toUpperCase();
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function buildTagOptions(leads: MemberView[], selectedTag: string | undefined) {
  return [...new Set(leads.flatMap((lead) => lead.tagNames.map(normalizeText)).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
    .map((tag) => ({
      value: tag,
      label: tag,
      selected: tag.toLowerCase() === selectedTag?.toLowerCase()
    }));
}

function hasActiveFilters(filters: LeadListPage["filters"]) {
  return Boolean(filters.query || filters.tagName);
}

function countActiveFilters(filters: LeadListPage["filters"]) {
  return [filters.query, filters.tagName].filter(Boolean).length;
}
