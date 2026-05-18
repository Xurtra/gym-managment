import type { CardModel } from "@gym-platform/ui";
import { buildAddressValidationFields } from "./address.js";
import { buildLocationBusinessHoursEditor } from "./hours.js";
import type { LocationAccessRuleView, LocationMapLink, LocationRoomView, LocationView } from "./types.js";
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
export declare function buildLocationDetailPage(input: {
    location: LocationView;
    rooms?: LocationRoomView[];
    accessRules?: LocationAccessRuleView[];
}): LocationDetailPage;
//# sourceMappingURL=detail.d.ts.map