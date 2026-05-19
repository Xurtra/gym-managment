import type { OnboardingProgressIndicatorScreen, OnboardingStepView, OnboardingWizardStepScreen, WebsiteTemplateOptionView } from "./types.js";
export declare const onboardingSteps: readonly [{
    readonly id: "gym-details";
    readonly title: "Gym Details";
}, {
    readonly id: "location-details";
    readonly title: "Location Details";
}, {
    readonly id: "membership-plans";
    readonly title: "Membership Plans";
}, {
    readonly id: "payment-connection";
    readonly title: "Payment Connection";
}, {
    readonly id: "website-template";
    readonly title: "Website Template";
}];
export declare function buildOnboardingChecklist(completedStepIds: string[], currentStepId?: string): OnboardingStepView[];
export declare function buildOnboardingWizardStep(stepId: (typeof onboardingSteps)[number]["id"], input?: {
    selectedTemplateId?: string;
    templateOptions?: ReadonlyArray<Pick<WebsiteTemplateOptionView, "id" | "name" | "description">>;
}): OnboardingWizardStepScreen;
export declare function buildWebsiteTemplateSelectionStep(selectedTemplateId?: string, templateOptions?: ReadonlyArray<Pick<WebsiteTemplateOptionView, "id" | "name" | "description">>): OnboardingWizardStepScreen;
export declare function buildOnboardingProgressIndicator(completedStepIds: string[]): OnboardingProgressIndicatorScreen;
//# sourceMappingURL=onboarding.d.ts.map