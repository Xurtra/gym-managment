import type {
  MigrationColumnMappingSaveInput,
  MigrationFileUploadInput,
  MigrationPlanMappingApproveInput,
  MigrationStagedPlansApproveInput,
  MigrationStagedPlanUpdateInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { badRequest, conflict, notFound } from "../../http/errors.js";
import type {
  MigrationAuditLog,
  MigrationBatch,
  MigrationColumnMapping,
  MigrationFile,
  MigrationPlanMapping,
  MigrationPlanType,
  MigrationStagedMembershipPlan,
  MigrationValidationError,
  MigrationValidationSeverity
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

const MEMBERSHIP_PLAN_TARGET_FIELDS = [
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
] as const;

const PLAN_TYPES = [
  "Monthly Membership",
  "Annual Membership",
  "Class Pack",
  "Personal Training Package",
  "Drop-In",
  "Trial",
  "Family Add-On",
  "Student/Discounted Plan",
  "Legacy Plan",
  "Free/Comped Plan",
  "Unknown"
] as const satisfies readonly MigrationPlanType[];

type MembershipPlanTargetField = (typeof MEMBERSHIP_PLAN_TARGET_FIELDS)[number];

interface AiPlanMappingCandidate {
  oldPlanName: string;
  price?: number;
  billingFrequency?: string;
}

interface PlanMappingSuggestion {
  oldPlanName: string;
  suggestedPlanType: MigrationPlanType;
  confidence: number;
  requiresReview: boolean;
}

interface MigrationAiConfig {
  apiKey?: string;
  model?: string;
}

export class MigrationPlanImportService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock,
    private readonly aiConfig: MigrationAiConfig = {}
  ) {}

  async createBatch(gymId: string, userId: string) {
    const now = this.clock.now();
    const batch: MigrationBatch = {
      id: randomUUID(),
      gymId,
      status: "draft",
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
      summaryJson: {}
    };
    const created = await this.repositories.migrations.createBatch(batch);
    await this.log(created.id, userId, "migration_batch_created", "migration_batch", created.id);
    return this.getBatchState(gymId, created.id);
  }

  async listBatches(gymId: string) {
    return {
      batches: await this.repositories.migrations.listBatchesForGym(gymId)
    };
  }

  async getBatchState(gymId: string, batchId: string) {
    const batch = await this.getOwnedBatch(gymId, batchId);
    const [files, stagedPlans, planMappings, validationErrors, auditLogs] = await Promise.all([
      this.repositories.migrations.listFilesForBatch(batch.id),
      this.repositories.migrations.listStagedMembershipPlansForBatch(batch.id),
      this.repositories.migrations.listPlanMappingsForBatch(batch.id),
      this.repositories.migrations.listValidationErrorsForBatch(batch.id),
      this.repositories.migrations.listAuditLogsForBatch(batch.id)
    ]);
    const columnMappingsByFile = Object.fromEntries(
      await Promise.all(
        files.map(async (file) => [
          file.id,
          await this.repositories.migrations.listColumnMappingsForFile(file.id)
        ])
      )
    );
    return {
      batch,
      files,
      columnMappingsByFile,
      stagedPlans,
      planMappings,
      validationErrors,
      auditLogs,
      targetFields: MEMBERSHIP_PLAN_TARGET_FIELDS,
      planTypes: PLAN_TYPES,
      mappingIssues: this.mappingIssues(files, columnMappingsByFile)
    };
  }

  async uploadFile(
    gymId: string,
    batchId: string,
    userId: string,
    input: MigrationFileUploadInput
  ) {
    const batch = await this.getOwnedBatch(gymId, batchId);
    if (batch.finalizedAt || batch.status === "finalized") {
      throw conflict("Finalized migration batches cannot accept files.", "migration_batch_finalized");
    }
    assertCsvUpload(input.fileName);
    const raw = Buffer.from(input.base64Data, "base64").toString("utf8");
    const parsed = parseCsv(raw);
    if (parsed.headers.length === 0) {
      throw badRequest("The CSV file does not have a header row.", "csv_headers_required");
    }
    const uploadDir = path.join(process.cwd(), ".migration-uploads", batch.id);
    await mkdir(uploadDir, { recursive: true });
    const safeName = `${randomUUID()}-${sanitizeFilename(input.fileName)}`;
    const storedFilePath = path.join(uploadDir, safeName);
    await writeFile(storedFilePath, raw, "utf8");
    const now = this.clock.now();
    const file: MigrationFile = {
      id: randomUUID(),
      migrationBatchId: batch.id,
      originalFilename: input.fileName,
      storedFilePath,
      contentType: input.contentType ?? "text/csv",
      sizeBytes: Buffer.byteLength(raw),
      fileType: "membership_plans",
      detectedFileType: "membership_plans",
      fileTypeConfidence: 1,
      rowCount: parsed.rows.length,
      columnHeaders: parsed.headers,
      sampleRows: parsed.rows.slice(0, 10),
      status: "uploaded",
      createdAt: now,
      updatedAt: now
    };
    await this.repositories.migrations.createFile(file);
    await this.repositories.migrations.updateBatch({
      ...batch,
      status: "files_uploaded",
      updatedAt: now
    });
    await this.log(batch.id, userId, "migration_file_uploaded", "migration_file", file.id, {
      afterJson: { originalFilename: file.originalFilename, rowCount: file.rowCount }
    });
    return this.getBatchState(gymId, batch.id);
  }

  async deleteFile(gymId: string, batchId: string, fileId: string, userId: string) {
    const { batch, file } = await this.getOwnedFile(gymId, batchId, fileId);
    if (batch.finalizedAt || batch.status === "finalized" || file.status === "staged") {
      throw conflict("This migration file cannot be deleted after staging.", "migration_file_locked");
    }
    await this.repositories.migrations.updateFile({
      ...file,
      status: "deleted",
      updatedAt: this.clock.now()
    });
    await this.log(batch.id, userId, "migration_file_deleted", "migration_file", file.id);
    return this.getBatchState(gymId, batch.id);
  }

  async generateColumnMappings(gymId: string, batchId: string, fileId: string, userId: string) {
    const { batch, file } = await this.getOwnedFile(gymId, batchId, fileId);
    this.ensureMembershipPlanFile(file);
    const now = this.clock.now();
    const mappings = file.columnHeaders.map((header) => {
      const suggestion = suggestColumnMapping(header);
      return {
        id: randomUUID(),
        migrationBatchId: batch.id,
        migrationFileId: file.id,
        sourceColumn: header,
        targetField: suggestion.targetField,
        confidence: suggestion.confidence,
        approved: false,
        createdAt: now,
        updatedAt: now
      } satisfies MigrationColumnMapping;
    });
    await this.repositories.migrations.replaceColumnMappings(batch.id, file.id, mappings);
    await this.log(batch.id, userId, "migration_column_mappings_generated", "migration_file", file.id);
    return this.getBatchState(gymId, batch.id);
  }

  async approveColumnMappings(
    gymId: string,
    batchId: string,
    fileId: string,
    userId: string,
    input: MigrationColumnMappingSaveInput
  ) {
    const { batch, file } = await this.getOwnedFile(gymId, batchId, fileId);
    this.ensureMembershipPlanFile(file);
    const sourceColumns = new Set(file.columnHeaders);
    for (const mapping of input.mappings) {
      if (!sourceColumns.has(mapping.sourceColumn)) {
        throw badRequest(`Unknown source column: ${mapping.sourceColumn}`, "unknown_source_column");
      }
    }
    const now = this.clock.now();
    const mappings = input.mappings.map((mapping) => {
      const approved: MigrationColumnMapping = {
        id: randomUUID(),
        migrationBatchId: batch.id,
        migrationFileId: file.id,
        sourceColumn: mapping.sourceColumn,
        targetField: mapping.targetField,
        confidence: mapping.confidence,
        approved: true,
        approvedByUserId: userId,
        createdAt: now,
        updatedAt: now
      };
      return approved;
    });
    await this.repositories.migrations.replaceColumnMappings(batch.id, file.id, mappings);
    await this.repositories.migrations.updateFile({ ...file, status: "mapped", updatedAt: now });
    await this.repositories.migrations.updateBatch({ ...batch, status: "mapped", updatedAt: now });
    await this.log(batch.id, userId, "migration_column_mappings_approved", "migration_file", file.id);
    return this.getBatchState(gymId, batch.id);
  }

  async stageMembershipPlans(gymId: string, batchId: string, fileId: string, userId: string) {
    const { batch, file } = await this.getOwnedFile(gymId, batchId, fileId);
    this.ensureMembershipPlanFile(file);
    const mappings = await this.repositories.migrations.listColumnMappingsForFile(file.id);
    if (mappings.length === 0 || mappings.some((mapping) => !mapping.approved)) {
      throw conflict("Column mappings must be approved before staging.", "column_mappings_required");
    }
    const rows = parseCsv(await readFile(file.storedFilePath, "utf8")).rows;
    const now = this.clock.now();
    const stagedPlans = rows.map((row, index) => {
      const staged = buildStagedPlan(batch.id, file.id, row, index + 2, mappings, now);
      return staged;
    });
    const validationErrors = validateStagedPlans(stagedPlans, mappings, now);
    applyValidationStatus(stagedPlans, validationErrors);
    await this.repositories.migrations.replaceStagedMembershipPlans(batch.id, file.id, stagedPlans);
    await this.repositories.migrations.replaceValidationErrorsForBatch(batch.id, validationErrors);
    await this.repositories.migrations.updateFile({ ...file, status: "staged", updatedAt: now });
    await this.repositories.migrations.updateBatch({ ...batch, status: "staged", updatedAt: now });
    await this.log(batch.id, userId, "membership_plans_staged", "migration_file", file.id, {
      message: `${stagedPlans.length} membership plan rows staged.`
    });
    return this.getBatchState(gymId, batch.id);
  }

  async generatePlanMappings(gymId: string, batchId: string, userId: string) {
    const batch = await this.getOwnedBatch(gymId, batchId);
    const stagedPlans = await this.repositories.migrations.listStagedMembershipPlansForBatch(batch.id);
    if (stagedPlans.length === 0) {
      throw conflict("Stage membership plans before generating plan type mappings.", "staged_plans_required");
    }
    const candidates = uniquePlanCandidates(stagedPlans);
    const suggestions =
      (await this.tryAiPlanMapping(candidates)) ?? candidates.map((candidate) => heuristicPlanMapping(candidate));
    const now = this.clock.now();
    const mappings = suggestions.map((suggestion) => ({
      id: randomUUID(),
      migrationBatchId: batch.id,
      oldPlanName: suggestion.oldPlanName,
      suggestedPlanType: suggestion.suggestedPlanType,
      finalPlanType: suggestion.suggestedPlanType,
      confidence: suggestion.confidence,
      requiresReview: suggestion.requiresReview || suggestion.confidence < 0.85,
      approved: false,
      createdAt: now,
      updatedAt: now
    } satisfies MigrationPlanMapping));
    await this.repositories.migrations.replacePlanMappings(batch.id, mappings);
    await this.applyPlanTypes(batch.id, mappings, false);
    await this.log(batch.id, userId, "migration_plan_mappings_generated", "migration_batch", batch.id, {
      afterJson: { mappings: mappings.map((mapping) => publicPlanMapping(mapping)) }
    });
    return this.getBatchState(gymId, batch.id);
  }

  async approvePlanMappings(
    gymId: string,
    batchId: string,
    userId: string,
    input: MigrationPlanMappingApproveInput
  ) {
    const batch = await this.getOwnedBatch(gymId, batchId);
    const existing = await this.repositories.migrations.listPlanMappingsForBatch(batch.id);
    if (existing.length === 0) {
      throw conflict("Generate plan mappings before approving them.", "plan_mappings_required");
    }
    const byId = new Map(existing.map((mapping) => [mapping.id, mapping]));
    const byName = new Map(existing.map((mapping) => [canonicalText(mapping.oldPlanName), mapping]));
    const now = this.clock.now();
    const updated: MigrationPlanMapping[] = [];
    for (const item of input.mappings) {
      const mapping = item.mappingId ? byId.get(item.mappingId) : byName.get(canonicalText(item.oldPlanName));
      if (!mapping) {
        throw badRequest(`Unknown plan mapping: ${item.oldPlanName}`, "unknown_plan_mapping");
      }
      const next: MigrationPlanMapping = {
        ...mapping,
        finalPlanType: item.finalPlanType,
        requiresReview: false,
        approved: true,
        approvedByUserId: userId,
        updatedAt: now
      };
      updated.push(next);
    }
    for (const mapping of updated) {
      await this.repositories.migrations.updatePlanMapping(mapping);
    }
    await this.applyPlanTypes(batch.id, updated, true);
    await this.log(batch.id, userId, "migration_plan_mappings_approved", "migration_batch", batch.id);
    return this.getBatchState(gymId, batch.id);
  }

  async updateStagedPlan(
    gymId: string,
    batchId: string,
    stagedPlanId: string,
    userId: string,
    input: MigrationStagedPlanUpdateInput
  ) {
    const batch = await this.getOwnedBatch(gymId, batchId);
    const stagedPlans = await this.repositories.migrations.listStagedMembershipPlansForBatch(batch.id);
    const existing = stagedPlans.find((plan) => plan.id === stagedPlanId);
    if (!existing) {
      throw notFound("Staged membership plan was not found.");
    }
    const updated: MigrationStagedMembershipPlan = {
      ...existing,
      ...definedStagedPlanUpdates(input),
      updatedAt: this.clock.now()
    };
    await this.repositories.migrations.updateStagedMembershipPlan(updated);
    await this.revalidateBatch(batch.id);
    await this.log(batch.id, userId, "staged_membership_plan_updated", "migration_staged_membership_plan", stagedPlanId);
    return this.getBatchState(gymId, batch.id);
  }

  async approveStagedPlans(
    gymId: string,
    batchId: string,
    userId: string,
    input: MigrationStagedPlansApproveInput
  ) {
    const batch = await this.getOwnedBatch(gymId, batchId);
    const stagedPlans = await this.repositories.migrations.listStagedMembershipPlansForBatch(batch.id);
    const requestedIds = new Set(input.stagedPlanIds ?? []);
    const toApprove = stagedPlans.filter((plan) => {
      if (plan.skipped || plan.validationStatus === "critical") {
        return false;
      }
      return input.approveAllReady || requestedIds.has(plan.id);
    });
    const now = this.clock.now();
    for (const plan of toApprove) {
      await this.repositories.migrations.updateStagedMembershipPlan({
        ...plan,
        approved: true,
        updatedAt: now
      });
    }
    await this.repositories.migrations.updateBatch({ ...batch, status: "approved", updatedAt: now });
    await this.log(batch.id, userId, "staged_membership_plans_approved", "migration_batch", batch.id, {
      message: `${toApprove.length} staged membership plans approved for future import.`
    });
    return this.getBatchState(gymId, batch.id);
  }

  private async getOwnedBatch(gymId: string, batchId: string) {
    const batch = await this.repositories.migrations.getBatch(batchId);
    if (!batch || batch.gymId !== gymId) {
      throw notFound("Migration batch was not found.");
    }
    return batch;
  }

  private async getOwnedFile(gymId: string, batchId: string, fileId: string) {
    const batch = await this.getOwnedBatch(gymId, batchId);
    const file = await this.repositories.migrations.getFile(fileId);
    if (!file || file.migrationBatchId !== batch.id || file.status === "deleted") {
      throw notFound("Migration file was not found.");
    }
    return { batch, file };
  }

  private ensureMembershipPlanFile(file: MigrationFile) {
    if (file.fileType !== "membership_plans") {
      throw conflict("Only membership plan files can be staged in this step.", "file_type_mismatch");
    }
  }

  private async tryAiPlanMapping(
    candidates: AiPlanMappingCandidate[]
  ): Promise<PlanMappingSuggestion[] | undefined> {
    const apiKey = this.aiConfig.apiKey;
    if (!apiKey) {
      return undefined;
    }
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.aiConfig.model ?? "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content:
                "You classify old gym membership plan names into the allowed plan types. Return only JSON that matches the requested shape."
            },
            {
              role: "user",
              content: JSON.stringify({
                allowed_plan_types: PLAN_TYPES,
                plans: candidates,
                output_shape: {
                  plan_mappings: [
                    {
                      old_plan_name: "Unlimited Monthly",
                      suggested_plan_type: "Monthly Membership",
                      confidence: 0.95,
                      requires_review: false
                    }
                  ]
                }
              })
            }
          ]
        })
      });
      if (!response.ok) {
        return undefined;
      }
      const data = await response.json() as Record<string, unknown>;
      const text = extractOpenAiText(data);
      if (!text) {
        return undefined;
      }
      const parsed = JSON.parse(text) as { plan_mappings?: unknown[] };
      const mappings = Array.isArray(parsed.plan_mappings) ? parsed.plan_mappings : [];
      const suggestions = mappings.flatMap((mapping): PlanMappingSuggestion[] => {
        if (!isRecord(mapping)) {
          return [];
        }
        const oldPlanName = stringValue(mapping.old_plan_name);
        const suggestedPlanType = planTypeValue(mapping.suggested_plan_type);
        const confidence = numberValue(mapping.confidence);
        if (!oldPlanName || !suggestedPlanType || confidence === undefined) {
          return [];
        }
        return [
          {
            oldPlanName,
            suggestedPlanType,
            confidence: clampConfidence(confidence),
            requiresReview: mapping.requires_review === true
          }
        ];
      });
      return suggestions.length === candidates.length ? suggestions : undefined;
    } catch {
      return undefined;
    }
  }

  private async applyPlanTypes(
    batchId: string,
    mappings: MigrationPlanMapping[],
    useFinalType: boolean
  ) {
    const byName = new Map(
      mappings.map((mapping) => [
        canonicalText(mapping.oldPlanName),
        useFinalType ? mapping.finalPlanType : mapping.suggestedPlanType
      ])
    );
    const byNameConfidence = new Map(
      mappings.map((mapping) => [canonicalText(mapping.oldPlanName), mapping.confidence])
    );
    const stagedPlans = await this.repositories.migrations.listStagedMembershipPlansForBatch(batchId);
    for (const plan of stagedPlans) {
      const key = canonicalText(plan.planName ?? "");
      const planType = byName.get(key);
      if (!planType) {
        continue;
      }
      const next: MigrationStagedMembershipPlan = {
        ...plan,
        planType,
        updatedAt: this.clock.now()
      };
      const confidence = byNameConfidence.get(key);
      if (confidence !== undefined) {
        next.aiConfidence = confidence;
      }
      await this.repositories.migrations.updateStagedMembershipPlan(next);
    }
    await this.revalidateBatch(batchId);
  }

  private async revalidateBatch(batchId: string) {
    const stagedPlans = await this.repositories.migrations.listStagedMembershipPlansForBatch(batchId);
    const files = await this.repositories.migrations.listFilesForBatch(batchId);
    const mappings = (
      await Promise.all(files.map((file) => this.repositories.migrations.listColumnMappingsForFile(file.id)))
    ).flat();
    const errors = validateStagedPlans(stagedPlans, mappings, this.clock.now());
    applyValidationStatus(stagedPlans, errors);
    for (const plan of stagedPlans) {
      await this.repositories.migrations.updateStagedMembershipPlan(plan);
    }
    await this.repositories.migrations.replaceValidationErrorsForBatch(batchId, errors);
  }

  private mappingIssues(
    files: MigrationFile[],
    columnMappingsByFile: Record<string, MigrationColumnMapping[]>
  ) {
    return files.map((file) => {
      const mappings = columnMappingsByFile[file.id] ?? [];
      const duplicates = duplicateMappedTargets(mappings);
      const missing = mappings.some((mapping) => mapping.targetField === "plan_name")
        ? []
        : ["plan_name"];
      return {
        fileId: file.id,
        duplicates,
        missingRequiredFields: missing
      };
    });
  }

  private async log(
    batchId: string,
    userId: string | undefined,
    action: string,
    entityType: string,
    entityId?: string,
    extra: {
      beforeJson?: Record<string, unknown>;
      afterJson?: Record<string, unknown>;
      message?: string;
    } = {}
  ) {
    const entry: MigrationAuditLog = {
      id: randomUUID(),
      migrationBatchId: batchId,
      action,
      entityType,
      createdAt: this.clock.now()
    };
    if (userId) {
      entry.userId = userId;
    }
    if (entityId) {
      entry.entityId = entityId;
    }
    if (extra.beforeJson) {
      entry.beforeJson = extra.beforeJson;
    }
    if (extra.afterJson) {
      entry.afterJson = extra.afterJson;
    }
    if (extra.message) {
      entry.message = extra.message;
    }
    await this.repositories.migrations.createAuditLog(entry);
  }
}

function assertCsvUpload(originalFilename: string) {
  if (!originalFilename.toLowerCase().endsWith(".csv")) {
    throw badRequest("Only CSV files are supported for staged plan imports right now.", "unsupported_file_type");
  }
}

function sanitizeFilename(name: string) {
  return name.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char !== "\r") {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);
  const nonEmptyRows = rows.filter((candidate) => candidate.some((value) => value.trim()));
  const headers = (nonEmptyRows.shift() ?? []).map((header) => header.trim());
  const mappedRows = nonEmptyRows.map((values) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index]?.trim() ?? "";
    });
    return record;
  });
  return { headers, rows: mappedRows };
}

function suggestColumnMapping(header: string): { targetField: MembershipPlanTargetField; confidence: number } {
  const normalized = canonicalText(header);
  if (/\b(plan|membership|package)\b/.test(normalized) && /\b(name|title)\b/.test(normalized)) {
    return { targetField: "plan_name", confidence: 0.94 };
  }
  if (normalized === "name" || normalized === "plan") {
    return { targetField: "plan_name", confidence: 0.86 };
  }
  if (/\b(type|category)\b/.test(normalized)) {
    return { targetField: "plan_type", confidence: 0.74 };
  }
  if (/\b(price|amount|cost|dues|rate)\b/.test(normalized)) {
    return { targetField: "price", confidence: 0.91 };
  }
  if (/\b(billing|frequency|interval|cycle|recurrence)\b/.test(normalized)) {
    return { targetField: "billing_frequency", confidence: 0.9 };
  }
  if (/\b(contract|term|length|months)\b/.test(normalized)) {
    return { targetField: "contract_length", confidence: 0.82 };
  }
  if (/\b(class|classes|visit|visits)\b/.test(normalized)) {
    return { targetField: "class_limit", confidence: 0.78 };
  }
  if (/\b(session|sessions|pt)\b/.test(normalized)) {
    return { targetField: "session_limit", confidence: 0.78 };
  }
  if (/\b(active|status|enabled)\b/.test(normalized)) {
    return { targetField: "active", confidence: 0.72 };
  }
  if (/\b(note|notes|description|memo)\b/.test(normalized)) {
    return { targetField: "notes", confidence: 0.8 };
  }
  return { targetField: "ignore", confidence: 0.55 };
}

function buildStagedPlan(
  batchId: string,
  fileId: string,
  row: Record<string, string>,
  sourceRowNumber: number,
  mappings: MigrationColumnMapping[],
  now: Date
): MigrationStagedMembershipPlan {
  const values = mappedValues(row, mappings);
  const plan: MigrationStagedMembershipPlan = {
    id: randomUUID(),
    migrationBatchId: batchId,
    migrationFileId: fileId,
    sourceRowNumber,
    sourceRowJson: row,
    validationStatus: "pending",
    approved: false,
    skipped: false,
    createdAt: now,
    updatedAt: now
  };
  if (values.plan_name?.trim()) {
    plan.planName = values.plan_name.trim();
  }
  if (values.billing_frequency?.trim()) {
    plan.billingFrequency = values.billing_frequency.trim();
  }
  if (values.notes?.trim()) {
    plan.notes = values.notes.trim();
  }
  const planType = planTypeValue(values.plan_type);
  if (planType) {
    plan.planType = planType;
  }
  const price = parseMoney(values.price);
  if (price !== undefined) {
    plan.price = price;
  }
  const contractLength = parseInteger(values.contract_length);
  if (contractLength !== undefined) {
    plan.contractLength = contractLength;
  }
  const classLimit = parseInteger(values.class_limit);
  if (classLimit !== undefined) {
    plan.classLimit = classLimit;
  }
  const sessionLimit = parseInteger(values.session_limit);
  if (sessionLimit !== undefined) {
    plan.sessionLimit = sessionLimit;
  }
  const active = parseBoolean(values.active);
  if (active !== undefined) {
    plan.active = active;
  }
  return plan;
}

function mappedValues(row: Record<string, string>, mappings: MigrationColumnMapping[]) {
  const values: Partial<Record<MembershipPlanTargetField, string>> = {};
  for (const mapping of mappings) {
    if (mapping.targetField === "ignore" || values[mapping.targetField as MembershipPlanTargetField]) {
      continue;
    }
    values[mapping.targetField as MembershipPlanTargetField] = row[mapping.sourceColumn] ?? "";
  }
  return values;
}

function validateStagedPlans(
  stagedPlans: MigrationStagedMembershipPlan[],
  mappings: MigrationColumnMapping[],
  now: Date
) {
  const errors: MigrationValidationError[] = [];
  for (const plan of stagedPlans) {
    if (plan.skipped) {
      continue;
    }
    if (!plan.planName?.trim()) {
      errors.push(validationError(plan, "critical", "plan_name_required", "Plan must have a name.", "plan_name", now));
    }
    const sourcePrice = sourceValueForTarget(plan, mappings, "price");
    if (sourcePrice && parseMoney(sourcePrice) === undefined) {
      errors.push(validationError(plan, "warning", "price_not_numeric", "Price should be numeric if present.", "price", now));
    }
    if (isRecurringType(plan.planType) && !plan.billingFrequency?.trim()) {
      errors.push(validationError(plan, "warning", "billing_frequency_required", "Recurring plans should have a billing frequency.", "billing_frequency", now));
    }
    if (plan.planType === "Annual Membership" && plan.billingFrequency?.toLowerCase().includes("month")) {
      errors.push(validationError(plan, "warning", "annual_plan_monthly_billing", "Annual plans with monthly billing frequency should be reviewed.", "billing_frequency", now));
    }
    if ((plan.price ?? undefined) === 0 && plan.planType !== "Free/Comped Plan") {
      errors.push(validationError(plan, "warning", "free_plan_not_marked", "Free plans should be explicitly marked Free/Comped.", "plan_type", now));
    }
    if (!plan.planType || plan.planType === "Unknown") {
      errors.push(validationError(plan, "warning", "unknown_plan_type", "Unknown plan types require review.", "plan_type", now));
    }
  }
  return errors;
}

function validationError(
  plan: MigrationStagedMembershipPlan,
  severity: MigrationValidationSeverity,
  errorCode: string,
  message: string,
  fieldName: string,
  now: Date
): MigrationValidationError {
  return {
    id: randomUUID(),
    migrationBatchId: plan.migrationBatchId,
    migrationFileId: plan.migrationFileId,
    stagedRecordType: "membership_plan",
    stagedRecordId: plan.id,
    severity,
    errorCode,
    message,
    fieldName,
    resolved: false,
    createdAt: now,
    updatedAt: now
  };
}

function applyValidationStatus(
  stagedPlans: MigrationStagedMembershipPlan[],
  validationErrors: MigrationValidationError[]
) {
  const severityByPlan = new Map<string, MigrationValidationSeverity[]>();
  for (const error of validationErrors) {
    if (!error.stagedRecordId) {
      continue;
    }
    const severities = severityByPlan.get(error.stagedRecordId) ?? [];
    severities.push(error.severity);
    severityByPlan.set(error.stagedRecordId, severities);
  }
  for (const plan of stagedPlans) {
    if (plan.skipped) {
      plan.validationStatus = "skipped";
    } else {
      const severities = severityByPlan.get(plan.id) ?? [];
      plan.validationStatus = severities.includes("critical")
        ? "critical"
        : severities.includes("warning")
          ? "warning"
          : "ready";
    }
  }
}

function sourceValueForTarget(
  plan: MigrationStagedMembershipPlan,
  mappings: MigrationColumnMapping[],
  targetField: string
) {
  const mapping = mappings.find(
    (candidate) =>
      candidate.migrationFileId === plan.migrationFileId && candidate.targetField === targetField
  );
  return mapping ? plan.sourceRowJson[mapping.sourceColumn]?.trim() : undefined;
}

function uniquePlanCandidates(stagedPlans: MigrationStagedMembershipPlan[]) {
  const byName = new Map<string, AiPlanMappingCandidate>();
  for (const plan of stagedPlans) {
    const planName = plan.planName?.trim();
    if (!planName || byName.has(canonicalText(planName))) {
      continue;
    }
    const candidate: AiPlanMappingCandidate = { oldPlanName: planName };
    if (plan.price !== undefined) {
      candidate.price = plan.price;
    }
    if (plan.billingFrequency) {
      candidate.billingFrequency = plan.billingFrequency;
    }
    byName.set(canonicalText(planName), candidate);
  }
  return [...byName.values()];
}

function heuristicPlanMapping(candidate: AiPlanMappingCandidate): PlanMappingSuggestion {
  const text = `${candidate.oldPlanName} ${candidate.billingFrequency ?? ""}`.toLowerCase();
  if (candidate.price === 0 || /\b(free|comp|comped|employee)\b/.test(text)) {
    return planSuggestion(candidate.oldPlanName, "Free/Comped Plan", 0.92);
  }
  if (/\b(founder|legacy|grandfather|old rate)\b/.test(text)) {
    return planSuggestion(candidate.oldPlanName, "Legacy Plan", 0.78, true);
  }
  if (/\b(annual|year|yearly|12 month)\b/.test(text)) {
    return planSuggestion(candidate.oldPlanName, "Annual Membership", 0.9);
  }
  if (/\b(month|monthly|unlimited)\b/.test(text)) {
    return planSuggestion(candidate.oldPlanName, "Monthly Membership", 0.9);
  }
  if (/\b(class pack|pack|punch|classes|visits)\b/.test(text)) {
    return planSuggestion(candidate.oldPlanName, "Class Pack", 0.86);
  }
  if (/\b(personal|training|pt|session)\b/.test(text)) {
    return planSuggestion(candidate.oldPlanName, "Personal Training Package", 0.86);
  }
  if (/\b(drop|day pass|single)\b/.test(text)) {
    return planSuggestion(candidate.oldPlanName, "Drop-In", 0.86);
  }
  if (/\b(trial|intro|starter)\b/.test(text)) {
    return planSuggestion(candidate.oldPlanName, "Trial", 0.86);
  }
  if (/\b(family|add on|addon|add-on)\b/.test(text)) {
    return planSuggestion(candidate.oldPlanName, "Family Add-On", 0.84);
  }
  if (/\b(student|senior|discount)\b/.test(text)) {
    return planSuggestion(candidate.oldPlanName, "Student/Discounted Plan", 0.84);
  }
  return planSuggestion(candidate.oldPlanName, "Unknown", 0.55, true);
}

function planSuggestion(
  oldPlanName: string,
  suggestedPlanType: MigrationPlanType,
  confidence: number,
  requiresReview = confidence < 0.85
): PlanMappingSuggestion {
  return { oldPlanName, suggestedPlanType, confidence, requiresReview };
}

function isRecurringType(planType: MigrationPlanType | undefined) {
  return (
    planType === "Monthly Membership" ||
    planType === "Annual Membership" ||
    planType === "Family Add-On" ||
    planType === "Student/Discounted Plan" ||
    planType === "Legacy Plan"
  );
}

function duplicateMappedTargets(mappings: MigrationColumnMapping[]) {
  const counts = new Map<string, number>();
  for (const mapping of mappings) {
    if (!mapping.targetField || mapping.targetField === "ignore") {
      continue;
    }
    counts.set(mapping.targetField, (counts.get(mapping.targetField) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([field]) => field);
}

function publicPlanMapping(mapping: MigrationPlanMapping) {
  return {
    oldPlanName: mapping.oldPlanName,
    suggestedPlanType: mapping.suggestedPlanType,
    confidence: mapping.confidence,
    requiresReview: mapping.requiresReview
  };
}

function definedStagedPlanUpdates(input: MigrationStagedPlanUpdateInput) {
  const output: Partial<MigrationStagedMembershipPlan> = {};
  if (input.planName !== undefined) {
    output.planName = input.planName;
  }
  if (input.planType !== undefined) {
    output.planType = input.planType;
  }
  if (input.price !== undefined) {
    output.price = input.price;
  }
  if (input.billingFrequency !== undefined) {
    output.billingFrequency = input.billingFrequency;
  }
  if (input.contractLength !== undefined) {
    output.contractLength = input.contractLength;
  }
  if (input.classLimit !== undefined) {
    output.classLimit = input.classLimit;
  }
  if (input.sessionLimit !== undefined) {
    output.sessionLimit = input.sessionLimit;
  }
  if (input.active !== undefined) {
    output.active = input.active;
  }
  if (input.notes !== undefined) {
    output.notes = input.notes;
  }
  if (input.skipped !== undefined) {
    output.skipped = input.skipped;
  }
  return output;
}

function parseMoney(value: string | undefined) {
  const trimmed = value?.replace(/[$,\s]/g, "");
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseInteger(value: string | undefined) {
  const parsed = parseMoney(value);
  return parsed === undefined ? undefined : Math.trunc(parsed);
}

function parseBoolean(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (["true", "yes", "y", "active", "enabled", "1"].includes(normalized)) {
    return true;
  }
  if (["false", "no", "n", "inactive", "disabled", "0"].includes(normalized)) {
    return false;
  }
  return undefined;
}

function planTypeValue(value: unknown): MigrationPlanType | undefined {
  return typeof value === "string" && PLAN_TYPES.includes(value as MigrationPlanType)
    ? (value as MigrationPlanType)
    : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, value));
}

function canonicalText(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractOpenAiText(data: Record<string, unknown>) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }
  const output = Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }
    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return undefined;
}
