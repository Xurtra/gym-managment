export interface WorkerConfig {
  nodeEnv: "development" | "test" | "production";
  workerName: string;
  pollIntervalMs: number;
  redisUrl?: string;
  enqueueBootJob: boolean;
}

export function loadWorkerConfig(): WorkerConfig {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as WorkerConfig["nodeEnv"];
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production.");
  }
  const config: WorkerConfig = {
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

function positiveNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Numeric worker settings must be positive numbers.");
  }
  return parsed;
}
