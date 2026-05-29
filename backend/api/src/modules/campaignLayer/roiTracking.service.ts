import type { RoiTrackingEntryCreateInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import type { RoiTrackingEntry } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

const defaultMonthlySoftwareCostCents = 29900;

export class RoiTrackingService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async list(gymId: string) {
    const entries = await this.repositories.roiTracking.listEntriesForGym(gymId);
    const gym = await this.repositories.gyms.getGym(gymId);
    const softwareMonthlyCostCents = gym?.studioSettings?.softwareMonthlyCostCents ?? defaultMonthlySoftwareCostCents;
    return {
      entries,
      summary: summarizeRoi(entries, softwareMonthlyCostCents)
    };
  }

  async create(gymId: string, userId: string, input: RoiTrackingEntryCreateInput) {
    const now = this.clock.now();
    const entry: RoiTrackingEntry = {
      id: randomUUID(),
      gymId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceLabel: input.sourceLabel,
      bookingsGenerated: input.bookingsGenerated,
      revenueGeneratedCents: input.revenueGeneratedCents,
      membershipsSold: input.membershipsSold,
      packagesSold: input.packagesSold,
      ...(input.notes ? { notes: input.notes } : {}),
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now
    };
    const created = await this.repositories.roiTracking.createEntry(entry);
    const entries = await this.repositories.roiTracking.listEntriesForGym(gymId);
    const gym = await this.repositories.gyms.getGym(gymId);
    const softwareMonthlyCostCents = gym?.studioSettings?.softwareMonthlyCostCents ?? defaultMonthlySoftwareCostCents;
    return {
      entry: created,
      summary: summarizeRoi(entries, softwareMonthlyCostCents)
    };
  }
}

function summarizeRoi(entries: RoiTrackingEntry[], monthlySoftwareCostCents: number) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const totalRevenueGeneratedCents = entries.reduce(
    (total, entry) => total + entry.revenueGeneratedCents,
    0
  );
  const revenueGeneratedThisMonthCents = entries
    .filter((entry) => entry.createdAt.getTime() >= monthStart.getTime())
    .reduce((total, entry) => total + entry.revenueGeneratedCents, 0);
  const topCampaignByRevenue = topSourceByRevenue(entries.filter((entry) => entry.sourceType === "campaign"));
  return {
    totalRevenueGeneratedCents,
    revenueGeneratedThisMonthCents,
    topCampaignByRevenue,
    monthlySoftwareCostCents,
    estimatedRoiPercent: roiPercent(revenueGeneratedThisMonthCents, monthlySoftwareCostCents),
    bookingsGenerated: entries.reduce((total, entry) => total + entry.bookingsGenerated, 0),
    membershipsSold: entries.reduce((total, entry) => total + entry.membershipsSold, 0),
    packagesSold: entries.reduce((total, entry) => total + entry.packagesSold, 0)
  };
}

function topSourceByRevenue(entries: RoiTrackingEntry[]) {
  const totals = new Map<string, { sourceId: string; sourceLabel: string; revenueGeneratedCents: number }>();
  for (const entry of entries) {
    const key = entry.sourceId;
    const current = totals.get(key) ?? {
      sourceId: entry.sourceId,
      sourceLabel: entry.sourceLabel,
      revenueGeneratedCents: 0
    };
    current.revenueGeneratedCents += entry.revenueGeneratedCents;
    totals.set(key, current);
  }
  return [...totals.values()].sort(
    (left, right) => right.revenueGeneratedCents - left.revenueGeneratedCents
  )[0] ?? null;
}

function roiPercent(revenueCents: number, costCents: number) {
  if (costCents <= 0) {
    return 0;
  }
  return Math.round(((revenueCents - costCents) / costCents) * 100);
}
