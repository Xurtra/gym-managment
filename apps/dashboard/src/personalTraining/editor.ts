import { Permission } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import {
  personalTrainingFormatDateTime,
  personalTrainingMemberName,
  type PersonalTrainingMemberView,
  type PersonalTrainingSessionView,
  type PersonalTrainingTrainerView
} from "./list.js";

export interface PersonalTrainingMemberOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface PersonalTrainingTrainerEditorOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface PersonalTrainingEditorFields {
  packageName: InputModel;
  locationName: InputModel;
  startsAt: InputModel;
  endsAt: InputModel;
}

export interface PersonalTrainingSessionCreateScreen {
  screen: "personal_training_session_create";
  fields: PersonalTrainingEditorFields;
  memberOptions: PersonalTrainingMemberOption[];
  trainerOptions: PersonalTrainingTrainerEditorOption[];
  selectedMemberId?: string;
  selectedTrainerUserId?: string;
  summaryLabel: string;
  canSubmit: boolean;
  action: ButtonModel;
  cancelAction: ButtonModel;
}

export interface PersonalTrainingSessionEditScreen {
  screen: "personal_training_session_edit";
  session: PersonalTrainingSessionView;
  fields: PersonalTrainingEditorFields;
  memberOptions: PersonalTrainingMemberOption[];
  trainerOptions: PersonalTrainingTrainerEditorOption[];
  selectedMemberId: string;
  selectedTrainerUserId: string;
  locked: boolean;
  changedFields: Array<"memberId" | "trainerUserId" | "packageName" | "locationName" | "startsAt" | "endsAt">;
  summaryLabel: string;
  canSubmit: boolean;
  action: ButtonModel;
  cancelAction: ButtonModel;
}

export interface PersonalTrainingSessionSubmission {
  memberId: string;
  trainerUserId: string;
  packageName?: string;
  locationName?: string;
  startsAt: string;
  endsAt: string;
}

export function buildPersonalTrainingSessionCreateScreen(inputModel: {
  members: PersonalTrainingMemberView[];
  trainers: PersonalTrainingTrainerView[];
  permissions: string[];
  memberId?: string;
  trainerUserId?: string;
  packageName?: string;
  locationName?: string;
  startsAt?: string;
  endsAt?: string;
}): PersonalTrainingSessionCreateScreen {
  const canWriteSessions = inputModel.permissions.includes(Permission.ClassWrite);
  const values = normalizeEditorValues(inputModel);
  const fields = buildEditorFields(values);
  const canSubmit = canSubmitEditor(values, canWriteSessions);

  return {
    screen: "personal_training_session_create",
    fields,
    memberOptions: buildMemberOptions(inputModel.members, values.memberId),
    trainerOptions: buildTrainerOptions(inputModel.trainers, values.trainerUserId),
    ...(values.memberId ? { selectedMemberId: values.memberId } : {}),
    ...(values.trainerUserId ? { selectedTrainerUserId: values.trainerUserId } : {}),
    summaryLabel: buildSummaryLabel(values, inputModel.members, inputModel.trainers),
    canSubmit,
    action: button({ label: "Schedule session", icon: "calendar-plus", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
  };
}

export function createPersonalTrainingSessionSubmission(inputModel: {
  memberId: string;
  trainerUserId: string;
  packageName?: string;
  locationName?: string;
  startsAt: string;
  endsAt: string;
}): PersonalTrainingSessionSubmission {
  const values = normalizeEditorValues(inputModel);
  return buildSubmission(values);
}

export function buildPersonalTrainingSessionEditScreen(inputModel: {
  session: PersonalTrainingSessionView;
  members: PersonalTrainingMemberView[];
  trainers: PersonalTrainingTrainerView[];
  permissions: string[];
  memberId?: string;
  trainerUserId?: string;
  packageName?: string;
  locationName?: string;
  startsAt?: string;
  endsAt?: string;
}): PersonalTrainingSessionEditScreen {
  const canWriteSessions = inputModel.permissions.includes(Permission.ClassWrite);
  const values = normalizeEditorValues(buildEditInputValues(inputModel));
  const fields = buildEditorFields(values);
  const locked = inputModel.session.status !== "scheduled";
  const changedFields = changedFieldsForSession(inputModel.session, values);
  const canSubmit = canSubmitEditor(values, canWriteSessions) && !locked && changedFields.length > 0;

  return {
    screen: "personal_training_session_edit",
    session: inputModel.session,
    fields,
    memberOptions: buildMemberOptions(inputModel.members, values.memberId),
    trainerOptions: buildTrainerOptions(inputModel.trainers, values.trainerUserId),
    selectedMemberId: values.memberId,
    selectedTrainerUserId: values.trainerUserId,
    locked,
    changedFields,
    summaryLabel: buildSummaryLabel(values, inputModel.members, inputModel.trainers),
    canSubmit,
    action: button({ label: "Save session", icon: "save", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
  };
}

export function createPersonalTrainingSessionEditSubmission(inputModel: {
  memberId: string;
  trainerUserId: string;
  packageName?: string;
  locationName?: string;
  startsAt: string;
  endsAt: string;
}): PersonalTrainingSessionSubmission {
  const values = normalizeEditorValues(inputModel);
  return buildSubmission(values);
}

function buildEditorFields(values: NormalizedEditorValues): PersonalTrainingEditorFields {
  return {
    packageName: input({
      name: "packageName",
      label: "Package name",
      value: values.packageName,
      type: "text",
      required: false
    }),
    locationName: input({
      name: "locationName",
      label: "Location",
      value: values.locationName,
      type: "text",
      required: false
    }),
    startsAt: input({
      name: "startsAt",
      label: "Starts at",
      value: values.startsAt,
      type: "text",
      required: true,
      ...(values.startsAt.length === 0 ? { error: "Start time is required." } : {})
    }),
    endsAt: input({
      name: "endsAt",
      label: "Ends at",
      value: values.endsAt,
      type: "text",
      required: true,
      ...buildEndTimeError(values)
    })
  };
}

function buildMemberOptions(
  members: PersonalTrainingMemberView[],
  selectedMemberId: string
): PersonalTrainingMemberOption[] {
  return members
    .slice()
    .sort((left, right) =>
      personalTrainingMemberName(left, left.id).localeCompare(personalTrainingMemberName(right, right.id))
    )
    .map((member) => ({
      value: member.id,
      label: personalTrainingMemberName(member, member.id),
      selected: member.id === selectedMemberId
    }));
}

function buildTrainerOptions(
  trainers: PersonalTrainingTrainerView[],
  selectedTrainerUserId: string
): PersonalTrainingTrainerEditorOption[] {
  return trainers
    .slice()
    .sort((left, right) => left.fullName.localeCompare(right.fullName))
    .map((trainer) => ({
      value: trainer.id,
      label: trainer.fullName,
      selected: trainer.id === selectedTrainerUserId
    }));
}

function canSubmitEditor(values: NormalizedEditorValues, canWriteSessions: boolean) {
  return (
    canWriteSessions &&
    values.memberId.length > 0 &&
    values.trainerUserId.length > 0 &&
    values.startsAt.length > 0 &&
    values.endsAt.length > 0 &&
    !buildEndTimeError(values).error
  );
}

function buildEndTimeError(values: NormalizedEditorValues) {
  if (values.endsAt.length === 0) {
    return { error: "End time is required." };
  }
  if (values.startsAt.length > 0 && values.endsAt <= values.startsAt) {
    return { error: "End time must be after the start time." };
  }
  return {};
}

function changedFieldsForSession(
  session: PersonalTrainingSessionView,
  values: NormalizedEditorValues
): PersonalTrainingSessionEditScreen["changedFields"] {
  const fields: PersonalTrainingSessionEditScreen["changedFields"] = [];
  if (values.memberId !== session.memberId) fields.push("memberId");
  if (values.trainerUserId !== session.trainerUserId) fields.push("trainerUserId");
  if (values.packageName !== normalizeText(session.packageName)) fields.push("packageName");
  if (values.locationName !== normalizeText(session.locationName)) fields.push("locationName");
  if (values.startsAt !== session.startsAt) fields.push("startsAt");
  if (values.endsAt !== session.endsAt) fields.push("endsAt");
  return fields;
}

function buildSummaryLabel(
  values: NormalizedEditorValues,
  members: PersonalTrainingMemberView[],
  trainers: PersonalTrainingTrainerView[]
) {
  const member = members.find((entry) => entry.id === values.memberId);
  const trainer = trainers.find((entry) => entry.id === values.trainerUserId);
  const memberLabel = values.memberId
    ? personalTrainingMemberName(member, values.memberId)
    : "a member";
  const trainerLabel = values.trainerUserId ? trainer?.fullName ?? values.trainerUserId : "a trainer";
  const timeLabel =
    values.startsAt && values.endsAt
      ? `${personalTrainingFormatDateTime(values.startsAt)} - ${personalTrainingFormatDateTime(values.endsAt)}`
      : "unscheduled time";
  return `Session for ${memberLabel} with ${trainerLabel} at ${timeLabel}`;
}

function buildSubmission(values: NormalizedEditorValues): PersonalTrainingSessionSubmission {
  return {
    memberId: values.memberId,
    trainerUserId: values.trainerUserId,
    ...(values.packageName ? { packageName: values.packageName } : {}),
    ...(values.locationName ? { locationName: values.locationName } : {}),
    startsAt: values.startsAt,
    endsAt: values.endsAt
  };
}

function normalizeEditorValues(inputModel: {
  memberId?: string;
  trainerUserId?: string;
  packageName?: string;
  locationName?: string;
  startsAt?: string;
  endsAt?: string;
}): NormalizedEditorValues {
  return {
    memberId: normalizeText(inputModel.memberId),
    trainerUserId: normalizeText(inputModel.trainerUserId),
    packageName: normalizeText(inputModel.packageName),
    locationName: normalizeText(inputModel.locationName),
    startsAt: normalizeText(inputModel.startsAt),
    endsAt: normalizeText(inputModel.endsAt)
  };
}

function buildEditInputValues(inputModel: {
  session: PersonalTrainingSessionView;
  memberId?: string;
  trainerUserId?: string;
  packageName?: string;
  locationName?: string;
  startsAt?: string;
  endsAt?: string;
}) {
  return {
    memberId: inputModel.memberId ?? inputModel.session.memberId,
    trainerUserId: inputModel.trainerUserId ?? inputModel.session.trainerUserId,
    ...(inputModel.packageName !== undefined
      ? { packageName: inputModel.packageName }
      : inputModel.session.packageName !== undefined
        ? { packageName: inputModel.session.packageName }
        : {}),
    ...(inputModel.locationName !== undefined
      ? { locationName: inputModel.locationName }
      : inputModel.session.locationName !== undefined
        ? { locationName: inputModel.session.locationName }
        : {}),
    startsAt: inputModel.startsAt ?? inputModel.session.startsAt,
    endsAt: inputModel.endsAt ?? inputModel.session.endsAt
  };
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

interface NormalizedEditorValues {
  memberId: string;
  trainerUserId: string;
  packageName: string;
  locationName: string;
  startsAt: string;
  endsAt: string;
}
