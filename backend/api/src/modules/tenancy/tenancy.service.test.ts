import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";

describe("TenancyService", () => {
  it("creates unique gym slugs for the same owner", async () => {
    const services = createServices(testConfig, fixedClock);
    const owner = await services.authService.register({
      email: "owner@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Owner",
      gymName: "Demo Strength Club",
      timezone: "America/New_York",
      locale: "en-US"
    });

    const secondGym = await services.tenancyService.createGym(owner.user.id, {
      name: "Demo Strength Club",
      timezone: "America/New_York",
      locale: "en-US",
      featureFlags: []
    });

    expect(owner.gym?.slug).toBe("demo-strength-club");
    expect(secondGym.slug).toBe("demo-strength-club-2");
  });

  it("rejects access to gyms outside the user's memberships", async () => {
    const services = createServices(testConfig, fixedClock);
    const owner = await services.authService.register({
      email: "owner@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Owner",
      gymName: "Demo Strength Club",
      timezone: "America/New_York",
      locale: "en-US"
    });
    const outsider = await services.authService.register({
      email: "outsider@example.com",
      password: "Password123",
      firstName: "Out",
      lastName: "Sider",
      timezone: "America/New_York",
      locale: "en-US"
    });

    await expect(
      services.tenancyService.ensureGymAccess(outsider.user.id, owner.gym?.id ?? "")
    ).rejects.toThrow(/does not have access/i);
  });

  it("updates gym settings and onboarding progress", async () => {
    const services = createServices(testConfig, fixedClock);
    const owner = await services.authService.register({
      email: "owner@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Owner",
      gymName: "Demo Strength Club",
      timezone: "America/New_York",
      locale: "en-US"
    });

    const updated = await services.tenancyService.updateGym(owner.gym?.id ?? "", {
      name: "Demo Performance Club",
      logoUrl: "https://example.com/logo.png",
      stripeAccountId: "acct_demoPerformance123",
      brandColors: { primary: "#111827", secondary: "#2563EB" },
      businessInfo: {
        legalName: "Demo Performance Club LLC",
        email: "hello@example.com",
        website: "https://example.com"
      },
      operatingHours: { mon: [{ opensAt: "06:00", closesAt: "22:00" }] },
      onboardingCompletedSteps: ["gym-details", "location-details"]
    });

    expect(updated.name).toBe("Demo Performance Club");
    expect(updated.logoUrl).toBe("https://example.com/logo.png");
    expect(updated.stripeAccountId).toBe("acct_demoPerformance123");
    expect(updated.brandColors?.primary).toBe("#111827");
    expect(updated.businessInfo?.legalName).toMatch(/Performance/);
    expect(updated.operatingHours.mon?.[0]?.opensAt).toBe("06:00");
    expect(updated.onboardingCompletedSteps).toContain("location-details");
  });
});
