import type {
  ConsumerRecordStatus,
  ConsumerSegment,
  LeadStage,
  MemberStatus,
  MembershipStatus
} from "@gym-platform/constants";

export interface EmergencyContactView {
  name: string;
  phone: string;
  relationship?: string;
}

export interface MemberView {
  id: string;
  gymId: string;
  firstName: string;
  lastName: string;
  status: MemberStatus;
  email?: string;
  phone?: string;
  barcode?: string;
  profileImageUrl?: string;
  emergencyContact?: EmergencyContactView;
  recordStatus?: ConsumerRecordStatus;
  leadStage?: LeadStage;
  segments?: ConsumerSegment[];
  isLead?: boolean;
  isCustomer?: boolean;
  isMember?: boolean;
  notes?: string;
  tagNames: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface MemberProfileMembershipView {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  planName: string;
  status: MembershipStatus;
  startsAt: string;
  endsAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}
