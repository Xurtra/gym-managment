import type { MemberView } from "./types.js";
export interface MemberProfileDetail {
    key: string;
    label: string;
    value: string;
}
export interface MemberProfileSection {
    key: "identity" | "contact" | "emergency_contact" | "tags" | "notes";
    title: string;
    details: MemberProfileDetail[];
}
export interface MemberContactInformationSection extends MemberProfileSection {
    key: "contact";
    title: "Contact information";
    email: string;
    phone: string;
    hasEmail: boolean;
    hasPhone: boolean;
    complete: boolean;
    primaryContactMethod: "email" | "phone" | "none";
    fieldCount: number;
    completeFieldCount: number;
    summaryLabel: string;
}
export interface MemberEmergencyContactSection extends MemberProfileSection {
    key: "emergency_contact";
    title: "Emergency contact";
    hasEmergencyContact: boolean;
    complete: boolean;
    contactName: string;
    contactPhone: string;
    relationship: string;
    fieldCount: number;
    completeFieldCount: number;
    summaryLabel: string;
}
export interface MemberNotesSection extends MemberProfileSection {
    key: "notes";
    title: "Notes";
    noteText: string;
    hasNotes: boolean;
    characterCount: number;
    preview: string;
    summaryLabel: string;
}
export declare function buildMemberContactInformationSection(member: MemberView): MemberContactInformationSection;
export declare function buildMemberEmergencyContactSection(member: MemberView): MemberEmergencyContactSection;
export declare function buildMemberNotesSection(member: MemberView): MemberNotesSection;
//# sourceMappingURL=profileSections.d.ts.map