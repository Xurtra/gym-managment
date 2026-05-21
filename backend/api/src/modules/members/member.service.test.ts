import { MemberStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { createServices, type Services } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";

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
    expect(created.profileImageUrl).toBe("https://example.com/jamie.jpg");
    expect(created.emergencyContact?.relationship).toBe("Spouse");
    expect(updated.status).toBe(MemberStatus.Frozen);
    expect(updated.profileImageUrl).toBe("https://example.com/jamie.jpg");
    expect(updated.tagNames).toContain("pt-interest");
    expect(archived.status).toBe(MemberStatus.Archived);
    expect(await services.memberService.list(gymId)).toHaveLength(0);
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

async function createGym(services: Services) {
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
