import { button, card, input } from "@gym-platform/ui";
export function buildLoginScreen(values = {}) {
    return authScreen("login", "Login", [
        authInput("email", "Email", values.email ?? "", "email"),
        authInput("password", "Password", "", "password")
    ]);
}
export function buildRegistrationScreen(values = {}) {
    return authScreen("register", "Create Account", [
        authInput("firstName", "First name", values.firstName ?? ""),
        authInput("lastName", "Last name", values.lastName ?? ""),
        authInput("email", "Email", values.email ?? "", "email"),
        authInput("gymName", "Gym name", values.gymName ?? ""),
        authInput("password", "Password", "", "password")
    ]);
}
export function buildForgotPasswordScreen(values = {}) {
    return authScreen("forgot_password", "Forgot Password", [
        authInput("email", "Email", values.email ?? "", "email")
    ]);
}
export function buildResetPasswordScreen() {
    return authScreen("reset_password", "Reset Password", [
        authInput("token", "Reset token", ""),
        authInput("password", "New password", "", "password")
    ]);
}
export function buildTwoFactorSetupScreen(secret) {
    return {
        ...authScreen("two_factor_setup", "Set Up Two-Factor Authentication", [
            authInput("code", "Authenticator code", "", "text")
        ]),
        card: card({
            title: "Set Up Two-Factor Authentication",
            body: secret ? `Secret: ${secret}` : "Generate a secret and scan it in an authenticator app.",
            actions: [button({ label: "Verify code", intent: "primary" })]
        })
    };
}
export function buildTwoFactorVerifyScreen() {
    return authScreen("two_factor_verify", "Verify Two-Factor Code", [
        authInput("twoFactorCode", "Two-factor code", "")
    ]);
}
export function buildRecoveryCodesScreen(codes) {
    return {
        ...authScreen("recovery_codes", "Recovery Codes", []),
        codes,
        card: card({
            title: "Recovery Codes",
            body: codes.join("\n"),
            actions: [button({ label: "I saved these codes", intent: "primary" })]
        })
    };
}
export function buildRecoveryLoginScreen() {
    return authScreen("recovery_login", "Use Recovery Code", [
        authInput("email", "Email", "", "email"),
        authInput("password", "Password", "", "password"),
        authInput("recoveryCode", "Recovery code", "")
    ]);
}
function authScreen(screen, title, fields) {
    const submit = button({ label: title, intent: "primary" });
    return {
        screen,
        title,
        fields,
        submit,
        secondaryAction: button({ label: "Back to login", intent: "secondary" }),
        card: card({ title, actions: [submit] })
    };
}
function authInput(name, label, value, type = "text") {
    return input({ name, label, value, type, required: true });
}
//# sourceMappingURL=screens.js.map