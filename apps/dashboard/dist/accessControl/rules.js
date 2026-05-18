export function buildAccessRuleEditorScreen(input) {
    const allowAllActiveMembers = input.allowAllActiveMembers ?? false;
    const screen = {
        screen: "access_rule_editor",
        rules: input.rules,
        allowAllActiveMembers,
        canSubmit: Boolean(input.selectedLocationId && (input.selectedPlanId || allowAllActiveMembers))
    };
    if (input.selectedLocationId) {
        screen.selectedLocationId = input.selectedLocationId;
    }
    if (input.selectedPlanId) {
        screen.selectedPlanId = input.selectedPlanId;
    }
    return screen;
}
//# sourceMappingURL=rules.js.map