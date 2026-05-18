export class WorkerRuntime {
    queue;
    handlers;
    options;
    timer;
    logger;
    constructor(queue, handlers, options) {
        this.queue = queue;
        this.handlers = handlers;
        this.options = options;
        this.logger = options.logger ?? console;
    }
    start() {
        if (this.timer) {
            return;
        }
        this.timer = setInterval(() => {
            this.tick().catch((error) => {
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
        }
        catch (error) {
            this.queue.fail(processingJob, error instanceof Error ? error : new Error("Job failed."));
        }
        return { processed: 1 };
    }
}
//# sourceMappingURL=workerRuntime.js.map