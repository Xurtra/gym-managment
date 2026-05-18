import type { ButtonModel, InputModel, TableModel } from "@gym-platform/ui";
import type { LocationRoomView } from "./types.js";
export interface ClassRoomManagementScreen {
    screen: "location_class_rooms";
    locationId: string;
    rooms: LocationRoomView[];
    draftName: string;
    duplicate: boolean;
    canSubmit: boolean;
    nameField: InputModel;
    action: ButtonModel;
    table: TableModel<LocationRoomView>;
}
export declare function buildLocationClassRoomManagement(inputModel: {
    locationId: string;
    rooms: LocationRoomView[];
    draftName?: string;
}): ClassRoomManagementScreen;
//# sourceMappingURL=rooms.d.ts.map