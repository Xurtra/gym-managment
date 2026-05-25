import type { TextareaHTMLAttributes } from "react";

export interface TextareaFieldModel {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  rows?: number;
}

export interface TextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "required" | "defaultValue" | "rows"> {
  model: TextareaFieldModel;
}

export function TextareaField({ model, className, ...props }: TextareaFieldProps) {
  const classes = ["field-textarea", className].filter(Boolean).join(" ");

  return (
    <label className="field">
      <span>{model.label}</span>
      <textarea
        {...props}
        className={classes}
        defaultValue={model.value ?? ""}
        name={model.name}
        required={model.required}
        rows={model.rows ?? 4}
      />
    </label>
  );
}
