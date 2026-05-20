import { spawnSync } from "node:child_process";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://gym:gym@localhost:5432/gym_platform";
const baseEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PERSISTENCE_DRIVER: "postgres",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? "local-dev-secret-change-me",
  DATABASE_URL: databaseUrl,
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379"
};

const shouldReset = process.argv.includes("--reset");

requireDocker();

if (shouldReset) {
  run("docker", ["compose", "down", "-v"]);
}

run("docker", ["compose", "up", "-d", "postgres", "redis"]);
waitForPostgres();
run("npm", ["run", "migrate", "-w", "@gym-platform/api"], { env: baseEnv });

if (await hasDemoOwner()) {
  console.log("Demo data already exists. Skipping seed.");
} else {
  run("npm", ["run", "seed", "-w", "@gym-platform/api"], { env: baseEnv });
}

console.log("");
console.log("Local demo is ready.");
console.log("");
console.log("Start the API in another terminal:");
console.log("  npm run dev:api:postgres");
console.log("");
console.log("Start the UI:");
console.log("  npm run dev:frontend");
console.log("");
console.log("Open:");
console.log("  http://127.0.0.1:5173/?gymSlug=demo-strength-club#/dashboard");
console.log("");
console.log("Demo login:");
console.log("  owner@example.com");
console.log("  Password123");

function waitForPostgres() {
  const maxAttempts = 30;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = spawnSync(
      "docker",
      ["compose", "exec", "-T", "postgres", "pg_isready", "-U", "gym", "-d", "gym_platform"],
      { encoding: "utf8" }
    );
    if (result.status === 0) {
      return;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  throw new Error("Postgres did not become ready in time.");
}

function requireDocker() {
  const result = spawnSync("docker", ["info"], {
    encoding: "utf8",
    shell: true,
    stdio: "pipe"
  });
  if (result.status === 0) {
    return;
  }
  console.error("Docker is required for the persistent local demo, but it is not running.");
  console.error("Start Docker Desktop, wait for it to finish booting, then run:");
  console.error("  npm run setup:demo");
  process.exit(result.status ?? 1);
}

async function hasDemoOwner() {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const result = await pool.query("SELECT 1 FROM users WHERE email = $1 LIMIT 1", [
      "owner@example.com"
    ]);
    return result.rowCount > 0;
  } catch (error) {
    if (isMissingTableError(error)) {
      return false;
    }
    throw error;
  } finally {
    await pool.end();
  }
}

function isMissingTableError(error) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42P01"
  );
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: "utf8",
    shell: true,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
  }
}
