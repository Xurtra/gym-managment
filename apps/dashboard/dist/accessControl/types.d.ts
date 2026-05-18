import type { AccessDeviceStatus, AccessDeviceType, AccessEventDecision } from "@gym-platform/constants";
export interface AccessDeviceView {
    id: string;
    locationId: string;
    locationName?: string;
    name: string;
    deviceType: AccessDeviceType;
    status: AccessDeviceStatus;
    apiKeyPreview: string;
    lastHeartbeatAt?: string;
    rotatedAt?: string;
}
export interface AccessRuleView {
    id: string;
    name: string;
    locationId: string;
    locationName?: string;
    planId?: string;
    planName?: string;
    allowAllActiveMembers: boolean;
    startsAt?: string;
    endsAt?: string;
}
export interface AccessEventView {
    id: string;
    deviceId: string;
    deviceName?: string;
    locationId: string;
    locationName?: string;
    memberId?: string;
    memberName?: string;
    decision: AccessEventDecision;
    reason: string;
    occurredAt: string;
}
//# sourceMappingURL=types.d.ts.map