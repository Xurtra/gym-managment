import { button, emptyState } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel } from "@gym-platform/ui";

export interface DetailDrawerItem {
  key: string;
  label: string;
  value: string;
  empty?: boolean;
}

export interface DetailDrawerSectionInput {
  key: string;
  title: string;
  items: Array<{
    key: string;
    label: string;
    value?: string | number | boolean | Date | null;
  }>;
}

export interface DetailDrawerSection {
  key: string;
  title: string;
  items: DetailDrawerItem[];
}

export interface DetailDrawerAction {
  key: string;
  button: ButtonModel;
  href?: string;
}

export interface DashboardDetailDrawer {
  kind: "dashboard_detail_drawer";
  title: string;
  open: boolean;
  subtitle?: string;
  sections: DetailDrawerSection[];
  sectionCount: number;
  itemCount: number;
  actions: DetailDrawerAction[];
  actionCount: number;
  summaryLabel: string;
  closeAction: ButtonModel;
  empty?: EmptyStateModel;
}

export function buildDashboardDetailDrawer(inputModel: {
  title: string;
  open?: boolean;
  subtitle?: string;
  sections: DetailDrawerSectionInput[];
  actions?: Array<{
    key: string;
    label: string;
    href?: string;
    icon?: string;
    disabled?: boolean;
    intent?: ButtonModel["intent"];
  }>;
}): DashboardDetailDrawer {
  const sections = inputModel.sections.map((section) => ({
    key: section.key,
    title: section.title,
    items: section.items.map((item) => {
      const value = formatDetailValue(item.value);
      return {
        key: item.key,
        label: item.label,
        value,
        empty: value.length === 0
      };
    })
  }));
  const itemCount = sections.reduce((total, section) => total + section.items.length, 0);
  const drawer: DashboardDetailDrawer = {
    kind: "dashboard_detail_drawer",
    title: inputModel.title.trim(),
    open: inputModel.open ?? false,
    sections,
    sectionCount: sections.length,
    itemCount,
    actions: (inputModel.actions ?? []).map(buildDetailAction),
    actionCount: (inputModel.actions ?? []).length,
    summaryLabel:
      itemCount === 0
        ? "No detail items"
        : `${itemCount} detail item${itemCount === 1 ? "" : "s"}`,
    closeAction: button({
      label: "Close details",
      icon: "x",
      intent: "secondary"
    })
  };

  const subtitle = inputModel.subtitle?.trim();
  if (subtitle) {
    drawer.subtitle = subtitle;
  }
  if (itemCount === 0) {
    drawer.empty = emptyState({
      title: "No details",
      body: "There are no details to show yet."
    });
  }

  return drawer;
}

function buildDetailAction(action: {
  key: string;
  label: string;
  href?: string;
  icon?: string;
  disabled?: boolean;
  intent?: ButtonModel["intent"];
}): DetailDrawerAction {
  const detailAction: DetailDrawerAction = {
    key: action.key,
    button: button({
      label: action.label,
      intent: action.intent ?? "secondary",
      disabled: action.disabled ?? false,
      ...(action.icon ? { icon: action.icon } : {})
    })
  };
  if (action.href) {
    detailAction.href = action.href;
  }
  return detailAction;
}

function formatDetailValue(value: string | number | boolean | Date | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}
