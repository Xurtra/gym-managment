import type {
  MigrationColumnMappingsUpdateInput,
  MigrationFileTypeOverrideInput,
  MigrationFileUploadInput,
  MigrationStagedMemberBulkApproveInput,
  MigrationStagedMemberUpdateInput
} from "@gym-platform/validation";
import ExcelJS from "exceljs";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { badRequest, forbidden, notFound } from "../../http/errors.js";
import type {
  MigrationAuditLog,
  MigrationBatch,
  MigrationColumnMapping,
  MigrationFile,
  MigrationFileType,
  MigrationStagedMember,
  MigrationValidationError,
  MigrationValidationErrorSeverity
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

const allowedMigrationFileTypes: MigrationFileType[] = [
  "members",
  "staff",
  "membership_plans",
  "classes",
  "attendance",
  "billing",
  "appointments",
  "unknown"
];

const maxMigrationUploadBytes = 10 * 1024 * 1024;
const highConfidenceThreshold = 0.8;
const lowMappingConfidenceThreshold = 0.75;

type SupportedColumnMappingFileType = "members" | "staff" | "membership_plans";

const supportedColumnMappingFileTypes: SupportedColumnMappingFileType[] = [
  "members",
  "staff",
  "membership_plans"
];

const migrationTargetFields: Record<SupportedColumnMappingFileType, string[]> = {
  members: [
    "ignore",
    "first_name",
    "last_name",
    "full_name",
    "email",
    "phone",
    "date_of_birth",
    "address",
    "emergency_contact",
    "membership_status",
    "membership_plan_name",
    "start_date",
    "cancellation_date",
    "next_billing_date",
    "assigned_trainer_name",
    "notes",
    "tags"
  ],
  staff: [
    "ignore",
    "full_name",
    "first_name",
    "last_name",
    "email",
    "phone",
    "old_role_name",
    "employment_status",
    "assigned_location",
    "trainer_flag",
    "instructor_flag",
    "permission_level",
    "pay_type",
    "hourly_rate",
    "notes"
  ],
  membership_plans: [
    "ignore",
    "plan_name",
    "plan_type",
    "price",
    "billing_frequency",
    "contract_length",
    "class_limit",
    "session_limit",
    "active",
    "notes"
  ]
};

interface MigrationAssistantAiOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface ParsedMigrationFile {
  columnHeaders: string[];
  sampleRows: Record<string, string>[];
  rowCount: number;
}

interface ParsedMigrationRows extends ParsedMigrationFile {
  rows: Array<{ rowNumber: number; source: Record<string, string> }>;
}

interface FileTypeDetection {
  fileType: MigrationFileType;
  confidence: number;
  reason: string;
  provider: "openai" | "heuristic";
}

interface ColumnMappingSuggestion {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

interface ColumnMappingDetection {
  columnMappings: ColumnMappingSuggestion[];
  requiresHumanReview: boolean;
  provider: "openai" | "heuristic";
}

interface ColumnMappingIssue {
  severity: "warning" | "critical";
  code: string;
  message: string;
  sourceColumn?: string;
  targetField?: string;
}

interface StagedMemberValidationIssue {
  stagedRecordId: string;
  severity: MigrationValidationErrorSeverity;
  errorCode: string;
  message: string;
  fieldName?: string;
}

export class MigrationAssistantService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock,
    private readonly aiOptions: MigrationAssistantAiOptions = {},
    private readonly storageRoot = path.resolve("uploads", "migrations")
  ) {}

  async createBatch(gymId: string, userId: string) {
    const now = this.clock.now();
    return this.repositories.migrationBatches.createMigrationBatch({
      id: randomUUID(),
      gymId,
      status: "draft",
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
      summaryJson: {}
    });
  }

  async listBatches(gymId: string) {
    return {
      batches: await this.repositories.migrationBatches.listMigrationBatchesForGym(gymId)
    };
  }

  async getBatch(gymId: string, batchId: string) {
    const batch = await this.requireBatch(gymId, batchId);
    return {
      batch,
      files: await this.listActiveFiles(batch.id)
    };
  }

  async uploadFile(gymId: string, batchId: string, userId: string, input: MigrationFileUploadInput) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const extension = validateMigrationFileName(input.fileName);
    const bytes = Buffer.from(input.base64Data, "base64");
    if (bytes.byteLength === 0) {
      throw badRequest("Uploaded file is empty.", "migration_file_empty");
    }
    if (bytes.byteLength > maxMigrationUploadBytes) {
      throw badRequest("Migration files must be 10 MB or smaller.", "migration_file_too_large");
    }

    const parsed = await parseMigrationFile(input.fileName, extension, bytes);
    const now = this.clock.now();
    const fileId = randomUUID();
    const storedFilePath = await this.storeFile(gymId, batch.id, fileId, input.fileName, extension, bytes);
    const file = await this.repositories.migrationFiles.createMigrationFile({
      id: fileId,
      migrationBatchId: batch.id,
      originalFilename: sanitizeOriginalFilename(input.fileName),
      storedFilePath,
      contentType: input.contentType || contentTypeForExtension(extension),
      sizeBytes: bytes.byteLength,
      fileType: "unknown",
      columnHeaders: parsed.columnHeaders,
      sampleRows: parsed.sampleRows,
      rowCount: parsed.rowCount,
      status: "uploaded",
      createdAt: now,
      updatedAt: now
    });

    await this.touchBatchSummary(batch, { uploadedFile: true });
    await this.log(batch.id, userId, {
      action: "migration_file_uploaded",
      entityType: "migration_file",
      entityId: file.id,
      afterJson: migrationFileAuditSnapshot(file),
      message: `Uploaded ${file.originalFilename}.`
    });

    return { file };
  }

  async listFiles(gymId: string, batchId: string) {
    const batch = await this.requireBatch(gymId, batchId);
    return { files: await this.listActiveFiles(batch.id) };
  }

  async deleteFile(gymId: string, batchId: string, fileId: string, userId: string) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const file = await this.requireFile(batch.id, fileId);
    const updated = await this.repositories.migrationFiles.updateMigrationFile({
      ...file,
      status: "deleted",
      updatedAt: this.clock.now()
    });
    await unlink(path.resolve(updated.storedFilePath)).catch(() => undefined);
    await this.touchBatchSummary(batch);
    await this.log(batch.id, userId, {
      action: "migration_file_deleted",
      entityType: "migration_file",
      entityId: file.id,
      beforeJson: migrationFileAuditSnapshot(file),
      afterJson: migrationFileAuditSnapshot(updated),
      message: `Deleted ${file.originalFilename}.`
    });
    return { file: updated };
  }

  async detectFileType(gymId: string, batchId: string, fileId: string, userId: string) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const file = await this.requireFile(batch.id, fileId);
    const detectingBatch = await this.repositories.migrationBatches.updateMigrationBatch({
      ...batch,
      status: "detecting",
      updatedAt: this.clock.now()
    });
    const detectingFile = await this.repositories.migrationFiles.updateMigrationFile({
      ...file,
      status: "detecting",
      updatedAt: this.clock.now()
    });

    const detection = await this.detectFile(file);
    const confirmed = detection.confidence >= highConfidenceThreshold && detection.fileType !== "unknown";
    const updatedFile = await this.repositories.migrationFiles.updateMigrationFile({
      ...detectingFile,
      detectedFileType: detection.fileType,
      fileTypeConfidence: detection.confidence,
      detectionReason: detection.reason,
      fileType: confirmed ? detection.fileType : "unknown",
      status: confirmed ? "confirmed" : "needs_review",
      updatedAt: this.clock.now()
    });

    await this.log(batch.id, userId, {
      action: "migration_file_type_detected",
      entityType: "migration_file",
      entityId: file.id,
      beforeJson: migrationFileAuditSnapshot(file),
      afterJson: {
        ...migrationFileAuditSnapshot(updatedFile),
        provider: detection.provider
      },
      message: detection.reason
    });
    await this.updateBatchStatusAfterDetection(detectingBatch);
    return { file: updatedFile, detection };
  }

  async detectBatchFileTypes(gymId: string, batchId: string, userId: string) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const files = await this.listActiveFiles(batch.id);
    const results = [];
    for (const file of files) {
      results.push(await this.detectFileType(gymId, batch.id, file.id, userId));
    }
    return {
      files: results.map((result) => result.file),
      detections: results.map((result) => result.detection)
    };
  }

  async overrideFileType(
    gymId: string,
    batchId: string,
    fileId: string,
    userId: string,
    input: MigrationFileTypeOverrideInput
  ) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const file = await this.requireFile(batch.id, fileId);
    const updated = await this.repositories.migrationFiles.updateMigrationFile({
      ...file,
      fileType: input.fileType,
      status: input.fileType === "unknown" ? "needs_review" : "confirmed",
      updatedAt: this.clock.now()
    });
    await this.log(batch.id, userId, {
      action: "migration_file_type_overridden",
      entityType: "migration_file",
      entityId: file.id,
      beforeJson: migrationFileAuditSnapshot(file),
      afterJson: migrationFileAuditSnapshot(updated),
      message: `File type set to ${input.fileType}.`
    });
    await this.updateBatchStatusAfterDetection(batch);
    return { file: updated };
  }

  async listColumnMappings(gymId: string, batchId: string, fileId: string) {
    const batch = await this.requireBatch(gymId, batchId);
    const file = await this.requireFile(batch.id, fileId);
    this.requireSupportedMappingFile(file);
    const mappings = await this.repositories.migrationColumnMappings.listMigrationColumnMappingsForFile(file.id);
    return this.toColumnMappingResponse(file, mappings);
  }

  async generateColumnMappings(gymId: string, batchId: string, fileId: string, userId: string) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const file = await this.requireFile(batch.id, fileId);
    this.requireConfirmedMappingFile(file);
    const detection = await this.detectColumnMappings(file);
    const mappings = await this.repositories.migrationColumnMappings.replaceMigrationColumnMappingsForFile(
      batch.id,
      file.id,
      this.toColumnMappingRecords(batch.id, file, detection.columnMappings, false)
    );
    await this.log(batch.id, userId, {
      action: "migration_column_mappings_detected",
      entityType: "migration_file",
      entityId: file.id,
      afterJson: {
        fileId: file.id,
        provider: detection.provider,
        requiresHumanReview: detection.requiresHumanReview,
        mappings: mappings.map(migrationColumnMappingAuditSnapshot)
      },
      message: `Generated column mappings for ${file.originalFilename}.`
    });
    return this.toColumnMappingResponse(file, mappings);
  }

  async generateBatchColumnMappings(gymId: string, batchId: string, userId: string) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const files = (await this.listActiveFiles(batch.id)).filter(
      (file) => file.status === "confirmed" && isSupportedColumnMappingFileType(file.fileType)
    );
    const results = [];
    for (const file of files) {
      results.push(await this.generateColumnMappings(gymId, batch.id, file.id, userId));
    }
    return {
      files: results
    };
  }

  async updateColumnMappings(
    gymId: string,
    batchId: string,
    fileId: string,
    userId: string,
    input: MigrationColumnMappingsUpdateInput
  ) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const file = await this.requireFile(batch.id, fileId);
    this.requireSupportedMappingFile(file);
    const existing = await this.repositories.migrationColumnMappings.listMigrationColumnMappingsForFile(file.id);
    const existingBySource = new Map(existing.map((mapping) => [normalizeHeaderKey(mapping.sourceColumn), mapping]));
    const requestedBySource = new Map(input.mappings.map((mapping) => [normalizeHeaderKey(mapping.sourceColumn), mapping]));

    for (const mapping of input.mappings) {
      if (!file.columnHeaders.some((header) => normalizeHeaderKey(header) === normalizeHeaderKey(mapping.sourceColumn))) {
        throw badRequest(`Column ${mapping.sourceColumn} is not in this migration file.`, "migration_unknown_column");
      }
      this.validateTargetField(file, mapping.targetField);
    }

    const now = this.clock.now();
    const draftMappings = file.columnHeaders.map((sourceColumn) => {
      const requested = requestedBySource.get(normalizeHeaderKey(sourceColumn));
      const previous = existingBySource.get(normalizeHeaderKey(sourceColumn));
      const targetField = requested?.targetField ?? previous?.targetField ?? "ignore";
      const mapping: MigrationColumnMapping = {
        id: randomUUID(),
        migrationBatchId: batch.id,
        migrationFileId: file.id,
        sourceColumn,
        targetField,
        approved: false,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now
      };
      if (previous?.confidence !== undefined && previous.targetField === targetField) {
        mapping.confidence = previous.confidence;
      }
      return mapping;
    });

    const criticalIssues = validateColumnMappings(file, draftMappings)
      .filter((issue) => issue.severity === "critical");
    if (input.approve && criticalIssues.length > 0) {
      throw badRequest(
        `Fix critical mapping issues before approving. ${criticalIssues[0]?.message ?? ""}`.trim(),
        "migration_mapping_critical_issues"
      );
    }

    const mappings = await this.repositories.migrationColumnMappings.replaceMigrationColumnMappingsForFile(
      batch.id,
      file.id,
      draftMappings.map((mapping) => ({
        ...mapping,
        approved: input.approve === true,
        ...(input.approve ? { approvedByUserId: userId } : {})
      }))
    );
    await this.log(batch.id, userId, {
      action: input.approve ? "migration_column_mappings_approved" : "migration_column_mappings_updated",
      entityType: "migration_file",
      entityId: file.id,
      afterJson: {
        fileId: file.id,
        mappings: mappings.map(migrationColumnMappingAuditSnapshot)
      },
      message: input.approve
        ? `Approved column mappings for ${file.originalFilename}.`
        : `Updated column mappings for ${file.originalFilename}.`
    });
    return this.toColumnMappingResponse(file, mappings);
  }

  async stageMemberFile(gymId: string, batchId: string, fileId: string, userId: string) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const file = await this.requireMemberStagingFile(batch.id, fileId);
    const mappings = await this.requireApprovedColumnMappings(file);
    const parsed = await parseMigrationRowsFromStoredFile(file);
    const now = this.clock.now();
    const stagedMembers = parsed.rows.map(({ rowNumber, source }) =>
      this.sourceRowToStagedMember(batch.id, file.id, rowNumber, source, mappings, now)
    );

    await this.repositories.migrationStagedMembers.replaceMigrationStagedMembersForFile(
      batch.id,
      file.id,
      stagedMembers
    );
    const validated = await this.revalidateMemberFile(batch.id, file.id);
    await this.repositories.migrationBatches.updateMigrationBatch({
      ...batch,
      updatedAt: this.clock.now(),
      summaryJson: {
        ...batch.summaryJson,
        stagedMemberCount: validated.stagedMembers.length,
        stagedMemberCriticalCount: validated.summary.critical,
        stagedMemberWarningCount: validated.summary.warnings
      }
    });
    await this.log(batch.id, userId, {
      action: "migration_members_staged",
      entityType: "migration_file",
      entityId: file.id,
      afterJson: {
        fileId: file.id,
        rowCount: parsed.rowCount,
        stagedMemberCount: validated.stagedMembers.length,
        validationSummary: validated.summary
      },
      message: `Staged ${validated.stagedMembers.length} member records from ${file.originalFilename}.`
    });
    return { file, ...validated };
  }

  async listStagedMembers(gymId: string, batchId: string, fileId: string) {
    const batch = await this.requireBatch(gymId, batchId);
    const file = await this.requireMemberStagingFile(batch.id, fileId);
    const stagedMembers = await this.repositories.migrationStagedMembers.listMigrationStagedMembersForFile(file.id);
    const validationErrors = await this.repositories.migrationValidationErrors.listMigrationValidationErrorsForFile(file.id);
    return {
      file,
      stagedMembers,
      validationErrors,
      summary: stagedMemberSummary(stagedMembers, validationErrors)
    };
  }

  async updateStagedMember(
    gymId: string,
    batchId: string,
    stagedMemberId: string,
    userId: string,
    input: MigrationStagedMemberUpdateInput
  ) {
    const { batch, file, stagedMember } = await this.requireMutableStagedMember(gymId, batchId, stagedMemberId);
    const before = migrationStagedMemberAuditSnapshot(stagedMember);
    await this.repositories.migrationStagedMembers.updateMigrationStagedMember(
      normalizeEditedStagedMember(stagedMember, input, this.clock.now())
    );
    const validated = await this.revalidateMemberFile(batch.id, file.id);
    const updatedMember = validated.stagedMembers.find((member) => member.id === stagedMember.id);
    const auditPayload: Omit<MigrationAuditLog, "id" | "migrationBatchId" | "userId" | "createdAt"> = {
      action: "migration_staged_member_updated",
      entityType: "migration_staged_member",
      entityId: stagedMember.id,
      beforeJson: before,
      message: "Updated a staged member record."
    };
    if (updatedMember) {
      auditPayload.afterJson = migrationStagedMemberAuditSnapshot(updatedMember);
    }
    await this.log(batch.id, userId, auditPayload);
    return { file, ...validated };
  }

  async skipStagedMember(gymId: string, batchId: string, stagedMemberId: string, userId: string) {
    const { batch, file, stagedMember } = await this.requireMutableStagedMember(gymId, batchId, stagedMemberId);
    const updated = await this.repositories.migrationStagedMembers.updateMigrationStagedMember({
      ...stagedMember,
      approved: false,
      validationStatus: "skipped",
      updatedAt: this.clock.now()
    });
    const validated = await this.revalidateMemberFile(batch.id, file.id);
    await this.log(batch.id, userId, {
      action: "migration_staged_member_skipped",
      entityType: "migration_staged_member",
      entityId: stagedMember.id,
      beforeJson: migrationStagedMemberAuditSnapshot(stagedMember),
      afterJson: migrationStagedMemberAuditSnapshot(updated),
      message: "Skipped a staged member record."
    });
    return { file, ...validated };
  }

  async approveStagedMember(gymId: string, batchId: string, stagedMemberId: string, userId: string) {
    const { batch, file, stagedMember } = await this.requireMutableStagedMember(gymId, batchId, stagedMemberId);
    const validation = await this.revalidateMemberFile(batch.id, file.id);
    const current = validation.stagedMembers.find((member) => member.id === stagedMember.id);
    if (!current || current.validationStatus === "skipped") {
      throw badRequest("Skipped staged members cannot be approved.", "migration_staged_member_skipped");
    }
    if (current.validationStatus === "critical") {
      throw badRequest("Fix critical validation errors before approving this member.", "migration_staged_member_critical");
    }
    const approved = await this.repositories.migrationStagedMembers.updateMigrationStagedMember({
      ...current,
      approved: true,
      updatedAt: this.clock.now()
    });
    const refreshed = await this.listStagedMembers(gymId, batch.id, file.id);
    await this.log(batch.id, userId, {
      action: "migration_staged_member_approved",
      entityType: "migration_staged_member",
      entityId: current.id,
      beforeJson: migrationStagedMemberAuditSnapshot(current),
      afterJson: migrationStagedMemberAuditSnapshot(approved),
      message: "Approved a staged member record."
    });
    return refreshed;
  }

  async approveStagedMembers(
    gymId: string,
    batchId: string,
    fileId: string,
    userId: string,
    input: MigrationStagedMemberBulkApproveInput = {}
  ) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const file = await this.requireMemberStagingFile(batch.id, fileId);
    const validation = await this.revalidateMemberFile(batch.id, file.id);
    const selectedIds = new Set(input.memberIds ?? []);
    const candidates = validation.stagedMembers.filter((member) =>
      selectedIds.size > 0 ? selectedIds.has(member.id) : member.validationStatus !== "skipped"
    );
    const critical = candidates.filter((member) => member.validationStatus === "critical");
    if (critical.length > 0) {
      throw badRequest("Fix critical validation errors before bulk approving members.", "migration_staged_members_critical");
    }
    let approvedCount = 0;
    for (const member of candidates) {
      if (member.validationStatus === "ready" || member.validationStatus === "warnings") {
        await this.repositories.migrationStagedMembers.updateMigrationStagedMember({
          ...member,
          approved: true,
          updatedAt: this.clock.now()
        });
        approvedCount += 1;
      }
    }
    const refreshed = await this.listStagedMembers(gymId, batch.id, file.id);
    await this.log(batch.id, userId, {
      action: "migration_staged_members_bulk_approved",
      entityType: "migration_file",
      entityId: file.id,
      afterJson: { fileId: file.id, approvedCount },
      message: `Approved ${approvedCount} staged member records.`
    });
    return refreshed;
  }

  private async requireBatch(gymId: string, batchId: string) {
    const batch = await this.repositories.migrationBatches.getMigrationBatch(batchId);
    if (!batch || batch.gymId !== gymId) {
      throw notFound("Migration batch was not found.");
    }
    return batch;
  }

  private async requireMutableBatch(gymId: string, batchId: string) {
    const batch = await this.requireBatch(gymId, batchId);
    if (batch.status === "finalized" || batch.finalizedAt) {
      throw forbidden("Finalized migration batches cannot be changed.");
    }
    return batch;
  }

  private async requireFile(batchId: string, fileId: string) {
    const file = await this.repositories.migrationFiles.getMigrationFile(fileId);
    if (!file || file.migrationBatchId !== batchId || file.status === "deleted") {
      throw notFound("Migration file was not found.");
    }
    return file;
  }

  private async requireMemberStagingFile(batchId: string, fileId: string) {
    const file = await this.requireFile(batchId, fileId);
    if (file.fileType !== "members" || file.status !== "confirmed") {
      throw badRequest("Only confirmed members files can be staged as member records.", "migration_member_file_required");
    }
    return file;
  }

  private async requireMutableStagedMember(gymId: string, batchId: string, stagedMemberId: string) {
    const batch = await this.requireMutableBatch(gymId, batchId);
    const stagedMember = await this.repositories.migrationStagedMembers.getMigrationStagedMember(stagedMemberId);
    if (!stagedMember || stagedMember.migrationBatchId !== batch.id) {
      throw notFound("Staged member was not found.");
    }
    const file = await this.requireMemberStagingFile(batch.id, stagedMember.migrationFileId);
    return { batch, file, stagedMember };
  }

  private async requireApprovedColumnMappings(file: MigrationFile) {
    const mappings = hydrateColumnMappings(
      file,
      await this.repositories.migrationColumnMappings.listMigrationColumnMappingsForFile(file.id)
    );
    const criticalIssues = validateColumnMappings(file, mappings).filter((issue) => issue.severity === "critical");
    if (criticalIssues.length > 0 || mappings.some((mapping) => !mapping.approved)) {
      throw badRequest("Approve valid column mappings before staging members.", "migration_mappings_not_approved");
    }
    return mappings.filter((mapping) => mapping.approved && mapping.targetField && mapping.targetField !== "ignore");
  }

  private sourceRowToStagedMember(
    batchId: string,
    fileId: string,
    sourceRowNumber: number,
    source: Record<string, string>,
    mappings: MigrationColumnMapping[],
    now: Date
  ): MigrationStagedMember {
    const mapped = sourceRowToMemberFields(source, mappings);
    return {
      id: randomUUID(),
      migrationBatchId: batchId,
      migrationFileId: fileId,
      sourceRowNumber,
      sourceRowJson: source,
      ...mapped,
      tagsJson: mapped.tagsJson ?? [],
      validationStatus: "pending",
      approved: false,
      createdAt: now,
      updatedAt: now
    };
  }

  private async revalidateMemberFile(batchId: string, fileId: string) {
    const now = this.clock.now();
    const stagedMembers = await this.repositories.migrationStagedMembers.listMigrationStagedMembersForFile(fileId);
    const { members, errors } = validateStagedMembers(batchId, fileId, stagedMembers, now);
    const updatedMembers: MigrationStagedMember[] = [];
    for (const member of members) {
      updatedMembers.push(await this.repositories.migrationStagedMembers.updateMigrationStagedMember(member));
    }
    const validationErrors = await this.repositories.migrationValidationErrors.replaceMigrationValidationErrorsForFile(
      batchId,
      fileId,
      errors
    );
    return {
      stagedMembers: updatedMembers,
      validationErrors,
      summary: stagedMemberSummary(updatedMembers, validationErrors)
    };
  }

  private async listActiveFiles(batchId: string) {
    return (await this.repositories.migrationFiles.listMigrationFilesForBatch(batchId)).filter(
      (file) => file.status !== "deleted"
    );
  }

  private requireSupportedMappingFile(
    file: MigrationFile
  ): asserts file is MigrationFile & { fileType: SupportedColumnMappingFileType } {
    if (!isSupportedColumnMappingFileType(file.fileType)) {
      throw badRequest(
        "Column mapping currently supports members, staff, and membership plan files.",
        "migration_mapping_file_type_not_supported"
      );
    }
  }

  private requireConfirmedMappingFile(file: MigrationFile) {
    this.requireSupportedMappingFile(file);
    if (file.status !== "confirmed") {
      throw badRequest("Confirm the file type before generating column mappings.", "migration_file_type_not_confirmed");
    }
  }

  private validateTargetField(file: MigrationFile, targetField: string) {
    this.requireSupportedMappingFile(file);
    if (!migrationTargetFields[file.fileType].includes(targetField)) {
      throw badRequest(`${targetField} is not a valid target field for ${file.fileType}.`, "migration_invalid_target_field");
    }
  }

  private async storeFile(
    gymId: string,
    batchId: string,
    fileId: string,
    originalFilename: string,
    extension: ".csv" | ".xlsx",
    bytes: Buffer
  ) {
    const directory = path.join(this.storageRoot, gymId, batchId);
    await mkdir(directory, { recursive: true });
    const safeName = `${fileId}-${sanitizeOriginalFilename(originalFilename).replace(/\.[^.]+$/, "")}${extension}`;
    const filePath = path.join(directory, safeName);
    await writeFile(filePath, new Uint8Array(bytes), { flag: "wx" });
    return filePath;
  }

  private async touchBatchSummary(batch: MigrationBatch, flags: { uploadedFile?: boolean } = {}) {
    const files = await this.listActiveFiles(batch.id);
    const nextStatus =
      batch.status === "draft" && files.length > 0 && flags.uploadedFile
        ? "files_uploaded"
        : batch.status;
    return this.repositories.migrationBatches.updateMigrationBatch({
      ...batch,
      status: nextStatus,
      updatedAt: this.clock.now(),
      summaryJson: {
        ...batch.summaryJson,
        fileCount: files.length,
        confirmedFileCount: files.filter((file) => file.status === "confirmed").length,
        needsReviewFileCount: files.filter((file) => file.status === "needs_review").length
      }
    });
  }

  private async updateBatchStatusAfterDetection(batch: MigrationBatch) {
    const files = await this.listActiveFiles(batch.id);
    const ready = files.length > 0 && files.every((file) => file.status === "confirmed" && file.fileType !== "unknown");
    return this.repositories.migrationBatches.updateMigrationBatch({
      ...batch,
      status: ready ? "ready_for_staging" : "files_uploaded",
      updatedAt: this.clock.now(),
      summaryJson: {
        ...batch.summaryJson,
        fileCount: files.length,
        confirmedFileCount: files.filter((file) => file.status === "confirmed").length,
        needsReviewFileCount: files.filter((file) => file.status === "needs_review").length
      }
    });
  }

  private async detectFile(file: MigrationFile): Promise<FileTypeDetection> {
    if (!this.aiOptions.apiKey) {
      return {
        ...heuristicFileTypeDetection(file),
        provider: "heuristic"
      };
    }
    try {
      return {
        ...(await this.requestOpenAiFileType(file)),
        provider: "openai"
      };
    } catch (error) {
      const fallback = heuristicFileTypeDetection(file);
      return {
        ...fallback,
        confidence: Math.min(fallback.confidence, 0.49),
        reason: `AI detection failed, so this needs review. ${error instanceof Error ? error.message : "Unknown AI error."}`,
        provider: "heuristic"
      };
    }
  }

  private async detectColumnMappings(file: MigrationFile): Promise<ColumnMappingDetection> {
    if (!this.aiOptions.apiKey) {
      return {
        columnMappings: heuristicColumnMappings(file),
        requiresHumanReview: true,
        provider: "heuristic"
      };
    }
    try {
      return {
        ...(await this.requestOpenAiColumnMappings(file)),
        provider: "openai"
      };
    } catch {
      const fallback = heuristicColumnMappings(file).map((mapping) => ({
        ...mapping,
        confidence: Math.min(mapping.confidence, 0.49)
      }));
      return {
        columnMappings: fallback,
        requiresHumanReview: true,
        provider: "heuristic"
      };
    }
  }

  private async requestOpenAiFileType(file: MigrationFile): Promise<Omit<FileTypeDetection, "provider">> {
    const fetchImpl = this.aiOptions.fetchImpl ?? fetch;
    const baseUrl = (this.aiOptions.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const response = await fetchImpl(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.aiOptions.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.aiOptions.model ?? "gpt-4o-mini",
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text: "Classify uploaded gym-software migration files. Return only the requested JSON. Use unknown when the file type is ambiguous."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  original_filename: file.originalFilename,
                  column_headers: file.columnHeaders,
                  sample_rows: file.sampleRows.slice(0, 10),
                  allowed_file_types: allowedMigrationFileTypes
                })
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "migration_file_type_detection",
            strict: true,
            schema: openAiFileTypeSchema
          }
        }
      })
    });
    const data: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      throw new Error(openAiErrorMessage(data) ?? `OpenAI request failed with status ${response.status}.`);
    }
    const text = extractOpenAiText(data);
    if (!text) {
      throw new Error("OpenAI returned no detection result.");
    }
    const parsed = JSON.parse(text) as { file_type?: string; confidence?: number; reason?: string };
    return normalizeDetection(parsed);
  }

  private async requestOpenAiColumnMappings(file: MigrationFile): Promise<Omit<ColumnMappingDetection, "provider">> {
    this.requireSupportedMappingFile(file);
    const fetchImpl = this.aiOptions.fetchImpl ?? fetch;
    const baseUrl = (this.aiOptions.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const allowedTargetFields = migrationTargetFields[file.fileType];
    const response = await fetchImpl(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.aiOptions.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.aiOptions.model ?? "gpt-4o-mini",
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text: "Map uploaded gym-software migration columns to target fields. Return only the requested JSON. Use ignore when a source column should not be imported."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  original_filename: file.originalFilename,
                  file_type: file.fileType,
                  column_headers: file.columnHeaders,
                  sample_rows: file.sampleRows.slice(0, 10),
                  allowed_target_fields: allowedTargetFields
                })
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "migration_column_mapping",
            strict: true,
            schema: openAiColumnMappingSchema(allowedTargetFields)
          }
        }
      })
    });
    const data: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      throw new Error(openAiErrorMessage(data) ?? `OpenAI request failed with status ${response.status}.`);
    }
    const text = extractOpenAiText(data);
    if (!text) {
      throw new Error("OpenAI returned no column mappings.");
    }
    const parsed = JSON.parse(text) as {
      column_mappings?: Array<{ source_column?: string; target_field?: string; confidence?: number }>;
      requires_human_review?: boolean;
    };
    return normalizeColumnMappingDetection(file, parsed);
  }

  private toColumnMappingRecords(
    batchId: string,
    file: MigrationFile,
    suggestions: ColumnMappingSuggestion[],
    approved: boolean
  ) {
    const now = this.clock.now();
    const suggestionsBySource = bestSuggestionsBySource(file, suggestions);
    return file.columnHeaders.map((sourceColumn) => {
      const suggestion = suggestionsBySource.get(normalizeHeaderKey(sourceColumn));
      const mapping: MigrationColumnMapping = {
        id: randomUUID(),
        migrationBatchId: batchId,
        migrationFileId: file.id,
        sourceColumn,
        targetField: suggestion?.targetField ?? "ignore",
        confidence: suggestion?.confidence ?? 0.5,
        approved,
        createdAt: now,
        updatedAt: now
      };
      return mapping;
    });
  }

  private toColumnMappingResponse(file: MigrationFile, mappings: MigrationColumnMapping[]) {
    this.requireSupportedMappingFile(file);
    const hydratedMappings = hydrateColumnMappings(file, mappings);
    const issues = validateColumnMappings(file, hydratedMappings);
    return {
      file,
      targetFields: migrationTargetFields[file.fileType],
      mappings: hydratedMappings,
      issues,
      requiresHumanReview: hydratedMappings.some((mapping) => !mapping.approved)
        || issues.some((issue) => issue.severity === "critical")
    };
  }

  private async log(
    migrationBatchId: string,
    userId: string,
    input: Omit<MigrationAuditLog, "id" | "migrationBatchId" | "userId" | "createdAt">
  ) {
    return this.repositories.migrationAuditLogs.createMigrationAuditLog({
      id: randomUUID(),
      migrationBatchId,
      userId,
      createdAt: this.clock.now(),
      ...input
    });
  }
}

const openAiFileTypeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    file_type: { type: "string", enum: allowedMigrationFileTypes },
    confidence: { type: "number" },
    reason: { type: "string" }
  },
  required: ["file_type", "confidence", "reason"]
} as const;

function openAiColumnMappingSchema(allowedTargetFields: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      column_mappings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            source_column: { type: "string" },
            target_field: { type: "string", enum: allowedTargetFields },
            confidence: { type: "number" }
          },
          required: ["source_column", "target_field", "confidence"]
        }
      },
      requires_human_review: { type: "boolean" }
    },
    required: ["column_mappings", "requires_human_review"]
  } as const;
}

function isSupportedColumnMappingFileType(fileType: MigrationFileType): fileType is SupportedColumnMappingFileType {
  return supportedColumnMappingFileTypes.includes(fileType as SupportedColumnMappingFileType);
}

function validateMigrationFileName(fileName: string) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".csv")) {
    return ".csv" as const;
  }
  if (lowerName.endsWith(".xlsx")) {
    return ".xlsx" as const;
  }
  throw badRequest("Migration uploads must be CSV or XLSX files.", "migration_file_type_not_allowed");
}

function sanitizeOriginalFilename(fileName: string) {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "migration-file";
}

function contentTypeForExtension(extension: ".csv" | ".xlsx") {
  return extension === ".csv"
    ? "text/csv"
    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

async function parseMigrationFile(fileName: string, extension: ".csv" | ".xlsx", bytes: Buffer): Promise<ParsedMigrationFile> {
  if (extension === ".csv") {
    return parseCsvMigrationFile(bytes.toString("utf8").replace(/^\uFEFF/, ""));
  }
  return parseXlsxMigrationFile(fileName, bytes);
}

async function parseMigrationRowsFromStoredFile(file: MigrationFile): Promise<ParsedMigrationRows> {
  const extension = validateMigrationFileName(file.originalFilename);
  const bytes = await readFile(path.resolve(file.storedFilePath));
  return parseMigrationRows(file.originalFilename, extension, bytes);
}

async function parseMigrationRows(fileName: string, extension: ".csv" | ".xlsx", bytes: Buffer): Promise<ParsedMigrationRows> {
  if (extension === ".csv") {
    return parseCsvMigrationRows(bytes.toString("utf8").replace(/^\uFEFF/, ""));
  }
  return parseXlsxMigrationRows(fileName, bytes);
}

function parseCsvMigrationFile(text: string): ParsedMigrationFile {
  const parsed = parseCsvMigrationRows(text);
  return parsedMigrationRowsToFile(parsed);
}

function parseCsvMigrationRows(text: string): ParsedMigrationRows {
  if (!text.trim()) {
    throw badRequest("Uploaded CSV is empty.", "migration_file_empty");
  }
  const delimiter = countOccurrences(text.split(/\r?\n/, 1)[0] ?? "", "\t") > countOccurrences(text.split(/\r?\n/, 1)[0] ?? "", ",")
    ? "\t"
    : ",";
  const rows = parseDelimitedText(text, delimiter);
  return rowsToParsedMigrationRows(rows);
}

async function parseXlsxMigrationFile(fileName: string, bytes: Buffer): Promise<ParsedMigrationFile> {
  const parsed = await parseXlsxMigrationRows(fileName, bytes);
  return parsedMigrationRowsToFile(parsed);
}

async function parseXlsxMigrationRows(fileName: string, bytes: Buffer): Promise<ParsedMigrationRows> {
  const workbook = new ExcelJS.Workbook();
  const workbookBytes = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  await workbook.xlsx.load(workbookBytes);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw badRequest(`${fileName} does not contain a worksheet.`, "migration_xlsx_empty");
  }
  const rows: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row: ExcelJS.Row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1).map(cellToString) : [];
    if (values.some(Boolean)) {
      rows.push(values);
    }
  });
  return rowsToParsedMigrationRows(rows);
}

function rowsToParsedMigrationFile(rows: string[][]): ParsedMigrationFile {
  return parsedMigrationRowsToFile(rowsToParsedMigrationRows(rows));
}

function rowsToParsedMigrationRows(rows: string[][]): ParsedMigrationRows {
  if (rows.length < 2) {
    throw badRequest("Migration files need a header row and at least one data row.", "migration_file_no_rows");
  }
  const headers = rows[0]?.map((header, index) => cleanHeader(header, index)) ?? [];
  if (headers.every((header) => header.startsWith("Column "))) {
    throw badRequest("Could not read column headers from the first row.", "migration_file_no_headers");
  }
  const dataRows = rows
    .slice(1)
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => !row.every((cell) => !cell.trim()));
  return {
    columnHeaders: headers,
    rowCount: dataRows.length,
    sampleRows: dataRows.slice(0, 10).map(({ row }) => rowToSource(headers, row)),
    rows: dataRows.map(({ row, rowNumber }) => ({
      rowNumber,
      source: rowToSource(headers, row)
    }))
  };
}

function parsedMigrationRowsToFile(parsed: ParsedMigrationRows): ParsedMigrationFile {
  return {
    columnHeaders: parsed.columnHeaders,
    rowCount: parsed.rowCount,
    sampleRows: parsed.sampleRows
  };
}

function parseDelimitedText(text: string, delimiter: "," | "\t") {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === undefined) continue;
    if (inQuotes) {
      if (character === "\"") {
        if (text[index + 1] === "\"") {
          field += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === "\"" && field.length === 0) {
      inQuotes = true;
      continue;
    }
    if (character === delimiter) {
      row.push(field.trim());
      field = "";
      continue;
    }
    if (character === "\r" || character === "\n") {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      continue;
    }
    field += character;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

function cleanHeader(value: string | undefined, index: number) {
  return value?.trim() || `Column ${index + 1}`;
}

function rowToSource(headers: string[], row: string[]) {
  return headers.reduce<Record<string, string>>((source, header, index) => {
    source[header] = row[index]?.trim() ?? "";
    return source;
  }, {});
}

function sourceRowToMemberFields(source: Record<string, string>, mappings: MigrationColumnMapping[]) {
  const byTarget = new Map<string, string>();
  for (const mapping of mappings) {
    if (!mapping.targetField || mapping.targetField === "ignore") {
      continue;
    }
    byTarget.set(mapping.targetField, source[mapping.sourceColumn]?.trim() ?? "");
  }

  const member: Partial<MigrationStagedMember> & { tagsJson: string[] } = {
    tagsJson: splitTags(byTarget.get("tags"))
  };
  setCleanString(member, "firstName", byTarget.get("first_name"));
  setCleanString(member, "lastName", byTarget.get("last_name"));
  setCleanString(member, "fullName", byTarget.get("full_name"));
  setCleanString(member, "email", normalizeEmail(byTarget.get("email")));
  setCleanString(member, "phone", normalizePhone(byTarget.get("phone")));
  setDateValue(member, "dateOfBirth", byTarget.get("date_of_birth"));
  setCleanString(member, "address", byTarget.get("address"));
  setCleanString(member, "emergencyContact", byTarget.get("emergency_contact"));
  setCleanString(member, "membershipStatus", byTarget.get("membership_status"));
  setCleanString(member, "membershipPlanName", byTarget.get("membership_plan_name"));
  setDateValue(member, "startDate", byTarget.get("start_date"));
  setDateValue(member, "cancellationDate", byTarget.get("cancellation_date"));
  setDateValue(member, "nextBillingDate", byTarget.get("next_billing_date"));
  setCleanString(member, "assignedTrainerName", byTarget.get("assigned_trainer_name"));
  setCleanString(member, "notes", byTarget.get("notes"));
  fillNameParts(member);
  return member;
}

function normalizeEditedStagedMember(
  member: MigrationStagedMember,
  input: MigrationStagedMemberUpdateInput,
  now: Date
): MigrationStagedMember {
  const updated: MigrationStagedMember = {
    ...member,
    approved: false,
    validationStatus: "pending",
    updatedAt: now
  };
  setCleanString(updated, "firstName", input.firstName);
  setCleanString(updated, "lastName", input.lastName);
  setCleanString(updated, "fullName", input.fullName);
  setCleanString(updated, "email", normalizeEmail(input.email));
  setCleanString(updated, "phone", normalizePhone(input.phone));
  setDateValue(updated, "dateOfBirth", input.dateOfBirth);
  setCleanString(updated, "address", input.address);
  setCleanString(updated, "emergencyContact", input.emergencyContact);
  setCleanString(updated, "membershipStatus", input.membershipStatus);
  setCleanString(updated, "membershipPlanName", input.membershipPlanName);
  setDateValue(updated, "startDate", input.startDate);
  setDateValue(updated, "cancellationDate", input.cancellationDate);
  setDateValue(updated, "nextBillingDate", input.nextBillingDate);
  setCleanString(updated, "assignedTrainerName", input.assignedTrainerName);
  setCleanString(updated, "notes", input.notes);
  if (input.tags !== undefined) {
    updated.tagsJson = input.tags.map((tag) => tag.trim()).filter(Boolean);
  }
  fillNameParts(updated);
  return updated;
}

function validateStagedMembers(
  batchId: string,
  fileId: string,
  stagedMembers: MigrationStagedMember[],
  now: Date
) {
  const issues: StagedMemberValidationIssue[] = [];
  const members: MigrationStagedMember[] = stagedMembers.map((member) => withoutDuplicateGroup({
    ...member,
    updatedAt: now
  }));
  const activeMembers = members.filter((member) => member.validationStatus !== "skipped");
  const emailGroups = groupMembersBy(activeMembers, (member) => member.email?.toLowerCase());
  const phoneGroups = groupMembersBy(activeMembers, (member) => phoneDuplicateKey(member.phone));
  const duplicateGroupIds = new Map<string, string>();

  const addIssue = (
    member: MigrationStagedMember,
    severity: MigrationValidationErrorSeverity,
    errorCode: string,
    message: string,
    fieldName?: string
  ) => {
    const issue: StagedMemberValidationIssue = {
      stagedRecordId: member.id,
      severity,
      errorCode,
      message
    };
    if (fieldName) {
      issue.fieldName = fieldName;
    }
    issues.push(issue);
  };

  for (const member of activeMembers) {
    if (!hasMemberName(member)) {
      addIssue(member, "critical", "member_name_missing", "Member needs a full name or first and last name.", "full_name");
    }
    if (member.email && !isValidEmail(member.email)) {
      addIssue(member, "critical", "member_email_invalid", "Email address is not valid.", "email");
    }
    if (!member.membershipStatus) {
      addIssue(member, "warning", "membership_status_missing", "Membership status is missing.", "membership_status");
    }
    if (isActiveMembershipStatus(member.membershipStatus) && !member.membershipPlanName) {
      addIssue(member, "warning", "active_member_plan_missing", "Active member is missing a membership plan.", "membership_plan_name");
    }
    if (isActiveMembershipStatus(member.membershipStatus) && member.cancellationDate) {
      addIssue(member, "critical", "active_member_has_cancellation_date", "Active member has a cancellation date.", "cancellation_date");
    }
    if (
      isActiveMembershipStatus(member.membershipStatus) &&
      isRecurringMember(member) &&
      !member.nextBillingDate
    ) {
      addIssue(
        member,
        "warning",
        "active_recurring_billing_missing",
        "Active recurring member is missing next billing or payment timing information.",
        "next_billing_date"
      );
    }
  }

  for (const [email, duplicates] of emailGroups) {
    if (duplicates.length < 2) continue;
    const groupId = duplicateGroupIds.get(`email:${email}`) ?? randomUUID();
    duplicateGroupIds.set(`email:${email}`, groupId);
    for (const member of duplicates) {
      member.duplicateGroupId = groupId;
      addIssue(member, "critical", "duplicate_email", "Another staged member has this email address.", "email");
    }
  }

  for (const [phone, duplicates] of phoneGroups) {
    if (duplicates.length < 2) continue;
    const groupId = duplicateGroupIds.get(`phone:${phone}`) ?? randomUUID();
    duplicateGroupIds.set(`phone:${phone}`, groupId);
    for (const member of duplicates) {
      member.duplicateGroupId = member.duplicateGroupId ?? groupId;
      addIssue(member, "warning", "duplicate_phone", "Another staged member has this phone number.", "phone");
    }
  }

  const issuesByMember = new Map<string, StagedMemberValidationIssue[]>();
  for (const issue of issues) {
    issuesByMember.set(issue.stagedRecordId, [...(issuesByMember.get(issue.stagedRecordId) ?? []), issue]);
  }

  const validatedMembers: MigrationStagedMember[] = members.map((member) => {
    if (member.validationStatus === "skipped") {
      return withoutDuplicateGroup({
        ...member,
        approved: false,
        updatedAt: now
      });
    }
    const memberIssues = issuesByMember.get(member.id) ?? [];
    const validationStatus: MigrationStagedMember["validationStatus"] = memberIssues.some((issue) => issue.severity === "critical")
      ? "critical"
      : memberIssues.some((issue) => issue.severity === "warning")
        ? "warnings"
        : "ready";
    return {
      ...member,
      validationStatus,
      approved: member.approved && validationStatus !== "critical",
      updatedAt: now
    };
  });

  const errors = issues.map((issue) => {
    const error: MigrationValidationError = {
      id: randomUUID(),
      migrationBatchId: batchId,
      migrationFileId: fileId,
      stagedRecordType: "member",
      stagedRecordId: issue.stagedRecordId,
      severity: issue.severity,
      errorCode: issue.errorCode,
      message: issue.message,
      resolved: false,
      createdAt: now,
      updatedAt: now
    };
    if (issue.fieldName) {
      error.fieldName = issue.fieldName;
    }
    return error;
  });

  return { members: validatedMembers, errors };
}

function withoutDuplicateGroup(member: MigrationStagedMember): MigrationStagedMember {
  const cleaned = { ...member };
  delete cleaned.duplicateGroupId;
  return cleaned;
}

function stagedMemberSummary(
  stagedMembers: MigrationStagedMember[],
  validationErrors: MigrationValidationError[]
) {
  return {
    total: stagedMembers.length,
    ready: stagedMembers.filter((member) => member.validationStatus === "ready").length,
    warnings: stagedMembers.filter((member) => member.validationStatus === "warnings").length,
    critical: stagedMembers.filter((member) => member.validationStatus === "critical").length,
    skipped: stagedMembers.filter((member) => member.validationStatus === "skipped").length,
    approved: stagedMembers.filter((member) => member.approved).length,
    validationErrors: validationErrors.length
  };
}

function hasMemberName(member: MigrationStagedMember) {
  return Boolean(member.fullName?.trim() || (member.firstName?.trim() && member.lastName?.trim()));
}

function normalizeEmail(value: string | undefined) {
  return cleanOptionalString(value)?.toLowerCase();
}

function normalizePhone(value: string | undefined) {
  const cleaned = cleanOptionalString(value);
  if (!cleaned) return undefined;
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits.length >= 7 ? digits : cleaned;
}

function phoneDuplicateKey(value: string | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 7 ? digits : undefined;
}

function parseLooseDate(value: string | undefined) {
  const cleaned = cleanOptionalString(value);
  if (!cleaned) return undefined;
  const iso = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return dateFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }
  const slash = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (slash) {
    const year = Number(slash[3]) < 100 ? 2000 + Number(slash[3]) : Number(slash[3]);
    return dateFromParts(year, Number(slash[1]), Number(slash[2]));
  }
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function dateFromParts(year: number, month: number, day: number) {
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : undefined;
}

function splitTags(value: string | undefined) {
  const cleaned = cleanOptionalString(value);
  if (!cleaned) return [];
  return cleaned
    .split(/[,;|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function fillNameParts(member: Partial<MigrationStagedMember>) {
  if ((!member.firstName || !member.lastName) && member.fullName) {
    const split = splitFullName(member.fullName);
    if (!member.firstName && split.firstName) {
      member.firstName = split.firstName;
    }
    if (!member.lastName && split.lastName) {
      member.lastName = split.lastName;
    }
  }
  if (!member.fullName && (member.firstName || member.lastName)) {
    member.fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
  }
}

function splitFullName(fullName: string) {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  if (cleaned.includes(",")) {
    const [lastName, firstName] = cleaned.split(",").map((part) => part?.trim() ?? "");
    return { firstName, lastName };
  }
  const parts = cleaned.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? ""
  };
}

function setCleanString(target: object, key: keyof MigrationStagedMember, value: string | undefined) {
  if (value === undefined) {
    return;
  }
  const cleaned = cleanOptionalString(value);
  if (cleaned) {
    (target as Record<string, unknown>)[key] = cleaned;
  } else {
    delete (target as Record<string, unknown>)[key];
  }
}

function setDateValue(target: object, key: keyof MigrationStagedMember, value: string | undefined) {
  if (value === undefined) {
    return;
  }
  const parsed = parseLooseDate(value);
  if (parsed) {
    (target as Record<string, unknown>)[key] = parsed;
  } else {
    delete (target as Record<string, unknown>)[key];
  }
}

function cleanOptionalString(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isActiveMembershipStatus(value: string | undefined) {
  const normalized = normalizeHeaderKey(value ?? "");
  if (!normalized || hasAny(normalized, ["inactive", "cancel", "frozen", "expired", "terminated"])) {
    return false;
  }
  return hasAny(normalized, ["active", "current", "goodstanding", "paid", "open"]);
}

function isRecurringMember(member: MigrationStagedMember) {
  const text = normalizeHeaderKey([
    member.membershipPlanName,
    member.membershipStatus,
    ...Object.entries(member.sourceRowJson).flat()
  ].filter(Boolean).join(" "));
  return hasAny(text, ["monthly", "month", "yearly", "annual", "recurring", "autopay", "billing", "renewal", "nextbill"]);
}

function groupMembersBy(
  members: MigrationStagedMember[],
  keyForMember: (member: MigrationStagedMember) => string | undefined
) {
  const groups = new Map<string, MigrationStagedMember[]>();
  for (const member of members) {
    const key = keyForMember(member);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), member]);
  }
  return groups;
}

function countOccurrences(value: string, character: string) {
  return [...value].filter((candidate) => candidate === character).length;
}

function cellToString(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text.trim();
    if (typeof record.result === "string" || typeof record.result === "number") return String(record.result).trim();
    if (Array.isArray(record.richText)) {
      return record.richText
        .map((part) => (typeof part === "object" && part && "text" in part ? String((part as { text?: unknown }).text ?? "") : ""))
        .join("")
        .trim();
    }
  }
  return String(value).trim();
}

function heuristicFileTypeDetection(file: MigrationFile): Omit<FileTypeDetection, "provider"> {
  const headerText = file.columnHeaders.map(normalizeHeaderKey).join(" ");
  const nameText = normalizeHeaderKey(file.originalFilename);
  const text = `${nameText} ${headerText}`;
  const scores: Array<{ type: MigrationFileType; score: number; reason: string }> = [
    {
      type: "members",
      score: scoreTokens(text, ["member", "client", "customer", "email", "phone", "membershipstatus", "dateofbirth"]),
      reason: "Looks for member names, emails, phone numbers, status, and profile fields."
    },
    {
      type: "staff",
      score: scoreTokens(text, ["staff", "employee", "role", "hourly", "pay", "trainer", "instructor"]),
      reason: "Looks for staff names, roles, trainer flags, and pay fields."
    },
    {
      type: "membership_plans",
      score: scoreTokens(text, ["plan", "membershipplan", "price", "billing", "frequency", "contract", "classlimit"]),
      reason: "Looks for plan names, price, billing frequency, contract, and limit fields."
    },
    {
      type: "classes",
      score: scoreTokens(text, ["class", "capacity", "room", "coach", "instructor", "recurrence"]),
      reason: "Looks for class names, rooms, instructors, capacity, and recurrence fields."
    },
    {
      type: "attendance",
      score: scoreTokens(text, ["attendance", "checkin", "visit", "visited", "barcode", "scan", "entrytime"]),
      reason: "Looks for visits, check-ins, scans, and attendance timestamps."
    },
    {
      type: "billing",
      score: scoreTokens(text, ["billing", "payment", "invoice", "amount", "paid", "failed", "nextbilling"]),
      reason: "Looks for payments, invoices, failed charges, and billing dates."
    },
    {
      type: "appointments",
      score: scoreTokens(text, ["appointment", "booking", "session", "service", "scheduled", "consultation"]),
      reason: "Looks for appointments, services, scheduled sessions, and consultation fields."
    }
  ];
  const best = scores.sort((left, right) => right.score - left.score)[0];
  if (!best || best.score < 2) {
    return {
      fileType: "unknown",
      confidence: 0.25,
      reason: "The headers do not strongly match a known migration file type."
    };
  }
  return {
    fileType: best.type,
    confidence: Math.min(0.75, 0.35 + best.score * 0.08),
    reason: best.reason
  };
}

function heuristicColumnMappings(file: MigrationFile): ColumnMappingSuggestion[] {
  const fileType = file.fileType;
  if (!isSupportedColumnMappingFileType(fileType)) {
    return [];
  }
  return file.columnHeaders.map((sourceColumn) => {
    const targetField = inferTargetField(fileType, sourceColumn);
    return {
      sourceColumn,
      targetField,
      confidence: targetField === "ignore" ? 0.5 : inferTargetConfidence(sourceColumn, targetField)
    };
  });
}

function inferTargetField(fileType: SupportedColumnMappingFileType, sourceColumn: string) {
  const normalized = normalizeHeaderKey(sourceColumn);
  if (fileType === "members") {
    if (hasAny(normalized, ["firstname", "givenname", "fname"])) return "first_name";
    if (hasAny(normalized, ["lastname", "surname", "familyname", "lname"])) return "last_name";
    if (hasAny(normalized, ["fullname", "membername", "clientname", "customername", "name"])) return "full_name";
    if (hasAny(normalized, ["email", "emailaddress"])) return "email";
    if (hasAny(normalized, ["phone", "mobile", "cell"])) return "phone";
    if (hasAny(normalized, ["dateofbirth", "birthdate", "dob", "birthday"])) return "date_of_birth";
    if (hasAny(normalized, ["address", "street", "city", "zipcode", "postal"])) return "address";
    if (hasAny(normalized, ["emergency", "emergencycontact"])) return "emergency_contact";
    if (hasAny(normalized, ["membershipstatus", "memberstatus", "status"])) return "membership_status";
    if (hasAny(normalized, ["membershipplan", "planname", "package", "membership", "plan"])) return "membership_plan_name";
    if (hasAny(normalized, ["startdate", "joindate", "activationdate", "joined", "started"])) return "start_date";
    if (hasAny(normalized, ["cancellationdate", "canceldate", "terminationdate", "cancelled"])) return "cancellation_date";
    if (hasAny(normalized, ["nextbillingdate", "nextbill", "renewaldate", "billingdate"])) return "next_billing_date";
    if (hasAny(normalized, ["assignedtrainer", "trainer", "coach"])) return "assigned_trainer_name";
    if (hasAny(normalized, ["notes", "note", "comments", "comment"])) return "notes";
    if (hasAny(normalized, ["tags", "tag", "labels", "label"])) return "tags";
  }
  if (fileType === "staff") {
    if (hasAny(normalized, ["firstname", "givenname", "fname"])) return "first_name";
    if (hasAny(normalized, ["lastname", "surname", "familyname", "lname"])) return "last_name";
    if (hasAny(normalized, ["fullname", "employeename", "staffname", "name"])) return "full_name";
    if (hasAny(normalized, ["email", "emailaddress"])) return "email";
    if (hasAny(normalized, ["phone", "mobile", "cell"])) return "phone";
    if (hasAny(normalized, ["oldrole", "rolename", "role", "position", "jobtitle", "title"])) return "old_role_name";
    if (hasAny(normalized, ["employmentstatus", "staffstatus", "status"])) return "employment_status";
    if (hasAny(normalized, ["location", "club", "branch"])) return "assigned_location";
    if (hasAny(normalized, ["trainer", "personaltrainer"])) return "trainer_flag";
    if (hasAny(normalized, ["instructor", "coach"])) return "instructor_flag";
    if (hasAny(normalized, ["permission", "accesslevel", "permissionlevel", "securitylevel"])) return "permission_level";
    if (hasAny(normalized, ["paytype", "salarytype", "compensationtype"])) return "pay_type";
    if (hasAny(normalized, ["hourlyrate", "rate", "wage", "payrate"])) return "hourly_rate";
    if (hasAny(normalized, ["notes", "note", "comments", "comment"])) return "notes";
  }
  if (fileType === "membership_plans") {
    if (hasAny(normalized, ["planname", "membershipname", "packagename", "productname", "name"])) return "plan_name";
    if (hasAny(normalized, ["plantype", "type", "category"])) return "plan_type";
    if (hasAny(normalized, ["price", "amount", "cost", "rate"])) return "price";
    if (hasAny(normalized, ["billingfrequency", "frequency", "interval", "billingcycle"])) return "billing_frequency";
    if (hasAny(normalized, ["contractlength", "term", "length", "duration"])) return "contract_length";
    if (hasAny(normalized, ["classlimit", "classesincluded", "classcount"])) return "class_limit";
    if (hasAny(normalized, ["sessionlimit", "sessionsincluded", "sessioncount"])) return "session_limit";
    if (hasAny(normalized, ["active", "status", "enabled"])) return "active";
    if (hasAny(normalized, ["notes", "note", "description", "comments"])) return "notes";
  }
  return "ignore";
}

function inferTargetConfidence(sourceColumn: string, targetField: string) {
  const normalizedSource = normalizeHeaderKey(sourceColumn);
  const normalizedTarget = normalizeHeaderKey(targetField);
  if (normalizedSource === normalizedTarget || normalizedSource.includes(normalizedTarget)) {
    return 0.9;
  }
  return 0.78;
}

function hasAny(value: string, tokens: string[]) {
  return tokens.some((token) => value.includes(token));
}

function normalizeColumnMappingDetection(
  file: MigrationFile,
  value: {
    column_mappings?: Array<{ source_column?: string; target_field?: string; confidence?: number }>;
    requires_human_review?: boolean;
  }
): Omit<ColumnMappingDetection, "provider"> {
  if (!isSupportedColumnMappingFileType(file.fileType)) {
    return { columnMappings: [], requiresHumanReview: true };
  }
  const sourceByNormalized = new Map(file.columnHeaders.map((header) => [normalizeHeaderKey(header), header]));
  const allowedTargets = migrationTargetFields[file.fileType];
  const columnMappings = (value.column_mappings ?? [])
    .map((mapping) => {
      const sourceColumn = sourceByNormalized.get(normalizeHeaderKey(mapping.source_column ?? ""));
      if (!sourceColumn) {
        return undefined;
      }
      const targetField = allowedTargets.includes(mapping.target_field ?? "") ? mapping.target_field ?? "ignore" : "ignore";
      return {
        sourceColumn,
        targetField,
        confidence: clampConfidence(mapping.confidence)
      };
    })
    .filter((mapping): mapping is ColumnMappingSuggestion => Boolean(mapping));
  return {
    columnMappings,
    requiresHumanReview: value.requires_human_review ?? columnMappings.some((mapping) => mapping.confidence < lowMappingConfidenceThreshold)
  };
}

function bestSuggestionsBySource(file: MigrationFile, suggestions: ColumnMappingSuggestion[]) {
  const suggestionsBySource = new Map<string, ColumnMappingSuggestion>();
  const fallback = heuristicColumnMappings(file);
  for (const suggestion of [...fallback, ...suggestions]) {
    const key = normalizeHeaderKey(suggestion.sourceColumn);
    const existing = suggestionsBySource.get(key);
    if (!existing || suggestion.confidence >= existing.confidence) {
      suggestionsBySource.set(key, suggestion);
    }
  }
  return suggestionsBySource;
}

function hydrateColumnMappings(file: MigrationFile, mappings: MigrationColumnMapping[]) {
  const bySource = new Map(mappings.map((mapping) => [normalizeHeaderKey(mapping.sourceColumn), mapping]));
  return file.columnHeaders.map((sourceColumn) => {
    const existing = bySource.get(normalizeHeaderKey(sourceColumn));
    if (existing) {
      return existing;
    }
    const mapping: MigrationColumnMapping = {
      id: `pending-${normalizeHeaderKey(sourceColumn)}`,
      migrationBatchId: file.migrationBatchId,
      migrationFileId: file.id,
      sourceColumn,
      targetField: "ignore",
      approved: false,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    };
    return mapping;
  });
}

function validateColumnMappings(file: MigrationFile, mappings: MigrationColumnMapping[]): ColumnMappingIssue[] {
  if (!isSupportedColumnMappingFileType(file.fileType)) {
    return [];
  }
  const issues: ColumnMappingIssue[] = [];
  const activeMappings = mappings.filter((mapping) => mapping.targetField && mapping.targetField !== "ignore");
  const targetCounts = new Map<string, MigrationColumnMapping[]>();
  for (const mapping of activeMappings) {
    if (mapping.targetField) {
      targetCounts.set(mapping.targetField, [...(targetCounts.get(mapping.targetField) ?? []), mapping]);
    }
    if (
      mapping.confidence !== undefined &&
      mapping.confidence < lowMappingConfidenceThreshold &&
      !mapping.approved
    ) {
      issues.push({
        severity: "warning",
        code: "low_confidence_mapping",
        message: `${mapping.sourceColumn} has a low-confidence suggestion.`,
        sourceColumn: mapping.sourceColumn,
        ...(mapping.targetField ? { targetField: mapping.targetField } : {})
      });
    }
  }
  for (const [targetField, duplicates] of targetCounts) {
    if (duplicates.length > 1) {
      issues.push({
        severity: "critical",
        code: "duplicate_target_field",
        message: `${targetField} is mapped from multiple source columns.`,
        targetField
      });
    }
  }
  const targets = new Set(activeMappings.map((mapping) => mapping.targetField).filter((target): target is string => Boolean(target)));
  issues.push(...missingRequiredFieldIssues(file.fileType, targets));
  return issues;
}

function missingRequiredFieldIssues(
  fileType: SupportedColumnMappingFileType,
  targets: Set<string>
): ColumnMappingIssue[] {
  const issues: ColumnMappingIssue[] = [];
  if (fileType === "members") {
    if (!targets.has("full_name") && !(targets.has("first_name") && targets.has("last_name"))) {
      issues.push({
        severity: "critical",
        code: "member_name_missing",
        message: "Members need full name, or both first name and last name, before staging."
      });
    }
    if (!targets.has("email")) {
      issues.push({
        severity: "warning",
        code: "member_email_missing",
        message: "No email column is mapped. Members can stage without it, but duplicates are harder to catch."
      });
    }
  }
  if (fileType === "staff") {
    if (!targets.has("full_name") && !(targets.has("first_name") && targets.has("last_name"))) {
      issues.push({
        severity: "critical",
        code: "staff_name_missing",
        message: "Staff need full name, or both first name and last name, before staging."
      });
    }
    if (!targets.has("email")) {
      issues.push({
        severity: "warning",
        code: "staff_email_missing",
        message: "No staff email column is mapped. Login matching may need manual review."
      });
    }
    if (!targets.has("old_role_name")) {
      issues.push({
        severity: "warning",
        code: "staff_role_missing",
        message: "No old role column is mapped. Role mapping will need more manual work."
      });
    }
  }
  if (fileType === "membership_plans") {
    if (!targets.has("plan_name")) {
      issues.push({
        severity: "critical",
        code: "plan_name_missing",
        message: "Membership plans need a plan name before staging."
      });
    }
    if (!targets.has("price")) {
      issues.push({
        severity: "warning",
        code: "plan_price_missing",
        message: "No price column is mapped. Plan pricing will need review."
      });
    }
    if (!targets.has("billing_frequency")) {
      issues.push({
        severity: "warning",
        code: "plan_billing_frequency_missing",
        message: "No billing frequency column is mapped. Recurring plan timing will need review."
      });
    }
  }
  return issues;
}

function scoreTokens(text: string, tokens: string[]) {
  return tokens.reduce((score, token) => score + (text.includes(token) ? 1 : 0), 0);
}

function normalizeHeaderKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function clampConfidence(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;
}

function normalizeDetection(value: { file_type?: string; confidence?: number; reason?: string }): Omit<FileTypeDetection, "provider"> {
  const fileType = allowedMigrationFileTypes.includes(value.file_type as MigrationFileType)
    ? value.file_type as MigrationFileType
    : "unknown";
  return {
    fileType,
    confidence: typeof value.confidence === "number" && Number.isFinite(value.confidence)
      ? Math.min(1, Math.max(0, value.confidence))
      : 0,
    reason: value.reason?.slice(0, 1000) || "No reason returned."
  };
}

function migrationColumnMappingAuditSnapshot(mapping: MigrationColumnMapping) {
  return {
    id: mapping.id,
    sourceColumn: mapping.sourceColumn,
    targetField: mapping.targetField,
    confidence: mapping.confidence,
    approved: mapping.approved
  };
}

function migrationStagedMemberAuditSnapshot(member: MigrationStagedMember) {
  return {
    id: member.id,
    sourceRowNumber: member.sourceRowNumber,
    fullName: member.fullName,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    membershipStatus: member.membershipStatus,
    membershipPlanName: member.membershipPlanName,
    validationStatus: member.validationStatus,
    approved: member.approved
  };
}

function migrationFileAuditSnapshot(file: MigrationFile) {
  return {
    id: file.id,
    originalFilename: file.originalFilename,
    fileType: file.fileType,
    detectedFileType: file.detectedFileType,
    fileTypeConfidence: file.fileTypeConfidence,
    detectionReason: file.detectionReason,
    status: file.status,
    rowCount: file.rowCount
  };
}

function openAiErrorMessage(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error?: { message?: unknown } }).error?.message === "string"
  ) {
    return (data as { error: { message: string } }).error.message;
  }
  return undefined;
}

function extractOpenAiText(data: unknown): string | undefined {
  if (
    typeof data === "object" &&
    data !== null &&
    "output_text" in data &&
    typeof (data as { output_text?: unknown }).output_text === "string"
  ) {
    return (data as { output_text: string }).output_text;
  }
  if (!isOpenAiResponseWithOutput(data)) {
    return undefined;
  }
  const chunks: string[] = [];
  for (const item of data.output) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("").trim() || undefined;
}

function isOpenAiResponseWithOutput(
  value: unknown
): value is { output: Array<{ content?: Array<{ type?: string; text?: string }> }> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "output" in value &&
    Array.isArray((value as { output?: unknown }).output)
  );
}
