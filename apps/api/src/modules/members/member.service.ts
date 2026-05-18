import { MemberStatus } from "@gym-platform/constants";
import type { MemberCreateInput, MemberUpdateInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
import type { EmergencyContact, Member } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export class MemberService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async list(gymId: string) {
    return (await this.repositories.members.listMembersForGym(gymId)).filter(
      (member) => member.status !== MemberStatus.Archived
    );
  }

  async create(gymId: string, input: MemberCreateInput) {
    await this.ensureUnique(gymId, input.email, input.barcode);
    const now = this.clock.now();
    const member: Member = {
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

  async update(gymId: string, memberId: string, input: MemberUpdateInput) {
    const existing = await this.getActive(gymId, memberId);
    await this.ensureUnique(gymId, input.email, input.barcode, memberId);
    const updated: Member = {
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

  async archive(gymId: string, memberId: string) {
    const existing = await this.getActive(gymId, memberId);
    const now = this.clock.now();
    const archived: Member = {
      ...existing,
      status: MemberStatus.Archived,
      archivedAt: now,
      updatedAt: now
    };
    return this.repositories.members.updateMember(archived);
  }

  private async getActive(gymId: string, memberId: string) {
    const member = await this.repositories.members.getMember(memberId);
    if (!member || member.gymId !== gymId || member.status === MemberStatus.Archived) {
      throw notFound("Member was not found.");
    }
    return member;
  }

  private async ensureUnique(gymId: string, email?: string, barcode?: string, ignoreMemberId?: string) {
    if (!email && !barcode) {
      return;
    }
    const members = await this.repositories.members.listMembersForGym(gymId);
    const duplicate = members.find(
      (member) =>
        member.id !== ignoreMemberId &&
        member.status !== MemberStatus.Archived &&
        ((email && member.email?.toLowerCase() === email.toLowerCase()) ||
          (barcode && member.barcode === barcode))
    );
    if (duplicate) {
      throw conflict("A member with this email or barcode already exists.", "member_duplicate");
    }
  }
}

function applyOptionalMemberFields(member: Member, input: MemberCreateInput | MemberUpdateInput) {
  if (input.email !== undefined) {
    member.email = input.email;
  }
  if (input.phone !== undefined) {
    member.phone = input.phone;
  }
  if (input.barcode !== undefined) {
    member.barcode = input.barcode;
  }
  if (input.emergencyContact !== undefined) {
    member.emergencyContact = normalizeEmergencyContact(input.emergencyContact);
  }
  if (input.notes !== undefined) {
    member.notes = input.notes;
  }
}

function normalizeEmergencyContact(input: NonNullable<MemberCreateInput["emergencyContact"]>): EmergencyContact {
  const contact: EmergencyContact = {
    name: input.name,
    phone: input.phone
  };
  if (input.relationship !== undefined) {
    contact.relationship = input.relationship;
  }
  return contact;
}
