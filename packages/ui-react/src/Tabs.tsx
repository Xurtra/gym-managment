import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface TabItemModel {
  key: string;
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  suffix?: ReactNode;
}

export interface TabsModel {
  items: TabItemModel[];
  ariaLabel?: string;
}

export interface TabsProps {
  model: TabsModel;
}

export function Tabs({ model }: TabsProps) {
  return (
    <nav className="club-mini-nav" aria-label={model.ariaLabel ?? "Tabs"}>
      {model.items.map((item) =>
        item.href ? (
          <Link key={item.key} to={item.href} className={`ghost-button${item.active ? " active" : ""}`} aria-disabled={item.disabled}>
            {item.label}
            {item.suffix ? <span>{item.suffix}</span> : null}
          </Link>
        ) : (
          <button key={item.key} type="button" className={`ghost-button${item.active ? " active" : ""}`} disabled={item.disabled}>
            {item.label}
            {item.suffix ? <span>{item.suffix}</span> : null}
          </button>
        )
      )}
    </nav>
  );
}
