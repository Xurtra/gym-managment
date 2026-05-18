import {
  AccessDeviceStatus,
  AccessDeviceType,
  AccessEventDecision,
  LocationStatus,
  MemberStatus,
  MembershipStatus,
  PlanStatus
} from "@gym-platform/constants";
import type {
  AccessDeviceCreateInput,
  AccessDeviceEventInput,
  AccessDeviceHeartbeatInput,
  AccessRuleCreateInput
} from "@gym-platform/validation";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { badRequest, notFound } from "../../http/errors.js";
import type { AccessDevice, AccessRule, Member } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

const activeMemberStatuses = new Set<MemberStatus>([MemberStatus.Active, MemberStatus.Trial]);
const activeMembershipStatuses = new Set<MembershipStatus>([
  MembershipStatus.Active,
  MembershipStatus.Trialing
]);
const OFFLINE_AFTER_MS = 2 * 60 * 1000;

export class AccessControlService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async registerDevice(gymId: string, input: AccessDeviceCreateInput) {
    const location = await this.repositories.locations.getLocation(input.locationId);
    if (!location || location.gymId !== gymId || location.status !== LocationStatus.Active) {
      throw notFound("Location was not found.");
    }
    const apiKey = createApiKey();
    const now = this.clock.now();
    const device: AccessDevice = {
      id: randomUUID(),
      gymId,
      locationId: location.id,
      name: input.name,
      deviceType: input.deviceType ?? AccessDeviceType.DoorController,
      status: AccessDeviceStatus.Active,
      apiKeyHash: hashApiKey(apiKey),
      apiKeyPreview: previewApiKey(apiKey),
      createdAt: now,
      updatedAt: now
    };
    return { device: await this.repositories.accessControl.createAccessDevice(device), apiKey };
  }

  async listDevices(gymId: string) {
    const devices = await this.repositories.accessControl.listAccessDevicesForGym(gymId);
    const now = this.clock.now();
    return Promise.all(devices.map((device) => this.markOfflineIfStale(device, now)));
  }

  async rotateDeviceApiKey(gymId: string, deviceId: string) {
    const device = await this.getScopedDevice(gymId, deviceId);
    const apiKey = createApiKey();
    const now = this.clock.now();
    const updated = await this.repositories.accessControl.updateAccessDevice({
      ...device,
      apiKeyHash: hashApiKey(apiKey),
      apiKeyPreview: previewApiKey(apiKey),
      status: AccessDeviceStatus.Active,
      updatedAt: now,
      rotatedAt: now
    });
    return { device: updated, apiKey };
  }

  async heartbeat(input: AccessDeviceHeartbeatInput) {
    const device = await this.deviceForApiKey(input.apiKey);
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : this.clock.now();
    return this.repositories.accessControl.updateAccessDevice({
      ...device,
      status: AccessDeviceStatus.Active,
      lastHeartbeatAt: occurredAt,
      updatedAt: this.clock.now()
    });
  }

  async createRule(gymId: string, input: AccessRuleCreateInput) {
    const location = await this.repositories.locations.getLocation(input.locationId);
    if (!location || location.gymId !== gymId || location.status !== LocationStatus.Active) {
      throw notFound("Location was not found.");
    }
    if (input.planId) {
      const plan = await this.repositories.membershipPlans.getMembershipPlan(input.planId);
      if (!plan || plan.gymId !== gymId || plan.status !== PlanStatus.Active) {
        throw notFound("Membership plan was not found.");
      }
    }
    const now = this.clock.now();
    const rule: AccessRule = {
      id: randomUUID(),
      gymId,
      locationId: location.id,
      name: input.name,
      allowAllActiveMembers: input.allowAllActiveMembers ?? false,
      createdAt: now,
      updatedAt: now
    };
    if (input.planId) {
      rule.planId = input.planId;
    }
    if (input.startsAt) {
      rule.startsAt = new Date(input.startsAt);
    }
    if (input.endsAt) {
      rule.endsAt = new Date(input.endsAt);
    }
    return this.repositories.accessControl.createAccessRule(rule);
  }

  async listRules(gymId: string) {
    return this.repositories.accessControl.listAccessRulesForGym(gymId);
  }

  async listEvents(gymId: string) {
    return this.repositories.accessControl.listAccessEventsForGym(gymId);
  }

  async authorizeDoor(input: AccessDeviceEventInput) {
    const device = await this.deviceForApiKey(input.apiKey);
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : this.clock.now();
    const member = await this.resolveMember(device.gymId, input);
    const decision = await this.decide(device, member, occurredAt);
    const event = await this.repositories.accessControl.createAccessEvent({
      id: randomUUID(),
      gymId: device.gymId,
      deviceId: device.id,
      locationId: device.locationId,
      ...(member ? { memberId: member.id } : {}),
      decision: decision.unlock ? AccessEventDecision.Unlock : AccessEventDecision.Deny,
      reason: decision.reason,
      occurredAt,
      createdAt: this.clock.now()
    });
    return {
      unlock: decision.unlock,
      reason: decision.reason,
      event,
      memberId: member?.id
    };
  }

  private async decide(device: AccessDevice, member: Member | undefined, occurredAt: Date) {
    if (device.status === AccessDeviceStatus.Disabled) {
      return { unlock: false, reason: "device_disabled" };
    }
    if (!member) {
      return { unlock: false, reason: "member_not_found" };
    }
    if (!activeMemberStatuses.has(member.status)) {
      return { unlock: false, reason: `member_status_${member.status}` };
    }
    const memberships = (await this.repositories.memberMemberships.listMemberMembershipsForMember(member.id)).filter(
      (membership) => membership.gymId === device.gymId
    );
    const activeMemberships = memberships.filter(
      (membership) =>
        activeMembershipStatuses.has(membership.status) &&
        membership.startsAt <= occurredAt &&
        (!membership.endsAt || membership.endsAt >= occurredAt)
    );
    if (activeMemberships.length === 0) {
      return { unlock: false, reason: "active_membership_required" };
    }
    const rules = (await this.repositories.accessControl.listAccessRulesForGym(device.gymId)).filter(
      (rule) =>
        rule.locationId === device.locationId &&
        (!rule.startsAt || rule.startsAt <= occurredAt) &&
        (!rule.endsAt || rule.endsAt >= occurredAt)
    );
    const allowed = rules.some(
      (rule) =>
        rule.allowAllActiveMembers ||
        activeMemberships.some((membership) => membership.planId === rule.planId)
    );
    return allowed
      ? { unlock: true, reason: "access_granted" }
      : { unlock: false, reason: "access_rule_not_matched" };
  }

  private async resolveMember(gymId: string, input: AccessDeviceEventInput) {
    const memberId = input.memberId ?? memberIdFromQrPayload(gymId, input.qrPayload);
    if (memberId) {
      const member = await this.repositories.members.getMember(memberId);
      return member && member.gymId === gymId && member.status !== MemberStatus.Archived
        ? member
        : undefined;
    }
    if (!input.barcode) {
      throw badRequest("A member ID, barcode, or QR payload is required.", "member_lookup_required");
    }
    return (await this.repositories.members.listMembersForGym(gymId)).find(
      (candidate) => candidate.barcode === input.barcode && candidate.status !== MemberStatus.Archived
    );
  }

  private async deviceForApiKey(apiKey: string) {
    const device = await this.repositories.accessControl.findAccessDeviceByApiKeyHash(hashApiKey(apiKey));
    if (!device) {
      throw notFound("Access device was not found.");
    }
    return device;
  }

  private async getScopedDevice(gymId: string, deviceId: string) {
    const device = await this.repositories.accessControl.getAccessDevice(deviceId);
    if (!device || device.gymId !== gymId) {
      throw notFound("Access device was not found.");
    }
    return device;
  }

  private async markOfflineIfStale(device: AccessDevice, now: Date) {
    if (
      device.status === AccessDeviceStatus.Active &&
      device.lastHeartbeatAt &&
      now.getTime() - device.lastHeartbeatAt.getTime() > OFFLINE_AFTER_MS
    ) {
      return this.repositories.accessControl.updateAccessDevice({
        ...device,
        status: AccessDeviceStatus.Offline,
        updatedAt: now
      });
    }
    return device;
  }
}

function createApiKey() {
  return `ak_${randomBytes(24).toString("base64url")}`;
}

function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("base64url");
}

function previewApiKey(apiKey: string) {
  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
}

function memberIdFromQrPayload(gymId: string, qrPayload: string | undefined) {
  if (!qrPayload) {
    return undefined;
  }
  const match = qrPayload.match(/^gym:([^:]+):member:([^:]+)$/);
  if (!match || match[1] !== gymId) {
    throw badRequest("QR access payload is invalid.", "invalid_qr_payload");
  }
  return match[2];
}
