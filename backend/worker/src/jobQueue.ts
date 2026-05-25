import PgBoss from "pg-boss";

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

export interface WorkOptions {
  pollingIntervalSeconds?: number;
}

export type JobHandler = (job: Job) => Promise<void> | void;

export interface JobQueue {
  start(): Promise<void>;
  stop(): Promise<void>;
  enqueue(input: EnqueueJobInput): Promise<Job>;
  work(type: string, handler: JobHandler, options?: WorkOptions): Promise<void>;
}

export interface PgBossJobQueueOptions {
  databaseUrl: string;
  schema?: string;
  logger?: Pick<Console, "error">;
}

type PgBossClient = InstanceType<typeof PgBoss>;
type PgBossJobWithMetadata = PgBoss.JobWithMetadata<Record<string, unknown>>;

export class PgBossJobQueue implements JobQueue {
  private readonly boss: PgBossClient;
  private readonly logger: Pick<Console, "error">;
  private readonly registeredQueues = new Set<string>();
  private started = false;

  constructor(options: PgBossJobQueueOptions) {
    this.boss = new PgBoss({
      connectionString: options.databaseUrl,
      ...(options.schema ? { schema: options.schema } : {})
    });
    this.logger = options.logger ?? console;
  }

  async start() {
    if (this.started) {
      return;
    }
    this.boss.on("error", (error) => this.logger.error(error));
    await this.boss.start();
    this.started = true;
  }

  async stop() {
    if (!this.started) {
      return;
    }
    await this.boss.stop({ graceful: true, wait: true });
    this.started = false;
  }

  async enqueue(input: EnqueueJobInput) {
    await this.ensureQueue(input.type, input.maxAttempts);
    const now = new Date();
    const id = await this.boss.send(input.type, input.payload ?? {}, {
      retryLimit: input.maxAttempts ?? 3,
      ...(input.runAt ? { startAfter: input.runAt } : {})
    });
    if (!id) {
      throw new Error(`Job ${input.type} was not enqueued.`);
    }
    return {
      id,
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

  async work(type: string, handler: JobHandler, options: WorkOptions = {}) {
    await this.ensureQueue(type);
    const workOptions: PgBoss.WorkOptions & { includeMetadata: true } = { includeMetadata: true };
    if (options.pollingIntervalSeconds !== undefined) {
      workOptions.pollingIntervalSeconds = options.pollingIntervalSeconds;
    }
    await this.boss.work<Record<string, unknown>>(
      type,
      workOptions,
      async ([job]) => {
        if (!job) {
          return;
        }
        await handler(mapPgBossJob(job));
      }
    );
  }

  private async ensureQueue(type: string, maxAttempts = 3) {
    if (this.registeredQueues.has(type)) {
      return;
    }
    await this.boss.createQueue(type, { retryLimit: maxAttempts } as PgBoss.Queue);
    this.registeredQueues.add(type);
  }
}

function mapPgBossJob(job: PgBossJobWithMetadata): Job {
  const now = new Date();
  return {
    id: job.id,
    type: job.name,
    payload: isRecord(job.data) ? job.data : {},
    attempts: job.retryCount + 1,
    maxAttempts: job.retryLimit,
    status: JobStatus.Processing,
    createdAt: job.createdOn,
    updatedAt: now,
    runAt: job.startAfter
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
