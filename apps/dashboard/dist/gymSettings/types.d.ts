import type { FeatureFlag } from "@gym-platform/constants";
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
//# sourceMappingURL=types.d.ts.map