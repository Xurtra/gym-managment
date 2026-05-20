import { loadEnvironmentFiles, type RuntimeEnv } from "@gym-platform/constants";

export interface ApiConfig {
  nodeEnv: RuntimeEnv;
  persistenceDriver: "memory" | "postgres";
  host: string;
  port: number;
  accessTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  passwordResetTokenTtlMinutes: number;
  emailVerificationTokenTtlHours: number;
  databaseUrl?: string;
  redisUrl?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripeConnectClientId?: string;
  stripeMockMode: boolean;
}

function numberFromEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return value;
}

export function loadConfig(): ApiConfig {
  const nodeEnv = loadEnvironmentFiles();
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET ?? "local-dev-secret-change-me";
  if (nodeEnv === "production" && accessTokenSecret === "local-dev-secret-change-me") {
    throw new Error("ACCESS_TOKEN_SECRET must be set in production.");
  }
  const config: ApiConfig = {
    nodeEnv,
    persistenceDriver: parsePersistenceDriver(process.env.PERSISTENCE_DRIVER),
    host: process.env.API_HOST ?? "0.0.0.0",
    port: numberFromEnv("API_PORT", 4000),
    accessTokenSecret,
    accessTokenTtlSeconds: numberFromEnv("ACCESS_TOKEN_TTL_SECONDS", 15 * 60),
    refreshTokenTtlDays: numberFromEnv("REFRESH_TOKEN_TTL_DAYS", 30),
    passwordResetTokenTtlMinutes: numberFromEnv("PASSWORD_RESET_TOKEN_TTL_MINUTES", 30),
    emailVerificationTokenTtlHours: numberFromEnv("EMAIL_VERIFICATION_TOKEN_TTL_HOURS", 24),
    stripeMockMode: parseBoolean(process.env.STRIPE_MOCK_MODE, !process.env.STRIPE_SECRET_KEY)
  };
  if (process.env.DATABASE_URL) {
    config.databaseUrl = process.env.DATABASE_URL;
  }
  if (process.env.REDIS_URL) {
    config.redisUrl = process.env.REDIS_URL;
  }
  if (process.env.STRIPE_SECRET_KEY) {
    config.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  }
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    config.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }
  if (process.env.STRIPE_CONNECT_CLIENT_ID) {
    config.stripeConnectClientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  }
  return config;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }
  if (["1", "true", "yes", "on"].includes(value.toLowerCase())) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(value.toLowerCase())) {
    return false;
  }
  throw new Error("Boolean environment variables must be true or false.");
}

function parsePersistenceDriver(value: string | undefined): ApiConfig["persistenceDriver"] {
  if (!value) {
    return "memory";
  }
  if (value === "memory" || value === "postgres") {
    return value;
  }
  throw new Error("PERSISTENCE_DRIVER must be memory or postgres.");
}
