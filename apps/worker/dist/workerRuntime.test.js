import { describe, expect, it } from "vitest";
import { InMemoryJobQueue, JobStatus } from "./jobQueue.js";
import { WorkerRuntime } from "./workerRuntime.js";
describe("WorkerRuntime", () => {
    it("processes queued jobs with registered handlers", async () => {
        const queue = new InMemoryJobQueue();
        const processed = [];
        const job = queue.enqueue({ type: "demo.job", payload: { ok: true } });
        const runtime = new WorkerRuntime(queue, new Map([
            [
                "demo.job",
                (queuedJob) => {
                    processed.push(queuedJob.id);
                }
            ]
        ]), { pollIntervalMs: 10, logger: silentLogger });
        const result = await runtime.tick();
        expect(result.processed).toBe(1);
        expect(processed).toEqual([job.id]);
        expect(queue.get(job.id)?.status).toBe(JobStatus.Completed);
    });
    it("marks jobs failed after max attempts when the handler is missing", async () => {
        const queue = new InMemoryJobQueue();
        const job = queue.enqueue({ type: "missing.job", maxAttempts: 1 });
        const runtime = new WorkerRuntime(queue, new Map(), {
            pollIntervalMs: 10,
            logger: silentLogger
        });
        await runtime.tick();
        expect(queue.get(job.id)?.status).toBe(JobStatus.Failed);
        expect(queue.get(job.id)?.lastError).toMatch(/No handler registered/);
    });
});
const silentLogger = {
    log: () => undefined,
    error: () => undefined
};
//# sourceMappingURL=workerRuntime.test.js.map