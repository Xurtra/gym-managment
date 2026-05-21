import { FeatureFlag } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  buildBrandColorSettings,
  buildBusinessInformationForm,
  buildFeatureFlagSettings,
  buildGymLogoUploadFlow,
  buildGymProfileSettingsPage,
  buildOnboardingChecklist,
  buildOnboardingProgressIndicator,
  buildOnboardingWizardStep,
  buildWebsiteTemplateSelectionStep,
  buildOperatingHoursEditor,
  buildTimezoneLocaleSettings
} from "./index.js";
import type { GymSettingsView } from "./index.js";

const gym: GymSettingsView = {
  id: "gym-1",
  name: "Demo Strength Club",
  slug: "demo-strength-club",
  timezone: "America/New_York",
  locale: "en-US",
  logoUrl: "https://example.com/logo.png",
  brandColors: { primary: "#111827", secondary: "#2563EB", accent: "#16A34A" },
  businessInfo: {
    legalName: "Demo Strength Club LLC",
    phone: "555-0100",
    email: "hello@example.com",
    website: "https://example.com"
  },
  operatingHours: {
    mon: [{ opensAt: "06:00", closesAt: "22:00" }]
  },
  featureFlags: [FeatureFlag.ClassBooking],
  onboardingCompletedSteps: ["gym-details"]
};

describe("gym settings and onboarding dashboard models", () => {
  it("builds gym settings screens", () => {
    expect(buildGymProfileSettingsPage(gym).title).toBe("Demo Strength Club");
    expect(buildGymLogoUploadFlow(gym, "https://example.com/new-logo.png").canSubmit).toBe(true);
    expect(buildBrandColorSettings(gym).fields[0]?.value).toBe("#111827");
    expect(buildBusinessInformationForm(gym).fields.map((field) => field.name)).toContain("legalName");
    expect(buildTimezoneLocaleSettings(gym).canSubmit).toBe(true);
    expect(buildOperatingHoursEditor(gym.operatingHours).table.rows[0]?.day).toBe("mon");
    expect(
      buildFeatureFlagSettings(gym.featureFlags, [FeatureFlag.ClassBooking, FeatureFlag.AccessControl]).flags
    ).toEqual([
      { flag: FeatureFlag.ClassBooking, enabled: true },
      { flag: FeatureFlag.AccessControl, enabled: false }
    ]);
  });

  it("builds onboarding checklist, wizard steps, and progress", () => {
    const checklist = buildOnboardingChecklist(gym.onboardingCompletedSteps);
    const wizard = buildOnboardingWizardStep("location-details");
    const progress = buildOnboardingProgressIndicator(["gym-details", "location-details"]);

    expect(checklist[0]?.completed).toBe(true);
    expect(checklist[1]?.current).toBe(true);
    expect(wizard.title).toBe("Location Details");
    expect(progress.completedCount).toBe(2);
    expect(progress.remainingCount).toBe(3);
    expect(progress.percentComplete).toBe(40);
    expect(progress.complete).toBe(false);
    expect(progress.statusLabel).toBe("2 of 5 steps completed");
    expect(progress.nextStepId).toBe("membership-plans");
  });

  it("marks onboarding progress complete when all steps are done", () => {
    const progress = buildOnboardingProgressIndicator([
      "gym-details",
      "location-details",
      "membership-plans",
      "payment-connection",
      "website-template"
    ]);

    expect(progress.completedCount).toBe(5);
    expect(progress.remainingCount).toBe(0);
    expect(progress.percentComplete).toBe(100);
    expect(progress.complete).toBe(true);
    expect(progress.nextStepId).toBeUndefined();
  });

  it("builds the website template onboarding step with selection state", () => {
    const wizard = buildWebsiteTemplateSelectionStep("wellness-flow");
    const routedWizard = buildOnboardingWizardStep("website-template", {
      selectedTemplateId: "wellness-flow"
    });

    expect(wizard.stepId).toBe("website-template");
    expect(wizard.templateOptions).toHaveLength(3);
    expect(wizard.templateOptions?.find((template) => template.id === "wellness-flow")?.selected).toBe(
      true
    );
    expect(wizard.selectedTemplateId).toBe("wellness-flow");
    expect(wizard.canSubmit).toBe(true);
    expect(wizard.submit.disabled).toBe(false);
    expect(routedWizard.templateOptions?.find((template) => template.id === "wellness-flow")?.selected).toBe(
      true
    );
  });
});
