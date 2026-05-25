import { Permission } from "@gym-platform/constants";
import { button, emptyState, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, TableModel } from "@gym-platform/ui";
import type { MemberView } from "../members/types.js";
import { buildInterestLevelBadge, type GrowthBadge } from "./statusBadges.js";

export interface InboxRow {
  id: string;
  fullName: string;
  contactLabel: string;
  nextFollowUpLabel: string;
  isOverdue: boolean;
  interestBadge?: GrowthBadge;
  assignedStaffName?: string;
  detailHref: string;
  logCallAction: ButtonModel;
  logNoteAction: ButtonModel;
}

export interface FollowUpInboxPage {
  screen: "growth_inbox";
  rows: InboxRow[];
  table: TableModel<InboxRow>;
  empty?: EmptyStateModel;
  overdueCount: number;
  dueTodayCount: number;
  totalCount: number;
}

export function buildFollowUpInboxPage(inputModel: {
  consumers: MemberView[];
  permissions: string[];
  detailBasePath?: string;
}): FollowUpInboxPage {
  const canWrite = inputModel.permissions.includes(Permission.GrowthWrite);
  const detailBasePath = inputModel.detailBasePath ?? "/growth/leads";
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let overdueCount = 0;
  let dueTodayCount = 0;

  const rows: InboxRow[] = inputModel.consumers.map((consumer) => {
    const followUpDate = consumer.nextFollowUpAt ? new Date(consumer.nextFollowUpAt) : undefined;
    const isOverdue = followUpDate !== undefined && followUpDate < todayStart;
    if (isOverdue) overdueCount++;
    else if (followUpDate !== undefined) dueTodayCount++;

    const interestBadge = buildInterestLevelBadge(consumer.interestLevel);
    return {
      id: consumer.id,
      fullName: memberName(consumer),
      contactLabel: consumer.email ?? consumer.phone ?? "No contact",
      nextFollowUpLabel: followUpDate ? formatDate(followUpDate) : "No date",
      isOverdue,
      ...(interestBadge ? { interestBadge } : {}),
      ...(consumer.assignedStaffName ? { assignedStaffName: consumer.assignedStaffName } : {}),
      detailHref: `${detailBasePath}/${consumer.id}`,
      logCallAction: button({
        label: "Log Call",
        intent: "secondary",
        size: "sm",
        disabled: !canWrite
      }),
      logNoteAction: button({
        label: "Log Note",
        intent: "secondary",
        size: "sm",
        disabled: !canWrite
      })
    };
  });

  const empty =
    rows.length === 0
      ? emptyState({
          title: "No follow-ups due",
          body: "All leads are up to date. Check back tomorrow."
        })
      : undefined;

  return {
    screen: "growth_inbox",
    rows,
    table: table({
      columns: [
        { key: "fullName", label: "Lead" },
        { key: "contactLabel", label: "Contact" },
        { key: "nextFollowUpLabel", label: "Follow-Up" },
        { key: "assignedStaffName", label: "Assigned To" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    overdueCount,
    dueTodayCount,
    totalCount: rows.length
  };
}

function memberName(member: MemberView) {
  return (
    `${member.firstName} ${member.lastName}`.trim() || member.email || member.phone || member.id
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
