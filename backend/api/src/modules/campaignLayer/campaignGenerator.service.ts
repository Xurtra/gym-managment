import type { CampaignGenerateInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { notFound } from "../../http/errors.js";
import type {
  CampaignGeneratorType,
  GeneratedCampaign
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
import type {
  ClientSegment,
  ClientSegmentationResult,
  RevenueOpportunity,
  RevenueOpportunityResult
} from "./revenueOpportunity.service.js";
import { RevenueOpportunityService } from "./revenueOpportunity.service.js";

interface CampaignTemplateInput {
  gymName: string;
  now: Date;
  segments: ClientSegmentationResult;
  opportunities: RevenueOpportunityResult;
}

interface CampaignTemplateResult {
  name: string;
  targetSegment: string;
  smsMessage: string;
  emailSubject: string;
  emailBody: string;
  recommendedSendTime: Date;
  expectedGoal: string;
  estimatedRevenueCents: number;
}

export class CampaignGeneratorService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock,
    private readonly revenueOpportunityService: RevenueOpportunityService
  ) {}

  async listCampaigns(gymId: string) {
    return { campaigns: await this.repositories.generatedCampaigns.listCampaignsForGym(gymId) };
  }

  async generateCampaign(gymId: string, userId: string, input: CampaignGenerateInput) {
    const gym = await this.repositories.gyms.getGym(gymId);
    if (!gym) {
      throw notFound("Gym was not found.");
    }
    const now = this.clock.now();
    const [segments, opportunities] = await Promise.all([
      this.revenueOpportunityService.clientSegments(gymId),
      this.revenueOpportunityService.generate(gymId)
    ]);
    const template = buildCampaignTemplate(input.campaignType, {
      gymName: gym.name,
      now,
      segments,
      opportunities
    });
    const campaign: GeneratedCampaign = {
      id: randomUUID(),
      gymId,
      campaignType: input.campaignType,
      name: template.name,
      targetSegment: template.targetSegment,
      smsMessage: template.smsMessage,
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      recommendedSendTime: template.recommendedSendTime,
      expectedGoal: template.expectedGoal,
      estimatedRevenueCents: template.estimatedRevenueCents,
      status: "draft",
      deliveryJson: {
        sendStatus: "draft",
        channels: {
          sms: {
            provider: "twilio",
            enabled: true,
            providerMessageId: null
          },
          email: {
            provider: "sendgrid",
            enabled: true,
            providerMessageId: null
          }
        }
      },
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now
    };
    return { campaign: await this.repositories.generatedCampaigns.createCampaign(campaign) };
  }
}

function buildCampaignTemplate(
  campaignType: CampaignGeneratorType,
  input: CampaignTemplateInput
): CampaignTemplateResult {
  switch (campaignType) {
    case "unused_credit_reminder":
      return unusedCreditReminder(input);
    case "inactive_member_win_back":
      return inactiveMemberWinBack(input);
    case "first_visit_follow_up":
      return firstVisitFollowUp(input);
    case "off_peak_room_fill":
      return offPeakRoomFill(input);
    case "premium_program_launch":
      return premiumProgramLaunch(input);
    case "review_request":
      return reviewRequest(input);
    case "membership_upgrade":
      return membershipUpgrade(input);
  }
  throw new Error(`Unsupported campaign type: ${campaignType}`);
}

function unusedCreditReminder(input: CampaignTemplateInput): CampaignTemplateResult {
  const segment = findSegment(input.segments, "unused_credit_members");
  const count = segment.count;
  return {
    name: "Unused credit reminder",
    targetSegment: `${segment.label} (${count})`,
    smsMessage: `Hi {first_name}, you still have credits waiting at ${input.gymName}. Want help finding a time this week? Book here: {booking_link}`,
    emailSubject: `Your ${input.gymName} credits are ready to use`,
    emailBody: `Hi {first_name},\n\nYou still have credits available at ${input.gymName}. A quick booking this week is the easiest way to keep your progress moving.\n\nRecommended next step: choose a class or service time here: {booking_link}\n\nSee you soon,\n${input.gymName}`,
    recommendedSendTime: recommendedSendTime(input.now, 10),
    expectedGoal: `Get ${goalCount(count, 0.22)} members to book before credits go stale.`,
    estimatedRevenueCents: count * 3500
  };
}

function inactiveMemberWinBack(input: CampaignTemplateInput): CampaignTemplateResult {
  const segment = findSegment(input.segments, "inactive_members");
  const count = segment.count;
  return {
    name: "Inactive member win-back",
    targetSegment: `${segment.label} (${count})`,
    smsMessage: `Hi {first_name}, we miss seeing you at ${input.gymName}. Want a simple restart plan or a class recommendation? Reply RESTART and we will help.`,
    emailSubject: `Ready for an easy restart at ${input.gymName}?`,
    emailBody: `Hi {first_name},\n\nIt has been a little while since your last visit, so we put together an easy restart path for you.\n\nReply to this email or book a low-pressure return session here: {booking_link}.\n\nWe would love to help you get momentum back,\n${input.gymName}`,
    recommendedSendTime: recommendedSendTime(input.now, 11),
    expectedGoal: `Reactivate ${goalCount(count, 0.12)} inactive members this month.`,
    estimatedRevenueCents: count * 6500
  };
}

function firstVisitFollowUp(input: CampaignTemplateInput): CampaignTemplateResult {
  const segment = findSegment(input.segments, "first_time_visitors");
  const count = segment.count;
  return {
    name: "First visit follow-up",
    targetSegment: `${segment.label} (${count})`,
    smsMessage: `Hi {first_name}, thanks for trying ${input.gymName}. Want help choosing the best next class or plan? Reply NEXT and we will point you in the right direction.`,
    emailSubject: `Your best next step after visiting ${input.gymName}`,
    emailBody: `Hi {first_name},\n\nThanks for coming in for your first visit. Based on what new clients usually need next, the best move is to book one more session while everything is fresh.\n\nYou can book here: {booking_link}\n\nWe are happy to help you choose the right fit,\n${input.gymName}`,
    recommendedSendTime: recommendedSendTime(input.now, 9),
    expectedGoal: `Convert ${goalCount(count, 0.2)} first-time visitors into a second booking or plan.`,
    estimatedRevenueCents: count * 9000
  };
}

function offPeakRoomFill(input: CampaignTemplateInput): CampaignTemplateResult {
  const resourceRevenue = sumOpportunities(input.opportunities, "UNDERUSED_RESOURCE");
  const premiumRevenue = sumOpportunities(input.opportunities, "PREMIUM_PROGRAM_OPPORTUNITY");
  const estimatedRevenueCents = Math.max(resourceRevenue, Math.round(premiumRevenue * 0.6), 15000);
  return {
    name: "Off-peak room fill",
    targetSegment: "Clients likely to book flexible/off-peak times",
    smsMessage: `Quick opening at ${input.gymName}: we have off-peak spots this week. Book a quieter time and keep your routine moving: {booking_link}`,
    emailSubject: `Open off-peak times at ${input.gymName}`,
    emailBody: `Hi {first_name},\n\nWe have quieter room and equipment windows this week. If your schedule is flexible, this is a good time to grab a spot without the rush.\n\nBook an off-peak session here: {booking_link}\n\nThanks,\n${input.gymName}`,
    recommendedSendTime: recommendedSendTime(input.now, 14),
    expectedGoal: "Fill weak time blocks and turn idle room/device time into paid bookings.",
    estimatedRevenueCents
  };
}

function premiumProgramLaunch(input: CampaignTemplateInput): CampaignTemplateResult {
  const segment = findSegment(input.segments, "high_value_clients");
  const count = segment.count;
  const opportunityRevenue = sumOpportunities(input.opportunities, "PREMIUM_PROGRAM_OPPORTUNITY");
  return {
    name: "Premium program launch",
    targetSegment: `${segment.label} and frequent bookers (${count})`,
    smsMessage: `${input.gymName} is opening a limited premium program. Want first access before spots are public? Reply PREMIUM and we will send details.`,
    emailSubject: `First access: new premium program at ${input.gymName}`,
    emailBody: `Hi {first_name},\n\nWe are opening a limited premium program built for members who are ready for more focused support.\n\nYou are getting early access before it is promoted publicly. Reply to this email or use this link to learn more: {program_link}\n\n${input.gymName}`,
    recommendedSendTime: recommendedSendTime(input.now, 10),
    expectedGoal: `Invite high-value clients into a premium offer and sell ${goalCount(count, 0.08)} spots.`,
    estimatedRevenueCents: Math.max(opportunityRevenue, count * 12000)
  };
}

function reviewRequest(input: CampaignTemplateInput): CampaignTemplateResult {
  const segment = findSegment(input.segments, "review_candidates");
  const count = segment.count;
  return {
    name: "Review request",
    targetSegment: `${segment.label} (${count})`,
    smsMessage: `Hi {first_name}, thanks for being part of ${input.gymName}. Would you share a quick review? It helps local people find us: {review_link}`,
    emailSubject: `Would you share your ${input.gymName} experience?`,
    emailBody: `Hi {first_name},\n\nYou have been showing up consistently, and we really appreciate having you here.\n\nIf ${input.gymName} has helped you, would you leave a quick review? It helps other people know what to expect: {review_link}\n\nThank you,\n${input.gymName}`,
    recommendedSendTime: recommendedSendTime(input.now, 13),
    expectedGoal: `Collect ${goalCount(count, 0.18)} new reviews from engaged clients.`,
    estimatedRevenueCents: 0
  };
}

function membershipUpgrade(input: CampaignTemplateInput): CampaignTemplateResult {
  const segment = findSegment(input.segments, "upsell_candidates");
  const count = segment.count;
  const highUsageRevenue = sumOpportunities(input.opportunities, "HIGH_USAGE_UPGRADE");
  return {
    name: "Membership upgrade",
    targetSegment: `${segment.label} (${count})`,
    smsMessage: `Hi {first_name}, you have been booking consistently at ${input.gymName}. A membership may save you money. Want us to compare options? Reply UPGRADE.`,
    emailSubject: `A better-fit plan may be available at ${input.gymName}`,
    emailBody: `Hi {first_name},\n\nYou have been using ${input.gymName} often enough that a membership or higher package may be a better fit than booking one session at a time.\n\nReply to this email and we can compare options for you, or view plans here: {plans_link}\n\n${input.gymName}`,
    recommendedSendTime: recommendedSendTime(input.now, 16),
    expectedGoal: `Move ${goalCount(count, 0.14)} clients into a membership or larger package.`,
    estimatedRevenueCents: Math.max(highUsageRevenue, count * 4500)
  };
}

function findSegment(segments: ClientSegmentationResult, key: ClientSegment["key"]) {
  return segments.segments.find((segment) => segment.key === key) ?? {
    key,
    label: fallbackSegmentLabel(key),
    description: "",
    count: 0,
    clients: []
  };
}

function fallbackSegmentLabel(key: ClientSegment["key"]) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sumOpportunities(
  opportunities: RevenueOpportunityResult,
  type: RevenueOpportunity["type"]
) {
  return opportunities.opportunities
    .filter((opportunity) => opportunity.type === type)
    .reduce((total, opportunity) => total + opportunity.estimatedRevenueCents, 0);
}

function goalCount(count: number, rate: number) {
  if (count <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(count * rate));
}

function recommendedSendTime(now: Date, hour: number) {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(hour, 0, 0, 0);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}
