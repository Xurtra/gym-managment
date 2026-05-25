# Worker

The worker app lives in `backend/worker`. It provides the foundation for background jobs:

- `PgBossJobQueue` stores queued jobs durably in Postgres through pg-boss.
- `WorkerRuntime` registers handlers with pg-boss. pg-boss owns polling, retries, and restart recovery.
- The current boot handler runs a `health.check` job so the process proves it can start and process work.

Run locally:

```bash
npm run dev:worker
```

Run with Docker Compose:

```bash
docker compose up worker
```

The worker accepts these environment variables:

- `WORKER_NAME`
- `WORKER_POLL_INTERVAL_MS`
- `WORKER_ENQUEUE_BOOT_JOB`
- `DATABASE_URL`
- `PGBOSS_SCHEMA`

`PGBOSS_SCHEMA` is optional. When omitted, pg-boss uses its default `pgboss` schema and self-manages its internal migrations during `PgBoss.start()`.
