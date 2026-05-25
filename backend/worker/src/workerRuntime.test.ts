import { describe, expect, it } from "vitest";
import { JobStatus, type EnqueueJobInput, type Job, type JobHandler, type JobQueue } from "./jobQueue.js";
import { WorkerRuntime } from "./workerRuntime.js";

describe("WorkerRuntime", () => {
  it("starts the queue and registers handlers with pg-boss polling", async () => {
    const queue = new FakeJobQueue();
    const runtime = new WorkerRuntime(
      queue,
      new Map([["demo.job", () => undefined]]),
      { pollIntervalMs: 1500, logger: silentLogger }
    );

    await runtime.start();

    expect(queue.started).toBe(true);
    expect(queue.handlers.has("demo.job")).toBe(true);
    expect(queue.workOptions.get("demo.job")).toEqual({ pollingIntervalSeconds: 2 });
  });

  it("dispatches queued jobs through registered handlers", async () => {
    const queue = new FakeJobQueue();
    const processed: string[] = [];
    const runtime = new WorkerRuntime(
      queue,
      new Map([
        [
          "demo.job",
          (queuedJob) => {
            processed.push(queuedJob.id);
          }
        ]
      ]),
      { pollIntervalMs: 1000, logger: silentLogger }
    );

    await runtime.start();
    const job = await queue.enqueue({ type: "demo.job", payload: { ok: true } });
    await queue.run(job);

    expect(processed).toEqual([job.id]);
  });

  it("stops the queue", async () => {
    const queue = new FakeJobQueue();
    const runtime = new WorkerRuntime(queue, new Map(), {
      pollIntervalMs: 1000,
      logger: silentLogger
    });

    await runtime.start();
    await runtime.stop();

    expect(queue.started).toBe(false);
  });
});

class FakeJobQueue implements JobQueue {
  readonly handlers = new Map<string, JobHandler>();
  readonly workOptions = new Map<string, { pollingIntervalSeconds?: number } | undefined>();
  started = false;

  async start() {
    this.started = true;
  }

  async stop() {
    this.started = false;
  }

  async enqueue(input: EnqueueJobInput) {
    const now = new Date();
    return {
      id: "job-1",
      type: input.type,
      payload: input.payload ?? {},
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 3,
      status: JobStatus.Queued,
      createdAt: now,
      updatedAt: now,
      runAt: input.runAt ?? now
    };
  }

  async work(type: string, handler: JobHandler, options?: { pollingIntervalSeconds?: number }) {
    this.handlers.set(type, handler);
    this.workOptions.set(type, options);
  }

  async run(job: Job) {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      throw new Error(`No handler registered for ${job.type}.`);
    }
    await handler({ ...job, status: JobStatus.Processing });
  }
}

const silentLogger = {
  log: () => undefined,
  error: () => undefined
};
