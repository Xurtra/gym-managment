import { randomUUID } from "node:crypto";

export const JobStatus = {
  Queued: "queued",
  Processing: "processing",
  Completed: "completed",
  Failed: "failed"
} as const;

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

export class InMemoryJobQueue {
  private readonly jobs = new Map<string, Job>();

  enqueue(input: EnqueueJobInput) {
    const now = new Date();
    const job: Job = {
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

  markProcessing(job: Job) {
    return this.update(job.id, {
      status: JobStatus.Processing,
      attempts: job.attempts + 1
    });
  }

  complete(job: Job) {
    return this.update(job.id, {
      status: JobStatus.Completed
    });
  }

  fail(job: Job, error: Error) {
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

  get(jobId: string) {
    return this.jobs.get(jobId);
  }

  private update(jobId: string, updates: Partial<Job>) {
    const existing = this.jobs.get(jobId);
    if (!existing) {
      throw new Error(`Job ${jobId} was not found.`);
    }
    const updated: Job = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.jobs.set(jobId, updated);
    return updated;
  }
}
