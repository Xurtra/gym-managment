import type { Job, JobHandler, JobQueue } from "./jobQueue.js";

export type { JobHandler };

export interface WorkerRuntimeOptions {
  pollIntervalMs: number;
  logger?: Pick<Console, "error" | "log">;
}

export class WorkerRuntime {
  private started = false;
  private readonly logger: Pick<Console, "error" | "log">;

  constructor(
    private readonly queue: JobQueue,
    private readonly handlers: Map<string, JobHandler>,
    private readonly options: WorkerRuntimeOptions
  ) {
    this.logger = options.logger ?? console;
  }

  async start() {
    if (this.started) {
      return;
    }
    await this.queue.start();
    for (const [type, handler] of this.handlers) {
      await this.queue.work(type, handler, {
        pollingIntervalSeconds: Math.max(1, Math.ceil(this.options.pollIntervalMs / 1000))
      });
    }
    this.started = true;
    this.logger.log("Worker runtime started.");
  }

  async stop() {
    if (!this.started) {
      return;
    }
    await this.queue.stop();
    this.started = false;
    this.logger.log("Worker runtime stopped.");
  }
}

export function missingJobHandler(type: string): (job: Job) => Promise<void> {
  return async () => {
    throw new Error(`No handler registered for ${type}.`);
  };
}
