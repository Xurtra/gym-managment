import { spawn } from "node:child_process";

const child = spawn("npm", ["run", "dev:api"], {
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PERSISTENCE_DRIVER: "postgres",
    API_HOST: process.env.API_HOST ?? "0.0.0.0",
    API_PORT: process.env.API_PORT ?? "4000",
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? "local-dev-secret-change-me",
    DATABASE_URL: process.env.DATABASE_URL ?? "postgres://gym:gym@localhost:5432/gym_platform",
    REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379"
  },
  shell: true,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
