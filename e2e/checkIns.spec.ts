import { expect, test } from "@playwright/test";
import { loginViaUi, navigateToDashboardView, registerOwnerViaApi } from "./helpers.js";

test.describe("Check-Ins", () => {
  test("owner can navigate to the check-in dashboard", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    await navigateToDashboardView(page, "check_in");
    await expect(page.locator("h2, h3")).toContainText(/check.in/i);
  });

  test("check-in flow via API — active member is allowed, expired member is denied", async ({
    request
  }) => {
    const API_URL = "http://127.0.0.1:4000";
    const suffix = Date.now().toString();

    // Register gym owner
    const ownerRes = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: `checkin-owner-${suffix}@e2e.test`,
        password: "Password123!",
        firstName: "CheckIn",
        lastName: "Owner",
        gymName: `CheckIn Gym ${suffix}`,
        timezone: "America/New_York",
        locale: "en-US"
      }
    });
    expect(ownerRes.status()).toBe(200);
    const { accessToken, gym } = await ownerRes.json() as { accessToken: string; gym: { id: string } };
    const gymId = gym.id;
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Create a location
    const locationRes = await request.post(`${API_URL}/gyms/${gymId}/locations`, {
      headers: authHeader,
      data: {
        name: "Front Desk",
        address: { line1: "1 Main St", city: "New York", region: "NY", postalCode: "10001", country: "US" },
        timezone: "America/New_York",
        operatingHours: {}
      }
    });
    expect(locationRes.status()).toBe(200);
    const { location } = await locationRes.json() as { location: { id: string } };

    // Create a plan and an active member
    const planRes = await request.post(`${API_URL}/gyms/${gymId}/membership-plans`, {
      headers: authHeader,
      data: { name: "Monthly", billingInterval: "monthly", priceCents: 5000, signupFeeCents: 0, trialDays: 0, autoRenew: true, isPublic: true }
    });
    expect(planRes.status()).toBe(200);
    const { plan } = await planRes.json() as { plan: { id: string } };

    const memberRes = await request.post(`${API_URL}/gyms/${gymId}/members`, {
      headers: authHeader,
      data: { firstName: "Active", lastName: "Member", email: `active-${suffix}@e2e.test`, status: "active" }
    });
    expect(memberRes.status()).toBe(200);
    const { member } = await memberRes.json() as { member: { id: string } };

    await request.post(`${API_URL}/gyms/${gymId}/members/${member.id}/memberships`, {
      headers: authHeader,
      data: { planId: plan.id, startsAt: new Date().toISOString() }
    });

    // Check in the active member — should be allowed
    const checkInRes = await request.post(`${API_URL}/gyms/${gymId}/check-ins`, {
      headers: authHeader,
      data: { memberId: member.id, locationId: location.id, method: "manual" }
    });
    expect(checkInRes.status()).toBe(200);
    const { checkIn } = await checkInRes.json() as { checkIn: { decision: string } };
    expect(checkIn.decision).toBe("allowed");

    // Create a member with no membership — should be denied
    const noMembershipRes = await request.post(`${API_URL}/gyms/${gymId}/members`, {
      headers: authHeader,
      data: { firstName: "No", lastName: "Membership", email: `nomem-${suffix}@e2e.test`, status: "active" }
    });
    expect(noMembershipRes.status()).toBe(200);
    const { member: noMember } = await noMembershipRes.json() as { member: { id: string } };

    const deniedRes = await request.post(`${API_URL}/gyms/${gymId}/check-ins`, {
      headers: authHeader,
      data: { memberId: noMember.id, locationId: location.id, method: "manual" }
    });
    expect(deniedRes.status()).toBe(200);
    const { checkIn: deniedCheckIn } = await deniedRes.json() as { checkIn: { decision: string } };
    expect(deniedCheckIn.decision).toBe("denied");
  });
});
