import type {
  ContractWaiverCreateInput,
  ContractWaiverUpdateInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
import type { ContractWaiverDocument } from "../../infrastructure/store/entities.js";
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
}
