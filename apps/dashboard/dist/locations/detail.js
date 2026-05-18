import { button, card } from "@gym-platform/ui";
import { buildAddressValidationFields, buildLocationMapLink } from "./address.js";
import { buildLocationBusinessHoursEditor } from "./hours.js";
export function buildLocationDetailPage(input) {
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
//# sourceMappingURL=detail.js.map