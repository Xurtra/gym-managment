import {
  ConsumerRecordStatus,
  LeadStage,
  MemberStatus
} from "@gym-platform/constants";
import {
  memberCreateSchema,
  type MemberCreateInput,
  type MigrationMemberCsvImportInput
} from "@gym-platform/validation";
import { AppError, badRequest } from "../../http/errors.js";
import type { Consumer } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import { MemberService } from "../members/member.service.js";

const PREVIEW_ROW_LIMIT = 25;

const memberCsvTargetFields = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "phone",
  "barcode",
  "status",
  "leadStage",
  "notes",
  "tags",
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyContactRelationship"
] as const;

type MemberCsvTargetField = (typeof memberCsvTargetFields)[number];
type MemberCsvHeaderMapping = Partial<Record<MemberCsvTargetField, string>>;

interface MemberCsvAnalysisRow {
  rowNumber: number;
  source: Record<string, string>;
  input?: MemberCreateInput;
  valid: boolean;
  warnings: string[];
  errors: string[];
}

interface MemberCsvAnalysis {
  delimiter: "comma" | "tab";
  headers: string[];
  mapping: MemberCsvHeaderMapping;
  rows: MemberCsvAnalysisRow[];
}

interface MigrationAiMappingOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface ParsedCsvInput {
  delimiter: "comma" | "tab";
  headers: string[];
  parsedRows: string[][];
}

interface OpenAiMappingPayload {
  category?: string;
  confidence?: number;
  mapping?: Record<string, string>;
  warnings?: string[];
  notes?: string[];
}

export class MigrationImportService {
  constructor(
    private readonly repositories: Repositories,
    private readonly memberService: MemberService,
    private readonly aiMapping: MigrationAiMappingOptions = {}
  ) {}

  async previewMemberListCsv(gymId: string, input: MigrationMemberCsvImportInput) {
    const analysis = await this.analyzeMemberListCsv(gymId, input);
    return this.toPreviewResponse(analysis);
  }

  async importMemberListCsv(gymId: string, input: MigrationMemberCsvImportInput) {
    const analysis = await this.analyzeMemberListCsv(gymId, input);
    const imported: Array<{ rowNumber: number; consumer: Consumer }> = [];
    const skipped: Array<{ rowNumber: number; reason: string }> = [];

    for (const row of analysis.rows) {
      if (!row.valid || !row.input) {
        skipped.push({
          rowNumber: row.rowNumber,
          reason: row.errors[0] ?? "Row was not valid enough to import."
        });
        continue;
      }
      try {
        imported.push({
          rowNumber: row.rowNumber,
          consumer: await this.memberService.create(gymId, row.input)
        });
      } catch (error) {
        if (error instanceof AppError && error.code === "member_duplicate") {
          skipped.push({
            rowNumber: row.rowNumber,
            reason: "A consumer with this email or barcode already exists."
          });
          continue;
        }
        throw error;
      }
    }

    return {
      ...this.toPreviewResponse(analysis),
      imported,
      skipped,
      summary: {
        ...summarizeRows(analysis.rows),
        importedRows: imported.length,
        skippedRows: skipped.length
      }
    };
  }

  async suggestMemberListCsvMapping(gymId: string, input: MigrationMemberCsvImportInput) {
    const parsed = this.readCsvInput(input);
    const deterministicMapping = inferHeaderMapping(parsed.headers, input.mapping);
    const fallback = async (reason: string, extraWarnings: string[] = []) => ({
      available: false,
      provider: "deterministic" as const,
      model: this.aiMapping.model,
      category: "memberList",
      confidence: 0.5,
      mapping: deterministicMapping,
      warnings: [reason, ...extraWarnings],
      notes: ["Using the built-in mapper. Add OPENAI_API_KEY to enable AI column suggestions."],
      preview: this.toPreviewResponse(await this.analyzeMemberListCsv(gymId, { ...input, mapping: deterministicMapping }))
    });

    if (!this.aiMapping.apiKey) {
      return fallback("AI mapping is not configured.");
    }

    try {
      const aiSuggestion = await this.requestOpenAiMapping(parsed, deterministicMapping);
      const sanitized = sanitizeAiMapping(parsed.headers, aiSuggestion.mapping ?? {});
      const mapping = { ...deterministicMapping, ...sanitized.mapping };
      return {
        available: true,
        provider: "openai" as const,
        model: this.aiMapping.model ?? defaultOpenAiMigrationModel,
        category: aiSuggestion.category || "memberList",
        confidence: clampConfidence(aiSuggestion.confidence),
        mapping,
        warnings: [...(aiSuggestion.warnings ?? []), ...sanitized.warnings],
        notes: aiSuggestion.notes ?? [],
        preview: this.toPreviewResponse(await this.analyzeMemberListCsv(gymId, { ...input, mapping }))
      };
    } catch (error) {
      return fallback(`AI mapping failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  private async analyzeMemberListCsv(gymId: string, input: MigrationMemberCsvImportInput): Promise<MemberCsvAnalysis> {
    const { delimiter, headers, parsedRows } = this.readCsvInput(input);

    if (parsedRows.length < 2) {
      throw badRequest("The CSV needs a header row and at least one data row.", "migration_csv_empty");
    }

    const mapping = inferHeaderMapping(headers, input.mapping);
    const existingMembers = await this.repositories.members.listMembersForGym(gymId);
    const existingEmails = new Set(
      existingMembers
        .filter((member) => member.status !== MemberStatus.Archived && member.recordStatus !== ConsumerRecordStatus.Archived)
        .map((member) => member.email?.toLowerCase())
        .filter((email): email is string => Boolean(email))
    );
    const existingBarcodes = new Set(
      existingMembers
        .filter((member) => member.status !== MemberStatus.Archived && member.recordStatus !== ConsumerRecordStatus.Archived)
        .map((member) => member.barcode)
        .filter((barcode): barcode is string => Boolean(barcode))
    );

    const seenEmails = new Set<string>();
    const seenBarcodes = new Set<string>();
    const rows: MemberCsvAnalysisRow[] = [];

    parsedRows.slice(1).forEach((row, index) => {
      if (isBlankCsvRow(row)) {
        return;
      }
      const source = rowToSource(headers, row);
      const translated = translateMemberCsvRow(source, mapping);
      const errors = [...translated.errors];
      const warnings = [...translated.warnings];

      if (translated.input?.email) {
        const email = translated.input.email.toLowerCase();
        if (seenEmails.has(email)) {
          errors.push("Duplicate email inside this CSV.");
        } else {
          seenEmails.add(email);
        }
        if (existingEmails.has(email)) {
          errors.push("A consumer with this email already exists in this gym.");
        }
      }
      if (translated.input?.barcode) {
        if (seenBarcodes.has(translated.input.barcode)) {
          errors.push("Duplicate barcode inside this CSV.");
        } else {
          seenBarcodes.add(translated.input.barcode);
        }
        if (existingBarcodes.has(translated.input.barcode)) {
          errors.push("A consumer with this barcode already exists in this gym.");
        }
      }

      const analysisRow: MemberCsvAnalysisRow = {
        rowNumber: index + 2,
        source,
        valid: errors.length === 0 && Boolean(translated.input),
        warnings,
        errors
      };
      if (translated.input) {
        analysisRow.input = translated.input;
      }
      rows.push(analysisRow);
    });

    return { delimiter, headers, mapping, rows };
  }

  private readCsvInput(input: MigrationMemberCsvImportInput): ParsedCsvInput {
    assertCsvImportable(input.fileName, input.contentType);
    const text = decodeBase64Text(input.base64Data);
    const delimiter = resolveDelimiter(text, input.delimiter);
    const parsedRows = parseDelimitedText(text, delimiter === "tab" ? "\t" : ",");

    if (parsedRows.length < 2) {
      throw badRequest("The CSV needs a header row and at least one data row.", "migration_csv_empty");
    }

    const headerRow = parsedRows[0];
    if (!headerRow) {
      throw badRequest("The CSV header row could not be read.", "migration_csv_missing_headers");
    }
    return {
      delimiter,
      headers: headerRow.map(cleanHeaderLabel),
      parsedRows
    };
  }

  private toPreviewResponse(analysis: MemberCsvAnalysis) {
    return {
      delimiter: analysis.delimiter,
      headers: analysis.headers,
      mapping: analysis.mapping,
      rows: analysis.rows.slice(0, PREVIEW_ROW_LIMIT),
      summary: summarizeRows(analysis.rows)
    };
  }

  private async requestOpenAiMapping(
    parsed: ParsedCsvInput,
    deterministicMapping: MemberCsvHeaderMapping
  ): Promise<OpenAiMappingPayload> {
    const fetchImpl = this.aiMapping.fetchImpl ?? fetch;
    const baseUrl = (this.aiMapping.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const sampleRows = parsed.parsedRows
      .slice(1)
      .filter((row) => !isBlankCsvRow(row))
      .slice(0, 12)
      .map((row) => truncateSourceValues(rowToSource(parsed.headers, row)));

    const response = await fetchImpl(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.aiMapping.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.aiMapping.model ?? defaultOpenAiMigrationModel,
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text: [
                  "You map messy gym software member-list CSV exports into this product's migration schema.",
                  "Return only the requested JSON shape.",
                  "Use exact input header names as mapping values.",
                  "Use an empty string when a target field is not present.",
                  "Do not invent columns. Prefer fullName only when separate first/last name columns are not present.",
                  "Membership plans, billing dates, and payment status are not member profile fields; mention them in warnings."
                ].join(" ")
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  targetCategory: "memberList",
                  targetFields: memberCsvTargetFields,
                  allowedHeaders: parsed.headers,
                  deterministicMapping,
                  sampleRows
                })
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "migration_member_csv_mapping",
            strict: true,
            schema: openAiMappingJsonSchema
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
      throw new Error("OpenAI returned no mapping text.");
    }
    return JSON.parse(text) as OpenAiMappingPayload;
  }
}

const defaultOpenAiMigrationModel = "gpt-4o-mini";

const openAiMappingJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: { type: "string" },
    confidence: { type: "number" },
    mapping: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(memberCsvTargetFields.map((field) => [field, { type: "string" }])) as Record<
        MemberCsvTargetField,
        { type: "string" }
      >,
      required: [...memberCsvTargetFields]
    },
    warnings: {
      type: "array",
      items: { type: "string" }
    },
    notes: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["category", "confidence", "mapping", "warnings", "notes"]
} as const;

function sanitizeAiMapping(headers: string[], rawMapping: Record<string, string>) {
  const mapping: MemberCsvHeaderMapping = {};
  const warnings: string[] = [];
  for (const field of memberCsvTargetFields) {
    const suggestedHeader = rawMapping[field]?.trim();
    if (!suggestedHeader) {
      continue;
    }
    const exact = headers.find((header) => header === suggestedHeader);
    const normalized = headers.find((header) => normalizeHeaderKey(header) === normalizeHeaderKey(suggestedHeader));
    const matchedHeader = exact ?? normalized;
    if (matchedHeader) {
      mapping[field] = matchedHeader;
    } else {
      warnings.push(`AI suggested ${suggestedHeader} for ${field}, but that column is not in the CSV.`);
    }
  }
  return { mapping, warnings };
}

function truncateSourceValues(source: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value.length > 140 ? `${value.slice(0, 137)}...` : value])
  );
}

function clampConfidence(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, value));
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

function assertCsvImportable(fileName: string, contentType?: string) {
  const lowerName = fileName.toLowerCase();
  const lowerType = (contentType ?? "").toLowerCase();
  const isCsvLike =
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".tsv") ||
    lowerName.endsWith(".txt") ||
    lowerType.includes("csv") ||
    lowerType.includes("tab-separated") ||
    lowerType.includes("text/plain");

  if (!isCsvLike) {
    throw badRequest(
      "This interpreter can read CSV, TSV, or plain text exports. Save Excel/PDF files as source docs, or export them to CSV before importing.",
      "migration_csv_unsupported_type"
    );
  }
}

function decodeBase64Text(base64Data: string) {
  const text = Buffer.from(base64Data, "base64").toString("utf8").replace(/^\uFEFF/, "");
  if (!text.trim()) {
    throw badRequest("The uploaded CSV file is empty.", "migration_csv_empty");
  }
  const nulCount = (text.match(/\u0000/g) ?? []).length;
  if (nulCount > 0) {
    throw badRequest(
      "This looks like a binary spreadsheet file. Export it as CSV before importing.",
      "migration_csv_binary_file"
    );
  }
  return text;
}

function resolveDelimiter(text: string, delimiter: MigrationMemberCsvImportInput["delimiter"]) {
  if (delimiter === "comma") {
    return "comma" as const;
  }
  if (delimiter === "tab") {
    return "tab" as const;
  }
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return countOccurrences(firstLine, "\t") > countOccurrences(firstLine, ",") ? "tab" as const : "comma" as const;
}

function countOccurrences(value: string, character: string) {
  return [...value].filter((candidate) => candidate === character).length;
}

function parseDelimitedText(text: string, delimiter: "," | "\t") {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === undefined) {
      continue;
    }

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
      row.push(field);
      field = "";
      continue;
    }
    if (character === "\r" || character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      continue;
    }
    field += character;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function cleanHeaderLabel(value: string, index: number) {
  const label = value.replace(/^\uFEFF/, "").trim();
  return label || `Column ${index + 1}`;
}

function rowToSource(headers: string[], row: string[]) {
  return headers.reduce<Record<string, string>>((source, header, index) => {
    source[header] = normalizeCell(row[index]);
    return source;
  }, {});
}

function isBlankCsvRow(row: string[]) {
  return row.every((cell) => normalizeCell(cell).length === 0);
}

function normalizeCell(value: string | undefined) {
  return (value ?? "").trim();
}

function inferHeaderMapping(headers: string[], explicit?: MigrationMemberCsvImportInput["mapping"]): MemberCsvHeaderMapping {
  const normalizedHeaderByActual = new Map(headers.map((header) => [header, normalizeHeaderKey(header)]));
  const mapping: MemberCsvHeaderMapping = {};

  for (const field of memberCsvTargetFields) {
    const explicitHeader = explicit?.[field];
    if (explicitHeader) {
      const exact = headers.find((header) => header === explicitHeader);
      const normalized = headers.find((header) => normalizeHeaderKey(header) === normalizeHeaderKey(explicitHeader));
      const matchedHeader = exact ?? normalized;
      if (matchedHeader) {
        mapping[field] = matchedHeader;
        continue;
      }
    }

    const aliases = fieldAliases[field];
    const header = headers.find((candidate) => aliases.includes(normalizedHeaderByActual.get(candidate) ?? ""));
    if (header) {
      mapping[field] = header;
    }
  }

  return mapping;
}

const fieldAliases: Record<MemberCsvTargetField, string[]> = {
  firstName: ["firstname", "first", "givenname", "clientfirstname", "memberfirstname", "fname"],
  lastName: ["lastname", "last", "surname", "familyname", "clientlastname", "memberlastname", "lname"],
  fullName: ["name", "fullname", "membername", "clientname", "customername", "contactname"],
  email: ["email", "emailaddress", "primaryemail", "clientemail", "memberemail", "e mail"],
  phone: ["phone", "phonenumber", "mobile", "mobilephone", "cell", "cellphone", "primaryphone", "clientphone"],
  barcode: ["barcode", "barcodenumber", "keytag", "keytagid", "scanid", "memberid", "clientid", "customerid", "id"],
  status: ["status", "memberstatus", "accountstatus", "clientstatus", "membershipstatus"],
  leadStage: ["leadstage", "leadstatus", "prospectstatus"],
  notes: ["notes", "note", "comments", "comment", "memo", "internalnotes"],
  tags: ["tags", "tag", "labels", "groups"],
  emergencyContactName: ["emergencycontact", "emergencycontactname", "emergencyname"],
  emergencyContactPhone: ["emergencyphone", "emergencycontactphone", "emergencycontactnumber"],
  emergencyContactRelationship: ["emergencyrelationship", "emergencycontactrelationship", "relationship"]
};

function normalizeHeaderKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function translateMemberCsvRow(source: Record<string, string>, mapping: MemberCsvHeaderMapping) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const fullName = optionalValue(source, mapping.fullName);
  const nameParts = splitFullName(fullName);
  const firstName = optionalValue(source, mapping.firstName) ?? nameParts?.firstName;
  const lastName = optionalValue(source, mapping.lastName) ?? nameParts?.lastName;

  if (!firstName || !lastName) {
    errors.push("First name and last name are required. Map a full name column or separate first/last columns.");
  }

  const statusResult = mapMemberStatus(optionalValue(source, mapping.status));
  warnings.push(...statusResult.warnings);
  const leadStage = mapLeadStage(optionalValue(source, mapping.leadStage));
  const emergencyContactName = optionalValue(source, mapping.emergencyContactName);
  const emergencyContactPhone = optionalValue(source, mapping.emergencyContactPhone);
  const emergencyContactRelationship = optionalValue(source, mapping.emergencyContactRelationship);

  const draft: MemberCreateInput = {
    firstName: firstName ?? "",
    lastName: lastName ?? "",
    status: statusResult.status,
    tagNames: splitDelimitedList(optionalValue(source, mapping.tags))
  };

  assignOptional(draft, "email", optionalValue(source, mapping.email)?.toLowerCase());
  assignOptional(draft, "phone", optionalValue(source, mapping.phone));
  assignOptional(draft, "barcode", optionalValue(source, mapping.barcode));
  assignOptional(draft, "notes", optionalValue(source, mapping.notes));
  if (leadStage) {
    draft.leadStage = leadStage;
  } else if (statusResult.status === MemberStatus.Lead) {
    draft.leadStage = LeadStage.Open;
  }

  if (emergencyContactName || emergencyContactPhone) {
    if (emergencyContactName && emergencyContactPhone) {
      draft.emergencyContact = {
        name: emergencyContactName,
        phone: emergencyContactPhone
      };
      if (emergencyContactRelationship) {
        draft.emergencyContact.relationship = emergencyContactRelationship;
      }
    } else {
      warnings.push("Emergency contact was skipped because it needs both a name and phone number.");
    }
  }

  const parsed = memberCreateSchema.safeParse(draft);
  if (!parsed.success) {
    errors.push(...parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
    return { input: undefined, warnings, errors };
  }

  return { input: parsed.data, warnings, errors };
}

function optionalValue(source: Record<string, string>, header: string | undefined) {
  if (!header) {
    return undefined;
  }
  const value = source[header]?.trim();
  return value ? value : undefined;
}

function splitFullName(fullName: string | undefined) {
  if (!fullName) {
    return undefined;
  }
  const normalized = fullName.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }
  if (normalized.includes(",")) {
    const [last, first] = normalized.split(",", 2).map((part) => part.trim());
    if (first && last) {
      return { firstName: first, lastName: last };
    }
  }
  const parts = normalized.split(" ");
  const firstName = parts.shift();
  const lastName = parts.join(" ");
  if (!firstName || !lastName) {
    return undefined;
  }
  return { firstName, lastName };
}

function mapMemberStatus(value: string | undefined): { status: MemberStatus; warnings: string[] } {
  if (!value) {
    return { status: MemberStatus.Active, warnings: [] };
  }
  const normalized = normalizeHeaderKey(value);
  if (["lead", "prospect", "inquiry", "interested"].some((token) => normalized.includes(token))) {
    return { status: MemberStatus.Lead, warnings: [] };
  }
  if (normalized.includes("trial")) {
    return { status: MemberStatus.Trial, warnings: [] };
  }
  if (["pastdue", "overdue", "delinquent", "failedpayment", "failed"].some((token) => normalized.includes(token))) {
    return { status: MemberStatus.PastDue, warnings: [] };
  }
  if (["frozen", "freeze", "paused", "hold"].some((token) => normalized.includes(token))) {
    return { status: MemberStatus.Frozen, warnings: [] };
  }
  if (["cancelled", "canceled", "cancel"].some((token) => normalized.includes(token))) {
    return { status: MemberStatus.Cancelled, warnings: [] };
  }
  if (normalized.includes("expired")) {
    return { status: MemberStatus.Expired, warnings: [] };
  }
  if (["archived", "deleted", "removed"].some((token) => normalized.includes(token))) {
    return {
      status: MemberStatus.Cancelled,
      warnings: [`Status "${value}" was imported as cancelled so the consumer remains visible after migration.`]
    };
  }
  if (["active", "current", "ok", "goodstanding"].some((token) => normalized.includes(token))) {
    return { status: MemberStatus.Active, warnings: [] };
  }
  return {
    status: MemberStatus.Active,
    warnings: [`Unrecognized status "${value}" was imported as active.`]
  };
}

function mapLeadStage(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const normalized = normalizeHeaderKey(value);
  if (["open", "new", "contact", "followup", "prospect"].some((token) => normalized.includes(token))) {
    return LeadStage.Open;
  }
  if (["converted", "won", "joined"].some((token) => normalized.includes(token))) {
    return LeadStage.Converted;
  }
  if (["closed", "lost", "notinterested"].some((token) => normalized.includes(token))) {
    return LeadStage.Closed;
  }
  if (["none", "member"].some((token) => normalized.includes(token))) {
    return LeadStage.None;
  }
  return undefined;
}

function splitDelimitedList(value: string | undefined) {
  if (!value) {
    return [];
  }
  return value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function assignOptional<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, value: T[K] | undefined) {
  if (value !== undefined) {
    target[key] = value;
  }
}

function summarizeRows(rows: MemberCsvAnalysisRow[]) {
  const validRows = rows.filter((row) => row.valid).length;
  return {
    totalRows: rows.length,
    validRows,
    skippedRows: rows.length - validRows,
    warningRows: rows.filter((row) => row.warnings.length > 0).length,
    previewedRows: Math.min(rows.length, PREVIEW_ROW_LIMIT)
  };
}
