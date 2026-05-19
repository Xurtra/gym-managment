import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";
import type { StaffInviteAcceptanceSubmission, StaffInviteSubmission, StaffInviteView, StaffRoleOption } from "./types.js";
export interface StaffInviteFlowScreen {
    screen: "staff_invite_flow";
    emailField: InputModel;
    messageField: InputModel;
    roleOptions: Array<StaffRoleOption & {
        selected: boolean;
    }>;
    roleOptionCount: number;
    pendingInviteCount: number;
    expiredInviteCount: number;
    summaryLabel: string;
    selectedRoleId?: string;
    selectedRoleName?: string;
    pendingInvites: StaffInviteView[];
    empty?: EmptyStateModel;
    canSubmit: boolean;
    action: ButtonModel;
    table: TableModel<StaffInviteView>;
}
export interface StaffInviteAcceptScreen {
    screen: "staff_invite_accept";
    token: string;
    firstNameField: InputModel;
    lastNameField: InputModel;
    passwordField: InputModel;
    fields: InputModel[];
    completedFieldCount: number;
    summaryLabel: string;
    passwordValid: boolean;
    errorMessage?: string;
    canSubmit: boolean;
    action: ButtonModel;
}
export declare function buildStaffInviteFlow(inputModel: {
    roles: StaffRoleOption[];
    invites: StaffInviteView[];
    email?: string;
    selectedRoleId?: string;
    message?: string;
}): StaffInviteFlowScreen;
export declare function createStaffInviteSubmission(inputModel: {
    email: string;
    roleId: string;
    message?: string;
}): StaffInviteSubmission;
export declare function buildStaffInviteAcceptScreen(inputModel: {
    token?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
}): StaffInviteAcceptScreen;
export declare function createStaffInviteAcceptanceSubmission(inputModel: {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
}): StaffInviteAcceptanceSubmission;
//# sourceMappingURL=invites.d.ts.map