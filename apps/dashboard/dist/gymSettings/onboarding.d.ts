import type { OnboardingStepView } from "./types.js";
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
export declare function buildOnboardingWizardStep(stepId: (typeof onboardingSteps)[number]["id"]): {
    screen: string;
    stepId: "gym-details" | "location-details" | "membership-plans" | "payment-connection" | "website-template";
    title: "Gym Details" | "Location Details" | "Membership Plans" | "Payment Connection" | "Website Template";
    submit: import("@gym-platform/ui").ButtonModel;
};
export declare function buildOnboardingProgressIndicator(completedStepIds: string[]): {
    screen: string;
    completedCount: number;
    totalCount: 5;
    percentComplete: number;
    nextStepId: "gym-details" | "location-details" | "membership-plans" | "payment-connection" | "website-template" | undefined;
};
//# sourceMappingURL=onboarding.d.ts.map