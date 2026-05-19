import { ClassSessionStatus, Permission } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";

export interface ClassTypeView {
  id: string;
  name: string;
  isPublic: boolean;
}

export interface ClassLocationView {
  id: string;
  name: string;
}

export interface ClassTrainerView {
  id: string;
  fullName: string;
}

export interface ClassSessionView {
  id: string;
  classTypeId: string;
  locationId: string;
  trainerUserId?: string;
  roomName?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  waitlistCapacity: number;
  status: ClassSessionStatus;
}

export interface ClassSessionListFilters {
  query?: string;
  locationId?: string;
  status?: ClassSessionStatus;
}

export interface ClassSessionLocationOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface ClassSessionStatusOption {
  value: ClassSessionStatus;
  label: string;
  selected: boolean;
}

export interface ClassSessionListAction {
  key: "view" | "edit" | "cancel";
  button: ButtonModel;
  href: string;
}

export interface ClassSessionListRow extends ClassSessionView {
  className: string;
  locationName: string;
  trainerName: string;
  roomLabel: string;
  timeLabel: string;
  capacityLabel: string;
  visibilityLabel: string;
  detailHref: string;
  actions: ClassSessionListAction[];
}

export interface ClassSessionListSummary {
  totalCount: number;
  scheduledCount: number;
  completedCount: number;
  cancelledCount: number;
  visibleCount: number;
}

export interface ClassSessionListPage {
  screen: "class_session_list";
  filters: Required<Pick<ClassSessionListFilters, "query">> & Omit<ClassSessionListFilters, "query">;
  searchField: InputModel;
  locationOptions: ClassSessionLocationOption[];
  statusOptions: ClassSessionStatusOption[];
  summary: ClassSessionListSummary;
  summaryLabel: string;
  rowCount: number;
  activeFilterCount: number;
  locationOptionCount: number;
  statusOptionCount: number;
  rows: ClassSessionListRow[];
  table: TableModel<ClassSessionListRow>;
  empty?: EmptyStateModel;
  createSessionAction: ButtonModel;
}

export function buildClassSessionListPage(inputModel: {
  sessions: ClassSessionView[];
  classTypes: ClassTypeView[];
  locations: ClassLocationView[];
  trainers: ClassTrainerView[];
  permissions: string[];
  filters?: ClassSessionListFilters;
}): ClassSessionListPage {
  const query = normalizeText(inputModel.filters?.query).toLowerCase();
  const filters: ClassSessionListPage["filters"] = {
    query,
    ...(inputModel.filters?.locationId ? { locationId: inputModel.filters.locationId } : {}),
    ...(inputModel.filters?.status ? { status: inputModel.filters.status } : {})
  };
  const canWriteClasses = inputModel.permissions.includes(Permission.ClassWrite);
  const classTypeMap = new Map(inputModel.classTypes.map((classType) => [classType.id, classType]));
  const locationMap = new Map(inputModel.locations.map((location) => [location.id, location]));
  const trainerMap = new Map(inputModel.trainers.map((trainer) => [trainer.id, trainer]));
  const locationOptions = inputModel.locations
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((location) => ({
      value: location.id,
      label: location.name,
      selected: location.id === filters.locationId
    }));
  const statusOptions = Object.values(ClassSessionStatus).map((status) => ({
    value: status,
    label: classSessionStatusLabel(status),
    selected: status === filters.status
  }));
  const rows = inputModel.sessions
    .filter((session) => matchesFilters(session, classTypeMap, locationMap, trainerMap, filters))
    .sort(compareSessions)
    .map((session) =>
      buildSessionRow(session, classTypeMap, locationMap, trainerMap, canWriteClasses)
    );
  const empty =
    rows.length === 0
      ? emptyState({
          title: hasActiveFilters(filters)
            ? "No classes match your filters"
            : "No classes scheduled",
          body: hasActiveFilters(filters)
            ? "Adjust the class schedule filters and try again."
            : "Schedule a class session to start building the calendar."
        })
      : undefined;

  return {
    screen: "class_session_list",
    filters,
    searchField: input({
      name: "classSessionSearch",
      label: "Search classes",
      value: query,
      type: "text",
      required: false
    }),
    locationOptions,
    statusOptions,
    summary: buildSummary(inputModel.sessions, rows.length),
    summaryLabel: `Showing ${rows.length} of ${inputModel.sessions.length} class session${
      inputModel.sessions.length === 1 ? "" : "s"
    }`,
    rowCount: rows.length,
    activeFilterCount: countActiveFilters(filters),
    locationOptionCount: locationOptions.length,
    statusOptionCount: statusOptions.length,
    rows,
    table: table({
      columns: [
        { key: "className", label: "Class" },
        { key: "locationName", label: "Location" },
        { key: "timeLabel", label: "Time" },
        { key: "capacityLabel", label: "Capacity" },
        { key: "visibilityLabel", label: "Visibility" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {}),
    createSessionAction: button({
      label: "Schedule class",
      icon: "calendar-plus",
      disabled: !canWriteClasses
    })
  };
}

function buildSessionRow(
  session: ClassSessionView,
  classTypeMap: Map<string, ClassTypeView>,
  locationMap: Map<string, ClassLocationView>,
  trainerMap: Map<string, ClassTrainerView>,
  canWriteClasses: boolean
): ClassSessionListRow {
  const classType = classTypeMap.get(session.classTypeId);
  const location = locationMap.get(session.locationId);
  const trainer = session.trainerUserId ? trainerMap.get(session.trainerUserId) : undefined;
  return {
    ...session,
    className: classType?.name ?? "Unknown class",
    locationName: location?.name ?? "Unknown location",
    trainerName: trainer?.fullName ?? "Unassigned trainer",
    roomLabel: session.roomName?.trim() || "No room assigned",
    timeLabel: `${formatDateTime(session.startsAt)} - ${formatDateTime(session.endsAt)}`,
    capacityLabel: `${session.capacity} spots, ${session.waitlistCapacity} waitlist`,
    visibilityLabel: classType?.isPublic ? "Public" : "Private",
    detailHref: `/classes/${session.id}`,
    actions: [
      {
        key: "view",
        href: `/classes/${session.id}`,
        button: button({ label: "View", icon: "eye", intent: "secondary" })
      },
      {
        key: "edit",
        href: `/classes/${session.id}/edit`,
        button: button({
          label: "Edit",
          icon: "pencil",
          intent: "secondary",
          disabled: !canWriteClasses
        })
      },
      {
        key: "cancel",
        href: `/classes/${session.id}/cancel`,
        button: button({
          label: "Cancel",
          icon: "calendar-x",
          intent: "danger",
          disabled: !canWriteClasses || session.status !== ClassSessionStatus.Scheduled
        })
      }
    ]
  };
}

function buildSummary(
  sessions: ClassSessionView[],
  visibleCount: number
): ClassSessionListSummary {
  return {
    totalCount: sessions.length,
    scheduledCount: countByStatus(sessions, ClassSessionStatus.Scheduled),
    completedCount: countByStatus(sessions, ClassSessionStatus.Completed),
    cancelledCount: countByStatus(sessions, ClassSessionStatus.Cancelled),
    visibleCount
  };
}

function matchesFilters(
  session: ClassSessionView,
  classTypeMap: Map<string, ClassTypeView>,
  locationMap: Map<string, ClassLocationView>,
  trainerMap: Map<string, ClassTrainerView>,
  filters: ClassSessionListPage["filters"]
) {
  if (filters.locationId && session.locationId !== filters.locationId) {
    return false;
  }
  if (filters.status && session.status !== filters.status) {
    return false;
  }
  if (!filters.query) {
    return true;
  }
  const classType = classTypeMap.get(session.classTypeId);
  const location = locationMap.get(session.locationId);
  const trainer = session.trainerUserId ? trainerMap.get(session.trainerUserId) : undefined;
  return [
    classType?.name,
    location?.name,
    trainer?.fullName,
    session.roomName,
    classSessionStatusLabel(session.status)
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(filters.query));
}

function compareSessions(left: ClassSessionView, right: ClassSessionView) {
  return (
    sessionStatusSort(left.status) - sessionStatusSort(right.status) ||
    left.startsAt.localeCompare(right.startsAt) ||
    left.id.localeCompare(right.id)
  );
}

function sessionStatusSort(status: ClassSessionStatus) {
  return {
    [ClassSessionStatus.Scheduled]: 0,
    [ClassSessionStatus.Completed]: 1,
    [ClassSessionStatus.Cancelled]: 2
  }[status];
}

function countByStatus(sessions: ClassSessionView[], status: ClassSessionStatus) {
  return sessions.filter((session) => session.status === status).length;
}

export function classSessionStatusLabel(status: ClassSessionStatus) {
  return {
    [ClassSessionStatus.Scheduled]: "Scheduled",
    [ClassSessionStatus.Completed]: "Completed",
    [ClassSessionStatus.Cancelled]: "Cancelled"
  }[status];
}

export function formatDateTime(value: string) {
  return value.replace("T", " ").replace(".000Z", "Z");
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function hasActiveFilters(filters: ClassSessionListPage["filters"]) {
  return Boolean(filters.query || filters.locationId || filters.status);
}

function countActiveFilters(filters: ClassSessionListPage["filters"]) {
  return [filters.query, filters.locationId, filters.status].filter(Boolean).length;
}
