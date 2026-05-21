import { MemberStatus, Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  buildMemberContactInformationSection,
  buildMemberEmergencyContactSection,
  buildMemberNotesSection,
  type MemberContactInformationSection,
  type MemberEmergencyContactSection,
  type MemberNotesSection,
  type MemberProfileSection
} from "../members/profileSections.js";
import { buildMemberStatusBadge, type MemberStatusBadge } from "../members/statusBadges.js";
import type { MemberView } from "../members/types.js";

export interface LeadProfileAction {
  key: "back_to_leads" | "edit" | "archive";
  button: ButtonModel;
  href?: string;
}

export interface LeadProfilePage {
  screen: "lead_profile";
  lead: MemberView;
  fullName: string;
  initials: string;
  statusLabel: string;
  statusBadge: MemberStatusBadge;
  archived: boolean;
  contactSection: MemberContactInformationSection;
  emergencyContactSection: MemberEmergencyContactSection;
  notesSection: MemberNotesSection;
  sections: MemberProfileSection[];
  sectionCount: number;
  tagCount: number;
  tagsLabel: string;
  actions: LeadProfileAction[];
  actionCount: number;
  summaryLabel: string;
}

export function buildLeadProfilePage(inputModel: {
  lead: MemberView;
  permissions: string[];
}): LeadProfilePage {
  const canWriteMembers = inputModel.permissions.includes(Permission.MemberWrite);
  const archived = isArchived(inputModel.lead);
  const statusBadge = buildMemberStatusBadge(inputModel.lead.status);
  const contactSection = buildMemberContactInformationSection(inputModel.lead);
  const emergencyContactSection = buildMemberEmergencyContactSection(inputModel.lead);
  const notesSection = buildMemberNotesSection(inputModel.lead);
  const sections = buildSections(
    inputModel.lead,
    statusBadge,
    contactSection,
    emergencyContactSection,
    notesSection
  );
  const actions = buildActions(inputModel.lead, canWriteMembers, archived);
  const tagCount = inputModel.lead.tagNames.length;

  return {
    screen: "lead_profile",
    lead: inputModel.lead,
    fullName: memberName(inputModel.lead),
    initials: buildInitials(inputModel.lead),
    statusLabel: statusBadge.label,
    statusBadge,
    archived,
    contactSection,
    emergencyContactSection,
    notesSection,
    sections,
    sectionCount: sections.length,
    tagCount,
    tagsLabel: inputModel.lead.tagNames.join(", ") || "No tags",
    actions,
    actionCount: actions.length,
    summaryLabel: `Showing ${tagCount} lead tag${tagCount === 1 ? "" : "s"}`
  };
}

function buildSections(
  lead: MemberView,
  statusBadge: MemberStatusBadge,
  contactSection: MemberContactInformationSection,
  emergencyContactSection: MemberEmergencyContactSection,
  notesSection: MemberNotesSection
): MemberProfileSection[] {
  return [
    {
      key: "identity",
      title: "Lead details",
      details: [
        { key: "status", label: "Status", value: statusBadge.label },
        { key: "barcode", label: "Barcode", value: lead.barcode ?? "Not provided" },
        { key: "created", label: "Created", value: lead.createdAt },
        { key: "updated", label: "Last updated", value: lead.updatedAt }
      ]
    },
    contactSection,
    emergencyContactSection,
    {
      key: "tags",
      title: "Tags",
      details: [{ key: "tags", label: "Tags", value: lead.tagNames.join(", ") || "No tags" }]
    },
    notesSection
  ];
}

function buildActions(
  lead: MemberView,
  canWriteMembers: boolean,
  archived: boolean
): LeadProfileAction[] {
  return [
    {
      key: "back_to_leads",
      href: "/leads",
      button: button({ label: "Back to leads", icon: "arrow-left", intent: "secondary" })
    },
    {
      key: "edit",
      href: `/members/${lead.id}/edit`,
      button: button({
        label: "Edit lead",
        icon: "pencil",
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

function isArchived(lead: MemberView) {
  return lead.status === MemberStatus.Archived || Boolean(lead.archivedAt);
}

function memberName(lead: MemberView) {
  return `${lead.firstName} ${lead.lastName}`.trim() || lead.email || lead.phone || lead.id;
}

function buildInitials(lead: MemberView) {
  const letters = [lead.firstName, lead.lastName]
    .map((value) => value.trim().charAt(0))
    .filter(Boolean);
  if (letters.length > 0) {
    return letters.join("").toUpperCase();
  }
  return (lead.email?.charAt(0) ?? "?").toUpperCase();
}
