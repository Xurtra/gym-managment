import { ConsumerSegment, LeadStage, MemberStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  buildFakeConsumers,
  consumerSegmentLabel,
  consumerSummary,
  consumersForSegment,
  type ConsumerLike
} from "./consumerData.js";

describe("consumer data simulation", () => {
  it("derives overlapping consumer segments from simulated user records", () => {
    const consumers: ConsumerLike[] = [
      {
        status: MemberStatus.Active,
        leadStage: LeadStage.Open,
        segments: [ConsumerSegment.Lead, ConsumerSegment.Customer],
        isLead: true,
        isCustomer: true,
        isMember: false
      },
      {
        status: MemberStatus.Active,
        leadStage: LeadStage.None,
        segments: [ConsumerSegment.Customer, ConsumerSegment.Member],
        isLead: false,
        isCustomer: true,
        isMember: true
      },
      {
        status: MemberStatus.Active,
        leadStage: LeadStage.Open,
        segments: [ConsumerSegment.Lead],
        isLead: true,
        isCustomer: false,
        isMember: false
      },
      {
        status: MemberStatus.Active,
        leadStage: LeadStage.None,
        segments: [ConsumerSegment.Member],
        isLead: false,
        isCustomer: false,
        isMember: true
      },
      {
        status: MemberStatus.Frozen,
        leadStage: LeadStage.None,
        segments: [],
        isLead: false,
        isCustomer: false,
        isMember: false
      }
    ];

    expect(consumerSummary(consumers)).toEqual({
      total: 5,
      members: 2,
      customers: 2,
      leads: 2,
      overlapping: 2,
      unsegmented: 1
    });
    expect(consumersForSegment(consumers, "customers")).toHaveLength(2);
    expect(consumersForSegment(consumers, "leads")).toHaveLength(2);
    expect(consumersForSegment(consumers, "members")).toHaveLength(2);
    expect(consumerSegmentLabel(consumers[0]!)).toBe("Lead, Customer");
    expect(consumerSegmentLabel(consumers[4]!)).toBe("Contact");
  });

  it("provides fake consumer records for empty dev gyms", () => {
    const consumers = buildFakeConsumers("gym-test");

    expect(consumers).toHaveLength(5);
    expect(consumers.every((consumer) => consumer.gymId === "gym-test")).toBe(true);
    expect(consumerSummary(consumers)).toMatchObject({
      total: 5,
      members: 2,
      customers: 2,
      leads: 2,
      overlapping: 2,
      unsegmented: 1
    });
    expect(consumers.map(consumerSegmentLabel)).toEqual([
      "Lead, Customer",
      "Customer, Member",
      "Lead",
      "Member",
      "Contact"
    ]);
  });
});
