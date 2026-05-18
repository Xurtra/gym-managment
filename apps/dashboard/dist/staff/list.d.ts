import { UserStatus } from "@gym-platform/constants";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";
import type { StaffMemberView, StaffRoleOption } from "./types.js";
export interface StaffListFilters {
    query?: string;
    roleId?: string;
    status?: UserStatus;
}
export interface StaffListRoleFilterOption extends StaffRoleOption {
    selected: boolean;
}
export interface StaffListStatusFilterOption {
    value: UserStatus;
    label: string;
    selected: boolean;
}
export interface StaffListAction {
    key: "view" | "edit_permissions" | "remove_access";
    button: ButtonModel;
    href?: string;
}
export interface StaffListRow extends StaffMemberView {
    fullName: string;
    initials: string;
    roleLabel: string;
    statusLabel: string;
    active: boolean;
    detailHref: string;
    actions: StaffListAction[];
}
export interface StaffListSummary {
    totalCount: number;
    activeCount: number;
    invitedCount: number;
    disabledCount: number;
    visibleCount: number;
}
export interface StaffListPage {
    screen: "staff_list";
    filters: Required<Pick<StaffListFilters, "query">> & Omit<StaffListFilters, "query">;
    searchField: InputModel;
    roleOptions: StaffListRoleFilterOption[];
    statusOptions: StaffListStatusFilterOption[];
    summary: StaffListSummary;
    rows: StaffListRow[];
    table: TableModel<StaffListRow>;
    empty?: EmptyStateModel;
    inviteAction: ButtonModel;
    manageRolesAction: ButtonModel;
}
export declare function buildStaffListPage(inputModel: {
    staff: StaffMemberView[];
    roles: StaffRoleOption[];
    permissions: string[];
    filters?: StaffListFilters;
}): StaffListPage;
//# sourceMappingURL=list.d.ts.map