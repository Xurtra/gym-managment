import { Pool } from "pg";
import { loadConfig } from "../config/env.js";
import { runMigrations } from "./migrationRunner.js";

const config = loadConfig();
if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false }
});
try {
  await runMigrations(pool);
  console.log("Migrations applied.");
} finally {
  await pool.end();
}
