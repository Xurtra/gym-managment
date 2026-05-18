import type { InMemoryJobQueue, Job } from "./jobQueue.js";

export type JobHandler = (job: Job) => Promise<void> | void;

export interface WorkerRuntimeOptions {
  pollIntervalMs: number;
  logger?: Pick<Console, "error" | "log">;
}

export class WorkerRuntime {
  private timer: NodeJS.Timeout | undefined;
  private readonly logger: Pick<Console, "error" | "log">;

  constructor(
    private readonly queue: InMemoryJobQueue,
    private readonly handlers: Map<string, JobHandler>,
    private readonly options: WorkerRuntimeOptions
  ) {
    this.logger = options.logger ?? console;
  }

  start() {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      this.tick().catch((error: unknown) => {
        this.logger.error(error);
      });
    }, this.options.pollIntervalMs);
    this.logger.log("Worker runtime started.");
  }

  stop() {
    if (!this.timer) {
      return;
    }
    clearInterval(this.timer);
    this.timer = undefined;
    this.logger.log("Worker runtime stopped.");
  }

  async tick() {
    const job = this.queue.next();
    if (!job) {
      return { processed: 0 };
    }
    const handler = this.handlers.get(job.type);
    const processingJob = this.queue.markProcessing(job);
    if (!handler) {
      this.queue.fail(processingJob, new Error(`No handler registered for ${job.type}.`));
      return { processed: 1 };
    }
    try {
      await handler(processingJob);
      this.queue.complete(processingJob);
    } catch (error) {
      this.queue.fail(processingJob, error instanceof Error ? error : new Error("Job failed."));
    }
    return { processed: 1 };
  }
}
