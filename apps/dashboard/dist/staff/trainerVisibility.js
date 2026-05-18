import { RoleName, UserStatus } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
export function buildTrainerPublicVisibilitySetting(inputModel) {
    const eligible = inputModel.staff.roleName === RoleName.Trainer && inputModel.staff.status === UserStatus.Active;
    const profileSlug = normalizeSlug(inputModel.profileSlug ?? fullNameForSlug(inputModel.staff));
    const visible = Boolean(inputModel.publicProfileVisible && eligible);
    const publicUrl = inputModel.basePublicUrl
        ? `${inputModel.basePublicUrl.replace(/\/$/, "")}/trainers/${profileSlug}`
        : undefined;
    const reason = eligibilityReason(inputModel.staff);
    return {
        screen: "trainer_public_visibility",
        staff: inputModel.staff,
        eligible,
        visible,
        profileSlug,
        ...(publicUrl ? { publicUrl } : {}),
        slugField: input({
            name: "profileSlug",
            label: "Profile slug",
            value: profileSlug,
            type: "text",
            required: true,
            ...(!profileSlug ? { error: "Profile slug is required." } : {})
        }),
        publishAction: button({
            label: "Show public profile",
            icon: "eye",
            disabled: !eligible || !profileSlug || visible
        }),
        hideAction: button({
            label: "Hide public profile",
            icon: "eye-off",
            intent: "secondary",
            disabled: !eligible || !visible
        }),
        previewAction: button({
            label: "Preview profile",
            icon: "external-link",
            intent: "secondary",
            disabled: !visible || !publicUrl
        }),
        canSubmit: eligible && Boolean(profileSlug),
        ...(reason ? { reason } : {})
    };
}
export function createTrainerPublicVisibilitySubmission(inputModel) {
    const submission = {
        userId: inputModel.userId,
        publicProfileVisible: inputModel.publicProfileVisible
    };
    const profileSlug = normalizeSlug(inputModel.profileSlug);
    if (profileSlug) {
        submission.profileSlug = profileSlug;
    }
    return submission;
}
function fullNameForSlug(staff) {
    const name = `${staff.firstName} ${staff.lastName}`.trim();
    return name || staff.email.split("@")[0] || staff.userId;
}
function normalizeSlug(value) {
    return (value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function eligibilityReason(staff) {
    if (staff.roleName !== RoleName.Trainer) {
        return "Only trainer profiles can be made public.";
    }
    if (staff.status !== UserStatus.Active) {
        return "Only active trainers can be made public.";
    }
    return undefined;
}
//# sourceMappingURL=trainerVisibility.js.map