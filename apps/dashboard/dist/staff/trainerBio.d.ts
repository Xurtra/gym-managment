import type { ButtonModel } from "@gym-platform/ui";
import type { StaffMemberView, TrainerBioSubmission } from "./types.js";
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
    bioField: TrainerBioField;
    canSubmit: boolean;
    saveAction: ButtonModel;
    clearAction: ButtonModel;
    reason?: string;
}
export declare function buildTrainerBioEditor(inputModel: {
    staff: StaffMemberView;
    bio?: string;
    originalBio?: string;
    maxLength?: number;
}): TrainerBioEditor;
export declare function createTrainerBioSubmission(inputModel: {
    userId: string;
    bio?: string;
}): TrainerBioSubmission;
export declare function normalizeTrainerBio(bio: string | undefined): string;
//# sourceMappingURL=trainerBio.d.ts.map