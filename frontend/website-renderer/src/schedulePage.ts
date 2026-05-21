import { ClassSessionStatus, FeatureFlag } from "@gym-platform/constants";
import { button, card, emptyState } from "@gym-platform/ui";
import type { ButtonModel, CardModel, EmptyStateModel } from "@gym-platform/ui";

export interface PublicScheduleSessionView {
  id: string;
  classTypeName: string;
  locationId: string;
  locationName: string;
  startsAt: string;
  endsAt: string;
  status: ClassSessionStatus;
  roomName?: string;
  trainerName?: string;
  spotsRemaining?: number;
  waitlistRemaining?: number;
}

export interface PublicScheduleLocationOption {
  id: string;
  label: string;
  selected: boolean;
}

export interface PublicScheduleSessionCard extends CardModel {
  sessionId: string;
  startsAtLabel: string;
  endsAtLabel: string;
  locationLabel: string;
  roomLabel: string;
  trainerLabel: string;
  availabilityLabel: string;
}

export interface PublicSchedulePage {
  screen: "public_schedule";
  websiteBuilderEnabled: boolean;
  selectedLocationId?: string;
  summaryLabel: string;
  locationOptions: PublicScheduleLocationOption[];
  sessionCards: PublicScheduleSessionCard[];
  primaryAction: ButtonModel;
  empty?: EmptyStateModel;
  blockedReason?: string;
}

export function buildPublicSchedulePage(inputModel: {
  sessions: PublicScheduleSessionView[];
  featureFlags?: string[];
  selectedLocationId?: string;
}): PublicSchedulePage {
  const websiteBuilderEnabled = (inputModel.featureFlags ?? []).includes(FeatureFlag.WebsiteBuilder);
  const blockedReason = websiteBuilderEnabled ? undefined : "Website builder is disabled for this gym.";
  const availableSessions = inputModel.sessions
    .filter((session) => session.status === ClassSessionStatus.Scheduled)
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  const locationOptions = buildLocationOptions(availableSessions, inputModel.selectedLocationId);
  const selectedLocationId =
    inputModel.selectedLocationId ?? locationOptions.find((locationOption) => locationOption.selected)?.id;
  const visibleSessions = selectedLocationId
    ? availableSessions.filter((session) => session.locationId === selectedLocationId)
    : availableSessions;
  const sessionCards = visibleSessions.map<PublicScheduleSessionCard>((session) => ({
    ...card({
      title: session.classTypeName,
      body: `${formatDateTime(session.startsAt)} at ${session.locationName}`,
      actions: [
        button({
          label: "Reserve spot",
          icon: "calendar",
          disabled: !websiteBuilderEnabled
        })
      ]
    }),
    sessionId: session.id,
    startsAtLabel: formatDateTime(session.startsAt),
    endsAtLabel: formatDateTime(session.endsAt),
    locationLabel: session.locationName,
    roomLabel: session.roomName?.trim() || "Room not assigned",
    trainerLabel: session.trainerName?.trim() || "Trainer not assigned",
    availabilityLabel: buildAvailabilityLabel(session)
  }));
  const empty = buildEmptyState({
    websiteBuilderEnabled,
    sessionCount: availableSessions.length,
    visibleSessionCount: sessionCards.length
  });

  return {
    screen: "public_schedule",
    websiteBuilderEnabled,
    ...(selectedLocationId ? { selectedLocationId } : {}),
    summaryLabel: buildSummaryLabel({
      blockedReason,
      locationName: locationOptions.find((locationOption) => locationOption.selected)?.label,
      visibleSessionCount: sessionCards.length
    }),
    locationOptions,
    sessionCards,
    primaryAction: button({
      label: "Join now",
      icon: "arrow-right",
      disabled: !websiteBuilderEnabled
    }),
    ...(empty ? { empty } : {}),
    ...(blockedReason ? { blockedReason } : {})
  };
}

function buildLocationOptions(
  sessions: PublicScheduleSessionView[],
  selectedLocationId: string | undefined
) {
  const seen = new Set<string>();
  const locationOptions: PublicScheduleLocationOption[] = [];

  for (const session of sessions) {
    if (seen.has(session.locationId)) {
      continue;
    }

    seen.add(session.locationId);
    locationOptions.push({
      id: session.locationId,
      label: session.locationName,
      selected: session.locationId === selectedLocationId
    });
  }

  return locationOptions.map((locationOption, index) => ({
    ...locationOption,
    selected: locationOption.selected || (!selectedLocationId && index === 0)
  }));
}

function buildEmptyState(inputModel: {
  websiteBuilderEnabled: boolean;
  sessionCount: number;
  visibleSessionCount: number;
}) {
  if (!inputModel.websiteBuilderEnabled) {
    return emptyState({
      title: "Schedule unavailable",
      body: "Enable the website builder feature flag to publish the public class schedule."
    });
  }

  if (inputModel.sessionCount === 0) {
    return emptyState({
      title: "No classes scheduled",
      body: "There are no upcoming public classes right now."
    });
  }

  if (inputModel.visibleSessionCount === 0) {
    return emptyState({
      title: "No classes for this location",
      body: "Try another location to see upcoming sessions."
    });
  }

  return undefined;
}

function buildSummaryLabel(inputModel: {
  blockedReason: string | undefined;
  locationName: string | undefined;
  visibleSessionCount: number;
}) {
  if (inputModel.blockedReason) {
    return "Public schedule unavailable";
  }

  if (!inputModel.locationName) {
    return `${inputModel.visibleSessionCount} upcoming classes`;
  }

  return `${inputModel.visibleSessionCount} upcoming classes at ${inputModel.locationName}`;
}

function buildAvailabilityLabel(session: PublicScheduleSessionView) {
  const spotsRemaining = session.spotsRemaining ?? 0;
  const waitlistRemaining = session.waitlistRemaining ?? 0;

  if (spotsRemaining > 0) {
    return `${spotsRemaining} spots left`;
  }

  if (waitlistRemaining > 0) {
    return `Waitlist available (${waitlistRemaining} left)`;
  }

  return "Class full";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toISOString().slice(0, 16).replace("T", " ");
}
