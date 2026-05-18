import { button } from "@gym-platform/ui";
export const onboardingSteps = [
    { id: "gym-details", title: "Gym Details" },
    { id: "location-details", title: "Location Details" },
    { id: "membership-plans", title: "Membership Plans" },
    { id: "payment-connection", title: "Payment Connection" },
    { id: "website-template", title: "Website Template" }
];
export function buildOnboardingChecklist(completedStepIds, currentStepId) {
    const current = currentStepId ?? nextOnboardingStep(completedStepIds);
    return onboardingSteps.map((step) => ({
        ...step,
        completed: completedStepIds.includes(step.id),
        current: step.id === current
    }));
}
export function buildOnboardingWizardStep(stepId) {
    const step = onboardingSteps.find((candidate) => candidate.id === stepId) ?? onboardingSteps[0];
    return {
        screen: "onboarding_wizard_step",
        stepId: step.id,
        title: step.title,
        submit: button({ label: "Continue" })
    };
}
export function buildOnboardingProgressIndicator(completedStepIds) {
    const completedCount = onboardingSteps.filter((step) => completedStepIds.includes(step.id)).length;
    return {
        screen: "onboarding_progress",
        completedCount,
        totalCount: onboardingSteps.length,
        percentComplete: Math.round((completedCount / onboardingSteps.length) * 100),
        nextStepId: nextOnboardingStep(completedStepIds)
    };
}
function nextOnboardingStep(completedStepIds) {
    return onboardingSteps.find((step) => !completedStepIds.includes(step.id))?.id;
}
//# sourceMappingURL=onboarding.js.map