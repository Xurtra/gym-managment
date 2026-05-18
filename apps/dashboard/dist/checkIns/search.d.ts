import type { MemberSearchResult } from "./types.js";
export interface MemberSearchScreen {
    query: string;
    results: MemberSearchResult[];
    selectedMember?: MemberSearchResult;
    emptyState: boolean;
}
export declare function buildMemberSearchScreen(members: MemberSearchResult[], query: string, selectedMemberId?: string): MemberSearchScreen;
//# sourceMappingURL=search.d.ts.map