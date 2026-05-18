import type { ButtonModel, InputModel } from "@gym-platform/ui";
import type { StaffCreateSubmission, StaffEditSubmission, StaffMemberView, StaffRoleOption } from "./types.js";
export interface StaffCreateRoleOption extends StaffRoleOption {
    selected: boolean;
    disabled: boolean;
}
export interface StaffCreateMemberForm {
    screen: "staff_create_member";
    fields: {
        firstName: InputModel;
        lastName: InputModel;
        email: InputModel;
        message: InputModel;
    };
    roleOptions: StaffCreateRoleOption[];
    selectedRoleId?: string;
    canSubmit: boolean;
    submitAction: ButtonModel;
    cancelAction: ButtonModel;
}
export interface StaffEditMemberForm {
    screen: "staff_edit_member";
    staff: StaffMemberView;
    fields: {
        firstName: InputModel;
        lastName: InputModel;
        email: InputModel;
    };
    roleOptions: StaffCreateRoleOption[];
    selectedRoleId: string;
    changedFields: Array<"firstName" | "lastName" | "email" | "roleId">;
    locked: boolean;
    canSubmit: boolean;
    submitAction: ButtonModel;
    cancelAction: ButtonModel;
}
export declare function buildStaffCreateMemberForm(inputModel: {
    roles: StaffRoleOption[];
    firstName?: string;
    lastName?: string;
    email?: string;
    selectedRoleId?: string;
    message?: string;
}): StaffCreateMemberForm;
export declare function createStaffMemberSubmission(inputModel: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    message?: string;
}): StaffCreateSubmission;
export declare function buildStaffEditMemberForm(inputModel: {
    staff: StaffMemberView;
    roles: StaffRoleOption[];
    firstName?: string;
    lastName?: string;
    email?: string;
    selectedRoleId?: string;
    locked?: boolean;
}): StaffEditMemberForm;
export declare function createStaffEditSubmission(inputModel: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
}): StaffEditSubmission;
//# sourceMappingURL=create.d.ts.map