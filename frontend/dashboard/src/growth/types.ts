import type { InteractionType } from "@gym-platform/constants";

export interface GrowthSummary {
  openLeads: number;
  dueToday: number;
  overdueCount: number;
  watchlistCount: number;
  convertedThisMonth: number;
}

export interface InteractionView {
  id: string;
  type: InteractionType;
  notes?: string;
  staffName?: string;
  occurredAt: string;
  createdAt: string;
}
