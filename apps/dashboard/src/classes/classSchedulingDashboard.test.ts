import { describe, expect, it } from "vitest";
import { ClassSessionStatus, Permission } from "@gym-platform/constants";
import {
  buildClassSessionCancelScreen,
  buildClassSessionDetailPage,
  buildClassSessionCreateScreen,
  buildClassSessionEditScreen,
  buildClassSessionListPage,
  createClassSessionEditSubmission,
  createClassSessionSubmission,
  type ClassLocationView,
  type ClassSessionView,
  type ClassTrainerView,
  type ClassTypeView
} from "./index.js";

describe("buildClassSessionListPage", () => {
  it("builds a filtered class-session list with summary metadata", () => {
    const screen = buildClassSessionListPage({
      sessions: buildSessions(),
      classTypes: buildClassTypes(),
      locations: buildLocations(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite],
      filters: {
        query: "strength",
        locationId: "loc-main",
        status: ClassSessionStatus.Scheduled
      }
    });

    expect(screen.screen).toBe("class_session_list");
    expect(screen.rowCount).toBe(1);
    expect(screen.activeFilterCount).toBe(3);
    expect(screen.locationOptionCount).toBe(2);
    expect(screen.statusOptionCount).toBe(3);
    expect(screen.summary.totalCount).toBe(3);
    expect(screen.summary.scheduledCount).toBe(1);
    expect(screen.summary.completedCount).toBe(1);
    expect(screen.summary.cancelledCount).toBe(1);
    expect(screen.summary.visibleCount).toBe(1);
    expect(screen.summaryLabel).toBe("Showing 1 of 3 class sessions");
    expect(screen.rows[0]).toMatchObject({
      className: "Strength Foundations",
      locationName: "Main Floor",
      trainerName: "Demo Owner",
      roomLabel: "Studio A",
      capacityLabel: "12 spots, 3 waitlist",
      visibilityLabel: "Public",
      detailHref: "/classes/session-1"
    });
    expect(screen.rows[0]?.actions.map((action) => action.href)).toEqual([
      "/classes/session-1",
      "/classes/session-1/edit",
      "/classes/session-1/cancel"
    ]);
    expect(screen.rows[0]?.actions[2]?.button.disabled).toBe(false);
    expect(screen.createSessionAction.disabled).toBe(false);
    expect(screen.empty).toBeUndefined();
  });

  it("builds read-only empty state when no class sessions match", () => {
    const screen = buildClassSessionListPage({
      sessions: buildSessions(),
      classTypes: buildClassTypes(),
      locations: buildLocations(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead],
      filters: {
        locationId: "loc-annex",
        status: ClassSessionStatus.Scheduled
      }
    });

    expect(screen.rowCount).toBe(0);
    expect(screen.activeFilterCount).toBe(2);
    expect(screen.empty).toMatchObject({
      title: "No classes match your filters",
      body: "Adjust the class schedule filters and try again."
    });
    expect(screen.createSessionAction.disabled).toBe(true);
    expect(screen.table.empty?.title).toBe("No classes match your filters");
  });

  it("builds a class-session detail page with section metadata", () => {
    const detail = buildClassSessionDetailPage({
      session: buildSessions()[0]!,
      classTypes: buildClassTypes(),
      locations: buildLocations(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite]
    });

    expect(detail.screen).toBe("class_session_detail");
    expect(detail.className).toBe("Strength Foundations");
    expect(detail.locationName).toBe("Main Floor");
    expect(detail.trainerName).toBe("Demo Owner");
    expect(detail.roomLabel).toBe("Studio A");
    expect(detail.visibilityLabel).toBe("Public");
    expect(detail.statusLabel).toBe("Scheduled");
    expect(detail.durationLabel).toBe("60 minutes");
    expect(detail.sectionCount).toBe(3);
    expect(detail.actionCount).toBe(3);
    expect(detail.summaryLabel).toBe("Strength Foundations is scheduled at Main Floor");
    expect(detail.sections[0]?.details).toEqual(
      expect.arrayContaining([
        { key: "class", label: "Class", value: "Strength Foundations" },
        { key: "trainer", label: "Trainer", value: "Demo Owner" }
      ])
    );
    expect(detail.actions.map((action) => action.href)).toEqual([
      "/classes",
      "/classes/session-1/edit",
      "/classes/session-1/cancel"
    ]);
    expect(detail.actions[2]?.button.disabled).toBe(false);
  });

  it("builds class-session create validation and normalized submission", () => {
    const screen = buildClassSessionCreateScreen({
      classTypes: buildClassTypes(),
      locations: buildLocations(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite],
      classTypeId: "type-1",
      locationId: "loc-main",
      trainerUserId: "trainer-1",
      roomName: " Studio A ",
      startsAt: "2026-05-20T14:00:00.000Z",
      endsAt: "2026-05-20T15:00:00.000Z",
      capacity: "12",
      waitlistCapacity: "3",
      cancellationCutoffMinutes: "120",
      lateCancellationFeeCents: "1500"
    });

    expect(screen.screen).toBe("class_session_create");
    expect(screen.selectedClassTypeId).toBe("type-1");
    expect(screen.selectedLocationId).toBe("loc-main");
    expect(screen.selectedTrainerUserId).toBe("trainer-1");
    expect(screen.canSubmit).toBe(true);
    expect(screen.summaryLabel).toBe(
      "Strength Foundations at Main Floor on 2026-05-20T14:00:00.000Z"
    );
    expect(
      createClassSessionSubmission({
        classTypeId: "type-1",
        locationId: "loc-main",
        trainerUserId: "trainer-1",
        roomName: " Studio A ",
        startsAt: "2026-05-20T14:00:00.000Z",
        endsAt: "2026-05-20T15:00:00.000Z",
        capacity: "12",
        waitlistCapacity: "3",
        cancellationCutoffMinutes: "120",
        lateCancellationFeeCents: "1500"
      })
    ).toEqual({
      classTypeId: "type-1",
      locationId: "loc-main",
      trainerUserId: "trainer-1",
      roomName: "Studio A",
      startsAt: "2026-05-20T14:00:00.000Z",
      endsAt: "2026-05-20T15:00:00.000Z",
      capacity: 12,
      waitlistCapacity: 3,
      cancellationCutoffMinutes: 120,
      lateCancellationFeeCents: 1500
    });
  });

  it("builds class-session edit change tracking and locks non-scheduled sessions", () => {
    const baseSession = buildSessions()[1]!;
    const editableSession = {
      ...buildSessions()[0]!,
      cancellationCutoffMinutes: 60,
      lateCancellationFeeCents: 500
    };
    const editableScreen = buildClassSessionEditScreen({
      session: editableSession,
      classTypes: buildClassTypes(),
      locations: buildLocations(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite],
      roomName: "Studio B",
      waitlistCapacity: "4"
    });
    const lockedScreen = buildClassSessionEditScreen({
      session: baseSession,
      classTypes: buildClassTypes(),
      locations: buildLocations(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite]
    });

    expect(editableScreen.locked).toBe(false);
    expect(editableScreen.changedFields).toEqual(["roomName", "waitlistCapacity"]);
    expect(editableScreen.canSubmit).toBe(true);
    expect(lockedScreen.locked).toBe(true);
    expect(lockedScreen.canSubmit).toBe(false);
    expect(
      createClassSessionEditSubmission({
        classTypeId: "type-1",
        locationId: "loc-main",
        trainerUserId: "trainer-1",
        roomName: "Studio B",
        startsAt: "2026-05-20T14:00:00.000Z",
        endsAt: "2026-05-20T15:00:00.000Z",
        capacity: "12",
        waitlistCapacity: "4",
        cancellationCutoffMinutes: "60",
        lateCancellationFeeCents: "500"
      })
    ).toEqual({
      classTypeId: "type-1",
      locationId: "loc-main",
      trainerUserId: "trainer-1",
      roomName: "Studio B",
      startsAt: "2026-05-20T14:00:00.000Z",
      endsAt: "2026-05-20T15:00:00.000Z",
      capacity: 12,
      waitlistCapacity: 4,
      cancellationCutoffMinutes: 60,
      lateCancellationFeeCents: 500
    });
  });

  it("builds a class-session cancel flow with blocked and ready states", () => {
    const readyScreen = buildClassSessionCancelScreen({
      session: buildSessions()[0]!,
      classTypes: buildClassTypes(),
      locations: buildLocations(),
      permissions: [Permission.ClassRead, Permission.ClassWrite]
    });
    const blockedScreen = buildClassSessionCancelScreen({
      session: buildSessions()[1]!,
      classTypes: buildClassTypes(),
      locations: buildLocations(),
      permissions: [Permission.ClassRead]
    });

    expect(readyScreen.screen).toBe("class_session_cancel");
    expect(readyScreen.canCancel).toBe(true);
    expect(readyScreen.className).toBe("Strength Foundations");
    expect(readyScreen.locationName).toBe("Main Floor");
    expect(readyScreen.statusLabel).toBe("Scheduled");
    expect(readyScreen.cancelAction.disabled).toBe(false);
    expect(readyScreen.confirmation.confirmDisabled).toBe(false);
    expect(readyScreen.summaryLabel).toBe(
      "Cancel Strength Foundations at Main Floor on 2026-05-20 14:00:00Z"
    );

    expect(blockedScreen.canCancel).toBe(false);
    expect(blockedScreen.blockedReason).toBe(
      "You do not have permission to cancel class sessions."
    );
    expect(blockedScreen.cancelAction.disabled).toBe(true);
    expect(blockedScreen.confirmation.confirmDisabled).toBe(true);
  });
});

function buildClassTypes(): ClassTypeView[] {
  return [
    { id: "type-1", name: "Strength Foundations", isPublic: true },
    { id: "type-2", name: "Coach Lab", isPublic: false }
  ];
}

function buildLocations(): ClassLocationView[] {
  return [
    { id: "loc-main", name: "Main Floor" },
    { id: "loc-annex", name: "Downtown Annex" }
  ];
}

function buildTrainers(): ClassTrainerView[] {
  return [
    { id: "trainer-1", fullName: "Demo Owner" },
    { id: "trainer-2", fullName: "Alex Trainer" }
  ];
}

function buildSessions(): ClassSessionView[] {
  return [
    {
      id: "session-1",
      classTypeId: "type-1",
      locationId: "loc-main",
      trainerUserId: "trainer-1",
      roomName: "Studio A",
      startsAt: "2026-05-20T14:00:00.000Z",
      endsAt: "2026-05-20T15:00:00.000Z",
      capacity: 12,
      waitlistCapacity: 3,
      status: ClassSessionStatus.Scheduled
    },
    {
      id: "session-2",
      classTypeId: "type-2",
      locationId: "loc-main",
      trainerUserId: "trainer-2",
      roomName: "Coach Lab",
      startsAt: "2026-05-19T12:00:00.000Z",
      endsAt: "2026-05-19T13:00:00.000Z",
      capacity: 8,
      waitlistCapacity: 0,
      status: ClassSessionStatus.Completed
    },
    {
      id: "session-3",
      classTypeId: "type-1",
      locationId: "loc-annex",
      startsAt: "2026-05-21T10:00:00.000Z",
      endsAt: "2026-05-21T11:00:00.000Z",
      capacity: 10,
      waitlistCapacity: 2,
      status: ClassSessionStatus.Cancelled
    }
  ];
}
