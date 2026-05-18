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
    pendingSpecialtyField: InputModel;
    duplicatePendingSpecialty: boolean;
    canAdd: boolean;
    canSubmit: boolean;
    addAction: ButtonModel;
    saveAction: ButtonModel;
    reason?: string;
}
export declare function buildTrainerSpecialtiesEditor(inputModel: {
    staff: StaffMemberView;
    specialties?: string[];
    pendingSpecialty?: string;
    originalSpecialties?: string[];
}): TrainerSpecialtiesEditor;
export declare function addTrainerSpecialty(specialties: string[], specialty: string): string[];
export declare function removeTrainerSpecialty(specialties: string[], specialty: string): string[];
export declare function createTrainerSpecialtiesSubmission(inputModel: {
    userId: string;
    specialties: string[];
}): TrainerSpecialtiesSubmission;
//# sourceMappingURL=trainerSpecialties.d.ts.map