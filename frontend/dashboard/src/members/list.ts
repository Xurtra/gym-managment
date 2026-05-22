import { MemberStatus, Permission } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";
import { matchesMemberDirectoryQuery } from "./search.js";
import { consumerSegmentLabel, consumerSegments } from "./segments.js";
import {
  buildMemberStatusBadge,
  memberStatusLabel,
  type MemberStatusBadge
} from "./statusBadges.js";
import type { MemberView } from "./types.js";

export interface MemberListFilters {
  query?: string;
  status?: MemberStatus;
  tagName?: string;
}

export interface MemberListStatusFilterOption {
  value: MemberStatus;
  label: string;
  selected: boolean;
}

export interface MemberListTagFilterOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface MemberListAction {
  key: "view" | "edit" | "check_in" | "archive";
  button: ButtonModel;
  href?: string;
}

export interface MemberListRow extends MemberView {
  fullName: string;
  initials: string;
  contactLabel: string;
  statusLabel: string;
  segmentLabel: string;
  statusBadge: MemberStatusBadge;
  tagLabel: string;
  active: boolean;
  detailHref: string;
  actions: MemberListAction[];
}

export interface MemberListSummary {
  totalCount: number;
  leadCount: number;
  customerCount: number;
  memberCount: number;
  trialCount: number;
  activeCount: number;
  pastDueCount: number;
  frozenCount: number;
  cancelledCount: number;
  expiredCount: number;
  archivedCount: number;
  visibleCount: number;
}

export interface MemberListPage {
  screen: "member_list" | "consumer_list";
  filters: Required<Pick<MemberListFilters, "query">> & Omit<MemberListFilters, "query">;
  searchField: InputModel;
  statusOptions: MemberListStatusFilterOption[];
  tagOptions: MemberListTagFilterOption[];
  summary: MemberListSummary;
  summaryLabel: string;
  rowCount: number;
  activeFilterCount: number;
  statusOptionCount: number;
  tagOptionCount: number;
  rows: MemberListRow[];
  table: TableModel<MemberListRow>;
  empty?: EmptyStateModel;
  createMemberAction: ButtonModel;
  importMembersAction: ButtonModel;
}

export function buildMemberListPage(inputModel: {
  members: MemberView[];
  permissions: string[];
  filters?: MemberListFilters;
  surface?: "member" | "consumer";
  detailBasePath?: string;
  editBasePath?: string;
}): MemberListPage {
  const query = normalizeText(inputModel.filters?.query).toLowerCase();
  const filters: MemberListPage["filters"] = {
    query,
    ...(inputModel.filters?.status ? { status: inputModel.filters.status } : {}),
    ...(inputModel.filters?.tagName ? { tagName: normalizeText(inputModel.filters.tagName) } : {})
  };
  const surface = inputModel.surface ?? "member";
  const surfaceLabel = surface === "consumer" ? "consumer" : "member";
  const detailBasePath = inputModel.detailBasePath ?? "/members";
  const editBasePath = inputModel.editBasePath ?? detailBasePath;
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
    .map((member) => buildMemberListRow(member, canWriteMembers, detailBasePath, editBasePath));
  const empty =
    rows.length === 0
      ? emptyState({
          title: hasActiveFilters(filters)
            ? `No ${surfaceLabel}s match your filters`
            : `No ${surfaceLabel}s`,
          body: hasActiveFilters(filters)
            ? `Adjust the ${surfaceLabel} filters and try again.`
            : `Create or import ${surfaceLabel}s to start managing profiles.`
        })
      : undefined;

  return {
    screen: surface === "consumer" ? "consumer_list" : "member_list",
    filters,
    searchField: input({
      name: `${surfaceLabel}Search`,
      label: `Search ${surfaceLabel}s`,
      value: query,
      type: "text",
      required: false
    }),
    statusOptions,
    tagOptions: tagFilterOptions,
    summary: buildSummary(inputModel.members, rows.length),
    summaryLabel: `Showing ${rows.length} of ${inputModel.members.length} ${surfaceLabel}s`,
    rowCount: rows.length,
    activeFilterCount: countActiveFilters(filters),
    statusOptionCount: statusOptions.length,
    tagOptionCount: tagFilterOptions.length,
    rows,
    table: table({
      columns: [
        { key: "fullName", label: "Name" },
        { key: "contactLabel", label: "Contact" },
        { key: "segmentLabel", label: "Segments" },
        { key: "statusLabel", label: "Status" },
        { key: "tagLabel", label: "Tags" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    createMemberAction: button({
      label: `Create ${surfaceLabel}`,
      icon: "user-plus",
      disabled: !canWriteMembers
    }),
    importMembersAction: button({
      label: `Import ${surfaceLabel}s`,
      icon: "upload",
      intent: "secondary",
      disabled: !canWriteMembers
    })
  };
}

function buildMemberListRow(
  member: MemberView,
  canWriteMembers: boolean,
  detailBasePath: string,
  editBasePath: string
): MemberListRow {
  const fullName = memberName(member);
  const archived = member.status === MemberStatus.Archived || Boolean(member.archivedAt);
  const detailHref = `${detailBasePath}/${member.id}`;
  const editHref = `${editBasePath}/${member.id}/edit`;
  return {
    ...member,
    fullName,
    initials: buildInitials(member.firstName, member.lastName, member.email),
    contactLabel: contactLabel(member),
    statusLabel: memberStatusLabel(member.status),
    segmentLabel: segmentLabel(member),
    statusBadge: buildMemberStatusBadge(member.status),
    tagLabel: member.tagNames.length > 0 ? member.tagNames.join(", ") : "No tags",
    active: member.status === MemberStatus.Active,
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

function matchesFilters(member: MemberView, filters: MemberListPage["filters"]) {
  if (filters.status && member.status !== filters.status) {
    return false;
  }
  if (
    filters.tagName &&
    !member.tagNames.some((tag) => tag.toLowerCase() === filters.tagName?.toLowerCase())
  ) {
    return false;
  }
  if (!filters.query) {
    return true;
  }
  return matchesMemberDirectoryQuery(member, filters.query);
}

function compareMembers(left: MemberView, right: MemberView) {
  return (
    statusSort(left.status) - statusSort(right.status) ||
    memberName(left).localeCompare(memberName(right)) ||
    left.id.localeCompare(right.id)
  );
}

function buildSummary(members: MemberView[], visibleCount: number): MemberListSummary {
  return {
    totalCount: members.length,
    leadCount: members.filter((member) => consumerSegments(member).includes("lead")).length,
    customerCount: members.filter((member) => consumerSegments(member).includes("customer")).length,
    memberCount: members.filter((member) => consumerSegments(member).includes("member")).length,
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

function segmentLabel(member: MemberView) {
  const segments = consumerSegments(member);
  return segments.length > 0 ? segments.map(consumerSegmentLabel).join(", ") : "Unsegmented";
}

function tagOptions(members: MemberView[], selectedTag: string | undefined) {
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

function countByStatus(members: MemberView[], status: MemberStatus) {
  return members.filter((member) => member.status === status).length;
}

function memberName(member: MemberView) {
  return (
    `${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id
  );
}

function contactLabel(member: MemberView) {
  return member.email ?? member.phone ?? member.barcode ?? "No contact";
}

function buildInitials(firstName: string, lastName: string, fallback?: string) {
  const letters = [firstName, lastName].map((value) => value.trim().charAt(0)).filter(Boolean);
  if (letters.length > 0) {
    return letters.join("").toUpperCase();
  }
  return (fallback?.charAt(0) ?? "?").toUpperCase();
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

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function hasActiveFilters(filters: MemberListPage["filters"]) {
  return Boolean(filters.query || filters.status || filters.tagName);
}

function countActiveFilters(filters: MemberListPage["filters"]) {
  return [filters.query, filters.status, filters.tagName].filter(Boolean).length;
}
