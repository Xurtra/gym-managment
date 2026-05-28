import { ConsumerSegment, LeadStage, MemberStatus } from "@gym-platform/constants";
import type { MemberView } from "./types.js";

export function consumerSegments(member: MemberView): ConsumerSegment[] {
  if (member.segments) {
    return member.segments;
  }
  const segments: ConsumerSegment[] = [];
  if (isLeadConsumer(member)) {
    segments.push(ConsumerSegment.Lead);
  }
  if (member.isCustomer) {
    segments.push(ConsumerSegment.Customer);
  }
  if (member.isMember) {
    segments.push(ConsumerSegment.Member);
  }
  return segments;
}

export function isLeadConsumer(member: MemberView) {
  return member.isLead || member.leadStage === LeadStage.Open || member.status === MemberStatus.Lead;
}

export function consumerSegmentLabel(segment: ConsumerSegment) {
  switch (segment) {
    case ConsumerSegment.Lead:
      return "Lead";
    case ConsumerSegment.Customer:
      return "Customer";
    case ConsumerSegment.Member:
      return "Member";
  }
}
