import { MemberStatus } from "@gym-platform/constants";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";
import { type MemberStatusBadge } from "./statusBadges.js";
import type { MemberView } from "./types.js";
export interface MemberListFilters {
    query?: string;
    status?: MemberStatus;
    tagName?: string;
}
export interface MemberListStatusFilterOption {
    value: MemberStatus;
    label: string;
    selected: boolean;
}
export interface MemberListTagFilterOption {
    value: string;
    label: string;
    selected: boolean;
}
export interface MemberListAction {
    key: "view" | "edit" | "check_in" | "archive";
    button: ButtonModel;
    href?: string;
}
export interface MemberListRow extends MemberView {
    fullName: string;
    initials: string;
    contactLabel: string;
    statusLabel: string;
    statusBadge: MemberStatusBadge;
    tagLabel: string;
    active: boolean;
    detailHref: string;
    actions: MemberListAction[];
}
export interface MemberListSummary {
    totalCount: number;
    leadCount: number;
    trialCount: number;
    activeCount: number;
    pastDueCount: number;
    frozenCount: number;
    cancelledCount: number;
    expiredCount: number;
    archivedCount: number;
    visibleCount: number;
}
export interface MemberListPage {
    screen: "member_list";
    filters: Required<Pick<MemberListFilters, "query">> & Omit<MemberListFilters, "query">;
    searchField: InputModel;
    statusOptions: MemberListStatusFilterOption[];
    tagOptions: MemberListTagFilterOption[];
    summary: MemberListSummary;
    rows: MemberListRow[];
    table: TableModel<MemberListRow>;
    empty?: EmptyStateModel;
    createMemberAction: ButtonModel;
    importMembersAction: ButtonModel;
}
export declare function buildMemberListPage(inputModel: {
    members: MemberView[];
    permissions: string[];
    filters?: MemberListFilters;
}): MemberListPage;
//# sourceMappingURL=list.d.ts.map