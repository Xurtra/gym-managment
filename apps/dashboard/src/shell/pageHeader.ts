import { button } from "@gym-platform/ui";
import type { ButtonModel } from "@gym-platform/ui";

export interface PageHeaderBreadcrumb {
  label: string;
  href: string;
  current: boolean;
}

export interface PageHeaderTab {
  key: string;
  label: string;
  href: string;
  active: boolean;
  disabled: boolean;
}

export interface PageHeaderAction {
  key: string;
  button: ButtonModel;
  href?: string;
}

export interface PageHeaderModel {
  kind: "page_header";
  title: string;
  eyebrow?: string;
  description?: string;
  breadcrumbs: PageHeaderBreadcrumb[];
  breadcrumbCount: number;
  primaryAction?: PageHeaderAction;
  secondaryActions: PageHeaderAction[];
  actionCount: number;
  tabs: PageHeaderTab[];
  tabCount: number;
  activeTabKey?: string;
  summaryLabel: string;
}

export function buildPageHeader(inputModel: {
  title: string;
  eyebrow?: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href: string }>;
  primaryAction?: {
    key: string;
    label: string;
    href?: string;
    icon?: string;
    disabled?: boolean;
  };
  secondaryActions?: Array<{
    key: string;
    label: string;
    href?: string;
    icon?: string;
    disabled?: boolean;
  }>;
  tabs?: Array<{
    key: string;
    label: string;
    href: string;
    disabled?: boolean;
  }>;
  activeTabKey?: string;
}): PageHeaderModel {
  const breadcrumbs = buildBreadcrumbs(inputModel.breadcrumbs ?? []);
  const secondaryActions = (inputModel.secondaryActions ?? []).map((action) =>
    buildHeaderAction(action, "secondary")
  );
  const tabs = (inputModel.tabs ?? []).map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: tab.href,
    active: tab.key === inputModel.activeTabKey,
    disabled: tab.disabled ?? false
  }));
  const activeTab = tabs.find((tab) => tab.active);
  const header: PageHeaderModel = {
    kind: "page_header",
    title: inputModel.title.trim(),
    breadcrumbs,
    breadcrumbCount: breadcrumbs.length,
    secondaryActions,
    actionCount: secondaryActions.length + (inputModel.primaryAction ? 1 : 0),
    tabs,
    tabCount: tabs.length,
    ...(activeTab ? { activeTabKey: activeTab.key } : {}),
    summaryLabel:
      tabs.length > 0
        ? `${tabs.length} page tab${tabs.length === 1 ? "" : "s"}`
        : `${secondaryActions.length + (inputModel.primaryAction ? 1 : 0)} header action${
            secondaryActions.length + (inputModel.primaryAction ? 1 : 0) === 1 ? "" : "s"
          }`
  };
  const eyebrow = inputModel.eyebrow?.trim();
  if (eyebrow) {
    header.eyebrow = eyebrow;
  }
  const description = inputModel.description?.trim();
  if (description) {
    header.description = description;
  }
  if (inputModel.primaryAction) {
    header.primaryAction = buildHeaderAction(inputModel.primaryAction, "primary");
  }
  return header;
}

function buildBreadcrumbs(items: Array<{ label: string; href: string }>) {
  return items.map((item, index) => ({
    label: item.label,
    href: item.href,
    current: index === items.length - 1
  }));
}

function buildHeaderAction(
  action: {
    key: string;
    label: string;
    href?: string;
    icon?: string;
    disabled?: boolean;
  },
  intent: ButtonModel["intent"]
): PageHeaderAction {
  const headerAction: PageHeaderAction = {
    key: action.key,
    button: button({
      label: action.label,
      intent,
      disabled: action.disabled ?? false,
      ...(action.icon ? { icon: action.icon } : {})
    })
  };
  if (action.href) {
    headerAction.href = action.href;
  }
  return headerAction;
}
