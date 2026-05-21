import {
  AccessDeviceStatus,
  AccessEventDecision,
  BillingInterval,
  MemberStatus,
  MembershipStatus
} from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices, type Services } from "../../app.js";
import type { Member } from "../../infrastructure/store/entities.js";
import { testConfig } from "../../testUtils.js";

describe("AccessControlService", () => {
  it("registers devices, authorizes matching plan access, and logs unlock events", async () => {
    const clock = mutableClock("2026-05-16T12:00:00.000Z");
    const services = createServices(testConfig, clock);
    const { gymId, locationId, planId, member } = await createAccessFixture(services);
    const registered = await services.accessControlService.registerDevice(gymId, {
      name: "Front Door",
      locationId
    });
    await services.accessControlService.createRule(gymId, {
      name: "Unlimited plan front door",
      locationId,
      planId
    });

    const response = await services.accessControlService.authorizeDoor({
      apiKey: registered.apiKey,
      barcode: member.barcode
    });
    const events = await services.accessControlService.listEvents(gymId);

    expect(registered.apiKey).toMatch(/^ak_/);
    expect(registered.device.apiKeyPreview).toContain("...");
    expect(response.unlock).toBe(true);
    expect(response.reason).toBe("access_granted");
    expect(response.memberId).toBe(member.id);
    expect(events).toHaveLength(1);
    expect(events[0]?.decision).toBe(AccessEventDecision.Unlock);
  });

  it("denies and logs access when rules do not match or members are not active", async () => {
    const services = createServices(testConfig, mutableClock("2026-05-16T12:00:00.000Z"));
    const { gymId, locationId, member } = await createAccessFixture(services);
    const frozen = await createMember(services, gymId, "Frozen", "ACCESS-FROZEN", MemberStatus.Frozen);
    const registered = await services.accessControlService.registerDevice(gymId, {
      name: "Side Door",
      locationId
    });

    const noRule = await services.accessControlService.authorizeDoor({
      apiKey: registered.apiKey,
      memberId: member.id
    });
    const frozenDenied = await services.accessControlService.authorizeDoor({
      apiKey: registered.apiKey,
      barcode: frozen.barcode
    });
    const events = await services.accessControlService.listEvents(gymId);

    expect(noRule.unlock).toBe(false);
    expect(noRule.reason).toBe("access_rule_not_matched");
    expect(frozenDenied.unlock).toBe(false);
    expect(frozenDenied.reason).toBe("member_status_frozen");
    expect(events.map((event) => event.decision)).toEqual([
      AccessEventDecision.Deny,
      AccessEventDecision.Deny
    ]);
    expect(events.map((event) => event.reason)).toContain("member_status_frozen");
  });

  it("tracks heartbeats, detects offline devices, and rotates API keys", async () => {
    const clock = mutableClock("2026-05-16T12:00:00.000Z");
    const services = createServices(testConfig, clock);
    const { gymId, locationId } = await createAccessFixture(services);
    const registered = await services.accessControlService.registerDevice(gymId, {
      name: "Back Door",
      locationId
    });

    const heartbeat = await services.accessControlService.heartbeat({ apiKey: registered.apiKey });
    clock.set("2026-05-16T12:03:01.000Z");
    const devices = await services.accessControlService.listDevices(gymId);
    const rotated = await services.accessControlService.rotateDeviceApiKey(
      gymId,
      registered.device.id
    );

    expect(heartbeat.lastHeartbeatAt?.toISOString()).toBe("2026-05-16T12:00:00.000Z");
    expect(devices[0]?.status).toBe(AccessDeviceStatus.Offline);
    expect(rotated.apiKey).not.toBe(registered.apiKey);
    expect(rotated.device.status).toBe(AccessDeviceStatus.Active);
    await expect(
      services.accessControlService.heartbeat({ apiKey: registered.apiKey })
    ).rejects.toThrow(/device/i);
    await expect(services.accessControlService.heartbeat({ apiKey: rotated.apiKey })).resolves.toBeTruthy();
  });
});

async function createAccessFixture(services: Services) {
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
  const gymId = owner.gym.id;
  const location = await services.locationService.create(gymId, {
    name: "Main Floor",
    address: {
      line1: "100 Fitness Ave",
      city: "New York",
      region: "NY",
      postalCode: "10001",
      country: "US"
    },
    timezone: "America/New_York",
    operatingHours: {
      mon: [{ opensAt: "06:00", closesAt: "22:00" }]
    }
  });
  const plan = await services.membershipPlanService.create(gymId, {
    name: "Unlimited",
    billingInterval: BillingInterval.Monthly,
    priceCents: 9900,
    signupFeeCents: 0,
    trialDays: 0,
    autoRenew: true,
    isPublic: true
  });
  const member = await createMember(services, gymId, "Jamie", "ACCESS-100", MemberStatus.Active);
  await services.memberMembershipService.assignPlan(gymId, member.id, {
    planId: plan.id,
    status: MembershipStatus.Active
  });
  return {
    gymId,
    locationId: location.id,
    planId: plan.id,
    member
  };
}

function createMember(
  services: Services,
  gymId: string,
  firstName: string,
  barcode: string,
  status: MemberStatus
): Promise<Member> {
  return services.memberService.create(gymId, {
    firstName,
    lastName: "Member",
    email: `${firstName.toLowerCase()}@example.com`,
    barcode,
    status,
    tagNames: []
  });
}

function mutableClock(initial: string) {
  let now = new Date(initial);
  return {
    now: () => now,
    set: (value: string) => {
      now = new Date(value);
    }
  };
}
