# Worker

The worker app lives in `backend/worker`. It provides the foundation for background jobs:

- `InMemoryJobQueue` stores queued jobs for local development and tests.
- `WorkerRuntime` polls the queue and dispatches registered handlers.
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
- `REDIS_URL`

Redis is wired into Docker now, but the durable Redis-backed queue is a future implementation step.
