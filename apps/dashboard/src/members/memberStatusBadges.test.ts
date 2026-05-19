import { MemberStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  buildMemberStatusBadge,
  buildMemberStatusBadgeLegend,
  buildMemberStatusBadgeLegendState
} from "./index.js";

describe("member status badges", () => {
  it("builds the standard member status badge set", () => {
    const badges = buildMemberStatusBadgeLegend();
    const legend = buildMemberStatusBadgeLegendState();

    expect(badges.map((badge) => badge.status)).toEqual([
      MemberStatus.Lead,
      MemberStatus.Trial,
      MemberStatus.Active,
      MemberStatus.PastDue,
      MemberStatus.Frozen,
      MemberStatus.Cancelled,
      MemberStatus.Expired
    ]);
    expect(badges.map((badge) => badge.label)).toEqual([
      "Lead",
      "Trial",
      "Active",
      "Past due",
      "Frozen",
      "Cancelled",
      "Expired"
    ]);
    expect(badges.map((badge) => badge.tone)).toEqual([
      "info",
      "info",
      "success",
      "warning",
      "neutral",
      "danger",
      "neutral"
    ]);
    expect(badges.map((badge) => badge.sortOrder)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(badges.map((badge) => badge.allowsCheckIn)).toEqual([
      false,
      true,
      true,
      false,
      false,
      false,
      false
    ]);
    expect(legend.kind).toBe("member_status_badge_legend");
    expect(legend.badgeCount).toBe(7);
    expect(legend.allowsCheckInCount).toBe(2);
    expect(legend.summaryLabel).toBe("7 member statuses");
  });

  it("supports archived members outside the default badge legend", () => {
    const badge = buildMemberStatusBadge(MemberStatus.Archived);

    expect(badge.label).toBe("Archived");
    expect(badge.tone).toBe("neutral");
    expect(badge.emphasis).toBe("subtle");
    expect(badge.category).toBe("archived");
    expect(badge.allowsCheckIn).toBe(false);
    expect(badge.sortOrder).toBe(7);
  });
});
