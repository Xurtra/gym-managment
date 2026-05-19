import type { FeatureFlag } from "@gym-platform/constants";
import type { ButtonModel } from "@gym-platform/ui";
export interface HoursRangeView {
    opensAt: string;
    closesAt: string;
}
export type OperatingHoursView = Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", HoursRangeView[]>>;
export interface GymSettingsView {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    locale: string;
    logoUrl?: string;
    brandColors?: {
        primary: string;
        secondary?: string;
        accent?: string;
    };
    businessInfo?: {
        legalName?: string;
        phone?: string;
        email?: string;
        website?: string;
        taxId?: string;
    };
    operatingHours: OperatingHoursView;
    featureFlags: FeatureFlag[];
    onboardingCompletedSteps: string[];
}
export interface OnboardingStepView {
    id: string;
    title: string;
    completed: boolean;
    current: boolean;
}
export interface WebsiteTemplateOptionView {
    id: string;
    name: string;
    description: string;
    selected: boolean;
}
export interface OnboardingWizardStepScreen {
    screen: "onboarding_wizard_step";
    stepId: string;
    title: string;
    submit: ButtonModel;
    description?: string;
    canSubmit?: boolean;
    selectedTemplateId?: string;
    templateOptions?: WebsiteTemplateOptionView[];
}
export interface OnboardingProgressIndicatorScreen {
    screen: "onboarding_progress";
    completedCount: number;
    totalCount: number;
    remainingCount: number;
    percentComplete: number;
    complete: boolean;
    statusLabel: string;
    nextStepId?: string;
}
//# sourceMappingURL=types.d.ts.map