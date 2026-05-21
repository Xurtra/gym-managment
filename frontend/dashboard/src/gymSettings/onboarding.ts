import { button } from "@gym-platform/ui";
import type {
  OnboardingProgressIndicatorScreen,
  OnboardingStepView,
  OnboardingWizardStepScreen,
  WebsiteTemplateOptionView
} from "./types.js";

export const onboardingSteps = [
  { id: "gym-details", title: "Gym Details" },
  { id: "location-details", title: "Location Details" },
  { id: "membership-plans", title: "Membership Plans" },
  { id: "payment-connection", title: "Payment Connection" },
  { id: "website-template", title: "Website Template" }
] as const;

const defaultWebsiteTemplates = [
  {
    id: "strength-studio",
    name: "Strength Studio",
    description: "Bold landing page for strength training, small-group classes, and coach-led programs."
  },
  {
    id: "wellness-flow",
    name: "Wellness Flow",
    description: "Clean template for yoga, recovery, and holistic wellness memberships."
  },
  {
    id: "community-hub",
    name: "Community Hub",
    description: "Balanced homepage for multi-program gyms that emphasize events, trainers, and member stories."
  }
] as const;

export function buildOnboardingChecklist(completedStepIds: string[], currentStepId?: string) {
  const current = currentStepId ?? nextOnboardingStep(completedStepIds);
  return onboardingSteps.map<OnboardingStepView>((step) => ({
    ...step,
    completed: completedStepIds.includes(step.id),
    current: step.id === current
  }));
}

export function buildOnboardingWizardStep(
  stepId: (typeof onboardingSteps)[number]["id"],
  input: {
    selectedTemplateId?: string;
    templateOptions?: ReadonlyArray<Pick<WebsiteTemplateOptionView, "id" | "name" | "description">>;
  } = {}
): OnboardingWizardStepScreen {
  const step = onboardingSteps.find((candidate) => candidate.id === stepId) ?? onboardingSteps[0];
  if (step.id === "website-template") {
    return buildWebsiteTemplateSelectionStep(input.selectedTemplateId, input.templateOptions);
  }
  return {
    screen: "onboarding_wizard_step",
    stepId: step.id,
    title: step.title,
    submit: button({ label: "Continue" })
  };
}

export function buildWebsiteTemplateSelectionStep(
  selectedTemplateId?: string,
  templateOptions: ReadonlyArray<Pick<WebsiteTemplateOptionView, "id" | "name" | "description">> = defaultWebsiteTemplates
): OnboardingWizardStepScreen {
  const options = templateOptions.map<WebsiteTemplateOptionView>((template) => ({
    ...template,
    selected: template.id === selectedTemplateId
  }));
  const selectedTemplate = options.find((template) => template.selected);
  return {
    screen: "onboarding_wizard_step",
    stepId: "website-template",
    title: "Website Template",
    description: "Choose a starting website design for your gym.",
    templateOptions: options,
    canSubmit: Boolean(selectedTemplate),
    ...(selectedTemplate ? { selectedTemplateId: selectedTemplate.id } : {}),
    submit: button({ label: "Continue", disabled: !selectedTemplate })
  };
}

export function buildOnboardingProgressIndicator(
  completedStepIds: string[]
): OnboardingProgressIndicatorScreen {
  const completedCount = onboardingSteps.filter((step) => completedStepIds.includes(step.id)).length;
  const totalCount = onboardingSteps.length;
  const remainingCount = totalCount - completedCount;
  const complete = remainingCount === 0;
  const nextStepId = nextOnboardingStep(completedStepIds);
  return {
    screen: "onboarding_progress",
    completedCount,
    totalCount,
    remainingCount,
    percentComplete: Math.round((completedCount / totalCount) * 100),
    complete,
    statusLabel: `${completedCount} of ${totalCount} steps completed`,
    ...(nextStepId ? { nextStepId } : {})
  };
}

function nextOnboardingStep(completedStepIds: string[]) {
  return onboardingSteps.find((step) => !completedStepIds.includes(step.id))?.id;
}
