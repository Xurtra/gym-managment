import type { HTMLAttributes } from "react";
import type { AvatarModel } from "@gym-platform/ui";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  model: AvatarModel;
}

export function Avatar({ model, className, ...props }: AvatarProps) {
  const classes = ["ui-avatar", className].filter(Boolean).join(" ");

  return (
    <div {...props} className={classes}>
      {model.imageUrl ? <img src={model.imageUrl} alt={model.label} /> : <span>{model.initials}</span>}
    </div>
  );
}
