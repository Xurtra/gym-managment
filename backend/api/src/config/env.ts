import { loadEnvironmentFiles, type RuntimeEnv } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";

export interface ApiConfig {
  nodeEnv: RuntimeEnv;
  persistenceDriver: "memory" | "postgres";
  apiInstanceId?: string;
  host: string;
  port: number;
  accessTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  passwordResetTokenTtlMinutes: number;
  emailVerificationTokenTtlHours: number;
  databaseUrl?: string;
  redisUrl?: string;
  mediaBaseUrl?: string;
  r2Bucket?: string;
  r2Endpoint?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
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
    apiInstanceId: process.env.API_INSTANCE_ID ?? randomUUID(),
    host: process.env.API_HOST ?? "0.0.0.0",
    port: numberFromEnv("API_PORT", 4000),
    accessTokenSecret,
    accessTokenTtlSeconds: numberFromEnv("ACCESS_TOKEN_TTL_SECONDS", 15 * 60),
    refreshTokenTtlDays: numberFromEnv("REFRESH_TOKEN_TTL_DAYS", 30),
    passwordResetTokenTtlMinutes: numberFromEnv("PASSWORD_RESET_TOKEN_TTL_MINUTES", 30),
    emailVerificationTokenTtlHours: numberFromEnv("EMAIL_VERIFICATION_TOKEN_TTL_HOURS", 24)
  };
  if (process.env.DATABASE_URL) {
    config.databaseUrl = process.env.DATABASE_URL;
  }
  if (process.env.REDIS_URL) {
    config.redisUrl = process.env.REDIS_URL;
  }
  if (process.env.MEDIA_BASE_URL) {
    config.mediaBaseUrl = process.env.MEDIA_BASE_URL;
  }
  if (process.env.R2_BUCKET) {
    config.r2Bucket = process.env.R2_BUCKET;
  }
  if (process.env.R2_ENDPOINT) {
    config.r2Endpoint = process.env.R2_ENDPOINT;
  }
  if (process.env.R2_ACCESS_KEY_ID) {
    config.r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
  }
  if (process.env.R2_SECRET_ACCESS_KEY) {
    config.r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  }
  if (process.env.STRIPE_PUBLISHABLE_KEY) {
    config.stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  }
  if (process.env.STRIPE_SECRET_KEY) {
    config.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  }
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    config.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }
  return config;
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
