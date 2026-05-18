export const testConfig = {
    nodeEnv: "test",
    persistenceDriver: "memory",
    host: "127.0.0.1",
    port: 0,
    accessTokenSecret: "test-secret",
    accessTokenTtlSeconds: 900,
    refreshTokenTtlDays: 30,
    passwordResetTokenTtlMinutes: 30,
    emailVerificationTokenTtlHours: 24
};
export const fixedClock = {
    now: () => new Date("2026-05-16T12:00:00.000Z")
};
//# sourceMappingURL=testUtils.js.map