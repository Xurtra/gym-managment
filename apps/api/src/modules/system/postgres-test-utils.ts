import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Pool } from "pg";
import { describe } from "vitest";
import { createApp, createPostgresServices } from "../../app.js";
import type { ApiConfig } from "../../config/env.js";
import { runMigrations } from "../../db/migrationRunner.js";
import { fixedClock, testConfig } from "../../testUtils.js";

export const describePostgres: (
  name: string,
  factory: () => void
) => ReturnType<typeof describe> = (name, factory) => {
  const runner = process.env.RUN_POSTGRES_TESTS === "1" ? describe : describe.skip;
  return (runner as (suiteName: string, suiteFactory: () => void) => ReturnType<typeof describe>)(
    name,
    factory
  );
};

export interface TestApi {
  baseUrl: string;
  pool: Pool;
  request<T>(path: string, options?: RequestInit): Promise<{ response: Response; data: T }>;
  close(): Promise<void>;
}

export async function startPostgresApi(): Promise<TestApi> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required when RUN_POSTGRES_TESTS=1.");
  }
  assertTestDatabase(databaseUrl);
  const pool = new Pool({ connectionString: databaseUrl });
  await runMigrations(pool, { logger: { log: () => undefined } });
  await resetDatabase(pool);

  const config: ApiConfig = {
    ...testConfig,
    persistenceDriver: "postgres",
    databaseUrl
  };
  const services = createPostgresServices(config, fixedClock, pool);
  const server = createServer(createApp(config, services));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    baseUrl,
    pool,
    request: async <T>(path: string, options: RequestInit = {}) => {
      const response = await fetch(`${baseUrl}${path}`, options);
      const data = (await response.json()) as T;
      return { response, data };
    },
    close: async () => {
      await closeServer(server);
      await services.close();
    }
  };
}

async function resetDatabase(pool: Pool) {
  await pool.query(`
    TRUNCATE TABLE
      purpose_tokens,
      refresh_tokens,
      access_events,
      access_rules,
      access_devices,
      check_ins,
      notification_events,
      class_bookings,
      class_sessions,
      class_types,
      member_memberships,
      membership_plans,
      members,
      locations,
      gym_users,
      roles,
      gyms,
      users
    RESTART IDENTITY CASCADE
  `);
}

function assertTestDatabase(databaseUrl: string) {
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
  if (!databaseName.includes("test") && process.env.ALLOW_DATABASE_RESET !== "true") {
    throw new Error(
      "Refusing to reset a non-test database. Use a database name containing 'test' or set ALLOW_DATABASE_RESET=true."
    );
  }
}

async function closeServer(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
