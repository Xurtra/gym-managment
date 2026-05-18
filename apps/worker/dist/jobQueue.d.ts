export declare const JobStatus: {
    readonly Queued: "queued";
    readonly Processing: "processing";
    readonly Completed: "completed";
    readonly Failed: "failed";
};
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];
export interface Job {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    attempts: number;
    maxAttempts: number;
    status: JobStatus;
    createdAt: Date;
    updatedAt: Date;
    runAt: Date;
    lastError?: string;
}
export interface EnqueueJobInput {
    type: string;
    payload?: Record<string, unknown>;
    maxAttempts?: number;
    runAt?: Date;
}
export declare class InMemoryJobQueue {
    private readonly jobs;
    enqueue(input: EnqueueJobInput): Job;
    next(now?: Date): Job | undefined;
    markProcessing(job: Job): Job;
    complete(job: Job): Job;
    fail(job: Job, error: Error): Job;
    list(): Job[];
    get(jobId: string): Job | undefined;
    private update;
}
//# sourceMappingURL=jobQueue.d.ts.map