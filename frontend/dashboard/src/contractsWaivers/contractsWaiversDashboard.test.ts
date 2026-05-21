import { Permission } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  buildContractWaiverArchiveScreen,
  buildContractWaiverCreateScreen,
  buildContractWaiverDetailPage,
  buildContractWaiverEditScreen,
  buildContractWaiverListPage,
  ContractWaiverType,
  createContractWaiverEditSubmission,
  createContractWaiverSubmission,
  type ContractWaiverDocumentView
} from "./index.js";

const documents: ContractWaiverDocumentView[] = [
  {
    id: "doc-1",
    gymId: "gym-1",
    title: "24/7 Access Agreement",
    type: ContractWaiverType.Contract,
    version: 3,
    requiresSignature: true,
    signedMemberCount: 182,
    createdAt: "2026-05-18T12:00:00.000Z",
    updatedAt: "2026-05-18T12:00:00.000Z",
    publishedAt: "2026-05-18T12:00:00.000Z"
  },
  {
    id: "doc-2",
    gymId: "gym-1",
    title: "Liability Waiver",
    type: ContractWaiverType.Waiver,
    version: 2,
    requiresSignature: true,
    signedMemberCount: 205,
    createdAt: "2026-05-17T12:00:00.000Z",
    updatedAt: "2026-05-18T12:00:00.000Z",
    publishedAt: "2026-05-18T12:00:00.000Z"
  },
  {
    id: "doc-3",
    gymId: "gym-1",
    title: "Photo Release",
    type: ContractWaiverType.Waiver,
    version: 1,
    requiresSignature: false,
    signedMemberCount: 18,
    createdAt: "2026-05-16T12:00:00.000Z",
    updatedAt: "2026-05-18T12:00:00.000Z",
    archivedAt: "2026-05-18T12:00:00.000Z"
  }
];

describe("contracts and waivers dashboard", () => {
  it("builds contract and waiver list state with filters, summaries, and actions", () => {
    const page = buildContractWaiverListPage({
      documents,
      permissions: [Permission.GymRead, Permission.GymUpdate],
      filters: {
        query: " access ",
        type: ContractWaiverType.Contract
      }
    });

    expect(page.screen).toBe("contract_waiver_list");
    expect(page.filters.query).toBe("access");
    expect(page.filters.type).toBe(ContractWaiverType.Contract);
    expect(page.searchField.value).toBe("access");
    expect(page.typeOptions).toHaveLength(2);
    expect(page.typeOptions.find((option) => option.value === ContractWaiverType.Contract)?.selected).toBe(
      true
    );
    expect(page.summary).toMatchObject({
      totalCount: 2,
      contractCount: 1,
      waiverCount: 1,
      requiredSignatureCount: 2,
      publishedCount: 2,
      visibleCount: 1
    });
    expect(page.summaryLabel).toBe("Showing 1 of 2 contracts and waivers");
    expect(page.rowCount).toBe(1);
    expect(page.activeFilterCount).toBe(2);
    expect(page.typeOptionCount).toBe(2);
    expect(page.rows.map((row) => row.id)).toEqual(["doc-1"]);
    expect(page.rows[0]?.typeLabel).toBe("Contract");
    expect(page.rows[0]?.statusLabel).toBe("Published");
    expect(page.rows[0]?.versionLabel).toBe("v3");
    expect(page.rows[0]?.signatureLabel).toBe("182 signatures");
    expect(page.rows[0]?.detailHref).toBe("/contracts-waivers/doc-1");
    expect(page.rows[0]?.actions.find((action) => action.key === "edit")?.button.disabled).toBe(
      false
    );
    expect(page.createDocumentAction.disabled).toBe(false);
  });

  it("builds empty state and permission-aware actions", () => {
    const readOnly = buildContractWaiverListPage({
      documents,
      permissions: [Permission.GymRead]
    });
    const empty = buildContractWaiverListPage({
      documents,
      permissions: [Permission.GymRead],
      filters: { query: "missing" }
    });

    expect(readOnly.rows.map((row) => row.id)).toEqual(["doc-1", "doc-2"]);
    expect(readOnly.activeFilterCount).toBe(0);
    expect(readOnly.createDocumentAction.disabled).toBe(true);
    expect(
      readOnly.rows[0]?.actions.find((action) => action.key === "archive")?.button.disabled
    ).toBe(true);
    expect(empty.empty?.title).toBe("No contracts or waivers match your filters");
    expect(empty.summaryLabel).toBe("Showing 0 of 2 contracts and waivers");
  });

  it("builds contract and waiver detail state with sections and permission-aware actions", () => {
    const detail = buildContractWaiverDetailPage({
      document: documents[0]!,
      permissions: [Permission.GymRead, Permission.GymUpdate]
    });
    const archived = buildContractWaiverDetailPage({
      document: documents[2]!,
      permissions: [Permission.GymRead]
    });

    expect(detail.screen).toBe("contract_waiver_detail");
    expect(detail.archived).toBe(false);
    expect(detail.typeLabel).toBe("Contract");
    expect(detail.statusLabel).toBe("Published");
    expect(detail.versionLabel).toBe("v3");
    expect(detail.signatureRequirementLabel).toBe("Signature required");
    expect(detail.signatureCountLabel).toBe("182 signatures");
    expect(detail.sectionCount).toBe(3);
    expect(detail.sections.find((section) => section.key === "overview")?.details).toContainEqual({
      key: "type",
      label: "Type",
      value: "Contract"
    });
    expect(detail.sections.find((section) => section.key === "signatures")?.details).toContainEqual({
      key: "signed_count",
      label: "Signed members",
      value: "182"
    });
    expect(detail.sections.find((section) => section.key === "history")?.details).toContainEqual({
      key: "archived",
      label: "Archived",
      value: "Not archived"
    });
    expect(detail.actionCount).toBe(3);
    expect(detail.actions.find((action) => action.key === "back_to_documents")?.href).toBe(
      "/contracts-waivers"
    );
    expect(detail.actions.find((action) => action.key === "edit")?.button.disabled).toBe(false);
    expect(detail.actions.find((action) => action.key === "archive")?.href).toBe(
      "/contracts-waivers/doc-1/archive"
    );
    expect(detail.summaryLabel).toBe("Contract v3 is published");
    expect(archived.archived).toBe(true);
    expect(archived.statusLabel).toBe("Draft");
    expect(archived.signatureRequirementLabel).toBe("Signature optional");
    expect(archived.actions.find((action) => action.key === "edit")?.button.disabled).toBe(true);
    expect(archived.actions.find((action) => action.key === "archive")?.button.disabled).toBe(
      true
    );
  });

  it("builds contract and waiver create and edit screens with normalized submissions", () => {
    const create = buildContractWaiverCreateScreen({
      permissions: [Permission.GymRead, Permission.GymUpdate],
      title: "  Liability Waiver  ",
      type: ContractWaiverType.Waiver,
      version: "2",
      requiresSignature: true,
      publish: true
    });
    const invalid = buildContractWaiverCreateScreen({
      permissions: [Permission.GymRead],
      title: "",
      version: "0"
    });
    const edit = buildContractWaiverEditScreen({
      document: documents[0]!,
      permissions: [Permission.GymRead, Permission.GymUpdate],
      title: "24/7 Access Agreement Revised",
      version: "4",
      publish: false
    });
    const archived = buildContractWaiverEditScreen({
      document: documents[2]!,
      permissions: [Permission.GymRead, Permission.GymUpdate]
    });
    const createSubmission = createContractWaiverSubmission({
      title: "  Liability Waiver  ",
      type: ContractWaiverType.Waiver,
      version: "2",
      requiresSignature: true,
      publish: true
    });
    const editSubmission = createContractWaiverEditSubmission({
      title: " 24/7 Access Agreement Revised ",
      type: ContractWaiverType.Contract,
      version: "4",
      requiresSignature: true,
      publish: false
    });

    expect(create.screen).toBe("contract_waiver_create");
    expect(create.fields.title.value).toBe("Liability Waiver");
    expect(create.selectedType).toBe(ContractWaiverType.Waiver);
    expect(create.requiresSignature).toBe(true);
    expect(create.publish).toBe(true);
    expect(create.summaryLabel).toBe("Waiver v2 is published");
    expect(create.canSubmit).toBe(true);
    expect(create.action.disabled).toBe(false);
    expect(invalid.fields.title.error).toBe("Document title is required.");
    expect(invalid.fields.version.error).toBe("Enter a valid version number greater than zero.");
    expect(invalid.canSubmit).toBe(false);
    expect(edit.screen).toBe("contract_waiver_edit");
    expect(edit.changedFields).toEqual(["title", "version", "publish"]);
    expect(edit.summaryLabel).toBe("Contract v4 is draft");
    expect(edit.canSubmit).toBe(true);
    expect(archived.archived).toBe(true);
    expect(archived.canSubmit).toBe(false);
    expect(createSubmission).toEqual({
      title: "Liability Waiver",
      type: ContractWaiverType.Waiver,
      version: 2,
      requiresSignature: true,
      publish: true
    });
    expect(editSubmission).toEqual({
      title: "24/7 Access Agreement Revised",
      type: ContractWaiverType.Contract,
      version: 4,
      requiresSignature: true,
      publish: false
    });
  });

  it("builds contract and waiver archive flow with confirmation and permission blocking", () => {
    const active = buildContractWaiverArchiveScreen({
      document: documents[0]!,
      permissions: [Permission.GymRead, Permission.GymUpdate]
    });
    const readOnly = buildContractWaiverArchiveScreen({
      document: documents[0]!,
      permissions: [Permission.GymRead],
      confirmOpen: false
    });
    const archived = buildContractWaiverArchiveScreen({
      document: documents[2]!,
      permissions: [Permission.GymRead, Permission.GymUpdate]
    });

    expect(active.screen).toBe("contract_waiver_archive");
    expect(active.archived).toBe(false);
    expect(active.canArchive).toBe(true);
    expect(active.typeLabel).toBe("Contract");
    expect(active.versionLabel).toBe("v3");
    expect(active.archiveAction.disabled).toBe(false);
    expect(active.confirmation.open).toBe(true);
    expect(active.confirmation.confirmAction.label).toBe("Archive document");
    expect(active.confirmation.confirmDisabled).toBe(false);
    expect(active.summaryLabel).toBe("Archive contract v3 for 24/7 Access Agreement");
    expect(readOnly.canArchive).toBe(false);
    expect(readOnly.blockedReason).toBe("You do not have permission to archive contracts or waivers.");
    expect(readOnly.archiveAction.disabled).toBe(true);
    expect(readOnly.confirmation.open).toBe(false);
    expect(readOnly.confirmation.confirmDisabled).toBe(true);
    expect(archived.archived).toBe(true);
    expect(archived.canArchive).toBe(false);
    expect(archived.blockedReason).toBe("Document is already archived.");
    expect(archived.summaryLabel).toBe("Document is already archived.");
  });
});
