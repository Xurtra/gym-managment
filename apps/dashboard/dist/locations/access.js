import { MembershipStatus } from "@gym-platform/constants";
import { emptyState, table } from "@gym-platform/ui";
const activeMembershipStatuses = new Set([
    MembershipStatus.Active,
    MembershipStatus.Trialing
]);
export function buildLocationAccessRulesScreen(input) {
    const rules = input.rules
        .filter((rule) => rule.locationId === input.locationId)
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((rule) => ({
        ...rule,
        planLabel: rule.planName ?? "All active members",
        scopeLabel: rule.allowAllActiveMembers ? "All active members" : "Membership-specific"
    }));
    const empty = rules.length === 0
        ? emptyState({
            title: "No access rules",
            body: "Create a location rule to control which members can enter this location."
        })
        : undefined;
    return {
        screen: "location_access_rules",
        locationId: input.locationId,
        rules,
        allowAllRuleCount: rules.filter((rule) => rule.allowAllActiveMembers).length,
        planRuleCount: rules.filter((rule) => Boolean(rule.planId)).length,
        totalRuleCount: rules.length,
        summaryLabel: `${rules.length} access rule${rules.length === 1 ? "" : "s"}`,
        ...(empty ? { empty } : {}),
        table: table({
            columns: [
                { key: "name", label: "Rule" },
                { key: "planLabel", label: "Plan" },
                { key: "scopeLabel", label: "Scope" }
            ],
            rows: rules,
            ...(empty ? { empty } : {})
        })
    };
}
export function buildMultiLocationMemberAccessSetting(input) {
    const now = input.now ?? new Date();
    const activeMemberships = input.memberships.filter((membership) => isActiveMembership(membership, now));
    const hasActiveMemberships = activeMemberships.length > 0;
    const rows = input.locations.map((location) => {
        const matchingRules = input.accessRules.filter((rule) => rule.locationId === location.id);
        const allowedRules = matchingRules.filter((rule) => (rule.allowAllActiveMembers && hasActiveMemberships) ||
            activeMemberships.some((membership) => membership.planId === rule.planId));
        const allowed = allowedRules.length > 0;
        const ruleNames = allowedRules.map((rule) => rule.name);
        return {
            locationId: location.id,
            locationName: location.name,
            allowed,
            accessLabel: allowed ? "Allowed" : "Restricted",
            matchedRuleCount: allowedRules.length,
            reasonLabel: allowed
                ? `Allowed by ${ruleNames.join(", ")}`
                : matchingRules.length === 0
                    ? "No access rules configured"
                    : hasActiveMemberships
                        ? "No matching access rule"
                        : "No active memberships",
            ruleNames
        };
    });
    const allowedLocationIds = rows.filter((row) => row.allowed).map((row) => row.locationId);
    const allowedCount = allowedLocationIds.length;
    const deniedCount = rows.length - allowedCount;
    const empty = rows.length === 0
        ? emptyState({
            title: "No locations available",
            body: "Add a location to review multi-location member access."
        })
        : undefined;
    return {
        screen: "multi_location_member_access",
        multiLocation: input.locations.length > 1,
        locations: rows,
        allowedLocationIds,
        allowedCount,
        deniedCount,
        summaryLabel: rows.length === 0
            ? "No locations configured"
            : `${allowedCount} of ${rows.length} location${rows.length === 1 ? "" : "s"} accessible`,
        ...(empty ? { empty } : {}),
        table: table({
            columns: [
                { key: "locationName", label: "Location" },
                { key: "accessLabel", label: "Access" },
                { key: "matchedRuleCount", label: "Matched rules" },
                { key: "reasonLabel", label: "Reason" }
            ],
            rows,
            ...(empty ? { empty } : {})
        })
    };
}
function isActiveMembership(membership, now) {
    if (!activeMembershipStatuses.has(membership.status)) {
        return false;
    }
    const startsAt = membership.startsAt ? new Date(membership.startsAt) : undefined;
    const endsAt = membership.endsAt ? new Date(membership.endsAt) : undefined;
    return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
}
//# sourceMappingURL=access.js.map