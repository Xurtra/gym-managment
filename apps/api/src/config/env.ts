import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface ApiConfig {
  nodeEnv: "development" | "test" | "production";
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
}

function loadDotEnv(cwd = process.cwd()) {
  const path = resolve(cwd, ".env");
  if (!existsSync(path)) {
    return;
  }
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
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
  loadDotEnv();
  const nodeEnv = (process.env.NODE_ENV ?? "development") as ApiConfig["nodeEnv"];
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production.");
  }
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
    emailVerificationTokenTtlHours: numberFromEnv("EMAIL_VERIFICATION_TOKEN_TTL_HOURS", 24)
  };
  if (process.env.DATABASE_URL) {
    config.databaseUrl = process.env.DATABASE_URL;
  }
  if (process.env.REDIS_URL) {
    config.redisUrl = process.env.REDIS_URL;
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
