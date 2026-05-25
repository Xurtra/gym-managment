import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  buildForgotPasswordScreen,
  buildLoginScreen,
  buildRecoveryCodesScreen,
  buildRecoveryLoginScreen,
  buildRegistrationScreen,
  buildResetPasswordScreen,
  buildTwoFactorSetupScreen,
  buildTwoFactorVerifyScreen,
  type AuthScreenModel
} from "@gym-platform/dashboard";
import { Button, InputField } from "@gym-platform/ui-react";
import { GymApiClient } from "@gym-platform/api-client";
import {
  API_BASE_URL,
  clearSessionTokens,
  forgotPassword,
  loadSession,
  loginUser,
  regenerateRecoveryCodes,
  registerUser,
  resendVerification,
  resetPassword,
  setupTwoFactor,
  storeSession,
  verifyEmail,
  verifyTwoFactor
} from "./dashboardData.js";

type AuthMode =
  | "login"
  | "register"
  | "forgot"
  | "reset"
  | "verify-email"
  | "two-factor-setup"
  | "two-factor-verify"
  | "recovery-login"
  | "recovery-codes";

const TWO_FACTOR_CHALLENGE_KEY = "gym-platform-2fa-challenge";

interface AuthState {
  message?: string;
  error?: string;
  pending: boolean;
}

export function AuthDomainRoute({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({ pending: false });
  const [twoFactorEmail, setTwoFactorEmail] = useState<string>(() => loadTwoFactorChallenge().email);
  const [twoFactorPassword, setTwoFactorPassword] = useState<string>(() => loadTwoFactorChallenge().password);
  const [gymName, setGymName] = useState<string>("Gym Platform");
  const [setupSecret, setSetupSecret] = useState<string | undefined>();
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const session = loadSession();
  const isAuthEntry = mode === "login" || mode === "register" || mode === "forgot" || mode === "reset";

  useEffect(() => {
    const gymSlug = new URLSearchParams(window.location.search).get("gymSlug")?.trim();
    if (!gymSlug) {
      return;
    }
    const client = new GymApiClient({ baseUrl: API_BASE_URL });
    client
      .publicGym(gymSlug)
      .then((response) => {
        const record = response as { gym?: { name?: string }; name?: string };
        setGymName(record.gym?.name ?? record.name ?? "Gym Platform");
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (mode !== "two-factor-setup") {
      return;
    }
    setState({ pending: true });
    setupTwoFactor()
      .then((result) => {
        setSetupSecret(result.secret);
        setState({ pending: false });
      })
      .catch((error) => {
        setState({ pending: false, error: describeError(error) });
      });
  }, [mode]);

  if (session && isAuthEntry) {
    return <Navigate to="/dashboard/home" replace />;
  }

  const model = useMemo(() => {
    switch (mode) {
      case "register":
        return buildRegistrationScreen();
      case "forgot":
        return buildForgotPasswordScreen();
      case "reset":
        return buildResetPasswordScreen();
      case "verify-email":
        return buildRecoveryLoginScreen();
      case "two-factor-setup":
        return buildTwoFactorSetupScreen(setupSecret);
      case "two-factor-verify":
        return buildTwoFactorVerifyScreen();
      case "recovery-login":
        return buildRecoveryLoginScreen();
      case "recovery-codes":
        return buildRecoveryCodesScreen(recoveryCodes);
      case "login":
      default:
        return buildLoginScreen();
    }
  }, [mode, recoveryCodes, setupSecret]);

  return (
    <section className="react-auth-shell">
      <div className="data-card react-auth-card">
        <header className="card-head">
          <div>
            <p className="eyebrow">Staff Dashboard</p>
            <h2>{mode === "login" ? `Log in to ${gymName}` : model.title}</h2>
          </div>
        </header>

        {state.error ? <div className="banner error">{state.error}</div> : null}
        {state.message ? <div className="banner success">{state.message}</div> : null}

        <AuthForm
          mode={mode}
          model={model}
          pending={state.pending}
          onSubmit={async (formData) => {
            setState({ pending: true });
            try {
              if (mode === "register") {
                const response = await registerUser({
                  email: String(formData.get("email") ?? ""),
                  password: String(formData.get("password") ?? ""),
                  firstName: String(formData.get("firstName") ?? ""),
                  lastName: String(formData.get("lastName") ?? ""),
                  gymName: optional(formData.get("gymName")),
                  timezone: "America/New_York",
                  locale: "en-US"
                });
                if (!response.accessToken || !response.refreshToken) {
                  throw new Error("Registration did not return a session.");
                }
                storeSession({ accessToken: response.accessToken, refreshToken: response.refreshToken });
                navigate("/dashboard/home", { replace: true });
                return;
              }

              if (mode === "forgot") {
                await forgotPassword(String(formData.get("email") ?? ""));
                setState({ pending: false, message: "Reset instructions have been sent." });
                return;
              }

              if (mode === "reset") {
                await resetPassword(
                  String(formData.get("token") ?? ""),
                  String(formData.get("password") ?? "")
                );
                setState({ pending: false, message: "Password updated. Log in with your new password." });
                return;
              }

              if (mode === "verify-email") {
                await verifyEmail(String(formData.get("token") ?? ""));
                setState({ pending: false, message: "Email verified." });
                return;
              }

              if (mode === "two-factor-setup") {
                const response = await verifyTwoFactor(String(formData.get("code") ?? ""));
                setRecoveryCodes(response.recoveryCodes ?? []);
                navigate("/dashboard/recovery-codes", { replace: true });
                return;
              }

              if (mode === "two-factor-verify") {
                if (!twoFactorEmail || !twoFactorPassword) {
                  throw new Error("Two-factor session expired. Log in again.");
                }
                const response = await loginUser({
                  email: twoFactorEmail,
                  password: twoFactorPassword,
                  twoFactorCode: optional(formData.get("twoFactorCode"))
                });
                if (!response.accessToken || !response.refreshToken) {
                  throw new Error("Two-factor login did not return a session.");
                }
                clearTwoFactorChallenge();
                storeSession({ accessToken: response.accessToken, refreshToken: response.refreshToken });
                navigate("/dashboard/home", { replace: true });
                return;
              }

              if (mode === "recovery-login") {
                const response = await loginUser({
                  email: String(formData.get("email") ?? ""),
                  password: String(formData.get("password") ?? ""),
                  recoveryCode: optional(formData.get("recoveryCode"))
                });
                if (!response.accessToken || !response.refreshToken) {
                  throw new Error("Recovery login did not return a session.");
                }
                storeSession({ accessToken: response.accessToken, refreshToken: response.refreshToken });
                navigate("/dashboard/home", { replace: true });
                return;
              }

              if (mode === "recovery-codes") {
                const response = await regenerateRecoveryCodes();
                setRecoveryCodes(response.recoveryCodes ?? []);
                setState({ pending: false, message: "Recovery codes regenerated." });
                return;
              }

              const email = String(formData.get("email") ?? "");
              const password = String(formData.get("password") ?? "");
              const response = await loginUser({ email, password });
              if (response.twoFactorRequired) {
                setTwoFactorEmail(email);
                setTwoFactorPassword(password);
                saveTwoFactorChallenge(email, password);
                setState({ pending: false, message: "Enter your two-factor code." });
                navigate("/dashboard/2fa/verify", { replace: true });
                return;
              }
              clearTwoFactorChallenge();
              if (!response.accessToken || !response.refreshToken) {
                throw new Error("Login did not return a session.");
              }
              storeSession({ accessToken: response.accessToken, refreshToken: response.refreshToken });
              navigate("/dashboard/home", { replace: true });
            } catch (error) {
              setState({ pending: false, error: describeError(error) });
            }
          }}
        />

        <footer className="react-auth-links">
          <Link to="/dashboard/login">Log in</Link>
          <Link to="/dashboard/register">Register</Link>
          <Link to="/dashboard/forgot-password">Forgot password</Link>
          <Link to="/dashboard/verify-email">Verify email</Link>
          <Link to="/dashboard/recovery-login">Use recovery code</Link>
          <button
            className="ghost-button"
            type="button"
            onClick={async () => {
              const email = prompt("Email for verification resend:")?.trim();
              if (!email) {
                return;
              }
              try {
                await resendVerification(email);
                setState({ pending: false, message: "Verification email resent." });
              } catch (error) {
                setState({ pending: false, error: describeError(error) });
              }
            }}
          >
            Resend verification email
          </button>
          {session ? (
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                clearSessionTokens();
                navigate("/dashboard/login", { replace: true });
              }}
            >
              Log out
            </button>
          ) : null}
        </footer>
      </div>
    </section>
  );
}

function AuthForm({
  mode,
  model,
  pending,
  onSubmit
}: {
  mode: AuthMode;
  model: AuthScreenModel;
  pending: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const formId = mode === "login" ? "login-form" : `auth-${mode}-form`;

  return (
    <form
      id={formId}
      className="form-card compact-form"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new FormData(event.currentTarget));
      }}
    >
      {model.fields.map((field) => (
        <InputField key={field.name} model={field} disabled={pending} />
      ))}
      <Button model={{ ...model.submit, disabled: pending || model.submit.disabled }} type="submit" />
    </form>
  );
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function saveTwoFactorChallenge(email: string, password: string) {
  sessionStorage.setItem(TWO_FACTOR_CHALLENGE_KEY, JSON.stringify({ email, password }));
}

function loadTwoFactorChallenge() {
  try {
    const raw = sessionStorage.getItem(TWO_FACTOR_CHALLENGE_KEY);
    if (!raw) {
      return { email: "", password: "" };
    }
    const parsed = JSON.parse(raw) as { email?: string; password?: string };
    return {
      email: parsed.email ?? "",
      password: parsed.password ?? ""
    };
  } catch {
    return { email: "", password: "" };
  }
}

function clearTwoFactorChallenge() {
  sessionStorage.removeItem(TWO_FACTOR_CHALLENGE_KEY);
}
