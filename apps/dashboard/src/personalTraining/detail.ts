import { Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  PersonalTrainingSessionStatus,
  personalTrainingFormatDateTime,
  personalTrainingMemberName,
  personalTrainingStatusLabel,
  type PersonalTrainingMemberView,
  type PersonalTrainingSessionView,
  type PersonalTrainingTrainerView
} from "./list.js";

export interface PersonalTrainingSessionDetailAction {
  key: "back_to_sessions" | "view_member" | "edit" | "cancel";
  button: ButtonModel;
  href: string;
}

export interface PersonalTrainingSessionDetailSectionDetail {
  key: string;
  label: string;
  value: string;
}

export interface PersonalTrainingSessionDetailSection {
  key: "member" | "schedule" | "operations";
  title: string;
  details: PersonalTrainingSessionDetailSectionDetail[];
}

export interface PersonalTrainingSessionDetailPage {
  screen: "personal_training_session_detail";
  session: PersonalTrainingSessionView;
  memberName: string;
  trainerName: string;
  packageLabel: string;
  locationLabel: string;
  statusLabel: string;
  durationLabel: string;
  sectionCount: number;
  sections: PersonalTrainingSessionDetailSection[];
  actionCount: number;
  actions: PersonalTrainingSessionDetailAction[];
  summaryLabel: string;
}

export function buildPersonalTrainingSessionDetailPage(inputModel: {
  session: PersonalTrainingSessionView;
  members: PersonalTrainingMemberView[];
  trainers: PersonalTrainingTrainerView[];
  permissions: string[];
}): PersonalTrainingSessionDetailPage {
  const canWriteSessions = inputModel.permissions.includes(Permission.ClassWrite);
  const member = inputModel.members.find((entry) => entry.id === inputModel.session.memberId);
  const trainer = inputModel.trainers.find((entry) => entry.id === inputModel.session.trainerUserId);
  const resolvedMemberName = personalTrainingMemberName(member, inputModel.session.memberId);
  const trainerName = trainer?.fullName ?? inputModel.session.trainerUserId;
  const packageLabel = normalizeText(inputModel.session.packageName) || "General session";
  const locationLabel = normalizeText(inputModel.session.locationName) || "No location assigned";
  const statusLabel = personalTrainingStatusLabel(inputModel.session.status);
  const durationLabel = buildDurationLabel(inputModel.session.startsAt, inputModel.session.endsAt);
  const sections = buildSections(inputModel.session, {
    memberName: resolvedMemberName,
    memberEmail: member?.email ?? "No email",
    trainerName,
    packageLabel,
    locationLabel,
    statusLabel,
    durationLabel
  });
  const actions = buildActions(inputModel.session, canWriteSessions);

  return {
    screen: "personal_training_session_detail",
    session: inputModel.session,
    memberName: resolvedMemberName,
    trainerName,
    packageLabel,
    locationLabel,
    statusLabel,
    durationLabel,
    sectionCount: sections.length,
    sections,
    actionCount: actions.length,
    actions,
    summaryLabel: `${resolvedMemberName} is ${statusLabel.toLowerCase()} with ${trainerName}`
  };
}

function buildSections(
  session: PersonalTrainingSessionView,
  labels: {
    memberName: string;
    memberEmail: string;
    trainerName: string;
    packageLabel: string;
    locationLabel: string;
    statusLabel: string;
    durationLabel: string;
  }
): PersonalTrainingSessionDetailSection[] {
  return [
    {
      key: "member",
      title: "Member",
      details: [
        { key: "member_name", label: "Member", value: labels.memberName },
        { key: "member_email", label: "Email", value: labels.memberEmail },
        { key: "trainer_name", label: "Trainer", value: labels.trainerName }
      ]
    },
    {
      key: "schedule",
      title: "Schedule",
      details: [
        { key: "package", label: "Package", value: labels.packageLabel },
        { key: "location", label: "Location", value: labels.locationLabel },
        { key: "starts_at", label: "Starts", value: personalTrainingFormatDateTime(session.startsAt) },
        { key: "ends_at", label: "Ends", value: personalTrainingFormatDateTime(session.endsAt) },
        { key: "duration", label: "Duration", value: labels.durationLabel }
      ]
    },
    {
      key: "operations",
      title: "Operations",
      details: [
        { key: "status", label: "Status", value: labels.statusLabel },
        {
          key: "reschedule",
          label: "Rescheduling",
          value: "Managed through trainer scheduling workflows"
        },
        {
          key: "session_notes",
          label: "Session notes",
          value: "Tracked outside the list and detail slice"
        }
      ]
    }
  ];
}

function buildActions(
  session: PersonalTrainingSessionView,
  canWriteSessions: boolean
): PersonalTrainingSessionDetailAction[] {
  return [
    {
      key: "back_to_sessions",
      href: "/personal-training",
      button: button({
        label: "Back to sessions",
        icon: "arrow-left",
        intent: "secondary"
      })
    },
    {
      key: "view_member",
      href: `/members/${session.memberId}`,
      button: button({
        label: "View member",
        icon: "eye",
        intent: "secondary"
      })
    },
    {
      key: "edit",
      href: `/personal-training/${session.id}/edit`,
      button: button({
        label: "Edit session",
        icon: "pencil",
        intent: "secondary",
        disabled: !canWriteSessions
      })
    },
    {
      key: "cancel",
      href: `/personal-training/${session.id}/cancel`,
      button: button({
        label: "Cancel session",
        icon: "calendar-x",
        intent: "danger",
        disabled: !canWriteSessions || session.status !== PersonalTrainingSessionStatus.Scheduled
      })
    }
  ];
}

function buildDurationLabel(startsAt: string, endsAt: string) {
  const durationMs = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  const durationMinutes = Math.max(0, Math.round(durationMs / 60000));
  return `${durationMinutes} minutes`;
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}
