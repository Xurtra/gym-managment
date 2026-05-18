import type { ButtonModel, InputModel } from "@gym-platform/ui";
import type { StaffMemberView, TrainerPublicVisibilitySubmission } from "./types.js";
export interface TrainerPublicVisibilitySetting {
    screen: "trainer_public_visibility";
    staff: StaffMemberView;
    eligible: boolean;
    visible: boolean;
    profileSlug: string;
    publicUrl?: string;
    slugField: InputModel;
    publishAction: ButtonModel;
    hideAction: ButtonModel;
    previewAction: ButtonModel;
    canSubmit: boolean;
    reason?: string;
}
export declare function buildTrainerPublicVisibilitySetting(inputModel: {
    staff: StaffMemberView;
    publicProfileVisible?: boolean;
    profileSlug?: string;
    basePublicUrl?: string;
}): TrainerPublicVisibilitySetting;
export declare function createTrainerPublicVisibilitySubmission(inputModel: {
    userId: string;
    publicProfileVisible: boolean;
    profileSlug?: string;
}): TrainerPublicVisibilitySubmission;
//# sourceMappingURL=trainerVisibility.d.ts.map