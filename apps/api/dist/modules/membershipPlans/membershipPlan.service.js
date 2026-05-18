import { PlanStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
export class MembershipPlanService {
    repositories;
    clock;
    constructor(repositories, clock) {
        this.repositories = repositories;
        this.clock = clock;
    }
    async list(gymId) {
        return (await this.repositories.membershipPlans.listMembershipPlansForGym(gymId)).filter((plan) => plan.status !== PlanStatus.Archived);
    }
    async create(gymId, input) {
        await this.ensureUniqueName(gymId, input.name);
        const now = this.clock.now();
        const plan = {
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
    async update(gymId, planId, input) {
        const existing = await this.getActive(gymId, planId);
        if (input.name) {
            await this.ensureUniqueName(gymId, input.name, planId);
        }
        const updated = {
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
    async archive(gymId, planId) {
        const existing = await this.getActive(gymId, planId);
        const now = this.clock.now();
        const archived = {
            ...existing,
            status: PlanStatus.Archived,
            archivedAt: now,
            updatedAt: now
        };
        return this.repositories.membershipPlans.updateMembershipPlan(archived);
    }
    async getActive(gymId, planId) {
        const plan = await this.repositories.membershipPlans.getMembershipPlan(planId);
        if (!plan || plan.gymId !== gymId || plan.status === PlanStatus.Archived) {
            throw notFound("Membership plan was not found.");
        }
        return plan;
    }
    async ensureUniqueName(gymId, name, ignorePlanId) {
        const plans = await this.repositories.membershipPlans.listMembershipPlansForGym(gymId);
        const duplicate = plans.find((plan) => plan.id !== ignorePlanId &&
            plan.status !== PlanStatus.Archived &&
            plan.name.toLowerCase() === name.toLowerCase());
        if (duplicate) {
            throw conflict("A membership plan with this name already exists.", "plan_name_exists");
        }
    }
}
function applyOptionalPlanFields(plan, input) {
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
//# sourceMappingURL=membershipPlan.service.js.map