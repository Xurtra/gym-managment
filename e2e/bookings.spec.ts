import { expect, test } from "@playwright/test";
import { loginViaUi, navigateToDashboardView, registerOwnerViaApi } from "./helpers.js";

test.describe("Bookings", () => {
  test("owner can navigate to the bookings view", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    await navigateToDashboardView(page, "bookings");
    await expect(page.locator("h2, h3")).toContainText(/booking/i);
  });

  test("owner can navigate to the classes view", async ({ page, request }) => {
    const gym = await registerOwnerViaApi(request);
    await loginViaUi(page, gym);

    await navigateToDashboardView(page, "classes");
    await expect(page.locator("h2, h3")).toContainText(/class/i);
  });

  test("full booking flow via API — book, check capacity, cancel, verify waitlist promotion", async ({
    request
  }) => {
    const API_URL = "http://127.0.0.1:4000";

    // Register owner and get token
    const suffix = Date.now().toString();
    const ownerRes = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: `booking-owner-${suffix}@e2e.test`,
        password: "Password123!",
        firstName: "Booking",
        lastName: "Owner",
        gymName: `Booking Gym ${suffix}`,
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
        name: "Main Floor",
        address: { line1: "100 Fitness Ave", city: "New York", region: "NY", postalCode: "10001", country: "US" },
        timezone: "America/New_York",
        operatingHours: {}
      }
    });
    expect(locationRes.status()).toBe(200);
    const { location } = await locationRes.json() as { location: { id: string } };

    // Create a class type
    const classTypeRes = await request.post(`${API_URL}/gyms/${gymId}/class-types`, {
      headers: authHeader,
      data: { name: "Yoga", defaultDurationMinutes: 60, defaultCapacity: 1, defaultWaitlistCapacity: 1, isPublic: true }
    });
    expect(classTypeRes.status()).toBe(200);
    const { classType } = await classTypeRes.json() as { classType: { id: string } };

    // Create a class session with capacity 1
    const sessionRes = await request.post(`${API_URL}/gyms/${gymId}/class-sessions`, {
      headers: authHeader,
      data: {
        classTypeId: classType.id,
        locationId: location.id,
        startsAt: new Date(Date.now() + 86_400_000).toISOString(),
        endsAt: new Date(Date.now() + 86_400_000 + 3_600_000).toISOString(),
        capacity: 1,
        waitlistCapacity: 1,
        cancellationCutoffMinutes: 0,
        lateCancellationFeeCents: 0
      }
    });
    expect(sessionRes.status()).toBe(200);
    const { session } = await sessionRes.json() as { session: { id: string } };

    // Create a plan
    const planRes = await request.post(`${API_URL}/gyms/${gymId}/membership-plans`, {
      headers: authHeader,
      data: { name: "Monthly", billingInterval: "monthly", priceCents: 5000, signupFeeCents: 0, trialDays: 0, autoRenew: true, isPublic: true }
    });
    expect(planRes.status()).toBe(200);
    const { plan } = await planRes.json() as { plan: { id: string } };

    // Register two members and assign the plan
    async function createMemberWithPlan(email: string) {
      const memberRes = await request.post(`${API_URL}/gyms/${gymId}/members`, {
        headers: authHeader,
        data: { firstName: "Test", lastName: "Member", email, status: "active" }
      });
      expect(memberRes.status()).toBe(200);
      const { member } = await memberRes.json() as { member: { id: string } };
      const membershipRes = await request.post(`${API_URL}/gyms/${gymId}/members/${member.id}/memberships`, {
        headers: authHeader,
        data: { planId: plan.id, startsAt: new Date().toISOString() }
      });
      expect(membershipRes.status()).toBe(200);
      return member.id;
    }

    const [memberId1, memberId2] = await Promise.all([
      createMemberWithPlan(`m1-${suffix}@e2e.test`),
      createMemberWithPlan(`m2-${suffix}@e2e.test`)
    ]);

    // Book the session with member 1
    const bookRes = await request.post(`${API_URL}/gyms/${gymId}/class-sessions/${session.id}/bookings`, {
      headers: authHeader,
      data: { memberId: memberId1 }
    });
    expect(bookRes.status()).toBe(200);
    const { booking } = await bookRes.json() as { booking: { id: string; status: string } };
    expect(booking.status).toBe("booked");

    // Member 2 joins waitlist (capacity is full)
    const waitlistRes = await request.post(`${API_URL}/gyms/${gymId}/class-sessions/${session.id}/waitlist`, {
      headers: authHeader,
      data: { memberId: memberId2 }
    });
    expect(waitlistRes.status()).toBe(200);
    const { booking: waitlisted } = await waitlistRes.json() as { booking: { status: string; waitlistPosition: number } };
    expect(waitlisted.status).toBe("waitlisted");
    expect(waitlisted.waitlistPosition).toBe(1);

    // Cancel member 1's booking — should auto-promote member 2
    const cancelRes = await request.delete(`${API_URL}/gyms/${gymId}/class-bookings/${booking.id}`);
    expect(cancelRes.status()).toBe(200);
    const { promotedBooking } = await cancelRes.json() as { promotedBooking?: { status: string } };
    expect(promotedBooking?.status).toBe("booked");
  });
});
