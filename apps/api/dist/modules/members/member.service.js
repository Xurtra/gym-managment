import { MemberStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
export class MemberService {
    repositories;
    clock;
    constructor(repositories, clock) {
        this.repositories = repositories;
        this.clock = clock;
    }
    async list(gymId) {
        return (await this.repositories.members.listMembersForGym(gymId)).filter((member) => member.status !== MemberStatus.Archived);
    }
    async create(gymId, input) {
        await this.ensureUnique(gymId, input.email, input.barcode);
        const now = this.clock.now();
        const member = {
            id: randomUUID(),
            gymId,
            firstName: input.firstName,
            lastName: input.lastName,
            status: input.status,
            tagNames: input.tagNames,
            createdAt: now,
            updatedAt: now
        };
        applyOptionalMemberFields(member, input);
        return this.repositories.members.createMember(member);
    }
    async update(gymId, memberId, input) {
        const existing = await this.getActive(gymId, memberId);
        await this.ensureUnique(gymId, input.email, input.barcode, memberId);
        const updated = {
            ...existing,
            firstName: input.firstName ?? existing.firstName,
            lastName: input.lastName ?? existing.lastName,
            status: input.status ?? existing.status,
            tagNames: input.tagNames ?? existing.tagNames,
            updatedAt: this.clock.now()
        };
        applyOptionalMemberFields(updated, input);
        return this.repositories.members.updateMember(updated);
    }
    async archive(gymId, memberId) {
        const existing = await this.getActive(gymId, memberId);
        const now = this.clock.now();
        const archived = {
            ...existing,
            status: MemberStatus.Archived,
            archivedAt: now,
            updatedAt: now
        };
        return this.repositories.members.updateMember(archived);
    }
    async getActive(gymId, memberId) {
        const member = await this.repositories.members.getMember(memberId);
        if (!member || member.gymId !== gymId || member.status === MemberStatus.Archived) {
            throw notFound("Member was not found.");
        }
        return member;
    }
    async ensureUnique(gymId, email, barcode, ignoreMemberId) {
        if (!email && !barcode) {
            return;
        }
        const members = await this.repositories.members.listMembersForGym(gymId);
        const duplicate = members.find((member) => member.id !== ignoreMemberId &&
            member.status !== MemberStatus.Archived &&
            ((email && member.email?.toLowerCase() === email.toLowerCase()) ||
                (barcode && member.barcode === barcode)));
        if (duplicate) {
            throw conflict("A member with this email or barcode already exists.", "member_duplicate");
        }
    }
}
function applyOptionalMemberFields(member, input) {
    if (input.email !== undefined) {
        member.email = input.email;
    }
    if (input.phone !== undefined) {
        member.phone = input.phone;
    }
    if (input.barcode !== undefined) {
        member.barcode = input.barcode;
    }
    if (input.profileImageUrl !== undefined) {
        member.profileImageUrl = input.profileImageUrl;
    }
    if (input.emergencyContact !== undefined) {
        member.emergencyContact = normalizeEmergencyContact(input.emergencyContact);
    }
    if (input.notes !== undefined) {
        member.notes = input.notes;
    }
}
function normalizeEmergencyContact(input) {
    const contact = {
        name: input.name,
        phone: input.phone
    };
    if (input.relationship !== undefined) {
        contact.relationship = input.relationship;
    }
    return contact;
}
//# sourceMappingURL=member.service.js.map