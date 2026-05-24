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

  it("filters archived and out-of-scope resources and shows a disabled empty state without manage permission", () => {
    const screen = buildResourceRegistryScreen({
      resources: [
        resource(),
        { ...resource(), id: "resource-archived", name: "Court 9", status: "archived" },
        { ...resource(), id: "resource-other", locationId: "location-2", name: "Court 2" }
      ],
      permissions: [],
      locationId: "location-2"
    });

    expect(screen.rows).toHaveLength(1);
    expect(screen.rows[0]?.id).toBe("resource-other");
    expect(screen.createAction.disabled).toBe(true);

    const empty = buildResourceRegistryScreen({
      resources: [{ ...resource(), status: "archived" }],
      permissions: []
    });

    expect(empty.empty?.title).toBe("No reservable resources");
    expect(empty.empty?.action).toBeUndefined();
  });

  it("blocks resource creation without permission and normalizes free resource submissions", () => {
    const noPermission = buildResourceCreateScreen({
      permissions: [],
      locationId: "location-1",
      name: "Court 2",
      resourceType: "court",
      amountCents: "2500"
    });
    const invalidAmount = buildResourceCreateScreen({
      permissions: [Permission.LocationUpdate],
      locationId: "location-1",
      name: "Court 2",
      resourceType: "court",
      amountCents: "abc"
    });
    const freeSubmission = createResourceSubmission({
      locationId: "location-1",
      linkedStaffUserId: "staff-1",
      name: "  Recovery Chair  ",
      resourceType: "  massage_chair  ",
      amountCents: "-25"
    });

    expect(noPermission.canSubmit).toBe(false);
    expect(noPermission.action.disabled).toBe(true);
    expect(invalidAmount.canSubmit).toBe(true);
    expect(invalidAmount.fields.amountCents.value).toBe("abc");
    expect(freeSubmission).toMatchObject({
      linkedStaffUserId: "staff-1",
      name: "Recovery Chair",
      resourceType: "massage_chair",
      pricing: { amountCents: 0 },
      paymentRequirement: ReservationPaymentRequirement.Free
    });
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

  it("filters reservation create options and blocks invalid submissions", () => {
    const create = buildFacilityReservationCreateScreen({
      resources: [
        resource(),
        { ...resource(), id: "resource-archived", status: "archived" },
        { ...resource(), id: "resource-hidden", isBookable: false, name: "Storage" }
      ],
      members: [{ id: "member-1", firstName: "Ari", lastName: "Customer" }],
      permissions: [Permission.BookingRead],
      resourceId: "resource-1",
      memberId: "member-1",
      startsAt: "2026-05-17T18:00:00.000Z",
      endsAt: "2026-05-17T17:00:00.000Z",
      note: "  Front desk note  "
    });
    const submission = createFacilityReservationSubmission({
      resourceId: "resource-1",
      memberId: "member-1",
      startsAt: "2026-05-17T17:00:00.000Z",
      endsAt: "2026-05-17T18:00:00.000Z",
      note: "  Front desk note  "
    });

    expect(create.resourceOptions).toHaveLength(1);
    expect(create.canSubmit).toBe(false);
    expect(create.action.disabled).toBe(true);
    expect(create.fields.note.value).toBe("Front desk note");
    expect(submission.note).toBe("Front desk note");
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

  it("disables reservation cancellation when permissions or status block it", () => {
    const cancelled = buildFacilityReservationDetailScreen({
      reservation: { ...reservation(), status: "cancelled" },
      permissions: [Permission.BookingWrite]
    });
    const readOnly = buildFacilityReservationDetailScreen({
      reservation: reservation(),
      permissions: [Permission.BookingRead]
    });
    const cancel = createFacilityReservationCancelSubmission({ reason: "   " });
    const allocation = createClassResourceAllocationSubmission({
      resourceId: "resource-1"
    });

    expect(cancelled.cancelAction.disabled).toBe(true);
    expect(readOnly.resourceName).toBe("resource-1");
    expect(readOnly.memberName).toBe("member-1");
    expect(readOnly.paymentLabel).toBe("unpaid ($25.00)");
    expect(readOnly.cancelAction.disabled).toBe(true);
    expect(cancel).toEqual({});
    expect(allocation).toEqual({
      resourceId: "resource-1",
      overrideConflict: false
    });
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
