import { FeatureFlag, Permission } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";

export const PersonalTrainingSessionStatus = {
  Scheduled: "scheduled",
  Completed: "completed",
  Cancelled: "cancelled"
} as const;

export type PersonalTrainingSessionStatus =
  (typeof PersonalTrainingSessionStatus)[keyof typeof PersonalTrainingSessionStatus];

export interface PersonalTrainingMemberView {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface PersonalTrainingTrainerView {
  id: string;
  fullName: string;
}

export interface PersonalTrainingSessionView {
  id: string;
  memberId: string;
  trainerUserId: string;
  packageName?: string;
  locationName?: string;
  startsAt: string;
  endsAt: string;
  status: PersonalTrainingSessionStatus;
}

export interface PersonalTrainingSessionFilters {
  query?: string;
  trainerUserId?: string;
  status?: PersonalTrainingSessionStatus;
}

export interface PersonalTrainingTrainerOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface PersonalTrainingStatusOption {
  value: PersonalTrainingSessionStatus;
  label: string;
  selected: boolean;
}

export interface PersonalTrainingSessionAction {
  key: "view" | "edit" | "cancel";
  button: ButtonModel;
  href: string;
}

export interface PersonalTrainingSessionRow extends PersonalTrainingSessionView {
  memberName: string;
  trainerName: string;
  packageLabel: string;
  locationLabel: string;
  timeLabel: string;
  statusLabel: string;
  detailHref: string;
  actions: PersonalTrainingSessionAction[];
}

export interface PersonalTrainingSessionSummary {
  totalCount: number;
  scheduledCount: number;
  completedCount: number;
  cancelledCount: number;
  visibleCount: number;
}

export interface PersonalTrainingSessionListPage {
  screen: "personal_training_session_list";
  featureEnabled: boolean;
  filters: Required<Pick<PersonalTrainingSessionFilters, "query">> &
    Omit<PersonalTrainingSessionFilters, "query">;
  searchField: InputModel;
  trainerOptions: PersonalTrainingTrainerOption[];
  statusOptions: PersonalTrainingStatusOption[];
  summary: PersonalTrainingSessionSummary;
  summaryLabel: string;
  rowCount: number;
  activeFilterCount: number;
  trainerOptionCount: number;
  statusOptionCount: number;
  rows: PersonalTrainingSessionRow[];
  table: TableModel<PersonalTrainingSessionRow>;
  empty?: EmptyStateModel;
  createSessionAction: ButtonModel;
}

export function buildPersonalTrainingSessionListPage(inputModel: {
  sessions: PersonalTrainingSessionView[];
  members: PersonalTrainingMemberView[];
  trainers: PersonalTrainingTrainerView[];
  permissions: string[];
  featureFlags: string[];
  filters?: PersonalTrainingSessionFilters;
}): PersonalTrainingSessionListPage {
  const query = normalizeText(inputModel.filters?.query).toLowerCase();
  const filters: PersonalTrainingSessionListPage["filters"] = {
    query,
    ...(inputModel.filters?.trainerUserId ? { trainerUserId: inputModel.filters.trainerUserId } : {}),
    ...(inputModel.filters?.status ? { status: inputModel.filters.status } : {})
  };
  const featureEnabled = inputModel.featureFlags.includes(FeatureFlag.PersonalTraining);
  const canWriteSessions = inputModel.permissions.includes(Permission.ClassWrite);
  const memberMap = new Map(inputModel.members.map((member) => [member.id, member]));
  const trainerMap = new Map(inputModel.trainers.map((trainer) => [trainer.id, trainer]));
  const trainerOptions = inputModel.trainers
    .slice()
    .sort((left, right) => left.fullName.localeCompare(right.fullName))
    .map((trainer) => ({
      value: trainer.id,
      label: trainer.fullName,
      selected: trainer.id === filters.trainerUserId
    }));
  const statusOptions = Object.values(PersonalTrainingSessionStatus).map((status) => ({
    value: status,
    label: personalTrainingStatusLabel(status),
    selected: status === filters.status
  }));
  const rows = featureEnabled
    ? inputModel.sessions
        .filter((session) => matchesFilters(session, memberMap, trainerMap, filters))
        .sort(compareSessions)
        .map((session) => buildRow(session, memberMap, trainerMap, canWriteSessions))
    : [];
  const empty = buildEmptyState({
    featureEnabled,
    rowCount: rows.length,
    hasActiveFilters: hasActiveFilters(filters),
    hasSessions: inputModel.sessions.length > 0,
    canWriteSessions
  });

  return {
    screen: "personal_training_session_list",
    featureEnabled,
    filters,
    searchField: input({
      name: "personalTrainingSearch",
      label: "Search personal training",
      value: query,
      type: "text",
      required: false
    }),
    trainerOptions,
    statusOptions,
    summary: buildSummary(inputModel.sessions, rows.length),
    summaryLabel: featureEnabled
      ? `Showing ${rows.length} of ${inputModel.sessions.length} personal training session${
          inputModel.sessions.length === 1 ? "" : "s"
        }`
      : "Personal training is disabled",
    rowCount: rows.length,
    activeFilterCount: countActiveFilters(filters),
    trainerOptionCount: trainerOptions.length,
    statusOptionCount: statusOptions.length,
    rows,
    table: table({
      columns: [
        { key: "memberName", label: "Member" },
        { key: "trainerName", label: "Trainer" },
        { key: "timeLabel", label: "Time" },
        { key: "locationLabel", label: "Location" },
        { key: "statusLabel", label: "Status" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    createSessionAction: button({
      label: "Schedule session",
      icon: "calendar-plus",
      disabled: !featureEnabled || !canWriteSessions
    })
  };
}

function buildRow(
  session: PersonalTrainingSessionView,
  memberMap: Map<string, PersonalTrainingMemberView>,
  trainerMap: Map<string, PersonalTrainingTrainerView>,
  canWriteSessions: boolean
): PersonalTrainingSessionRow {
  const member = memberMap.get(session.memberId);
  const trainer = trainerMap.get(session.trainerUserId);
  return {
    ...session,
    memberName: personalTrainingMemberName(member, session.memberId),
    trainerName: trainer?.fullName ?? session.trainerUserId,
    packageLabel: normalizeText(session.packageName) || "General session",
    locationLabel: normalizeText(session.locationName) || "No location assigned",
    timeLabel: `${personalTrainingFormatDateTime(session.startsAt)} - ${personalTrainingFormatDateTime(session.endsAt)}`,
    statusLabel: personalTrainingStatusLabel(session.status),
    detailHref: `/personal-training/${session.id}`,
    actions: [
      {
        key: "view",
        href: `/personal-training/${session.id}`,
        button: button({ label: "View", icon: "eye", intent: "secondary" })
      },
      {
        key: "edit",
        href: `/personal-training/${session.id}/edit`,
        button: button({
          label: "Edit",
          icon: "pencil",
          intent: "secondary",
          disabled: !canWriteSessions
        })
      },
      {
        key: "cancel",
        href: `/personal-training/${session.id}/cancel`,
        button: button({
          label: "Cancel",
          icon: "calendar-x",
          intent: "danger",
          disabled: !canWriteSessions || session.status !== PersonalTrainingSessionStatus.Scheduled
        })
      }
    ]
  };
}

function matchesFilters(
  session: PersonalTrainingSessionView,
  memberMap: Map<string, PersonalTrainingMemberView>,
  trainerMap: Map<string, PersonalTrainingTrainerView>,
  filters: PersonalTrainingSessionListPage["filters"]
) {
  if (filters.trainerUserId && session.trainerUserId !== filters.trainerUserId) {
    return false;
  }
  if (filters.status && session.status !== filters.status) {
    return false;
  }
  if (!filters.query) {
    return true;
  }
  const member = memberMap.get(session.memberId);
  const trainer = trainerMap.get(session.trainerUserId);
  return [
    member?.firstName,
    member?.lastName,
    member?.email,
    trainer?.fullName,
    session.packageName,
    session.locationName,
    personalTrainingStatusLabel(session.status)
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(filters.query));
}

function buildSummary(
  sessions: PersonalTrainingSessionView[],
  visibleCount: number
): PersonalTrainingSessionSummary {
  return {
    totalCount: sessions.length,
    scheduledCount: countByStatus(sessions, PersonalTrainingSessionStatus.Scheduled),
    completedCount: countByStatus(sessions, PersonalTrainingSessionStatus.Completed),
    cancelledCount: countByStatus(sessions, PersonalTrainingSessionStatus.Cancelled),
    visibleCount
  };
}

function buildEmptyState(inputModel: {
  featureEnabled: boolean;
  rowCount: number;
  hasActiveFilters: boolean;
  hasSessions: boolean;
  canWriteSessions: boolean;
}) {
  if (inputModel.rowCount > 0) {
    return undefined;
  }
  if (!inputModel.featureEnabled) {
    return emptyState({
      title: "Personal training is disabled",
      body: "Enable the personal training feature flag to schedule and manage sessions."
    });
  }
  if (!inputModel.hasSessions) {
    return emptyState({
      title: "No personal training sessions",
      body: "Schedule a session to start managing trainer appointments.",
      ...(inputModel.canWriteSessions
        ? { action: button({ label: "Schedule session", icon: "calendar-plus" }) }
        : {})
    });
  }
  if (inputModel.hasActiveFilters) {
    return emptyState({
      title: "No sessions match your filters",
      body: "Adjust the trainer or status filters and try again."
    });
  }
  return undefined;
}

function compareSessions(left: PersonalTrainingSessionView, right: PersonalTrainingSessionView) {
  return (
    sessionStatusSort(left.status) - sessionStatusSort(right.status) ||
    left.startsAt.localeCompare(right.startsAt) ||
    left.id.localeCompare(right.id)
  );
}

function sessionStatusSort(status: PersonalTrainingSessionStatus) {
  return {
    [PersonalTrainingSessionStatus.Scheduled]: 0,
    [PersonalTrainingSessionStatus.Completed]: 1,
    [PersonalTrainingSessionStatus.Cancelled]: 2
  }[status];
}

function countByStatus(
  sessions: PersonalTrainingSessionView[],
  status: PersonalTrainingSessionStatus
) {
  return sessions.filter((session) => session.status === status).length;
}

export function personalTrainingMemberName(
  member: PersonalTrainingMemberView | undefined,
  fallbackId: string
) {
  if (!member) {
    return fallbackId;
  }
  return `${member.firstName} ${member.lastName}`.trim() || member.email || fallbackId;
}

export function personalTrainingStatusLabel(status: PersonalTrainingSessionStatus) {
  return {
    [PersonalTrainingSessionStatus.Scheduled]: "Scheduled",
    [PersonalTrainingSessionStatus.Completed]: "Completed",
    [PersonalTrainingSessionStatus.Cancelled]: "Cancelled"
  }[status];
}

export function personalTrainingFormatDateTime(value: string) {
  return value.replace("T", " ").replace(".000Z", "Z");
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function hasActiveFilters(filters: PersonalTrainingSessionListPage["filters"]) {
  return Boolean(filters.query || filters.trainerUserId || filters.status);
}

function countActiveFilters(filters: PersonalTrainingSessionListPage["filters"]) {
  return [filters.query, filters.trainerUserId, filters.status].filter(Boolean).length;
}
