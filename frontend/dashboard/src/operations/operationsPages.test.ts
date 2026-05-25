import { describe, expect, it } from "vitest";
import {
  buildLocationsOperationsPage,
  buildPortalOperationsPage,
  buildReportsOperationsPage,
  type OperationsWorkspaceView
} from "./index.js";

describe("operations dashboard pages", () => {
  it("builds location create state and selected-resource summaries", () => {
    const page = buildLocationsOperationsPage(workspace());

    expect(page.canCreateLocation).toBe(true);
    expect(page.canCreateResource).toBe(true);
    expect(page.roster.locations).toHaveLength(1);
    expect(page.selectedLocation.metrics.find((metric) => metric.label === "Rooms")?.value).toBe("1");
    expect(page.resources.products[0]?.priceLabel).toBe("$25.00");
  });

  it("builds portal routes from neutral data", () => {
    const page = buildPortalOperationsPage(workspace());

    expect(page.portal.routes.map((route) => route.href)).toEqual(["/", "/classes", "/billing", "/check-in"]);
    expect(page.publicPages.metrics.find((metric) => metric.label === "Slug")?.value).toBe("demo");
  });

  it("builds report rows without React", () => {
    const page = buildReportsOperationsPage(workspace());

    expect(page.payrollTable.rows[0]).toEqual(["Avery Coach", "Trainer", "1", "2.00"]);
    expect(page.timeClockMetrics.find((metric) => metric.label === "Total hours")?.value).toBe("2.00");
  });
});

function workspace(): OperationsWorkspaceView {
  return {
    gym: { id: "gym-1", name: "Demo Gym", slug: "demo" },
    platformAdmin: false,
    permissions: ["location:create", "location:update"],
    members: [{ id: "member-1", firstName: "Jamie", lastName: "Member", email: "jamie@example.com", status: "active" }],
    classTypes: [{ id: "type-1", name: "Training" }],
    locations: [{ id: "location-1", name: "Main Club" }],
    trainers: [{ id: "trainer-1", fullName: "Avery Coach" }],
    classSessions: [{ classTypeId: "type-1", trainerUserId: "trainer-1", startsAt: "2026-05-25T12:00:00.000Z", capacity: 4 }],
    plans: [{ id: "plan-1", name: "PT Pack", priceCents: 5000 }],
    resources: [
      {
        id: "resource-1",
        locationId: "location-1",
        name: "Room A",
        resourceType: "room",
        status: "active",
        capacity: 8,
        pricing: { amountCents: 2500 }
      }
    ],
    reservations: [
      {
        id: "reservation-1",
        resourceId: "resource-1",
        locationId: "location-1",
        memberId: "member-1",
        status: "confirmed",
        startsAt: "2026-05-25T13:00:00.000Z",
        endsAt: "2026-05-25T14:00:00.000Z",
        amountCents: 2500
      }
    ],
    staff: [
      {
        userId: "trainer-1",
        firstName: "Avery",
        lastName: "Coach",
        email: "avery@example.com",
        roleName: "Trainer",
        status: "active"
      }
    ],
    roles: [{ id: "role-1", name: "Trainer", permissions: ["class:read"], createsReservableResource: true }],
    timeEntries: [{ userId: "trainer-1", clockedInAt: "2026-05-25T10:00:00.000Z", clockedOutAt: "2026-05-25T12:00:00.000Z" }],
    stripeAccount: { chargesEnabled: true }
  };
}
