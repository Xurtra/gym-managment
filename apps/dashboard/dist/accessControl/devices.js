import { AccessDeviceStatus, AccessDeviceType } from "@gym-platform/constants";
export function buildAccessDeviceRegistrationScreen(input) {
    const name = input.name?.trim() ?? "";
    const screen = {
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
export function buildAccessDeviceListScreen(devices) {
    return {
        screen: "access_device_list",
        devices,
        offlineCount: devices.filter((device) => device.status === AccessDeviceStatus.Offline).length
    };
}
export function buildAccessDeviceKeyRotationScreen(device) {
    const screen = {
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
//# sourceMappingURL=devices.js.map