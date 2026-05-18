import { button, card, input, type CardModel, type InputModel } from "@gym-platform/ui";

export type AuthScreenName =
  | "login"
  | "register"
  | "forgot_password"
  | "reset_password"
  | "two_factor_setup"
  | "two_factor_verify"
  | "recovery_codes"
  | "recovery_login";

export interface AuthScreenModel {
  screen: AuthScreenName;
  title: string;
  fields: InputModel[];
  submit: ReturnType<typeof button>;
  secondaryAction?: ReturnType<typeof button>;
  card: CardModel;
}

export function buildLoginScreen(values: { email?: string } = {}): AuthScreenModel {
  return authScreen("login", "Login", [
    authInput("email", "Email", values.email ?? "", "email"),
    authInput("password", "Password", "", "password")
  ]);
}

export function buildRegistrationScreen(values: { email?: string; firstName?: string; lastName?: string } = {}): AuthScreenModel {
  return authScreen("register", "Create Account", [
    authInput("firstName", "First name", values.firstName ?? ""),
    authInput("lastName", "Last name", values.lastName ?? ""),
    authInput("email", "Email", values.email ?? "", "email"),
    authInput("password", "Password", "", "password")
  ]);
}

export function buildForgotPasswordScreen(values: { email?: string } = {}): AuthScreenModel {
  return authScreen("forgot_password", "Forgot Password", [
    authInput("email", "Email", values.email ?? "", "email")
  ]);
}

export function buildResetPasswordScreen(): AuthScreenModel {
  return authScreen("reset_password", "Reset Password", [
    authInput("token", "Reset token", ""),
    authInput("password", "New password", "", "password")
  ]);
}

export function buildTwoFactorSetupScreen(secret?: string): AuthScreenModel {
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

export function buildTwoFactorVerifyScreen(): AuthScreenModel {
  return authScreen("two_factor_verify", "Verify Two-Factor Code", [
    authInput("twoFactorCode", "Two-factor code", "")
  ]);
}

export function buildRecoveryCodesScreen(codes: string[]): AuthScreenModel & { codes: string[] } {
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

export function buildRecoveryLoginScreen(): AuthScreenModel {
  return authScreen("recovery_login", "Use Recovery Code", [
    authInput("email", "Email", "", "email"),
    authInput("password", "Password", "", "password"),
    authInput("recoveryCode", "Recovery code", "")
  ]);
}

function authScreen(screen: AuthScreenName, title: string, fields: InputModel[]): AuthScreenModel {
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

function authInput(
  name: string,
  label: string,
  value: string,
  type: InputModel["type"] = "text"
): InputModel {
  return input({ name, label, value, type, required: true });
}
