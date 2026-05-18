import { MembershipStatus } from "@gym-platform/constants";
import { table } from "@gym-platform/ui";
import type { TableModel } from "@gym-platform/ui";
import type {
  LocationAccessRuleView,
  LocationView,
  MemberLocationAccessMembershipView
} from "./types.js";

const activeMembershipStatuses = new Set<MembershipStatus>([
  MembershipStatus.Active,
  MembershipStatus.Trialing
]);

export interface LocationAccessRulesScreen {
  screen: "location_access_rules";
  locationId: string;
  rules: LocationAccessRuleView[];
  allowAllRuleCount: number;
  planRuleCount: number;
  table: TableModel<LocationAccessRuleView>;
}

export interface MemberLocationAccessRow {
  locationId: string;
  locationName: string;
  allowed: boolean;
  ruleNames: string[];
}

export interface MultiLocationMemberAccessSetting {
  screen: "multi_location_member_access";
  multiLocation: boolean;
  locations: MemberLocationAccessRow[];
  allowedLocationIds: string[];
}

export function buildLocationAccessRulesScreen(input: {
  locationId: string;
  rules: LocationAccessRuleView[];
}): LocationAccessRulesScreen {
  const rules = input.rules.filter((rule) => rule.locationId === input.locationId);
  return {
    screen: "location_access_rules",
    locationId: input.locationId,
    rules,
    allowAllRuleCount: rules.filter((rule) => rule.allowAllActiveMembers).length,
    planRuleCount: rules.filter((rule) => Boolean(rule.planId)).length,
    table: table({
      columns: [
        { key: "name", label: "Rule" },
        { key: "planName", label: "Plan" },
        { key: "allowAllActiveMembers", label: "All active" }
      ],
      rows: rules
    })
  };
}

export function buildMultiLocationMemberAccessSetting(input: {
  locations: LocationView[];
  accessRules: LocationAccessRuleView[];
  memberships: MemberLocationAccessMembershipView[];
  now?: Date;
}): MultiLocationMemberAccessSetting {
  const now = input.now ?? new Date();
  const activeMemberships = input.memberships.filter((membership) =>
    isActiveMembership(membership, now)
  );
  const rows = input.locations.map((location) => {
    const matchingRules = input.accessRules.filter((rule) => rule.locationId === location.id);
    const allowedRules = matchingRules.filter(
      (rule) =>
        (rule.allowAllActiveMembers && activeMemberships.length > 0) ||
        activeMemberships.some((membership) => membership.planId === rule.planId)
    );
    return {
      locationId: location.id,
      locationName: location.name,
      allowed: allowedRules.length > 0,
      ruleNames: allowedRules.map((rule) => rule.name)
    };
  });

  return {
    screen: "multi_location_member_access",
    multiLocation: input.locations.length > 1,
    locations: rows,
    allowedLocationIds: rows.filter((row) => row.allowed).map((row) => row.locationId)
  };
}

function isActiveMembership(membership: MemberLocationAccessMembershipView, now: Date) {
  if (!activeMembershipStatuses.has(membership.status)) {
    return false;
  }
  const startsAt = membership.startsAt ? new Date(membership.startsAt) : undefined;
  const endsAt = membership.endsAt ? new Date(membership.endsAt) : undefined;
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
}
