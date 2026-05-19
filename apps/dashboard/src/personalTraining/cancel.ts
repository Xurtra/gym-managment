import { Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  buildDashboardConfirmationModal,
  type DashboardConfirmationModal
} from "../shell/index.js";
import {
  personalTrainingFormatDateTime,
  personalTrainingMemberName,
  PersonalTrainingSessionStatus,
  personalTrainingStatusLabel,
  type PersonalTrainingMemberView,
  type PersonalTrainingSessionView,
  type PersonalTrainingTrainerView
} from "./list.js";

export interface PersonalTrainingSessionCancelScreen {
  screen: "personal_training_session_cancel";
  session: PersonalTrainingSessionView;
  canCancel: boolean;
  memberName: string;
  trainerName: string;
  packageLabel: string;
  locationLabel: string;
  statusLabel: string;
  timeLabel: string;
  cancelAction: ButtonModel;
  keepAction: ButtonModel;
  confirmation: DashboardConfirmationModal;
  summaryLabel: string;
  blockedReason?: string;
}

export function buildPersonalTrainingSessionCancelScreen(inputModel: {
  session: PersonalTrainingSessionView;
  members: PersonalTrainingMemberView[];
  trainers: PersonalTrainingTrainerView[];
  permissions: string[];
  confirmOpen?: boolean;
}): PersonalTrainingSessionCancelScreen {
  const canWriteSessions = inputModel.permissions.includes(Permission.ClassWrite);
  const member = inputModel.members.find((entry) => entry.id === inputModel.session.memberId);
  const trainer = inputModel.trainers.find((entry) => entry.id === inputModel.session.trainerUserId);
  const memberName = personalTrainingMemberName(member, inputModel.session.memberId);
  const trainerName = trainer?.fullName ?? inputModel.session.trainerUserId;
  const packageLabel = normalizeText(inputModel.session.packageName) || "General session";
  const locationLabel = normalizeText(inputModel.session.locationName) || "No location assigned";
  const statusLabel = personalTrainingStatusLabel(inputModel.session.status);
  const timeLabel = `${personalTrainingFormatDateTime(inputModel.session.startsAt)} - ${personalTrainingFormatDateTime(
    inputModel.session.endsAt
  )}`;
  const blockedReason = resolveBlockedReason(inputModel.session.status, canWriteSessions);
  const canCancel = !blockedReason;

  return {
    screen: "personal_training_session_cancel",
    session: inputModel.session,
    canCancel,
    memberName,
    trainerName,
    packageLabel,
    locationLabel,
    statusLabel,
    timeLabel,
    cancelAction: button({
      label: "Cancel session",
      icon: "calendar-x",
      intent: "danger",
      disabled: !canCancel
    }),
    keepAction: button({
      label: "Keep session",
      icon: "arrow-left",
      intent: "secondary"
    }),
    confirmation: buildDashboardConfirmationModal({
      title: "Cancel personal training session",
      body: `Cancel ${packageLabel} for ${memberName} with ${trainerName}? This trainer appointment will no longer be available.`,
      open: inputModel.confirmOpen ?? true,
      confirmLabel: "Cancel session",
      cancelLabel: "Keep session",
      intent: "danger",
      destructive: true,
      confirmDisabled: !canCancel
    }),
    summaryLabel: blockedReason
      ? blockedReason
      : `Cancel ${packageLabel} for ${memberName} on ${personalTrainingFormatDateTime(inputModel.session.startsAt)}`,
    ...(blockedReason ? { blockedReason } : {})
  };
}

function resolveBlockedReason(
  status: PersonalTrainingSessionStatus,
  canWriteSessions: boolean
) {
  if (!canWriteSessions) {
    return "You do not have permission to cancel personal training sessions.";
  }
  if (status === PersonalTrainingSessionStatus.Cancelled) {
    return "Personal training session is already cancelled.";
  }
  if (status === PersonalTrainingSessionStatus.Completed) {
    return "Completed personal training sessions cannot be cancelled.";
  }
  return undefined;
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}
