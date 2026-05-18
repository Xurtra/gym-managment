export function buildMemberContactInformationSection(member) {
    const email = normalizedValue(member.email);
    const phone = normalizedValue(member.phone);
    const hasEmail = Boolean(email);
    const hasPhone = Boolean(phone);
    return {
        key: "contact",
        title: "Contact information",
        email: email || "Not provided",
        phone: phone || "Not provided",
        hasEmail,
        hasPhone,
        complete: hasEmail && hasPhone,
        primaryContactMethod: hasEmail ? "email" : hasPhone ? "phone" : "none",
        details: [
            { key: "email", label: "Email", value: email || "Not provided" },
            { key: "phone", label: "Phone", value: phone || "Not provided" }
        ]
    };
}
export function buildMemberEmergencyContactSection(member) {
    const contactName = normalizedValue(member.emergencyContact?.name);
    const contactPhone = normalizedValue(member.emergencyContact?.phone);
    const relationship = normalizedValue(member.emergencyContact?.relationship);
    const hasEmergencyContact = Boolean(contactName || contactPhone || relationship);
    return {
        key: "emergency_contact",
        title: "Emergency contact",
        hasEmergencyContact,
        complete: Boolean(contactName && contactPhone),
        contactName: contactName || "Not provided",
        contactPhone: contactPhone || "Not provided",
        relationship: relationship || "Not provided",
        details: hasEmergencyContact
            ? [
                { key: "name", label: "Name", value: contactName || "Not provided" },
                { key: "phone", label: "Phone", value: contactPhone || "Not provided" },
                { key: "relationship", label: "Relationship", value: relationship || "Not provided" }
            ]
            : [{ key: "emergency_contact", label: "Contact", value: "Not provided" }]
    };
}
export function buildMemberNotesSection(member) {
    const noteText = normalizedValue(member.notes);
    const hasNotes = Boolean(noteText);
    return {
        key: "notes",
        title: "Notes",
        noteText: noteText || "No notes",
        hasNotes,
        characterCount: noteText.length,
        preview: noteText ? noteText.slice(0, 120) : "No notes",
        details: [{ key: "notes", label: "Notes", value: noteText || "No notes" }]
    };
}
function normalizedValue(value) {
    return value?.trim().replace(/\s+/g, " ") ?? "";
}
//# sourceMappingURL=profileSections.js.map