import {
  AccessDeviceStatus,
  AccessDeviceType,
  AccessEventDecision
} from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  buildAccessDeviceKeyRotationScreen,
  buildAccessDeviceListScreen,
  buildAccessDeviceRegistrationScreen,
  buildAccessEventHistoryScreen,
  buildAccessRuleEditorScreen
} from "./index.js";

describe("access control dashboard screens", () => {
  it("builds device registration, list, offline, and key rotation states", () => {
    const registration = buildAccessDeviceRegistrationScreen({
      name: " Front Door ",
      locationId: "location-1"
    });
    const list = buildAccessDeviceListScreen([
      {
        id: "device-1",
        locationId: "location-1",
        name: "Front Door",
        deviceType: AccessDeviceType.DoorController,
        status: AccessDeviceStatus.Offline,
        apiKeyPreview: "ak_abc...1234",
        lastHeartbeatAt: "2026-05-16T12:00:00.000Z",
        rotatedAt: "2026-05-16T12:05:00.000Z"
      }
    ]);
    const rotation = buildAccessDeviceKeyRotationScreen(list.devices[0]!);

    expect(registration.canSubmit).toBe(true);
    expect(registration.name).toBe("Front Door");
    expect(list.offlineCount).toBe(1);
    expect(rotation.warning).toMatch(/new key/i);
    expect(rotation.rotatedAt).toBe("2026-05-16T12:05:00.000Z");
  });

  it("builds rule editor state by plan and location", () => {
    const editor = buildAccessRuleEditorScreen({
      rules: [
        {
          id: "rule-1",
          name: "Unlimited plan",
          locationId: "location-1",
          planId: "plan-1",
          allowAllActiveMembers: false
        }
      ],
      selectedLocationId: "location-1",
      selectedPlanId: "plan-1"
    });

    expect(editor.canSubmit).toBe(true);
    expect(editor.rules[0]?.planId).toBe("plan-1");
  });

  it("builds access event history with denied filters", () => {
    const history = buildAccessEventHistoryScreen(
      [
        {
          id: "event-1",
          deviceId: "device-1",
          locationId: "location-1",
          memberId: "member-1",
          decision: AccessEventDecision.Unlock,
          reason: "access_granted",
          occurredAt: "2026-05-16T12:00:00.000Z"
        },
        {
          id: "event-2",
          deviceId: "device-1",
          locationId: "location-1",
          memberId: "member-2",
          decision: AccessEventDecision.Deny,
          reason: "member_status_frozen",
          occurredAt: "2026-05-16T12:01:00.000Z"
        }
      ],
      { decision: AccessEventDecision.Deny }
    );

    expect(history.events).toHaveLength(1);
    expect(history.deniedCount).toBe(1);
    expect(history.events[0]?.reason).toBe("member_status_frozen");
  });
});
