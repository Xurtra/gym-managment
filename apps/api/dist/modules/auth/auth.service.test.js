import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { generateTotpCode } from "./auth.service.js";
import { testConfig, fixedClock } from "../../testUtils.js";
const ownerInput = {
    email: "owner@example.com",
    password: "Password123",
    firstName: "Demo",
    lastName: "Owner",
    gymName: "Demo Strength Club",
    timezone: "America/New_York",
    locale: "en-US"
};
describe("AuthService", () => {
    it("registers a gym owner with default gym membership and verification token", async () => {
        const services = createServices(testConfig, fixedClock);
        const result = await services.authService.register(ownerInput);
        expect(result.user.email).toBe(ownerInput.email);
        expect(result.gym?.name).toBe(ownerInput.gymName);
        expect(result.emailVerificationToken).toBeTruthy();
        expect(await services.repositories.gymUsers.listGymMemberships(result.user.id)).toHaveLength(1);
        expect(await services.repositories.roles.listRolesForGym(result.gym?.id ?? "")).toHaveLength(7);
    });
    it("logs in, rotates refresh tokens, and rejects reused refresh tokens", async () => {
        const services = createServices(testConfig, fixedClock);
        await services.authService.register(ownerInput);
        const login = await services.authService.login({
            email: ownerInput.email,
            password: ownerInput.password
        });
        if (!("refreshToken" in login)) {
            throw new Error("Two-factor should not be required for a fresh account.");
        }
        const refreshed = await services.authService.refresh(login.refreshToken);
        expect(refreshed.refreshToken).not.toBe(login.refreshToken);
        await expect(services.authService.refresh(login.refreshToken)).rejects.toThrow(/invalid or expired/i);
    });
    it("resets a password and invalidates existing refresh tokens", async () => {
        const services = createServices(testConfig, fixedClock);
        await services.authService.register(ownerInput);
        const login = await services.authService.login({
            email: ownerInput.email,
            password: ownerInput.password
        });
        if (!("refreshToken" in login)) {
            throw new Error("Two-factor should not be required for a fresh account.");
        }
        const forgot = await services.authService.forgotPassword({ email: ownerInput.email });
        expect(forgot.resetToken).toBeTruthy();
        await services.authService.resetPassword({
            token: forgot.resetToken ?? "",
            password: "NewPassword123"
        });
        await expect(services.authService.refresh(login.refreshToken)).rejects.toThrow(/invalid or expired/i);
        await expect(services.authService.login({ email: ownerInput.email, password: "NewPassword123" })).resolves.toMatchObject({ user: { email: ownerInput.email } });
    });
    it("verifies email tokens once", async () => {
        const services = createServices(testConfig, fixedClock);
        const result = await services.authService.register(ownerInput);
        const verified = await services.authService.verifyEmail({ token: result.emailVerificationToken });
        expect(verified.user.emailVerifiedAt).toBe("2026-05-16T12:00:00.000Z");
        await expect(services.authService.verifyEmail({ token: result.emailVerificationToken })).rejects.toThrow(/invalid or expired/i);
    });
    it("sets up two-factor auth and requires a code or recovery code on login", async () => {
        const services = createServices(testConfig, fixedClock);
        const registered = await services.authService.register(ownerInput);
        const setup = await services.authService.setupTwoFactor(registered.user.id);
        const code = generateTotpCode(setup.secret, fixedClock.now());
        const verified = await services.authService.verifyTwoFactorSetup(registered.user.id, { code });
        const challenge = await services.authService.login({
            email: ownerInput.email,
            password: ownerInput.password
        });
        const codeLogin = await services.authService.login({
            email: ownerInput.email,
            password: ownerInput.password,
            twoFactorCode: code
        });
        const recoveryLogin = await services.authService.login({
            email: ownerInput.email,
            password: ownerInput.password,
            recoveryCode: verified.recoveryCodes[0]
        });
        expect(verified.recoveryCodes).toHaveLength(8);
        expect(challenge).toMatchObject({ twoFactorRequired: true });
        expect(codeLogin).toMatchObject({ user: { twoFactorEnabled: true } });
        expect(recoveryLogin).toMatchObject({ user: { email: ownerInput.email } });
        await expect(services.authService.login({
            email: ownerInput.email,
            password: ownerInput.password,
            recoveryCode: verified.recoveryCodes[0]
        })).rejects.toThrow(/recovery code/i);
    });
});
//# sourceMappingURL=auth.service.test.js.map