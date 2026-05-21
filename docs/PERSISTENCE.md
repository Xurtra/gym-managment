# Persistence

The API supports two persistence drivers:

- `memory` - default local/test driver, fast and process-local.
- `postgres` - SQL driver backed by the `pg` package and the schema in `backend/api/src/db/migrations`.

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

The repository boundary lives in `backend/api/src/infrastructure/store/repositories.ts`. Domain services depend on that boundary, not on SQL or in-memory maps directly.

Current migrations create the auth, tenant, role, gym-user, staff-invite, staff-audit-log, location, member, membership-plan, member-membership, class-type, class-session, class-booking, notification-event, check-in, access-device, access-rule, and access-event tables. Later migrations add two-factor secret, enabled timestamp, recovery-code hash fields to users, and gym settings fields for logo, brand colors, business info, and operating hours.

The `member` and `member-membership` tables back the dashboard member-management models in `frontend/dashboard/src/members`, including member list filtering, profile sections, membership summaries, searchable directory state, reusable status badges, and contact or notes section metadata. The same `member` records also back the dashboard leads-and-CRM models in `frontend/dashboard/src/leads`, where `status: "lead"` drives lead list filtering, lead profile detail, lead directory search, and lead conversion to trial or active member states. The `membership-plan` table backs the dashboard membership-plan models in `frontend/dashboard/src/membershipPlans`, including plan list filtering, detail sections, create/edit validation state, archive confirmation state, and the normalized plan submissions used by the dashboard flow. The public website signup and checkout models in `frontend/website-renderer/src` also derive their availability and plan-selection state from those existing gym feature-flag and membership-plan records, so online-signup gating and public-plan filtering stay aligned with the same persisted data. The current Stripe Payments dashboard models in `frontend/dashboard/src/payments` still derive their state from those existing gym, member, role-permission, and feature-flag records, so payment collection gating, member lookup context, and point-of-sale availability stay aligned with the same persisted data even before dedicated payment tables are added. The current Personal Training dashboard models in `frontend/dashboard/src/personalTraining` likewise derive their feature gating, member selection, trainer selection, and location context from those same existing gym, member, staff, and feature-flag records until dedicated personal-training persistence is added. The check-in dashboard models in `frontend/dashboard/src/checkIns` derive their member lookup, eligibility messaging, and location context from those same persisted member, membership, class-booking, and gym records, so front-desk search, QR/barcode resolution, denied-state reasoning, and history exports stay aligned with the underlying operational data. The access-control dashboard models in `frontend/dashboard/src/accessControl` derive their device, rule, and event state from those same persisted gym, location, membership-plan, member-credential, and access-event records, so registration flows, rule selection, denied-event visibility, and API-key rotation status stay aligned with the underlying access-control data.

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
