import { BillingInterval, Permission, PlanStatus } from "@gym-platform/constants";
import type {
  MembershipPlanCreateInput,
  MembershipPlanUpdateInput
} from "@gym-platform/validation";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import {
  billingIntervalLabel,
  buildPriceLabel,
  type MembershipPlanView
} from "./list.js";

export interface MembershipPlanIntervalOption {
  value: BillingInterval;
  label: string;
  selected: boolean;
}

export interface MembershipPlanBooleanOption {
  value: boolean;
  label: string;
  selected: boolean;
}

export interface MembershipPlanEditorFields {
  name: InputModel;
  description: InputModel;
  priceCents: InputModel;
  signupFeeCents: InputModel;
  trialDays: InputModel;
  contractLengthMonths: InputModel;
  classAccessLimit: InputModel;
}

export interface MembershipPlanCreateScreen {
  screen: "membership_plan_create";
  fields: MembershipPlanEditorFields;
  billingIntervalOptions: MembershipPlanIntervalOption[];
  autoRenewOptions: MembershipPlanBooleanOption[];
  visibilityOptions: MembershipPlanBooleanOption[];
  selectedBillingInterval?: BillingInterval;
  autoRenew: boolean;
  isPublic: boolean;
  summaryLabel: string;
  canSubmit: boolean;
  action: ButtonModel;
  cancelAction: ButtonModel;
}

export interface MembershipPlanEditScreen {
  screen: "membership_plan_edit";
  plan: MembershipPlanView;
  fields: MembershipPlanEditorFields;
  billingIntervalOptions: MembershipPlanIntervalOption[];
  autoRenewOptions: MembershipPlanBooleanOption[];
  visibilityOptions: MembershipPlanBooleanOption[];
  selectedBillingInterval: BillingInterval;
  autoRenew: boolean;
  isPublic: boolean;
  archived: boolean;
  changedFields: Array<
    | "name"
    | "description"
    | "billingInterval"
    | "priceCents"
    | "signupFeeCents"
    | "trialDays"
    | "autoRenew"
    | "contractLengthMonths"
    | "classAccessLimit"
    | "isPublic"
  >;
  summaryLabel: string;
  canSubmit: boolean;
  action: ButtonModel;
  cancelAction: ButtonModel;
}

export function buildMembershipPlanCreateScreen(inputModel: {
  permissions: string[];
  name?: string;
  description?: string;
  billingInterval?: BillingInterval;
  priceCents?: string;
  signupFeeCents?: string;
  trialDays?: string;
  autoRenew?: boolean;
  contractLengthMonths?: string;
  classAccessLimit?: string;
  isPublic?: boolean;
}): MembershipPlanCreateScreen {
  const canWritePlans = inputModel.permissions.includes(Permission.PlanWrite);
  const values = normalizeEditorValues({
    name: inputModel.name,
    description: inputModel.description,
    billingInterval: inputModel.billingInterval,
    priceCents: inputModel.priceCents,
    signupFeeCents: inputModel.signupFeeCents,
    trialDays: inputModel.trialDays,
    autoRenew: inputModel.autoRenew,
    contractLengthMonths: inputModel.contractLengthMonths,
    classAccessLimit: inputModel.classAccessLimit,
    isPublic: inputModel.isPublic
  });
  const fields = buildEditorFields(values);
  const billingIntervalOptions = buildBillingIntervalOptions(values.billingInterval);
  const autoRenewOptions = buildBooleanOptions(values.autoRenew, "Auto-renews", "Does not auto-renew");
  const visibilityOptions = buildBooleanOptions(values.isPublic, "Public", "Private");
  const canSubmit = canSubmitEditor(values, canWritePlans);

  return {
    screen: "membership_plan_create",
    fields,
    billingIntervalOptions,
    autoRenewOptions,
    visibilityOptions,
    ...(values.billingInterval ? { selectedBillingInterval: values.billingInterval } : {}),
    autoRenew: values.autoRenew,
    isPublic: values.isPublic,
    summaryLabel: buildSummaryLabel(values),
    canSubmit,
    action: button({ label: "Create plan", icon: "badge-plus", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
  };
}

export function createMembershipPlanSubmission(inputModel: {
  name: string;
  description?: string;
  billingInterval: BillingInterval;
  priceCents: string;
  signupFeeCents?: string;
  trialDays?: string;
  autoRenew?: boolean;
  contractLengthMonths?: string;
  classAccessLimit?: string;
  isPublic?: boolean;
}): MembershipPlanCreateInput {
  const values = normalizeEditorValues({
    name: inputModel.name,
    description: inputModel.description,
    billingInterval: inputModel.billingInterval,
    priceCents: inputModel.priceCents,
    signupFeeCents: inputModel.signupFeeCents,
    trialDays: inputModel.trialDays,
    autoRenew: inputModel.autoRenew,
    contractLengthMonths: inputModel.contractLengthMonths,
    classAccessLimit: inputModel.classAccessLimit,
    isPublic: inputModel.isPublic
  });
  return buildSubmission(values) as MembershipPlanCreateInput;
}

export function buildMembershipPlanEditScreen(inputModel: {
  plan: MembershipPlanView;
  permissions: string[];
  name?: string;
  description?: string;
  billingInterval?: BillingInterval;
  priceCents?: string;
  signupFeeCents?: string;
  trialDays?: string;
  autoRenew?: boolean;
  contractLengthMonths?: string;
  classAccessLimit?: string;
  isPublic?: boolean;
}): MembershipPlanEditScreen {
  const canWritePlans = inputModel.permissions.includes(Permission.PlanWrite);
  const archived = isArchived(inputModel.plan);
  const values = normalizeEditorValues({
    name: inputModel.name ?? inputModel.plan.name,
    description: inputModel.description ?? inputModel.plan.description,
    billingInterval: inputModel.billingInterval ?? inputModel.plan.billingInterval,
    priceCents: inputModel.priceCents ?? String(inputModel.plan.priceCents),
    signupFeeCents: inputModel.signupFeeCents ?? String(inputModel.plan.signupFeeCents),
    trialDays: inputModel.trialDays ?? String(inputModel.plan.trialDays),
    autoRenew: inputModel.autoRenew ?? inputModel.plan.autoRenew,
    contractLengthMonths:
      inputModel.contractLengthMonths ?? optionalNumberString(inputModel.plan.contractLengthMonths),
    classAccessLimit:
      inputModel.classAccessLimit ?? optionalNumberString(inputModel.plan.classAccessLimit),
    isPublic: inputModel.isPublic ?? inputModel.plan.isPublic
  });
  const fields = buildEditorFields(values);
  const changedFields = changedFieldsForPlan(inputModel.plan, values);
  const canSubmit = canSubmitEditor(values, canWritePlans) && !archived && changedFields.length > 0;

  return {
    screen: "membership_plan_edit",
    plan: inputModel.plan,
    fields,
    billingIntervalOptions: buildBillingIntervalOptions(values.billingInterval),
    autoRenewOptions: buildBooleanOptions(values.autoRenew, "Auto-renews", "Does not auto-renew"),
    visibilityOptions: buildBooleanOptions(values.isPublic, "Public", "Private"),
    selectedBillingInterval: values.billingInterval ?? inputModel.plan.billingInterval,
    autoRenew: values.autoRenew,
    isPublic: values.isPublic,
    archived,
    changedFields,
    summaryLabel: buildSummaryLabel(values),
    canSubmit,
    action: button({ label: "Save plan", icon: "save", disabled: !canSubmit }),
    cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
  };
}

export function createMembershipPlanEditSubmission(inputModel: {
  name: string;
  description?: string;
  billingInterval: BillingInterval;
  priceCents: string;
  signupFeeCents?: string;
  trialDays?: string;
  autoRenew?: boolean;
  contractLengthMonths?: string;
  classAccessLimit?: string;
  isPublic?: boolean;
}): MembershipPlanUpdateInput {
  const values = normalizeEditorValues({
    name: inputModel.name,
    description: inputModel.description,
    billingInterval: inputModel.billingInterval,
    priceCents: inputModel.priceCents,
    signupFeeCents: inputModel.signupFeeCents,
    trialDays: inputModel.trialDays,
    autoRenew: inputModel.autoRenew,
    contractLengthMonths: inputModel.contractLengthMonths,
    classAccessLimit: inputModel.classAccessLimit,
    isPublic: inputModel.isPublic
  });
  return buildSubmission(values);
}

function buildEditorFields(values: NormalizedEditorValues): MembershipPlanEditorFields {
  return {
    name: input({
      name: "name",
      label: "Plan name",
      value: values.name,
      type: "text",
      required: true,
      ...(values.name.length === 0 ? { error: "Plan name is required." } : {})
    }),
    description: input({
      name: "description",
      label: "Description",
      value: values.description,
      type: "text",
      required: false
    }),
    priceCents: input({
      name: "priceCents",
      label: "Price in cents",
      value: values.priceCents,
      type: "text",
      required: true,
      ...numericError(values.priceCents, "Enter a valid non-negative price.")
    }),
    signupFeeCents: input({
      name: "signupFeeCents",
      label: "Signup fee in cents",
      value: values.signupFeeCents,
      type: "text",
      required: false,
      ...numericError(values.signupFeeCents, "Enter a valid non-negative signup fee.")
    }),
    trialDays: input({
      name: "trialDays",
      label: "Trial days",
      value: values.trialDays,
      type: "text",
      required: false,
      ...numericError(values.trialDays, "Enter valid non-negative trial days.")
    }),
    contractLengthMonths: input({
      name: "contractLengthMonths",
      label: "Contract length in months",
      value: values.contractLengthMonths,
      type: "text",
      required: false,
      ...numericError(values.contractLengthMonths, "Enter valid non-negative contract months.")
    }),
    classAccessLimit: input({
      name: "classAccessLimit",
      label: "Class access limit",
      value: values.classAccessLimit,
      type: "text",
      required: false,
      ...numericError(values.classAccessLimit, "Enter valid non-negative class access.")
    })
  };
}

function buildBillingIntervalOptions(
  selectedInterval: BillingInterval | undefined
): MembershipPlanIntervalOption[] {
  return Object.values(BillingInterval).map((interval) => ({
    value: interval,
    label: billingIntervalLabel(interval),
    selected: interval === selectedInterval
  }));
}

function buildBooleanOptions(
  selectedValue: boolean,
  trueLabel: string,
  falseLabel: string
): MembershipPlanBooleanOption[] {
  return [
    { value: true, label: trueLabel, selected: selectedValue === true },
    { value: false, label: falseLabel, selected: selectedValue === false }
  ];
}

function numericError(value: string, message: string) {
  return value.length > 0 && parseNonNegativeInt(value) === undefined ? { error: message } : {};
}

function canSubmitEditor(values: NormalizedEditorValues, canWritePlans: boolean) {
  return Boolean(
    canWritePlans &&
      values.name &&
      values.billingInterval &&
      parseNonNegativeInt(values.priceCents) !== undefined &&
      parseNonNegativeInt(values.signupFeeCents) !== undefined &&
      parseNonNegativeInt(values.trialDays) !== undefined &&
      parseOptionalNonNegativeInt(values.contractLengthMonths) !== false &&
      parseOptionalNonNegativeInt(values.classAccessLimit) !== false
  );
}

function buildSummaryLabel(values: NormalizedEditorValues) {
  const priceCents = parseNonNegativeInt(values.priceCents) ?? 0;
  const billingInterval = values.billingInterval ?? BillingInterval.Monthly;
  return `${billingIntervalLabel(billingInterval)} plan at ${buildPriceLabel({
    id: "",
    gymId: "",
    name: values.name || "Plan",
    billingInterval,
    priceCents,
    signupFeeCents: parseNonNegativeInt(values.signupFeeCents) ?? 0,
    trialDays: parseNonNegativeInt(values.trialDays) ?? 0,
    autoRenew: values.autoRenew,
    isPublic: values.isPublic,
    status: PlanStatus.Active,
    createdAt: "",
    updatedAt: ""
  })}`;
}

function changedFieldsForPlan(plan: MembershipPlanView, values: NormalizedEditorValues) {
  const fields: MembershipPlanEditScreen["changedFields"] = [];
  if (values.name !== plan.name) fields.push("name");
  if (values.description !== (plan.description ?? "")) fields.push("description");
  if (values.billingInterval !== plan.billingInterval) fields.push("billingInterval");
  if ((parseNonNegativeInt(values.priceCents) ?? 0) !== plan.priceCents) fields.push("priceCents");
  if ((parseNonNegativeInt(values.signupFeeCents) ?? 0) !== plan.signupFeeCents) {
    fields.push("signupFeeCents");
  }
  if ((parseNonNegativeInt(values.trialDays) ?? 0) !== plan.trialDays) fields.push("trialDays");
  if (values.autoRenew !== plan.autoRenew) fields.push("autoRenew");
  if ((parseOptionalNonNegativeInt(values.contractLengthMonths) ?? undefined) !== plan.contractLengthMonths) {
    fields.push("contractLengthMonths");
  }
  if ((parseOptionalNonNegativeInt(values.classAccessLimit) ?? undefined) !== plan.classAccessLimit) {
    fields.push("classAccessLimit");
  }
  if (values.isPublic !== plan.isPublic) fields.push("isPublic");
  return fields;
}

function buildSubmission(values: NormalizedEditorValues): MembershipPlanUpdateInput {
  const submission: MembershipPlanUpdateInput = {
    name: values.name,
    billingInterval: values.billingInterval ?? BillingInterval.Monthly,
    priceCents: parseNonNegativeInt(values.priceCents) ?? 0,
    signupFeeCents: parseNonNegativeInt(values.signupFeeCents) ?? 0,
    trialDays: parseNonNegativeInt(values.trialDays) ?? 0,
    autoRenew: values.autoRenew,
    isPublic: values.isPublic
  };
  if (values.description) {
    submission.description = values.description;
  }
  const contractLengthMonths = parseOptionalNonNegativeInt(values.contractLengthMonths);
  if (contractLengthMonths !== undefined && contractLengthMonths !== false) {
    submission.contractLengthMonths = contractLengthMonths;
  }
  const classAccessLimit = parseOptionalNonNegativeInt(values.classAccessLimit);
  if (classAccessLimit !== undefined && classAccessLimit !== false) {
    submission.classAccessLimit = classAccessLimit;
  }
  return submission;
}

function normalizeEditorValues(inputModel: EditorInputValues): NormalizedEditorValues {
  return {
    name: inputModel.name?.trim() ?? "",
    description: inputModel.description?.trim() ?? "",
    billingInterval: inputModel.billingInterval,
    priceCents: normalizeNumberString(inputModel.priceCents, "0"),
    signupFeeCents: normalizeNumberString(inputModel.signupFeeCents, "0"),
    trialDays: normalizeNumberString(inputModel.trialDays, "0"),
    autoRenew: inputModel.autoRenew ?? true,
    contractLengthMonths: normalizeNumberString(inputModel.contractLengthMonths),
    classAccessLimit: normalizeNumberString(inputModel.classAccessLimit),
    isPublic: inputModel.isPublic ?? true
  };
}

function normalizeNumberString(value: string | undefined, fallback = "") {
  return value?.trim() ?? fallback;
}

function parseNonNegativeInt(value: string) {
  if (!/^\d+$/.test(value)) {
    return undefined;
  }
  return Number.parseInt(value, 10);
}

function parseOptionalNonNegativeInt(value: string) {
  if (!value) {
    return undefined;
  }
  const parsed = parseNonNegativeInt(value);
  return parsed === undefined ? false : parsed;
}

function optionalNumberString(value: number | undefined) {
  return value === undefined ? "" : String(value);
}

function isArchived(plan: MembershipPlanView) {
  return plan.status === PlanStatus.Archived || Boolean(plan.archivedAt);
}

interface NormalizedEditorValues {
  name: string;
  description: string;
  billingInterval: BillingInterval | undefined;
  priceCents: string;
  signupFeeCents: string;
  trialDays: string;
  autoRenew: boolean;
  contractLengthMonths: string;
  classAccessLimit: string;
  isPublic: boolean;
}

interface EditorInputValues {
  name: string | undefined;
  description: string | undefined;
  billingInterval: BillingInterval | undefined;
  priceCents: string | undefined;
  signupFeeCents: string | undefined;
  trialDays: string | undefined;
  autoRenew: boolean | undefined;
  contractLengthMonths: string | undefined;
  classAccessLimit: string | undefined;
  isPublic: boolean | undefined;
}
