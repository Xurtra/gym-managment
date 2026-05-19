import { LocationStatus, MembershipStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { applyLocationReportingFilters, buildAddressValidationFields, buildDashboardLocationSwitcher, buildLocationAccessRulesScreen, buildLocationBusinessHoursEditor, buildLocationClassRoomManagement, buildLocationDetailPage, buildLocationListPage, buildLocationMapLink, buildLocationReportingView, buildMultiLocationMemberAccessSetting, buildPublicScheduleLocationSwitcher } from "./index.js";
const locations = [
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
const rooms = [
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
const accessRules = [
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
            location: locations[0],
            rooms,
            accessRules
        });
        expect(list.summary.activeCount).toBe(2);
        expect(list.summary.archivedCount).toBe(1);
        expect(list.summary.visibleCount).toBe(2);
        expect(list.selectedLocation?.id).toBe("location-1");
        expect(list.rows[0]?.name).toBe("Downtown Annex");
        expect(list.rows[0]?.detailHref).toBe("/locations/location-2");
        expect(list.rows[1]?.phoneLabel).toBe("555-0100");
        expect(list.createLocationAction.disabled).toBe(false);
        expect(detail.title).toBe("Main Floor");
        expect(detail.addressLabel).toContain("100 Fitness Ave");
        expect(detail.phoneLabel).toBe("555-0100");
        expect(detail.statusLabel).toBe(LocationStatus.Active);
        expect(detail.mapLink.href).toContain("google.com/maps");
        expect(detail.rooms).toHaveLength(1);
        expect(detail.roomManagement.rooms).toHaveLength(1);
        expect(detail.accessRules).toHaveLength(1);
        expect(detail.accessRuleScreen.rules).toHaveLength(1);
        expect(detail.card.body).toContain("America/New_York");
        expect(detail.archiveAction.disabled).toBe(false);
        expect(detail.businessHours.canSubmit).toBe(true);
    });
    it("builds archived detail state with archive disabled and empty scoped modules", () => {
        const archivedDetail = buildLocationDetailPage({
            location: locations[2],
            rooms,
            accessRules
        });
        expect(archivedDetail.canArchive).toBe(false);
        expect(archivedDetail.archiveAction.disabled).toBe(true);
        expect(archivedDetail.roomManagement.rooms).toHaveLength(0);
        expect(archivedDetail.accessRuleScreen.rules).toHaveLength(0);
        expect(archivedDetail.phoneLabel).toBe("No phone listed");
    });
    it("builds empty location list state and falls back to the first active selection", () => {
        const archivedOnly = buildLocationListPage([locations[2]], "missing");
        const fallbackSelected = buildLocationListPage(locations, "missing");
        expect(archivedOnly.rows).toHaveLength(0);
        expect(archivedOnly.empty?.title).toBe("No active locations");
        expect(archivedOnly.empty?.body).toMatch(/archived locations/i);
        expect(fallbackSelected.selectedLocation?.id).toBe("location-1");
    });
    it("validates address fields and builds map links", () => {
        const valid = buildAddressValidationFields({
            line1: " 100 Fitness Ave ",
            line2: " Suite 200 ",
            city: " New York ",
            region: " NY ",
            postalCode: " 10001 ",
            country: " us "
        });
        const invalid = buildAddressValidationFields({
            line1: "",
            city: "New York",
            region: "",
            postalCode: "",
            country: "usa"
        });
        const mapLink = buildLocationMapLink(locations[0].address);
        expect(valid.canSubmit).toBe(true);
        expect(valid.errorCount).toBe(0);
        expect(valid.normalizedAddress.line2).toBe("Suite 200");
        expect(valid.normalizedAddress.country).toBe("US");
        expect(valid.fieldLookup.country.value).toBe("US");
        expect(valid.missingRequiredFields).toEqual([]);
        expect(invalid.canSubmit).toBe(false);
        expect(invalid.errorCount).toBe(4);
        expect(invalid.errors.line1).toMatch(/required/i);
        expect(invalid.errors.region).toMatch(/required/i);
        expect(invalid.errors.postalCode).toMatch(/required/i);
        expect(invalid.errors.country).toMatch(/two-letter/i);
        expect(invalid.missingRequiredFields).toEqual(["line1", "region", "postalCode"]);
        expect(mapLink.label).toBe("Open in maps");
        expect(mapLink.shortLabel).toBe("Maps");
        expect(mapLink.address).toContain("100 Fitness Ave");
        expect(mapLink.query).toContain("100%20Fitness%20Ave");
        expect(mapLink.href).toContain("100%20Fitness%20Ave");
        expect(mapLink.external).toBe(true);
    });
    it("builds business hours and room management states", () => {
        const validHours = buildLocationBusinessHoursEditor({
            mon: [{ opensAt: "06:00", closesAt: "22:00" }]
        });
        const invalidHours = buildLocationBusinessHoursEditor({
            tue: [{ opensAt: "22:00", closesAt: "06:00" }],
            wed: [{ opensAt: "bad", closesAt: "12:00" }]
        });
        const emptyHours = buildLocationBusinessHoursEditor({});
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
        const emptyRooms = buildLocationClassRoomManagement({
            locationId: "location-3",
            rooms
        });
        expect(validHours.canSubmit).toBe(true);
        expect(validHours.validRowCount).toBe(1);
        expect(validHours.summaryLabel).toBe("1 valid hours block");
        expect(validHours.coveredDays).toEqual(["mon"]);
        expect(validHours.rows[0]?.dayLabel).toBe("Monday");
        expect(invalidHours.canSubmit).toBe(false);
        expect(invalidHours.invalidRowCount).toBe(2);
        expect(invalidHours.invalidRows[0]?.error).toMatch(/closing time/i);
        expect(invalidHours.invalidRows[1]?.error).toMatch(/hh:mm/i);
        expect(invalidHours.saveAction.disabled).toBe(true);
        expect(emptyHours.empty?.title).toBe("No business hours configured");
        expect(emptyHours.table.empty?.title).toBe("No business hours configured");
        expect(roomsScreen.canSubmit).toBe(true);
        expect(roomsScreen.draftName).toBe("Studio B");
        expect(roomsScreen.roomCount).toBe(1);
        expect(roomsScreen.totalSessionCount).toBe(3);
        expect(roomsScreen.rooms[0]?.nextSessionLabel).toBe("2026-05-18T14:00:00.000Z");
        expect(duplicateRoom.canSubmit).toBe(false);
        expect(duplicateRoom.duplicateRoomName).toBe("Studio A");
        expect(emptyRooms.empty?.title).toBe("No rooms configured");
        expect(emptyRooms.table.empty?.title).toBe("No rooms configured");
    });
    it("builds location-scoped access rules and member multi-location access", () => {
        const rulesScreen = buildLocationAccessRulesScreen({
            locationId: "location-1",
            rules: accessRules
        });
        const emptyRulesScreen = buildLocationAccessRulesScreen({
            locationId: "location-3",
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
        const deniedAccess = buildMultiLocationMemberAccessSetting({
            locations: locations.slice(0, 2),
            accessRules,
            memberships: [],
            now: new Date("2026-05-16T12:00:00.000Z")
        });
        const emptyAccess = buildMultiLocationMemberAccessSetting({
            locations: [],
            accessRules,
            memberships: []
        });
        expect(rulesScreen.rules).toHaveLength(1);
        expect(rulesScreen.totalRuleCount).toBe(1);
        expect(rulesScreen.planRuleCount).toBe(1);
        expect(rulesScreen.summaryLabel).toBe("1 access rule");
        expect(rulesScreen.rules[0]?.planLabel).toBe("Monthly Unlimited");
        expect(rulesScreen.rules[0]?.scopeLabel).toBe("Membership-specific");
        expect(emptyRulesScreen.empty?.title).toBe("No access rules");
        expect(access.multiLocation).toBe(true);
        expect(access.allowedLocationIds).toEqual(["location-1", "location-2"]);
        expect(access.allowedCount).toBe(2);
        expect(access.deniedCount).toBe(0);
        expect(access.summaryLabel).toBe("2 of 2 locations accessible");
        expect(access.locations[0]?.accessLabel).toBe("Allowed");
        expect(access.locations[0]?.matchedRuleCount).toBe(1);
        expect(access.locations[0]?.reasonLabel).toContain("Unlimited members");
        expect(access.locations[1]?.reasonLabel).toContain("All active annex");
        expect(access.table.rows).toHaveLength(2);
        expect(deniedAccess.allowedLocationIds).toEqual([]);
        expect(deniedAccess.allowedCount).toBe(0);
        expect(deniedAccess.deniedCount).toBe(2);
        expect(deniedAccess.summaryLabel).toBe("0 of 2 locations accessible");
        expect(deniedAccess.locations[0]?.accessLabel).toBe("Restricted");
        expect(deniedAccess.locations[0]?.reasonLabel).toBe("No active memberships");
        expect(emptyAccess.summaryLabel).toBe("No locations configured");
        expect(emptyAccess.empty?.title).toBe("No locations available");
        expect(emptyAccess.table.empty?.title).toBe("No locations available");
    });
    it("builds dashboard and public schedule location switchers", () => {
        const dashboard = buildDashboardLocationSwitcher(locations, "location-2");
        const fallbackDashboard = buildDashboardLocationSwitcher(locations, "missing");
        const emptyDashboard = buildDashboardLocationSwitcher([locations[2]]);
        const publicSchedule = buildPublicScheduleLocationSwitcher(locations, "location-1");
        const fallbackPublicSchedule = buildPublicScheduleLocationSwitcher(locations, "missing");
        const emptyPublicSchedule = buildPublicScheduleLocationSwitcher([locations[2]]);
        expect(dashboard.selectedLocationId).toBe("location-2");
        expect(dashboard.selectedLocationName).toBe("Downtown Annex");
        expect(dashboard.optionCount).toBe(2);
        expect(dashboard.options).toHaveLength(2);
        expect(fallbackDashboard.selectedLocationId).toBe("location-1");
        expect(emptyDashboard.empty?.title).toBe("No active locations");
        expect(publicSchedule.options[0]?.id).toBe("all");
        expect(publicSchedule.selectedLocationName).toBe("Main Floor");
        expect(publicSchedule.optionCount).toBe(3);
        expect(publicSchedule.options.find((option) => option.id === "location-1")?.active).toBe(true);
        expect(fallbackPublicSchedule.options[0]?.active).toBe(true);
        expect(emptyPublicSchedule.empty?.title).toBe("No public locations");
    });
    it("applies location-based reporting filters", () => {
        const records = [
            {
                id: "record-1",
                locationId: "location-1",
                locationName: "Main Floor",
                metric: "visits",
                value: 12,
                occurredAt: "2026-05-18T09:00:00.000Z"
            },
            {
                id: "record-2",
                locationId: "location-2",
                locationName: "Downtown Annex",
                metric: "visits",
                value: 4,
                occurredAt: "2026-05-19T09:00:00.000Z"
            },
            {
                id: "record-3",
                metric: "visits",
                value: 1,
                occurredAt: "2026-05-17T09:00:00.000Z"
            }
        ];
        const filtered = applyLocationReportingFilters(records, ["location-2"]);
        const view = buildLocationReportingView({
            locations: locations.slice(0, 2),
            records,
            selectedLocationIds: ["location-1"]
        });
        const invalidSelectionView = buildLocationReportingView({
            locations: locations.slice(0, 2),
            records,
            selectedLocationIds: ["missing"]
        });
        const emptyFilteredView = buildLocationReportingView({
            locations: locations.slice(0, 2),
            records: [records[0]],
            selectedLocationIds: ["location-2"]
        });
        const emptyLocationView = buildLocationReportingView({
            locations: [],
            records: []
        });
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe("record-2");
        expect(view.records).toHaveLength(1);
        expect(view.records[0]?.id).toBe("record-1");
        expect(view.filters.multiLocation).toBe(true);
        expect(view.filters.optionCount).toBe(2);
        expect(view.filters.selectedCount).toBe(1);
        expect(view.filters.summaryLabel).toBe("1 location selected");
        expect(view.filters.options[0]?.label).toBe("Downtown Annex");
        expect(view.filters.options[0]?.recordCount).toBe(1);
        expect(view.filters.options[1]?.selected).toBe(true);
        expect(view.summary.totalCount).toBe(3);
        expect(view.summary.visibleCount).toBe(1);
        expect(view.summary.selectedLocationCount).toBe(1);
        expect(view.summary.unassignedCount).toBe(1);
        expect(invalidSelectionView.filters.selectedLocationIds).toEqual([]);
        expect(invalidSelectionView.filters.summaryLabel).toBe("All locations");
        expect(invalidSelectionView.records[0]?.id).toBe("record-2");
        expect(invalidSelectionView.records[1]?.id).toBe("record-1");
        expect(emptyFilteredView.filters.selectedLocationIds).toEqual(["location-2"]);
        expect(emptyFilteredView.empty?.title).toBe("No reporting records match these locations");
        expect(emptyFilteredView.table.empty?.title).toBe("No reporting records match these locations");
        expect(emptyLocationView.filters.empty?.title).toBe("No reporting locations");
        expect(emptyLocationView.summary.totalCount).toBe(0);
        expect(emptyLocationView.empty?.title).toBe("No reporting records");
        expect(emptyLocationView.table.empty?.title).toBe("No reporting records");
    });
});
//# sourceMappingURL=locationDashboard.test.js.map