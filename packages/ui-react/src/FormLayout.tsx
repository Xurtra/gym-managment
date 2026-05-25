import type { ReactNode } from "react";

export interface FormLayoutModel {
  title: string;
  description?: string;
  footer?: ReactNode;
}

export interface FormLayoutProps {
  model: FormLayoutModel;
  children: ReactNode;
  className?: string;
}

export function FormLayout({ model, children, className }: FormLayoutProps) {
  const classes = ["form-card", className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <div className="card-head">
        <div>
          <h3>{model.title}</h3>
          {model.description ? <p className="club-copy">{model.description}</p> : null}
        </div>
      </div>
      <div>{children}</div>
      {model.footer ? <div className="customer-edit-footer">{model.footer}</div> : null}
    </section>
  );
}
