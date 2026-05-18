import type { ButtonModel, InputModel, ModalModel, TableModel } from "@gym-platform/ui";
import type { StaffAccessRemovalSubmission, StaffAuditEntryView, StaffMemberView, StaffPermissionChangeSubmission, StaffRoleOption } from "./types.js";
export interface StaffPermissionRow extends StaffMemberView {
    fullName: string;
    locked: boolean;
    canEdit: boolean;
    canRemove: boolean;
    roleOptions: Array<StaffRoleOption & {
        selected: boolean;
        disabled: boolean;
    }>;
}
export interface StaffPermissionsScreen {
    screen: "staff_permissions";
    canEditRoles: boolean;
    canRemoveStaff: boolean;
    roleOptions: StaffRoleOption[];
    rows: StaffPermissionRow[];
    selectedUserId?: string;
    selectedRoleId?: string;
    canSubmitRoleChange: boolean;
    reasonField: InputModel;
    saveAction: ButtonModel;
    removeAction: ButtonModel;
    removalModal: ModalModel;
    table: TableModel<StaffPermissionRow>;
    auditTrail: StaffAuditEntryView[];
}
export declare function buildStaffPermissionsScreen(inputModel: {
    staff: StaffMemberView[];
    roles: StaffRoleOption[];
    permissions: string[];
    auditEntries?: StaffAuditEntryView[];
    currentUserId?: string;
    ownerUserId?: string;
    selectedUserId?: string;
    selectedRoleId?: string;
    removalUserId?: string;
    removalReason?: string;
}): StaffPermissionsScreen;
export declare function createStaffPermissionChangeSubmission(inputModel: {
    userId: string;
    roleId: string;
}): StaffPermissionChangeSubmission;
export declare function createStaffAccessRemovalSubmission(inputModel: {
    userId: string;
    reason?: string;
}): StaffAccessRemovalSubmission;
//# sourceMappingURL=access.d.ts.map