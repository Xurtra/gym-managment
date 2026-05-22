import { ConsumerSegment } from "@gym-platform/constants";
import { buildLeadListPage, type LeadListPage } from "../leads/list.js";
import { buildMemberListPage, type MemberListPage } from "../members/list.js";
import { consumerSegments } from "../members/segments.js";
import type { MemberView } from "../members/types.js";
import { buildPageHeader, type PageHeaderModel } from "../shell/pageHeader.js";

export type ConsumerDashboardTabKey = "all" | "members" | "customers" | "leads";

export interface ConsumerDashboardTab {
  key: ConsumerDashboardTabKey;
  label: string;
  href: string;
  count: number;
  active: boolean;
}

export interface ConsumerDashboardSummary {
  totalCount: number;
  memberCount: number;
  customerCount: number;
  leadCount: number;
  overlapCount: number;
  unsegmentedCount: number;
}

export interface ConsumerDashboardPage {
  screen: "consumer_dashboard";
  activeTabKey: ConsumerDashboardTabKey;
  tabs: ConsumerDashboardTab[];
  tabCount: number;
  summary: ConsumerDashboardSummary;
  summaryLabel: string;
  pageHeader: PageHeaderModel;
  allConsumers: MemberListPage;
  memberConsumers: MemberListPage;
  customerConsumers: MemberListPage;
  leadConsumers: LeadListPage;
  activeList: MemberListPage | LeadListPage;
}

export function buildConsumerDashboardPage(inputModel: {
  consumers: MemberView[];
  permissions: string[];
  activeTabKey?: ConsumerDashboardTabKey;
  filters?: Parameters<typeof buildMemberListPage>[0]["filters"];
  leadFilters?: Parameters<typeof buildLeadListPage>[0]["filters"];
}): ConsumerDashboardPage {
  const activeTabKey = inputModel.activeTabKey ?? "all";
  const memberConsumers = inputModel.consumers.filter((consumer) =>
    consumerSegments(consumer).includes(ConsumerSegment.Member)
  );
  const customerConsumers = inputModel.consumers.filter((consumer) =>
    consumerSegments(consumer).includes(ConsumerSegment.Customer)
  );
  const summary = buildSummary(inputModel.consumers);
  const tabs = buildTabs(activeTabKey, summary);
  const allList = buildConsumerList(inputModel.consumers, inputModel.permissions, inputModel.filters);
  const membersList = buildConsumerList(memberConsumers, inputModel.permissions, inputModel.filters);
  const customersList = buildConsumerList(
    customerConsumers,
    inputModel.permissions,
    inputModel.filters
  );
  const leadListInput: Parameters<typeof buildLeadListPage>[0] = {
    members: inputModel.consumers,
    permissions: inputModel.permissions,
    detailBasePath: "/consumers",
    editBasePath: "/consumers"
  };
  if (inputModel.leadFilters) {
    leadListInput.filters = inputModel.leadFilters;
  }
  const leadsList = buildLeadListPage(leadListInput);

  return {
    screen: "consumer_dashboard",
    activeTabKey,
    tabs,
    tabCount: tabs.length,
    summary,
    summaryLabel: `${summary.totalCount} consumers, ${summary.overlapCount} with multiple segments`,
    pageHeader: buildPageHeader({
      title: "Consumers",
      eyebrow: "People",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Consumers", href: "/consumers" }
      ],
      primaryAction: {
        key: "create_consumer",
        label: "Create consumer",
        href: "/consumers/new",
        icon: "user-plus"
      },
      tabs,
      activeTabKey
    }),
    allConsumers: allList,
    memberConsumers: membersList,
    customerConsumers: customersList,
    leadConsumers: leadsList,
    activeList: selectActiveList(activeTabKey, allList, membersList, customersList, leadsList)
  };
}

function buildConsumerList(
  consumers: MemberView[],
  permissions: string[],
  filters: Parameters<typeof buildMemberListPage>[0]["filters"]
) {
  const listInput: Parameters<typeof buildMemberListPage>[0] = {
    members: consumers,
    permissions,
    surface: "consumer",
    detailBasePath: "/consumers",
    editBasePath: "/consumers"
  };
  if (filters) {
    listInput.filters = filters;
  }
  return buildMemberListPage(listInput);
}

function selectActiveList(
  activeTabKey: ConsumerDashboardTabKey,
  allConsumers: MemberListPage,
  memberConsumers: MemberListPage,
  customerConsumers: MemberListPage,
  leadConsumers: LeadListPage
) {
  return {
    all: allConsumers,
    members: memberConsumers,
    customers: customerConsumers,
    leads: leadConsumers
  }[activeTabKey];
}

function buildSummary(consumers: MemberView[]): ConsumerDashboardSummary {
  const segmentLists = consumers.map(consumerSegments);
  return {
    totalCount: consumers.length,
    memberCount: segmentLists.filter((segments) => segments.includes(ConsumerSegment.Member)).length,
    customerCount: segmentLists.filter((segments) => segments.includes(ConsumerSegment.Customer))
      .length,
    leadCount: segmentLists.filter((segments) => segments.includes(ConsumerSegment.Lead)).length,
    overlapCount: segmentLists.filter((segments) => segments.length > 1).length,
    unsegmentedCount: segmentLists.filter((segments) => segments.length === 0).length
  };
}

function buildTabs(
  activeTabKey: ConsumerDashboardTabKey,
  summary: ConsumerDashboardSummary
): ConsumerDashboardTab[] {
  const tabs: Array<Omit<ConsumerDashboardTab, "active">> = [
    { key: "all", label: "All consumers", href: "/consumers", count: summary.totalCount },
    {
      key: "members",
      label: "Members",
      href: "/consumers?segment=members",
      count: summary.memberCount
    },
    {
      key: "customers",
      label: "Customers",
      href: "/consumers?segment=customers",
      count: summary.customerCount
    },
    { key: "leads", label: "Leads", href: "/consumers?segment=leads", count: summary.leadCount }
  ];
  return tabs.map((tab) => ({ ...tab, active: tab.key === activeTabKey }));
}
