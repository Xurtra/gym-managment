import { MemberStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildMemberStatusBadge, buildMemberStatusBadgeLegend } from "./index.js";

describe("member status badges", () => {
  it("builds the standard member status badge set", () => {
    const badges = buildMemberStatusBadgeLegend();

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
  });

  it("supports archived members outside the default badge legend", () => {
    const badge = buildMemberStatusBadge(MemberStatus.Archived);

    expect(badge.label).toBe("Archived");
    expect(badge.tone).toBe("neutral");
    expect(badge.emphasis).toBe("subtle");
  });
});
