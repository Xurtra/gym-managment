import { badge, type BadgeTone } from "@gym-platform/ui";
import { Badge } from "./Badge.js";

export interface StatusBadgeModel {
  label: string;
  tone?: BadgeTone;
  title?: string;
}

export interface StatusBadgeProps {
  model: StatusBadgeModel;
}

export function StatusBadge({ model }: StatusBadgeProps) {
  return <Badge model={badge({ label: model.label, tone: model.tone ?? "neutral" })} title={model.title} />;
}
