import { loadEnvironmentFiles } from "@gym-platform/constants";
export function loadWorkerConfig() {
    const nodeEnv = loadEnvironmentFiles();
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