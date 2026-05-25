import { Permission } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";
import { matchesMemberDirectoryQuery } from "../members/search.js";
import { isLeadConsumer } from "../members/segments.js";
import { buildMemberStatusBadge, type MemberStatusBadge } from "../members/statusBadges.js";
import type { MemberView } from "../members/types.js";
import {
  buildInterestLevelBadge,
  buildLeadSourceLabel,
  type GrowthBadge
} from "./statusBadges.js";

export interface GrowthLeadListFilters {
  query?: string;
  interestLevel?: string;
  leadSource?: string;
  assignedStaffId?: string;
}

export interface GrowthLeadListTagFilterOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface GrowthLeadListRow extends MemberView {
  fullName: string;
  initials: string;
  contactLabel: string;
  leadSourceLabel: string;
  interestBadge?: GrowthBadge;
  statusBadge: MemberStatusBadge;
  nextFollowUpLabel: string;
  assignedStaffName?: string;
  detailHref: string;
  viewAction: ButtonModel;
  editAction: ButtonModel;
}

export interface GrowthLeadListPage {
  screen: "growth_lead_list";
  filters: Required<Pick<GrowthLeadListFilters, "query">> & Omit<GrowthLeadListFilters, "query">;
  searchField: InputModel;
  totalLeadCount: number;
  visibleLeadCount: number;
  rows: GrowthLeadListRow[];
  table: TableModel<GrowthLeadListRow>;
  empty?: EmptyStateModel;
  createLeadAction: ButtonModel;
  importLeadsAction: ButtonModel;
}

export function buildGrowthLeadListPage(inputModel: {
  members: MemberView[];
  permissions: string[];
  filters?: GrowthLeadListFilters;
  detailBasePath?: string;
  editBasePath?: string;
}): GrowthLeadListPage {
  const query = normalizeText(inputModel.filters?.query).toLowerCase();
  const filters: GrowthLeadListPage["filters"] = {
    query,
    ...(inputModel.filters?.interestLevel ? { interestLevel: inputModel.filters.interestLevel } : {}),
    ...(inputModel.filters?.leadSource ? { leadSource: inputModel.filters.leadSource } : {}),
    ...(inputModel.filters?.assignedStaffId
      ? { assignedStaffId: inputModel.filters.assignedStaffId }
      : {})
  };

  const canWrite = inputModel.permissions.includes(Permission.GrowthWrite);
  const detailBasePath = inputModel.detailBasePath ?? "/growth/leads";
  const editBasePath = inputModel.editBasePath ?? "/members";

  const leads = inputModel.members.filter(isLeadConsumer);
  const rows = leads
    .filter((member) => matchesGrowthFilters(member, filters))
    .sort(compareLeads)
    .map((member) =>
      buildGrowthLeadListRow(member, canWrite, detailBasePath, editBasePath)
    );

  const empty =
    rows.length === 0
      ? emptyState({
          title: hasActiveFilters(filters) ? "No leads match your filters" : "No leads",
          body: hasActiveFilters(filters)
            ? "Adjust the filters and try again."
            : "Create leads or import a CSV to get started."
        })
      : undefined;

  return {
    screen: "growth_lead_list",
    filters,
    searchField: input({
      name: "growthLeadSearch",
      label: "Search leads",
      value: query,
      type: "text",
      required: false
    }),
    totalLeadCount: leads.length,
    visibleLeadCount: rows.length,
    rows,
    table: table({
      columns: [
        { key: "fullName", label: "Lead" },
        { key: "contactLabel", label: "Contact" },
        { key: "leadSourceLabel", label: "Source" },
        { key: "nextFollowUpLabel", label: "Next Follow-Up" },
        { key: "assignedStaffName", label: "Assigned To" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    createLeadAction: button({
      label: "Create lead",
      icon: "user-plus",
      disabled: !canWrite
    }),
    importLeadsAction: button({
      label: "Import leads",
      icon: "upload",
      disabled: !canWrite
    })
  };
}

function buildGrowthLeadListRow(
  member: MemberView,
  canWrite: boolean,
  detailBasePath: string,
  editBasePath: string
): GrowthLeadListRow {
  const detailHref = `${detailBasePath}/${member.id}`;
  const editHref = `${editBasePath}/${member.id}/edit`;
  const followUpDate = member.nextFollowUpAt ? new Date(member.nextFollowUpAt) : undefined;
  const interestBadge = buildInterestLevelBadge(member.interestLevel);

  return {
    ...member,
    fullName: memberName(member),
    initials: buildInitials(member),
    contactLabel: member.email ?? member.phone ?? "No contact",
    leadSourceLabel: buildLeadSourceLabel(member.leadSource),
    ...(interestBadge ? { interestBadge } : {}),
    statusBadge: buildMemberStatusBadge(member.status),
    nextFollowUpLabel: followUpDate ? formatDate(followUpDate) : "Not scheduled",
    ...(member.assignedStaffName ? { assignedStaffName: member.assignedStaffName } : {}),
    detailHref,
    viewAction: button({ label: "View", icon: "eye", intent: "secondary", size: "sm" }),
    editAction: button({
      label: "Edit",
      icon: "pencil",
      intent: "secondary",
      size: "sm",
      disabled: !canWrite
    })
  };
}

function matchesGrowthFilters(
  member: MemberView,
  filters: GrowthLeadListPage["filters"]
): boolean {
  if (filters.interestLevel && member.interestLevel !== filters.interestLevel) return false;
  if (filters.leadSource && member.leadSource !== filters.leadSource) return false;
  if (filters.assignedStaffId && member.assignedStaffId !== filters.assignedStaffId) return false;
  if (!filters.query) return true;
  return matchesMemberDirectoryQuery(member, filters.query);
}

function compareLeads(a: MemberView, b: MemberView) {
  return (
    memberName(a).localeCompare(memberName(b)) ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

function memberName(member: MemberView) {
  return (
    `${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id
  );
}

function buildInitials(member: MemberView) {
  const letters = [member.firstName, member.lastName]
    .map((v) => v.trim().charAt(0))
    .filter(Boolean);
  if (letters.length > 0) return letters.join("").toUpperCase();
  return (member.email?.charAt(0) ?? "?").toUpperCase();
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function hasActiveFilters(filters: GrowthLeadListPage["filters"]) {
  return Boolean(filters.query || filters.interestLevel || filters.leadSource || filters.assignedStaffId);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
