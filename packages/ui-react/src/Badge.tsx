import type { HTMLAttributes } from "react";
import type { BadgeModel } from "@gym-platform/ui";

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  model: BadgeModel;
}

export function Badge({ model, className, ...props }: BadgeProps) {
  const classes = ["ui-badge", `ui-badge-${model.tone}`, className].filter(Boolean).join(" ");

  return (
    <span {...props} className={classes}>
      {model.label}
    </span>
  );
}
