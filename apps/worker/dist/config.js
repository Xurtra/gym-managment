export function loadWorkerConfig() {
    const nodeEnv = (process.env.NODE_ENV ?? "development");
    if (!["development", "test", "production"].includes(nodeEnv)) {
        throw new Error("NODE_ENV must be development, test, or production.");
    }
    const config = {
        nodeEnv,
        workerName: process.env.WORKER_NAME ?? "gym-platform-worker",
        pollIntervalMs: positiveNumber(process.env.WORKER_POLL_INTERVAL_MS, 1000),
        enqueueBootJob: process.env.WORKER_ENQUEUE_BOOT_JOB !== "false"
    };
    if (process.env.REDIS_URL) {
        config.redisUrl = process.env.REDIS_URL;
    }
    return config;
}
function positiveNumber(value, fallback) {
    if (!value) {
        return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("Numeric worker settings must be positive numbers.");
    }
    return parsed;
}
//# sourceMappingURL=config.js.map