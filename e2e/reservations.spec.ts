import { type APIRequestContext, type Page } from "@playwright/test";
import { expect, test } from "./observableTest.js";
import { loginViaUi, navigateToDashboardView, registerOwnerViaApi, type TestGym } from "./helpers.js";

const API_URL = "http://127.0.0.1:4000";

interface LocationResponse {
  id: string;
}

interface MemberResponse {
  id: string;
}

interface ResourceResponse {
  id: string;
  locationId?: string;
  name: string;
  paymentRequirement: string;
  isBookable: boolean;
}

interface ResourceListResponse {
  resources: ResourceResponse[];
}

interface ResourceAvailabilityResponse {
  available: boolean;
  allocations: Array<{
    id: string;
    source: string;
  }>;
}

interface FacilityReservationResponse {
  id: string;
  resourceId: string;
  memberId: string;
  status: string;
  amountCents: number;
  note?: string;
  paymentReference?: string;
  cancellationReason?: string;
}

interface FacilityReservationListResponse {
  reservations: FacilityReservationResponse[];
}

interface ReservationFixture {
  gym: TestGym;
  member: MemberResponse;
  resource: ResourceResponse;
}

test.describe("Reservations", () => {
  test("full facility reservation flow via live API", async ({ request }) => {
    const fixture = await createReservationFixture(request);
    const authHeaders = { Authorization: `Bearer ${fixture.gym.accessToken}` };
    const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const listedResources = await getJson<ResourceListResponse>(
      request,
      `${API_URL}/gyms/${fixture.gym.gymId}/resources?locationId=${fixture.resource.locationId}`,
      authHeaders
    );
    const initialAvailability = await getJson<ResourceAvailabilityResponse>(
      request,
      `${API_URL}/gyms/${fixture.gym.gymId}/resources/${fixture.resource.id}/availability?from=${encodeURIComponent(startsAt)}&to=${encodeURIComponent(endsAt)}`,
      authHeaders
    );
    const reservation = await postJson<FacilityReservationResponse>(
      request,
      `${API_URL}/gyms/${fixture.gym.gymId}/facility-reservations`,
      {
        resourceId: fixture.resource.id,
        memberId: fixture.member.id,
        startsAt,
        endsAt,
        note: "Front desk booked",
        paymentReference: "pos-sale-42",
        overrideConflict: false
      },
      authHeaders
    );
    const listedReservations = await getJson<FacilityReservationListResponse>(
      request,
      `${API_URL}/gyms/${fixture.gym.gymId}/facility-reservations`,
      authHeaders
    );
    const detail = await getJson<FacilityReservationResponse>(
      request,
      `${API_URL}/gyms/${fixture.gym.gymId}/facility-reservations/${reservation.id}`,
      authHeaders
    );
    const blockedAvailability = await getJson<ResourceAvailabilityResponse>(
      request,
      `${API_URL}/gyms/${fixture.gym.gymId}/resources/${fixture.resource.id}/availability?from=${encodeURIComponent(startsAt)}&to=${encodeURIComponent(endsAt)}`,
      authHeaders
    );
    const cancelled = await deleteJson<FacilityReservationResponse>(
      request,
      `${API_URL}/gyms/${fixture.gym.gymId}/facility-reservations/${reservation.id}`,
      { reason: "Customer changed plans" },
      authHeaders
    );

    expect(listedResources.resources.map((entry) => entry.id)).toContain(fixture.resource.id);
    expect(initialAvailability.available).toBe(true);
    expect(initialAvailability.allocations).toHaveLength(0);
    expect(reservation.resourceId).toBe(fixture.resource.id);
    expect(reservation.memberId).toBe(fixture.member.id);
    expect(reservation.status).toBe("confirmed");
    expect(reservation.amountCents).toBe(3500);
    expect(reservation.note).toBe("Front desk booked");
    expect(reservation.paymentReference).toBe("pos-sale-42");
    expect(listedReservations.reservations).toHaveLength(1);
    expect(detail.id).toBe(reservation.id);
    expect(blockedAvailability.available).toBe(false);
    expect(blockedAvailability.allocations[0]?.source).toBe("facility_reservation");
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cancellationReason).toBe("Customer changed plans");
  });

  test("owner can navigate to the React bookings dashboard after reservation setup", async ({ page, request }) => {
    const fixture = await createReservationFixture(request);
    await loginViaUi(page, fixture.gym);

    await navigateToDashboardView(page, "bookings");
    await expect(page.getByRole("heading", { name: "Bookings", level: 1 })).toBeVisible();
  });
});

async function createReservationFixture(request: APIRequestContext): Promise<ReservationFixture> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const gym = await registerOwnerViaApi(request, `reservations-${suffix}`);
  const authHeaders = { Authorization: `Bearer ${gym.accessToken}` };

  const location = await postJson<LocationResponse>(
    request,
    `${API_URL}/gyms/${gym.gymId}/locations`,
    {
      name: `Reservations Club ${suffix}`,
      address: {
        line1: "20 Court St",
        city: "Brooklyn",
        region: "NY",
        postalCode: "11201",
        country: "US"
      },
      timezone: "America/New_York"
    },
    authHeaders
  );
  const member = await postJson<MemberResponse>(
    request,
    `${API_URL}/gyms/${gym.gymId}/members`,
    {
      firstName: "Ari",
      lastName: "Reservation",
      email: `ari-${suffix}@e2e.test`,
      status: "active",
      tagNames: []
    },
    authHeaders
  );
  const resource = await postJson<ResourceResponse>(
    request,
    `${API_URL}/gyms/${gym.gymId}/resources`,
    {
      locationId: location.id,
      name: `Court ${suffix}`,
      resourceType: "court",
      pricing: { amountCents: 3500 },
      paymentRequirement: "pay_later"
    },
    authHeaders
  );

  expect(resource.locationId).toBe(location.id);
  expect(resource.isBookable).toBe(true);
  expect(resource.paymentRequirement).toBe("pay_later");

  return { gym, member, resource };
}

async function getJson<T>(request: APIRequestContext, url: string, headers?: Record<string, string>) {
  const response = await request.get(url, { headers });
  expect(response.status()).toBe(200);
  return (await response.json()) as T;
}

async function postJson<T>(
  request: APIRequestContext,
  url: string,
  data: unknown,
  headers?: Record<string, string>
) {
  const response = await request.post(url, { headers: jsonHeaders(headers), data });
  expect(response.status()).toBe(200);
  return (await response.json()) as T;
}

async function deleteJson<T>(
  request: APIRequestContext,
  url: string,
  data: unknown,
  headers?: Record<string, string>
) {
  const response = await request.delete(url, { headers: jsonHeaders(headers), data });
  expect(response.status()).toBe(200);
  return (await response.json()) as T;
}

function jsonHeaders(headers: Record<string, string> | undefined) {
  return {
    "content-type": "application/json",
    ...headers
  };
}

function toDatetimeLocal(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}
