import { Permission, ReservationConfirmationMode, ReservationPaymentRequirement } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  buildFacilityReservationCreateScreen,
  buildFacilityReservationDetailScreen,
  buildResourceAvailabilityScreen,
  buildResourceCreateScreen,
  buildResourceRegistryScreen,
  createClassResourceAllocationSubmission,
  createFacilityReservationCancelSubmission,
  createFacilityReservationSubmission,
  createResourceSubmission,
  type FacilityReservationView,
  type ResourceView
} from "./index.js";

describe("reservation dashboard models", () => {
  it("builds resource registry and create submissions", () => {
    const screen = buildResourceRegistryScreen({
      resources: [resource()],
      permissions: [Permission.LocationUpdate]
    });
    const create = buildResourceCreateScreen({
      permissions: [Permission.LocationUpdate],
      locationId: "location-1",
      name: "Court 2",
      resourceType: "court",
      amountCents: "2500"
    });
    const submission = createResourceSubmission({
      locationId: "location-1",
      name: "Court 2",
      resourceType: "court",
      amountCents: "2500"
    });

    expect(screen.rows[0]?.pricingLabel).toBe("$25.00");
    expect(create.canSubmit).toBe(true);
    expect(submission.paymentRequirement).toBe(ReservationPaymentRequirement.PayLater);
  });

  it("builds availability and facility reservation screens", () => {
    const availability = buildResourceAvailabilityScreen({
      resource: resource(),
      allocations: [{ id: "alloc-1", startsAt: "2026-05-17T15:00:00.000Z", endsAt: "2026-05-17T16:00:00.000Z", source: "class_session" }],
      available: false
    });
    const create = buildFacilityReservationCreateScreen({
      resources: [resource()],
      members: [{ id: "member-1", firstName: "Ari", lastName: "Customer" }],
      permissions: [Permission.BookingWrite],
      resourceId: "resource-1",
      memberId: "member-1",
      startsAt: "2026-05-17T17:00:00.000Z",
      endsAt: "2026-05-17T18:00:00.000Z"
    });
    const submission = createFacilityReservationSubmission({
      resourceId: "resource-1",
      memberId: "member-1",
      startsAt: "2026-05-17T17:00:00.000Z",
      endsAt: "2026-05-17T18:00:00.000Z"
    });

    expect(availability.available).toBe(false);
    expect(create.canSubmit).toBe(true);
    expect(submission.memberId).toBe("member-1");
  });

  it("builds detail/cancel and class allocation submissions", () => {
    const detail = buildFacilityReservationDetailScreen({
      reservation: reservation(),
      resource: resource(),
      member: { id: "member-1", firstName: "Ari", lastName: "Customer" },
      permissions: [Permission.BookingWrite]
    });
    const cancel = createFacilityReservationCancelSubmission({ reason: "Weather" });
    const allocation = createClassResourceAllocationSubmission({
      resourceId: "resource-1",
      overrideConflict: true,
      overrideReason: "Approved"
    });

    expect(detail.resourceName).toBe("Court 1");
    expect(detail.cancelAction.disabled).toBe(false);
    expect(cancel.reason).toBe("Weather");
    expect(allocation.overrideReason).toBe("Approved");
  });
});

function resource(): ResourceView {
  return {
    id: "resource-1",
    locationId: "location-1",
    name: "Court 1",
    resourceType: "court",
    status: "active",
    isBookable: true,
    isExclusive: true,
    capacity: 1,
    amenities: ["padding"],
    pricing: { amountCents: 2500 },
    paymentRequirement: ReservationPaymentRequirement.PayLater,
    confirmationMode: ReservationConfirmationMode.Automatic
  };
}

function reservation(): FacilityReservationView {
  return {
    id: "reservation-1",
    resourceId: "resource-1",
    memberId: "member-1",
    status: "confirmed",
    startsAt: "2026-05-17T17:00:00.000Z",
    endsAt: "2026-05-17T18:00:00.000Z",
    amountCents: 2500,
    paymentRequirement: ReservationPaymentRequirement.PayLater,
    paymentStatus: "unpaid",
    cancellationFeeCents: 0,
    refundAmountCents: 0
  };
}
