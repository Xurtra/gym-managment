import { loadWorkerConfig } from "./config.js";
import { InMemoryJobQueue } from "./jobQueue.js";
import { WorkerRuntime } from "./workerRuntime.js";
const config = loadWorkerConfig();
const queue = new InMemoryJobQueue();
const handlers = new Map();
handlers.set("health.check", () => {
    console.log("Worker health check completed.");
});
if (config.enqueueBootJob) {
    queue.enqueue({
        type: "health.check",
        payload: {
            workerName: config.workerName,
            redisConfigured: Boolean(config.redisUrl)
        }
    });
}
const runtime = new WorkerRuntime(queue, handlers, {
    pollIntervalMs: config.pollIntervalMs
});
runtime.start();
for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
        runtime.stop();
        process.exit(0);
    });
}
//# sourceMappingURL=index.js.map