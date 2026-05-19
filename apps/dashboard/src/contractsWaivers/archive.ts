import { Permission } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  buildDashboardConfirmationModal,
  type DashboardConfirmationModal
} from "../shell/index.js";
import {
  contractWaiverTypeLabel,
  type ContractWaiverDocumentView
} from "./list.js";

export interface ContractWaiverArchiveScreen {
  screen: "contract_waiver_archive";
  document: ContractWaiverDocumentView;
  archived: boolean;
  canArchive: boolean;
  typeLabel: string;
  versionLabel: string;
  archiveAction: ButtonModel;
  cancelAction: ButtonModel;
  confirmation: DashboardConfirmationModal;
  summaryLabel: string;
  blockedReason?: string;
}

export function buildContractWaiverArchiveScreen(inputModel: {
  document: ContractWaiverDocumentView;
  permissions: string[];
  confirmOpen?: boolean;
}): ContractWaiverArchiveScreen {
  const archived = Boolean(inputModel.document.archivedAt);
  const canWriteDocuments = inputModel.permissions.includes(Permission.GymUpdate);
  const blockedReason = archived
    ? "Document is already archived."
    : canWriteDocuments
      ? undefined
      : "You do not have permission to archive contracts or waivers.";
  const canArchive = !blockedReason;
  const typeLabel = contractWaiverTypeLabel(inputModel.document.type);
  const versionLabel = `v${inputModel.document.version}`;

  return {
    screen: "contract_waiver_archive",
    document: inputModel.document,
    archived,
    canArchive,
    typeLabel,
    versionLabel,
    archiveAction: button({
      label: "Archive document",
      icon: "archive",
      intent: "danger",
      disabled: !canArchive
    }),
    cancelAction: button({
      label: "Cancel",
      icon: "x",
      intent: "secondary"
    }),
    confirmation: buildDashboardConfirmationModal({
      title: "Archive contract or waiver",
      body: `Archive ${inputModel.document.title}? This removes it from active member-signature workflows.`,
      open: inputModel.confirmOpen ?? true,
      confirmLabel: "Archive document",
      cancelLabel: "Cancel",
      intent: "danger",
      destructive: true,
      confirmDisabled: !canArchive
    }),
    summaryLabel: blockedReason
      ? blockedReason
      : `Archive ${typeLabel.toLowerCase()} ${versionLabel} for ${inputModel.document.title}`,
    ...(blockedReason ? { blockedReason } : {})
  };
}
