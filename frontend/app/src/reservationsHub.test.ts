import { describe, expect, it } from "vitest";
import {
  buildReservationAgendaItems,
  createClassResourceAllocationSubmission,
  createResourceReservationCancelSubmission,
  createResourceReservationSubmission,
  datetimeLocalToIso,
  isoToDatetimeLocal
} from "./reservationsHub.js";

describe("reservations hub helpers", () => {
  it("orders class and facility agenda items by start time", () => {
    const agenda = buildReservationAgendaItems({
      classes: [
        {
          id: "class-1",
          title: "Yoga",
          locationName: "Studio",
          startsAt: "2026-05-17T16:00:00.000Z",
          endsAt: "2026-05-17T17:00:00.000Z",
          capacity: 12,
          waitlistCapacity: 4,
          status: "scheduled"
        }
      ],
      facilityReservations: [
        {
          id: "reservation-1",
          resourceId: "court-1",
          memberId: "member-1",
          resourceName: "Court 1",
          memberName: "Ari Customer",
          locationName: "Main",
          startsAt: "2026-05-17T15:00:00.000Z",
          endsAt: "2026-05-17T16:00:00.000Z",
          status: "confirmed",
          paymentLabel: "unpaid / $25.00"
        }
      ]
    });

    expect(agenda.map((item) => item.id)).toEqual(["facility:reservation-1", "class:class-1"]);
    expect(agenda[0]?.customerOrCapacity).toBe("Ari Customer");
    expect(agenda[1]?.paymentLabel).toBe("Class roster");
  });

  it("creates a resource reservation payload with optional note", () => {
    const submission = createResourceReservationSubmission({
      resourceId: "resource-1",
      memberId: "member-1",
      startsAtLocal: "2026-05-17T11:00",
      endsAtLocal: "2026-05-17T12:00",
      note: "  Front desk request  "
    });

    expect(submission).toMatchObject({
      resourceId: "resource-1",
      memberId: "member-1",
      overrideConflict: false,
      note: "Front desk request"
    });
    expect(submission.startsAt).toMatch(/^2026-05-17T/);
    expect(submission.endsAt).toMatch(/^2026-05-17T/);
  });

  it("rejects missing or inverted reservation inputs", () => {
    expect(() =>
      createResourceReservationSubmission({
        resourceId: "",
        memberId: "member-1",
        startsAtLocal: "2026-05-17T11:00",
        endsAtLocal: "2026-05-17T12:00"
      })
    ).toThrow("Resource, customer, start time, and end time are required.");
    expect(() =>
      createResourceReservationSubmission({
        resourceId: "resource-1",
        memberId: "member-1",
        startsAtLocal: "2026-05-17T12:00",
        endsAtLocal: "2026-05-17T11:00"
      })
    ).toThrow("Reservation end time must be after the start time.");
  });

  it("requires an override reason when bypassing conflicts", () => {
    expect(() =>
      createResourceReservationSubmission({
        resourceId: "resource-1",
        memberId: "member-1",
        startsAtLocal: "2026-05-17T11:00",
        endsAtLocal: "2026-05-17T12:00",
        overrideConflict: true
      })
    ).toThrow("Conflict override requires a reason.");

    expect(
      createResourceReservationSubmission({
        resourceId: "resource-1",
        memberId: "member-1",
        startsAtLocal: "2026-05-17T11:00",
        endsAtLocal: "2026-05-17T12:00",
        overrideConflict: true,
        overrideReason: "Manager approved"
      }).overrideReason
    ).toBe("Manager approved");
  });

  it("creates cancel payloads only when a reason is supplied", () => {
    expect(createResourceReservationCancelSubmission({})).toEqual({});
    expect(createResourceReservationCancelSubmission({ reason: "  Weather  " })).toEqual({ reason: "Weather" });
  });

  it("pushes invalid agenda dates to the end and converts datetime helpers safely", () => {
    const agenda = buildReservationAgendaItems({
      classes: [
        {
          id: "class-invalid",
          title: "Yoga",
          locationName: "Studio",
          startsAt: "not-a-date",
          endsAt: "not-a-date",
          capacity: 12,
          waitlistCapacity: 4,
          status: "scheduled"
        }
      ],
      facilityReservations: [
        {
          id: "reservation-1",
          resourceId: "court-1",
          memberId: "member-1",
          resourceName: "Court 1",
          memberName: "Ari Customer",
          locationName: "Main",
          startsAt: "2026-05-17T15:00:00.000Z",
          endsAt: "2026-05-17T16:00:00.000Z",
          status: "confirmed",
          paymentLabel: "unpaid / $25.00"
        }
      ]
    });

    expect(agenda.map((item) => item.id)).toEqual(["facility:reservation-1", "class:class-invalid"]);
    expect(datetimeLocalToIso("not-a-date")).toBe("");
    expect(isoToDatetimeLocal("not-a-date")).toBe("");
    expect(isoToDatetimeLocal("2026-05-17T15:00:00.000Z")).toMatch(/^2026-05-17T/);
  });

  it("creates class resource allocation payloads with optional custom times", () => {
    expect(
      createClassResourceAllocationSubmission({
        resourceId: "resource-1"
      })
    ).toEqual({
      resourceId: "resource-1",
      overrideConflict: false
    });

    const timed = createClassResourceAllocationSubmission({
      resourceId: "resource-1",
      startsAtLocal: "2026-05-17T11:00",
      endsAtLocal: "2026-05-17T12:00",
      overrideConflict: true,
      overrideReason: "Owner approved"
    });

    expect(timed.startsAt).toMatch(/^2026-05-17T/);
    expect(timed.endsAt).toMatch(/^2026-05-17T/);
    expect(timed.overrideReason).toBe("Owner approved");
  });

  it("validates class resource allocation override and custom time pairs", () => {
    expect(() =>
      createClassResourceAllocationSubmission({
        resourceId: "resource-1",
        overrideConflict: true
      })
    ).toThrow("Conflict override requires a reason.");
    expect(() =>
      createClassResourceAllocationSubmission({
        resourceId: "resource-1",
        startsAtLocal: "2026-05-17T11:00"
      })
    ).toThrow("Custom allocation times require both start and end.");
    expect(() =>
      createClassResourceAllocationSubmission({
        resourceId: "resource-1",
        startsAtLocal: "2026-05-17T12:00",
        endsAtLocal: "2026-05-17T11:00"
      })
    ).toThrow("Allocation end time must be after the start time.");
    expect(() =>
      createClassResourceAllocationSubmission({
        resourceId: "resource-1",
        startsAtLocal: "not-a-date",
        endsAtLocal: "2026-05-17T11:00"
      })
    ).toThrow("Custom allocation times must be valid.");
  });
});
