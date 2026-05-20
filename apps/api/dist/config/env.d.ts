import { type RuntimeEnv } from "@gym-platform/constants";
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
export declare function loadConfig(): ApiConfig;
//# sourceMappingURL=env.d.ts.map