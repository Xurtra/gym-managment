import { Permission, PlanStatus } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  buildDashboardConfirmationModal,
  type DashboardConfirmationModal
} from "../shell/index.js";
import {
  billingIntervalLabel,
  buildPriceLabel,
  type MembershipPlanView
} from "./list.js";

export interface MembershipPlanArchiveScreen {
  screen: "membership_plan_archive";
  plan: MembershipPlanView;
  archived: boolean;
  canArchive: boolean;
  billingIntervalLabel: string;
  priceLabel: string;
  archiveAction: ButtonModel;
  cancelAction: ButtonModel;
  confirmation: DashboardConfirmationModal;
  summaryLabel: string;
  blockedReason?: string;
}

export function buildMembershipPlanArchiveScreen(inputModel: {
  plan: MembershipPlanView;
  permissions: string[];
  confirmOpen?: boolean;
}): MembershipPlanArchiveScreen {
  const archived = isArchived(inputModel.plan);
  const canWritePlans = inputModel.permissions.includes(Permission.PlanWrite);
  const blockedReason = archived
    ? "Membership plan is already archived."
    : canWritePlans
      ? undefined
      : "You do not have permission to archive membership plans.";
  const canArchive = !blockedReason;

  return {
    screen: "membership_plan_archive",
    plan: inputModel.plan,
    archived,
    canArchive,
    billingIntervalLabel: billingIntervalLabel(inputModel.plan.billingInterval),
    priceLabel: buildPriceLabel(inputModel.plan),
    archiveAction: button({
      label: "Archive plan",
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
      title: "Archive membership plan",
      body: `Archive ${inputModel.plan.name}? This removes it from active sales and assignment flows.`,
      open: inputModel.confirmOpen ?? true,
      confirmLabel: "Archive plan",
      cancelLabel: "Cancel",
      intent: "danger",
      destructive: true,
      confirmDisabled: !canArchive
    }),
    summaryLabel: blockedReason
      ? blockedReason
      : `Archive ${inputModel.plan.name} (${buildPriceLabel(inputModel.plan)})`,
    ...(blockedReason ? { blockedReason } : {})
  };
}

function isArchived(plan: MembershipPlanView) {
  return plan.status === PlanStatus.Archived || Boolean(plan.archivedAt);
}
