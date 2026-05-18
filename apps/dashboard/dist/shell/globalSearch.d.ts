import type { Permission as PermissionValue } from "@gym-platform/constants";
import type { InputModel } from "@gym-platform/ui";
export type GlobalSearchResultType = "route" | "gym" | "location" | "member" | "staff" | "class" | "plan";
export interface GlobalSearchItem {
    id: string;
    type: GlobalSearchResultType;
    title: string;
    subtitle?: string;
    href: string;
    keywords?: string[];
    requiredPermissions?: PermissionValue[];
}
export interface GlobalSearchResult extends GlobalSearchItem {
    selected: boolean;
    score: number;
}
export interface GlobalGymSearchModel {
    kind: "global_gym_search";
    queryField: InputModel;
    open: boolean;
    query: string;
    placeholder: string;
    resultCount: number;
    results: GlobalSearchResult[];
    selectedResult?: GlobalSearchResult;
    empty: boolean;
}
export declare function buildGlobalGymSearch(inputModel: {
    query?: string;
    items?: GlobalSearchItem[];
    selectedResultId?: string;
    permissions?: PermissionValue[];
    platformAdmin?: boolean;
    limit?: number;
}): GlobalGymSearchModel;
//# sourceMappingURL=globalSearch.d.ts.map