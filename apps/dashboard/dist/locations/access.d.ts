import type { EmptyStateModel, TableModel } from "@gym-platform/ui";
import type { LocationAccessRuleView, LocationView, MemberLocationAccessMembershipView } from "./types.js";
export interface LocationAccessRulesScreen {
    screen: "location_access_rules";
    locationId: string;
    rules: LocationAccessRuleRow[];
    allowAllRuleCount: number;
    planRuleCount: number;
    totalRuleCount: number;
    summaryLabel: string;
    empty?: EmptyStateModel;
    table: TableModel<LocationAccessRuleRow>;
}
export interface LocationAccessRuleRow extends LocationAccessRuleView {
    planLabel: string;
    scopeLabel: string;
}
export interface MemberLocationAccessRow {
    locationId: string;
    locationName: string;
    allowed: boolean;
    accessLabel: string;
    matchedRuleCount: number;
    reasonLabel: string;
    ruleNames: string[];
}
export interface MultiLocationMemberAccessSetting {
    screen: "multi_location_member_access";
    multiLocation: boolean;
    locations: MemberLocationAccessRow[];
    allowedLocationIds: string[];
    allowedCount: number;
    deniedCount: number;
    summaryLabel: string;
    empty?: EmptyStateModel;
    table: TableModel<MemberLocationAccessRow>;
}
export declare function buildLocationAccessRulesScreen(input: {
    locationId: string;
    rules: LocationAccessRuleView[];
}): LocationAccessRulesScreen;
export declare function buildMultiLocationMemberAccessSetting(input: {
    locations: LocationView[];
    accessRules: LocationAccessRuleView[];
    memberships: MemberLocationAccessMembershipView[];
    now?: Date;
}): MultiLocationMemberAccessSetting;
//# sourceMappingURL=access.d.ts.map