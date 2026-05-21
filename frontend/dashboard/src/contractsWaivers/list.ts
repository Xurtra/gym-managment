import { Permission } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";

export const ContractWaiverType = {
  Contract: "contract",
  Waiver: "waiver"
} as const;

export type ContractWaiverType = (typeof ContractWaiverType)[keyof typeof ContractWaiverType];

export interface ContractWaiverDocumentView {
  id: string;
  gymId: string;
  title: string;
  type: ContractWaiverType;
  version: number;
  requiresSignature: boolean;
  signedMemberCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

export interface ContractWaiverListFilters {
  query?: string;
  type?: ContractWaiverType;
}

export interface ContractWaiverTypeFilterOption {
  value: ContractWaiverType;
  label: string;
  selected: boolean;
}

export interface ContractWaiverListAction {
  key: "view" | "edit" | "archive";
  button: ButtonModel;
  href?: string;
}

export interface ContractWaiverListRow extends ContractWaiverDocumentView {
  typeLabel: string;
  statusLabel: string;
  versionLabel: string;
  signatureLabel: string;
  detailHref: string;
  actions: ContractWaiverListAction[];
}

export interface ContractWaiverListSummary {
  totalCount: number;
  contractCount: number;
  waiverCount: number;
  requiredSignatureCount: number;
  publishedCount: number;
  visibleCount: number;
}

export interface ContractWaiverListPage {
  screen: "contract_waiver_list";
  filters: Required<Pick<ContractWaiverListFilters, "query">> &
    Omit<ContractWaiverListFilters, "query">;
  searchField: InputModel;
  typeOptions: ContractWaiverTypeFilterOption[];
  summary: ContractWaiverListSummary;
  summaryLabel: string;
  rowCount: number;
  activeFilterCount: number;
  typeOptionCount: number;
  rows: ContractWaiverListRow[];
  table: TableModel<ContractWaiverListRow>;
  empty?: EmptyStateModel;
  createDocumentAction: ButtonModel;
}

export function buildContractWaiverListPage(inputModel: {
  documents: ContractWaiverDocumentView[];
  permissions: string[];
  filters?: ContractWaiverListFilters;
}): ContractWaiverListPage {
  const query = normalizeText(inputModel.filters?.query).toLowerCase();
  const filters: ContractWaiverListPage["filters"] = {
    query,
    ...(inputModel.filters?.type ? { type: inputModel.filters.type } : {})
  };
  const activeDocuments = inputModel.documents.filter((document) => !document.archivedAt);
  const canWriteDocuments = inputModel.permissions.includes(Permission.GymUpdate);
  const typeOptions = Object.values(ContractWaiverType).map((type) => ({
    value: type,
    label: contractWaiverTypeLabel(type),
    selected: type === filters.type
  }));
  const rows = activeDocuments
    .filter((document) => matchesFilters(document, filters))
    .sort(compareDocuments)
    .map((document) => buildRow(document, canWriteDocuments));
  const empty =
    rows.length === 0
      ? emptyState({
          title: hasActiveFilters(filters)
            ? "No contracts or waivers match your filters"
            : "No contracts or waivers",
          body: hasActiveFilters(filters)
            ? "Adjust the contract and waiver filters and try again."
            : "Create a contract or waiver to start collecting member signatures."
        })
      : undefined;

  return {
    screen: "contract_waiver_list",
    filters,
    searchField: input({
      name: "contractWaiverSearch",
      label: "Search contracts and waivers",
      value: query,
      type: "text",
      required: false
    }),
    typeOptions,
    summary: buildSummary(activeDocuments, rows.length),
    summaryLabel: `Showing ${rows.length} of ${activeDocuments.length} contract${
      activeDocuments.length === 1 ? "" : "s"
    } and waiver${activeDocuments.length === 1 ? "" : "s"}`,
    rowCount: rows.length,
    activeFilterCount: countActiveFilters(filters),
    typeOptionCount: typeOptions.length,
    rows,
    table: table({
      columns: [
        { key: "title", label: "Document" },
        { key: "typeLabel", label: "Type" },
        { key: "statusLabel", label: "Status" },
        { key: "signatureLabel", label: "Signatures" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    createDocumentAction: button({
      label: "Create document",
      icon: "badge-plus",
      disabled: !canWriteDocuments
    })
  };
}

function buildRow(
  document: ContractWaiverDocumentView,
  canWriteDocuments: boolean
): ContractWaiverListRow {
  return {
    ...document,
    typeLabel: contractWaiverTypeLabel(document.type),
    statusLabel: document.publishedAt ? "Published" : "Draft",
    versionLabel: `v${document.version}`,
    signatureLabel: `${document.signedMemberCount} signature${
      document.signedMemberCount === 1 ? "" : "s"
    }`,
    detailHref: `/contracts-waivers/${document.id}`,
    actions: [
      {
        key: "view",
        href: `/contracts-waivers/${document.id}`,
        button: button({ label: "View", icon: "eye", intent: "secondary" })
      },
      {
        key: "edit",
        href: `/contracts-waivers/${document.id}/edit`,
        button: button({
          label: "Edit",
          icon: "pencil",
          intent: "secondary",
          disabled: !canWriteDocuments
        })
      },
      {
        key: "archive",
        button: button({
          label: "Archive",
          icon: "archive",
          intent: "danger",
          disabled: !canWriteDocuments
        })
      }
    ]
  };
}

function buildSummary(
  documents: ContractWaiverDocumentView[],
  visibleCount: number
): ContractWaiverListSummary {
  return {
    totalCount: documents.length,
    contractCount: documents.filter((document) => document.type === ContractWaiverType.Contract)
      .length,
    waiverCount: documents.filter((document) => document.type === ContractWaiverType.Waiver).length,
    requiredSignatureCount: documents.filter((document) => document.requiresSignature).length,
    publishedCount: documents.filter((document) => Boolean(document.publishedAt)).length,
    visibleCount
  };
}

function matchesFilters(
  document: ContractWaiverDocumentView,
  filters: ContractWaiverListPage["filters"]
) {
  if (filters.type && document.type !== filters.type) {
    return false;
  }
  if (!filters.query) {
    return true;
  }
  return [document.title, contractWaiverTypeLabel(document.type), document.publishedAt ? "published" : "draft"]
    .some((value) => value.toLowerCase().includes(filters.query));
}

function compareDocuments(left: ContractWaiverDocumentView, right: ContractWaiverDocumentView) {
  return (
    left.title.localeCompare(right.title) ||
    right.version - left.version ||
    left.id.localeCompare(right.id)
  );
}

function contractWaiverTypeLabel(type: ContractWaiverType) {
  return {
    [ContractWaiverType.Contract]: "Contract",
    [ContractWaiverType.Waiver]: "Waiver"
  }[type];
}

export { contractWaiverTypeLabel };

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function hasActiveFilters(filters: ContractWaiverListPage["filters"]) {
  return Boolean(filters.query || filters.type);
}

function countActiveFilters(filters: ContractWaiverListPage["filters"]) {
  return [filters.query, filters.type].filter(Boolean).length;
}
