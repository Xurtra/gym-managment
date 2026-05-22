import { LeadStage, MemberStatus, Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import { isLeadConsumer } from "../members/segments.js";
import { memberStatusLabel } from "../members/statusBadges.js";
import type { MemberView } from "../members/types.js";

export type LeadConversionTargetStatus = typeof MemberStatus.Trial | typeof MemberStatus.Active;

export interface LeadConversionStatusOption {
  value: LeadConversionTargetStatus;
  label: string;
  selected: boolean;
  disabled: boolean;
}

export interface LeadConversionSubmission {
  memberId: string;
  status: LeadConversionTargetStatus;
  leadStage: typeof LeadStage.Converted;
}

export interface LeadConversionScreen {
  screen: "lead_conversion";
  lead: MemberView;
  fullName: string;
  currentStatusLabel: string;
  targetStatusOptions: LeadConversionStatusOption[];
  targetStatusOptionCount: number;
  selectedTargetStatus?: LeadConversionTargetStatus;
  destinationStatusLabel?: string;
  blockedReason?: string;
  canSubmit: boolean;
  summaryLabel: string;
  action: ButtonModel;
}

export function buildLeadConversionScreen(inputModel: {
  lead: MemberView;
  permissions: string[];
  selectedTargetStatus?: LeadConversionTargetStatus;
}): LeadConversionScreen {
  const canWriteMembers = inputModel.permissions.includes(Permission.MemberWrite);
  const blockedReason = conversionBlockedReason(inputModel.lead, canWriteMembers);
  const targetStatusOptions = buildTargetStatusOptions(inputModel.selectedTargetStatus, Boolean(blockedReason));
  const selectedTargetStatus = targetStatusOptions.find((option) => option.selected)?.value;
  const canSubmit = Boolean(!blockedReason && selectedTargetStatus);

  return {
    screen: "lead_conversion",
    lead: inputModel.lead,
    fullName: memberName(inputModel.lead),
    currentStatusLabel: memberStatusLabel(inputModel.lead.status),
    targetStatusOptions,
    targetStatusOptionCount: targetStatusOptions.length,
    ...(selectedTargetStatus ? { selectedTargetStatus } : {}),
    ...(selectedTargetStatus ? { destinationStatusLabel: memberStatusLabel(selectedTargetStatus) } : {}),
    ...(blockedReason ? { blockedReason } : {}),
    canSubmit,
    summaryLabel: buildSummaryLabel(selectedTargetStatus, blockedReason),
    action: button({ label: "Convert lead", disabled: !canSubmit })
  };
}

export function createLeadConversionSubmission(inputModel: {
  memberId: string;
  targetStatus: LeadConversionTargetStatus;
}): LeadConversionSubmission {
  return {
    memberId: inputModel.memberId,
    status: inputModel.targetStatus,
    leadStage: LeadStage.Converted
  };
}

function buildTargetStatusOptions(
  selectedTargetStatus: LeadConversionTargetStatus | undefined,
  disabled: boolean
): LeadConversionStatusOption[] {
  return [MemberStatus.Trial, MemberStatus.Active].map((status) => ({
    value: status,
    label: memberStatusLabel(status),
    selected: status === selectedTargetStatus,
    disabled
  }));
}

function conversionBlockedReason(lead: MemberView, canWriteMembers: boolean) {
  if (!canWriteMembers) {
    return "Member write permission is required.";
  }
  if (!isLeadConsumer(lead)) {
    return "Only leads can be converted.";
  }
  if (lead.archivedAt) {
    return "Archived leads cannot be converted.";
  }
  return undefined;
}

function buildSummaryLabel(
  selectedTargetStatus: LeadConversionTargetStatus | undefined,
  blockedReason: string | undefined
) {
  if (blockedReason) {
    return "Lead conversion unavailable";
  }
  if (!selectedTargetStatus) {
    return "Select a member status";
  }
  return `Convert lead to ${memberStatusLabel(selectedTargetStatus)}`;
}

function memberName(member: MemberView) {
  return (
    `${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id
  );
}
