import type { AccessDeviceCreateInput, AccessDeviceEventInput, AccessDeviceHeartbeatInput, AccessRuleCreateInput } from "@gym-platform/validation";
import type { AccessDevice, AccessRule } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
export declare class AccessControlService {
    private readonly repositories;
    private readonly clock;
    constructor(repositories: Repositories, clock: Clock);
    registerDevice(gymId: string, input: AccessDeviceCreateInput): Promise<{
        device: AccessDevice;
        apiKey: string;
    }>;
    listDevices(gymId: string): Promise<AccessDevice[]>;
    rotateDeviceApiKey(gymId: string, deviceId: string): Promise<{
        device: AccessDevice;
        apiKey: string;
    }>;
    heartbeat(input: AccessDeviceHeartbeatInput): Promise<AccessDevice>;
    createRule(gymId: string, input: AccessRuleCreateInput): Promise<AccessRule>;
    listRules(gymId: string): Promise<AccessRule[]>;
    listEvents(gymId: string): Promise<import("../../infrastructure/store/entities.js").AccessEvent[]>;
    authorizeDoor(input: AccessDeviceEventInput): Promise<{
        unlock: boolean;
        reason: string;
        event: import("../../infrastructure/store/entities.js").AccessEvent;
        memberId: string | undefined;
    }>;
    private decide;
    private resolveMember;
    private deviceForApiKey;
    private getScopedDevice;
    private markOfflineIfStale;
}
//# sourceMappingURL=accessControl.service.d.ts.map