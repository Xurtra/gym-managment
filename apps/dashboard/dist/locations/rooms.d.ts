import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";
import type { LocationRoomView } from "./types.js";
export interface LocationRoomManagementRow extends LocationRoomView {
    nextSessionLabel: string;
}
export interface ClassRoomManagementScreen {
    screen: "location_class_rooms";
    locationId: string;
    rooms: LocationRoomManagementRow[];
    roomCount: number;
    totalSessionCount: number;
    draftName: string;
    duplicate: boolean;
    duplicateRoomName?: string;
    canSubmit: boolean;
    empty?: EmptyStateModel;
    nameField: InputModel;
    action: ButtonModel;
    table: TableModel<LocationRoomManagementRow>;
}
export declare function buildLocationClassRoomManagement(inputModel: {
    locationId: string;
    rooms: LocationRoomView[];
    draftName?: string;
}): ClassRoomManagementScreen;
//# sourceMappingURL=rooms.d.ts.map