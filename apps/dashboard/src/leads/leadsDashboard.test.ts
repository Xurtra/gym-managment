import { MemberStatus, Permission } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  buildLeadConversionScreen,
  buildLeadDirectorySearchScreen,
  buildLeadListPage,
  buildLeadProfilePage,
  createLeadConversionSubmission
} from "./index.js";
import type { MemberView } from "../members/index.js";

const members: MemberView[] = [
  {
    id: "member-1",
    gymId: "gym-1",
    firstName: "Jamie",
    lastName: "Rivera",
    email: "jamie@example.com",
    phone: "555-0101",
    status: MemberStatus.Lead,
    tagNames: ["Website"],
    createdAt: "2026-05-16T12:00:00.000Z",
    updatedAt: "2026-05-16T12:00:00.000Z"
  },
  {
    id: "member-2",
    gymId: "gym-1",
    firstName: "Jordan",
    lastName: "Lee",
    phone: "555-0102",
    status: MemberStatus.Lead,
    tagNames: ["Referral"],
    createdAt: "2026-05-15T12:00:00.000Z",
    updatedAt: "2026-05-16T12:00:00.000Z"
  },
  {
    id: "member-3",
    gymId: "gym-1",
    firstName: "Casey",
    lastName: "Ng",
    email: "casey@example.com",
    status: MemberStatus.Active,
    tagNames: ["Converted"],
    createdAt: "2026-05-14T12:00:00.000Z",
    updatedAt: "2026-05-16T12:00:00.000Z"
  }
];

describe("leads dashboard", () => {
  it("builds the lead list page with lead-only rows and summary metadata", () => {
    const page = buildLeadListPage({
      members,
      permissions: [Permission.MemberRead, Permission.MemberWrite],
      filters: { query: " jamie ", tagName: " website " }
    });

    expect(page.screen).toBe("lead_list");
    expect(page.filters.tagName).toBe("website");
    expect(page.searchField.value).toBe("jamie");
    expect(page.tagOptions.map((option) => option.value)).toEqual(["Referral", "Website"]);
    expect(page.tagOptions.find((option) => option.value === "Website")?.selected).toBe(true);
    expect(page.totalLeadCount).toBe(2);
    expect(page.visibleLeadCount).toBe(1);
    expect(page.rowCount).toBe(1);
    expect(page.activeFilterCount).toBe(2);
    expect(page.tagOptionCount).toBe(2);
    expect(page.summaryLabel).toBe("Showing 1 of 2 leads");
    expect(page.rows.map((row) => row.id)).toEqual(["member-1"]);
    expect(page.rows[0]?.fullName).toBe("Jamie Rivera");
    expect(page.rows[0]?.contactLabel).toBe("jamie@example.com");
    expect(page.rows[0]?.tagLabel).toBe("Website");
    expect(page.rows[0]?.statusBadge.label).toBe("Lead");
    expect(page.rows[0]?.detailHref).toBe("/leads/member-1");
    expect(page.rows[0]?.actions.find((action) => action.key === "view")?.href).toBe(
      "/leads/member-1"
    );
    expect(page.rows[0]?.actions.find((action) => action.key === "edit")?.button.disabled).toBe(
      false
    );
    expect(page.createLeadAction.disabled).toBe(false);
  });

  it("builds empty lead states and permission-aware actions", () => {
    const readOnly = buildLeadListPage({
      members,
      permissions: [Permission.MemberRead]
    });
    const empty = buildLeadListPage({
      members,
      permissions: [Permission.MemberRead],
      filters: { tagName: "missing" }
    });

    expect(readOnly.rows.map((row) => row.id)).toEqual(["member-1", "member-2"]);
    expect(readOnly.activeFilterCount).toBe(0);
    expect(readOnly.tagOptionCount).toBe(2);
    expect(
      readOnly.rows[0]?.actions.find((action) => action.key === "edit")?.button.disabled
    ).toBe(true);
    expect(readOnly.createLeadAction.disabled).toBe(true);
    expect(empty.empty?.title).toBe("No leads match your filters");
    expect(empty.summaryLabel).toBe("Showing 0 of 2 leads");
  });

  it("builds a lead profile page with details, tags, and permission-aware actions", () => {
    const profile = buildLeadProfilePage({
      lead: {
        ...members[0]!,
        barcode: "LEAD-100",
        tagNames: ["Website", "Call Back"],
        emergencyContact: {
          name: "Avery Rivera",
          phone: "555-0199",
          relationship: "Spouse"
        },
        notes: "  Follow up after intro class.  "
      },
      permissions: [Permission.MemberRead, Permission.MemberWrite]
    });
    const readOnly = buildLeadProfilePage({
      lead: {
        ...members[1]!,
        tagNames: [],
        archivedAt: "2026-05-17T12:00:00.000Z"
      },
      permissions: [Permission.MemberRead]
    });

    expect(profile.screen).toBe("lead_profile");
    expect(profile.fullName).toBe("Jamie Rivera");
    expect(profile.initials).toBe("JR");
    expect(profile.statusLabel).toBe("Lead");
    expect(profile.statusBadge.label).toBe("Lead");
    expect(profile.archived).toBe(false);
    expect(profile.contactSection.primaryContactMethod).toBe("email");
    expect(profile.emergencyContactSection.hasEmergencyContact).toBe(true);
    expect(profile.emergencyContactSection.complete).toBe(true);
    expect(profile.notesSection.noteText).toBe("Follow up after intro class.");
    expect(profile.sections.find((section) => section.key === "identity")?.title).toBe(
      "Lead details"
    );
    expect(profile.sections.find((section) => section.key === "tags")?.details).toContainEqual({
      key: "tags",
      label: "Tags",
      value: "Website, Call Back"
    });
    expect(profile.sectionCount).toBe(5);
    expect(profile.tagCount).toBe(2);
    expect(profile.tagsLabel).toBe("Website, Call Back");
    expect(profile.summaryLabel).toBe("Showing 2 lead tags");
    expect(profile.actionCount).toBe(3);
    expect(profile.actions.find((action) => action.key === "back_to_leads")?.href).toBe("/leads");
    expect(profile.actions.find((action) => action.key === "edit")?.button.disabled).toBe(false);
    expect(readOnly.archived).toBe(true);
    expect(readOnly.tagsLabel).toBe("No tags");
    expect(readOnly.actions.find((action) => action.key === "edit")?.button.disabled).toBe(true);
    expect(readOnly.actions.find((action) => action.key === "archive")?.button.disabled).toBe(
      true
    );
  });

  it("builds lead search results with matched-field summaries and selected lead state", () => {
    const emailSearch = buildLeadDirectorySearchScreen(members, "jamie@example.com", "member-1");
    const phoneSearch = buildLeadDirectorySearchScreen(members, "5550102");
    const browse = buildLeadDirectorySearchScreen(members, "");
    const empty = buildLeadDirectorySearchScreen(members, "casey");

    expect(emailSearch.screen).toBe("lead_directory_search");
    expect(emailSearch.results.map((lead) => lead.id)).toEqual(["member-1"]);
    expect(emailSearch.results[0]?.matchedFields).toEqual(["email"]);
    expect(emailSearch.results[0]?.statusBadge.label).toBe("Lead");
    expect(emailSearch.results[0]?.matchSummary).toBe("Matched on email");
    expect(emailSearch.results[0]?.detailHref).toBe("/leads/member-1");
    expect(emailSearch.selectedLead?.id).toBe("member-1");
    expect(emailSearch.selectedLeadId).toBe("member-1");
    expect(emailSearch.searchableFields).toEqual(["name", "email", "phone", "barcode"]);
    expect(emailSearch.searchableFieldCount).toBe(4);
    expect(emailSearch.resultCount).toBe(1);
    expect(emailSearch.summaryLabel).toBe("Found 1 lead");
    expect(phoneSearch.results[0]?.matchedFields).toEqual(["phone"]);
    expect(browse.results.map((lead) => lead.id)).toEqual(["member-1", "member-2"]);
    expect(browse.results[0]?.matchSummary).toBe("Browse leads");
    expect(browse.resultCount).toBe(2);
    expect(browse.summaryLabel).toBe("Browsing 2 leads");
    expect(empty.emptyState).toBe(true);
    expect(empty.resultCount).toBe(0);
    expect(empty.summaryLabel).toBe("Found 0 leads");
  });

  it("builds lead conversion state and normalized submission", () => {
    const conversion = buildLeadConversionScreen({
      lead: members[0]!,
      permissions: [Permission.MemberRead, Permission.MemberWrite],
      selectedTargetStatus: MemberStatus.Trial
    });
    const blocked = buildLeadConversionScreen({
      lead: members[2]!,
      permissions: [Permission.MemberRead]
    });
    const submission = createLeadConversionSubmission({
      memberId: "member-1",
      targetStatus: MemberStatus.Active
    });

    expect(conversion.screen).toBe("lead_conversion");
    expect(conversion.fullName).toBe("Jamie Rivera");
    expect(conversion.currentStatusLabel).toBe("Lead");
    expect(conversion.targetStatusOptionCount).toBe(2);
    expect(conversion.targetStatusOptions.map((option) => option.value)).toEqual([
      MemberStatus.Trial,
      MemberStatus.Active
    ]);
    expect(
      conversion.targetStatusOptions.find((option) => option.value === MemberStatus.Trial)?.selected
    ).toBe(true);
    expect(conversion.selectedTargetStatus).toBe(MemberStatus.Trial);
    expect(conversion.destinationStatusLabel).toBe("Trial");
    expect(conversion.canSubmit).toBe(true);
    expect(conversion.summaryLabel).toBe("Convert lead to Trial");
    expect(conversion.action.disabled).toBe(false);
    expect(blocked.blockedReason).toBe("Member write permission is required.");
    expect(blocked.summaryLabel).toBe("Lead conversion unavailable");
    expect(blocked.canSubmit).toBe(false);
    expect(blocked.action.disabled).toBe(true);
    expect(submission).toEqual({
      memberId: "member-1",
      status: MemberStatus.Active
    });
  });
});
