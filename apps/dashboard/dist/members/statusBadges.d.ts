import { MemberStatus } from "@gym-platform/constants";
export type MemberStatusBadgeTone = "neutral" | "info" | "success" | "warning" | "danger";
export type MemberStatusBadgeEmphasis = "subtle" | "strong";
export interface MemberStatusBadge {
    kind: "member_status_badge";
    status: MemberStatus;
    label: string;
    tone: MemberStatusBadgeTone;
    emphasis: MemberStatusBadgeEmphasis;
    description: string;
}
export declare function buildMemberStatusBadge(status: MemberStatus): MemberStatusBadge;
export declare function buildMemberStatusBadgeLegend(statuses?: MemberStatus[]): MemberStatusBadge[];
export declare function memberStatusLabel(status: MemberStatus): "Lead" | "Trial" | "Active" | "Frozen" | "Cancelled" | "Expired" | "Archived" | "Past due";
//# sourceMappingURL=statusBadges.d.ts.map