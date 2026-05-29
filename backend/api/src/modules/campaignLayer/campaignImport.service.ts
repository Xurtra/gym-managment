import type {
  CampaignCsvConfirmInput,
  CampaignCsvPreviewInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { badRequest } from "../../http/errors.js";
import type {
  CampaignImportBatch,
  CampaignImportRecord,
  CampaignImportType,
  CampaignImportValidationStatus
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

const maxCampaignImportBytes = 10 * 1024 * 1024;
const previewRowLimit = 10;

interface TargetField {
  field: string;
  label: string;
  description: string;
  required?: boolean;
  aliases: string[];
}

interface ParsedCampaignCsv {
  delimiter: "comma" | "tab";
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, string>[];
  rows: Array<{ rowNumber: number; source: Record<string, string> }>;
}

interface ImportIssue {
  severity: "warning" | "critical";
  message: string;
}

export class CampaignImportService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async listImports(gymId: string) {
    const imports = await this.repositories.campaignImports.listBatchesForGym(gymId);
    return { imports };
  }

  async previewCsv(gymId: string, input: CampaignCsvPreviewInput) {
    void gymId;
    const parsed = parseCampaignCsv(input);
    const expectedFields = campaignExpectedFields[input.importType];
    return {
      importType: input.importType,
      fileName: sanitizeFilename(input.fileName),
      delimiter: parsed.delimiter,
      headers: parsed.headers,
      rowCount: parsed.rowCount,
      sampleRows: parsed.sampleRows,
      expectedFields: expectedFields.map(({ aliases, ...field }) => field),
      targetFields: ["ignore", ...expectedFields.map((field) => field.field)],
      suggestedMappings: suggestMappings(parsed.headers, parsed.sampleRows, expectedFields)
    };
  }

  async confirmCsv(gymId: string, userId: string, input: CampaignCsvConfirmInput) {
    const parsed = parseCampaignCsv(input);
    const expectedFields = campaignExpectedFields[input.importType];
    const mappings = normalizeMappings(input.mappings, parsed.headers, expectedFields);
    const now = this.clock.now();
    const batchId = randomUUID();
    const records: CampaignImportRecord[] = [];

    for (const row of parsed.rows) {
      const normalized = normalizeCampaignRow(input.importType, row.source, mappings);
      const issues = validateCampaignRow(input.importType, normalized);
      const validationStatus = statusFromIssues(issues);
      records.push({
        id: randomUUID(),
        campaignImportBatchId: batchId,
        gymId,
        importType: input.importType,
        sourceRowNumber: row.rowNumber,
        sourceRowJson: row.source,
        normalizedJson: normalized,
        validationStatus,
        errorsJson: issues.map((issue) => `${issue.severity}: ${issue.message}`),
        createdAt: now
      });
    }

    if (records.length === 0) {
      throw badRequest("The CSV did not contain any importable rows.", "campaign_import_empty");
    }

    const importedCount = records.filter((record) => record.validationStatus !== "critical").length;
    const errorCount = records.filter((record) => record.validationStatus === "critical").length;
    const warningCount = records.filter((record) => record.validationStatus === "warning").length;
    const skippedCount = errorCount;
    const summary = {
      importType: input.importType,
      rowsImported: importedCount,
      rowsSkipped: skippedCount,
      rowsWithWarnings: warningCount,
      rowsWithErrors: errorCount,
      totalRows: parsed.rowCount
    };
    const batch: CampaignImportBatch = {
      id: batchId,
      gymId,
      importType: input.importType,
      originalFilename: sanitizeFilename(input.fileName),
      rowCount: parsed.rowCount,
      importedCount,
      skippedCount,
      errorCount,
      mappingsJson: mappings,
      sampleRowsJson: parsed.sampleRows,
      summaryJson: summary,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now
    };

    const createdBatch = await this.repositories.campaignImports.createBatch(batch);
    const createdRecords = await this.repositories.campaignImports.createRecords(records);
    return {
      batch: createdBatch,
      records: createdRecords.slice(0, 50),
      summary
    };
  }
}

const campaignExpectedFields: Record<CampaignImportType, TargetField[]> = {
  clients: [
    {
      field: "first_name",
      label: "First name",
      description: "Client or member first name.",
      aliases: ["firstname", "first", "givenname", "clientfirstname", "memberfirstname"]
    },
    {
      field: "last_name",
      label: "Last name",
      description: "Client or member last name.",
      aliases: ["lastname", "last", "surname", "familyname", "clientlastname", "memberlastname"]
    },
    {
      field: "full_name",
      label: "Full name",
      description: "Use when the export has one name column.",
      required: true,
      aliases: ["name", "fullname", "clientname", "membername", "customername"]
    },
    {
      field: "email",
      label: "Email",
      description: "Primary email address for matching and messaging.",
      aliases: ["email", "emailaddress", "primaryemail", "clientemail", "memberemail"]
    },
    {
      field: "phone",
      label: "Phone",
      description: "Primary phone number.",
      aliases: ["phone", "phonenumber", "mobile", "cell", "cellphone", "primaryphone"]
    },
    {
      field: "status",
      label: "Status",
      description: "Lead, customer, member, active, inactive, or cancelled.",
      aliases: ["status", "clientstatus", "memberstatus", "accountstatus"]
    },
    {
      field: "membership_name",
      label: "Membership name",
      description: "Current plan, package, or membership label.",
      aliases: ["membership", "membershipname", "plan", "planname", "package", "packagename"]
    },
    {
      field: "source",
      label: "Source",
      description: "Lead source or acquisition channel.",
      aliases: ["source", "leadsource", "origin", "campaign"]
    },
    {
      field: "notes",
      label: "Notes",
      description: "Internal notes from the old system.",
      aliases: ["notes", "note", "comments", "comment", "memo"]
    },
    {
      field: "tags",
      label: "Tags",
      description: "Comma separated groups, tags, or labels.",
      aliases: ["tags", "tag", "labels", "groups"]
    }
  ],
  bookings: [
    {
      field: "client_email",
      label: "Client email",
      description: "Email of the booked client.",
      aliases: ["clientemail", "memberemail", "customeremail", "email"]
    },
    {
      field: "client_name",
      label: "Client name",
      description: "Name of the booked client.",
      aliases: ["clientname", "membername", "customername", "name"]
    },
    {
      field: "service_name",
      label: "Service name",
      description: "Class, appointment, session, or booking type.",
      required: true,
      aliases: ["service", "servicename", "class", "classname", "appointment", "bookingtype"]
    },
    {
      field: "booking_date",
      label: "Booking date",
      description: "Date of the booking.",
      required: true,
      aliases: ["date", "bookingdate", "startdate", "scheduleddate"]
    },
    {
      field: "start_time",
      label: "Start time",
      description: "Start time or start datetime.",
      aliases: ["start", "starttime", "starts", "startdatetime", "time"]
    },
    {
      field: "end_time",
      label: "End time",
      description: "End time or end datetime.",
      aliases: ["end", "endtime", "ends", "enddatetime"]
    },
    {
      field: "status",
      label: "Status",
      description: "Booked, cancelled, attended, no-show, or waitlisted.",
      aliases: ["status", "bookingstatus", "attendance", "attended"]
    },
    {
      field: "room_name",
      label: "Room",
      description: "Room or resource used for the booking.",
      aliases: ["room", "roomname", "resource", "resourceName"]
    },
    {
      field: "staff_name",
      label: "Staff",
      description: "Trainer, instructor, or staff member assigned.",
      aliases: ["staff", "staffname", "trainer", "instructor", "coach"]
    },
    {
      field: "notes",
      label: "Notes",
      description: "Booking notes.",
      aliases: ["notes", "note", "comments", "comment"]
    }
  ],
  services: [
    {
      field: "service_name",
      label: "Service name",
      description: "Name of the service or sellable item.",
      required: true,
      aliases: ["service", "servicename", "name", "item", "itemname", "product"]
    },
    {
      field: "description",
      label: "Description",
      description: "Public or internal service description.",
      aliases: ["description", "desc", "details"]
    },
    {
      field: "price",
      label: "Price",
      description: "Service price.",
      aliases: ["price", "amount", "cost", "rate"]
    },
    {
      field: "duration_minutes",
      label: "Duration minutes",
      description: "Default duration in minutes.",
      aliases: ["duration", "durationminutes", "minutes", "length"]
    },
    {
      field: "capacity",
      label: "Capacity",
      description: "How many people can book it.",
      aliases: ["capacity", "spots", "maxclients", "maxattendees"]
    },
    {
      field: "category",
      label: "Category",
      description: "Class, training, retail, swim lesson, or other grouping.",
      aliases: ["category", "type", "servicetype"]
    },
    {
      field: "active",
      label: "Active",
      description: "Whether the service is active.",
      aliases: ["active", "enabled", "visible", "status"]
    }
  ],
  memberships_packages: [
    {
      field: "package_name",
      label: "Membership/package name",
      description: "Name of the plan, membership, pack, or package.",
      required: true,
      aliases: ["name", "plan", "planname", "membership", "membershipname", "package", "packagename"]
    },
    {
      field: "plan_type",
      label: "Plan type",
      description: "Monthly, annual, class pack, training package, trial, or drop-in.",
      aliases: ["type", "plantype", "billingtype", "membershiptype"]
    },
    {
      field: "price",
      label: "Price",
      description: "Plan or package price.",
      aliases: ["price", "amount", "cost", "dues"]
    },
    {
      field: "billing_frequency",
      label: "Billing frequency",
      description: "Monthly, annual, weekly, one-time, or package.",
      aliases: ["billing", "billingfrequency", "billingcycle", "frequency", "interval"]
    },
    {
      field: "sessions_included",
      label: "Sessions included",
      description: "Number of sessions, credits, or visits included.",
      aliases: ["sessions", "credits", "visits", "classes", "sessionsincluded"]
    },
    {
      field: "contract_length",
      label: "Contract length",
      description: "Contract length or commitment term.",
      aliases: ["contract", "contractlength", "term", "commitment"]
    },
    {
      field: "active",
      label: "Active",
      description: "Whether the plan is active.",
      aliases: ["active", "enabled", "status"]
    },
    {
      field: "notes",
      label: "Notes",
      description: "Plan notes or restrictions.",
      aliases: ["notes", "note", "comments", "restrictions"]
    }
  ],
  payments: [
    {
      field: "client_email",
      label: "Client email",
      description: "Email used to match the payer.",
      aliases: ["clientemail", "memberemail", "customeremail", "email"]
    },
    {
      field: "client_name",
      label: "Client name",
      description: "Name of the payer.",
      aliases: ["clientname", "membername", "customername", "name"]
    },
    {
      field: "amount",
      label: "Amount",
      description: "Payment amount.",
      required: true,
      aliases: ["amount", "total", "paid", "payment", "price"]
    },
    {
      field: "payment_date",
      label: "Payment date",
      description: "Date the payment was collected or attempted.",
      aliases: ["date", "paymentdate", "paiddate", "transactiondate"]
    },
    {
      field: "payment_method",
      label: "Payment method",
      description: "Card, cash, ACH, comp, or other method.",
      aliases: ["method", "paymentmethod", "tender", "processor"]
    },
    {
      field: "status",
      label: "Status",
      description: "Paid, failed, refunded, pending, or overdue.",
      aliases: ["status", "paymentstatus", "state"]
    },
    {
      field: "reference",
      label: "Reference",
      description: "Receipt, invoice, or transaction id.",
      aliases: ["reference", "receipt", "receiptid", "invoice", "transactionid", "id"]
    },
    {
      field: "description",
      label: "Description",
      description: "What the payment was for.",
      aliases: ["description", "memo", "note", "item", "product"]
    }
  ],
  rooms_devices: [
    {
      field: "name",
      label: "Name",
      description: "Room, court, lane, station, or device name.",
      required: true,
      aliases: ["name", "room", "roomname", "device", "devicename", "resource"]
    },
    {
      field: "resource_type",
      label: "Resource type",
      description: "Room, device, court, lane, door, kiosk, or station.",
      aliases: ["type", "resourcetype", "devicetype", "category"]
    },
    {
      field: "location",
      label: "Location",
      description: "Gym location or area where it belongs.",
      aliases: ["location", "site", "facility", "area"]
    },
    {
      field: "capacity",
      label: "Capacity",
      description: "How many people can use it.",
      aliases: ["capacity", "spots", "people"]
    },
    {
      field: "active",
      label: "Active",
      description: "Whether it is currently active.",
      aliases: ["active", "enabled", "status"]
    },
    {
      field: "bookable",
      label: "Bookable",
      description: "Whether clients can reserve it.",
      aliases: ["bookable", "reservable", "rentable", "available"]
    },
    {
      field: "notes",
      label: "Notes",
      description: "Internal setup notes.",
      aliases: ["notes", "note", "comments", "description"]
    }
  ]
};

function parseCampaignCsv(input: CampaignCsvPreviewInput): ParsedCampaignCsv {
  assertCsvImportable(input.fileName, input.contentType);
  const bytes = Buffer.from(input.base64Data, "base64");
  if (bytes.byteLength === 0) {
    throw badRequest("The uploaded CSV file is empty.", "campaign_import_empty");
  }
  if (bytes.byteLength > maxCampaignImportBytes) {
    throw badRequest("CSV imports must be 10 MB or smaller.", "campaign_import_file_too_large");
  }
  const text = bytes.toString("utf8").replace(/^\uFEFF/, "");
  if (!text.trim()) {
    throw badRequest("The uploaded CSV file is empty.", "campaign_import_empty");
  }
  if (text.includes("\u0000")) {
    throw badRequest("This looks like a binary spreadsheet. Export it as CSV first.", "campaign_import_binary_file");
  }
  const delimiter = resolveDelimiter(text, input.delimiter);
  const rows = parseDelimitedText(text, delimiter === "tab" ? "\t" : ",");
  if (rows.length < 2) {
    throw badRequest("The CSV needs a header row and at least one data row.", "campaign_import_missing_rows");
  }
  const headerRow = rows[0];
  if (!headerRow) {
    throw badRequest("The CSV header row could not be read.", "campaign_import_missing_headers");
  }
  const headers = uniqueHeaders(headerRow.map(cleanHeaderLabel));
  const parsedRows = rows.slice(1).flatMap((row, index) => {
    if (isBlankCsvRow(row)) {
      return [];
    }
    return [{ rowNumber: index + 2, source: rowToSource(headers, row) }];
  });
  return {
    delimiter,
    headers,
    rowCount: parsedRows.length,
    sampleRows: parsedRows.slice(0, previewRowLimit).map((row) => row.source),
    rows: parsedRows
  };
}

function assertCsvImportable(fileName: string, contentType?: string) {
  const lowerName = fileName.toLowerCase();
  const lowerType = (contentType ?? "").toLowerCase();
  const isCsvLike =
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".tsv") ||
    lowerType.includes("csv") ||
    lowerType.includes("tab-separated");
  if (!isCsvLike) {
    throw badRequest("Campaign imports accept CSV or TSV files only.", "campaign_import_unsupported_type");
  }
}

function resolveDelimiter(text: string, delimiter: CampaignCsvPreviewInput["delimiter"]) {
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

function uniqueHeaders(headers: string[]) {
  const counts = new Map<string, number>();
  return headers.map((header) => {
    const count = counts.get(header) ?? 0;
    counts.set(header, count + 1);
    return count === 0 ? header : `${header} (${count + 1})`;
  });
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

function suggestMappings(headers: string[], sampleRows: Record<string, string>[], fields: TargetField[]) {
  return headers.map((header) => {
    const normalizedHeader = normalizeKey(header);
    const field = fields.find((candidate) => candidate.aliases.includes(normalizedHeader));
    return {
      sourceColumn: header,
      targetField: field?.field ?? "ignore",
      confidence: field ? 0.86 : 0.35,
      sampleValues: uniqueValues(
        sampleRows.map((row) => row[header]).filter((value): value is string => Boolean(value))
      ).slice(0, 3)
    };
  });
}

function normalizeMappings(
  rawMappings: CampaignCsvConfirmInput["mappings"],
  headers: string[],
  fields: TargetField[]
) {
  const allowedTargetFields = new Set(["ignore", ...fields.map((field) => field.field)]);
  const mappings: Record<string, string> = {};
  const usedTargets = new Set<string>();
  for (const mapping of rawMappings) {
    if (!headers.includes(mapping.sourceColumn)) {
      throw badRequest(`Column "${mapping.sourceColumn}" is not in the uploaded CSV.`, "campaign_import_unknown_column");
    }
    if (!allowedTargetFields.has(mapping.targetField)) {
      throw badRequest(`Target field "${mapping.targetField}" is not valid for this import type.`, "campaign_import_unknown_target");
    }
    if (mapping.targetField !== "ignore") {
      if (usedTargets.has(mapping.targetField)) {
        throw badRequest(`Target field "${mapping.targetField}" can only be mapped once.`, "campaign_import_duplicate_mapping");
      }
      usedTargets.add(mapping.targetField);
    }
    mappings[mapping.sourceColumn] = mapping.targetField;
  }
  return mappings;
}

function normalizeCampaignRow(
  importType: CampaignImportType,
  source: Record<string, string>,
  mappings: Record<string, string>
) {
  const normalized: Record<string, unknown> = {};
  for (const [sourceColumn, targetField] of Object.entries(mappings)) {
    if (targetField === "ignore") {
      continue;
    }
    const value = source[sourceColumn]?.trim();
    if (value) {
      normalized[targetField] = value;
    }
  }

  if (typeof normalized.email === "string") {
    normalized.email = normalized.email.toLowerCase();
  }
  if (typeof normalized.client_email === "string") {
    normalized.client_email = normalized.client_email.toLowerCase();
  }
  if (typeof normalized.full_name === "string") {
    const split = splitFullName(normalized.full_name);
    if (!normalized.first_name && split.firstName) {
      normalized.first_name = split.firstName;
    }
    if (!normalized.last_name && split.lastName) {
      normalized.last_name = split.lastName;
    }
  }
  if (typeof normalized.tags === "string") {
    normalized.tags = splitDelimitedList(normalized.tags);
  }
  if (typeof normalized.price === "string") {
    normalized.price = normalizeNumber(normalized.price);
  }
  if (typeof normalized.amount === "string") {
    normalized.amount = normalizeNumber(normalized.amount);
  }
  for (const integerField of ["duration_minutes", "capacity", "sessions_included"]) {
    if (typeof normalized[integerField] === "string") {
      normalized[integerField] = normalizeInteger(normalized[integerField]);
    }
  }
  for (const booleanField of ["active", "bookable"]) {
    if (typeof normalized[booleanField] === "string") {
      normalized[booleanField] = normalizeBoolean(normalized[booleanField]);
    }
  }
  for (const dateField of ["booking_date", "payment_date"]) {
    if (typeof normalized[dateField] === "string") {
      normalized[dateField] = normalizeDateString(normalized[dateField]);
    }
  }
  normalized.import_category = importType;
  return normalized;
}

function validateCampaignRow(importType: CampaignImportType, normalized: Record<string, unknown>) {
  const issues: ImportIssue[] = [];
  if (importType === "clients") {
    const hasName = Boolean(normalized.full_name || (normalized.first_name && normalized.last_name));
    if (!hasName) {
      issues.push({ severity: "critical", message: "Client needs a full name or first and last name." });
    }
    if (typeof normalized.email === "string" && !isValidEmail(normalized.email)) {
      issues.push({ severity: "critical", message: "Email is not valid." });
    }
    if (!normalized.email && !normalized.phone) {
      issues.push({ severity: "warning", message: "No email or phone is mapped, so outreach matching will be limited." });
    }
    if (!normalized.status) {
      issues.push({ severity: "warning", message: "No client status is mapped." });
    }
  }
  if (importType === "bookings") {
    if (!normalized.client_email && !normalized.client_name) {
      issues.push({ severity: "critical", message: "Booking needs a client email or client name." });
    }
    if (typeof normalized.client_email === "string" && !isValidEmail(normalized.client_email)) {
      issues.push({ severity: "critical", message: "Client email is not valid." });
    }
    requireField(normalized, "service_name", "Booking needs a service name.", issues);
    requireField(normalized, "booking_date", "Booking needs a date.", issues);
    if (!normalized.start_time) {
      issues.push({ severity: "warning", message: "No start time is mapped." });
    }
  }
  if (importType === "services") {
    requireField(normalized, "service_name", "Service needs a name.", issues);
    validateOptionalNumber(normalized, "price", "Price must be numeric.", issues);
    validateOptionalNumber(normalized, "duration_minutes", "Duration must be a whole number.", issues);
    validateOptionalNumber(normalized, "capacity", "Capacity must be a whole number.", issues);
  }
  if (importType === "memberships_packages") {
    requireField(normalized, "package_name", "Membership or package needs a name.", issues);
    validateOptionalNumber(normalized, "price", "Price must be numeric.", issues);
    validateOptionalNumber(normalized, "sessions_included", "Sessions included must be numeric.", issues);
    if (!normalized.billing_frequency && String(normalized.plan_type ?? "").toLowerCase().includes("month")) {
      issues.push({ severity: "warning", message: "Monthly-looking plan has no billing frequency." });
    }
  }
  if (importType === "payments") {
    validateOptionalEmail(normalized, "client_email", issues);
    requireField(normalized, "amount", "Payment needs an amount.", issues);
    validateOptionalNumber(normalized, "amount", "Amount must be numeric.", issues);
    if (!normalized.client_email && !normalized.client_name) {
      issues.push({ severity: "warning", message: "No payer identifier is mapped." });
    }
    if (!normalized.payment_date) {
      issues.push({ severity: "warning", message: "No payment date is mapped." });
    }
  }
  if (importType === "rooms_devices") {
    requireField(normalized, "name", "Room or device needs a name.", issues);
    validateOptionalNumber(normalized, "capacity", "Capacity must be numeric.", issues);
    if (!normalized.resource_type) {
      issues.push({ severity: "warning", message: "No resource type is mapped." });
    }
  }
  return issues;
}

function requireField(
  normalized: Record<string, unknown>,
  field: string,
  message: string,
  issues: ImportIssue[]
) {
  if (!normalized[field] && normalized[field] !== 0) {
    issues.push({ severity: "critical", message });
  }
}

function validateOptionalEmail(normalized: Record<string, unknown>, field: string, issues: ImportIssue[]) {
  const value = normalized[field];
  if (typeof value === "string" && value && !isValidEmail(value)) {
    issues.push({ severity: "critical", message: `${field.replaceAll("_", " ")} is not valid.` });
  }
}

function validateOptionalNumber(
  normalized: Record<string, unknown>,
  field: string,
  message: string,
  issues: ImportIssue[]
) {
  if (normalized[field] !== undefined && typeof normalized[field] !== "number") {
    issues.push({ severity: "critical", message });
  }
}

function statusFromIssues(issues: ImportIssue[]): CampaignImportValidationStatus {
  if (issues.some((issue) => issue.severity === "critical")) {
    return "critical";
  }
  if (issues.some((issue) => issue.severity === "warning")) {
    return "warning";
  }
  return "ready";
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function splitFullName(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return {};
  }
  if (parts.length === 1) {
    return { firstName: parts[0] };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1]
  };
}

function splitDelimitedList(value: string) {
  return value
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeNumber(value: string) {
  const normalized = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(normalized) ? normalized : value;
}

function normalizeInteger(value: string) {
  const normalized = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(normalized) ? normalized : value;
}

function normalizeBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "y", "1", "active", "enabled", "bookable"].includes(normalized)) {
    return true;
  }
  if (["false", "no", "n", "0", "inactive", "disabled", "archived"].includes(normalized)) {
    return false;
  }
  return value;
}

function normalizeDateString(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeFilename(value: string) {
  return value.replace(/[^\w.\- ()]/g, "_").slice(0, 180);
}
