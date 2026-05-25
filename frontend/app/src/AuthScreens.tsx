import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@gym-platform/ui-react";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  twoFactorVerifySchema
} from "@gym-platform/validation";
import type { ZodSchema } from "zod";
import {
  clearSessionTokens,
  forgotPassword,
  loadPublicGymName,
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
import { queryKeys } from "./queryKeys.js";

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
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const session = loadSession();
  const isAuthEntry = mode === "login" || mode === "register" || mode === "forgot" || mode === "reset";
  const gymSlug = new URLSearchParams(window.location.search).get("gymSlug")?.trim();
  const publicGymQuery = useQuery({
    queryKey: gymSlug ? queryKeys.publicGym(gymSlug) : ["public-gym", "none"],
    queryFn: () => loadPublicGymName(gymSlug ?? ""),
    enabled: Boolean(gymSlug),
    retry: false
  });
  const twoFactorSetupQuery = useQuery({
    queryKey: ["two-factor-setup"],
    queryFn: setupTwoFactor,
    enabled: mode === "two-factor-setup",
    retry: false
  });
  const setupSecret = twoFactorSetupQuery.data?.secret;
  const authError = state.error ?? (twoFactorSetupQuery.isError ? describeError(twoFactorSetupQuery.error) : undefined);
  const pending = state.pending || twoFactorSetupQuery.isLoading;

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
            <h2>{mode === "login" ? `Log in to ${publicGymQuery.data ?? "Gym Platform"}` : model.title}</h2>
          </div>
        </header>

        {authError ? <div className="banner error">{authError}</div> : null}
        {state.message ? <div className="banner success">{state.message}</div> : null}

        <AuthForm
          key={mode}
          mode={mode}
          model={model}
          pending={pending}
          onSubmit={async (fields) => {
            setState({ pending: true });
            try {
              if (mode === "register") {
                const response = await registerUser({
                  email: String(fields.email ?? ""),
                  password: String(fields.password ?? ""),
                  firstName: String(fields.firstName ?? ""),
                  lastName: String(fields.lastName ?? ""),
                  gymName: strOrUndefined(fields.gymName),
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
                await forgotPassword(String(fields.email ?? ""));
                setState({ pending: false, message: "Reset instructions have been sent." });
                return;
              }

              if (mode === "reset") {
                await resetPassword(
                  String(fields.token ?? ""),
                  String(fields.password ?? "")
                );
                setState({ pending: false, message: "Password updated. Log in with your new password." });
                return;
              }

              if (mode === "verify-email") {
                await verifyEmail(String(fields.token ?? ""));
                setState({ pending: false, message: "Email verified." });
                return;
              }

              if (mode === "two-factor-setup") {
                const response = await verifyTwoFactor(String(fields.code ?? ""));
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
                  twoFactorCode: strOrUndefined(fields.twoFactorCode)
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
                  email: String(fields.email ?? ""),
                  password: String(fields.password ?? ""),
                  recoveryCode: strOrUndefined(fields.recoveryCode)
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

              const email = String(fields.email ?? "");
              const password = String(fields.password ?? "");
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

function schemaForMode(mode: AuthMode): ZodSchema | null {
  switch (mode) {
    case "login": return loginSchema;
    case "register": return registerSchema;
    case "forgot": return forgotPasswordSchema;
    case "reset": return resetPasswordSchema;
    case "two-factor-setup": return twoFactorVerifySchema;
    case "recovery-login": return loginSchema;
    default: return null;
  }
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
  onSubmit: (fields: Record<string, unknown>) => Promise<void>;
}) {
  const schema = schemaForMode(mode);
  const submitMutation = useMutation({
    mutationFn: onSubmit
  });
  const isPending = pending || submitMutation.isPending;
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: schema ? zodResolver(schema as never) : undefined
  });

  const formId = mode === "login" ? "login-form" : `auth-${mode}-form`;

  return (
    <form
      id={formId}
      className="form-card compact-form"
      onSubmit={handleSubmit((fields) => void submitMutation.mutateAsync(fields as Record<string, unknown>))}
    >
      {model.fields.map((field) => (
        <div key={field.name}>
          <label className="field">
            <span>{field.label}</span>
            <input
              {...register(field.name)}
              type={field.type}
              required={field.required}
              disabled={isPending}
              defaultValue={field.value}
            />
          </label>
          {errors[field.name] && (
            <small className="field-error">
              {String(errors[field.name]?.message ?? "")}
            </small>
          )}
        </div>
      ))}
      <Button model={{ ...model.submit, disabled: isPending || model.submit.disabled }} type="submit" />
    </form>
  );
}

function strOrUndefined(value: unknown): string | undefined {
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
