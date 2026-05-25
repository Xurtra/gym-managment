import type { HTMLAttributes } from "react";
import type { EmptyStateModel } from "@gym-platform/ui";
import { Button } from "./Button.js";

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  model: EmptyStateModel;
  onAction?: () => void;
}

export function EmptyState({ model, className, onAction, ...props }: EmptyStateProps) {
  const classes = ["empty-state", className].filter(Boolean).join(" ");

  return (
    <div {...props} className={classes}>
      <h3>{model.title}</h3>
      {model.body ? <p>{model.body}</p> : null}
      {model.action ? <Button model={model.action} onClick={onAction} /> : null}
    </div>
  );
}
