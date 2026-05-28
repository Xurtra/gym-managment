import { InteractionType, InterestLevel, RetentionFlag } from "@gym-platform/constants";
import { badge } from "@gym-platform/ui";
import type { BadgeModel } from "@gym-platform/ui";

export interface GrowthBadge extends BadgeModel {
  label: string;
}

export function buildInterestLevelBadge(level: string | undefined): GrowthBadge | undefined {
  if (!level) return undefined;
  const toneMap: Record<string, BadgeModel["tone"]> = {
    [InterestLevel.Low]: "neutral",
    [InterestLevel.Medium]: "info",
    [InterestLevel.High]: "success"
  };
  const labelMap: Record<string, string> = {
    [InterestLevel.Low]: "Low Interest",
    [InterestLevel.Medium]: "Medium Interest",
    [InterestLevel.High]: "High Interest"
  };
  return badge({ label: labelMap[level] ?? level, tone: toneMap[level] ?? "neutral" });
}

export function buildRetentionFlagBadge(flag: string | undefined): GrowthBadge | undefined {
  if (!flag) return undefined;
  const toneMap: Record<string, BadgeModel["tone"]> = {
    [RetentionFlag.AtRisk]: "warning",
    [RetentionFlag.Lapsed]: "danger",
    [RetentionFlag.Churned]: "neutral"
  };
  const labelMap: Record<string, string> = {
    [RetentionFlag.AtRisk]: "At Risk",
    [RetentionFlag.Lapsed]: "Lapsed",
    [RetentionFlag.Churned]: "Churned"
  };
  return badge({ label: labelMap[flag] ?? flag, tone: toneMap[flag] ?? "neutral" });
}

export function buildLeadSourceLabel(source: string | undefined): string {
  if (!source) return "Unknown";
  const labelMap: Record<string, string> = {
    walk_in: "Walk-In",
    referral: "Referral",
    website: "Website",
    social_media: "Social Media",
    csv_import: "CSV Import",
    other: "Other"
  };
  return labelMap[source] ?? source;
}

export function buildInteractionTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    [InteractionType.Call]: "Call",
    [InteractionType.Sms]: "SMS",
    [InteractionType.Email]: "Email",
    [InteractionType.Note]: "Note"
  };
  return labelMap[type] ?? type;
}
