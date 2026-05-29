import type { PremiumRecoveryProgramCreateInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { notFound } from "../../http/errors.js";
import type {
  PremiumRecoveryProgram
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
import type { RoomDeviceUtilization } from "./revenueOpportunity.service.js";
import { RevenueOpportunityService } from "./revenueOpportunity.service.js";

interface AvailableService {
  name: string;
  category: string;
  priceCents: number;
}

export type PremiumRecoveryProgramSuggestion = PremiumRecoveryProgramCreateInput & {
  reason: string;
};

export class PremiumRecoveryProgramService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock,
    private readonly revenueOpportunityService: RevenueOpportunityService
  ) {}

  async listPrograms(gymId: string) {
    return {
      programs: await this.repositories.premiumRecoveryPrograms.listProgramsForGym(gymId)
    };
  }

  async createProgram(gymId: string, userId: string, input: PremiumRecoveryProgramCreateInput) {
    const gym = await this.repositories.gyms.getGym(gymId);
    if (!gym) {
      throw notFound("Gym was not found.");
    }
    const now = this.clock.now();
    const program: PremiumRecoveryProgram = {
      id: randomUUID(),
      gymId,
      title: input.title,
      description: input.description,
      targetAudience: input.targetAudience,
      includedServices: input.includedServices,
      recommendedPriceCents: input.recommendedPriceCents,
      capacity: input.capacity,
      schedule: input.schedule,
      durationWeeks: input.durationWeeks,
      campaignCopy: input.campaignCopy,
      postProgramUpsell: input.postProgramUpsell,
      sourceJson: input.sourceJson ?? { source: "manual" },
      status: "draft",
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now
    };
    return {
      program: await this.repositories.premiumRecoveryPrograms.createProgram(program)
    };
  }

  async suggestPrograms(gymId: string) {
    const [utilization, services] = await Promise.all([
      this.revenueOpportunityService.utilization(gymId),
      this.availableServices(gymId)
    ]);
    const rows = utilization.resources
      .filter((resource) => resource.availableHoursThisWeek > 0)
      .filter((resource) => resource.utilizationPercentage < 60 || resource.estimatedMissedRevenueCents > 0)
      .sort((left, right) =>
        left.utilizationPercentage - right.utilizationPercentage ||
        right.estimatedMissedRevenueCents - left.estimatedMissedRevenueCents
      )
      .slice(0, 6);
    const suggestions = dedupeSuggestions(
      rows.map((resource) => suggestionFromResource(resource, services))
    );
    return {
      suggestions: suggestions.length ? suggestions : fallbackSuggestions(services),
      services
    };
  }

  private async availableServices(gymId: string): Promise<AvailableService[]> {
    const [batches, classTypes] = await Promise.all([
      this.repositories.campaignImports.listBatchesForGym(gymId),
      this.repositories.classes.listClassTypesForGym(gymId)
    ]);
    const serviceBatches = batches.filter((batch) => batch.importType === "services");
    const recordGroups = await Promise.all(
      serviceBatches.map((batch) => this.repositories.campaignImports.listRecordsForBatch(batch.id))
    );
    const importedServices = recordGroups
      .flat()
      .filter((record) => record.validationStatus !== "critical")
      .map((record) => {
        const name = stringValue(record.normalizedJson.service_name);
        if (!name) {
          return undefined;
        }
        return {
          name,
          category: stringValue(record.normalizedJson.category) || "Service",
          priceCents: numberToCents(record.normalizedJson.price)
        };
      })
      .filter((service): service is AvailableService => Boolean(service));
    const classServices = classTypes.map((classType) => ({
      name: classType.name,
      category: "Class",
      priceCents: 0
    }));
    return dedupeServices([...importedServices, ...classServices]);
  }
}

function suggestionFromResource(
  resource: RoomDeviceUtilization,
  services: AvailableService[]
): PremiumRecoveryProgramSuggestion {
  const flavor = resourceFlavor(resource);
  const schedule = scheduleFromResource(resource);
  const includedServices = includedServicesFor(resource, services, flavor);
  const base = baseProgramForFlavor(flavor, resource, schedule);
  return {
    ...base,
    includedServices,
    sourceJson: {
      source: "utilization",
      resourceId: resource.id,
      resourceName: resource.name,
      utilizationPercentage: resource.utilizationPercentage,
      weakestDay: resource.weakestDay,
      weakestTimeBlock: resource.weakestTimeBlock,
      serviceCategories: resource.serviceCategories
    },
    reason: `${resource.name} is underused at ${schedule} with ${Math.round(resource.utilizationPercentage)}% utilization.`
  };
}

function baseProgramForFlavor(
  flavor: string,
  resource: RoomDeviceUtilization,
  schedule: string
): Omit<PremiumRecoveryProgramSuggestion, "includedServices" | "sourceJson" | "reason"> {
  if (flavor === "sauna_sunday") {
    return {
      title: "Sunday Nervous System Reset",
      description: "A guided downshift session built around heat, breathwork, and quiet recovery before the work week.",
      targetAudience: "Busy members, high-stress professionals, and recovery-focused clients who want a calmer weekly routine.",
      recommendedPriceCents: 4900,
      capacity: capacityFromResource(resource, 8),
      schedule,
      durationWeeks: 1,
      campaignCopy: "Reset before Monday with a guided sauna and breathwork session designed to help your nervous system settle.",
      postProgramUpsell: "Offer a monthly recovery membership or sauna add-on after the session."
    };
  }
  if (flavor === "sauna") {
    return {
      title: "Breathwork + Sauna Reset",
      description: "A heat-based recovery session pairing coached breathing with structured sauna intervals.",
      targetAudience: "Members who want stress relief, better recovery, and a premium guided sauna experience.",
      recommendedPriceCents: 5900,
      capacity: capacityFromResource(resource, 8),
      schedule,
      durationWeeks: 1,
      campaignCopy: "Turn an open sauna window into a guided reset with breathwork, heat intervals, and a clear recovery plan.",
      postProgramUpsell: "Invite attendees into a 4-pack recovery series or unlimited recovery upgrade."
    };
  }
  if (flavor === "cold_morning") {
    return {
      title: "Morning Contrast Reset",
      description: "A short guided cold plunge or contrast recovery session for weekday morning energy and resilience.",
      targetAudience: "Early risers, professionals, and athletes who want a sharper morning recovery ritual.",
      recommendedPriceCents: 3900,
      capacity: capacityFromResource(resource, 6),
      schedule,
      durationWeeks: 1,
      campaignCopy: "Start the day with a coached contrast reset using cold exposure, breathing, and a simple recovery protocol.",
      postProgramUpsell: "Offer a recurring morning contrast pack or recovery membership add-on."
    };
  }
  if (flavor === "cold") {
    return {
      title: "Guided Cold Plunge Intro",
      description: "A beginner-friendly cold exposure session with coaching, safety cues, and a repeatable protocol.",
      targetAudience: "Cold plunge curious members and clients who need confidence before using cold recovery alone.",
      recommendedPriceCents: 3900,
      capacity: capacityFromResource(resource, 6),
      schedule,
      durationWeeks: 1,
      campaignCopy: "Curious about cold plunge? Join a guided intro and learn exactly how to use it safely and effectively.",
      postProgramUpsell: "Move attendees into a contrast therapy pack or recovery room subscription."
    };
  }
  if (flavor === "red_light") {
    return {
      title: "Red Light Recovery Pack",
      description: "A multi-session recovery pack built around consistent red light use and simple progress tracking.",
      targetAudience: "Members interested in recovery, soreness management, skin health, and low-impact wellness habits.",
      recommendedPriceCents: 14900,
      capacity: capacityFromResource(resource, 10),
      schedule,
      durationWeeks: 4,
      campaignCopy: "Try a 4-week red light recovery pack with guided session timing and a simple weekly plan.",
      postProgramUpsell: "Offer a monthly red light membership or recovery bundle after week four."
    };
  }
  if (flavor === "runner") {
    return {
      title: "Runner Recovery Program",
      description: "A structured recovery block for runners using mobility, compression, and targeted recovery services.",
      targetAudience: "Runners, endurance athletes, and members preparing for races or returning from heavy training blocks.",
      recommendedPriceCents: 19900,
      capacity: capacityFromResource(resource, 10),
      schedule,
      durationWeeks: 4,
      campaignCopy: "Training hard? Build recovery into your running week with a guided 4-week recovery protocol.",
      postProgramUpsell: "Invite graduates into a monthly athlete recovery membership."
    };
  }
  if (flavor === "sleep") {
    return {
      title: "4-Week Sleep Reset",
      description: "A four-week recovery program combining calming services, light guidance, and weekly habit structure.",
      targetAudience: "Members struggling with stress, inconsistent sleep, or recovery habits outside the gym.",
      recommendedPriceCents: 17900,
      capacity: capacityFromResource(resource, 10),
      schedule,
      durationWeeks: 4,
      campaignCopy: "Use recovery tools, calming sessions, and weekly structure to reset your sleep routine over four weeks.",
      postProgramUpsell: "Offer continued recovery coaching or a premium wellness membership."
    };
  }
  return {
    title: "Athlete Recovery Protocol",
    description: "A premium recovery block using available rooms, devices, and services during underused time windows.",
    targetAudience: "Athletes, frequent class attendees, and members who train hard but need a structured recovery plan.",
    recommendedPriceCents: 12900,
    capacity: capacityFromResource(resource, 10),
    schedule,
    durationWeeks: 4,
    campaignCopy: "Train hard, recover smarter. Join a guided recovery protocol built around the tools already available here.",
    postProgramUpsell: "Offer a recovery membership, larger package, or personal training recovery add-on."
  };
}

function resourceFlavor(resource: RoomDeviceUtilization) {
  const haystack = `${resource.name} ${resource.type} ${resource.serviceCategories.join(" ")}`.toLowerCase();
  const schedule = `${resource.weakestDay} ${resource.weakestTimeBlock}`.toLowerCase();
  if (haystack.includes("sauna") && schedule.includes("sun") && schedule.includes("evening")) {
    return "sauna_sunday";
  }
  if (haystack.includes("sauna")) {
    return "sauna";
  }
  if (haystack.includes("cold") || haystack.includes("plunge") || haystack.includes("contrast")) {
    return schedule.includes("morning") ? "cold_morning" : "cold";
  }
  if (haystack.includes("red light") || haystack.includes("redlight") || haystack.includes("light therapy")) {
    return "red_light";
  }
  if (haystack.includes("runner") || haystack.includes("compression") || haystack.includes("normatec")) {
    return "runner";
  }
  if (haystack.includes("sleep") || haystack.includes("float") || haystack.includes("meditation")) {
    return "sleep";
  }
  return "athlete";
}

function includedServicesFor(
  resource: RoomDeviceUtilization,
  services: AvailableService[],
  flavor: string
) {
  const keywords = [
    ...resource.name.toLowerCase().split(/\W+/),
    ...resource.type.toLowerCase().split(/\W+/),
    ...resource.serviceCategories.join(" ").toLowerCase().split(/\W+/),
    ...flavor.split("_")
  ].filter((keyword) => keyword.length >= 4);
  const matches = services
    .filter((service) => {
      const haystack = `${service.name} ${service.category}`.toLowerCase();
      return keywords.some((keyword) => haystack.includes(keyword));
    })
    .map((service) => service.name);
  return [...new Set([resource.name, ...matches])].slice(0, 5);
}

function scheduleFromResource(resource: RoomDeviceUtilization) {
  const day = resource.weakestDay.replace(/\s*\([^)]*\)/g, "").trim();
  const block = resource.weakestTimeBlock.replace(/\s*\([^)]*\)/g, "").trim();
  if (day && block) {
    return `${day} ${block}`;
  }
  return "Sunday Evening";
}

function capacityFromResource(resource: RoomDeviceUtilization, fallback: number) {
  return Math.max(1, Math.min(24, resource.bookingCount > 0 ? resource.bookingCount + 4 : fallback));
}

function fallbackSuggestions(services: AvailableService[]): PremiumRecoveryProgramSuggestion[] {
  const serviceNames = services.slice(0, 4).map((service) => service.name);
  return [
    {
      title: "4-Week Sleep Reset",
      description: "A calming recovery block for members who need better rest, consistency, and stress management.",
      targetAudience: "Busy adults, stressed members, and clients who need a gentle recovery routine.",
      includedServices: serviceNames,
      recommendedPriceCents: 17900,
      capacity: 10,
      schedule: "Sunday Evening",
      durationWeeks: 4,
      campaignCopy: "Reset your sleep routine with a guided four-week recovery program using calming services and weekly structure.",
      postProgramUpsell: "Offer a recovery membership or monthly wellness check-in.",
      sourceJson: { source: "fallback" },
      reason: "No underused room/device pattern was available, so this suggestion uses the available service catalog."
    },
    {
      title: "Athlete Recovery Protocol",
      description: "A premium recovery block for frequent trainers and athletes who need planned recovery.",
      targetAudience: "Athletes, frequent class attendees, and personal training clients.",
      includedServices: serviceNames,
      recommendedPriceCents: 12900,
      capacity: 12,
      schedule: "Weekday Evening",
      durationWeeks: 4,
      campaignCopy: "Train hard, recover smarter with a guided recovery protocol built from the services already available here.",
      postProgramUpsell: "Offer an athlete recovery membership or training add-on.",
      sourceJson: { source: "fallback" },
      reason: "No underused resource stood out, so this program is built from available services."
    }
  ];
}

function dedupeSuggestions(suggestions: PremiumRecoveryProgramSuggestion[]) {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = suggestion.title.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeServices(services: AvailableService[]) {
  const seen = new Set<string>();
  return services.filter((service) => {
    const key = service.name.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberToCents(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value * 100));
}
