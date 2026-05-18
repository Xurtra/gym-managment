import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";
import type { StaffAuditEntryView, StaffMemberView, StaffRoleOption } from "./types.js";
export interface StaffProfileDetail {
    key: string;
    label: string;
    value: string;
}
export interface StaffProfileAction {
    key: "edit_permissions" | "remove_access" | "back_to_staff";
    button: ButtonModel;
    href?: string;
}
export interface StaffProfileAuditItem extends StaffAuditEntryView {
    actionLabel: string;
    actorLabel: string;
    targetLabel: string;
    changeSummary: string;
}
export interface StaffProfilePage {
    screen: "staff_profile";
    staff: StaffMemberView;
    fullName: string;
    initials: string;
    roleLabel: string;
    statusLabel: string;
    locked: boolean;
    details: StaffProfileDetail[];
    actions: StaffProfileAction[];
    auditTrail: StaffProfileAuditItem[];
    auditEmpty?: EmptyStateModel;
}
export declare function buildStaffProfilePage(inputModel: {
    staff: StaffMemberView;
    roles: StaffRoleOption[];
    permissions: string[];
    auditEntries?: StaffAuditEntryView[];
    currentUserId?: string;
    ownerUserId?: string;
}): StaffProfilePage;
//# sourceMappingURL=profile.d.ts.map