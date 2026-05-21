import { MemberStatus } from "@gym-platform/constants";

export type MemberStatusBadgeTone = "neutral" | "info" | "success" | "warning" | "danger";
export type MemberStatusBadgeEmphasis = "subtle" | "strong";
export type MemberStatusBadgeCategory =
  | "prospect"
  | "active"
  | "attention"
  | "inactive"
  | "archived";

export interface MemberStatusBadge {
  kind: "member_status_badge";
  status: MemberStatus;
  label: string;
  tone: MemberStatusBadgeTone;
  emphasis: MemberStatusBadgeEmphasis;
  description: string;
  category: MemberStatusBadgeCategory;
  allowsCheckIn: boolean;
  sortOrder: number;
}

export interface MemberStatusBadgeLegend {
  kind: "member_status_badge_legend";
  badges: MemberStatusBadge[];
  badgeCount: number;
  allowsCheckInCount: number;
  summaryLabel: string;
}

const DEFAULT_BADGE_STATUSES: MemberStatus[] = [
  MemberStatus.Lead,
  MemberStatus.Trial,
  MemberStatus.Active,
  MemberStatus.PastDue,
  MemberStatus.Frozen,
  MemberStatus.Cancelled,
  MemberStatus.Expired
];

const BADGE_CONFIG = {
  [MemberStatus.Lead]: {
    label: "Lead",
    tone: "info",
    emphasis: "subtle",
    description: "Prospective member who has not started a trial or membership.",
    category: "prospect",
    allowsCheckIn: false,
    sortOrder: 0
  },
  [MemberStatus.Trial]: {
    label: "Trial",
    tone: "info",
    emphasis: "strong",
    description: "Member is currently in a trial period.",
    category: "active",
    allowsCheckIn: true,
    sortOrder: 1
  },
  [MemberStatus.Active]: {
    label: "Active",
    tone: "success",
    emphasis: "strong",
    description: "Member is in good standing and can use active services.",
    category: "active",
    allowsCheckIn: true,
    sortOrder: 2
  },
  [MemberStatus.PastDue]: {
    label: "Past due",
    tone: "warning",
    emphasis: "strong",
    description: "Member requires billing follow-up before returning to good standing.",
    category: "attention",
    allowsCheckIn: false,
    sortOrder: 3
  },
  [MemberStatus.Frozen]: {
    label: "Frozen",
    tone: "neutral",
    emphasis: "strong",
    description: "Member access is temporarily frozen.",
    category: "inactive",
    allowsCheckIn: false,
    sortOrder: 4
  },
  [MemberStatus.Cancelled]: {
    label: "Cancelled",
    tone: "danger",
    emphasis: "subtle",
    description: "Member has cancelled their membership.",
    category: "inactive",
    allowsCheckIn: false,
    sortOrder: 5
  },
  [MemberStatus.Expired]: {
    label: "Expired",
    tone: "neutral",
    emphasis: "subtle",
    description: "Member access expired after the current term ended.",
    category: "inactive",
    allowsCheckIn: false,
    sortOrder: 6
  },
  [MemberStatus.Archived]: {
    label: "Archived",
    tone: "neutral",
    emphasis: "subtle",
    description: "Member record is archived and no longer active.",
    category: "archived",
    allowsCheckIn: false,
    sortOrder: 7
  }
} as const satisfies Record<
  MemberStatus,
  {
    label: string;
    tone: MemberStatusBadgeTone;
    emphasis: MemberStatusBadgeEmphasis;
    description: string;
    category: MemberStatusBadgeCategory;
    allowsCheckIn: boolean;
    sortOrder: number;
  }
>;

export function buildMemberStatusBadge(status: MemberStatus): MemberStatusBadge {
  const config = BADGE_CONFIG[status];
  return {
    kind: "member_status_badge",
    status,
    label: config.label,
    tone: config.tone,
    emphasis: config.emphasis,
    description: config.description,
    category: config.category,
    allowsCheckIn: config.allowsCheckIn,
    sortOrder: config.sortOrder
  };
}

export function buildMemberStatusBadgeLegend(statuses: MemberStatus[] = DEFAULT_BADGE_STATUSES) {
  return statuses.map((status) => buildMemberStatusBadge(status));
}

export function buildMemberStatusBadgeLegendState(
  statuses: MemberStatus[] = DEFAULT_BADGE_STATUSES
): MemberStatusBadgeLegend {
  const badges = buildMemberStatusBadgeLegend(statuses);
  return {
    kind: "member_status_badge_legend",
    badges,
    badgeCount: badges.length,
    allowsCheckInCount: badges.filter((badge) => badge.allowsCheckIn).length,
    summaryLabel: `${badges.length} member statuses`
  };
}

export function memberStatusLabel(status: MemberStatus) {
  return BADGE_CONFIG[status].label;
}
