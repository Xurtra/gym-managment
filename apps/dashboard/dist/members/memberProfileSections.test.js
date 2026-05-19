import { MemberStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildMemberContactInformationSection, buildMemberEmergencyContactSection, buildMemberNotesSection } from "./index.js";
const completeMember = {
    id: "member-1",
    gymId: "gym-1",
    firstName: "Jamie",
    lastName: "Rivera",
    email: "jamie@example.com",
    phone: "555-0101",
    status: MemberStatus.Active,
    emergencyContact: {
        name: "Avery Rivera",
        phone: "555-0199",
        relationship: "Spouse"
    },
    tagNames: [],
    createdAt: "2026-05-16T12:00:00.000Z",
    updatedAt: "2026-05-16T12:00:00.000Z"
};
describe("member profile sections", () => {
    it("builds contact information section with completeness metadata", () => {
        const complete = buildMemberContactInformationSection(completeMember);
        const { email: _email, phone: _phone, ...memberWithoutContact } = completeMember;
        const missing = buildMemberContactInformationSection({
            ...memberWithoutContact
        });
        expect(complete.title).toBe("Contact information");
        expect(complete.hasEmail).toBe(true);
        expect(complete.hasPhone).toBe(true);
        expect(complete.complete).toBe(true);
        expect(complete.primaryContactMethod).toBe("email");
        expect(complete.fieldCount).toBe(2);
        expect(complete.completeFieldCount).toBe(2);
        expect(complete.summaryLabel).toBe("2 of 2 contact fields provided");
        expect(missing.email).toBe("Not provided");
        expect(missing.phone).toBe("Not provided");
        expect(missing.complete).toBe(false);
        expect(missing.primaryContactMethod).toBe("none");
        expect(missing.completeFieldCount).toBe(0);
        expect(missing.summaryLabel).toBe("0 of 2 contact fields provided");
    });
    it("builds emergency contact section with missing-state handling", () => {
        const complete = buildMemberEmergencyContactSection(completeMember);
        const { emergencyContact: _emergencyContact, ...memberWithoutEmergencyContact } = completeMember;
        const missing = buildMemberEmergencyContactSection({
            ...memberWithoutEmergencyContact
        });
        expect(complete.title).toBe("Emergency contact");
        expect(complete.hasEmergencyContact).toBe(true);
        expect(complete.complete).toBe(true);
        expect(complete.contactName).toBe("Avery Rivera");
        expect(complete.relationship).toBe("Spouse");
        expect(complete.fieldCount).toBe(3);
        expect(complete.completeFieldCount).toBe(3);
        expect(complete.summaryLabel).toBe("3 of 3 emergency contact fields provided");
        expect(missing.hasEmergencyContact).toBe(false);
        expect(missing.complete).toBe(false);
        expect(missing.completeFieldCount).toBe(0);
        expect(missing.summaryLabel).toBe("0 of 3 emergency contact fields provided");
        expect(missing.details).toEqual([
            { key: "emergency_contact", label: "Contact", value: "Not provided" }
        ]);
    });
    it("builds member notes section with normalized text and empty-state handling", () => {
        const complete = buildMemberNotesSection({
            ...completeMember,
            notes: "  Prefers morning classes and shoulder-friendly programming.  "
        });
        const { notes: _notes, ...memberWithoutNotes } = {
            ...completeMember,
            notes: "temporary"
        };
        const missing = buildMemberNotesSection({
            ...memberWithoutNotes
        });
        expect(complete.title).toBe("Notes");
        expect(complete.hasNotes).toBe(true);
        expect(complete.noteText).toBe("Prefers morning classes and shoulder-friendly programming.");
        expect(complete.characterCount).toBe(58);
        expect(complete.preview).toBe("Prefers morning classes and shoulder-friendly programming.");
        expect(complete.summaryLabel).toBe("58 note characters");
        expect(missing.hasNotes).toBe(false);
        expect(missing.noteText).toBe("No notes");
        expect(missing.characterCount).toBe(0);
        expect(missing.summaryLabel).toBe("No member notes");
    });
});
//# sourceMappingURL=memberProfileSections.test.js.map