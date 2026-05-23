import {
  ConsumerRecordStatus,
  ConsumerSegment,
  LeadStage,
  MemberStatus
} from "@gym-platform/constants";
import type { ConsumerRecordStatus as ConsumerRecordStatusValue } from "@gym-platform/constants";

export type ConsumerSegmentFilter = "all" | "members" | "customers" | "leads";

export interface ConsumerLike {
  status: MemberStatus;
  leadStage?: LeadStage;
  segments?: ConsumerSegment[];
  isLead?: boolean;
  isCustomer?: boolean;
  isMember?: boolean;
}

export interface FakeConsumerRecord extends ConsumerLike {
  id: string;
  gymId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  barcode?: string;
  profileImageUrl?: string;
  emergencyContact?: { name: string; phone: string; relationship?: string };
  recordStatus: ConsumerRecordStatusValue;
  notes?: string;
  tagNames: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export function buildFakeConsumers(gymId: string): FakeConsumerRecord[] {
  return [
    {
      id: "fake-consumer-lead-customer",
      gymId,
      firstName: "Alex",
      lastName: "Drop-In",
      email: "alex.dropin@example.com",
      phone: "555-0101",
      barcode: "FAKE-1001",
      status: MemberStatus.Active,
      recordStatus: ConsumerRecordStatus.Active,
      leadStage: LeadStage.Open,
      segments: [ConsumerSegment.Lead, ConsumerSegment.Customer],
      isLead: true,
      isCustomer: true,
      isMember: false,
      tagNames: ["intro-pack", "open-lead"],
      notes: "Interested in strength classes; purchased a one-time intro class.",
      createdAt: "2026-05-01T14:00:00.000Z",
      updatedAt: "2026-05-21T14:00:00.000Z"
    },
    {
      id: "fake-consumer-customer-member",
      gymId,
      firstName: "Taylor",
      lastName: "Morgan",
      email: "taylor.morgan@example.com",
      phone: "555-0102",
      barcode: "FAKE-1002",
      status: MemberStatus.Active,
      recordStatus: ConsumerRecordStatus.Active,
      leadStage: LeadStage.Converted,
      segments: [ConsumerSegment.Customer, ConsumerSegment.Member],
      isLead: false,
      isCustomer: true,
      isMember: true,
      tagNames: ["founding", "package-holder"],
      notes: "Monthly member with a class package add-on.",
      createdAt: "2026-04-12T13:00:00.000Z",
      updatedAt: "2026-05-20T16:30:00.000Z"
    },
    {
      id: "fake-consumer-lead",
      gymId,
      firstName: "Jamie",
      lastName: "Rivera",
      email: "jamie.rivera@example.com",
      phone: "555-0103",
      status: MemberStatus.Active,
      recordStatus: ConsumerRecordStatus.Active,
      leadStage: LeadStage.Open,
      segments: [ConsumerSegment.Lead],
      isLead: true,
      isCustomer: false,
      isMember: false,
      tagNames: ["trial-interest"],
      notes: "Asked about trial membership and evening classes.",
      createdAt: "2026-05-18T18:20:00.000Z",
      updatedAt: "2026-05-21T09:15:00.000Z"
    },
    {
      id: "fake-consumer-member",
      gymId,
      firstName: "Morgan",
      lastName: "Chen",
      email: "morgan.chen@example.com",
      phone: "555-0104",
      barcode: "FAKE-1004",
      status: MemberStatus.Active,
      recordStatus: ConsumerRecordStatus.Active,
      leadStage: LeadStage.None,
      segments: [ConsumerSegment.Member],
      isLead: false,
      isCustomer: false,
      isMember: true,
      tagNames: ["annual"],
      notes: "Annual membership; facility access should be available.",
      createdAt: "2026-02-02T10:00:00.000Z",
      updatedAt: "2026-05-19T11:45:00.000Z"
    },
    {
      id: "fake-consumer-contact",
      gymId,
      firstName: "Pat",
      lastName: "Contact",
      email: "pat.contact@example.com",
      status: MemberStatus.Frozen,
      recordStatus: ConsumerRecordStatus.Inactive,
      leadStage: LeadStage.None,
      segments: [],
      isLead: false,
      isCustomer: false,
      isMember: false,
      tagNames: ["newsletter"],
      notes: "General contact with no active lead stage or entitlement.",
      createdAt: "2026-05-10T12:00:00.000Z",
      updatedAt: "2026-05-10T12:00:00.000Z"
    }
  ];
}

export function consumersForSegment<T extends ConsumerLike>(
  consumers: T[],
  segment: ConsumerSegmentFilter
) {
  switch (segment) {
    case "members":
      return consumers.filter(isMemberConsumerRecord);
    case "customers":
      return consumers.filter(isCustomerConsumerRecord);
    case "leads":
      return consumers.filter(isLeadConsumerRecord);
    default:
      return consumers;
  }
}

export function consumerSummary(consumers: ConsumerLike[]) {
  const segmentLists = consumers.map(consumerSegmentsFor);
  return {
    total: consumers.length,
    members: segmentLists.filter((segments) => segments.includes(ConsumerSegment.Member)).length,
    customers: segmentLists.filter((segments) => segments.includes(ConsumerSegment.Customer))
      .length,
    leads: segmentLists.filter((segments) => segments.includes(ConsumerSegment.Lead)).length,
    overlapping: segmentLists.filter((segments) => segments.length > 1).length,
    unsegmented: segmentLists.filter((segments) => segments.length === 0).length
  };
}

export function consumerSegmentLabel(consumer: ConsumerLike) {
  const labels = consumerSegmentsFor(consumer).map((segment) => ({
    [ConsumerSegment.Lead]: "Lead",
    [ConsumerSegment.Customer]: "Customer",
    [ConsumerSegment.Member]: "Member"
  })[segment]);
  return labels.length > 0 ? labels.join(", ") : "Contact";
}

export function consumerSegmentsFor(consumer: ConsumerLike): ConsumerSegment[] {
  if (consumer.segments?.length) {
    return consumer.segments;
  }
  const segments: ConsumerSegment[] = [];
  if (isLeadConsumerRecord(consumer)) {
    segments.push(ConsumerSegment.Lead);
  }
  if (isCustomerConsumerRecord(consumer)) {
    segments.push(ConsumerSegment.Customer);
  }
  if (isMemberConsumerRecord(consumer)) {
    segments.push(ConsumerSegment.Member);
  }
  return segments;
}

export function isLeadConsumerRecord(consumer: ConsumerLike) {
  if (consumer.isLead !== undefined) {
    return consumer.isLead;
  }
  if (consumer.segments) {
    return consumer.segments.includes(ConsumerSegment.Lead);
  }
  return (
    consumer.leadStage === LeadStage.Open ||
    consumer.status === MemberStatus.Lead
  );
}

export function isCustomerConsumerRecord(consumer: ConsumerLike) {
  if (consumer.isCustomer !== undefined) {
    return consumer.isCustomer;
  }
  return Boolean(consumer.segments?.includes(ConsumerSegment.Customer));
}

export function isMemberConsumerRecord(consumer: ConsumerLike) {
  if (consumer.isMember !== undefined) {
    return consumer.isMember;
  }
  if (consumer.segments) {
    return consumer.segments.includes(ConsumerSegment.Member);
  }
  return (
    consumer.status === MemberStatus.Active ||
    consumer.status === MemberStatus.Trial
  );
}
