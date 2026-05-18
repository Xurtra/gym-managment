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
  primaryAction?: PageHeaderAction;
  secondaryActions: PageHeaderAction[];
  tabs: PageHeaderTab[];
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
  const header: PageHeaderModel = {
    kind: "page_header",
    title: inputModel.title.trim(),
    breadcrumbs: buildBreadcrumbs(inputModel.breadcrumbs ?? []),
    secondaryActions: (inputModel.secondaryActions ?? []).map((action) =>
      buildHeaderAction(action, "secondary")
    ),
    tabs: (inputModel.tabs ?? []).map((tab) => ({
      key: tab.key,
      label: tab.label,
      href: tab.href,
      active: tab.key === inputModel.activeTabKey,
      disabled: tab.disabled ?? false
    }))
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
