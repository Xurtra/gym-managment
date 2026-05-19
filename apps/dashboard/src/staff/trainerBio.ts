import { RoleName, UserStatus } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import type { StaffMemberView, TrainerBioSubmission } from "./types.js";

const DEFAULT_MAX_BIO_LENGTH = 1000;

export interface TrainerBioField {
  kind: "textarea";
  name: "bio";
  label: "Trainer bio";
  value: string;
  required: false;
  rows: number;
  maxLength: number;
  error?: string;
}

export interface TrainerBioEditor {
  screen: "trainer_bio_editor";
  staff: StaffMemberView;
  eligible: boolean;
  bio: string;
  originalBio: string;
  characterCount: number;
  maxLength: number;
  remainingCharacters: number;
  overLimit: boolean;
  hasChanges: boolean;
  bioField: TrainerBioField;
  actionCount: number;
  summaryLabel: string;
  canSubmit: boolean;
  saveAction: ButtonModel;
  clearAction: ButtonModel;
  reason?: string;
}

export function buildTrainerBioEditor(inputModel: {
  staff: StaffMemberView;
  bio?: string;
  originalBio?: string;
  maxLength?: number;
}): TrainerBioEditor {
  const maxLength = inputModel.maxLength ?? DEFAULT_MAX_BIO_LENGTH;
  const eligible =
    inputModel.staff.roleName === RoleName.Trainer && inputModel.staff.status === UserStatus.Active;
  const bio = normalizeTrainerBio(inputModel.bio);
  const originalBio = normalizeTrainerBio(inputModel.originalBio ?? bio);
  const characterCount = bio.length;
  const remainingCharacters = maxLength - characterCount;
  const overLimit = remainingCharacters < 0;
  const hasChanges = bio !== originalBio;
  const reason = eligibilityReason(inputModel.staff);
  const canSubmit = eligible && !overLimit && hasChanges;

  return {
    screen: "trainer_bio_editor",
    staff: inputModel.staff,
    eligible,
    bio,
    originalBio,
    characterCount,
    maxLength,
    remainingCharacters,
    overLimit,
    hasChanges,
    bioField: {
      kind: "textarea",
      name: "bio",
      label: "Trainer bio",
      value: bio,
      required: false,
      rows: 8,
      maxLength,
      ...(overLimit ? { error: `Bio must be ${maxLength} characters or fewer.` } : {})
    },
    actionCount: 2,
    summaryLabel: !eligible
      ? "Trainer bio unavailable"
      : overLimit
        ? "Trainer bio exceeds character limit"
        : !bio
          ? "Trainer bio is empty"
          : `${characterCount} bio character${characterCount === 1 ? "" : "s"}`,
    canSubmit,
    saveAction: button({
      label: "Save bio",
      icon: "save",
      disabled: !canSubmit
    }),
    clearAction: button({
      label: "Clear bio",
      icon: "trash-2",
      intent: "secondary",
      disabled: !eligible || !bio
    }),
    ...(reason ? { reason } : {})
  };
}

export function createTrainerBioSubmission(inputModel: {
  userId: string;
  bio?: string;
}): TrainerBioSubmission {
  return {
    userId: inputModel.userId,
    bio: normalizeTrainerBio(inputModel.bio)
  };
}

export function normalizeTrainerBio(bio: string | undefined) {
  return (bio ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function eligibilityReason(staff: StaffMemberView) {
  if (staff.roleName !== RoleName.Trainer) {
    return "Only trainer profiles can manage bios.";
  }
  if (staff.status !== UserStatus.Active) {
    return "Only active trainers can manage bios.";
  }
  return undefined;
}
