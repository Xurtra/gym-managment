import { BillingInterval, PlanStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";
describe("MembershipPlanService", () => {
    it("creates pricing plans, updates plan details, and archives plans", async () => {
        const services = createServices(testConfig, fixedClock);
        const gymId = await createGym(services);
        const monthly = await services.membershipPlanService.create(gymId, planInput({ name: "Monthly Unlimited", billingInterval: BillingInterval.Monthly }));
        await services.membershipPlanService.create(gymId, planInput({ name: "Annual Unlimited", billingInterval: BillingInterval.Yearly, priceCents: 59900 }));
        await services.membershipPlanService.create(gymId, planInput({ name: "Drop In", billingInterval: BillingInterval.OneTime, priceCents: 2500 }));
        const packagePlan = await services.membershipPlanService.create(gymId, planInput({
            name: "10 Class Pack",
            billingInterval: BillingInterval.Package,
            priceCents: 18000,
            classAccessLimit: 10,
            autoRenew: false
        }));
        const updated = await services.membershipPlanService.update(gymId, packagePlan.id, {
            priceCents: 19000,
            description: "Ten classes with updated pricing."
        });
        const archived = await services.membershipPlanService.archive(gymId, monthly.id);
        const activePlans = await services.membershipPlanService.list(gymId);
        expect(updated.priceCents).toBe(19000);
        expect(updated.classAccessLimit).toBe(10);
        expect(archived.status).toBe(PlanStatus.Archived);
        expect(activePlans.map((plan) => plan.billingInterval).sort()).toEqual([
            BillingInterval.OneTime,
            BillingInterval.Package,
            BillingInterval.Yearly
        ]);
    });
    it("rejects duplicate active plan names", async () => {
        const services = createServices(testConfig, fixedClock);
        const gymId = await createGym(services);
        await services.membershipPlanService.create(gymId, planInput({ name: "Monthly Unlimited" }));
        await expect(services.membershipPlanService.create(gymId, planInput({ name: "monthly unlimited" }))).rejects.toThrow(/already exists/i);
    });
});
function planInput(overrides) {
    return {
        name: "Monthly Unlimited",
        billingInterval: BillingInterval.Monthly,
        priceCents: 9900,
        signupFeeCents: 0,
        trialDays: 0,
        autoRenew: true,
        isPublic: true,
        ...overrides
    };
}
async function createGym(services) {
    const owner = await services.authService.register({
        email: "owner@example.com",
        password: "Password123",
        firstName: "Demo",
        lastName: "Owner",
        gymName: "Demo Strength Club",
        timezone: "America/New_York",
        locale: "en-US"
    });
    if (!owner.gym) {
        throw new Error("Expected gym to be created.");
    }
    return owner.gym.id;
}
//# sourceMappingURL=membershipPlan.service.test.js.map