# Persistence

The API supports two persistence drivers:

- `memory` - default local/test driver, fast and process-local.
- `postgres` - SQL driver backed by the `pg` package and the schema in `apps/api/src/db/migrations`.

Set the driver with:

```bash
PERSISTENCE_DRIVER=postgres
DATABASE_URL=postgres://gym:gym@localhost:5432/gym_platform
```

Run migrations with:

```bash
npm run migrate -w @gym-platform/api
```

The migration runner creates `schema_migrations`, skips applied files, and wraps each new file in a transaction.

The repository boundary lives in `apps/api/src/infrastructure/store/repositories.ts`. Domain services depend on that boundary, not on SQL or in-memory maps directly.

Current migrations create the auth, tenant, role, gym-user, staff-invite, staff-audit-log, location, member, membership-plan, member-membership, class-type, class-session, class-booking, notification-event, check-in, access-device, access-rule, and access-event tables. Later migrations add two-factor secret, enabled timestamp, recovery-code hash fields to users, and gym settings fields for logo, brand colors, business info, and operating hours.

Seed development data with:

```bash
npm run seed -w @gym-platform/api
```

When `PERSISTENCE_DRIVER=postgres`, the seed script uses the Postgres repositories and closes the database pool after writing demo data.

## Postgres Integration Test

Run the real database API flow with:

```bash
npm run test:postgres
```

This command requires Docker. It creates a disposable `postgres:16-alpine` container named `gym-platform-postgres-test`, uses `gym_platform_test`, runs migrations, executes `postgres-system-flow.integration.test.ts`, and removes the container.

The test refuses to reset a database unless the database name contains `test` or `ALLOW_DATABASE_RESET=true` is set.
