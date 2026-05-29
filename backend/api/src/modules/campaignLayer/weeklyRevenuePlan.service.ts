import { randomUUID } from "node:crypto";
import { notFound } from "../../http/errors.js";
import type {
  WeeklyRevenuePlan,
  WeeklyRevenuePlanAction,
  WeeklyRevenuePlanCampaign,
  WeeklyRevenuePlanClient,
  WeeklyRevenuePlanResource
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
import type {
  ClientSegment,
  ClientSegmentRow,
  ClientSegmentationResult,
  RevenueOpportunityResult,
  RevenueOpportunityType,
  RoomDeviceUtilization
} from "./revenueOpportunity.service.js";
import { RevenueOpportunityService } from "./revenueOpportunity.service.js";
import { PremiumRecoveryProgramService } from "./premiumRecoveryProgram.service.js";

export class WeeklyRevenuePlanService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock,
    private readonly revenueOpportunityService: RevenueOpportunityService,
    private readonly premiumRecoveryProgramService: PremiumRecoveryProgramService
  ) {}

  async getOrCreateCurrentPlan(gymId: string) {
    const weekStartDate = weekStart(this.clock.now());
    const existing = await this.repositories.weeklyRevenuePlans.getPlanForWeek(
      gymId,
      weekStartDate
    );
    if (existing) {
      return { plan: existing };
    }
    const plan = await this.generatePlan(gymId, weekStartDate);
    return { plan: await this.repositories.weeklyRevenuePlans.createPlan(plan) };
  }

  async updateCurrentAction(gymId: string, actionId: string, done: boolean) {
    const weekStartDate = weekStart(this.clock.now());
    const plan = await this.repositories.weeklyRevenuePlans.getPlanForWeek(gymId, weekStartDate);
    if (!plan) {
      throw notFound("Weekly revenue plan was not found.");
    }
    let found = false;
    const now = this.clock.now();
    const actions = plan.actions.map((action) => {
      if (action.id !== actionId) {
        return action;
      }
      found = true;
      const next: WeeklyRevenuePlanAction = {
        ...action,
        done
      };
      if (done) {
        next.completedAt = now;
      } else {
        delete next.completedAt;
      }
      return next;
    });
    if (!found) {
      throw notFound("Weekly plan action was not found.");
    }
    return {
      plan: await this.repositories.weeklyRevenuePlans.updatePlan({
        ...plan,
        actions,
        updatedAt: now
      })
    };
  }

  private async generatePlan(gymId: string, weekStartDate: Date): Promise<WeeklyRevenuePlan> {
    const now = this.clock.now();
    const [opportunities, segments, utilization, programSuggestions] = await Promise.all([
      this.revenueOpportunityService.generate(gymId),
      this.revenueOpportunityService.clientSegments(gymId),
      this.revenueOpportunityService.utilization(gymId),
      this.premiumRecoveryProgramService.suggestPrograms(gymId)
    ]);
    const clients = clientsToContact(segments);
    const resources = utilization.resources.slice(0, 3).map(toPlanResource);
    const campaign = campaignForPlan(opportunities, segments);
    const programIdea = programSuggestions.suggestions[0];
    const actionInput: ActionBuildInput = {
      opportunities,
      segments,
      clients,
      resources,
      campaign
    };
    if (programIdea) {
      actionInput.programIdea = {
        title: programIdea.title,
        description: programIdea.description,
        schedule: programIdea.schedule,
        recommendedPriceCents: programIdea.recommendedPriceCents
      };
    }
    const actions = topActions(actionInput);
    return {
      id: randomUUID(),
      gymId,
      weekStartDate,
      summary: ownerSummary(opportunities, segments, resources),
      revenueLeaks: revenueLeaks(opportunities, segments, resources),
      totalEstimatedRevenueCents: opportunities.summary.estimatedRevenueCents,
      actions,
      sourceJson: {
        generatedAt: now.toISOString(),
        opportunityCount: opportunities.summary.total,
        segmentMatches: segments.summary.totalSegmentMatches,
        resourceCount: utilization.summary.resourceCount
      },
      createdAt: now,
      updatedAt: now
    };
  }
}

interface ActionBuildInput {
  opportunities: RevenueOpportunityResult;
  segments: ClientSegmentationResult;
  clients: WeeklyRevenuePlanClient[];
  resources: WeeklyRevenuePlanResource[];
  campaign: WeeklyRevenuePlanCampaign;
  programIdea?: WeeklyRevenuePlanAction["premiumProgramIdea"];
}

function topActions(input: ActionBuildInput): WeeklyRevenuePlanAction[] {
  const resource = input.resources[0];
  const actions: WeeklyRevenuePlanAction[] = [
    {
      id: randomUUID(),
      title: `Run: ${input.campaign.name}`,
      description: "Send one focused campaign to the highest-value segment this week.",
      estimatedRevenueCents: estimatedActionRevenue(input.opportunities, 0.35),
      ownerNote: "This is the simplest win: one message, one clear next step, one audience.",
      campaign: input.campaign,
      clients: input.clients.slice(0, 8),
      resources: resource ? [resource] : [],
      done: false
    },
    {
      id: randomUUID(),
      title: "Contact the warmest clients",
      description: "Reach out to the clients most likely to book, return, upgrade, or leave a review.",
      estimatedRevenueCents: estimatedActionRevenue(input.opportunities, 0.25),
      ownerNote: "Do this manually or assign it to the front desk. Keep it personal and short.",
      clients: input.clients.slice(0, 10),
      resources: [],
      done: false
    },
    {
      id: randomUUID(),
      title: input.programIdea ? `Test: ${input.programIdea.title}` : "Fix one underused resource",
      description: input.programIdea
        ? "Turn a weak schedule window into a small paid premium recovery offer."
        : "Pick the weakest room/device window and add a simple offer around it.",
      estimatedRevenueCents: input.programIdea
        ? input.programIdea.recommendedPriceCents * 6
        : estimatedActionRevenue(input.opportunities, 0.2),
      ownerNote: "Keep the first version small. A full program is not needed to validate demand.",
      clients: input.clients.slice(0, 5),
      resources: input.resources.slice(0, 2),
      ...(input.programIdea ? { premiumProgramIdea: input.programIdea } : {}),
      done: false
    }
  ];
  return actions;
}

function ownerSummary(
  opportunities: RevenueOpportunityResult,
  segments: ClientSegmentationResult,
  resources: WeeklyRevenuePlanResource[]
) {
  const topResource = resources[0]?.name ?? "one underused resource";
  return `This week, focus on one campaign, a short client contact list, and ${topResource}. The plan keeps attention on the few actions most likely to recover revenue without turning this into a big analytics project.`;
}

function revenueLeaks(
  opportunities: RevenueOpportunityResult,
  segments: ClientSegmentationResult,
  resources: WeeklyRevenuePlanResource[]
) {
  const leaks: string[] = [];
  const inactive = segmentCount(segments, "inactive_members");
  const unusedCredits = segmentCount(segments, "unused_credit_members");
  const firstVisits = segmentCount(segments, "first_time_visitors");
  if (opportunities.summary.estimatedRevenueCents > 0) {
    leaks.push(`${money(opportunities.summary.estimatedRevenueCents)} in estimated revenue opportunity is visible this week.`);
  }
  if (unusedCredits > 0) {
    leaks.push(`${unusedCredits} active clients have unused credits and need a booking nudge.`);
  }
  if (inactive > 0) {
    leaks.push(`${inactive} members look inactive and may need a simple win-back message.`);
  }
  if (firstVisits > 0) {
    leaks.push(`${firstVisits} first-time visitors have not converted yet.`);
  }
  if (resources[0]) {
    leaks.push(`${resources[0].name} is the clearest underused room/device to fix first.`);
  }
  return leaks.length ? leaks : ["No major revenue leak is obvious yet. Start by importing more clients, bookings, services, and room/device data."];
}

function campaignForPlan(
  opportunities: RevenueOpportunityResult,
  segments: ClientSegmentationResult
): WeeklyRevenuePlanCampaign {
  const topType = opportunities.opportunities[0]?.type ?? strongestSegmentCampaignType(segments);
  switch (topType) {
    case "UNUSED_CREDITS":
      return {
        name: "Unused credit reminder",
        targetSegment: segmentTarget(segments, "unused_credit_members"),
        smsMessage: "Hi {first_name}, you still have credits available. Want help finding a good time this week? Book here: {booking_link}",
        emailSubject: "Your unused credits are ready",
        emailBody: "Hi {first_name},\n\nYou still have credits available, and this week is a good time to use them. Book a class or service here: {booking_link}\n\nSee you soon."
      };
    case "INACTIVE_MEMBER":
      return {
        name: "Inactive member win-back",
        targetSegment: segmentTarget(segments, "inactive_members"),
        smsMessage: "Hi {first_name}, we miss seeing you. Want an easy restart option this week? Reply RESTART and we will help.",
        emailSubject: "Ready for an easy restart?",
        emailBody: "Hi {first_name},\n\nIt has been a little while since your last visit. We can help you restart with one simple session this week.\n\nBook here: {booking_link}"
      };
    case "FIRST_VISIT_NOT_CONVERTED":
      return {
        name: "First visit follow-up",
        targetSegment: segmentTarget(segments, "first_time_visitors"),
        smsMessage: "Hi {first_name}, thanks for visiting. Want help choosing your next best session? Reply NEXT and we will help.",
        emailSubject: "Your best next step",
        emailBody: "Hi {first_name},\n\nThanks for coming in. The best next step is to book again while the visit is fresh.\n\nChoose a time here: {booking_link}"
      };
    case "HIGH_USAGE_UPGRADE":
      return {
        name: "Membership upgrade",
        targetSegment: segmentTarget(segments, "upsell_candidates"),
        smsMessage: "Hi {first_name}, you have been booking consistently. A membership may save you money. Want us to compare options?",
        emailSubject: "A better-fit plan may be available",
        emailBody: "Hi {first_name},\n\nYou have been using the gym enough that a membership or larger package may fit better. Reply and we can compare options for you."
      };
    case "PREMIUM_PROGRAM_OPPORTUNITY":
    case "UNDERUSED_RESOURCE":
      return {
        name: "Off-peak recovery offer",
        targetSegment: "Flexible clients and recovery-minded members",
        smsMessage: "We opened a limited off-peak recovery session this week. Want a spot? Book here: {booking_link}",
        emailSubject: "New off-peak recovery openings",
        emailBody: "Hi {first_name},\n\nWe have quieter recovery windows this week and opened a limited session around them. Reserve a spot here: {booking_link}"
      };
    default:
      return {
        name: "Review request",
        targetSegment: segmentTarget(segments, "review_candidates"),
        smsMessage: "Hi {first_name}, would you share a quick review? It helps local people find us: {review_link}",
        emailSubject: "Would you share your experience?",
        emailBody: "Hi {first_name},\n\nThanks for showing up consistently. If we have helped you, would you leave a quick review here? {review_link}"
      };
  }
}

function clientsToContact(segments: ClientSegmentationResult) {
  const preferredOrder: Array<[ClientSegment["key"], string]> = [
    ["unused_credit_members", "Unused credits"],
    ["inactive_members", "Inactive member"],
    ["first_time_visitors", "First visit follow-up"],
    ["upsell_candidates", "Upgrade candidate"],
    ["review_candidates", "Review candidate"]
  ];
  const seen = new Set<string>();
  const clients: WeeklyRevenuePlanClient[] = [];
  for (const [key, reason] of preferredOrder) {
    const segment = segments.segments.find((item) => item.key === key);
    for (const row of segment?.clients ?? []) {
      const uniqueKey = row.email || row.phone || row.clientName;
      if (seen.has(uniqueKey)) {
        continue;
      }
      seen.add(uniqueKey);
      clients.push(toPlanClient(row, reason));
      if (clients.length >= 12) {
        return clients;
      }
    }
  }
  return clients;
}

function toPlanClient(row: ClientSegmentRow, reason: string): WeeklyRevenuePlanClient {
  const client: WeeklyRevenuePlanClient = {
    id: row.id,
    name: row.clientName,
    reason
  };
  if (row.email) {
    client.email = row.email;
  }
  if (row.phone) {
    client.phone = row.phone;
  }
  return client;
}

function toPlanResource(resource: RoomDeviceUtilization): WeeklyRevenuePlanResource {
  return {
    id: resource.id,
    name: resource.name,
    type: resource.type,
    weakestTimeBlock: `${resource.weakestDay}, ${resource.weakestTimeBlock}`,
    utilizationPercentage: resource.utilizationPercentage
  };
}

function strongestSegmentCampaignType(segments: ClientSegmentationResult): RevenueOpportunityType {
  const entries: Array<[ClientSegment["key"], RevenueOpportunityType]> = [
    ["unused_credit_members", "UNUSED_CREDITS"],
    ["inactive_members", "INACTIVE_MEMBER"],
    ["first_time_visitors", "FIRST_VISIT_NOT_CONVERTED"],
    ["upsell_candidates", "HIGH_USAGE_UPGRADE"]
  ];
  return entries
    .map(([key, type]) => ({ type, count: segmentCount(segments, key) }))
    .sort((left, right) => right.count - left.count)[0]?.type ?? "UNUSED_CREDITS";
}

function segmentTarget(segments: ClientSegmentationResult, key: ClientSegment["key"]) {
  const segment = segments.segments.find((item) => item.key === key);
  return `${segment?.label ?? "Clients"} (${segment?.count ?? 0})`;
}

function segmentCount(segments: ClientSegmentationResult, key: ClientSegment["key"]) {
  return segments.segments.find((segment) => segment.key === key)?.count ?? 0;
}

function estimatedActionRevenue(opportunities: RevenueOpportunityResult, share: number) {
  return Math.max(0, Math.round(opportunities.summary.estimatedRevenueCents * share));
}

function weekStart(now: Date) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const distanceFromMonday = (day + 6) % 7;
  date.setDate(date.getDate() - distanceFromMonday);
  return date;
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}
