import { Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  contractWaiverTypeLabel,
  type ContractWaiverDocumentView
} from "./list.js";

export interface ContractWaiverDetailAction {
  key: "back_to_documents" | "edit" | "archive";
  button: ButtonModel;
  href?: string;
}

export interface ContractWaiverDetailSectionDetail {
  key: string;
  label: string;
  value: string;
}

export interface ContractWaiverDetailSection {
  key: "overview" | "signatures" | "history";
  title: string;
  details: ContractWaiverDetailSectionDetail[];
}

export interface ContractWaiverDetailPage {
  screen: "contract_waiver_detail";
  document: ContractWaiverDocumentView;
  archived: boolean;
  typeLabel: string;
  statusLabel: string;
  versionLabel: string;
  signatureRequirementLabel: string;
  signatureCountLabel: string;
  sectionCount: number;
  sections: ContractWaiverDetailSection[];
  actionCount: number;
  actions: ContractWaiverDetailAction[];
  summaryLabel: string;
}

export function buildContractWaiverDetailPage(inputModel: {
  document: ContractWaiverDocumentView;
  permissions: string[];
}): ContractWaiverDetailPage {
  const canWriteDocuments = inputModel.permissions.includes(Permission.GymUpdate);
  const archived = Boolean(inputModel.document.archivedAt);
  const sections = buildSections(inputModel.document);
  const actions = buildActions(inputModel.document, canWriteDocuments, archived);
  const typeLabel = contractWaiverTypeLabel(inputModel.document.type);
  const statusLabel = inputModel.document.publishedAt ? "Published" : "Draft";
  const versionLabel = `v${inputModel.document.version}`;
  const signatureRequirementLabel = inputModel.document.requiresSignature
    ? "Signature required"
    : "Signature optional";
  const signatureCountLabel = `${inputModel.document.signedMemberCount} signature${
    inputModel.document.signedMemberCount === 1 ? "" : "s"
  }`;

  return {
    screen: "contract_waiver_detail",
    document: inputModel.document,
    archived,
    typeLabel,
    statusLabel,
    versionLabel,
    signatureRequirementLabel,
    signatureCountLabel,
    sectionCount: sections.length,
    sections,
    actionCount: actions.length,
    actions,
    summaryLabel: `${typeLabel} ${versionLabel} is ${statusLabel.toLowerCase()}`
  };
}

function buildSections(document: ContractWaiverDocumentView): ContractWaiverDetailSection[] {
  return [
    {
      key: "overview",
      title: "Overview",
      details: [
        { key: "type", label: "Type", value: contractWaiverTypeLabel(document.type) },
        { key: "status", label: "Status", value: document.publishedAt ? "Published" : "Draft" },
        { key: "version", label: "Version", value: `v${document.version}` }
      ]
    },
    {
      key: "signatures",
      title: "Signatures",
      details: [
        {
          key: "required",
          label: "Requirement",
          value: document.requiresSignature ? "Required" : "Optional"
        },
        {
          key: "signed_count",
          label: "Signed members",
          value: String(document.signedMemberCount)
        }
      ]
    },
    {
      key: "history",
      title: "History",
      details: [
        { key: "created", label: "Created", value: document.createdAt },
        { key: "updated", label: "Last updated", value: document.updatedAt },
        { key: "published", label: "Published", value: document.publishedAt ?? "Not published" },
        { key: "archived", label: "Archived", value: document.archivedAt ?? "Not archived" }
      ]
    }
  ];
}

function buildActions(
  document: ContractWaiverDocumentView,
  canWriteDocuments: boolean,
  archived: boolean
): ContractWaiverDetailAction[] {
  return [
    {
      key: "back_to_documents",
      href: "/contracts-waivers",
      button: button({
        label: "Back to documents",
        icon: "arrow-left",
        intent: "secondary"
      })
    },
    {
      key: "edit",
      href: `/contracts-waivers/${document.id}/edit`,
      button: button({
        label: "Edit document",
        icon: "pencil",
        intent: "secondary",
        disabled: !canWriteDocuments || archived
      })
    },
    {
      key: "archive",
      href: `/contracts-waivers/${document.id}/archive`,
      button: button({
        label: "Archive",
        icon: "archive",
        intent: "danger",
        disabled: !canWriteDocuments || archived
      })
    }
  ];
}
