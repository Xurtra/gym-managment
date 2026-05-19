import { ClassSessionStatus, Permission } from "@gym-platform/constants";
import type { ClassSessionCreateInput } from "@gym-platform/validation";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import {
  type ClassLocationView,
  type ClassSessionView,
  type ClassTrainerView,
  type ClassTypeView
} from "./list.js";

export interface ClassSessionTypeOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface ClassSessionEditorLocationOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface ClassSessionEditorTrainerOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface ClassSessionEditorFields {
  roomName: InputModel;
  startsAt: InputModel;
  endsAt: InputModel;
  capacity: InputModel;
  waitlistCapacity: InputModel;
  cancellationCutoffMinutes: InputModel;
  lateCancellationFeeCents: InputModel;
}

export interface ClassSessionCreateScreen {
  screen: "class_session_create";
  fields: ClassSessionEditorFields;
  classTypeOptions: ClassSessionTypeOption[];
  locationOptions: ClassSessionEditorLocationOption[];
  trainerOptions: ClassSessionEditorTrainerOption[];
  selectedClassTypeId?: string;
  selectedLocationId?: string;
  selectedTrainerUserId?: string;
  summaryLabel: string;
  canSubmit: boolean;
  action: ButtonModel;
  cancelAction: ButtonModel;
}

export interface ClassSessionEditScreen {
  screen: "class_session_edit";
  session: ClassSessionView;
  fields: ClassSessionEditorFields;
  classTypeOptions: ClassSessionTypeOption[];
  locationOptions: ClassSessionEditorLocationOption[];
  trainerOptions: ClassSessionEditorTrainerOption[];
  selectedClassTypeId: string;
  selectedLocationId: string;
  selectedTrainerUserId?: string;
  locked: boolean;
  changedFields: Array<
    | "classTypeId"
    | "locationId"
    | "trainerUserId"
    | "roomName"
    | "startsAt"
    | "endsAt"
    | "capacity"
    | "waitlistCapacity"
    | "cancellationCutoffMinutes"
    | "lateCancellationFeeCents"
  >;
  summaryLabel: string;
  canSubmit: boolean;
  action: ButtonModel;
  cancelAction: ButtonModel;
}

export function buildClassSessionCreateScreen(inputModel: {
  classTypes: ClassTypeView[];
  locations: ClassLocationView[];
  trainers: ClassTrainerView[];
  permissions: string[];
  classTypeId?: string;
  locationId?: string;
  trainerUserId?: string | undefined;
  roomName?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: string;
  waitlistCapacity?: string;
  cancellationCutoffMinutes?: string;
  lateCancellationFeeCents?: string;
}): ClassSessionCreateScreen {
  const canWriteClasses = inputModel.permissions.includes(Permission.ClassWrite);
  const values = normalizeEditorValues(inputModel);
  const fields = buildEditorFields(values);
  const canSubmit = canSubmitEditor(values, canWriteClasses);

  return {
    screen: "class_session_create",
    fields,
    classTypeOptions: buildClassTypeOptions(inputModel.classTypes, values.classTypeId),
    locationOptions: buildLocationOptions(inputModel.locations, values.locationId),
    trainerOptions: buildTrainerOptions(inputModel.trainers, values.trainerUserId),
    ...(values.classTypeId ? { selectedClassTypeId: values.classTypeId } : {}),
    ...(values.locationId ? { selectedLocationId: values.locationId } : {}),
    ...(values.trainerUserId ? { selectedTrainerUserId: values.trainerUserId } : {}),
    summaryLabel: buildSummaryLabel(values, inputModel.classTypes, inputModel.locations),
    canSubmit,
    action: button({ label: "Schedule class", icon: "calendar-plus", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
  };
}

export function createClassSessionSubmission(inputModel: {
  classTypeId: string;
  locationId: string;
  trainerUserId?: string | undefined;
  roomName?: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  waitlistCapacity?: string;
  cancellationCutoffMinutes?: string;
  lateCancellationFeeCents?: string;
}): ClassSessionCreateInput {
  const values = normalizeEditorValues(inputModel);
  return buildSubmission(values);
}

export function buildClassSessionEditScreen(inputModel: {
  session: ClassSessionView;
  classTypes: ClassTypeView[];
  locations: ClassLocationView[];
  trainers: ClassTrainerView[];
  permissions: string[];
  classTypeId?: string;
  locationId?: string;
  trainerUserId?: string | undefined;
  roomName?: string | undefined;
  startsAt?: string;
  endsAt?: string;
  capacity?: string;
  waitlistCapacity?: string;
  cancellationCutoffMinutes?: string;
  lateCancellationFeeCents?: string | undefined;
}): ClassSessionEditScreen {
  const canWriteClasses = inputModel.permissions.includes(Permission.ClassWrite);
  const values = normalizeEditorValues({
    classTypeId: inputModel.classTypeId ?? inputModel.session.classTypeId,
    locationId: inputModel.locationId ?? inputModel.session.locationId,
    trainerUserId: inputModel.trainerUserId ?? inputModel.session.trainerUserId,
    roomName: inputModel.roomName ?? inputModel.session.roomName,
    startsAt: inputModel.startsAt ?? inputModel.session.startsAt,
    endsAt: inputModel.endsAt ?? inputModel.session.endsAt,
    capacity: inputModel.capacity ?? String(inputModel.session.capacity),
    waitlistCapacity: inputModel.waitlistCapacity ?? String(inputModel.session.waitlistCapacity),
    cancellationCutoffMinutes:
      inputModel.cancellationCutoffMinutes ??
      String((inputModel.session as ClassSessionView & { cancellationCutoffMinutes?: number })
        .cancellationCutoffMinutes ?? 0),
    lateCancellationFeeCents:
      inputModel.lateCancellationFeeCents ??
      String((inputModel.session as ClassSessionView & { lateCancellationFeeCents?: number })
        .lateCancellationFeeCents ?? 0)
  });
  const fields = buildEditorFields(values);
  const locked = inputModel.session.status !== ClassSessionStatus.Scheduled;
  const changedFields = changedFieldsForSession(inputModel.session, values);
  const canSubmit =
    canSubmitEditor(values, canWriteClasses) && !locked && changedFields.length > 0;

  return {
    screen: "class_session_edit",
    session: inputModel.session,
    fields,
    classTypeOptions: buildClassTypeOptions(inputModel.classTypes, values.classTypeId),
    locationOptions: buildLocationOptions(inputModel.locations, values.locationId),
    trainerOptions: buildTrainerOptions(inputModel.trainers, values.trainerUserId),
    selectedClassTypeId: values.classTypeId,
    selectedLocationId: values.locationId,
    ...(values.trainerUserId ? { selectedTrainerUserId: values.trainerUserId } : {}),
    locked,
    changedFields,
    summaryLabel: buildSummaryLabel(values, inputModel.classTypes, inputModel.locations),
    canSubmit,
    action: button({ label: "Save class", icon: "save", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
  };
}

export function createClassSessionEditSubmission(inputModel: {
  classTypeId: string;
  locationId: string;
  trainerUserId?: string | undefined;
  roomName?: string | undefined;
  startsAt: string;
  endsAt: string;
  capacity: string;
  waitlistCapacity?: string;
  cancellationCutoffMinutes?: string;
  lateCancellationFeeCents?: string | undefined;
}): ClassSessionCreateInput {
  const values = normalizeEditorValues(inputModel);
  return buildSubmission(values);
}

function buildEditorFields(values: NormalizedEditorValues): ClassSessionEditorFields {
  return {
    roomName: input({
      name: "roomName",
      label: "Room name",
      value: values.roomName,
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
    }),
    capacity: input({
      name: "capacity",
      label: "Capacity",
      value: values.capacity,
      type: "text",
      required: true,
      ...numericError(values.capacity, "Enter a valid capacity greater than zero.", true)
    }),
    waitlistCapacity: input({
      name: "waitlistCapacity",
      label: "Waitlist capacity",
      value: values.waitlistCapacity,
      type: "text",
      required: false,
      ...numericError(values.waitlistCapacity, "Enter a valid non-negative waitlist capacity.")
    }),
    cancellationCutoffMinutes: input({
      name: "cancellationCutoffMinutes",
      label: "Cancellation cutoff in minutes",
      value: values.cancellationCutoffMinutes,
      type: "text",
      required: false,
      ...numericError(
        values.cancellationCutoffMinutes,
        "Enter a valid non-negative cancellation cutoff."
      )
    }),
    lateCancellationFeeCents: input({
      name: "lateCancellationFeeCents",
      label: "Late cancellation fee in cents",
      value: values.lateCancellationFeeCents,
      type: "text",
      required: false,
      ...numericError(
        values.lateCancellationFeeCents,
        "Enter a valid non-negative late cancellation fee."
      )
    })
  };
}

function buildClassTypeOptions(
  classTypes: ClassTypeView[],
  selectedClassTypeId: string
): ClassSessionTypeOption[] {
  return classTypes
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((classType) => ({
      value: classType.id,
      label: classType.name,
      selected: classType.id === selectedClassTypeId
    }));
}

function buildLocationOptions(
  locations: ClassLocationView[],
  selectedLocationId: string
): ClassSessionEditorLocationOption[] {
  return locations
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((location) => ({
      value: location.id,
      label: location.name,
      selected: location.id === selectedLocationId
    }));
}

function buildTrainerOptions(
  trainers: ClassTrainerView[],
  selectedTrainerUserId?: string
): ClassSessionEditorTrainerOption[] {
  return trainers
    .slice()
    .sort((left, right) => left.fullName.localeCompare(right.fullName))
    .map((trainer) => ({
      value: trainer.id,
      label: trainer.fullName,
      selected: trainer.id === selectedTrainerUserId
    }));
}

function numericError(value: string, message: string, mustBePositive = false) {
  const parsed = mustBePositive ? parsePositiveInt(value) : parseNonNegativeInt(value);
  return value.length > 0 && parsed === undefined ? { error: message } : noFieldError();
}

function endTimeError(values: NormalizedEditorValues) {
  if (values.endsAt.length === 0) {
    return "End time is required.";
  }
  if (!values.startsAt || !values.endsAt) {
    return undefined;
  }
  const startsAt = Date.parse(values.startsAt);
  const endsAt = Date.parse(values.endsAt);
  if (Number.isNaN(startsAt) || Number.isNaN(endsAt)) {
    return undefined;
  }
  return endsAt > startsAt ? undefined : "End time must be after the start time.";
}

function buildEndTimeError(values: NormalizedEditorValues) {
  const error = endTimeError(values);
  return error ? { error } : noFieldError();
}

function canSubmitEditor(values: NormalizedEditorValues, canWriteClasses: boolean) {
  return Boolean(
    canWriteClasses &&
      values.classTypeId &&
      values.locationId &&
      values.startsAt &&
      values.endsAt &&
      !endTimeError(values) &&
      parsePositiveInt(values.capacity) !== undefined &&
      parseNonNegativeInt(values.waitlistCapacity) !== undefined &&
      parseNonNegativeInt(values.cancellationCutoffMinutes) !== undefined &&
      parseNonNegativeInt(values.lateCancellationFeeCents) !== undefined
  );
}

function buildSummaryLabel(
  values: NormalizedEditorValues,
  classTypes: ClassTypeView[],
  locations: ClassLocationView[]
) {
  const classType = classTypes.find((item) => item.id === values.classTypeId);
  const location = locations.find((item) => item.id === values.locationId);
  return `${classType?.name ?? "Class"} at ${location?.name ?? "Location"} on ${
    values.startsAt || "unscheduled time"
  }`;
}

function changedFieldsForSession(
  session: ClassSessionView,
  values: NormalizedEditorValues
): ClassSessionEditScreen["changedFields"] {
  const fields: ClassSessionEditScreen["changedFields"] = [];
  if (values.classTypeId !== session.classTypeId) fields.push("classTypeId");
  if (values.locationId !== session.locationId) fields.push("locationId");
  if ((values.trainerUserId ?? undefined) !== session.trainerUserId) fields.push("trainerUserId");
  if (values.roomName !== (session.roomName ?? "")) fields.push("roomName");
  if (values.startsAt !== session.startsAt) fields.push("startsAt");
  if (values.endsAt !== session.endsAt) fields.push("endsAt");
  if ((parsePositiveInt(values.capacity) ?? 0) !== session.capacity) fields.push("capacity");
  if ((parseNonNegativeInt(values.waitlistCapacity) ?? 0) !== session.waitlistCapacity) {
    fields.push("waitlistCapacity");
  }
  const sessionWithRules = session as ClassSessionView & {
    cancellationCutoffMinutes?: number;
    lateCancellationFeeCents?: number;
  };
  if (
    (parseNonNegativeInt(values.cancellationCutoffMinutes) ?? 0) !==
    (sessionWithRules.cancellationCutoffMinutes ?? 0)
  ) {
    fields.push("cancellationCutoffMinutes");
  }
  if (
    (parseNonNegativeInt(values.lateCancellationFeeCents) ?? 0) !==
    (sessionWithRules.lateCancellationFeeCents ?? 0)
  ) {
    fields.push("lateCancellationFeeCents");
  }
  return fields;
}

function buildSubmission(values: NormalizedEditorValues): ClassSessionCreateInput {
  const submission: ClassSessionCreateInput = {
    classTypeId: values.classTypeId,
    locationId: values.locationId,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
    capacity: parsePositiveInt(values.capacity) ?? 1,
    waitlistCapacity: parseNonNegativeInt(values.waitlistCapacity) ?? 0,
    cancellationCutoffMinutes: parseNonNegativeInt(values.cancellationCutoffMinutes) ?? 0,
    lateCancellationFeeCents: parseNonNegativeInt(values.lateCancellationFeeCents) ?? 0
  };
  if (values.trainerUserId) {
    submission.trainerUserId = values.trainerUserId;
  }
  if (values.roomName) {
    submission.roomName = values.roomName;
  }
  return submission;
}

function normalizeEditorValues(inputModel: EditorInputValues): NormalizedEditorValues {
  return {
    classTypeId: inputModel.classTypeId?.trim() ?? "",
    locationId: inputModel.locationId?.trim() ?? "",
    trainerUserId: normalizeOptionalText(inputModel.trainerUserId),
    roomName: inputModel.roomName?.trim() ?? "",
    startsAt: inputModel.startsAt?.trim() ?? "",
    endsAt: inputModel.endsAt?.trim() ?? "",
    capacity: normalizeNumberString(inputModel.capacity, "1"),
    waitlistCapacity: normalizeNumberString(inputModel.waitlistCapacity, "0"),
    cancellationCutoffMinutes: normalizeNumberString(inputModel.cancellationCutoffMinutes, "0"),
    lateCancellationFeeCents: normalizeNumberString(inputModel.lateCancellationFeeCents, "0")
  };
}

function normalizeNumberString(value: string | undefined, fallback = "") {
  return value?.trim() ?? fallback;
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function parsePositiveInt(value: string) {
  if (!/^\d+$/.test(value)) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return parsed > 0 ? parsed : undefined;
}

function parseNonNegativeInt(value: string) {
  if (!/^\d+$/.test(value)) {
    return undefined;
  }
  return Number.parseInt(value, 10);
}

interface EditorInputValues {
  classTypeId?: string;
  locationId?: string;
  trainerUserId?: string | undefined;
  roomName?: string | undefined;
  startsAt?: string;
  endsAt?: string;
  capacity?: string;
  waitlistCapacity?: string;
  cancellationCutoffMinutes?: string;
  lateCancellationFeeCents?: string | undefined;
}

interface NormalizedEditorValues {
  classTypeId: string;
  locationId: string;
  trainerUserId: string | undefined;
  roomName: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  waitlistCapacity: string;
  cancellationCutoffMinutes: string;
  lateCancellationFeeCents: string;
}

function noFieldError(): Partial<Pick<InputModel, "error">> {
  return {};
}
