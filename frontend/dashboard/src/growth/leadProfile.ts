import { Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import type { MemberView } from "../members/types.js";
import type { InteractionView } from "./types.js";
import {
  buildInteractionTypeLabel,
  buildInterestLevelBadge,
  buildLeadSourceLabel,
  buildRetentionFlagBadge,
  type GrowthBadge
} from "./statusBadges.js";

export interface GrowthCrmSection {
  leadSource: string;
  interestLevel?: GrowthBadge;
  assignedStaffName?: string;
  nextFollowUpLabel?: string;
  isFollowUpOverdue: boolean;
  retentionFlag?: GrowthBadge;
}

export interface GrowthConsentSection {
  consentEmail: boolean;
  consentSms: boolean;
  consentPhone: boolean;
  contactPreference?: string;
}

export interface GrowthInteractionRow {
  id: string;
  typeLabel: string;
  notes?: string;
  staffName?: string;
  occurredAtLabel: string;
}

export interface GrowthLeadProfilePage {
  screen: "growth_lead_profile";
  consumer: MemberView;
  fullName: string;
  contactLabel: string;
  crmSection: GrowthCrmSection;
  consentSection: GrowthConsentSection;
  timeline: GrowthInteractionRow[];
  hasTimeline: boolean;
  backAction: ButtonModel;
  logCallAction: ButtonModel;
  logNoteAction: ButtonModel;
  logEmailAction: ButtonModel;
  convertAction: ButtonModel;
  editAction: ButtonModel;
}

export function buildGrowthLeadProfilePage(inputModel: {
  consumer: MemberView;
  interactions: InteractionView[];
  permissions: string[];
  backHref?: string;
}): GrowthLeadProfilePage {
  const canWrite = inputModel.permissions.includes(Permission.GrowthWrite);
  const canWriteMembers = inputModel.permissions.includes(Permission.MemberWrite);
  const { consumer, interactions } = inputModel;

  const followUpDate = consumer.nextFollowUpAt ? new Date(consumer.nextFollowUpAt) : undefined;
  const isFollowUpOverdue = followUpDate !== undefined && followUpDate < new Date();
  const interestLevel = buildInterestLevelBadge(consumer.interestLevel);
  const retentionFlag = buildRetentionFlagBadge(consumer.retentionFlag);

  const crmSection: GrowthCrmSection = {
    leadSource: buildLeadSourceLabel(consumer.leadSource),
    ...(interestLevel ? { interestLevel } : {}),
    ...(consumer.assignedStaffName ? { assignedStaffName: consumer.assignedStaffName } : {}),
    ...(followUpDate ? { nextFollowUpLabel: formatDate(followUpDate) } : {}),
    isFollowUpOverdue,
    ...(retentionFlag ? { retentionFlag } : {})
  };

  const consentSection: GrowthConsentSection = {
    consentEmail: consumer.consentEmail ?? true,
    consentSms: consumer.consentSms ?? false,
    consentPhone: consumer.consentPhone ?? true,
    ...(consumer.contactPreference ? { contactPreference: consumer.contactPreference } : {})
  };

  const timeline: GrowthInteractionRow[] = interactions.map((interaction) => {
    const row: GrowthInteractionRow = {
      id: interaction.id,
      typeLabel: buildInteractionTypeLabel(interaction.type),
      occurredAtLabel: formatDateTime(new Date(interaction.occurredAt))
    };
    if (interaction.notes) {
      row.notes = interaction.notes;
    }
    if (interaction.staffName) {
      row.staffName = interaction.staffName;
    }
    return row;
  });

  return {
    screen: "growth_lead_profile",
    consumer,
    fullName: memberName(consumer),
    contactLabel: consumer.email ?? consumer.phone ?? "No contact",
    crmSection,
    consentSection,
    timeline,
    hasTimeline: timeline.length > 0,
    backAction: button({ label: "Back", intent: "secondary" }),
    logCallAction: button({ label: "Log Call", icon: "phone", intent: "secondary", disabled: !canWrite }),
    logNoteAction: button({ label: "Log Note", icon: "pencil", intent: "secondary", disabled: !canWrite }),
    logEmailAction: button({ label: "Log Email", icon: "mail", intent: "secondary", disabled: !canWrite }),
    convertAction: button({
      label: "Convert to Member",
      intent: "primary",
      disabled: !canWrite || consumer.leadStage !== "open"
    }),
    editAction: button({ label: "Edit", icon: "pencil", intent: "secondary", disabled: !canWriteMembers })
  };
}

function memberName(member: MemberView) {
  return `${member.firstName} ${member.lastName}`.trim() || member.email || member.id;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
