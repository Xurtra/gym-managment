import {
  AccessEventDecision,
  BookingSource,
  BookingStatus,
  ConsumerRecordStatus,
  LeadStage,
  MemberStatus
} from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { InMemoryStore } from "./inMemoryStore.js";
import type { AccessEvent, ClassBooking, Member } from "./entities.js";

function makeMember(gymId: string, overrides: Partial<Member> = {}): Member {
  return {
    id: randomUUID(),
    gymId,
    firstName: "Test",
    lastName: "Member",
    status: MemberStatus.Active,
    recordStatus: ConsumerRecordStatus.Active,
    leadStage: LeadStage.None,
    tagNames: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function makeBooking(classSessionId: string, overrides: Partial<ClassBooking> = {}): ClassBooking {
  return {
    id: randomUUID(),
    gymId: "gym-1",
    classSessionId,
    memberId: randomUUID(),
    status: BookingStatus.Booked,
    source: BookingSource.Member,
    bookedAt: new Date(),
    isLateCancellation: false,
    lateCancellationFeeCents: 0,
    staffOverride: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function makeAccessEvent(gymId: string, overrides: Partial<AccessEvent> = {}): AccessEvent {
  return {
    id: randomUUID(),
    gymId,
    deviceId: randomUUID(),
    locationId: randomUUID(),
    decision: AccessEventDecision.Unlock,
    reason: "allowed",
    occurredAt: new Date(),
    createdAt: new Date(),
    ...overrides
  };
}

describe("InMemoryStore — gym isolation", () => {
  it("listMembersForGym returns only members belonging to the requested gym", async () => {
    const store = new InMemoryStore();
    const memberA = makeMember("gym-a");
    const memberB = makeMember("gym-b");
    await store.members.createMember(memberA);
    await store.members.createMember(memberB);

    const result = await store.members.listMembersForGym("gym-a");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(memberA.id);
  });

  it("listMembersForGym returns empty array when gym has no members", async () => {
    const store = new InMemoryStore();
    await store.members.createMember(makeMember("gym-a"));
    const result = await store.members.listMembersForGym("gym-z");
    expect(result).toHaveLength(0);
  });
});

describe("InMemoryStore — booking sort order", () => {
  it("listClassBookingsForSession sorts by waitlist position ascending, then createdAt ascending", async () => {
    const store = new InMemoryStore();
    const sessionId = randomUUID();
    const t1 = new Date("2026-01-01T10:00:00.000Z");
    const t2 = new Date("2026-01-01T10:01:00.000Z");
    const t3 = new Date("2026-01-01T10:02:00.000Z");

    const booked = makeBooking(sessionId, { status: BookingStatus.Booked, createdAt: t2 });
    const waitlist2 = makeBooking(sessionId, {
      status: BookingStatus.Waitlisted,
      waitlistPosition: 2,
      createdAt: t3
    });
    const waitlist1 = makeBooking(sessionId, {
      status: BookingStatus.Waitlisted,
      waitlistPosition: 1,
      createdAt: t1
    });

    await store.bookings.createClassBooking(booked);
    await store.bookings.createClassBooking(waitlist2);
    await store.bookings.createClassBooking(waitlist1);

    const result = await store.bookings.listClassBookingsForSession(sessionId);
    expect(result).toHaveLength(3);
    // booked has no waitlistPosition (null → MAX_SAFE_INTEGER) so comes last
    expect(result[0]?.id).toBe(waitlist1.id);
    expect(result[1]?.id).toBe(waitlist2.id);
    expect(result[2]?.id).toBe(booked.id);
  });

  it("sorts bookings with equal waitlist positions by createdAt ascending", async () => {
    const store = new InMemoryStore();
    const sessionId = randomUUID();
    const earlier = makeBooking(sessionId, {
      waitlistPosition: 1,
      createdAt: new Date("2026-01-01T09:00:00.000Z")
    });
    const later = makeBooking(sessionId, {
      waitlistPosition: 1,
      createdAt: new Date("2026-01-01T10:00:00.000Z")
    });

    await store.bookings.createClassBooking(later);
    await store.bookings.createClassBooking(earlier);

    const result = await store.bookings.listClassBookingsForSession(sessionId);
    expect(result[0]?.id).toBe(earlier.id);
    expect(result[1]?.id).toBe(later.id);
  });
});

describe("InMemoryStore — access event ordering", () => {
  it("listAccessEventsForGym returns events in reverse chronological order (most recent first)", async () => {
    const store = new InMemoryStore();
    const event1 = makeAccessEvent("gym-x", { occurredAt: new Date("2026-01-01T08:00:00.000Z") });
    const event2 = makeAccessEvent("gym-x", { occurredAt: new Date("2026-01-01T09:00:00.000Z") });
    const event3 = makeAccessEvent("gym-x", { occurredAt: new Date("2026-01-01T10:00:00.000Z") });

    await store.accessControl.createAccessEvent(event1);
    await store.accessControl.createAccessEvent(event3);
    await store.accessControl.createAccessEvent(event2);

    const result = await store.accessControl.listAccessEventsForGym("gym-x");
    expect(result).toHaveLength(3);
    expect(result[0]?.id).toBe(event3.id);
    expect(result[1]?.id).toBe(event2.id);
    expect(result[2]?.id).toBe(event1.id);
  });

  it("listAccessEventsForGym excludes events from other gyms", async () => {
    const store = new InMemoryStore();
    await store.accessControl.createAccessEvent(makeAccessEvent("gym-a"));
    await store.accessControl.createAccessEvent(makeAccessEvent("gym-b"));

    const result = await store.accessControl.listAccessEventsForGym("gym-a");
    expect(result).toHaveLength(1);
  });
});

describe("InMemoryStore — transaction", () => {
  it("runs the work callback and returns its result", async () => {
    const store = new InMemoryStore();
    const result = await store.transaction(async () => "done");
    expect(result).toBe("done");
  });

  it("propagates errors thrown inside the work callback", async () => {
    const store = new InMemoryStore();
    await expect(
      store.transaction(async () => {
        throw new Error("work-error");
      })
    ).rejects.toThrow("work-error");
  });

  it("mutations inside the callback are visible on the same store instance", async () => {
    const store = new InMemoryStore();
    const member = makeMember("gym-1");
    await store.transaction(async () => {
      await store.members.createMember(member);
    });
    const all = await store.members.listMembersForGym("gym-1");
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe(member.id);
  });
});
