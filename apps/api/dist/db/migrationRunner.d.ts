import type { Pool } from "pg";
export interface MigrationRunnerOptions {
    migrationsDir?: string;
    logger?: Pick<Console, "log">;
}
export declare function runMigrations(pool: Pool, options?: MigrationRunnerOptions): Promise<{
    applied: string[];
    skipped: string[];
}>;
//# sourceMappingURL=migrationRunner.d.ts.map