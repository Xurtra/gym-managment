import type { InputHTMLAttributes } from "react";
import type { InputModel } from "@gym-platform/ui";

export interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue" | "type" | "required"> {
  model: InputModel;
}

export function InputField({ model, className, ...props }: InputFieldProps) {
  const classes = ["field-input", className].filter(Boolean).join(" ");

  return (
    <label className="field">
      <span>{model.label}</span>
      <input
        {...props}
        className={classes}
        name={model.name}
        defaultValue={model.value}
        required={model.required}
        type={model.type}
      />
      {model.error ? <small className="field-error">{model.error}</small> : null}
    </label>
  );
}
