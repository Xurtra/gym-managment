import type { LocationStatus, MembershipStatus } from "@gym-platform/constants";
import type { OperatingHoursView } from "../gymSettings/types.js";

export interface LocationAddressView {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface LocationView {
  id: string;
  gymId?: string;
  name: string;
  address: LocationAddressView;
  timezone: string;
  phone?: string;
  operatingHours: OperatingHoursView;
  status: LocationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationMapLink {
  label: string;
  shortLabel: string;
  address: string;
  query: string;
  href: string;
  external: boolean;
}

export interface LocationRoomView {
  locationId: string;
  name: string;
  sessionCount: number;
  nextSessionAt?: string;
}

export interface LocationAccessRuleView {
  id: string;
  name: string;
  locationId: string;
  planId?: string;
  planName?: string;
  allowAllActiveMembers: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface MemberLocationAccessMembershipView {
  planId: string;
  status: MembershipStatus;
  startsAt?: string;
  endsAt?: string;
}

export interface ReportingLocationRecord {
  id: string;
  locationId?: string;
  locationName?: string;
  metric?: string;
  value?: number;
  occurredAt?: string;
}

export interface LocationSwitcherOption {
  id: string;
  label: string;
  active: boolean;
  href: string;
}
