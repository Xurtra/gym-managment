import { LocationStatus } from "@gym-platform/constants";
import { button, card } from "@gym-platform/ui";
import type { ButtonModel, CardModel } from "@gym-platform/ui";
import { buildAddressValidationFields, buildLocationMapLink, formatAddress } from "./address.js";
import { buildLocationAccessRulesScreen } from "./access.js";
import { buildLocationBusinessHoursEditor } from "./hours.js";
import { buildLocationClassRoomManagement } from "./rooms.js";
import type {
  LocationAccessRuleView,
  LocationMapLink,
  LocationRoomView,
  LocationView
} from "./types.js";

export interface LocationDetailPage {
  screen: "location_detail";
  location: LocationView;
  title: string;
  addressLabel: string;
  phoneLabel: string;
  statusLabel: string;
  mapLink: LocationMapLink;
  address: ReturnType<typeof buildAddressValidationFields>;
  businessHours: ReturnType<typeof buildLocationBusinessHoursEditor>;
  roomManagement: ReturnType<typeof buildLocationClassRoomManagement>;
  accessRuleScreen: ReturnType<typeof buildLocationAccessRulesScreen>;
  rooms: LocationRoomView[];
  accessRules: LocationAccessRuleView[];
  card: CardModel;
  saveAction: ButtonModel;
  archiveAction: ButtonModel;
  canArchive: boolean;
}

export function buildLocationDetailPage(input: {
  location: LocationView;
  rooms?: LocationRoomView[];
  accessRules?: LocationAccessRuleView[];
}): LocationDetailPage {
  const scopedRooms = (input.rooms ?? []).filter((room) => room.locationId === input.location.id);
  const scopedRules = (input.accessRules ?? []).filter((rule) => rule.locationId === input.location.id);
  const canArchive = input.location.status !== LocationStatus.Archived;
  const saveAction = button({ label: "Save location" });
  const archiveAction = button({
    label: "Archive location",
    intent: "danger",
    disabled: !canArchive
  });

  return {
    screen: "location_detail",
    location: input.location,
    title: input.location.name,
    addressLabel: formatAddress(input.location.address),
    phoneLabel: input.location.phone ?? "No phone listed",
    statusLabel: input.location.status,
    mapLink: buildLocationMapLink(input.location.address),
    address: buildAddressValidationFields(input.location.address),
    businessHours: buildLocationBusinessHoursEditor(input.location.operatingHours),
    roomManagement: buildLocationClassRoomManagement({
      locationId: input.location.id,
      rooms: scopedRooms
    }),
    accessRuleScreen: buildLocationAccessRulesScreen({
      locationId: input.location.id,
      rules: scopedRules
    }),
    rooms: scopedRooms,
    accessRules: scopedRules,
    card: card({
      title: input.location.name,
      body: `${formatAddress(input.location.address)} | ${input.location.timezone}`,
      actions: [saveAction, archiveAction]
    }),
    saveAction,
    archiveAction,
    canArchive
  };
}
