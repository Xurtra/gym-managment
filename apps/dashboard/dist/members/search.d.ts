import { type MemberStatusBadge } from "./statusBadges.js";
import type { MemberView } from "./types.js";
export type MemberSearchField = "name" | "email" | "phone" | "barcode";
export interface MemberDirectorySearchResult extends MemberView {
    fullName: string;
    statusBadge: MemberStatusBadge;
    matchedFields: MemberSearchField[];
    matchSummary: string;
    detailHref: string;
}
export interface MemberDirectorySearchScreen {
    screen: "member_directory_search";
    query: string;
    results: MemberDirectorySearchResult[];
    selectedMember?: MemberDirectorySearchResult;
    searchableFields: MemberSearchField[];
    emptyState: boolean;
}
export declare function buildMemberDirectorySearchScreen(members: MemberView[], query: string, selectedMemberId?: string): MemberDirectorySearchScreen;
export declare function matchesMemberDirectoryQuery(member: MemberView, query: string): boolean;
export declare function findMemberDirectorySearchFields(member: MemberView, query: string): MemberSearchField[];
//# sourceMappingURL=search.d.ts.map