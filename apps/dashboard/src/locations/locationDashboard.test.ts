import { LocationStatus, MembershipStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  applyLocationReportingFilters,
  buildAddressValidationFields,
  buildDashboardLocationSwitcher,
  buildLocationAccessRulesScreen,
  buildLocationBusinessHoursEditor,
  buildLocationClassRoomManagement,
  buildLocationDetailPage,
  buildLocationListPage,
  buildLocationMapLink,
  buildLocationReportingView,
  buildMultiLocationMemberAccessSetting,
  buildPublicScheduleLocationSwitcher
} from "./index.js";
import type { LocationAccessRuleView, LocationRoomView, LocationView } from "./index.js";

const locations: LocationView[] = [
  {
    id: "location-1",
    name: "Main Floor",
    address: {
      line1: "100 Fitness Ave",
      city: "New York",
      region: "NY",
      postalCode: "10001",
      country: "US"
    },
    timezone: "America/New_York",
    phone: "555-0100",
    operatingHours: {
      mon: [{ opensAt: "06:00", closesAt: "22:00" }]
    },
    status: LocationStatus.Active
  },
  {
    id: "location-2",
    name: "Downtown Annex",
    address: {
      line1: "200 Market St",
      city: "New York",
      region: "NY",
      postalCode: "10002",
      country: "US"
    },
    timezone: "America/New_York",
    operatingHours: {
      tue: [{ opensAt: "07:00", closesAt: "21:00" }]
    },
    status: LocationStatus.Active
  },
  {
    id: "location-3",
    name: "Archived Studio",
    address: {
      line1: "300 Old Rd",
      city: "New York",
      region: "NY",
      postalCode: "10003",
      country: "US"
    },
    timezone: "America/New_York",
    operatingHours: {},
    status: LocationStatus.Archived
  }
];

const rooms: LocationRoomView[] = [
  {
    locationId: "location-1",
    name: "Studio A",
    sessionCount: 3,
    nextSessionAt: "2026-05-18T14:00:00.000Z"
  },
  {
    locationId: "location-2",
    name: "Lift Lab",
    sessionCount: 1
  }
];

const accessRules: LocationAccessRuleView[] = [
  {
    id: "rule-1",
    name: "Unlimited members",
    locationId: "location-1",
    planId: "plan-1",
    planName: "Monthly Unlimited",
    allowAllActiveMembers: false
  },
  {
    id: "rule-2",
    name: "All active annex",
    locationId: "location-2",
    allowAllActiveMembers: true
  }
];

describe("location dashboard logic", () => {
  it("builds the list and detail page models", () => {
    const list = buildLocationListPage(locations, "location-1");
    const detail = buildLocationDetailPage({
      location: locations[0] as LocationView,
      rooms,
      accessRules
    });

    expect(list.activeCount).toBe(2);
    expect(list.archivedCount).toBe(1);
    expect(list.selectedLocation?.id).toBe("location-1");
    expect(detail.mapLink.href).toContain("google.com/maps");
    expect(detail.rooms).toHaveLength(1);
    expect(detail.accessRules).toHaveLength(1);
    expect(detail.businessHours.canSubmit).toBe(true);
  });

  it("validates address fields and builds map links", () => {
    const invalid = buildAddressValidationFields({
      line1: "",
      city: "New York",
      region: "NY",
      postalCode: "10001",
      country: "usa"
    });
    const mapLink = buildLocationMapLink(locations[0]!.address);

    expect(invalid.canSubmit).toBe(false);
    expect(invalid.errors.line1).toMatch(/required/i);
    expect(invalid.errors.country).toMatch(/two-letter/i);
    expect(mapLink.address).toContain("100 Fitness Ave");
    expect(mapLink.href).toContain("100%20Fitness%20Ave");
  });

  it("builds business hours and room management states", () => {
    const validHours = buildLocationBusinessHoursEditor({
      mon: [{ opensAt: "06:00", closesAt: "22:00" }]
    });
    const invalidHours = buildLocationBusinessHoursEditor({
      tue: [{ opensAt: "22:00", closesAt: "06:00" }]
    });
    const roomsScreen = buildLocationClassRoomManagement({
      locationId: "location-1",
      rooms,
      draftName: " Studio B "
    });
    const duplicateRoom = buildLocationClassRoomManagement({
      locationId: "location-1",
      rooms,
      draftName: "studio a"
    });

    expect(validHours.canSubmit).toBe(true);
    expect(invalidHours.canSubmit).toBe(false);
    expect(roomsScreen.canSubmit).toBe(true);
    expect(roomsScreen.draftName).toBe("Studio B");
    expect(duplicateRoom.canSubmit).toBe(false);
  });

  it("builds location-scoped access rules and member multi-location access", () => {
    const rulesScreen = buildLocationAccessRulesScreen({
      locationId: "location-1",
      rules: accessRules
    });
    const access = buildMultiLocationMemberAccessSetting({
      locations: locations.slice(0, 2),
      accessRules,
      memberships: [
        {
          planId: "plan-1",
          status: MembershipStatus.Active,
          startsAt: "2026-05-01T00:00:00.000Z"
        }
      ],
      now: new Date("2026-05-16T12:00:00.000Z")
    });

    expect(rulesScreen.rules).toHaveLength(1);
    expect(rulesScreen.planRuleCount).toBe(1);
    expect(access.multiLocation).toBe(true);
    expect(access.allowedLocationIds).toEqual(["location-1", "location-2"]);
  });

  it("builds dashboard and public schedule location switchers", () => {
    const dashboard = buildDashboardLocationSwitcher(locations, "location-2");
    const publicSchedule = buildPublicScheduleLocationSwitcher(locations, "location-1");

    expect(dashboard.selectedLocationId).toBe("location-2");
    expect(dashboard.options).toHaveLength(2);
    expect(publicSchedule.options[0]?.id).toBe("all");
    expect(publicSchedule.options.find((option) => option.id === "location-1")?.active).toBe(true);
  });

  it("applies location-based reporting filters", () => {
    const records = [
      { id: "record-1", locationId: "location-1", locationName: "Main Floor", metric: "visits", value: 12 },
      {
        id: "record-2",
        locationId: "location-2",
        locationName: "Downtown Annex",
        metric: "visits",
        value: 4
      }
    ];
    const filtered = applyLocationReportingFilters(records, ["location-2"]);
    const view = buildLocationReportingView({
      locations: locations.slice(0, 2),
      records,
      selectedLocationIds: ["location-1"]
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("record-2");
    expect(view.records).toHaveLength(1);
    expect(view.filters.multiLocation).toBe(true);
  });
});
