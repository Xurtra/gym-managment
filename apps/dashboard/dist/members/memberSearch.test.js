import { MemberStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildMemberDirectorySearchScreen, findMemberDirectorySearchFields, matchesMemberDirectoryQuery } from "./index.js";
const members = [
    {
        id: "member-1",
        gymId: "gym-1",
        firstName: "Jamie",
        lastName: "Rivera",
        email: "jamie@example.com",
        phone: "555-0101",
        barcode: "MEM-100",
        status: MemberStatus.Active,
        tagNames: ["Strength"],
        createdAt: "2026-05-16T12:00:00.000Z",
        updatedAt: "2026-05-16T12:00:00.000Z"
    },
    {
        id: "member-2",
        gymId: "gym-1",
        firstName: "Jordan",
        lastName: "Lee",
        email: "jordan@example.com",
        phone: "(555) 0102",
        barcode: "BAR-200",
        status: MemberStatus.PastDue,
        tagNames: ["Yoga"],
        createdAt: "2026-05-15T12:00:00.000Z",
        updatedAt: "2026-05-16T12:00:00.000Z"
    },
    {
        id: "member-3",
        gymId: "gym-1",
        firstName: "Casey",
        lastName: "Ng",
        status: MemberStatus.Trial,
        tagNames: [],
        createdAt: "2026-05-14T12:00:00.000Z",
        updatedAt: "2026-05-16T12:00:00.000Z"
    }
];
describe("member search", () => {
    it("matches members by name, email, phone, and barcode", () => {
        expect(findMemberDirectorySearchFields(members[0], "jamie")).toEqual(["name", "email"]);
        expect(findMemberDirectorySearchFields(members[1], "jordan@example.com")).toEqual(["email"]);
        expect(findMemberDirectorySearchFields(members[1], "5550102")).toEqual(["phone"]);
        expect(findMemberDirectorySearchFields(members[1], "bar-200")).toEqual(["barcode"]);
        expect(matchesMemberDirectoryQuery(members[2], "member-3")).toBe(false);
    });
    it("builds search results with matched-field summaries and selected member state", () => {
        const barcodeSearch = buildMemberDirectorySearchScreen(members, "BAR", "member-2");
        const phoneSearch = buildMemberDirectorySearchScreen(members, "5550102");
        const browse = buildMemberDirectorySearchScreen(members, "");
        const empty = buildMemberDirectorySearchScreen(members, "missing");
        expect(barcodeSearch.screen).toBe("member_directory_search");
        expect(barcodeSearch.results.map((member) => member.id)).toEqual(["member-2"]);
        expect(barcodeSearch.results[0]?.matchedFields).toEqual(["barcode"]);
        expect(barcodeSearch.results[0]?.statusBadge.label).toBe("Past due");
        expect(barcodeSearch.results[0]?.statusBadge.tone).toBe("warning");
        expect(barcodeSearch.results[0]?.matchSummary).toBe("Matched on barcode");
        expect(barcodeSearch.selectedMember?.id).toBe("member-2");
        expect(barcodeSearch.selectedMemberId).toBe("member-2");
        expect(barcodeSearch.resultCount).toBe(1);
        expect(barcodeSearch.searchableFields).toEqual(["name", "email", "phone", "barcode"]);
        expect(barcodeSearch.searchableFieldCount).toBe(4);
        expect(barcodeSearch.summaryLabel).toBe("Found 1 member");
        expect(phoneSearch.results[0]?.matchedFields).toEqual(["phone"]);
        expect(browse.results.map((member) => member.id)).toEqual(["member-1", "member-3", "member-2"]);
        expect(browse.results[0]?.matchSummary).toBe("Browse members");
        expect(browse.resultCount).toBe(3);
        expect(browse.summaryLabel).toBe("Browsing 3 members");
        expect(empty.emptyState).toBe(true);
        expect(empty.resultCount).toBe(0);
        expect(empty.summaryLabel).toBe("Found 0 members");
    });
});
//# sourceMappingURL=memberSearch.test.js.map