import { spawnSync } from "node:child_process";

const containerName = "gym-platform-postgres-test";
const databaseUrl = "postgres://gym:gym@127.0.0.1:55432/gym_platform_test";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.stdio ?? "inherit",
    encoding: "utf8",
    env: options.env ?? process.env
  });
  if (!options.allowFailure && result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return result;
}

function dockerAvailable() {
  const result = run("docker", ["--version"], { stdio: "pipe", allowFailure: true });
  return result.status === 0;
}

function waitForPostgres() {
  const started = Date.now();
  while (Date.now() - started < 30000) {
    const result = run(
      "docker",
      ["exec", containerName, "pg_isready", "-U", "gym", "-d", "gym_platform_test"],
      { stdio: "pipe", allowFailure: true }
    );
    if (result.status === 0) {
      return;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  throw new Error("Timed out waiting for disposable Postgres test container.");
}

if (!dockerAvailable()) {
  console.error("Docker is required for npm run test:postgres.");
  process.exit(1);
}

run("docker", ["rm", "-f", containerName], { stdio: "pipe", allowFailure: true });

try {
  run("docker", [
    "run",
    "--name",
    containerName,
    "-e",
    "POSTGRES_DB=gym_platform_test",
    "-e",
    "POSTGRES_USER=gym",
    "-e",
    "POSTGRES_PASSWORD=gym",
    "-p",
    "55432:5432",
    "-d",
    "postgres:16-alpine"
  ]);
  waitForPostgres();

  const env = {
    ...process.env,
    NODE_ENV: "test",
    PERSISTENCE_DRIVER: "postgres",
    DATABASE_URL: databaseUrl,
    RUN_POSTGRES_TESTS: "1"
  };

  run("npm", ["run", "migrate", "-w", "@gym-platform/api"], { env });
  run("npx", [
    "vitest",
    "run",
    "apps/api/src/modules/system/*.integration.test.ts"
  ], { env });
} finally {
  run("docker", ["rm", "-f", containerName], { stdio: "pipe", allowFailure: true });
}
