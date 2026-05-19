import { Permission } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import {
  contractWaiverTypeLabel,
  ContractWaiverType,
  type ContractWaiverDocumentView,
  type ContractWaiverType as ContractWaiverTypeValue
} from "./list.js";

export interface ContractWaiverCreateInput {
  title: string;
  type: ContractWaiverTypeValue;
  version: number;
  requiresSignature: boolean;
  publish: boolean;
}

export type ContractWaiverUpdateInput = ContractWaiverCreateInput;

export interface ContractWaiverTypeOption {
  value: ContractWaiverTypeValue;
  label: string;
  selected: boolean;
}

export interface ContractWaiverBooleanOption {
  value: boolean;
  label: string;
  selected: boolean;
}

export interface ContractWaiverEditorFields {
  title: InputModel;
  version: InputModel;
}

export interface ContractWaiverCreateScreen {
  screen: "contract_waiver_create";
  fields: ContractWaiverEditorFields;
  typeOptions: ContractWaiverTypeOption[];
  signatureOptions: ContractWaiverBooleanOption[];
  publishOptions: ContractWaiverBooleanOption[];
  selectedType?: ContractWaiverTypeValue;
  requiresSignature: boolean;
  publish: boolean;
  summaryLabel: string;
  canSubmit: boolean;
  action: ButtonModel;
  cancelAction: ButtonModel;
}

export interface ContractWaiverEditScreen {
  screen: "contract_waiver_edit";
  document: ContractWaiverDocumentView;
  fields: ContractWaiverEditorFields;
  typeOptions: ContractWaiverTypeOption[];
  signatureOptions: ContractWaiverBooleanOption[];
  publishOptions: ContractWaiverBooleanOption[];
  selectedType: ContractWaiverTypeValue;
  requiresSignature: boolean;
  publish: boolean;
  archived: boolean;
  changedFields: Array<"title" | "type" | "version" | "requiresSignature" | "publish">;
  summaryLabel: string;
  canSubmit: boolean;
  action: ButtonModel;
  cancelAction: ButtonModel;
}

export function buildContractWaiverCreateScreen(inputModel: {
  permissions: string[];
  title?: string;
  type?: ContractWaiverTypeValue;
  version?: string;
  requiresSignature?: boolean;
  publish?: boolean;
}): ContractWaiverCreateScreen {
  const canWriteDocuments = inputModel.permissions.includes(Permission.GymUpdate);
  const values = normalizeEditorValues(inputModel);
  const fields = buildEditorFields(values);
  const typeOptions = buildTypeOptions(values.type);
  const signatureOptions = buildBooleanOptions(
    values.requiresSignature,
    "Signature required",
    "Signature optional"
  );
  const publishOptions = buildBooleanOptions(values.publish, "Publish now", "Save as draft");
  const canSubmit = canSubmitEditor(values, canWriteDocuments);

  return {
    screen: "contract_waiver_create",
    fields,
    typeOptions,
    signatureOptions,
    publishOptions,
    ...(values.type ? { selectedType: values.type } : {}),
    requiresSignature: values.requiresSignature,
    publish: values.publish,
    summaryLabel: buildSummaryLabel(values),
    canSubmit,
    action: button({ label: "Create document", icon: "badge-plus", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
  };
}

export function createContractWaiverSubmission(inputModel: {
  title: string;
  type: ContractWaiverTypeValue;
  version?: string;
  requiresSignature?: boolean;
  publish?: boolean;
}): ContractWaiverCreateInput {
  const values = normalizeEditorValues(inputModel);
  return buildSubmission(values);
}

export function buildContractWaiverEditScreen(inputModel: {
  document: ContractWaiverDocumentView;
  permissions: string[];
  title?: string;
  type?: ContractWaiverTypeValue;
  version?: string;
  requiresSignature?: boolean;
  publish?: boolean;
}): ContractWaiverEditScreen {
  const canWriteDocuments = inputModel.permissions.includes(Permission.GymUpdate);
  const archived = Boolean(inputModel.document.archivedAt);
  const values = normalizeEditorValues({
    title: inputModel.title ?? inputModel.document.title,
    type: inputModel.type ?? inputModel.document.type,
    version: inputModel.version ?? String(inputModel.document.version),
    requiresSignature: inputModel.requiresSignature ?? inputModel.document.requiresSignature,
    publish: inputModel.publish ?? Boolean(inputModel.document.publishedAt)
  });
  const fields = buildEditorFields(values);
  const changedFields = changedFieldsForDocument(inputModel.document, values);
  const canSubmit = canSubmitEditor(values, canWriteDocuments) && !archived && changedFields.length > 0;

  return {
    screen: "contract_waiver_edit",
    document: inputModel.document,
    fields,
    typeOptions: buildTypeOptions(values.type),
    signatureOptions: buildBooleanOptions(
      values.requiresSignature,
      "Signature required",
      "Signature optional"
    ),
    publishOptions: buildBooleanOptions(values.publish, "Published", "Draft"),
    selectedType: values.type ?? inputModel.document.type,
    requiresSignature: values.requiresSignature,
    publish: values.publish,
    archived,
    changedFields,
    summaryLabel: buildSummaryLabel(values),
    canSubmit,
    action: button({ label: "Save document", icon: "save", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
  };
}

export function createContractWaiverEditSubmission(inputModel: {
  title: string;
  type: ContractWaiverTypeValue;
  version?: string;
  requiresSignature?: boolean;
  publish?: boolean;
}): ContractWaiverUpdateInput {
  const values = normalizeEditorValues(inputModel);
  return buildSubmission(values);
}

function buildEditorFields(values: NormalizedEditorValues): ContractWaiverEditorFields {
  return {
    title: input({
      name: "title",
      label: "Document title",
      value: values.title,
      type: "text",
      required: true,
      ...(values.title.length === 0 ? { error: "Document title is required." } : {})
    }),
    version: input({
      name: "version",
      label: "Version",
      value: values.version,
      type: "text",
      required: true,
      ...numericError(values.version, "Enter a valid version number greater than zero.")
    })
  };
}

function buildTypeOptions(selectedType: ContractWaiverTypeValue | undefined): ContractWaiverTypeOption[] {
  return Object.values(ContractWaiverType).map((type) => ({
    value: type,
    label: contractWaiverTypeLabel(type),
    selected: type === selectedType
  }));
}

function buildBooleanOptions(
  selectedValue: boolean,
  trueLabel: string,
  falseLabel: string
): ContractWaiverBooleanOption[] {
  return [
    { value: true, label: trueLabel, selected: selectedValue === true },
    { value: false, label: falseLabel, selected: selectedValue === false }
  ];
}

function numericError(value: string, message: string) {
  return value.length > 0 && parsePositiveInt(value) === undefined ? { error: message } : {};
}

function canSubmitEditor(values: NormalizedEditorValues, canWriteDocuments: boolean) {
  return Boolean(
    canWriteDocuments &&
      values.title &&
      values.type &&
      parsePositiveInt(values.version) !== undefined
  );
}

function buildSummaryLabel(values: NormalizedEditorValues) {
  const type = values.type ?? ContractWaiverType.Contract;
  const version = parsePositiveInt(values.version) ?? 1;
  const publishLabel = values.publish ? "published" : "draft";
  return `${contractWaiverTypeLabel(type)} v${version} is ${publishLabel}`;
}

function changedFieldsForDocument(
  document: ContractWaiverDocumentView,
  values: NormalizedEditorValues
): ContractWaiverEditScreen["changedFields"] {
  const fields: ContractWaiverEditScreen["changedFields"] = [];
  if (values.title !== document.title) fields.push("title");
  if (values.type !== document.type) fields.push("type");
  if ((parsePositiveInt(values.version) ?? 1) !== document.version) fields.push("version");
  if (values.requiresSignature !== document.requiresSignature) fields.push("requiresSignature");
  if (values.publish !== Boolean(document.publishedAt)) fields.push("publish");
  return fields;
}

function buildSubmission(values: NormalizedEditorValues): ContractWaiverCreateInput {
  return {
    title: values.title,
    type: values.type ?? ContractWaiverType.Contract,
    version: parsePositiveInt(values.version) ?? 1,
    requiresSignature: values.requiresSignature,
    publish: values.publish
  };
}

function normalizeEditorValues(inputModel: EditorInputValues): NormalizedEditorValues {
  return {
    title: inputModel.title?.trim() ?? "",
    type: inputModel.type,
    version: normalizeNumberString(inputModel.version, "1"),
    requiresSignature: inputModel.requiresSignature ?? true,
    publish: inputModel.publish ?? false
  };
}

function normalizeNumberString(value: string | undefined, fallback = "") {
  return value?.trim() ?? fallback;
}

function parsePositiveInt(value: string) {
  if (!/^\d+$/.test(value)) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return parsed > 0 ? parsed : undefined;
}

interface NormalizedEditorValues {
  title: string;
  type: ContractWaiverTypeValue | undefined;
  version: string;
  requiresSignature: boolean;
  publish: boolean;
}

interface EditorInputValues {
  title?: string;
  type?: ContractWaiverTypeValue;
  version?: string;
  requiresSignature?: boolean;
  publish?: boolean;
}
