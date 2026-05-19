import { RoleName, UserStatus } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import { buildDashboardImageUpload } from "../shell/index.js";
const PROFILE_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const PROFILE_IMAGE_MIN_WIDTH = 320;
const PROFILE_IMAGE_MIN_HEIGHT = 320;
const PROFILE_IMAGE_ASPECT_RATIO = 1;
export function buildTrainerProfileImageUpload(inputModel) {
    const eligible = inputModel.staff.roleName === RoleName.Trainer && inputModel.staff.status === UserStatus.Active;
    const currentImageUrl = normalizeOptionalText(inputModel.currentImageUrl);
    const altText = normalizeOptionalText(inputModel.altText) ?? defaultAltText(inputModel.staff);
    const upload = buildDashboardImageUpload({
        label: "Trainer profile image",
        altText,
        maxSizeBytes: PROFILE_IMAGE_MAX_SIZE_BYTES,
        minWidth: PROFILE_IMAGE_MIN_WIDTH,
        minHeight: PROFILE_IMAGE_MIN_HEIGHT,
        aspectRatio: PROFILE_IMAGE_ASPECT_RATIO,
        ...(inputModel.file ? { file: inputModel.file } : {}),
        ...(inputModel.uploading !== undefined ? { uploading: inputModel.uploading } : {}),
        ...(inputModel.uploaded !== undefined ? { uploaded: inputModel.uploaded } : {})
    });
    const canUpload = eligible && upload.status === "ready";
    const canRemove = eligible && Boolean(currentImageUrl);
    const canClearUpload = eligible && Boolean(inputModel.file || currentImageUrl);
    const previewUrl = inputModel.file?.previewUrl ?? currentImageUrl;
    const hasPreview = Boolean(previewUrl);
    const reason = eligibilityReason(inputModel.staff);
    return {
        screen: "trainer_profile_image_upload",
        staff: inputModel.staff,
        eligible,
        hasCurrentImage: Boolean(currentImageUrl),
        ...(currentImageUrl ? { currentImageUrl } : {}),
        hasPreview,
        ...(previewUrl ? { previewUrl } : {}),
        upload: {
            ...upload,
            uploadAction: {
                ...upload.uploadAction,
                disabled: !canUpload
            },
            removeAction: {
                ...upload.removeAction,
                disabled: !canClearUpload
            }
        },
        canUpload,
        canRemove,
        actionCount: 2,
        summaryLabel: !eligible
            ? "Trainer profile image unavailable"
            : canUpload
                ? "Trainer profile image ready to upload"
                : canRemove
                    ? "Trainer profile image available"
                    : "No trainer profile image selected",
        removeAction: button({
            label: "Remove profile image",
            icon: "trash-2",
            intent: "secondary",
            disabled: !canRemove
        }),
        saveAction: button({
            label: inputModel.uploading ? "Uploading" : "Upload profile image",
            icon: "upload",
            disabled: !canUpload
        }),
        ...(reason ? { reason } : {})
    };
}
export function createTrainerProfileImageSubmission(inputModel) {
    const removeImage = inputModel.removeImage ?? false;
    const submission = {
        userId: inputModel.userId,
        removeImage
    };
    const imageUrl = normalizeOptionalText(inputModel.imageUrl);
    const altText = normalizeOptionalText(inputModel.altText);
    if (!removeImage && imageUrl) {
        submission.imageUrl = imageUrl;
    }
    if (!removeImage && altText) {
        submission.altText = altText;
    }
    return submission;
}
function normalizeOptionalText(value) {
    const normalized = value?.trim().replace(/\s+/g, " ");
    return normalized || undefined;
}
function defaultAltText(staff) {
    const fullName = `${staff.firstName} ${staff.lastName}`.trim().replace(/\s+/g, " ");
    return `${fullName || staff.email} profile image`;
}
function eligibilityReason(staff) {
    if (staff.roleName !== RoleName.Trainer) {
        return "Only trainer profiles can manage profile images.";
    }
    if (staff.status !== UserStatus.Active) {
        return "Only active trainers can manage profile images.";
    }
    return undefined;
}
//# sourceMappingURL=trainerProfileImage.js.map