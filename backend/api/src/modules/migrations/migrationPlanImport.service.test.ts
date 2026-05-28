import { describe, expect, it } from "vitest";
import type { MigrationColumnMapping } from "../../infrastructure/store/entities.js";
import { InMemoryStore } from "../../infrastructure/store/inMemoryStore.js";
import { MigrationPlanImportService } from "./migrationPlanImport.service.js";

const clock = {
  now: () => new Date("2026-05-25T12:00:00.000Z")
};

describe("MigrationPlanImportService", () => {
  it("stages membership plans, validates rows, maps plan types, and approves non-critical rows", async () => {
    const store = new InMemoryStore();
    const service = new MigrationPlanImportService(store, clock);
    const created = await service.createBatch("gym-id", "user-id");
    const csv = [
      "Plan Name,Price,Billing Frequency,Status",
      "Unlimited Monthly,99,monthly,active",
      "Founder,75,monthly,active",
      "Free Staff,0,,active",
      ",abc,monthly,active"
    ].join("\n");

    let state = await service.uploadFile("gym-id", created.batch.id, "user-id", {
      fileName: "plans.csv",
      contentType: "text/csv",
      base64Data: Buffer.from(csv, "utf8").toString("base64")
    });
    const file = state.files[0]!;

    state = await service.generateColumnMappings("gym-id", created.batch.id, file.id, "user-id");
    const mappings = state.columnMappingsByFile[file.id]! as MigrationColumnMapping[];
    state = await service.approveColumnMappings("gym-id", created.batch.id, file.id, "user-id", {
      mappings: mappings.map((mapping) => ({
        sourceColumn: mapping.sourceColumn,
        targetField: mapping.targetField as never,
        confidence: mapping.confidence ?? 1
      }))
    });

    state = await service.stageMembershipPlans("gym-id", created.batch.id, file.id, "user-id");
    expect(state.stagedPlans).toHaveLength(4);
    expect(state.stagedPlans.find((plan) => plan.planName === "Unlimited Monthly")?.price).toBe(99);
    expect(state.validationErrors.some((error) => error.errorCode === "plan_name_required")).toBe(true);
    expect(state.validationErrors.some((error) => error.errorCode === "price_not_numeric")).toBe(true);

    state = await service.generatePlanMappings("gym-id", created.batch.id, "user-id");
    expect(state.planMappings.find((mapping) => mapping.oldPlanName === "Unlimited Monthly")?.suggestedPlanType)
      .toBe("Monthly Membership");
    expect(state.planMappings.find((mapping) => mapping.oldPlanName === "Founder")?.requiresReview)
      .toBe(true);

    state = await service.approvePlanMappings("gym-id", created.batch.id, "user-id", {
      mappings: state.planMappings.map((mapping) => ({
        mappingId: mapping.id,
        oldPlanName: mapping.oldPlanName,
        finalPlanType: mapping.suggestedPlanType
      }))
    });
    expect(state.stagedPlans.find((plan) => plan.planName === "Free Staff")?.planType)
      .toBe("Free/Comped Plan");

    state = await service.approveStagedPlans("gym-id", created.batch.id, "user-id", {
      approveAllReady: true
    });
    const unnamedPlan = state.stagedPlans.find((plan) => plan.sourceRowNumber === 5);
    expect(unnamedPlan?.approved).toBe(false);
    expect(state.stagedPlans.filter((plan) => plan.approved).length).toBeGreaterThan(0);
    expect(store.snapshot().membershipPlans).toHaveLength(0);
  });
});
