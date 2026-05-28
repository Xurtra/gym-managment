import { Permission } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  applyTokenRefresh,
  buildDashboardLayout,
  buildGuardedNavigation,
  buildForgotPasswordScreen,
  buildLoginScreen,
  buildProtectedRoute,
  buildRecoveryCodesScreen,
  buildRecoveryLoginScreen,
  buildRegistrationScreen,
  buildResetPasswordScreen,
  buildTwoFactorSetupScreen,
  buildTwoFactorVerifyScreen,
  clearSession,
  forceLogout,
  loadSession,
  saveSession
} from "../index.js";

describe("dashboard auth and routing", () => {
  it("builds auth screens", () => {
    expect(buildLoginScreen({ email: "owner@example.com" }).fields[0]?.value).toBe("owner@example.com");
    expect(buildRegistrationScreen().fields.map((field) => field.name)).toContain("firstName");
    expect(buildForgotPasswordScreen().screen).toBe("forgot_password");
    expect(buildResetPasswordScreen().fields.map((field) => field.name)).toContain("token");
    expect(buildTwoFactorSetupScreen("ABC123").card.body).toContain("ABC123");
    expect(buildTwoFactorVerifyScreen().fields.map((field) => field.name)).toContain("twoFactorCode");
    expect(buildRecoveryCodesScreen(["AAAAA-BBBBB"]).codes).toHaveLength(1);
    expect(buildRecoveryLoginScreen().fields.map((field) => field.name)).toContain("recoveryCode");
  });

  it("protects authenticated dashboard routes", () => {
    expect(buildProtectedRoute({ path: "/consumers", authenticated: false }).redirectTo).toBe("/login");
    expect(
      buildProtectedRoute({
        path: "/consumers",
        authenticated: true,
        permissions: [Permission.MemberRead]
      }).allowed
    ).toBe(true);
    expect(
      buildProtectedRoute({
        path: "/consumers",
        authenticated: true,
        permissions: [Permission.ClassRead]
      }).redirectTo
    ).toBe("/");
    expect(buildProtectedRoute({ path: "/login", authenticated: false }).allowed).toBe(true);
  });

  it("guards dashboard navigation by permissions", () => {
    const trainerNav = buildGuardedNavigation("/classes", {
      permissions: [
        Permission.GymRead,
        Permission.LocationRead,
        Permission.MemberRead,
        Permission.ClassRead,
        Permission.BookingRead
      ]
    });
    const frontDeskLayout = buildDashboardLayout("/check-ins", {
      permissions: [
        Permission.GymRead,
        Permission.LocationRead,
        Permission.MemberRead,
        Permission.MemberWrite,
        Permission.ClassRead,
        Permission.BookingRead,
        Permission.AccessRead,
        Permission.PaymentRead
      ]
    });

    expect(trainerNav.map((item) => item.href)).toEqual([
      "/",
      "/consumers",
      "/locations",
      "/classes",
      "/bookings",
      "/training",
      "/contracts",
      "/portal",
      "/marketing"
    ]);
    expect(frontDeskLayout.navItems.map((item) => item.href)).toContain("/check-ins");
    expect(frontDeskLayout.navItems.map((item) => item.href)).toContain("/access-control");
    expect(frontDeskLayout.navItems.map((item) => item.href)).not.toContain("/settings");
  });

  it("persists, refreshes, and clears sessions", () => {
    const storage = memoryStorage();
    saveSession(storage, { accessToken: "a1", refreshToken: "r1", userId: "user-1" });
    expect(loadSession(storage)?.accessToken).toBe("a1");
    const refreshed = applyTokenRefresh(storage, loadSession(storage)!, {
      accessToken: "a2",
      refreshToken: "r2"
    });

    expect(refreshed.refreshToken).toBe("r2");
    expect(loadSession(storage)?.accessToken).toBe("a2");
    expect(forceLogout(storage).redirectTo).toBe("/login");
    expect(loadSession(storage)).toBeUndefined();
    saveSession(storage, { accessToken: "a3", refreshToken: "r3" });
    clearSession(storage);
    expect(loadSession(storage)).toBeUndefined();
  });
});

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  };
}
