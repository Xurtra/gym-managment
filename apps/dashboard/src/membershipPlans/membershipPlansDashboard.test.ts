import { BillingInterval, Permission, PlanStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  buildMembershipPlanArchiveScreen,
  buildMembershipPlanCreateScreen,
  buildMembershipPlanDetailPage,
  buildMembershipPlanEditScreen,
  buildMembershipPlanListPage,
  createMembershipPlanEditSubmission,
  createMembershipPlanSubmission,
  type MembershipPlanView
} from "./index.js";

const plans: MembershipPlanView[] = [
  {
    id: "plan-1",
    gymId: "gym-1",
    name: "Monthly Unlimited",
    description: "Best for regular members",
    billingInterval: BillingInterval.Monthly,
    priceCents: 9900,
    signupFeeCents: 2500,
    trialDays: 7,
    autoRenew: true,
    classAccessLimit: 12,
    isPublic: true,
    status: PlanStatus.Active,
    createdAt: "2026-05-18T12:00:00.000Z",
    updatedAt: "2026-05-18T12:00:00.000Z"
  },
  {
    id: "plan-2",
    gymId: "gym-1",
    name: "Founders Annual",
    billingInterval: BillingInterval.Yearly,
    priceCents: 99900,
    signupFeeCents: 0,
    trialDays: 0,
    autoRenew: true,
    isPublic: false,
    status: PlanStatus.Active,
    createdAt: "2026-05-17T12:00:00.000Z",
    updatedAt: "2026-05-18T12:00:00.000Z"
  },
  {
    id: "plan-3",
    gymId: "gym-1",
    name: "Drop In",
    billingInterval: BillingInterval.OneTime,
    priceCents: 2500,
    signupFeeCents: 0,
    trialDays: 0,
    autoRenew: false,
    isPublic: true,
    status: PlanStatus.Archived,
    createdAt: "2026-05-16T12:00:00.000Z",
    updatedAt: "2026-05-18T12:00:00.000Z",
    archivedAt: "2026-05-18T12:00:00.000Z"
  }
];

describe("membership plans dashboard", () => {
  it("builds membership plan list state with filters, summaries, and actions", () => {
    const page = buildMembershipPlanListPage({
      plans,
      permissions: [Permission.PlanRead, Permission.PlanWrite],
      filters: {
        query: " monthly ",
        billingInterval: BillingInterval.Monthly
      }
    });

    expect(page.screen).toBe("membership_plan_list");
    expect(page.filters.query).toBe("monthly");
    expect(page.filters.billingInterval).toBe(BillingInterval.Monthly);
    expect(page.searchField.value).toBe("monthly");
    expect(page.billingIntervalOptions).toHaveLength(4);
    expect(
      page.billingIntervalOptions.find((option) => option.value === BillingInterval.Monthly)?.selected
    ).toBe(true);
    expect(page.summary).toMatchObject({
      totalCount: 2,
      monthlyCount: 1,
      yearlyCount: 1,
      oneTimeCount: 0,
      packageCount: 0,
      publicCount: 1,
      privateCount: 1,
      visibleCount: 1
    });
    expect(page.summaryLabel).toBe("Showing 1 of 2 membership plans");
    expect(page.rowCount).toBe(1);
    expect(page.activeFilterCount).toBe(2);
    expect(page.billingIntervalOptionCount).toBe(4);
    expect(page.rows.map((row) => row.id)).toEqual(["plan-1"]);
    expect(page.rows[0]?.priceLabel).toBe("$99.00/month");
    expect(page.rows[0]?.signupFeeLabel).toBe("$25.00 signup fee");
    expect(page.rows[0]?.trialLabel).toBe("7-day trial");
    expect(page.rows[0]?.accessLabel).toBe("12 classes");
    expect(page.rows[0]?.visibilityLabel).toBe("Public");
    expect(page.rows[0]?.detailHref).toBe("/membership-plans/plan-1");
    expect(page.rows[0]?.actions.find((action) => action.key === "edit")?.button.disabled).toBe(
      false
    );
    expect(page.rows[0]?.actions.find((action) => action.key === "archive")?.href).toBe(
      "/membership-plans/plan-1/archive"
    );
    expect(page.createPlanAction.disabled).toBe(false);
  });

  it("builds empty states and permission-aware list actions", () => {
    const readOnly = buildMembershipPlanListPage({
      plans,
      permissions: [Permission.PlanRead]
    });
    const empty = buildMembershipPlanListPage({
      plans,
      permissions: [Permission.PlanRead],
      filters: { query: "missing" }
    });

    expect(readOnly.rows.map((row) => row.id)).toEqual(["plan-1", "plan-2"]);
    expect(readOnly.activeFilterCount).toBe(0);
    expect(readOnly.createPlanAction.disabled).toBe(true);
    expect(
      readOnly.rows[0]?.actions.find((action) => action.key === "archive")?.button.disabled
    ).toBe(true);
    expect(empty.empty?.title).toBe("No membership plans match your filters");
    expect(empty.summaryLabel).toBe("Showing 0 of 2 membership plans");
  });

  it("builds membership plan detail state with sections and permission-aware actions", () => {
    const detail = buildMembershipPlanDetailPage({
      plan: plans[0]!,
      permissions: [Permission.PlanRead, Permission.PlanWrite]
    });
    const archived = buildMembershipPlanDetailPage({
      plan: plans[2]!,
      permissions: [Permission.PlanRead]
    });

    expect(detail.screen).toBe("membership_plan_detail");
    expect(detail.statusLabel).toBe("Active");
    expect(detail.archived).toBe(false);
    expect(detail.billingIntervalLabel).toBe("Monthly");
    expect(detail.priceLabel).toBe("$99.00/month");
    expect(detail.signupFeeLabel).toBe("$25.00 signup fee");
    expect(detail.trialLabel).toBe("7-day trial");
    expect(detail.accessLabel).toBe("12 classes");
    expect(detail.visibilityLabel).toBe("Public");
    expect(detail.autoRenewLabel).toBe("Auto-renews");
    expect(detail.sectionCount).toBe(4);
    expect(detail.sections.find((section) => section.key === "pricing")?.details).toContainEqual({
      key: "price",
      label: "Price",
      value: "$99.00/month"
    });
    expect(detail.sections.find((section) => section.key === "access")?.details).toContainEqual({
      key: "contract_length",
      label: "Contract length",
      value: "No contract"
    });
    expect(detail.sections.find((section) => section.key === "settings")?.details).toContainEqual({
      key: "description",
      label: "Description",
      value: "Best for regular members"
    });
    expect(detail.summaryLabel).toBe("Monthly plan at $99.00/month");
    expect(detail.actionCount).toBe(3);
    expect(detail.actions.find((action) => action.key === "back_to_plans")?.href).toBe(
      "/membership-plans"
    );
    expect(detail.actions.find((action) => action.key === "edit")?.button.disabled).toBe(false);
    expect(detail.actions.find((action) => action.key === "archive")?.href).toBe(
      "/membership-plans/plan-1/archive"
    );
    expect(archived.statusLabel).toBe("Archived");
    expect(archived.archived).toBe(true);
    expect(archived.accessLabel).toBe("Unlimited classes");
    expect(archived.autoRenewLabel).toBe("Does not auto-renew");
    expect(archived.actions.find((action) => action.key === "edit")?.button.disabled).toBe(true);
    expect(archived.actions.find((action) => action.key === "archive")?.button.disabled).toBe(
      true
    );
  });

  it("builds membership plan create and edit screens with normalized submissions", () => {
    const create = buildMembershipPlanCreateScreen({
      permissions: [Permission.PlanRead, Permission.PlanWrite],
      name: "  Monthly Unlimited  ",
      description: "  Best for regular members  ",
      billingInterval: BillingInterval.Monthly,
      priceCents: "9900",
      signupFeeCents: "2500",
      trialDays: "7",
      contractLengthMonths: "",
      classAccessLimit: "12",
      autoRenew: true,
      isPublic: true
    });
    const invalid = buildMembershipPlanCreateScreen({
      permissions: [Permission.PlanRead],
      name: "",
      priceCents: "-1"
    });
    const edit = buildMembershipPlanEditScreen({
      plan: plans[0]!,
      permissions: [Permission.PlanRead, Permission.PlanWrite],
      priceCents: "10900",
      trialDays: "14",
      isPublic: false
    });
    const archived = buildMembershipPlanEditScreen({
      plan: plans[2]!,
      permissions: [Permission.PlanRead, Permission.PlanWrite]
    });
    const createSubmission = createMembershipPlanSubmission({
      name: "  Monthly Unlimited  ",
      description: "  Best for regular members  ",
      billingInterval: BillingInterval.Monthly,
      priceCents: "9900",
      signupFeeCents: "2500",
      trialDays: "7",
      classAccessLimit: "12",
      autoRenew: true,
      isPublic: true
    });
    const editSubmission = createMembershipPlanEditSubmission({
      name: "  Monthly Unlimited  ",
      description: " Updated pricing ",
      billingInterval: BillingInterval.Monthly,
      priceCents: "10900",
      signupFeeCents: "2500",
      trialDays: "14",
      autoRenew: true,
      classAccessLimit: "12",
      isPublic: false
    });

    expect(create.screen).toBe("membership_plan_create");
    expect(create.fields.name.value).toBe("Monthly Unlimited");
    expect(create.selectedBillingInterval).toBe(BillingInterval.Monthly);
    expect(create.autoRenew).toBe(true);
    expect(create.isPublic).toBe(true);
    expect(create.summaryLabel).toBe("Monthly plan at $99.00/month");
    expect(create.canSubmit).toBe(true);
    expect(create.action.disabled).toBe(false);
    expect(invalid.fields.name.error).toBe("Plan name is required.");
    expect(invalid.fields.priceCents.error).toBe("Enter a valid non-negative price.");
    expect(invalid.canSubmit).toBe(false);
    expect(edit.screen).toBe("membership_plan_edit");
    expect(edit.changedFields).toEqual(["priceCents", "trialDays", "isPublic"]);
    expect(edit.summaryLabel).toBe("Monthly plan at $109.00/month");
    expect(edit.canSubmit).toBe(true);
    expect(archived.archived).toBe(true);
    expect(archived.canSubmit).toBe(false);
    expect(createSubmission).toEqual({
      name: "Monthly Unlimited",
      description: "Best for regular members",
      billingInterval: BillingInterval.Monthly,
      priceCents: 9900,
      signupFeeCents: 2500,
      trialDays: 7,
      autoRenew: true,
      classAccessLimit: 12,
      isPublic: true
    });
    expect(editSubmission).toEqual({
      name: "Monthly Unlimited",
      description: "Updated pricing",
      billingInterval: BillingInterval.Monthly,
      priceCents: 10900,
      signupFeeCents: 2500,
      trialDays: 14,
      autoRenew: true,
      classAccessLimit: 12,
      isPublic: false
    });
  });

  it("builds membership plan archive flow with confirmation and permission blocking", () => {
    const active = buildMembershipPlanArchiveScreen({
      plan: plans[0]!,
      permissions: [Permission.PlanRead, Permission.PlanWrite]
    });
    const readOnly = buildMembershipPlanArchiveScreen({
      plan: plans[0]!,
      permissions: [Permission.PlanRead],
      confirmOpen: false
    });
    const archived = buildMembershipPlanArchiveScreen({
      plan: plans[2]!,
      permissions: [Permission.PlanRead, Permission.PlanWrite]
    });

    expect(active.screen).toBe("membership_plan_archive");
    expect(active.archived).toBe(false);
    expect(active.canArchive).toBe(true);
    expect(active.billingIntervalLabel).toBe("Monthly");
    expect(active.priceLabel).toBe("$99.00/month");
    expect(active.archiveAction.disabled).toBe(false);
    expect(active.confirmation.open).toBe(true);
    expect(active.confirmation.confirmAction.label).toBe("Archive plan");
    expect(active.confirmation.confirmDisabled).toBe(false);
    expect(active.summaryLabel).toBe("Archive Monthly Unlimited ($99.00/month)");
    expect(readOnly.canArchive).toBe(false);
    expect(readOnly.blockedReason).toBe("You do not have permission to archive membership plans.");
    expect(readOnly.archiveAction.disabled).toBe(true);
    expect(readOnly.confirmation.open).toBe(false);
    expect(readOnly.confirmation.confirmDisabled).toBe(true);
    expect(archived.archived).toBe(true);
    expect(archived.canArchive).toBe(false);
    expect(archived.blockedReason).toBe("Membership plan is already archived.");
    expect(archived.summaryLabel).toBe("Membership plan is already archived.");
  });
});
