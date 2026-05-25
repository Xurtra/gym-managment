import { createServer } from "node:http";
import { Pool } from "pg";
import { createApp, createPostgresServices } from "./app.js";
import { loadConfig } from "./config/env.js";
import { runMigrations } from "./db/migrationRunner.js";
import logger from "./logger.js";

const config = loadConfig();

const services = config.persistenceDriver === "postgres"
  ? await createMigratedPostgresServices(config)
  : undefined;

const server = createServer(createApp(config, services));

server.listen(config.port, config.host, () => {
  logger.info(`Gym Platform API listening on http://${config.host}:${config.port}`);
});

async function createMigratedPostgresServices(config: ReturnType<typeof loadConfig>) {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required for Postgres-backed services.");
  }

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  await runMigrations(pool);
  return createPostgresServices(config, undefined, pool);
}
