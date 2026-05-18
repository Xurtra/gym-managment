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
export declare function loadConfig(): ApiConfig;
//# sourceMappingURL=env.d.ts.map