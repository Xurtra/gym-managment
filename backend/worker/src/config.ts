import { loadEnvironmentFiles, type RuntimeEnv } from "@gym-platform/constants";

export interface WorkerConfig {
  nodeEnv: RuntimeEnv;
  workerName: string;
  databaseUrl: string;
  pgBossSchema?: string;
  pollIntervalMs: number;
  enqueueBootJob: boolean;
}

export function loadWorkerConfig(): WorkerConfig {
  const nodeEnv = loadEnvironmentFiles();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the worker queue.");
  }
  const config: WorkerConfig = {
    nodeEnv,
    workerName: process.env.WORKER_NAME ?? "gym-platform-worker",
    databaseUrl: process.env.DATABASE_URL,
    pollIntervalMs: positiveNumber(process.env.WORKER_POLL_INTERVAL_MS, 1000),
    enqueueBootJob: process.env.WORKER_ENQUEUE_BOOT_JOB !== "false"
  };
  if (process.env.PGBOSS_SCHEMA) {
    config.pgBossSchema = process.env.PGBOSS_SCHEMA;
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
