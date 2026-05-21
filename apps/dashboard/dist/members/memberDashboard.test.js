import { MemberStatus, MembershipStatus, Permission } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildMemberListPage, buildMemberProfilePage } from "./index.js";
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
        portalEnabled: true,
        tagNames: ["Strength", "Founding"],
        createdAt: "2026-05-16T12:00:00.000Z",
        updatedAt: "2026-05-16T12:00:00.000Z"
    },
    {
        id: "member-2",
        gymId: "gym-1",
        firstName: "Jordan",
        lastName: "Lee",
        email: "jordan@example.com",
        phone: "555-0102",
        barcode: "MEM-200",
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
        phone: "555-0103",
        status: MemberStatus.Trial,
        tagNames: ["Strength"],
        createdAt: "2026-05-14T12:00:00.000Z",
        updatedAt: "2026-05-16T12:00:00.000Z"
    },
    {
        id: "member-4",
        gymId: "gym-1",
        firstName: "Archived",
        lastName: "Member",
        email: "archived@example.com",
        status: MemberStatus.Archived,
        tagNames: [],
        createdAt: "2026-05-13T12:00:00.000Z",
        updatedAt: "2026-05-16T12:00:00.000Z",
        archivedAt: "2026-05-16T12:00:00.000Z"
    }
];
describe("member dashboard screens", () => {
    it("builds member list page with filters, summary, and actions", () => {
        const page = buildMemberListPage({
            members,
            permissions: [Permission.MemberRead, Permission.MemberWrite],
            filters: {
                query: " jamie ",
                tagName: "strength"
            }
        });
        const readOnly = buildMemberListPage({
            members,
            permissions: [Permission.MemberRead],
            filters: { status: MemberStatus.Archived }
        });
        const empty = buildMemberListPage({
            members: [],
            permissions: [Permission.MemberRead],
            filters: { query: "missing" }
        });
        expect(page.screen).toBe("member_list");
        expect(page.searchField.value).toBe("jamie");
        expect(page.rows.map((row) => row.id)).toEqual(["member-1"]);
        expect(page.rows[0]?.fullName).toBe("Jamie Rivera");
        expect(page.rows[0]?.initials).toBe("JR");
        expect(page.rows[0]?.contactLabel).toBe("jamie@example.com");
        expect(page.rows[0]?.statusLabel).toBe("Active");
        expect(page.rows[0]?.statusBadge.label).toBe("Active");
        expect(page.rows[0]?.statusBadge.tone).toBe("success");
        expect(page.rows[0]?.tagLabel).toBe("Strength, Founding");
        expect(page.rows[0]?.detailHref).toBe("/members/member-1");
        expect(page.rows[0]?.actions.find((action) => action.key === "edit")?.button.disabled).toBe(false);
        expect(page.summary).toMatchObject({
            totalCount: 4,
            activeCount: 1,
            trialCount: 1,
            pastDueCount: 1,
            archivedCount: 1,
            visibleCount: 1
        });
        expect(page.summaryLabel).toBe("Showing 1 of 4 members");
        expect(page.rowCount).toBe(1);
        expect(page.activeFilterCount).toBe(2);
        expect(page.statusOptionCount).toBe(Object.values(MemberStatus).length);
        expect(page.tagOptionCount).toBe(3);
        expect(page.tagOptions.map((option) => option.value)).toEqual(["Founding", "Strength", "Yoga"]);
        expect(page.tagOptions.find((option) => option.value === "Strength")?.selected).toBe(true);
        expect(page.createMemberAction.disabled).toBe(false);
        expect(page.importMembersAction.disabled).toBe(false);
        expect(readOnly.rows[0]?.actions.find((action) => action.key === "archive")?.button.disabled).toBe(true);
        expect(readOnly.activeFilterCount).toBe(1);
        expect(empty.empty?.title).toBe("No members match your filters");
        expect(empty.summaryLabel).toBe("Showing 0 of 0 members");
        expect(empty.createMemberAction.disabled).toBe(true);
    });
    it("builds member profile page with details, memberships, and actions", () => {
        const member = {
            ...members[0],
            emergencyContact: {
                name: "Avery Rivera",
                phone: "555-0199",
                relationship: "Spouse"
            },
            notes: "  Prefers morning classes.  "
        };
        const memberships = [
            {
                id: "membership-old",
                gymId: "gym-1",
                memberId: "member-1",
                planId: "plan-old",
                planName: "Trial Plan",
                status: MembershipStatus.Expired,
                startsAt: "2026-04-01T12:00:00.000Z",
                endsAt: "2026-04-08T12:00:00.000Z",
                createdAt: "2026-04-01T12:00:00.000Z",
                updatedAt: "2026-04-08T12:00:00.000Z"
            },
            {
                id: "membership-active",
                gymId: "gym-1",
                memberId: "member-1",
                planId: "plan-monthly",
                planName: "Monthly Unlimited",
                status: MembershipStatus.Active,
                startsAt: "2026-05-01T12:00:00.000Z",
                createdAt: "2026-05-01T12:00:00.000Z",
                updatedAt: "2026-05-01T12:00:00.000Z"
            }
        ];
        const profile = buildMemberProfilePage({
            member,
            memberships,
            permissions: [Permission.MemberRead, Permission.MemberWrite]
        });
        const readOnly = buildMemberProfilePage({
            member,
            permissions: [Permission.MemberRead]
        });
        const archived = buildMemberProfilePage({
            member: members[3],
            permissions: [Permission.MemberRead, Permission.MemberWrite]
        });
        expect(profile.screen).toBe("member_profile");
        expect(profile.fullName).toBe("Jamie Rivera");
        expect(profile.initials).toBe("JR");
        expect(profile.statusLabel).toBe("Active");
        expect(profile.statusBadge.label).toBe("Active");
        expect(profile.statusBadge.tone).toBe("success");
        expect(profile.active).toBe(true);
        expect(profile.archived).toBe(false);
        expect(profile.portalStatusLabel).toBe("Portal access enabled");
        expect(profile.portalActionLabel).toBe("Reset portal password");
        expect(profile.contactSection.title).toBe("Contact information");
        expect(profile.contactSection.complete).toBe(true);
        expect(profile.contactSection.primaryContactMethod).toBe("email");
        expect(profile.contactSection.email).toBe("jamie@example.com");
        expect(profile.emergencyContactSection.hasEmergencyContact).toBe(true);
        expect(profile.emergencyContactSection.complete).toBe(true);
        expect(profile.emergencyContactSection.contactPhone).toBe("555-0199");
        expect(profile.notesSection.hasNotes).toBe(true);
        expect(profile.notesSection.noteText).toBe("Prefers morning classes.");
        expect(profile.sections.find((section) => section.key === "contact")?.details).toContainEqual({
            key: "email",
            label: "Email",
            value: "jamie@example.com"
        });
        expect(profile.sections.find((section) => section.key === "emergency_contact")?.details).toContainEqual({
            key: "relationship",
            label: "Relationship",
            value: "Spouse"
        });
        expect(profile.sections.find((section) => section.key === "notes")?.details[0]?.value).toBe("Prefers morning classes.");
        expect(profile.sectionCount).toBe(5);
        expect(profile.sections.find((section) => section.key === "identity")?.details).toContainEqual({
            key: "portal_access",
            label: "Portal access",
            value: "Enabled"
        });
        expect(profile.memberships.map((membership) => membership.id)).toEqual([
            "membership-active",
            "membership-old"
        ]);
        expect(profile.membershipCount).toBe(2);
        expect(profile.memberships[0]?.statusLabel).toBe("Active");
        expect(profile.memberships[0]?.active).toBe(true);
        expect(profile.memberships[0]?.dateRangeLabel).toBe("2026-05-01T12:00:00.000Z to ongoing");
        expect(profile.memberships[0]?.detailHref).toBe("/members/member-1/memberships/membership-active");
        expect(profile.membershipSummary).toMatchObject({
            totalCount: 2,
            activeCount: 1,
            trialingCount: 0,
            expiredCount: 1
        });
        expect(profile.membershipSummaryLabel).toBe("Showing 2 memberships");
        expect(profile.actionCount).toBe(6);
        expect(profile.actions.find((action) => action.key === "edit")?.button.disabled).toBe(false);
        expect(profile.actions.find((action) => action.key === "portal_invite")?.button.disabled).toBe(false);
        expect(profile.actions.find((action) => action.key === "check_in")?.href).toBe("/check-ins?memberId=member-1");
        expect(readOnly.membershipEmpty?.title).toBe("No memberships");
        expect(readOnly.membershipSummaryLabel).toBe("Showing 0 memberships");
        expect(readOnly.emergencyContactSection.complete).toBe(true);
        expect(readOnly.notesSection.hasNotes).toBe(true);
        expect(readOnly.actions.find((action) => action.key === "assign_plan")?.button.disabled).toBe(true);
        expect(archived.archived).toBe(true);
        expect(archived.actions.find((action) => action.key === "archive")?.button.disabled).toBe(true);
    });
});
//# sourceMappingURL=memberDashboard.test.js.map