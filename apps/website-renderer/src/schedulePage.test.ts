import { ClassSessionStatus, FeatureFlag } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildPublicSchedulePage } from "./index.js";

describe("website builder schedule page", () => {
  it("builds a sorted public schedule with location filtering", () => {
    const page = buildPublicSchedulePage({
      featureFlags: [FeatureFlag.WebsiteBuilder],
      selectedLocationId: "location-1",
      sessions: [
        {
          id: "session-2",
          classTypeName: "Yoga Flow",
          locationId: "location-2",
          locationName: "North Studio",
          startsAt: "2026-05-20T15:00:00.000Z",
          endsAt: "2026-05-20T16:00:00.000Z",
          status: ClassSessionStatus.Scheduled,
          trainerName: "Jordan"
        },
        {
          id: "session-1",
          classTypeName: "Strength Basics",
          locationId: "location-1",
          locationName: "Main Floor",
          startsAt: "2026-05-20T13:00:00.000Z",
          endsAt: "2026-05-20T14:00:00.000Z",
          status: ClassSessionStatus.Scheduled,
          roomName: "Room A",
          trainerName: "Alex",
          spotsRemaining: 6
        }
      ]
    });

    expect(page.websiteBuilderEnabled).toBe(true);
    expect(page.selectedLocationId).toBe("location-1");
    expect(page.locationOptions).toHaveLength(2);
    expect(page.sessionCards).toHaveLength(1);
    expect(page.sessionCards[0]?.title).toBe("Strength Basics");
    expect(page.sessionCards[0]?.availabilityLabel).toBe("6 spots left");
    expect(page.summaryLabel).toContain("Main Floor");
  });

  it("builds a blocked state when the website builder feature is disabled", () => {
    const page = buildPublicSchedulePage({
      featureFlags: [],
      sessions: []
    });

    expect(page.websiteBuilderEnabled).toBe(false);
    expect(page.blockedReason).toBe("Website builder is disabled for this gym.");
    expect(page.empty?.title).toBe("Schedule unavailable");
    expect(page.primaryAction.disabled).toBe(true);
  });

  it("builds an empty filtered state when no sessions match the selected location", () => {
    const page = buildPublicSchedulePage({
      featureFlags: [FeatureFlag.WebsiteBuilder],
      selectedLocationId: "location-2",
      sessions: [
        {
          id: "session-1",
          classTypeName: "Strength Basics",
          locationId: "location-1",
          locationName: "Main Floor",
          startsAt: "2026-05-20T13:00:00.000Z",
          endsAt: "2026-05-20T14:00:00.000Z",
          status: ClassSessionStatus.Scheduled
        }
      ]
    });

    expect(page.sessionCards).toHaveLength(0);
    expect(page.empty?.title).toBe("No classes for this location");
  });
});
