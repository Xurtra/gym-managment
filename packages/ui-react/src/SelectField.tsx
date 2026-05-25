import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
}

export interface SelectFieldModel {
  name: string;
  label: string;
  required?: boolean;
  options: SelectOption[];
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "required" | "defaultValue"> {
  model: SelectFieldModel;
}

export function SelectField({ model, className, ...props }: SelectFieldProps) {
  const classes = ["field-select", className].filter(Boolean).join(" ");
  const selected = model.options.find((option) => option.selected)?.value;

  return (
    <label className="field">
      <span>{model.label}</span>
      <select
        {...props}
        className={classes}
        defaultValue={selected}
        name={model.name}
        required={model.required}
      >
        {model.options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
