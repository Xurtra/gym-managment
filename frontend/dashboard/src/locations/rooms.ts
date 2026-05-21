import { button, emptyState, input, table } from "@gym-platform/ui";
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

export function buildLocationClassRoomManagement(inputModel: {
  locationId: string;
  rooms: LocationRoomView[];
  draftName?: string;
}): ClassRoomManagementScreen {
  const rooms = inputModel.rooms
    .filter((room) => room.locationId === inputModel.locationId)
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map<LocationRoomManagementRow>((room) => ({
      ...room,
      nextSessionLabel: room.nextSessionAt ? room.nextSessionAt : "No upcoming session"
    }));
  const draftName = inputModel.draftName?.trim() ?? "";
  const duplicateRoom = rooms.find((room) => room.name.toLowerCase() === draftName.toLowerCase());
  const duplicate = Boolean(duplicateRoom);
  const canSubmit = Boolean(draftName && !duplicate);
  const empty =
    rooms.length === 0
      ? emptyState({
          title: "No rooms configured",
          body: "Add a room to start assigning classes inside this location.",
          action: button({ label: "Add room", icon: "plus" })
        })
      : undefined;

  return {
    screen: "location_class_rooms",
    locationId: inputModel.locationId,
    rooms,
    roomCount: rooms.length,
    totalSessionCount: rooms.reduce((total, room) => total + room.sessionCount, 0),
    draftName,
    duplicate,
    ...(duplicateRoom ? { duplicateRoomName: duplicateRoom.name } : {}),
    canSubmit,
    ...(empty ? { empty } : {}),
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
        { key: "nextSessionLabel", label: "Next session" }
      ],
      rows: rooms,
      ...(empty ? { empty } : {})
    })
  };
}
