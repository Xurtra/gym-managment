import { ConsumerRecordStatus, ConsumerSegment, LeadStage, MemberStatus, Permission } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildConsumerDashboardPage } from "./overview.js";
import type { MemberView } from "../members/types.js";

describe("consumer dashboard", () => {
  it("houses leads, customers, and members in one tabbed consumer surface", () => {
    const page = buildConsumerDashboardPage({
      consumers: buildConsumers(),
      permissions: [Permission.MemberRead, Permission.MemberWrite],
      activeTabKey: "customers"
    });

    expect(page.screen).toBe("consumer_dashboard");
    expect(page.pageHeader.title).toBe("Consumers");
    expect(page.tabs.map((tab) => `${tab.key}:${tab.count}`)).toEqual([
      "all:5",
      "members:2",
      "customers:2",
      "leads:2"
    ]);
    expect(page.summary).toMatchObject({
      totalCount: 5,
      memberCount: 2,
      customerCount: 2,
      leadCount: 2,
      overlapCount: 2,
      unsegmentedCount: 1
    });
    expect(page.activeList).toBe(page.customerConsumers);
    expect(page.customerConsumers.screen).toBe("consumer_list");
    expect(page.customerConsumers.summaryLabel).toBe("Showing 2 of 2 consumers");
    expect(page.customerConsumers.rows.map((row) => row.detailHref)).toEqual([
      "/consumers/consumer-1",
      "/consumers/consumer-2"
    ]);
    expect(page.leadConsumers.rows.map((row) => row.detailHref)).toEqual([
      "/consumers/consumer-1",
      "/consumers/consumer-3"
    ]);
  });
});

function buildConsumers(): MemberView[] {
  return [
    {
      id: "consumer-1",
      gymId: "gym-1",
      firstName: "Alex",
      lastName: "Overlap",
      email: "alex@example.com",
      status: MemberStatus.Active,
      recordStatus: ConsumerRecordStatus.Active,
      leadStage: LeadStage.Open,
      segments: [ConsumerSegment.Lead, ConsumerSegment.Customer],
      isLead: true,
      isCustomer: true,
      isMember: false,
      tagNames: ["intro-pack"],
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-02T00:00:00.000Z"
    },
    {
      id: "consumer-2",
      gymId: "gym-1",
      firstName: "Taylor",
      lastName: "Dual",
      email: "taylor@example.com",
      status: MemberStatus.Active,
      recordStatus: ConsumerRecordStatus.Active,
      leadStage: LeadStage.None,
      segments: [ConsumerSegment.Customer, ConsumerSegment.Member],
      isLead: false,
      isCustomer: true,
      isMember: true,
      tagNames: ["founding"],
      createdAt: "2026-05-03T00:00:00.000Z",
      updatedAt: "2026-05-04T00:00:00.000Z"
    },
    {
      id: "consumer-3",
      gymId: "gym-1",
      firstName: "Jamie",
      lastName: "Lead",
      email: "jamie@example.com",
      status: MemberStatus.Active,
      recordStatus: ConsumerRecordStatus.Active,
      leadStage: LeadStage.Open,
      segments: [ConsumerSegment.Lead],
      isLead: true,
      isCustomer: false,
      isMember: false,
      tagNames: [],
      createdAt: "2026-05-05T00:00:00.000Z",
      updatedAt: "2026-05-06T00:00:00.000Z"
    },
    {
      id: "consumer-4",
      gymId: "gym-1",
      firstName: "Morgan",
      lastName: "Member",
      email: "morgan@example.com",
      status: MemberStatus.Active,
      recordStatus: ConsumerRecordStatus.Active,
      leadStage: LeadStage.None,
      segments: [ConsumerSegment.Member],
      isLead: false,
      isCustomer: false,
      isMember: true,
      tagNames: [],
      createdAt: "2026-05-07T00:00:00.000Z",
      updatedAt: "2026-05-08T00:00:00.000Z"
    },
    {
      id: "consumer-5",
      gymId: "gym-1",
      firstName: "Pat",
      lastName: "Contact",
      email: "pat@example.com",
      status: MemberStatus.Active,
      recordStatus: ConsumerRecordStatus.Active,
      leadStage: LeadStage.None,
      segments: [],
      isLead: false,
      isCustomer: false,
      isMember: false,
      tagNames: [],
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-10T00:00:00.000Z"
    }
  ];
}
