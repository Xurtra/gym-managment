import type { AccessRuleView } from "./types.js";

export interface AccessRuleEditorScreen {
  screen: "access_rule_editor";
  rules: AccessRuleView[];
  selectedLocationId?: string;
  selectedPlanId?: string;
  allowAllActiveMembers: boolean;
  canSubmit: boolean;
}

export function buildAccessRuleEditorScreen(input: {
  rules: AccessRuleView[];
  selectedLocationId?: string;
  selectedPlanId?: string;
  allowAllActiveMembers?: boolean;
}): AccessRuleEditorScreen {
  const allowAllActiveMembers = input.allowAllActiveMembers ?? false;
  const screen: AccessRuleEditorScreen = {
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
