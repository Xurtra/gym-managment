import { randomUUID } from "node:crypto";
export const JobStatus = {
    Queued: "queued",
    Processing: "processing",
    Completed: "completed",
    Failed: "failed"
};
export class InMemoryJobQueue {
    jobs = new Map();
    enqueue(input) {
        const now = new Date();
        const job = {
            id: randomUUID(),
            type: input.type,
            payload: input.payload ?? {},
            attempts: 0,
            maxAttempts: input.maxAttempts ?? 3,
            status: JobStatus.Queued,
            createdAt: now,
            updatedAt: now,
            runAt: input.runAt ?? now
        };
        this.jobs.set(job.id, job);
        return job;
    }
    next(now = new Date()) {
        return [...this.jobs.values()]
            .filter((job) => job.status === JobStatus.Queued && job.runAt <= now)
            .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())[0];
    }
    markProcessing(job) {
        return this.update(job.id, {
            status: JobStatus.Processing,
            attempts: job.attempts + 1
        });
    }
    complete(job) {
        return this.update(job.id, {
            status: JobStatus.Completed
        });
    }
    fail(job, error) {
        const shouldRetry = job.attempts < job.maxAttempts;
        return this.update(job.id, {
            status: shouldRetry ? JobStatus.Queued : JobStatus.Failed,
            runAt: shouldRetry ? new Date(Date.now() + 1000 * job.attempts) : job.runAt,
            lastError: error.message
        });
    }
    list() {
        return [...this.jobs.values()];
    }
    get(jobId) {
        return this.jobs.get(jobId);
    }
    update(jobId, updates) {
        const existing = this.jobs.get(jobId);
        if (!existing) {
            throw new Error(`Job ${jobId} was not found.`);
        }
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date()
        };
        this.jobs.set(jobId, updated);
        return updated;
    }
}
//# sourceMappingURL=jobQueue.js.map