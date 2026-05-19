import { MemberStatus } from "@gym-platform/constants";
export type MemberStatusBadgeTone = "neutral" | "info" | "success" | "warning" | "danger";
export type MemberStatusBadgeEmphasis = "subtle" | "strong";
export type MemberStatusBadgeCategory = "prospect" | "active" | "attention" | "inactive" | "archived";
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
export declare function buildMemberStatusBadge(status: MemberStatus): MemberStatusBadge;
export declare function buildMemberStatusBadgeLegend(statuses?: MemberStatus[]): MemberStatusBadge[];
export declare function buildMemberStatusBadgeLegendState(statuses?: MemberStatus[]): MemberStatusBadgeLegend;
export declare function memberStatusLabel(status: MemberStatus): "Lead" | "Trial" | "Active" | "Frozen" | "Cancelled" | "Expired" | "Archived" | "Past due";
//# sourceMappingURL=statusBadges.d.ts.map