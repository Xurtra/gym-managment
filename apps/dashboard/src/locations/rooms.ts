import { button, input, table } from "@gym-platform/ui";
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

export function buildLocationClassRoomManagement(inputModel: {
  locationId: string;
  rooms: LocationRoomView[];
  draftName?: string;
}): ClassRoomManagementScreen {
  const rooms = inputModel.rooms.filter((room) => room.locationId === inputModel.locationId);
  const draftName = inputModel.draftName?.trim() ?? "";
  const duplicate = rooms.some((room) => room.name.toLowerCase() === draftName.toLowerCase());
  const canSubmit = Boolean(draftName && !duplicate);

  return {
    screen: "location_class_rooms",
    locationId: inputModel.locationId,
    rooms,
    draftName,
    duplicate,
    canSubmit,
    nameField: input({
      name: "roomName",
      label: "Room name",
      value: draftName,
      type: "text",
      required: true,
      ...(duplicate ? { error: "Room already exists for this location." } : {})
    }),
    action: button({ label: "Add room", disabled: !canSubmit }),
    table: table({
      columns: [
        { key: "name", label: "Room" },
        { key: "sessionCount", label: "Sessions" },
        { key: "nextSessionAt", label: "Next session" }
      ],
      rows: rooms
    })
  };
}
