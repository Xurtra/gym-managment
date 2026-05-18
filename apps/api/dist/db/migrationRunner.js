import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
export async function runMigrations(pool, options = {}) {
    const migrationsDir = options.migrationsDir ?? resolve(process.cwd(), "apps/api/src/db/migrations");
    const logger = options.logger ?? console;
    const files = readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();
    await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
    const appliedResult = await pool.query("SELECT filename FROM schema_migrations");
    const applied = new Set(appliedResult.rows.map((row) => row.filename));
    const appliedNow = [];
    const skipped = [];
    for (const file of files) {
        if (applied.has(file)) {
            skipped.push(file);
            logger.log(`Skipping migration ${file}`);
            continue;
        }
        const path = resolve(migrationsDir, file);
        const sql = readFileSync(path, "utf8");
        logger.log(`Applying migration ${file}`);
        await pool.query("BEGIN");
        try {
            await pool.query(sql);
            await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
            await pool.query("COMMIT");
            appliedNow.push(file);
        }
        catch (error) {
            await pool.query("ROLLBACK");
            throw error;
        }
    }
    return { applied: appliedNow, skipped };
}
//# sourceMappingURL=migrationRunner.js.map