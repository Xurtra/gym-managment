import {
  BillingInterval,
  BookingStatus,
  ClassSessionStatus,
  FacilityReservationStatus,
  MemberStatus,
  MembershipStatus,
  PlanStatus,
  ReservableResourceStatus
} from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import type {
  CampaignImportRecord,
  CheckIn,
  ClassBooking,
  ClassSession,
  ClassType,
  FacilityReservation,
  Member,
  MemberMembership,
  MembershipPlan,
  ReservableResource,
  ResourceAllocation
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export type RevenueOpportunityType =
  | "UNDERUSED_RESOURCE"
  | "UNUSED_CREDITS"
  | "INACTIVE_MEMBER"
  | "FIRST_VISIT_NOT_CONVERTED"
  | "HIGH_USAGE_UPGRADE"
  | "UNDERUSED_SERVICE"
  | "PREMIUM_PROGRAM_OPPORTUNITY";

export type RevenueOpportunityPriority = "low" | "medium" | "high";

export interface RevenueOpportunity {
  id: string;
  gymId: string;
  type: RevenueOpportunityType;
  title: string;
  description: string;
  priority: RevenueOpportunityPriority;
  estimatedRevenue: number;
  estimatedRevenueCents: number;
  recommendedAction: string;
  evidence: Record<string, unknown>;
  createdAt: Date;
}

export interface RevenueOpportunityOptions {
  from?: Date | undefined;
  to?: Date | undefined;
}

export interface RevenueOpportunityResult {
  generatedAt: Date;
  window: {
    from: Date;
    to: Date;
  };
  opportunities: RevenueOpportunity[];
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
    estimatedRevenueCents: number;
    byType: Record<RevenueOpportunityType, number>;
  };
}

interface ImportedClient {
  id: string;
  email?: string | undefined;
  phone?: string | undefined;
  name: string;
  status?: string | undefined;
  membershipName?: string | undefined;
  remainingCredits?: number | undefined;
  totalCredits?: number | undefined;
  lastVisitDate?: Date | undefined;
  record: CampaignImportRecord;
}

interface ImportedBooking {
  id: string;
  clientEmail?: string | undefined;
  clientName?: string | undefined;
  serviceName?: string | undefined;
  roomName?: string | undefined;
  status?: string | undefined;
  startsAt?: Date | undefined;
  endsAt?: Date | undefined;
  durationHours: number;
  record: CampaignImportRecord;
}

interface ImportedService {
  id: string;
  name: string;
  category?: string | undefined;
  priceCents: number;
  durationMinutes?: number | undefined;
  capacity: number;
  active: boolean;
  record: CampaignImportRecord;
}

interface ImportedResource {
  id: string;
  name: string;
  resourceType: string;
  capacity: number;
  active: boolean;
  bookable: boolean;
  record: CampaignImportRecord;
}

interface ImportedPackage {
  id: string;
  name: string;
  planType?: string | undefined;
  priceCents: number;
  billingFrequency?: string | undefined;
  sessionsIncluded?: number | undefined;
  active: boolean;
  record: CampaignImportRecord;
}

interface ImportedPayment {
  id: string;
  clientEmail?: string | undefined;
  clientName?: string | undefined;
  amountCents: number;
  status?: string | undefined;
  paidAt?: Date | undefined;
  description?: string | undefined;
  record: CampaignImportRecord;
}

interface AnalysisData {
  gymId: string;
  now: Date;
  from: Date;
  to: Date;
  members: Member[];
  plans: MembershipPlan[];
  checkIns: CheckIn[];
  resources: ReservableResource[];
  allocations: ResourceAllocation[];
  reservations: FacilityReservation[];
  classTypes: ClassType[];
  sessions: ClassSession[];
  classBookingsBySessionId: Map<string, ClassBooking[]>;
  membershipsByMemberId: Map<string, MemberMembership[]>;
  importedClients: ImportedClient[];
  importedBookings: ImportedBooking[];
  importedServices: ImportedService[];
  importedResources: ImportedResource[];
  importedPackages: ImportedPackage[];
  importedPayments: ImportedPayment[];
}

interface ResourceUtilization {
  key: string;
  name: string;
  resourceType: string;
  capacity: number;
  availableHours: number;
  bookedHours: number;
  utilizationPercent: number;
  hourlyValueCents: number;
}

export interface ResourceUtilizationOptions extends RevenueOpportunityOptions {
  resourceType?: string | undefined;
  serviceCategory?: string | undefined;
}

export interface RoomDeviceUtilization {
  id: string;
  name: string;
  type: string;
  bookedHoursThisWeek: number;
  availableHoursThisWeek: number;
  utilizationPercentage: number;
  estimatedRevenue: number;
  estimatedRevenueCents: number;
  estimatedMissedRevenue: number;
  estimatedMissedRevenueCents: number;
  busiestDay: string;
  weakestDay: string;
  weakestTimeBlock: string;
  bookingCount: number;
  serviceCategories: string[];
}

export interface ResourceUtilizationDashboardResult {
  generatedAt: Date;
  window: {
    from: Date;
    to: Date;
  };
  resources: RoomDeviceUtilization[];
  summary: {
    bookedHours: number;
    availableHours: number;
    utilizationPercentage: number;
    estimatedRevenueCents: number;
    estimatedMissedRevenueCents: number;
    resourceCount: number;
  };
  filters: {
    resourceTypes: string[];
    serviceCategories: string[];
  };
}

export type ClientSegmentKey =
  | "inactive_members"
  | "unused_credit_members"
  | "first_time_visitors"
  | "high_value_clients"
  | "upsell_candidates"
  | "review_candidates";

export interface ClientSegmentRow {
  id: string;
  clientName: string;
  email?: string | undefined;
  phone?: string | undefined;
  lastVisitDate?: Date | undefined;
  totalSpend: number;
  totalSpendCents: number;
  membershipStatus: string;
  recommendedAction: string;
  evidence: Record<string, unknown>;
}

export interface ClientSegment {
  key: ClientSegmentKey;
  label: string;
  description: string;
  count: number;
  clients: ClientSegmentRow[];
}

export interface ClientSegmentationResult {
  generatedAt: Date;
  averageClientSpend: number;
  averageClientSpendCents: number;
  segments: ClientSegment[];
  summary: {
    totalClients: number;
    totalSegmentMatches: number;
  };
}

interface DetailedResourceUtilization extends ResourceUtilization {
  revenueCents: number;
  bookingCount: number;
  dayHours: Map<string, number>;
  timeBlockHours: Map<string, number>;
  serviceCategories: Set<string>;
}

interface SegmentClient {
  id: string;
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  membershipStatus: string;
  hasMembership: boolean;
  activeMembership: boolean;
  activeMember: boolean;
  lastVisitDate?: Date | undefined;
  remainingCredits?: number | undefined;
  totalSpendCents: number;
  completedBookingCount: number;
  bookings: Array<{ serviceName?: string | undefined; startsAt?: Date | undefined; status?: string | undefined }>;
  completedVisitDates: Date[];
}

const dayMs = 24 * 60 * 60 * 1000;
const defaultWindowDays = 30;
const defaultBookableHoursPerDay = 10;
const underusedResourceThreshold = 0.25;
const resourceTargetUtilization = 0.45;
const lowServiceBookingThreshold = 3;
const meaningfulServicePriceCents = 2000;
const activeMemberStatuses = new Set<string>([MemberStatus.Active, MemberStatus.Trial]);
const activeMembershipStatuses = new Set<string>([MembershipStatus.Active, MembershipStatus.Trialing]);
const completedImportedBookingStatuses = new Set(["completed", "complete", "attended", "checked_in", "done", "show"]);
const cancelledBookingStatuses = new Set(["cancelled", "canceled", "no_show", "noshow"]);
const timeBlocks = [
  { label: "Early morning (12 AM-6 AM)", startsAt: 0, endsAt: 6 },
  { label: "Morning (6 AM-12 PM)", startsAt: 6, endsAt: 12 },
  { label: "Afternoon (12 PM-5 PM)", startsAt: 12, endsAt: 17 },
  { label: "Evening (5 PM-10 PM)", startsAt: 17, endsAt: 22 },
  { label: "Late night (10 PM-12 AM)", startsAt: 22, endsAt: 24 }
] as const;

const opportunityTypes: RevenueOpportunityType[] = [
  "UNDERUSED_RESOURCE",
  "UNUSED_CREDITS",
  "INACTIVE_MEMBER",
  "FIRST_VISIT_NOT_CONVERTED",
  "HIGH_USAGE_UPGRADE",
  "UNDERUSED_SERVICE",
  "PREMIUM_PROGRAM_OPPORTUNITY"
];

const clientSegmentDefinitions: Array<Omit<ClientSegment, "count" | "clients">> = [
  {
    key: "inactive_members",
    label: "Inactive Members",
    description: "Active memberships where the last visit is older than 21 days."
  },
  {
    key: "unused_credit_members",
    label: "Unused Credit Members",
    description: "Active members with credits left and no recent booking."
  },
  {
    key: "first_time_visitors",
    label: "First-Time Visitors",
    description: "Clients with one completed booking and no membership."
  },
  {
    key: "high_value_clients",
    label: "High-Value Clients",
    description: "Clients whose total spend is at least 50% above the studio average."
  },
  {
    key: "upsell_candidates",
    label: "Upsell Candidates",
    description: "Clients with 3+ bookings for the same service in 60 days and no membership."
  },
  {
    key: "review_candidates",
    label: "Review Candidates",
    description: "Clients with 5+ completed visits in the last 90 days."
  }
];

export class RevenueOpportunityService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async generate(gymId: string, options: RevenueOpportunityOptions = {}): Promise<RevenueOpportunityResult> {
    const now = this.clock.now();
    const to = options.to ?? now;
    const from = options.from ?? new Date(to.getTime() - defaultWindowDays * dayMs);
    const data = await this.loadAnalysisData(gymId, now, from, to);
    const resourceUtilization = this.calculateResourceUtilization(data);
    const opportunities = [
      ...this.detectUnderusedResources(data, resourceUtilization),
      ...this.detectUnusedCredits(data),
      ...this.detectInactiveMembers(data),
      ...this.detectFirstVisitNotConverted(data),
      ...this.detectHighUsageUpgrade(data),
      ...this.detectUnderusedServices(data),
      ...this.detectPremiumProgramOpportunities(data, resourceUtilization)
    ].sort(compareOpportunities);

    return {
      generatedAt: now,
      window: { from, to },
      opportunities,
      summary: summarizeOpportunities(opportunities)
    };
  }

  async utilization(
    gymId: string,
    options: ResourceUtilizationOptions = {}
  ): Promise<ResourceUtilizationDashboardResult> {
    const now = this.clock.now();
    const defaultRange = currentWeekRange(now);
    const from = options.from ?? defaultRange.from;
    const to = options.to ?? defaultRange.to;
    const data = await this.loadAnalysisData(gymId, now, from, to);
    const allResourceTypes = uniqueSorted([
      ...data.resources
        .filter((resource) => resource.status !== ReservableResourceStatus.Archived)
        .map((resource) => resource.resourceType),
      ...data.importedResources
        .filter((resource) => resource.active)
        .map((resource) => resource.resourceType)
    ]);
    const allServiceCategories = uniqueSorted([
      ...data.importedServices
        .filter((service) => service.active)
        .map((service) => service.category ?? service.name),
      ...data.classTypes.map((classType) => classType.name),
      "Classes"
    ]);
    const detailedRows = this.calculateDetailedResourceUtilization(data, {
      serviceCategory: options.serviceCategory
    });
    const filteredRows = detailedRows
      .filter((resource) => !options.resourceType || normalizeKey(resource.resourceType) === normalizeKey(options.resourceType))
      .filter((resource) => {
        if (!options.serviceCategory) {
          return true;
        }
        return [...resource.serviceCategories].some((category) => serviceMatchesCategory(category, options.serviceCategory));
      });
    const resources = filteredRows
      .map((resource) => toRoomDeviceUtilization(resource))
      .sort((left, right) =>
        left.utilizationPercentage - right.utilizationPercentage ||
        right.estimatedMissedRevenueCents - left.estimatedMissedRevenueCents ||
        left.name.localeCompare(right.name)
      );
    const summary = summarizeResourceUtilization(resources);
    return {
      generatedAt: now,
      window: { from, to },
      resources,
      summary,
      filters: {
        resourceTypes: allResourceTypes,
        serviceCategories: allServiceCategories
      }
    };
  }

  async clientSegments(gymId: string): Promise<ClientSegmentationResult> {
    const now = this.clock.now();
    const data = await this.loadAnalysisData(gymId, now, new Date(now.getTime() - 90 * dayMs), now);
    const clients = buildSegmentClients(data);
    const averageClientSpendCents = averageClientSpend(clients);
    const inactiveCutoff = new Date(now.getTime() - 21 * dayMs);
    const recentBookingCutoff = new Date(now.getTime() - 14 * dayMs);
    const sixtyDayCutoff = new Date(now.getTime() - 60 * dayMs);
    const ninetyDayCutoff = new Date(now.getTime() - 90 * dayMs);
    const segmentRows: Record<ClientSegmentKey, ClientSegmentRow[]> = {
      inactive_members: [],
      unused_credit_members: [],
      first_time_visitors: [],
      high_value_clients: [],
      upsell_candidates: [],
      review_candidates: []
    };

    for (const client of clients) {
      if (
        client.activeMembership &&
        client.lastVisitDate &&
        client.lastVisitDate.getTime() < inactiveCutoff.getTime()
      ) {
        segmentRows.inactive_members.push(toClientSegmentRow(client, "Send a reactivation message with a class invite or trainer follow-up."));
      }

      if (
        client.activeMember &&
        (client.remainingCredits ?? 0) > 0 &&
        !client.bookings.some((booking) => booking.startsAt && booking.startsAt.getTime() >= recentBookingCutoff.getTime())
      ) {
        segmentRows.unused_credit_members.push(toClientSegmentRow(client, "Send a use-your-credits reminder with available booking times."));
      }

      if (client.completedBookingCount === 1 && !client.hasMembership) {
        segmentRows.first_time_visitors.push(toClientSegmentRow(client, "Send a first-visit follow-up and invite them into a membership or intro package."));
      }

      if (
        averageClientSpendCents > 0 &&
        client.totalSpendCents >= averageClientSpendCents * 1.5
      ) {
        segmentRows.high_value_clients.push(toClientSegmentRow(client, "Offer a premium program, VIP package, or personal trainer consultation."));
      }

      const repeatedService = mostRepeatedService(client, sixtyDayCutoff);
      if (repeatedService && !client.hasMembership) {
        segmentRows.upsell_candidates.push(toClientSegmentRow(
          client,
          `Pitch a membership or package tied to ${repeatedService.serviceName}.`,
          { repeatedService: repeatedService.serviceName, recentServiceBookings: repeatedService.count }
        ));
      }

      const recentCompletedVisits = client.completedVisitDates.filter((visit) => visit.getTime() >= ninetyDayCutoff.getTime()).length;
      if (recentCompletedVisits >= 5) {
        segmentRows.review_candidates.push(toClientSegmentRow(
          client,
          "Ask for a review or testimonial while engagement is high.",
          { completedVisitsLast90Days: recentCompletedVisits }
        ));
      }
    }

    const segments = clientSegmentDefinitions.map((definition) => {
      const rows = segmentRows[definition.key].sort(compareSegmentRows);
      return {
        ...definition,
        count: rows.length,
        clients: rows
      };
    });

    return {
      generatedAt: now,
      averageClientSpend: roundTo(averageClientSpendCents / 100, 2),
      averageClientSpendCents,
      segments,
      summary: {
        totalClients: clients.length,
        totalSegmentMatches: segments.reduce((total, segment) => total + segment.count, 0)
      }
    };
  }

  private async loadAnalysisData(gymId: string, now: Date, from: Date, to: Date): Promise<AnalysisData> {
    const [
      members,
      plans,
      checkIns,
      resources,
      allocations,
      reservations,
      classTypes,
      sessions,
      campaignBatches
    ] = await Promise.all([
      this.repositories.members.listMembersForGym(gymId),
      this.repositories.membershipPlans.listMembershipPlansForGym(gymId),
      this.repositories.checkIns.listCheckInsForGym(gymId),
      this.repositories.reservationResources.listResourcesForGym(gymId),
      this.repositories.reservationResources.listAllocationsForGym(gymId),
      this.repositories.reservationResources.listFacilityReservationsForGym(gymId),
      this.repositories.classes.listClassTypesForGym(gymId),
      this.repositories.classes.listClassSessionsForGym(gymId),
      this.repositories.campaignImports.listBatchesForGym(gymId)
    ]);

    const [bookingsBySessionEntries, membershipsByMemberEntries, campaignRecordGroups] = await Promise.all([
      Promise.all(
        sessions.map(async (session) => [
          session.id,
          await this.repositories.bookings.listClassBookingsForSession(session.id)
        ] as const)
      ),
      Promise.all(
        members.map(async (member) => [
          member.id,
          await this.repositories.memberMemberships.listMemberMembershipsForMember(member.id)
        ] as const)
      ),
      Promise.all(campaignBatches.map((batch) => this.repositories.campaignImports.listRecordsForBatch(batch.id)))
    ]);

    const campaignRecords = campaignRecordGroups
      .flat()
      .filter((record) => record.validationStatus !== "critical");

    return {
      gymId,
      now,
      from,
      to,
      members,
      plans,
      checkIns,
      resources,
      allocations,
      reservations,
      classTypes,
      sessions,
      classBookingsBySessionId: new Map(bookingsBySessionEntries),
      membershipsByMemberId: new Map(membershipsByMemberEntries),
      importedClients: campaignRecords.filter((record) => record.importType === "clients").map(toImportedClient),
      importedBookings: campaignRecords.filter((record) => record.importType === "bookings").map(toImportedBooking),
      importedServices: campaignRecords.filter((record) => record.importType === "services").map(toImportedService),
      importedResources: campaignRecords.filter((record) => record.importType === "rooms_devices").map(toImportedResource),
      importedPackages: campaignRecords
        .filter((record) => record.importType === "memberships_packages")
        .map(toImportedPackage),
      importedPayments: campaignRecords.filter((record) => record.importType === "payments").map(toImportedPayment)
    };
  }

  private calculateResourceUtilization(data: AnalysisData): ResourceUtilization[] {
    const resources = new Map<string, ResourceUtilization>();
    const registerResource = (input: {
      key: string;
      name: string;
      resourceType: string;
      capacity: number;
      hourlyValueCents: number;
      dailyHours?: number | undefined;
    }) => {
      if (resources.has(input.key)) {
        return;
      }
      const availableHours = Math.max(1, dayCount(data.from, data.to) * (input.dailyHours ?? defaultBookableHoursPerDay));
      resources.set(input.key, {
        key: input.key,
        name: input.name,
        resourceType: input.resourceType,
        capacity: Math.max(1, input.capacity),
        availableHours,
        bookedHours: 0,
        utilizationPercent: 0,
        hourlyValueCents: Math.max(2500, input.hourlyValueCents)
      });
    };

    for (const resource of data.resources) {
      if (resource.status === ReservableResourceStatus.Archived) {
        continue;
      }
      registerResource({
        key: resource.id,
        name: resource.name,
        resourceType: resource.resourceType,
        capacity: resource.capacity,
        hourlyValueCents: resource.pricing.amountCents || averageServiceHourlyValueCents(data.importedServices),
        dailyHours: estimateDailyHours(resource.rentableHours)
      });
    }

    for (const resource of data.importedResources) {
      if (!resource.active || !resource.bookable) {
        continue;
      }
      registerResource({
        key: importedResourceKey(resource.name),
        name: resource.name,
        resourceType: resource.resourceType,
        capacity: resource.capacity,
        hourlyValueCents: averageServiceHourlyValueCents(data.importedServices)
      });
    }

    for (const allocation of data.allocations) {
      if (allocation.facilityReservationId || !overlaps(allocation.startsAt, allocation.endsAt, data.from, data.to)) {
        continue;
      }
      const resource = resources.get(allocation.resourceId);
      if (resource) {
        resource.bookedHours += hoursBetween(clampDate(allocation.startsAt, data.from, data.to), clampDate(allocation.endsAt, data.from, data.to));
      }
    }

    for (const reservation of data.reservations) {
      if (reservation.status === FacilityReservationStatus.Cancelled || !overlaps(reservation.startsAt, reservation.endsAt, data.from, data.to)) {
        continue;
      }
      const resource = resources.get(reservation.resourceId);
      if (resource) {
        resource.bookedHours += hoursBetween(clampDate(reservation.startsAt, data.from, data.to), clampDate(reservation.endsAt, data.from, data.to));
        if (reservation.amountCents > resource.hourlyValueCents) {
          resource.hourlyValueCents = reservation.amountCents;
        }
      }
    }

    const resourceNames = new Map<string, ResourceUtilization>();
    for (const resource of resources.values()) {
      resourceNames.set(normalizeKey(resource.name), resource);
    }

    for (const booking of data.importedBookings) {
      if (!booking.roomName || !booking.startsAt || bookingStatusIsCancelled(booking.status)) {
        continue;
      }
      const resource = resourceNames.get(normalizeKey(booking.roomName)) ?? resources.get(importedResourceKey(booking.roomName));
      if (!resource || !isWithin(booking.startsAt, data.from, data.to)) {
        continue;
      }
      resource.bookedHours += booking.durationHours;
    }

    for (const resource of resources.values()) {
      resource.bookedHours = Math.min(resource.availableHours, roundTo(resource.bookedHours, 2));
      resource.utilizationPercent = roundTo((resource.bookedHours / resource.availableHours) * 100, 1);
    }
    return [...resources.values()];
  }

  private calculateDetailedResourceUtilization(
    data: AnalysisData,
    filters: { serviceCategory?: string | undefined } = {}
  ): DetailedResourceUtilization[] {
    const resources = new Map<string, DetailedResourceUtilization>();
    const dateKeys = dateKeysInRange(data.from, data.to);
    const serviceByName = new Map(data.importedServices.map((service) => [normalizeKey(service.name), service]));
    const sessionById = new Map(data.sessions.map((session) => [session.id, session]));
    const classTypeById = new Map(data.classTypes.map((classType) => [classType.id, classType]));

    const registerResource = (input: {
      key: string;
      name: string;
      resourceType: string;
      capacity: number;
      hourlyValueCents: number;
      dailyHours?: number | undefined;
    }) => {
      if (resources.has(input.key)) {
        return;
      }
      const dayHours = new Map(dateKeys.map((key) => [key, 0]));
      const timeBlockHours = new Map(timeBlocks.map((block) => [block.label, 0]));
      const availableHours = Math.max(1, dayCount(data.from, data.to) * (input.dailyHours ?? defaultBookableHoursPerDay));
      resources.set(input.key, {
        key: input.key,
        name: input.name,
        resourceType: input.resourceType,
        capacity: Math.max(1, input.capacity),
        availableHours,
        bookedHours: 0,
        utilizationPercent: 0,
        hourlyValueCents: Math.max(2500, input.hourlyValueCents),
        revenueCents: 0,
        bookingCount: 0,
        dayHours,
        timeBlockHours,
        serviceCategories: new Set()
      });
    };

    for (const resource of data.resources) {
      if (resource.status === ReservableResourceStatus.Archived) {
        continue;
      }
      registerResource({
        key: resource.id,
        name: resource.name,
        resourceType: resource.resourceType,
        capacity: resource.capacity,
        hourlyValueCents: resource.pricing.amountCents || averageServiceHourlyValueCents(data.importedServices),
        dailyHours: estimateDailyHours(resource.rentableHours)
      });
    }

    for (const resource of data.importedResources) {
      if (!resource.active || !resource.bookable) {
        continue;
      }
      registerResource({
        key: importedResourceKey(resource.name),
        name: resource.name,
        resourceType: resource.resourceType,
        capacity: resource.capacity,
        hourlyValueCents: averageServiceHourlyValueCents(data.importedServices)
      });
    }

    const addBooking = (
      resource: DetailedResourceUtilization | undefined,
      input: {
        startsAt: Date;
        endsAt: Date;
        revenueCents?: number | undefined;
        serviceName?: string | undefined;
        serviceCategory?: string | undefined;
      }
    ) => {
      if (!resource || !overlaps(input.startsAt, input.endsAt, data.from, data.to)) {
        return;
      }
      const serviceCategory = input.serviceCategory ?? input.serviceName ?? "Uncategorized";
      if (filters.serviceCategory && !serviceMatchesCategory(serviceCategory, filters.serviceCategory)) {
        return;
      }
      const startsAt = clampDate(input.startsAt, data.from, data.to);
      const endsAt = clampDate(input.endsAt, data.from, data.to);
      const bookedHours = hoursBetween(startsAt, endsAt);
      if (bookedHours <= 0) {
        return;
      }
      const revenueCents = input.revenueCents && input.revenueCents > 0
        ? input.revenueCents
        : Math.round(bookedHours * resource.hourlyValueCents);
      resource.bookedHours += bookedHours;
      resource.revenueCents += revenueCents;
      resource.bookingCount += 1;
      resource.serviceCategories.add(serviceCategory);
      resource.dayHours.set(dateKey(startsAt), (resource.dayHours.get(dateKey(startsAt)) ?? 0) + bookedHours);
      const blockLabel = timeBlockLabel(startsAt);
      resource.timeBlockHours.set(blockLabel, (resource.timeBlockHours.get(blockLabel) ?? 0) + bookedHours);
    };

    for (const allocation of data.allocations) {
      if (allocation.facilityReservationId) {
        continue;
      }
      const session = allocation.classSessionId ? sessionById.get(allocation.classSessionId) : undefined;
      const classType = session ? classTypeById.get(session.classTypeId) : undefined;
      addBooking(resources.get(allocation.resourceId), {
        startsAt: allocation.startsAt,
        endsAt: allocation.endsAt,
        serviceName: classType?.name,
        serviceCategory: classType?.name ?? "Classes"
      });
    }

    for (const reservation of data.reservations) {
      if (reservation.status === FacilityReservationStatus.Cancelled) {
        continue;
      }
      addBooking(resources.get(reservation.resourceId), {
        startsAt: reservation.startsAt,
        endsAt: reservation.endsAt,
        revenueCents: reservation.amountCents,
        serviceName: "Facility reservation",
        serviceCategory: "Reservations"
      });
    }

    const resourceNames = new Map<string, DetailedResourceUtilization>();
    for (const resource of resources.values()) {
      resourceNames.set(normalizeKey(resource.name), resource);
    }

    for (const booking of data.importedBookings) {
      if (!booking.roomName || !booking.startsAt || bookingStatusIsCancelled(booking.status)) {
        continue;
      }
      const service = booking.serviceName ? serviceByName.get(normalizeKey(booking.serviceName)) : undefined;
      const resource = resourceNames.get(normalizeKey(booking.roomName)) ?? resources.get(importedResourceKey(booking.roomName));
      addBooking(resource, {
        startsAt: booking.startsAt,
        endsAt: booking.endsAt ?? new Date(booking.startsAt.getTime() + booking.durationHours * 60 * 60 * 1000),
        revenueCents: service?.priceCents,
        serviceName: booking.serviceName,
        serviceCategory: service?.category ?? booking.serviceName
      });
    }

    for (const resource of resources.values()) {
      resource.bookedHours = roundTo(resource.bookedHours, 2);
      resource.availableHours = roundTo(resource.availableHours, 2);
      resource.revenueCents = Math.round(resource.revenueCents);
      resource.utilizationPercent = roundTo((Math.min(resource.bookedHours, resource.availableHours) / resource.availableHours) * 100, 1);
    }
    return [...resources.values()];
  }

  private detectUnderusedResources(data: AnalysisData, resources: ResourceUtilization[]): RevenueOpportunity[] {
    return resources
      .filter((resource) => resource.utilizationPercent / 100 < underusedResourceThreshold)
      .map((resource) => {
        const targetHours = resource.availableHours * resourceTargetUtilization;
        const missedHours = Math.max(0, targetHours - resource.bookedHours);
        const estimatedRevenueCents = Math.round(missedHours * resource.hourlyValueCents);
        return this.createOpportunity(data, {
          type: "UNDERUSED_RESOURCE",
          title: `Increase use of ${resource.name}`,
          description: `${resource.name} is ${resource.utilizationPercent}% utilized in the selected window (${roundTo(resource.bookedHours, 1)} of ${roundTo(resource.availableHours, 1)} available hours).`,
          estimatedRevenueCents,
          recommendedAction: "Create a targeted offer, open rental slots, or assign staff-led sessions during idle windows.",
          evidence: {
            resourceKey: resource.key,
            resourceName: resource.name,
            resourceType: resource.resourceType,
            availableHours: resource.availableHours,
            bookedHours: resource.bookedHours,
            utilizationPercent: resource.utilizationPercent,
            targetUtilizationPercent: resourceTargetUtilization * 100
          }
        });
      });
  }

  private detectUnusedCredits(data: AnalysisData): RevenueOpportunity[] {
    const lastBookingByClient = latestImportedBookingByClient(data.importedBookings);
    const cutoff = new Date(data.now.getTime() - 14 * dayMs);
    return data.importedClients
      .filter((client) => activeTextStatus(client.status))
      .filter((client) => (client.remainingCredits ?? 0) > 0)
      .filter((client) => {
        const key = clientKey(client.email, client.name);
        const lastBooking = lastBookingByClient.get(key);
        return !lastBooking || lastBooking.getTime() < cutoff.getTime();
      })
      .map((client) => {
        const remainingCredits = client.remainingCredits ?? 0;
        const creditValueCents = estimateCreditValueCents(client, data.importedPackages, data.plans);
        return this.createOpportunity(data, {
          type: "UNUSED_CREDITS",
          title: `${client.name} has unused credits`,
          description: `${client.name} has ${remainingCredits} remaining credit${remainingCredits === 1 ? "" : "s"} and no booking in the last 14 days.`,
          estimatedRevenueCents: Math.round(remainingCredits * creditValueCents),
          recommendedAction: "Send a booking reminder with the most relevant open classes or appointment slots.",
          evidence: {
            clientId: client.id,
            email: client.email,
            remainingCredits,
            membershipName: client.membershipName
          }
        });
      });
  }

  private detectInactiveMembers(data: AnalysisData): RevenueOpportunity[] {
    const cutoff = new Date(data.now.getTime() - 21 * dayMs);
    const checkInsByMember = groupCheckInsByMember(data.checkIns);
    const averagePlanValueCents = averagePlanValue(data.plans);
    const realMemberOpportunities = data.members
      .filter((member) => member.status === MemberStatus.Active)
      .flatMap((member) => {
        const memberCheckIns = checkInsByMember.get(member.id) ?? [];
        const lastVisit = latestDate(memberCheckIns.map((checkIn) => checkIn.checkedInAt));
        const fallbackDate = member.createdAt;
        const activityDate = lastVisit ?? fallbackDate;
        if (activityDate.getTime() >= cutoff.getTime()) {
          return [];
        }
        return [
          this.createOpportunity(data, {
            type: "INACTIVE_MEMBER",
            title: `Reactivate ${memberName(member)}`,
            description: `${memberName(member)} is active but has not visited since ${formatDate(activityDate)}.`,
            estimatedRevenueCents: averagePlanValueCents,
            recommendedAction: "Send a personal check-in, offer a class invite, or trigger a retention sequence.",
            evidence: {
              memberId: member.id,
              email: member.email,
              lastVisitDate: activityDate.toISOString()
            }
          })
        ];
      });

    const importedClientOpportunities = data.importedClients
      .filter((client) => activeTextStatus(client.status))
      .filter((client) => client.lastVisitDate && client.lastVisitDate.getTime() < cutoff.getTime())
      .map((client) => this.createOpportunity(data, {
        type: "INACTIVE_MEMBER",
        title: `Reactivate ${client.name}`,
        description: `${client.name} is active but has not visited since ${formatDate(client.lastVisitDate)}.`,
        estimatedRevenueCents: averagePlanValueCents,
        recommendedAction: "Send a reactivation campaign tied to their last plan or favorite service.",
        evidence: {
          clientId: client.id,
          email: client.email,
          lastVisitDate: client.lastVisitDate?.toISOString()
        }
      }));

    return [...realMemberOpportunities, ...importedClientOpportunities];
  }

  private detectFirstVisitNotConverted(data: AnalysisData): RevenueOpportunity[] {
    const checkInsByMember = groupCheckInsByMember(data.checkIns);
    const averagePlanValueCents = averagePlanValue(data.plans);
    const realMemberOpportunities = data.members.flatMap((member) => {
      const visitCount = (checkInsByMember.get(member.id) ?? []).length;
      const memberships = data.membershipsByMemberId.get(member.id) ?? [];
      const hasActiveMembership = memberships.some((membership) => activeMembershipStatuses.has(membership.status));
      if (visitCount !== 1 || hasActiveMembership) {
        return [];
      }
      return [
        this.createOpportunity(data, {
          type: "FIRST_VISIT_NOT_CONVERTED",
          title: `Follow up with ${memberName(member)}`,
          description: `${memberName(member)} completed one visit and does not have an active membership.`,
          estimatedRevenueCents: averagePlanValueCents,
          recommendedAction: "Invite them back with a trial-to-membership offer or a quick tour follow-up.",
          evidence: {
            memberId: member.id,
            visitCount,
            email: member.email
          }
        })
      ];
    });

    const bookingsByClient = completedBookingsByClient(data.importedBookings);
    const importedClientOpportunities = data.importedClients.flatMap((client) => {
      const key = clientKey(client.email, client.name);
      const completedBookings = bookingsByClient.get(key) ?? [];
      if (completedBookings.length !== 1 || hasActiveMembershipText(client.status, client.membershipName)) {
        return [];
      }
      return [
        this.createOpportunity(data, {
          type: "FIRST_VISIT_NOT_CONVERTED",
          title: `Convert ${client.name}`,
          description: `${client.name} completed one booking and does not appear to have an active membership.`,
          estimatedRevenueCents: averagePlanValueCents,
          recommendedAction: "Send a first-visit follow-up with membership, intro package, or consultation options.",
          evidence: {
            clientId: client.id,
            email: client.email,
            completedBookings: completedBookings.length
          }
        })
      ];
    });

    return [...realMemberOpportunities, ...importedClientOpportunities];
  }

  private detectHighUsageUpgrade(data: AnalysisData): RevenueOpportunity[] {
    const recentCutoff = new Date(data.now.getTime() - defaultWindowDays * dayMs);
    const recentCheckInsByMember = groupCheckInsByMember(data.checkIns.filter((checkIn) => checkIn.checkedInAt >= recentCutoff));
    const planById = new Map(data.plans.map((plan) => [plan.id, plan]));
    const realMemberOpportunities = data.members.flatMap((member) => {
      if (!activeMemberStatuses.has(member.status)) {
        return [];
      }
      const memberships = (data.membershipsByMemberId.get(member.id) ?? []).filter((membership) =>
        activeMembershipStatuses.has(membership.status)
      );
      const limitedPlan = memberships
        .map((membership) => planById.get(membership.planId))
        .find((plan): plan is MembershipPlan => Boolean(plan?.classAccessLimit && plan.classAccessLimit > 0));
      if (!limitedPlan?.classAccessLimit) {
        return [];
      }
      const usageCount = (recentCheckInsByMember.get(member.id) ?? []).length;
      const usageRatio = usageCount / limitedPlan.classAccessLimit;
      if (usageRatio < 0.8) {
        return [];
      }
      const upgradeValueCents = estimateUpgradeValueCents(limitedPlan, data.plans);
      return [
        this.createOpportunity(data, {
          type: "HIGH_USAGE_UPGRADE",
          title: `${memberName(member)} is ready for an upgrade`,
          description: `${memberName(member)} used ${usageCount} of ${limitedPlan.classAccessLimit} included visits this month.`,
          estimatedRevenueCents: upgradeValueCents,
          recommendedAction: "Recommend the next higher membership or an unlimited plan before they hit friction.",
          evidence: {
            memberId: member.id,
            planId: limitedPlan.id,
            planName: limitedPlan.name,
            usageCount,
            classAccessLimit: limitedPlan.classAccessLimit,
            usagePercent: roundTo(usageRatio * 100, 1)
          }
        })
      ];
    });

    const importedOpportunities = data.importedClients.flatMap((client) => {
      if (!activeTextStatus(client.status) || client.remainingCredits === undefined) {
        return [];
      }
      const totalCredits = client.totalCredits ?? estimatePackageCredits(client.membershipName, data.importedPackages);
      if (!totalCredits || totalCredits <= 0) {
        return [];
      }
      const usedCredits = Math.max(0, totalCredits - client.remainingCredits);
      const usageRatio = usedCredits / totalCredits;
      if (usageRatio < 0.8) {
        return [];
      }
      return [
        this.createOpportunity(data, {
          type: "HIGH_USAGE_UPGRADE",
          title: `${client.name} may need a higher plan`,
          description: `${client.name} appears to have used ${usedCredits} of ${totalCredits} credits.`,
          estimatedRevenueCents: 4500,
          recommendedAction: "Suggest a larger pack, unlimited plan, or premium membership before credits run out.",
          evidence: {
            clientId: client.id,
            email: client.email,
            membershipName: client.membershipName,
            usedCredits,
            totalCredits,
            remainingCredits: client.remainingCredits,
            usagePercent: roundTo(usageRatio * 100, 1)
          }
        })
      ];
    });

    return [...realMemberOpportunities, ...importedOpportunities];
  }

  private detectUnderusedServices(data: AnalysisData): RevenueOpportunity[] {
    const bookingCounts = serviceBookingCounts(data);
    return data.importedServices
      .filter((service) => service.active && service.priceCents >= meaningfulServicePriceCents)
      .filter((service) => (bookingCounts.get(normalizeKey(service.name)) ?? 0) < lowServiceBookingThreshold)
      .map((service) => {
        const bookingCount = bookingCounts.get(normalizeKey(service.name)) ?? 0;
        const missingBookings = lowServiceBookingThreshold - bookingCount;
        return this.createOpportunity(data, {
          type: "UNDERUSED_SERVICE",
          title: `Promote ${service.name}`,
          description: `${service.name} has only ${bookingCount} booking${bookingCount === 1 ? "" : "s"} in the selected window.`,
          estimatedRevenueCents: missingBookings * service.priceCents,
          recommendedAction: "Create a short campaign, staff mention, or bundle to test demand before removing the service.",
          evidence: {
            serviceId: service.id,
            serviceName: service.name,
            category: service.category,
            bookingCount,
            priceCents: service.priceCents,
            threshold: lowServiceBookingThreshold
          }
        });
      });
  }

  private detectPremiumProgramOpportunities(data: AnalysisData, resources: ResourceUtilization[]): RevenueOpportunity[] {
    const underusedResources = resources
      .filter((resource) => resource.utilizationPercent / 100 < underusedResourceThreshold)
      .sort((left, right) => left.utilizationPercent - right.utilizationPercent);
    if (underusedResources.length === 0) {
      return [];
    }

    const premiumServices = data.importedServices
      .filter((service) => service.active)
      .filter((service) => service.priceCents >= meaningfulServicePriceCents || isPremiumCategory(service.category))
      .sort((left, right) => right.priceCents - left.priceCents);
    const classType = data.classTypes.find((candidate) => isPremiumCategory(candidate.name));
    const suggestions = underusedResources.slice(0, 3).flatMap((resource) => {
      const service = findRelatedService(resource, premiumServices);
      if (!service && !classType) {
        return [];
      }
      const label = service?.name ?? classType?.name ?? "Premium program";
      const capacity = Math.max(4, service?.capacity ?? resource.capacity);
      const priceCents = Math.max(service?.priceCents ?? 0, 9900);
      return [
        this.createOpportunity(data, {
          type: "PREMIUM_PROGRAM_OPPORTUNITY",
          title: `Launch ${label} in ${resource.name}`,
          description: `${resource.name} has dead time and ${label} can turn idle capacity into premium revenue.`,
          estimatedRevenueCents: capacity * priceCents,
          recommendedAction: "Build a limited-run premium program in the open window and invite high-intent clients first.",
          evidence: {
            resourceKey: resource.key,
            resourceName: resource.name,
            utilizationPercent: resource.utilizationPercent,
            suggestedProgram: label,
            capacity,
            priceCents
          }
        })
      ];
    });
    return suggestions;
  }

  private createOpportunity(
    data: AnalysisData,
    input: {
      type: RevenueOpportunityType;
      title: string;
      description: string;
      estimatedRevenueCents: number;
      recommendedAction: string;
      evidence: Record<string, unknown>;
    }
  ): RevenueOpportunity {
    const estimatedRevenueCents = Math.max(0, Math.round(input.estimatedRevenueCents));
    return {
      id: randomUUID(),
      gymId: data.gymId,
      type: input.type,
      title: input.title,
      description: input.description,
      priority: priorityFor(input.type, estimatedRevenueCents),
      estimatedRevenue: roundTo(estimatedRevenueCents / 100, 2),
      estimatedRevenueCents,
      recommendedAction: input.recommendedAction,
      evidence: input.evidence,
      createdAt: data.now
    };
  }
}

function toImportedClient(record: CampaignImportRecord): ImportedClient {
  const fullName = readString(record, ["full_name", "name", "client name", "member name"]);
  const firstName = readString(record, ["first_name", "first name", "firstname"]);
  const lastName = readString(record, ["last_name", "last name", "lastname"]);
  const name = fullName ?? ([firstName, lastName].filter(Boolean).join(" ") || "Imported client");
  return {
    id: record.id,
    email: normalizeEmail(readString(record, ["email", "email address", "client_email", "member_email"])),
    phone: readString(record, ["phone", "phone_number", "mobile", "cell", "cell_phone"]),
    name,
    status: readString(record, ["status", "member_status", "membership_status", "account status"]),
    membershipName: readString(record, ["membership_name", "membership", "plan", "package", "package_name"]),
    remainingCredits: readNumber(record, ["remaining_credits", "credits_remaining", "unused_credits", "remaining credits"]),
    totalCredits: readNumber(record, ["total_credits", "credits", "sessions_included", "visits_included", "total credits"]),
    lastVisitDate: readDate(record, ["last_visit_date", "last visit", "last_check_in", "last check-in", "last attendance"]),
    record
  };
}

function toImportedBooking(record: CampaignImportRecord): ImportedBooking {
  const startsAt = parseBookingStart(record);
  const endsAt = parseBookingEnd(record, startsAt);
  return {
    id: record.id,
    clientEmail: normalizeEmail(readString(record, ["client_email", "email", "member_email", "customer_email"])),
    clientName: readString(record, ["client_name", "name", "member_name", "customer_name"]),
    serviceName: readString(record, ["service_name", "service", "class", "appointment", "booking type"]),
    roomName: readString(record, ["room_name", "room", "resource", "resource_name", "device"]),
    status: readString(record, ["status", "booking_status", "attendance", "attended"]),
    startsAt,
    endsAt,
    durationHours: startsAt && endsAt ? Math.max(0.25, hoursBetween(startsAt, endsAt)) : 1,
    record
  };
}

function toImportedService(record: CampaignImportRecord): ImportedService {
  const durationMinutes = readNumber(record, ["duration_minutes", "duration", "minutes"]);
  return {
    id: record.id,
    name: readString(record, ["service_name", "service", "name", "item"]) ?? "Imported service",
    category: readString(record, ["category", "type", "service_type"]),
    priceCents: readMoneyCents(record, ["price", "amount", "cost", "rate"]),
    durationMinutes,
    capacity: Math.max(1, Math.round(readNumber(record, ["capacity", "spots", "max_clients"]) ?? 1)),
    active: readBoolean(record, ["active", "enabled", "visible", "status"]) ?? true,
    record
  };
}

function toImportedResource(record: CampaignImportRecord): ImportedResource {
  return {
    id: record.id,
    name: readString(record, ["name", "room", "room_name", "device", "resource"]) ?? "Imported resource",
    resourceType: readString(record, ["resource_type", "type", "device_type", "category"]) ?? "resource",
    capacity: Math.max(1, Math.round(readNumber(record, ["capacity", "spots", "people"]) ?? 1)),
    active: readBoolean(record, ["active", "enabled", "status"]) ?? true,
    bookable: readBoolean(record, ["bookable", "reservable", "rentable", "available"]) ?? true,
    record
  };
}

function toImportedPackage(record: CampaignImportRecord): ImportedPackage {
  return {
    id: record.id,
    name: readString(record, ["package_name", "membership_name", "plan", "name", "package"]) ?? "Imported package",
    planType: readString(record, ["plan_type", "type", "membership_type"]),
    priceCents: readMoneyCents(record, ["price", "amount", "cost", "dues"]),
    billingFrequency: readString(record, ["billing_frequency", "billing", "frequency", "interval"]),
    sessionsIncluded: readNumber(record, ["sessions_included", "sessions", "credits", "visits"]),
    active: readBoolean(record, ["active", "enabled", "status"]) ?? true,
    record
  };
}

function toImportedPayment(record: CampaignImportRecord): ImportedPayment {
  return {
    id: record.id,
    clientEmail: normalizeEmail(readString(record, ["client_email", "email", "member_email", "customer_email"])),
    clientName: readString(record, ["client_name", "name", "member_name", "customer_name"]),
    amountCents: readMoneyCents(record, ["amount", "total", "paid", "payment", "price"]),
    status: readString(record, ["status", "payment_status", "state"]),
    paidAt: readDate(record, ["payment_date", "date", "paid_date", "transaction_date"]),
    description: readString(record, ["description", "memo", "note", "item", "product"]),
    record
  };
}

function readString(record: CampaignImportRecord, keys: string[]) {
  const value = readUnknown(record, keys);
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function readNumber(record: CampaignImportRecord, keys: string[]) {
  const value = readUnknown(record, keys);
  return numberFromUnknown(value);
}

function readMoneyCents(record: CampaignImportRecord, keys: string[]) {
  const value = readUnknown(record, keys);
  const parsed = numberFromUnknown(value);
  if (parsed === undefined || parsed <= 0) {
    return 0;
  }
  return Math.round(parsed * 100);
}

function readBoolean(record: CampaignImportRecord, keys: string[]) {
  const value = readUnknown(record, keys);
  if (typeof value === "boolean") {
    return value;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = normalizeKey(String(value));
  if (["true", "yes", "y", "active", "enabled", "available", "bookable", "1"].includes(normalized)) {
    return true;
  }
  if (["false", "no", "n", "inactive", "disabled", "unavailable", "0"].includes(normalized)) {
    return false;
  }
  return undefined;
}

function readDate(record: CampaignImportRecord, keys: string[]) {
  const value = readUnknown(record, keys);
  return dateFromUnknown(value);
}

function readUnknown(record: CampaignImportRecord, keys: string[]) {
  const normalizedKeys = new Set(keys.map(normalizeKey));
  for (const source of [record.normalizedJson, record.sourceRowJson]) {
    for (const [key, value] of Object.entries(source)) {
      if (normalizedKeys.has(normalizeKey(key))) {
        return value;
      }
    }
  }
  return undefined;
}

function parseBookingStart(record: CampaignImportRecord) {
  const start = readDate(record, ["start_time", "start", "start_datetime", "starts_at"]);
  if (start) {
    return start;
  }
  const date = readString(record, ["booking_date", "date", "scheduled_date"]);
  const time = readString(record, ["start_time", "start", "time"]);
  return parseDateAndTime(date, time);
}

function parseBookingEnd(record: CampaignImportRecord, startsAt: Date | undefined) {
  const end = readDate(record, ["end_time", "end", "end_datetime", "ends_at"]);
  if (end) {
    return end;
  }
  const date = readString(record, ["booking_date", "date", "scheduled_date"]);
  const time = readString(record, ["end_time", "end"]);
  const combined = parseDateAndTime(date, time);
  if (combined) {
    return combined;
  }
  const durationMinutes = readNumber(record, ["duration_minutes", "duration", "minutes"]);
  if (startsAt && durationMinutes && durationMinutes > 0) {
    return new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
  }
  return undefined;
}

function parseDateAndTime(date: string | undefined, time: string | undefined) {
  if (!date && !time) {
    return undefined;
  }
  const dateOnly = date ? dateFromUnknown(date) : undefined;
  if (!dateOnly) {
    return dateFromUnknown(time);
  }
  if (!time) {
    return dateOnly;
  }
  const direct = dateFromUnknown(`${date} ${time}`);
  if (direct) {
    return direct;
  }
  const [hours, minutes] = parseTimeParts(time);
  if (hours === undefined) {
    return dateOnly;
  }
  const resolved = new Date(dateOnly);
  resolved.setHours(hours, minutes ?? 0, 0, 0);
  return resolved;
}

function parseTimeParts(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) {
    return [undefined, undefined] as const;
  }
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const marker = match[3]?.toLowerCase();
  if (marker === "pm" && hours < 12) {
    hours += 12;
  }
  if (marker === "am" && hours === 12) {
    hours = 0;
  }
  return [hours, minutes] as const;
}

function numberFromUnknown(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.replace(/[$,%\s]/g, "").replace(/,/g, "");
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function dateFromUnknown(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeEmail(value: string | undefined) {
  return value?.trim().toLowerCase();
}

function normalizeKey(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function importedResourceKey(name: string) {
  return `imported:${normalizeKey(name)}`;
}

function clientKey(email: string | undefined, name: string | undefined) {
  const emailKey = normalizeEmail(email);
  return emailKey ? `email:${emailKey}` : `name:${normalizeKey(name)}`;
}

function memberName(member: Member) {
  return `${member.firstName} ${member.lastName}`.trim() || member.email || "Member";
}

function dayCount(from: Date, to: Date) {
  return Math.max(1, Math.ceil(Math.max(1, to.getTime() - from.getTime()) / dayMs));
}

function hoursBetween(from: Date, to: Date) {
  return Math.max(0, (to.getTime() - from.getTime()) / (60 * 60 * 1000));
}

function overlaps(leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date) {
  return leftStart < rightEnd && leftEnd > rightStart;
}

function clampDate(date: Date, from: Date, to: Date) {
  return new Date(Math.min(to.getTime(), Math.max(from.getTime(), date.getTime())));
}

function isWithin(date: Date, from: Date, to: Date) {
  return date >= from && date <= to;
}

function roundTo(value: number, decimals: number) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function latestDate(dates: Date[]) {
  return dates.reduce<Date | undefined>((latest, date) => {
    if (!latest || date.getTime() > latest.getTime()) {
      return date;
    }
    return latest;
  }, undefined);
}

function formatDate(date: Date | undefined) {
  return date ? date.toISOString().slice(0, 10) : "an unknown date";
}

function currentWeekRange(now: Date) {
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const day = from.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  from.setDate(from.getDate() + mondayOffset);
  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  return { from, to };
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKeysInRange(from: Date, to: Date) {
  const keys: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor < end && keys.length < 370) {
    keys.push(dateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys.length ? keys : [dateKey(from)];
}

function weekdayLabel(key: string) {
  const date = new Date(`${key}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return key;
  }
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function timeBlockLabel(date: Date) {
  const hour = date.getHours() + date.getMinutes() / 60;
  return timeBlocks.find((block) => hour >= block.startsAt && hour < block.endsAt)?.label ?? timeBlocks[0].label;
}

function estimateDailyHours(hours: ReservableResource["rentableHours"]) {
  if (!hours) {
    return undefined;
  }
  const totals = Object.values(hours)
    .filter((ranges): ranges is NonNullable<typeof ranges> => Array.isArray(ranges) && ranges.length > 0)
    .map((ranges) =>
      ranges.reduce((total, range) => total + Math.max(0, timeToHours(range.closesAt) - timeToHours(range.opensAt)), 0)
    );
  if (totals.length === 0) {
    return undefined;
  }
  return Math.max(1, totals.reduce((total, hoursValue) => total + hoursValue, 0) / totals.length);
}

function timeToHours(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) + Number(minutes) / 60;
}

function averageServiceHourlyValueCents(services: ImportedService[]) {
  const hourlyValues = services
    .filter((service) => service.priceCents > 0)
    .map((service) => {
      const durationHours = Math.max(0.5, (service.durationMinutes ?? 60) / 60);
      return service.priceCents / durationHours;
    });
  if (hourlyValues.length === 0) {
    return 3500;
  }
  return Math.round(hourlyValues.reduce((total, value) => total + value, 0) / hourlyValues.length);
}

function toRoomDeviceUtilization(resource: DetailedResourceUtilization): RoomDeviceUtilization {
  const targetHours = resource.availableHours * resourceTargetUtilization;
  const missedHours = Math.max(0, targetHours - resource.bookedHours);
  const estimatedMissedRevenueCents = Math.round(missedHours * resource.hourlyValueCents);
  const busiest = busiestDay(resource.dayHours);
  const weakest = weakestDay(resource.dayHours);
  const weakestBlock = weakestTimeBlock(resource.timeBlockHours);
  return {
    id: resource.key,
    name: resource.name,
    type: resource.resourceType,
    bookedHoursThisWeek: roundTo(resource.bookedHours, 1),
    availableHoursThisWeek: roundTo(resource.availableHours, 1),
    utilizationPercentage: roundTo(resource.utilizationPercent, 1),
    estimatedRevenue: roundTo(resource.revenueCents / 100, 2),
    estimatedRevenueCents: resource.revenueCents,
    estimatedMissedRevenue: roundTo(estimatedMissedRevenueCents / 100, 2),
    estimatedMissedRevenueCents,
    busiestDay: busiest,
    weakestDay: weakest,
    weakestTimeBlock: weakestBlock,
    bookingCount: resource.bookingCount,
    serviceCategories: uniqueSorted([...resource.serviceCategories])
  };
}

function summarizeResourceUtilization(resources: RoomDeviceUtilization[]): ResourceUtilizationDashboardResult["summary"] {
  const bookedHours = roundTo(resources.reduce((total, resource) => total + resource.bookedHoursThisWeek, 0), 1);
  const availableHours = roundTo(resources.reduce((total, resource) => total + resource.availableHoursThisWeek, 0), 1);
  return {
    bookedHours,
    availableHours,
    utilizationPercentage: availableHours > 0 ? roundTo((bookedHours / availableHours) * 100, 1) : 0,
    estimatedRevenueCents: resources.reduce((total, resource) => total + resource.estimatedRevenueCents, 0),
    estimatedMissedRevenueCents: resources.reduce((total, resource) => total + resource.estimatedMissedRevenueCents, 0),
    resourceCount: resources.length
  };
}

function busiestDay(dayHours: Map<string, number>) {
  const entries = [...dayHours.entries()];
  if (entries.every(([, hours]) => hours <= 0)) {
    return "No bookings yet";
  }
  const [key, hours] = entries.sort((left, right) => right[1] - left[1])[0] ?? ["", 0];
  return `${weekdayLabel(key)} (${roundTo(hours, 1)}h)`;
}

function weakestDay(dayHours: Map<string, number>) {
  const [key, hours] = [...dayHours.entries()].sort((left, right) => left[1] - right[1])[0] ?? ["", 0];
  return `${weekdayLabel(key)} (${roundTo(hours, 1)}h)`;
}

function weakestTimeBlock(timeBlockHours: Map<string, number>) {
  const [label, hours] = [...timeBlockHours.entries()].sort((left, right) => left[1] - right[1])[0] ?? [timeBlocks[0].label, 0];
  return `${label} (${roundTo(hours, 1)}h)`;
}

function uniqueSorted(values: Array<string | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))]
    .sort((left, right) => left.localeCompare(right));
}

function serviceMatchesCategory(value: string | undefined, filter: string | undefined) {
  if (!filter) {
    return true;
  }
  return normalizeKey(value) === normalizeKey(filter);
}

function groupCheckInsByMember(checkIns: CheckIn[]) {
  const grouped = new Map<string, CheckIn[]>();
  for (const checkIn of checkIns) {
    const rows = grouped.get(checkIn.memberId) ?? [];
    rows.push(checkIn);
    grouped.set(checkIn.memberId, rows);
  }
  return grouped;
}

function buildSegmentClients(data: AnalysisData) {
  const clients = new Map<string, SegmentClient>();
  const checkInsByMember = groupCheckInsByMember(data.checkIns);
  const paymentsByClient = new Map<string, ImportedPayment[]>();
  const importedBookingsByClient = new Map<string, ImportedBooking[]>();

  for (const payment of data.importedPayments.filter(paymentCountsTowardSpend)) {
    const key = clientKey(payment.clientEmail, payment.clientName);
    const rows = paymentsByClient.get(key) ?? [];
    rows.push(payment);
    paymentsByClient.set(key, rows);
  }

  for (const booking of data.importedBookings.filter((candidate) => !bookingStatusIsCancelled(candidate.status))) {
    const key = clientKey(booking.clientEmail, booking.clientName);
    const rows = importedBookingsByClient.get(key) ?? [];
    rows.push(booking);
    importedBookingsByClient.set(key, rows);
  }

  const ensureClient = (key: string, input: Partial<SegmentClient> & Pick<SegmentClient, "id" | "name">) => {
    const existing = clients.get(key);
    if (existing) {
      existing.email = existing.email ?? input.email;
      existing.phone = existing.phone ?? input.phone;
      existing.membershipStatus = input.membershipStatus && existing.membershipStatus === "Unknown"
        ? input.membershipStatus
        : existing.membershipStatus;
      existing.hasMembership = existing.hasMembership || Boolean(input.hasMembership);
      existing.activeMembership = existing.activeMembership || Boolean(input.activeMembership);
      existing.activeMember = existing.activeMember || Boolean(input.activeMember);
      existing.lastVisitDate = latestDate([
        ...[existing.lastVisitDate].filter((date): date is Date => Boolean(date)),
        ...[input.lastVisitDate].filter((date): date is Date => Boolean(date))
      ]);
      existing.remainingCredits = existing.remainingCredits ?? input.remainingCredits;
      return existing;
    }
    const created: SegmentClient = {
      id: input.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      membershipStatus: input.membershipStatus ?? "Unknown",
      hasMembership: Boolean(input.hasMembership),
      activeMembership: Boolean(input.activeMembership),
      activeMember: Boolean(input.activeMember),
      lastVisitDate: input.lastVisitDate,
      remainingCredits: input.remainingCredits,
      totalSpendCents: 0,
      completedBookingCount: 0,
      bookings: [],
      completedVisitDates: []
    };
    clients.set(key, created);
    return created;
  };

  for (const importedClient of data.importedClients) {
    const key = clientKey(importedClient.email, importedClient.name);
    ensureClient(key, {
      id: importedClient.id,
      name: importedClient.name,
      email: importedClient.email,
      phone: importedClient.phone,
      membershipStatus: importedClient.status ?? importedClient.membershipName ?? "Unknown",
      hasMembership: hasActiveMembershipText(importedClient.status, importedClient.membershipName),
      activeMembership: hasActiveMembershipText(importedClient.status, importedClient.membershipName),
      activeMember: activeTextStatus(importedClient.status),
      lastVisitDate: importedClient.lastVisitDate,
      remainingCredits: importedClient.remainingCredits
    });
  }

  for (const member of data.members) {
    const memberships = data.membershipsByMemberId.get(member.id) ?? [];
    const activeMembership = memberships.some((membership) => activeMembershipStatuses.has(membership.status));
    const lastVisitDate = latestDate((checkInsByMember.get(member.id) ?? []).map((checkIn) => checkIn.checkedInAt));
    const key = clientKey(member.email, memberName(member));
    const client = ensureClient(key, {
      id: member.id,
      name: memberName(member),
      email: member.email,
      phone: member.phone,
      membershipStatus: activeMembership ? MembershipStatus.Active : member.status,
      hasMembership: memberships.length > 0,
      activeMembership,
      activeMember: activeMemberStatuses.has(member.status),
      lastVisitDate
    });
    const completedVisits = (checkInsByMember.get(member.id) ?? []).map((checkIn) => checkIn.checkedInAt);
    client.completedVisitDates.push(...completedVisits);
  }

  const classTypeById = new Map(data.classTypes.map((classType) => [classType.id, classType]));
  const sessionById = new Map(data.sessions.map((session) => [session.id, session]));
  for (const [sessionId, bookings] of data.classBookingsBySessionId.entries()) {
    const session = sessionById.get(sessionId);
    const classType = session ? classTypeById.get(session.classTypeId) : undefined;
    if (!session || !classType) {
      continue;
    }
    for (const booking of bookings.filter((candidate) => candidate.status !== BookingStatus.Cancelled)) {
      const member = data.members.find((candidate) => candidate.id === booking.memberId);
      if (!member) {
        continue;
      }
      const client = ensureClient(clientKey(member.email, memberName(member)), {
        id: member.id,
        name: memberName(member),
        email: member.email,
        phone: member.phone,
        membershipStatus: member.status,
        activeMember: activeMemberStatuses.has(member.status)
      });
      client.bookings.push({
        serviceName: classType.name,
        startsAt: session.startsAt,
        status: booking.status
      });
    }
  }

  for (const [key, bookings] of importedBookingsByClient.entries()) {
    const sample = bookings[0];
    if (!sample) {
      continue;
    }
    const client = ensureClient(key, {
      id: sample.id,
      name: sample.clientName ?? sample.clientEmail ?? "Imported client",
      email: sample.clientEmail,
      membershipStatus: "Unknown"
    });
    for (const booking of bookings) {
      client.bookings.push({
        serviceName: booking.serviceName,
        startsAt: booking.startsAt,
        status: booking.status
      });
      if (booking.startsAt && bookingStatusIsCompleted(booking.status)) {
        client.completedVisitDates.push(booking.startsAt);
      }
    }
    client.completedBookingCount += bookings.filter((booking) => bookingStatusIsCompleted(booking.status)).length;
    client.lastVisitDate = latestDate([
      ...[client.lastVisitDate].filter((date): date is Date => Boolean(date)),
      ...bookings.map((booking) => booking.startsAt).filter((date): date is Date => Boolean(date))
    ]);
  }

  for (const [key, payments] of paymentsByClient.entries()) {
    const sample = payments[0];
    if (!sample) {
      continue;
    }
    const client = ensureClient(key, {
      id: sample.id,
      name: sample.clientName ?? sample.clientEmail ?? "Imported client",
      email: sample.clientEmail,
      membershipStatus: "Unknown"
    });
    client.totalSpendCents += payments.reduce((total, payment) => total + payment.amountCents, 0);
  }

  for (const client of clients.values()) {
    if (client.completedBookingCount === 0) {
      client.completedBookingCount = client.completedVisitDates.length;
    }
  }

  return [...clients.values()];
}

function activeTextStatus(status: string | undefined) {
  const normalized = normalizeKey(status);
  return !normalized || ["active", "member", "current", "trial", "paid", "ok"].includes(normalized);
}

function hasActiveMembershipText(status: string | undefined, membershipName: string | undefined) {
  const normalizedStatus = normalizeKey(status);
  if (["active", "member", "current", "paid"].includes(normalizedStatus)) {
    return true;
  }
  return Boolean(membershipName && !["none", "no", "n/a", "trial", "lead"].includes(normalizeKey(membershipName)));
}

function bookingStatusIsCancelled(status: string | undefined) {
  return cancelledBookingStatuses.has(normalizeKey(status));
}

function bookingStatusIsCompleted(status: string | undefined) {
  const normalized = normalizeKey(status);
  return completedImportedBookingStatuses.has(normalized);
}

function latestImportedBookingByClient(bookings: ImportedBooking[]) {
  const latest = new Map<string, Date>();
  for (const booking of bookings) {
    if (!booking.startsAt || bookingStatusIsCancelled(booking.status)) {
      continue;
    }
    const key = clientKey(booking.clientEmail, booking.clientName);
    const existing = latest.get(key);
    if (!existing || booking.startsAt > existing) {
      latest.set(key, booking.startsAt);
    }
  }
  return latest;
}

function completedBookingsByClient(bookings: ImportedBooking[]) {
  const grouped = new Map<string, ImportedBooking[]>();
  for (const booking of bookings) {
    if (!bookingStatusIsCompleted(booking.status)) {
      continue;
    }
    const key = clientKey(booking.clientEmail, booking.clientName);
    const rows = grouped.get(key) ?? [];
    rows.push(booking);
    grouped.set(key, rows);
  }
  return grouped;
}

function estimateCreditValueCents(client: ImportedClient, packages: ImportedPackage[], plans: MembershipPlan[]) {
  const packageMatch = packages.find((candidate) => normalizeKey(candidate.name) === normalizeKey(client.membershipName));
  if (packageMatch?.sessionsIncluded && packageMatch.sessionsIncluded > 0 && packageMatch.priceCents > 0) {
    return Math.round(packageMatch.priceCents / packageMatch.sessionsIncluded);
  }
  const limitedPlan = plans.find((plan) => plan.classAccessLimit && normalizeKey(plan.name) === normalizeKey(client.membershipName));
  if (limitedPlan?.classAccessLimit && limitedPlan.priceCents > 0) {
    return Math.round(limitedPlan.priceCents / limitedPlan.classAccessLimit);
  }
  return 3500;
}

function averagePlanValue(plans: MembershipPlan[]) {
  const pricedPlans = plans.filter((plan) => plan.status === PlanStatus.Active && plan.priceCents > 0);
  if (pricedPlans.length === 0) {
    return 9900;
  }
  return Math.round(pricedPlans.reduce((total, plan) => total + plan.priceCents, 0) / pricedPlans.length);
}

function averageClientSpend(clients: SegmentClient[]) {
  if (clients.length === 0) {
    return 0;
  }
  return Math.round(clients.reduce((total, client) => total + client.totalSpendCents, 0) / clients.length);
}

function paymentCountsTowardSpend(payment: ImportedPayment) {
  if (payment.amountCents <= 0) {
    return false;
  }
  const status = normalizeKey(payment.status);
  return !["failed", "declined", "void", "voided", "refunded", "refund", "chargeback", "pending", "unpaid"].includes(status);
}

function mostRepeatedService(client: SegmentClient, cutoff: Date) {
  const counts = new Map<string, { serviceName: string; count: number }>();
  for (const booking of client.bookings) {
    if (!booking.startsAt || booking.startsAt.getTime() < cutoff.getTime() || !booking.serviceName) {
      continue;
    }
    const key = normalizeKey(booking.serviceName);
    const existing = counts.get(key) ?? { serviceName: booking.serviceName, count: 0 };
    existing.count += 1;
    counts.set(key, existing);
  }
  return [...counts.values()].filter((entry) => entry.count >= 3).sort((left, right) => right.count - left.count)[0];
}

function toClientSegmentRow(
  client: SegmentClient,
  recommendedAction: string,
  evidence: Record<string, unknown> = {}
): ClientSegmentRow {
  return {
    id: client.id,
    clientName: client.name,
    email: client.email,
    phone: client.phone,
    lastVisitDate: client.lastVisitDate,
    totalSpend: roundTo(client.totalSpendCents / 100, 2),
    totalSpendCents: client.totalSpendCents,
    membershipStatus: client.membershipStatus,
    recommendedAction,
    evidence: {
      remainingCredits: client.remainingCredits,
      completedBookings: client.completedBookingCount,
      activeMembership: client.activeMembership,
      ...evidence
    }
  };
}

function compareSegmentRows(left: ClientSegmentRow, right: ClientSegmentRow) {
  return (
    right.totalSpendCents - left.totalSpendCents ||
    (dateToTime(right.lastVisitDate) - dateToTime(left.lastVisitDate)) ||
    left.clientName.localeCompare(right.clientName)
  );
}

function dateToTime(date: Date | undefined) {
  return date?.getTime() ?? 0;
}

function estimateUpgradeValueCents(currentPlan: MembershipPlan, plans: MembershipPlan[]) {
  const recurringPlans = plans
    .filter((plan) => plan.status === PlanStatus.Active)
    .filter((plan) => plan.billingInterval === BillingInterval.Monthly || plan.billingInterval === BillingInterval.Yearly)
    .filter((plan) => plan.priceCents > currentPlan.priceCents)
    .sort((left, right) => left.priceCents - right.priceCents);
  const nextPlan = recurringPlans[0];
  return Math.max(2500, (nextPlan?.priceCents ?? currentPlan.priceCents + 4500) - currentPlan.priceCents);
}

function estimatePackageCredits(membershipName: string | undefined, packages: ImportedPackage[]) {
  const match = packages.find((candidate) => normalizeKey(candidate.name) === normalizeKey(membershipName));
  return match?.sessionsIncluded;
}

function serviceBookingCounts(data: AnalysisData) {
  const counts = new Map<string, number>();
  for (const booking of data.importedBookings) {
    if (!booking.serviceName || bookingStatusIsCancelled(booking.status) || (booking.startsAt && !isWithin(booking.startsAt, data.from, data.to))) {
      continue;
    }
    increment(counts, normalizeKey(booking.serviceName));
  }

  const classTypeById = new Map(data.classTypes.map((classType) => [classType.id, classType]));
  for (const session of data.sessions) {
    if (!isWithin(session.startsAt, data.from, data.to) || session.status === ClassSessionStatus.Cancelled) {
      continue;
    }
    const classType = classTypeById.get(session.classTypeId);
    if (!classType) {
      continue;
    }
    const bookings = data.classBookingsBySessionId.get(session.id) ?? [];
    const bookedCount = bookings.filter((booking) => booking.status !== BookingStatus.Cancelled).length;
    counts.set(normalizeKey(classType.name), (counts.get(normalizeKey(classType.name)) ?? 0) + bookedCount);
  }
  return counts;
}

function increment(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function isPremiumCategory(value: string | undefined) {
  const normalized = normalizeKey(value);
  return ["premium", "personaltraining", "training", "smallgroup", "clinic", "workshop", "swimlesson", "lesson"].some((key) =>
    normalized.includes(key)
  );
}

function findRelatedService(resource: ResourceUtilization, services: ImportedService[]) {
  const resourceKey = normalizeKey(`${resource.name} ${resource.resourceType}`);
  return services.find((service) => {
    const serviceKey = normalizeKey(`${service.name} ${service.category}`);
    const categoryKey = normalizeKey(service.category);
    return (
      serviceKey.includes(resourceKey) ||
      (categoryKey.length > 0 && resourceKey.includes(categoryKey)) ||
      isPremiumCategory(service.category)
    );
  }) ?? services[0];
}

function priorityFor(type: RevenueOpportunityType, estimatedRevenueCents: number): RevenueOpportunityPriority {
  if (estimatedRevenueCents >= 50000 || type === "INACTIVE_MEMBER" || type === "FIRST_VISIT_NOT_CONVERTED") {
    return "high";
  }
  if (estimatedRevenueCents >= 15000 || type === "UNDERUSED_RESOURCE" || type === "HIGH_USAGE_UPGRADE") {
    return "medium";
  }
  return "low";
}

function compareOpportunities(left: RevenueOpportunity, right: RevenueOpportunity) {
  const priorityScore: Record<RevenueOpportunityPriority, number> = { high: 3, medium: 2, low: 1 };
  return (
    priorityScore[right.priority] - priorityScore[left.priority] ||
    right.estimatedRevenueCents - left.estimatedRevenueCents ||
    left.title.localeCompare(right.title)
  );
}

function summarizeOpportunities(opportunities: RevenueOpportunity[]): RevenueOpportunityResult["summary"] {
  const byType = opportunityTypes.reduce<Record<RevenueOpportunityType, number>>((summary, type) => {
    summary[type] = 0;
    return summary;
  }, {} as Record<RevenueOpportunityType, number>);
  let high = 0;
  let medium = 0;
  let low = 0;
  let estimatedRevenueCents = 0;
  for (const opportunity of opportunities) {
    byType[opportunity.type] += 1;
    estimatedRevenueCents += opportunity.estimatedRevenueCents;
    if (opportunity.priority === "high") {
      high += 1;
    } else if (opportunity.priority === "medium") {
      medium += 1;
    } else {
      low += 1;
    }
  }
  return {
    total: opportunities.length,
    high,
    medium,
    low,
    estimatedRevenueCents,
    byType
  };
}
