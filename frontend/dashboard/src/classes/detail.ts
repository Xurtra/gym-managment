import { ClassSessionStatus, Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  classSessionStatusLabel,
  formatDateTime,
  type ClassLocationView,
  type ClassSessionView,
  type ClassTrainerView,
  type ClassTypeView
} from "./list.js";

export interface ClassSessionDetailAction {
  key: "back_to_classes" | "edit" | "cancel";
  button: ButtonModel;
  href: string;
}

export interface ClassSessionDetailSectionDetail {
  key: string;
  label: string;
  value: string;
}

export interface ClassSessionDetailSection {
  key: "schedule" | "capacity" | "operations";
  title: string;
  details: ClassSessionDetailSectionDetail[];
}

export interface ClassSessionDetailPage {
  screen: "class_session_detail";
  session: ClassSessionView;
  className: string;
  locationName: string;
  trainerName: string;
  roomLabel: string;
  visibilityLabel: string;
  statusLabel: string;
  durationLabel: string;
  sectionCount: number;
  sections: ClassSessionDetailSection[];
  actionCount: number;
  actions: ClassSessionDetailAction[];
  summaryLabel: string;
}

export function buildClassSessionDetailPage(inputModel: {
  session: ClassSessionView;
  classTypes: ClassTypeView[];
  locations: ClassLocationView[];
  trainers: ClassTrainerView[];
  permissions: string[];
}): ClassSessionDetailPage {
  const classTypeMap = new Map(inputModel.classTypes.map((classType) => [classType.id, classType]));
  const locationMap = new Map(inputModel.locations.map((location) => [location.id, location]));
  const trainerMap = new Map(inputModel.trainers.map((trainer) => [trainer.id, trainer]));
  const canWriteClasses = inputModel.permissions.includes(Permission.ClassWrite);
  const classType = classTypeMap.get(inputModel.session.classTypeId);
  const location = locationMap.get(inputModel.session.locationId);
  const trainer = inputModel.session.trainerUserId
    ? trainerMap.get(inputModel.session.trainerUserId)
    : undefined;
  const className = classType?.name ?? "Unknown class";
  const locationName = location?.name ?? "Unknown location";
  const trainerName = trainer?.fullName ?? "Unassigned trainer";
  const roomLabel = inputModel.session.roomName?.trim() || "No room assigned";
  const visibilityLabel = classType?.isPublic ? "Public" : "Private";
  const statusLabel = classSessionStatusLabel(inputModel.session.status);
  const durationLabel = buildDurationLabel(inputModel.session.startsAt, inputModel.session.endsAt);
  const sections = buildSections(inputModel.session, {
    className,
    locationName,
    trainerName,
    roomLabel,
    visibilityLabel,
    statusLabel,
    durationLabel
  });
  const actions = buildActions(inputModel.session, canWriteClasses);

  return {
    screen: "class_session_detail",
    session: inputModel.session,
    className,
    locationName,
    trainerName,
    roomLabel,
    visibilityLabel,
    statusLabel,
    durationLabel,
    sectionCount: sections.length,
    sections,
    actionCount: actions.length,
    actions,
    summaryLabel: `${className} is ${statusLabel.toLowerCase()} at ${locationName}`
  };
}

function buildSections(
  session: ClassSessionView,
  labels: {
    className: string;
    locationName: string;
    trainerName: string;
    roomLabel: string;
    visibilityLabel: string;
    statusLabel: string;
    durationLabel: string;
  }
): ClassSessionDetailSection[] {
  return [
    {
      key: "schedule",
      title: "Schedule",
      details: [
        { key: "class", label: "Class", value: labels.className },
        { key: "location", label: "Location", value: labels.locationName },
        { key: "room", label: "Room", value: labels.roomLabel },
        { key: "trainer", label: "Trainer", value: labels.trainerName },
        { key: "starts_at", label: "Starts", value: formatDateTime(session.startsAt) },
        { key: "ends_at", label: "Ends", value: formatDateTime(session.endsAt) },
        { key: "duration", label: "Duration", value: labels.durationLabel }
      ]
    },
    {
      key: "capacity",
      title: "Capacity",
      details: [
        { key: "capacity", label: "Booked capacity", value: String(session.capacity) },
        { key: "waitlist", label: "Waitlist capacity", value: String(session.waitlistCapacity) },
        { key: "visibility", label: "Visibility", value: labels.visibilityLabel }
      ]
    },
    {
      key: "operations",
      title: "Operations",
      details: [
        { key: "status", label: "Status", value: labels.statusLabel },
        {
          key: "cancellation_cutoff",
          label: "Cancellation cutoff",
          value: "Managed in API scheduling rules"
        },
        {
          key: "late_fee",
          label: "Late fee",
          value: "Managed in API scheduling rules"
        }
      ]
    }
  ];
}

function buildActions(
  session: ClassSessionView,
  canWriteClasses: boolean
): ClassSessionDetailAction[] {
  return [
    {
      key: "back_to_classes",
      href: "/classes",
      button: button({
        label: "Back to classes",
        icon: "arrow-left",
        intent: "secondary"
      })
    },
    {
      key: "edit",
      href: `/classes/${session.id}/edit`,
      button: button({
        label: "Edit class",
        icon: "pencil",
        intent: "secondary",
        disabled: !canWriteClasses
      })
    },
    {
      key: "cancel",
      href: `/classes/${session.id}/cancel`,
      button: button({
        label: "Cancel class",
        icon: "calendar-x",
        intent: "danger",
        disabled: !canWriteClasses || session.status !== ClassSessionStatus.Scheduled
      })
    }
  ];
}

function buildDurationLabel(startsAt: string, endsAt: string) {
  const durationMs = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  const durationMinutes = Math.max(0, Math.round(durationMs / 60000));
  return `${durationMinutes} minutes`;
}
