import { Permission, PlanStatus } from "@gym-platform/constants";
import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";
import {
  billingIntervalLabel,
  buildPriceLabel,
  formatCurrency,
  type MembershipPlanView
} from "./list.js";

export interface MembershipPlanDetailAction {
  key: "back_to_plans" | "edit" | "archive";
  button: ButtonModel;
  href?: string;
}

export interface MembershipPlanDetailSectionDetail {
  key: string;
  label: string;
  value: string;
}

export interface MembershipPlanDetailSection {
  key: "pricing" | "access" | "settings" | "timestamps";
  title: string;
  details: MembershipPlanDetailSectionDetail[];
}

export interface MembershipPlanDetailPage {
  screen: "membership_plan_detail";
  plan: MembershipPlanView;
  statusLabel: string;
  archived: boolean;
  billingIntervalLabel: string;
  priceLabel: string;
  signupFeeLabel: string;
  trialLabel: string;
  accessLabel: string;
  visibilityLabel: string;
  autoRenewLabel: string;
  sectionCount: number;
  sections: MembershipPlanDetailSection[];
  actionCount: number;
  actions: MembershipPlanDetailAction[];
  summaryLabel: string;
}

export function buildMembershipPlanDetailPage(inputModel: {
  plan: MembershipPlanView;
  permissions: string[];
}): MembershipPlanDetailPage {
  const canWritePlans = inputModel.permissions.includes(Permission.PlanWrite);
  const archived = isArchived(inputModel.plan);
  const sections = buildSections(inputModel.plan);
  const actions = buildActions(inputModel.plan, canWritePlans, archived);
  const visibilityLabel = inputModel.plan.isPublic ? "Public" : "Private";
  const autoRenewLabel = inputModel.plan.autoRenew ? "Auto-renews" : "Does not auto-renew";

  return {
    screen: "membership_plan_detail",
    plan: inputModel.plan,
    statusLabel: archived ? "Archived" : "Active",
    archived,
    billingIntervalLabel: billingIntervalLabel(inputModel.plan.billingInterval),
    priceLabel: buildPriceLabel(inputModel.plan),
    signupFeeLabel:
      inputModel.plan.signupFeeCents > 0
        ? `${formatCurrency(inputModel.plan.signupFeeCents)} signup fee`
        : "No signup fee",
    trialLabel: inputModel.plan.trialDays > 0 ? `${inputModel.plan.trialDays}-day trial` : "No trial",
    accessLabel:
      inputModel.plan.classAccessLimit === undefined
        ? "Unlimited classes"
        : `${inputModel.plan.classAccessLimit} class${
            inputModel.plan.classAccessLimit === 1 ? "" : "es"
          }`,
    visibilityLabel,
    autoRenewLabel,
    sectionCount: sections.length,
    sections,
    actionCount: actions.length,
    actions,
    summaryLabel: `${billingIntervalLabel(inputModel.plan.billingInterval)} plan at ${buildPriceLabel(
      inputModel.plan
    )}`
  };
}

function buildSections(plan: MembershipPlanView): MembershipPlanDetailSection[] {
  return [
    {
      key: "pricing",
      title: "Pricing",
      details: [
        { key: "price", label: "Price", value: buildPriceLabel(plan) },
        {
          key: "signup_fee",
          label: "Signup fee",
          value: plan.signupFeeCents > 0 ? formatCurrency(plan.signupFeeCents) : "None"
        },
        {
          key: "trial_days",
          label: "Trial period",
          value: plan.trialDays > 0 ? `${plan.trialDays} days` : "No trial"
        }
      ]
    },
    {
      key: "access",
      title: "Access",
      details: [
        {
          key: "class_access_limit",
          label: "Class access",
          value:
            plan.classAccessLimit === undefined
              ? "Unlimited classes"
              : `${plan.classAccessLimit} class${plan.classAccessLimit === 1 ? "" : "es"}`
        },
        {
          key: "contract_length",
          label: "Contract length",
          value: plan.contractLengthMonths ? `${plan.contractLengthMonths} months` : "No contract"
        }
      ]
    },
    {
      key: "settings",
      title: "Settings",
      details: [
        { key: "status", label: "Status", value: isArchived(plan) ? "Archived" : "Active" },
        { key: "billing_interval", label: "Billing interval", value: billingIntervalLabel(plan.billingInterval) },
        { key: "visibility", label: "Visibility", value: plan.isPublic ? "Public" : "Private" },
        { key: "auto_renew", label: "Renewal", value: plan.autoRenew ? "Auto-renews" : "Does not auto-renew" },
        {
          key: "description",
          label: "Description",
          value: plan.description?.trim() || "No description"
        }
      ]
    },
    {
      key: "timestamps",
      title: "History",
      details: [
        { key: "created", label: "Created", value: plan.createdAt },
        { key: "updated", label: "Last updated", value: plan.updatedAt },
        {
          key: "archived",
          label: "Archived",
          value: plan.archivedAt ?? "Not archived"
        }
      ]
    }
  ];
}

function buildActions(
  plan: MembershipPlanView,
  canWritePlans: boolean,
  archived: boolean
): MembershipPlanDetailAction[] {
  return [
    {
      key: "back_to_plans",
      href: "/membership-plans",
      button: button({ label: "Back to plans", icon: "arrow-left", intent: "secondary" })
    },
    {
      key: "edit",
      href: `/membership-plans/${plan.id}/edit`,
      button: button({
        label: "Edit plan",
        icon: "pencil",
        intent: "secondary",
        disabled: !canWritePlans || archived
      })
    },
    {
      key: "archive",
      href: `/membership-plans/${plan.id}/archive`,
      button: button({
        label: "Archive",
        icon: "archive",
        intent: "danger",
        disabled: !canWritePlans || archived
      })
    }
  ];
}

function isArchived(plan: MembershipPlanView) {
  return plan.status === PlanStatus.Archived || Boolean(plan.archivedAt);
}
