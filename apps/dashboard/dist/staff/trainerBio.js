import { RoleName, UserStatus } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
const DEFAULT_MAX_BIO_LENGTH = 1000;
export function buildTrainerBioEditor(inputModel) {
    const maxLength = inputModel.maxLength ?? DEFAULT_MAX_BIO_LENGTH;
    const eligible = inputModel.staff.roleName === RoleName.Trainer && inputModel.staff.status === UserStatus.Active;
    const bio = normalizeTrainerBio(inputModel.bio);
    const originalBio = normalizeTrainerBio(inputModel.originalBio ?? bio);
    const characterCount = bio.length;
    const remainingCharacters = maxLength - characterCount;
    const overLimit = remainingCharacters < 0;
    const reason = eligibilityReason(inputModel.staff);
    const canSubmit = eligible && !overLimit && bio !== originalBio;
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
export function createTrainerBioSubmission(inputModel) {
    return {
        userId: inputModel.userId,
        bio: normalizeTrainerBio(inputModel.bio)
    };
}
export function normalizeTrainerBio(bio) {
    return (bio ?? "")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
function eligibilityReason(staff) {
    if (staff.roleName !== RoleName.Trainer) {
        return "Only trainer profiles can manage bios.";
    }
    if (staff.status !== UserStatus.Active) {
        return "Only active trainers can manage bios.";
    }
    return undefined;
}
//# sourceMappingURL=trainerBio.js.map