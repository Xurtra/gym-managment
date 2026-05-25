import { loadWorkerConfig } from "./config.js";
import { PgBossJobQueue } from "./jobQueue.js";
import { WorkerRuntime, type JobHandler } from "./workerRuntime.js";

const config = loadWorkerConfig();
const queue = new PgBossJobQueue({
  databaseUrl: config.databaseUrl,
  ...(config.pgBossSchema ? { schema: config.pgBossSchema } : {})
});
const handlers = new Map<string, JobHandler>();

handlers.set("health.check", (job) => {
  console.log("Worker health check completed.", job.payload);
});

const runtime = new WorkerRuntime(queue, handlers, {
  pollIntervalMs: config.pollIntervalMs
});

await runtime.start();

if (config.enqueueBootJob) {
  await queue.enqueue({
    type: "health.check",
    payload: {
      workerName: config.workerName
    }
  });
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void runtime.stop().finally(() => process.exit(0));
  });
}
