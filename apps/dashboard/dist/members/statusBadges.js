import { MemberStatus } from "@gym-platform/constants";
const DEFAULT_BADGE_STATUSES = [
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
        description: "Prospective member who has not started a trial or membership."
    },
    [MemberStatus.Trial]: {
        label: "Trial",
        tone: "info",
        emphasis: "strong",
        description: "Member is currently in a trial period."
    },
    [MemberStatus.Active]: {
        label: "Active",
        tone: "success",
        emphasis: "strong",
        description: "Member is in good standing and can use active services."
    },
    [MemberStatus.PastDue]: {
        label: "Past due",
        tone: "warning",
        emphasis: "strong",
        description: "Member requires billing follow-up before returning to good standing."
    },
    [MemberStatus.Frozen]: {
        label: "Frozen",
        tone: "neutral",
        emphasis: "strong",
        description: "Member access is temporarily frozen."
    },
    [MemberStatus.Cancelled]: {
        label: "Cancelled",
        tone: "danger",
        emphasis: "subtle",
        description: "Member has cancelled their membership."
    },
    [MemberStatus.Expired]: {
        label: "Expired",
        tone: "neutral",
        emphasis: "subtle",
        description: "Member access expired after the current term ended."
    },
    [MemberStatus.Archived]: {
        label: "Archived",
        tone: "neutral",
        emphasis: "subtle",
        description: "Member record is archived and no longer active."
    }
};
export function buildMemberStatusBadge(status) {
    const config = BADGE_CONFIG[status];
    return {
        kind: "member_status_badge",
        status,
        label: config.label,
        tone: config.tone,
        emphasis: config.emphasis,
        description: config.description
    };
}
export function buildMemberStatusBadgeLegend(statuses = DEFAULT_BADGE_STATUSES) {
    return statuses.map((status) => buildMemberStatusBadge(status));
}
export function memberStatusLabel(status) {
    return BADGE_CONFIG[status].label;
}
//# sourceMappingURL=statusBadges.js.map