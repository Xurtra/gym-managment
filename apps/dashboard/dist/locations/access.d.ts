import type { TableModel } from "@gym-platform/ui";
import type { LocationAccessRuleView, LocationView, MemberLocationAccessMembershipView } from "./types.js";
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