import { type DashboardImageUpload, type ImageUploadFileInput } from "../shell/index.js";
import type { StaffMemberView, TrainerProfileImageSubmission } from "./types.js";
export interface TrainerProfileImageUploadEditor {
    screen: "trainer_profile_image_upload";
    staff: StaffMemberView;
    eligible: boolean;
    currentImageUrl?: string;
    previewUrl?: string;
    upload: DashboardImageUpload;
    canUpload: boolean;
    canRemove: boolean;
    removeAction: DashboardImageUpload["removeAction"];
    saveAction: DashboardImageUpload["uploadAction"];
    reason?: string;
}
export declare function buildTrainerProfileImageUpload(inputModel: {
    staff: StaffMemberView;
    currentImageUrl?: string;
    file?: ImageUploadFileInput;
    altText?: string;
    uploading?: boolean;
    uploaded?: boolean;
}): TrainerProfileImageUploadEditor;
export declare function createTrainerProfileImageSubmission(inputModel: {
    userId: string;
    imageUrl?: string;
    altText?: string;
    removeImage?: boolean;
}): TrainerProfileImageSubmission;
//# sourceMappingURL=trainerProfileImage.d.ts.map