import { button, card } from "@gym-platform/ui";
import type { CardModel } from "@gym-platform/ui";
import { buildAddressValidationFields, buildLocationMapLink } from "./address.js";
import { buildLocationBusinessHoursEditor } from "./hours.js";
import type {
  LocationAccessRuleView,
  LocationMapLink,
  LocationRoomView,
  LocationView
} from "./types.js";

export interface LocationDetailPage {
  screen: "location_detail";
  location: LocationView;
  mapLink: LocationMapLink;
  address: ReturnType<typeof buildAddressValidationFields>;
  businessHours: ReturnType<typeof buildLocationBusinessHoursEditor>;
  rooms: LocationRoomView[];
  accessRules: LocationAccessRuleView[];
  card: CardModel;
  canArchive: boolean;
}

export function buildLocationDetailPage(input: {
  location: LocationView;
  rooms?: LocationRoomView[];
  accessRules?: LocationAccessRuleView[];
}): LocationDetailPage {
  const scopedRooms = (input.rooms ?? []).filter((room) => room.locationId === input.location.id);
  const scopedRules = (input.accessRules ?? []).filter((rule) => rule.locationId === input.location.id);

  return {
    screen: "location_detail",
    location: input.location,
    mapLink: buildLocationMapLink(input.location.address),
    address: buildAddressValidationFields(input.location.address),
    businessHours: buildLocationBusinessHoursEditor(input.location.operatingHours),
    rooms: scopedRooms,
    accessRules: scopedRules,
    card: card({
      title: input.location.name,
      body: input.location.timezone,
      actions: [
        button({ label: "Save location" }),
        button({ label: "Archive location", intent: "danger" })
      ]
    }),
    canArchive: true
  };
}
