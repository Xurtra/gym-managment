import type {
  ContractWaiverAssignmentCreateInput,
  ContractWaiverCreateInput,
  ContractWaiverSignatureCreateInput,
  ContractWaiverUpdateInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
import type {
  ContractWaiverAssignment,
  ContractWaiverDocument,
  ContractWaiverSignature
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export class ContractWaiverService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async list(gymId: string) {
    return this.repositories.contractWaivers.listDocumentsForGym(gymId);
  }

  async create(gymId: string, input: ContractWaiverCreateInput) {
    await this.ensureVersionAvailable(gymId, input.title, input.version);
    const now = this.clock.now();
    const document: ContractWaiverDocument = {
      id: randomUUID(),
      gymId,
      title: input.title,
      type: input.type,
      version: input.version,
      requiresSignature: input.requiresSignature,
      signedMemberCount: 0,
      createdAt: now,
      updatedAt: now
    };
    if (input.publish) {
      document.publishedAt = now;
    }
    return this.repositories.contractWaivers.createDocument(document);
  }

  async update(gymId: string, documentId: string, input: ContractWaiverUpdateInput) {
    const existing = await this.getActive(gymId, documentId);
    const nextTitle = input.title ?? existing.title;
    const nextVersion = input.version ?? existing.version;
    if (input.title || input.version) {
      await this.ensureVersionAvailable(gymId, nextTitle, nextVersion, documentId);
    }
    const now = this.clock.now();
    const updated: ContractWaiverDocument = {
      ...existing,
      title: nextTitle,
      type: input.type ?? existing.type,
      version: nextVersion,
      requiresSignature: input.requiresSignature ?? existing.requiresSignature,
      updatedAt: now
    };
    if (input.publish === true && !updated.publishedAt) {
      updated.publishedAt = now;
    }
    if (input.publish === false) {
      delete updated.publishedAt;
    }
    return this.repositories.contractWaivers.updateDocument(updated);
  }

  async archive(gymId: string, documentId: string) {
    const existing = await this.getActive(gymId, documentId);
    const now = this.clock.now();
    return this.repositories.contractWaivers.updateDocument({
      ...existing,
      archivedAt: now,
      updatedAt: now
    });
  }

  async assign(
    gymId: string,
    documentId: string,
    assignedByUserId: string,
    input: ContractWaiverAssignmentCreateInput
  ) {
    const document = await this.getActive(gymId, documentId);
    const member = await this.repositories.members.getMember(input.memberId);
    if (!member || member.gymId !== gymId || member.archivedAt) {
      throw notFound("Member was not found.");
    }
    const existing = await this.repositories.contractWaivers.findAssignment(
      gymId,
      documentId,
      input.memberId
    );
    if (existing) {
      return existing;
    }
    const now = this.clock.now();
    const assignment: ContractWaiverAssignment = {
      id: randomUUID(),
      gymId,
      documentId: document.id,
      memberId: input.memberId,
      status: document.requiresSignature ? "pending" : "signed",
      assignedByUserId,
      assignedAt: now,
      createdAt: now,
      updatedAt: now
    };
    if (!document.requiresSignature) {
      assignment.signedAt = now;
    }
    return this.repositories.contractWaivers.createAssignment(assignment);
  }

  async listAssignments(gymId: string) {
    return this.withSignatureStatus(
      await this.repositories.contractWaivers.listAssignmentsForGym(gymId)
    );
  }

  async listMemberAssignments(gymId: string, memberId: string) {
    const member = await this.repositories.members.getMember(memberId);
    if (!member || member.gymId !== gymId || member.archivedAt) {
      throw notFound("Member was not found.");
    }
    return this.withSignatureStatus(
      await this.repositories.contractWaivers.listAssignmentsForMember(gymId, memberId)
    );
  }

  async signAssignment(
    gymId: string,
    assignmentId: string,
    input: ContractWaiverSignatureCreateInput,
    signerIp?: string
  ) {
    const assignment = await this.repositories.contractWaivers.getAssignment(assignmentId);
    if (!assignment || assignment.gymId !== gymId || assignment.status === "void") {
      throw notFound("Contract or waiver assignment was not found.");
    }
    const document = await this.getActive(gymId, assignment.documentId);
    const now = this.clock.now();
    const signature: ContractWaiverSignature = {
      id: randomUUID(),
      gymId,
      assignmentId: assignment.id,
      documentId: document.id,
      memberId: assignment.memberId,
      documentTitle: document.title,
      documentVersion: document.version,
      signerName: input.signerName,
      signatureText: input.signatureText,
      signedAt: now,
      createdAt: now
    };
    if (signerIp) {
      signature.signerIp = signerIp;
    }
    const signedAssignment: ContractWaiverAssignment = {
      ...assignment,
      status: "signed",
      signedAt: now,
      updatedAt: now
    };
    return this.repositories.transaction(async (repositories) => {
      const createdSignature = await repositories.contractWaivers.createSignature(signature);
      const updatedAssignment =
        await repositories.contractWaivers.updateAssignment(signedAssignment);
      if (assignment.status !== "signed") {
        await repositories.contractWaivers.updateDocument({
          ...document,
          signedMemberCount: document.signedMemberCount + 1,
          updatedAt: now
        });
      }
      return { assignment: updatedAssignment, signature: createdSignature };
    });
  }

  private async getActive(gymId: string, documentId: string) {
    const document = await this.repositories.contractWaivers.getDocument(documentId);
    if (!document || document.gymId !== gymId || document.archivedAt) {
      throw notFound("Contract or waiver was not found.");
    }
    return document;
  }

  private async ensureVersionAvailable(
    gymId: string,
    title: string,
    version: number,
    ignoreDocumentId?: string
  ) {
    const normalizedTitle = title.toLowerCase();
    const duplicate = (await this.repositories.contractWaivers.listDocumentsForGym(gymId)).find(
      (document) =>
        document.id !== ignoreDocumentId &&
        !document.archivedAt &&
        document.title.toLowerCase() === normalizedTitle &&
        document.version === version
    );
    if (duplicate) {
      throw conflict(
        "A contract or waiver with this title and version already exists.",
        "document_version_exists"
      );
    }
  }

  private async withSignatureStatus(assignments: ContractWaiverAssignment[]) {
    return Promise.all(
      assignments.map(async (assignment) => ({
        ...assignment,
        signatures: await this.repositories.contractWaivers.listSignaturesForAssignment(
          assignment.id
        )
      }))
    );
  }
}
