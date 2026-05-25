import type { ButtonHTMLAttributes } from "react";
import type { ButtonModel } from "@gym-platform/ui";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "disabled"> {
  model: ButtonModel;
}

export function Button({ model, className, type = "button", ...props }: ButtonProps) {
  const classes = ["ui-button", `ui-button-${model.intent}`, `ui-button-${model.size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} className={classes} disabled={model.disabled} type={type}>
      {model.icon ? <span className="ui-button-icon" aria-hidden="true">{model.icon}</span> : null}
      <span>{model.label}</span>
    </button>
  );
}
