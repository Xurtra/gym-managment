import {
  BillingInterval,
  ConsumerRecordStatus,
  ConsumerSegment,
  LeadStage,
  MemberStatus,
  MembershipStatus
} from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices, type Services } from "../../app.js";
import { createGym, fixedClock, testConfig } from "../../testUtils.js";

describe("MemberService", () => {
  it("creates, updates, and archives members inside a gym scope", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);

    const created = await services.memberService.create(gymId, {
      firstName: "Jamie",
      lastName: "Rivera",
      email: "jamie@example.com",
      phone: "555-0101",
      barcode: "MEM-100",
      profileImageUrl: "https://example.com/jamie.jpg",
      status: MemberStatus.Active,
      emergencyContact: {
        name: "Avery Rivera",
        phone: "555-0199",
        relationship: "Spouse"
      },
      notes: "Prefers morning classes.",
      tagNames: ["founding-member"]
    });
    const updated = await services.memberService.update(gymId, created.id, {
      status: MemberStatus.Frozen,
      phone: "555-0102",
      tagNames: ["founding-member", "pt-interest"]
    });
    const archived = await services.memberService.archive(gymId, created.id);

    expect(created.gymId).toBe(gymId);
    expect(created.recordStatus).toBe(ConsumerRecordStatus.Active);
    expect(created.leadStage).toBe(LeadStage.None);
    expect(created.profileImageUrl).toBe("https://example.com/jamie.jpg");
    expect(created.emergencyContact?.relationship).toBe("Spouse");
    expect(updated.status).toBe(MemberStatus.Frozen);
    expect(updated.profileImageUrl).toBe("https://example.com/jamie.jpg");
    expect(updated.tagNames).toContain("pt-interest");
    expect(archived.status).toBe(MemberStatus.Archived);
    expect(await services.memberService.list(gymId)).toHaveLength(0);
  });

  it("normalizes legacy lead status and derives overlapping consumer segments", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);
    const lead = await services.memberService.create(gymId, {
      firstName: "Casey",
      lastName: "Prospect",
      email: "casey@example.com",
      status: MemberStatus.Lead,
      tagNames: ["intro-offer"]
    });
    const dropIn = await services.membershipPlanService.create(gymId, {
      name: "Drop In",
      billingInterval: BillingInterval.OneTime,
      priceCents: 2500,
      signupFeeCents: 0,
      trialDays: 0,
      autoRenew: false,
      isPublic: true
    });

    await services.memberMembershipService.assignPlan(gymId, lead.id, {
      planId: dropIn.id,
      status: MembershipStatus.Active
    });
    const [consumer] = await services.memberService.list(gymId);

    expect(lead.status).toBe(MemberStatus.Active);
    expect(lead.leadStage).toBe(LeadStage.Open);
    expect(dropIn.classAccessLimit).toBe(1);
    expect(consumer?.segments.sort()).toEqual([
      ConsumerSegment.Customer,
      ConsumerSegment.Lead
    ]);
    expect(consumer?.isLead).toBe(true);
    expect(consumer?.isCustomer).toBe(true);
    expect(consumer?.isMember).toBe(false);
  });

  it("rejects duplicate active member email addresses and barcodes", async () => {
    const services = createServices(testConfig, fixedClock);
    const gymId = await createGym(services);

    await services.memberService.create(gymId, {
      firstName: "Jamie",
      lastName: "Rivera",
      email: "jamie@example.com",
      barcode: "MEM-100",
      status: MemberStatus.Active,
      tagNames: []
    });

    await expect(
      services.memberService.create(gymId, {
        firstName: "Jordan",
        lastName: "Lee",
        email: "JAMIE@example.com",
        status: MemberStatus.Active,
        tagNames: []
      })
    ).rejects.toThrow(/already exists/i);

    await expect(
      services.memberService.create(gymId, {
        firstName: "Taylor",
        lastName: "Morgan",
        barcode: "MEM-100",
        status: MemberStatus.Active,
        tagNames: []
      })
    ).rejects.toThrow(/already exists/i);
  });
});

