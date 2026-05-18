import type { AccessRuleView } from "./types.js";
export interface AccessRuleEditorScreen {
    screen: "access_rule_editor";
    rules: AccessRuleView[];
    selectedLocationId?: string;
    selectedPlanId?: string;
    allowAllActiveMembers: boolean;
    canSubmit: boolean;
}
export declare function buildAccessRuleEditorScreen(input: {
    rules: AccessRuleView[];
    selectedLocationId?: string;
    selectedPlanId?: string;
    allowAllActiveMembers?: boolean;
}): AccessRuleEditorScreen;
//# sourceMappingURL=rules.d.ts.map