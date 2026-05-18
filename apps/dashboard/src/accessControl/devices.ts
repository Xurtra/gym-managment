import { AccessDeviceStatus, AccessDeviceType } from "@gym-platform/constants";
import type { AccessDeviceView } from "./types.js";

export interface AccessDeviceRegistrationScreen {
  screen: "access_device_registration";
  name: string;
  locationId?: string;
  deviceType: AccessDeviceType;
  canSubmit: boolean;
}

export interface AccessDeviceListScreen {
  screen: "access_device_list";
  devices: AccessDeviceView[];
  offlineCount: number;
}

export interface AccessDeviceKeyRotationScreen {
  screen: "access_device_key_rotation";
  deviceId: string;
  apiKeyPreview: string;
  rotatedAt?: string;
  warning: string;
}

export function buildAccessDeviceRegistrationScreen(input: {
  name?: string;
  locationId?: string;
  deviceType?: AccessDeviceType;
}): AccessDeviceRegistrationScreen {
  const name = input.name?.trim() ?? "";
  const screen: AccessDeviceRegistrationScreen = {
    screen: "access_device_registration",
    name,
    deviceType: input.deviceType ?? AccessDeviceType.DoorController,
    canSubmit: Boolean(name && input.locationId)
  };
  if (input.locationId) {
    screen.locationId = input.locationId;
  }
  return screen;
}

export function buildAccessDeviceListScreen(devices: AccessDeviceView[]): AccessDeviceListScreen {
  return {
    screen: "access_device_list",
    devices,
    offlineCount: devices.filter((device) => device.status === AccessDeviceStatus.Offline).length
  };
}

export function buildAccessDeviceKeyRotationScreen(device: AccessDeviceView): AccessDeviceKeyRotationScreen {
  const screen: AccessDeviceKeyRotationScreen = {
    screen: "access_device_key_rotation",
    deviceId: device.id,
    apiKeyPreview: device.apiKeyPreview,
    warning: "Store the new key on the access device before closing this view."
  };
  if (device.rotatedAt) {
    screen.rotatedAt = device.rotatedAt;
  }
  return screen;
}
