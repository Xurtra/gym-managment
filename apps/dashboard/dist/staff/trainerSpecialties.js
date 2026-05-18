import { RoleName, UserStatus } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
export function buildTrainerSpecialtiesEditor(inputModel) {
    const eligible = inputModel.staff.roleName === RoleName.Trainer && inputModel.staff.status === UserStatus.Active;
    const specialties = normalizeSpecialties(inputModel.specialties ?? []);
    const originalSpecialties = normalizeSpecialties(inputModel.originalSpecialties ?? specialties);
    const pendingSpecialty = normalizeSpecialty(inputModel.pendingSpecialty);
    const duplicatePendingSpecialty = Boolean(pendingSpecialty &&
        specialties.some((specialty) => specialty.toLowerCase() === pendingSpecialty.toLowerCase()));
    const canAdd = Boolean(eligible && pendingSpecialty && !duplicatePendingSpecialty);
    const canSubmit = Boolean(eligible && !sameSpecialties(specialties, originalSpecialties));
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
        pendingSpecialtyField: input({
            name: "specialty",
            label: "Specialty",
            value: pendingSpecialty,
            type: "text",
            required: false,
            ...(duplicatePendingSpecialty ? { error: "Specialty already exists." } : {})
        }),
        duplicatePendingSpecialty,
        canAdd,
        canSubmit,
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
export function addTrainerSpecialty(specialties, specialty) {
    return normalizeSpecialties([...specialties, specialty]);
}
export function removeTrainerSpecialty(specialties, specialty) {
    const normalizedTarget = normalizeSpecialty(specialty).toLowerCase();
    return normalizeSpecialties(specialties.filter((candidate) => normalizeSpecialty(candidate).toLowerCase() !== normalizedTarget));
}
export function createTrainerSpecialtiesSubmission(inputModel) {
    return {
        userId: inputModel.userId,
        specialties: normalizeSpecialties(inputModel.specialties)
    };
}
function normalizeSpecialties(specialties) {
    const seen = new Set();
    const normalized = [];
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
function normalizeSpecialty(specialty) {
    return (specialty ?? "").trim().replace(/\s+/g, " ");
}
function sameSpecialties(left, right) {
    return (left.length === right.length && left.every((specialty, index) => specialty === right[index]));
}
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function eligibilityReason(staff) {
    if (staff.roleName !== RoleName.Trainer) {
        return "Only trainer profiles can manage specialties.";
    }
    if (staff.status !== UserStatus.Active) {
        return "Only active trainers can manage specialties.";
    }
    return undefined;
}
//# sourceMappingURL=trainerSpecialties.js.map