import type { Permission as PermissionValue } from "@gym-platform/constants";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import type { CustomRoleSubmission, StaffRoleOption } from "./types.js";
export interface PermissionToggle {
    permission: PermissionValue;
    label: string;
    group: string;
    checked: boolean;
    disabled: boolean;
}
export interface PermissionGroup {
    key: string;
    label: string;
    toggles: PermissionToggle[];
}
export interface CustomRoleScreen {
    screen: "custom_role_create" | "custom_role_edit";
    roleId?: string;
    nameField: InputModel;
    permissionGroups: PermissionGroup[];
    selectedPermissions: PermissionValue[];
    canSubmit: boolean;
    action: ButtonModel;
}
export declare function buildCustomRoleCreateScreen(inputModel?: {
    name?: string;
    selectedPermissions?: PermissionValue[];
}): CustomRoleScreen;
export declare function buildCustomRoleEditScreen(inputModel: {
    role: StaffRoleOption;
    name?: string;
    selectedPermissions?: PermissionValue[];
}): CustomRoleScreen;
export declare function createCustomRoleSubmission(inputModel: {
    name: string;
    permissions: PermissionValue[];
}): CustomRoleSubmission;
//# sourceMappingURL=roles.d.ts.map