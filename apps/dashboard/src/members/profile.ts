import { MemberStatus, MembershipStatus, Permission } from "@gym-platform/constants";
import { button, emptyState } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
import {
  buildMemberContactInformationSection,
  buildMemberEmergencyContactSection,
  buildMemberNotesSection,
  type MemberContactInformationSection,
  type MemberEmergencyContactSection,
  type MemberNotesSection,
  type MemberProfileSection
} from "./profileSections.js";
import { buildMemberStatusBadge, type MemberStatusBadge } from "./statusBadges.js";
import type { MemberProfileMembershipView, MemberView } from "./types.js";

export interface MemberProfileAction {
  key: "back_to_members" | "edit" | "check_in" | "assign_plan" | "archive";
  button: ButtonModel;
  href?: string;
}

export interface MemberProfileMembershipRow extends MemberProfileMembershipView {
  statusLabel: string;
  active: boolean;
  dateRangeLabel: string;
  detailHref: string;
}

export interface MemberProfilePage {
  screen: "member_profile";
  member: MemberView;
  fullName: string;
  initials: string;
  statusLabel: string;
  statusBadge: MemberStatusBadge;
  active: boolean;
  archived: boolean;
  contactSection: MemberContactInformationSection;
  emergencyContactSection: MemberEmergencyContactSection;
  notesSection: MemberNotesSection;
  sections: MemberProfileSection[];
  sectionCount: number;
  memberships: MemberProfileMembershipRow[];
  membershipCount: number;
  membershipSummary: {
    totalCount: number;
    activeCount: number;
    trialingCount: number;
    pausedCount: number;
    cancelledCount: number;
    expiredCount: number;
  };
  membershipSummaryLabel: string;
  actions: MemberProfileAction[];
  actionCount: number;
  membershipEmpty?: EmptyStateModel;
}

export function buildMemberProfilePage(inputModel: {
  member: MemberView;
  memberships?: MemberProfileMembershipView[];
  permissions: string[];
}): MemberProfilePage {
  const canWriteMembers = inputModel.permissions.includes(Permission.MemberWrite);
  const archived = isArchived(inputModel.member);
  const statusBadge = buildMemberStatusBadge(inputModel.member.status);
  const contactSection = buildMemberContactInformationSection(inputModel.member);
  const emergencyContactSection = buildMemberEmergencyContactSection(inputModel.member);
  const notesSection = buildMemberNotesSection(inputModel.member);
  const sections = buildSections(
    inputModel.member,
    statusBadge,
    contactSection,
    emergencyContactSection,
    notesSection
  );
  const memberships = (inputModel.memberships ?? [])
    .slice()
    .sort(compareMemberships)
    .map(buildMembershipRow);
  const membershipSummary = {
    totalCount: memberships.length,
    activeCount: memberships.filter((membership) => membership.status === MembershipStatus.Active)
      .length,
    trialingCount: memberships.filter(
      (membership) => membership.status === MembershipStatus.Trialing
    ).length,
    pausedCount: memberships.filter((membership) => membership.status === MembershipStatus.Paused)
      .length,
    cancelledCount: memberships.filter(
      (membership) => membership.status === MembershipStatus.Canceled
    ).length,
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

function buildSections(
  member: MemberView,
  statusBadge: MemberStatusBadge,
  contactSection: MemberContactInformationSection,
  emergencyContactSection: MemberEmergencyContactSection,
  notesSection: MemberNotesSection
): MemberProfileSection[] {
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

function buildActions(
  member: MemberView,
  canWriteMembers: boolean,
  archived: boolean
): MemberProfileAction[] {
  const checkInDisabled =
    !canWriteMembers ||
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

function buildMembershipRow(membership: MemberProfileMembershipView): MemberProfileMembershipRow {
  return {
    ...membership,
    statusLabel: membershipStatusLabel(membership.status),
    active:
      membership.status === MembershipStatus.Active ||
      membership.status === MembershipStatus.Trialing,
    dateRangeLabel: membership.endsAt
      ? `${membership.startsAt} to ${membership.endsAt}`
      : `${membership.startsAt} to ongoing`,
    detailHref: `/members/${membership.memberId}/memberships/${membership.id}`
  };
}

function compareMemberships(left: MemberProfileMembershipView, right: MemberProfileMembershipView) {
  return (
    membershipStatusSort(left.status) - membershipStatusSort(right.status) ||
    Date.parse(right.startsAt) - Date.parse(left.startsAt) ||
    left.planName.localeCompare(right.planName)
  );
}

function membershipStatusSort(status: MembershipStatus) {
  return {
    [MembershipStatus.Active]: 0,
    [MembershipStatus.Trialing]: 1,
    [MembershipStatus.PastDue]: 2,
    [MembershipStatus.Paused]: 3,
    [MembershipStatus.Canceled]: 4,
    [MembershipStatus.Expired]: 5
  }[status];
}

function membershipStatusLabel(status: MembershipStatus) {
  return {
    [MembershipStatus.Active]: "Active",
    [MembershipStatus.Trialing]: "Trialing",
    [MembershipStatus.PastDue]: "Past due",
    [MembershipStatus.Paused]: "Paused",
    [MembershipStatus.Canceled]: "Canceled",
    [MembershipStatus.Expired]: "Expired"
  }[status];
}

function isArchived(member: MemberView) {
  return member.status === MemberStatus.Archived || Boolean(member.archivedAt);
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
