import { PlanStatus } from "@gym-platform/constants";
import type {
  MembershipPlanCreateInput,
  MembershipPlanUpdateInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
import type { MembershipPlan } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export class MembershipPlanService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async list(gymId: string) {
    return (await this.repositories.membershipPlans.listMembershipPlansForGym(gymId)).filter(
      (plan) => plan.status !== PlanStatus.Archived
    );
  }

  async create(gymId: string, input: MembershipPlanCreateInput) {
    await this.ensureUniqueName(gymId, input.name);
    const now = this.clock.now();
    const plan: MembershipPlan = {
      id: randomUUID(),
      gymId,
      name: input.name,
      billingInterval: input.billingInterval,
      priceCents: input.priceCents,
      signupFeeCents: input.signupFeeCents,
      trialDays: input.trialDays,
      autoRenew: input.autoRenew,
      isPublic: input.isPublic,
      status: PlanStatus.Active,
      createdAt: now,
      updatedAt: now
    };
    applyOptionalPlanFields(plan, input);
    return this.repositories.membershipPlans.createMembershipPlan(plan);
  }

  async update(gymId: string, planId: string, input: MembershipPlanUpdateInput) {
    const existing = await this.getActive(gymId, planId);
    if (input.name) {
      await this.ensureUniqueName(gymId, input.name, planId);
    }
    const updated: MembershipPlan = {
      ...existing,
      name: input.name ?? existing.name,
      billingInterval: input.billingInterval ?? existing.billingInterval,
      priceCents: input.priceCents ?? existing.priceCents,
      signupFeeCents: input.signupFeeCents ?? existing.signupFeeCents,
      trialDays: input.trialDays ?? existing.trialDays,
      autoRenew: input.autoRenew ?? existing.autoRenew,
      isPublic: input.isPublic ?? existing.isPublic,
      updatedAt: this.clock.now()
    };
    applyOptionalPlanFields(updated, input);
    return this.repositories.membershipPlans.updateMembershipPlan(updated);
  }

  async archive(gymId: string, planId: string) {
    const existing = await this.getActive(gymId, planId);
    const now = this.clock.now();
    const archived: MembershipPlan = {
      ...existing,
      status: PlanStatus.Archived,
      archivedAt: now,
      updatedAt: now
    };
    return this.repositories.membershipPlans.updateMembershipPlan(archived);
  }

  private async getActive(gymId: string, planId: string) {
    const plan = await this.repositories.membershipPlans.getMembershipPlan(planId);
    if (!plan || plan.gymId !== gymId || plan.status === PlanStatus.Archived) {
      throw notFound("Membership plan was not found.");
    }
    return plan;
  }

  private async ensureUniqueName(gymId: string, name: string, ignorePlanId?: string) {
    const plans = await this.repositories.membershipPlans.listMembershipPlansForGym(gymId);
    const duplicate = plans.find(
      (plan) =>
        plan.id !== ignorePlanId &&
        plan.status !== PlanStatus.Archived &&
        plan.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      throw conflict("A membership plan with this name already exists.", "plan_name_exists");
    }
  }
}

function applyOptionalPlanFields(plan: MembershipPlan, input: MembershipPlanCreateInput | MembershipPlanUpdateInput) {
  if (input.description !== undefined) {
    plan.description = input.description;
  }
  if (input.contractLengthMonths !== undefined) {
    plan.contractLengthMonths = input.contractLengthMonths;
  }
  if (input.classAccessLimit !== undefined) {
    plan.classAccessLimit = input.classAccessLimit;
  }
}
