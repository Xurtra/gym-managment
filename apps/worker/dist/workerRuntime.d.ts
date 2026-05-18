import type { InMemoryJobQueue, Job } from "./jobQueue.js";
export type JobHandler = (job: Job) => Promise<void> | void;
export interface WorkerRuntimeOptions {
    pollIntervalMs: number;
    logger?: Pick<Console, "error" | "log">;
}
export declare class WorkerRuntime {
    private readonly queue;
    private readonly handlers;
    private readonly options;
    private timer;
    private readonly logger;
    constructor(queue: InMemoryJobQueue, handlers: Map<string, JobHandler>, options: WorkerRuntimeOptions);
    start(): void;
    stop(): void;
    tick(): Promise<{
        processed: number;
    }>;
}
//# sourceMappingURL=workerRuntime.d.ts.map