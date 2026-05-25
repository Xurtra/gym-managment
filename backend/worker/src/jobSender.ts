import { PgBossJobQueue, type EnqueueJobInput, type Job } from "./jobQueue.js";

export class PgBossJobSender {
  private readonly queue: PgBossJobQueue;
  private started = false;

  constructor(options: { databaseUrl: string; schema?: string }) {
    this.queue = new PgBossJobQueue(options);
  }

  async start() {
    if (this.started) {
      return;
    }
    await this.queue.start();
    this.started = true;
  }

  async stop() {
    if (!this.started) {
      return;
    }
    await this.queue.stop();
    this.started = false;
  }

  async enqueue(input: EnqueueJobInput): Promise<Job> {
    await this.start();
    return this.queue.enqueue(input);
  }
}
