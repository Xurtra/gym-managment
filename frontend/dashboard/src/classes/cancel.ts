import { ClassSessionStatus, Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  buildDashboardConfirmationModal,
  type DashboardConfirmationModal
} from "../shell/index.js";
import {
  classSessionStatusLabel,
  formatDateTime,
  type ClassLocationView,
  type ClassSessionView,
  type ClassTypeView
} from "./list.js";

export interface ClassSessionCancelScreen {
  screen: "class_session_cancel";
  session: ClassSessionView;
  canCancel: boolean;
  className: string;
  locationName: string;
  statusLabel: string;
  timeLabel: string;
  cancelAction: ButtonModel;
  keepAction: ButtonModel;
  confirmation: DashboardConfirmationModal;
  summaryLabel: string;
  blockedReason?: string;
}

export function buildClassSessionCancelScreen(inputModel: {
  session: ClassSessionView;
  classTypes: ClassTypeView[];
  locations: ClassLocationView[];
  permissions: string[];
  confirmOpen?: boolean;
}): ClassSessionCancelScreen {
  const canWriteClasses = inputModel.permissions.includes(Permission.ClassWrite);
  const className =
    inputModel.classTypes.find((classType) => classType.id === inputModel.session.classTypeId)?.name ??
    "Unknown class";
  const locationName =
    inputModel.locations.find((location) => location.id === inputModel.session.locationId)?.name ??
    "Unknown location";
  const statusLabel = classSessionStatusLabel(inputModel.session.status);
  const timeLabel = `${formatDateTime(inputModel.session.startsAt)} - ${formatDateTime(
    inputModel.session.endsAt
  )}`;
  const blockedReason = resolveBlockedReason(inputModel.session.status, canWriteClasses);
  const canCancel = !blockedReason;

  return {
    screen: "class_session_cancel",
    session: inputModel.session,
    canCancel,
    className,
    locationName,
    statusLabel,
    timeLabel,
    cancelAction: button({
      label: "Cancel class",
      icon: "calendar-x",
      intent: "danger",
      disabled: !canCancel
    }),
    keepAction: button({
      label: "Keep class",
      icon: "arrow-left",
      intent: "secondary"
    }),
    confirmation: buildDashboardConfirmationModal({
      title: "Cancel class session",
      body: `Cancel ${className} at ${locationName}? Members will no longer be able to attend this scheduled session.`,
      open: inputModel.confirmOpen ?? true,
      confirmLabel: "Cancel class",
      cancelLabel: "Keep class",
      intent: "danger",
      destructive: true,
      confirmDisabled: !canCancel
    }),
    summaryLabel: blockedReason
      ? blockedReason
      : `Cancel ${className} at ${locationName} on ${formatDateTime(inputModel.session.startsAt)}`,
    ...(blockedReason ? { blockedReason } : {})
  };
}

function resolveBlockedReason(status: ClassSessionStatus, canWriteClasses: boolean) {
  if (!canWriteClasses) {
    return "You do not have permission to cancel class sessions.";
  }
  if (status === ClassSessionStatus.Cancelled) {
    return "Class session is already cancelled.";
  }
  if (status === ClassSessionStatus.Completed) {
    return "Completed class sessions cannot be cancelled.";
  }
  return undefined;
}
