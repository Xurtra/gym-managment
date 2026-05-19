import { RoleName, UserStatus } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import type { StaffMemberView, TrainerSpecialtiesSubmission } from "./types.js";

export interface TrainerSpecialtyItem {
  key: string;
  label: string;
  removeAction: ButtonModel;
}

export interface TrainerSpecialtiesEditor {
  screen: "trainer_specialties_editor";
  staff: StaffMemberView;
  eligible: boolean;
  specialties: TrainerSpecialtyItem[];
  specialtyCount: number;
  pendingSpecialtyField: InputModel;
  duplicatePendingSpecialty: boolean;
  hasChanges: boolean;
  summaryLabel: string;
  canAdd: boolean;
  canSubmit: boolean;
  actionCount: number;
  addAction: ButtonModel;
  saveAction: ButtonModel;
  reason?: string;
}

export function buildTrainerSpecialtiesEditor(inputModel: {
  staff: StaffMemberView;
  specialties?: string[];
  pendingSpecialty?: string;
  originalSpecialties?: string[];
}): TrainerSpecialtiesEditor {
  const eligible =
    inputModel.staff.roleName === RoleName.Trainer && inputModel.staff.status === UserStatus.Active;
  const specialties = normalizeSpecialties(inputModel.specialties ?? []);
  const originalSpecialties = normalizeSpecialties(inputModel.originalSpecialties ?? specialties);
  const pendingSpecialty = normalizeSpecialty(inputModel.pendingSpecialty);
  const duplicatePendingSpecialty = Boolean(
    pendingSpecialty &&
      specialties.some((specialty) => specialty.toLowerCase() === pendingSpecialty.toLowerCase())
  );
  const canAdd = Boolean(eligible && pendingSpecialty && !duplicatePendingSpecialty);
  const hasChanges = !sameSpecialties(specialties, originalSpecialties);
  const canSubmit = Boolean(eligible && hasChanges);
  const reason = eligibilityReason(inputModel.staff);

  return {
    screen: "trainer_specialties_editor",
    staff: inputModel.staff,
    eligible,
    specialties: specialties.map((specialty) => ({
      key: slugify(specialty),
      label: specialty,
      removeAction: button({
        label: `Remove ${specialty}`,
        icon: "x",
        intent: "secondary",
        disabled: !eligible
      })
    })),
    specialtyCount: specialties.length,
    pendingSpecialtyField: input({
      name: "specialty",
      label: "Specialty",
      value: pendingSpecialty,
      type: "text",
      required: false,
      ...(duplicatePendingSpecialty ? { error: "Specialty already exists." } : {})
    }),
    duplicatePendingSpecialty,
    hasChanges,
    summaryLabel: !eligible
      ? "Trainer specialties unavailable"
      : specialties.length === 0
        ? "No specialties added"
        : `${specialties.length} trainer specialt${specialties.length === 1 ? "y" : "ies"}`,
    canAdd,
    canSubmit,
    actionCount: 2,
    addAction: button({
      label: "Add specialty",
      icon: "plus",
      disabled: !canAdd
    }),
    saveAction: button({
      label: "Save specialties",
      icon: "save",
      disabled: !canSubmit
    }),
    ...(reason ? { reason } : {})
  };
}

export function addTrainerSpecialty(specialties: string[], specialty: string) {
  return normalizeSpecialties([...specialties, specialty]);
}

export function removeTrainerSpecialty(specialties: string[], specialty: string) {
  const normalizedTarget = normalizeSpecialty(specialty).toLowerCase();
  return normalizeSpecialties(
    specialties.filter(
      (candidate) => normalizeSpecialty(candidate).toLowerCase() !== normalizedTarget
    )
  );
}

export function createTrainerSpecialtiesSubmission(inputModel: {
  userId: string;
  specialties: string[];
}): TrainerSpecialtiesSubmission {
  return {
    userId: inputModel.userId,
    specialties: normalizeSpecialties(inputModel.specialties)
  };
}

function normalizeSpecialties(specialties: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const specialty of specialties) {
    const value = normalizeSpecialty(specialty);
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      normalized.push(value);
    }
  }
  return normalized.sort((left, right) => left.localeCompare(right));
}

function normalizeSpecialty(specialty: string | undefined) {
  return (specialty ?? "").trim().replace(/\s+/g, " ");
}

function sameSpecialties(left: string[], right: string[]) {
  return (
    left.length === right.length && left.every((specialty, index) => specialty === right[index])
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function eligibilityReason(staff: StaffMemberView) {
  if (staff.roleName !== RoleName.Trainer) {
    return "Only trainer profiles can manage specialties.";
  }
  if (staff.status !== UserStatus.Active) {
    return "Only active trainers can manage specialties.";
  }
  return undefined;
}
