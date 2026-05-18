import { type RuntimeEnv } from "@gym-platform/constants";
export interface WorkerConfig {
    nodeEnv: RuntimeEnv;
    workerName: string;
    pollIntervalMs: number;
    redisUrl?: string;
    enqueueBootJob: boolean;
}
export declare function loadWorkerConfig(): WorkerConfig;
//# sourceMappingURL=config.d.ts.map