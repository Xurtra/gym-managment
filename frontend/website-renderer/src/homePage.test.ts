import { FeatureFlag } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildPublicWebsiteHomePage } from "./index.js";

describe("website builder home page", () => {
  it("builds an enabled homepage with feature-flag driven sections", () => {
    const page = buildPublicWebsiteHomePage({
      gymName: "Forge Fitness",
      featureFlags: [FeatureFlag.WebsiteBuilder, FeatureFlag.OnlineSignup, FeatureFlag.ClassBooking],
      primaryColor: "#111827",
      accentColor: "#22c55e",
      logoUrl: "https://example.com/logo.png"
    });

    expect(page.websiteBuilderEnabled).toBe(true);
    expect(page.heroTitle).toBe("Welcome to Forge Fitness");
    expect(page.theme.primaryColor).toBe("#111827");
    expect(page.theme.logoUrl).toBe("https://example.com/logo.png");
    expect(page.featureCards.map((featureCard) => featureCard.title)).toEqual([
      "Online signup",
      "Class schedule"
    ]);
    expect(page.primaryAction.disabled).toBe(false);
    expect(page.summaryLabel).toContain("2 feature sections");
  });

  it("builds a blocked state when the website builder feature is disabled", () => {
    const page = buildPublicWebsiteHomePage({
      gymName: "Forge Fitness",
      featureFlags: [FeatureFlag.OnlineSignup]
    });

    expect(page.websiteBuilderEnabled).toBe(false);
    expect(page.blockedReason).toBe("Website builder is disabled for this gym.");
    expect(page.empty?.title).toBe("Website builder unavailable");
    expect(page.primaryAction.disabled).toBe(true);
    expect(page.secondaryAction.disabled).toBe(true);
  });

  it("uses custom hero copy and custom feature cards when provided", () => {
    const page = buildPublicWebsiteHomePage({
      gymName: "Forge Fitness",
      featureFlags: [FeatureFlag.WebsiteBuilder],
      heroTitle: "Train with purpose",
      heroBody: "Custom public homepage copy.",
      featureCards: [
        {
          title: "Coaching",
          description: "Highlight coaching services.",
          href: "/coaching"
        }
      ],
      primaryActionLabel: "Join now",
      secondaryActionLabel: "Explore classes"
    });

    expect(page.heroTitle).toBe("Train with purpose");
    expect(page.heroBody).toBe("Custom public homepage copy.");
    expect(page.featureCards).toHaveLength(1);
    expect(page.featureCards[0]?.title).toBe("Coaching");
    expect(page.featureCards[0]?.actions[0]?.disabled).toBe(false);
    expect(page.primaryAction.label).toBe("Join now");
    expect(page.secondaryAction.label).toBe("Explore classes");
  });
});
