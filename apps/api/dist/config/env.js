import { loadEnvironmentFiles } from "@gym-platform/constants";
function numberFromEnv(name, fallback) {
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
export function loadConfig() {
    const nodeEnv = loadEnvironmentFiles();
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET ?? "local-dev-secret-change-me";
    if (nodeEnv === "production" && accessTokenSecret === "local-dev-secret-change-me") {
        throw new Error("ACCESS_TOKEN_SECRET must be set in production.");
    }
    const config = {
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
function parseBoolean(value, fallback) {
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
function parsePersistenceDriver(value) {
    if (!value) {
        return "memory";
    }
    if (value === "memory" || value === "postgres") {
        return value;
    }
    throw new Error("PERSISTENCE_DRIVER must be memory or postgres.");
}
//# sourceMappingURL=env.js.map