import { describe, expect, it } from "vitest";
import { FeatureFlag, Permission } from "@gym-platform/constants";
import {
  buildPersonalTrainingSessionCancelScreen,
  buildPersonalTrainingSessionCreateScreen,
  buildPersonalTrainingSessionDetailPage,
  buildPersonalTrainingSessionEditScreen,
  buildPersonalTrainingSessionListPage,
  createPersonalTrainingSessionEditSubmission,
  createPersonalTrainingSessionSubmission,
  PersonalTrainingSessionStatus,
  type PersonalTrainingMemberView,
  type PersonalTrainingSessionView,
  type PersonalTrainingTrainerView
} from "./index.js";

describe("buildPersonalTrainingSessionListPage", () => {
  it("builds a filtered personal training session list with summary metadata", () => {
    const page = buildPersonalTrainingSessionListPage({
      sessions: buildSessions(),
      members: buildMembers(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite],
      featureFlags: [FeatureFlag.PersonalTraining],
      filters: {
        query: "strength",
        trainerUserId: "trainer-1",
        status: PersonalTrainingSessionStatus.Scheduled
      }
    });

    expect(page.screen).toBe("personal_training_session_list");
    expect(page.featureEnabled).toBe(true);
    expect(page.rowCount).toBe(1);
    expect(page.activeFilterCount).toBe(3);
    expect(page.trainerOptionCount).toBe(2);
    expect(page.statusOptionCount).toBe(3);
    expect(page.summary.totalCount).toBe(3);
    expect(page.summary.scheduledCount).toBe(1);
    expect(page.summary.completedCount).toBe(1);
    expect(page.summary.cancelledCount).toBe(1);
    expect(page.summary.visibleCount).toBe(1);
    expect(page.summaryLabel).toBe("Showing 1 of 3 personal training sessions");
    expect(page.rows[0]).toMatchObject({
      memberName: "Jamie Member",
      trainerName: "Alex Trainer",
      packageLabel: "Strength Reset",
      locationLabel: "Main Floor",
      statusLabel: "Scheduled"
    });
    expect(page.rows[0]?.actions.map((action) => action.href)).toEqual([
      "/personal-training/pt-1",
      "/personal-training/pt-1/edit",
      "/personal-training/pt-1/cancel"
    ]);
    expect(page.createSessionAction.disabled).toBe(false);
    expect(page.empty).toBeUndefined();
  });

  it("builds a feature-disabled personal training empty state", () => {
    const page = buildPersonalTrainingSessionListPage({
      sessions: buildSessions(),
      members: buildMembers(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite],
      featureFlags: [],
      filters: {
        query: "strength"
      }
    });

    expect(page.featureEnabled).toBe(false);
    expect(page.rowCount).toBe(0);
    expect(page.summary.visibleCount).toBe(0);
    expect(page.summaryLabel).toBe("Personal training is disabled");
    expect(page.empty).toMatchObject({
      title: "Personal training is disabled",
      body: "Enable the personal training feature flag to schedule and manage sessions."
    });
    expect(page.table.empty?.title).toBe("Personal training is disabled");
    expect(page.createSessionAction.disabled).toBe(true);
  });

  it("builds a personal training session detail page with section metadata", () => {
    const page = buildPersonalTrainingSessionDetailPage({
      session: buildSessions()[0]!,
      members: buildMembers(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite]
    });

    expect(page.screen).toBe("personal_training_session_detail");
    expect(page.memberName).toBe("Jamie Member");
    expect(page.trainerName).toBe("Alex Trainer");
    expect(page.packageLabel).toBe("Strength Reset");
    expect(page.locationLabel).toBe("Main Floor");
    expect(page.statusLabel).toBe("Scheduled");
    expect(page.durationLabel).toBe("60 minutes");
    expect(page.sectionCount).toBe(3);
    expect(page.actionCount).toBe(4);
    expect(page.summaryLabel).toBe("Jamie Member is scheduled with Alex Trainer");
    expect(page.sections[1]?.details).toEqual(
      expect.arrayContaining([
        { key: "package", label: "Package", value: "Strength Reset" },
        { key: "duration", label: "Duration", value: "60 minutes" }
      ])
    );
    expect(page.actions.map((action) => action.href)).toEqual([
      "/personal-training",
      "/members/member-1",
      "/personal-training/pt-1/edit",
      "/personal-training/pt-1/cancel"
    ]);
    expect(page.actions[3]?.button.disabled).toBe(false);
  });

  it("builds a personal training create screen with validation and normalized submission", () => {
    const screen = buildPersonalTrainingSessionCreateScreen({
      members: buildMembers(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite],
      memberId: "member-1",
      trainerUserId: "trainer-1",
      packageName: " Strength Reset ",
      locationName: " Main Floor ",
      startsAt: "2026-05-20T14:00:00.000Z",
      endsAt: "2026-05-20T15:00:00.000Z"
    });

    expect(screen.screen).toBe("personal_training_session_create");
    expect(screen.selectedMemberId).toBe("member-1");
    expect(screen.selectedTrainerUserId).toBe("trainer-1");
    expect(screen.summaryLabel).toBe(
      "Session for Jamie Member with Alex Trainer at 2026-05-20 14:00:00Z - 2026-05-20 15:00:00Z"
    );
    expect(screen.canSubmit).toBe(true);
    expect(screen.action.disabled).toBe(false);

    expect(
      createPersonalTrainingSessionSubmission({
        memberId: " member-1 ",
        trainerUserId: " trainer-1 ",
        packageName: " Strength Reset ",
        locationName: " Main Floor ",
        startsAt: "2026-05-20T14:00:00.000Z",
        endsAt: "2026-05-20T15:00:00.000Z"
      })
    ).toEqual({
      memberId: "member-1",
      trainerUserId: "trainer-1",
      packageName: "Strength Reset",
      locationName: "Main Floor",
      startsAt: "2026-05-20T14:00:00.000Z",
      endsAt: "2026-05-20T15:00:00.000Z"
    });
  });

  it("builds a personal training edit screen with change tracking and locking", () => {
    const editable = buildPersonalTrainingSessionEditScreen({
      session: buildSessions()[0]!,
      members: buildMembers(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite],
      locationName: "Studio B",
      endsAt: "2026-05-20T15:30:00.000Z"
    });
    const locked = buildPersonalTrainingSessionEditScreen({
      session: buildSessions()[1]!,
      members: buildMembers(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite]
    });

    expect(editable.screen).toBe("personal_training_session_edit");
    expect(editable.locked).toBe(false);
    expect(editable.changedFields).toEqual(["locationName", "endsAt"]);
    expect(editable.canSubmit).toBe(true);
    expect(editable.action.disabled).toBe(false);

    expect(locked.locked).toBe(true);
    expect(locked.canSubmit).toBe(false);
    expect(locked.action.disabled).toBe(true);

    expect(
      createPersonalTrainingSessionEditSubmission({
        memberId: "member-1",
        trainerUserId: "trainer-1",
        packageName: "Strength Reset",
        locationName: "Studio B",
        startsAt: "2026-05-20T14:00:00.000Z",
        endsAt: "2026-05-20T15:30:00.000Z"
      })
    ).toEqual({
      memberId: "member-1",
      trainerUserId: "trainer-1",
      packageName: "Strength Reset",
      locationName: "Studio B",
      startsAt: "2026-05-20T14:00:00.000Z",
      endsAt: "2026-05-20T15:30:00.000Z"
    });
  });

  it("builds a personal training cancel flow with ready and blocked states", () => {
    const ready = buildPersonalTrainingSessionCancelScreen({
      session: buildSessions()[0]!,
      members: buildMembers(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead, Permission.ClassWrite]
    });
    const blocked = buildPersonalTrainingSessionCancelScreen({
      session: buildSessions()[1]!,
      members: buildMembers(),
      trainers: buildTrainers(),
      permissions: [Permission.ClassRead]
    });

    expect(ready.screen).toBe("personal_training_session_cancel");
    expect(ready.canCancel).toBe(true);
    expect(ready.memberName).toBe("Jamie Member");
    expect(ready.trainerName).toBe("Alex Trainer");
    expect(ready.packageLabel).toBe("Strength Reset");
    expect(ready.locationLabel).toBe("Main Floor");
    expect(ready.statusLabel).toBe("Scheduled");
    expect(ready.timeLabel).toBe("2026-05-20 14:00:00Z - 2026-05-20 15:00:00Z");
    expect(ready.cancelAction.disabled).toBe(false);
    expect(ready.confirmation.confirmDisabled).toBe(false);
    expect(ready.summaryLabel).toBe("Cancel Strength Reset for Jamie Member on 2026-05-20 14:00:00Z");

    expect(blocked.canCancel).toBe(false);
    expect(blocked.blockedReason).toBe("You do not have permission to cancel personal training sessions.");
    expect(blocked.cancelAction.disabled).toBe(true);
    expect(blocked.confirmation.confirmDisabled).toBe(true);
  });
});

function buildMembers(): PersonalTrainingMemberView[] {
  return [
    {
      id: "member-1",
      firstName: "Jamie",
      lastName: "Member",
      email: "jamie@example.com"
    },
    {
      id: "member-2",
      firstName: "Taylor",
      lastName: "Member",
      email: "taylor@example.com"
    }
  ];
}

function buildTrainers(): PersonalTrainingTrainerView[] {
  return [
    { id: "trainer-1", fullName: "Alex Trainer" },
    { id: "trainer-2", fullName: "Riley Coach" }
  ];
}

function buildSessions(): PersonalTrainingSessionView[] {
  return [
    {
      id: "pt-1",
      memberId: "member-1",
      trainerUserId: "trainer-1",
      packageName: "Strength Reset",
      locationName: "Main Floor",
      startsAt: "2026-05-20T14:00:00.000Z",
      endsAt: "2026-05-20T15:00:00.000Z",
      status: PersonalTrainingSessionStatus.Scheduled
    },
    {
      id: "pt-2",
      memberId: "member-2",
      trainerUserId: "trainer-2",
      packageName: "Mobility Focus",
      locationName: "Studio B",
      startsAt: "2026-05-18T14:00:00.000Z",
      endsAt: "2026-05-18T15:00:00.000Z",
      status: PersonalTrainingSessionStatus.Completed
    },
    {
      id: "pt-3",
      memberId: "member-1",
      trainerUserId: "trainer-2",
      packageName: "Recovery Check-In",
      locationName: "Recovery Room",
      startsAt: "2026-05-22T10:00:00.000Z",
      endsAt: "2026-05-22T10:45:00.000Z",
      status: PersonalTrainingSessionStatus.Cancelled
    }
  ];
}
