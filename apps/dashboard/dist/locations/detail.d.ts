import type { ButtonModel, CardModel } from "@gym-platform/ui";
import { buildAddressValidationFields } from "./address.js";
import { buildLocationAccessRulesScreen } from "./access.js";
import { buildLocationBusinessHoursEditor } from "./hours.js";
import { buildLocationClassRoomManagement } from "./rooms.js";
import type { LocationAccessRuleView, LocationMapLink, LocationRoomView, LocationView } from "./types.js";
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
export declare function buildLocationDetailPage(input: {
    location: LocationView;
    rooms?: LocationRoomView[];
    accessRules?: LocationAccessRuleView[];
}): LocationDetailPage;
//# sourceMappingURL=detail.d.ts.map