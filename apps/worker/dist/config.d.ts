export interface WorkerConfig {
    nodeEnv: "development" | "test" | "production";
    workerName: string;
    pollIntervalMs: number;
    redisUrl?: string;
    enqueueBootJob: boolean;
}
export declare function loadWorkerConfig(): WorkerConfig;
//# sourceMappingURL=config.d.ts.map