import { AccessDeviceType } from "@gym-platform/constants";
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
export declare function buildAccessDeviceRegistrationScreen(input: {
    name?: string;
    locationId?: string;
    deviceType?: AccessDeviceType;
}): AccessDeviceRegistrationScreen;
export declare function buildAccessDeviceListScreen(devices: AccessDeviceView[]): AccessDeviceListScreen;
export declare function buildAccessDeviceKeyRotationScreen(device: AccessDeviceView): AccessDeviceKeyRotationScreen;
//# sourceMappingURL=devices.d.ts.map