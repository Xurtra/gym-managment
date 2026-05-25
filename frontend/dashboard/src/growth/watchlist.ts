import { Permission } from "@gym-platform/constants";
import { button, emptyState, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, TableModel } from "@gym-platform/ui";
import { buildMemberStatusBadge, type MemberStatusBadge } from "../members/statusBadges.js";
import type { MemberView } from "../members/types.js";
import { buildRetentionFlagBadge, type GrowthBadge } from "./statusBadges.js";

export interface WatchlistRow {
  id: string;
  fullName: string;
  contactLabel: string;
  statusBadge: MemberStatusBadge;
  retentionFlagBadge?: GrowthBadge;
  assignedStaffName?: string;
  detailHref: string;
  logNoteAction: ButtonModel;
  viewAction: ButtonModel;
  clearFlagAction: ButtonModel;
}

export interface RetentionWatchlistPage {
  screen: "growth_watchlist";
  rows: WatchlistRow[];
  table: TableModel<WatchlistRow>;
  empty?: EmptyStateModel;
  totalCount: number;
}

export function buildRetentionWatchlistPage(inputModel: {
  consumers: MemberView[];
  permissions: string[];
  detailBasePath?: string;
}): RetentionWatchlistPage {
  const canWrite = inputModel.permissions.includes(Permission.GrowthWrite);
  const detailBasePath = inputModel.detailBasePath ?? "/members";

  const rows: WatchlistRow[] = inputModel.consumers.map((consumer) => {
    const detailHref = `${detailBasePath}/${consumer.id}`;
    const retentionFlagBadge = buildRetentionFlagBadge(consumer.retentionFlag);
    return {
      id: consumer.id,
      fullName: memberName(consumer),
      contactLabel: consumer.email ?? consumer.phone ?? "No contact",
      statusBadge: buildMemberStatusBadge(consumer.status),
      ...(retentionFlagBadge ? { retentionFlagBadge } : {}),
      ...(consumer.assignedStaffName ? { assignedStaffName: consumer.assignedStaffName } : {}),
      detailHref,
      logNoteAction: button({
        label: "Log Note",
        intent: "secondary",
        size: "sm",
        disabled: !canWrite
      }),
      viewAction: button({ label: "View", icon: "eye", intent: "secondary", size: "sm" }),
      clearFlagAction: button({
        label: "Clear Flag",
        intent: "secondary",
        size: "sm",
        disabled: !canWrite
      })
    };
  });

  const empty =
    rows.length === 0
      ? emptyState({
          title: "No members on the watchlist",
          body: "Flag members as at-risk, lapsed, or churned from their profile."
        })
      : undefined;

  return {
    screen: "growth_watchlist",
    rows,
    table: table({
      columns: [
        { key: "fullName", label: "Member" },
        { key: "contactLabel", label: "Contact" },
        { key: "assignedStaffName", label: "Assigned To" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    totalCount: rows.length
  };
}

function memberName(member: MemberView) {
  return (
    `${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id
  );
}
