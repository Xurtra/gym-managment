# Gym Platform — Agent Context

Single-file context for agents and handoffs. Read this before making architectural decisions.

---

## What This Is

A multi-tenant gym management SaaS. One backend API serves gym owners and their staff. Each gym is a tenant; all resources carry `gymId` and are scoped to it. The platform supports consumer management (leads, customers, members), class scheduling, bookings, check-ins, access control, payments, staff management, and a public-facing member signup flow.

---

## Repo Layout

```
backend/
  api/          Node.js HTTP API (tsx dev, tsc build)
  worker/       Background job worker (separate process)
frontend/
  dashboard/    Staff dashboard (framework-neutral TS models)
  member-portal/ Member-facing portal (framework-neutral TS models)
  website-renderer/ Public gym website (framework-neutral TS models)
  app/          Shared app-level utilities and fake data
packages/
  constants/    Shared enums and type constants
  validation/   Zod schemas and inferred input types
  api-client/   Typed HTTP client with auto-refresh
  ui/           Framework-neutral primitive UI state models
tools/          Dev runner, migration helpers, test utilities
docs/           Per-slice architecture docs
e2e/            Playwright end-to-end specs
```

---

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript (ESM, `.js` imports)
- **HTTP**: Custom lightweight server in `backend/api/src/app.ts`
- **Database**: PostgreSQL via `pg`; in-memory store for tests
- **Validation**: Zod (`packages/validation`)
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Dev server**: `tsx --conditions=development src/index.ts` — **no hot reload**, must restart on changes
- **Build**: `tsc -b` per package

---

## Backend Services

All services live in `backend/api/src/modules/`. HTTP handlers in `app.ts` authenticate, enforce tenant/permission checks, parse input with Zod, then call services. Services never import from `app.ts`.

| Service | Owns |
|---|---|
| `AuthService` | Registration, login, refresh-token rotation, password reset, email verification, 2FA, staff invite acceptance |
| `TenancyService` | Gym creation, slug uniqueness, tenant isolation |
| `RoleService` | Default/custom roles, permissions, role assignment, staff access removal, audit logs, invite creation |
| `LocationService` | Location lifecycle, room summaries from class sessions |
| `MemberService` | Consumer lifecycle (create/update/archive), duplicate email/barcode enforcement, legacy status normalisation, segment derivation |
| `MemberMembershipService` | Plan assignment to consumers, membership history |
| `MembershipPlanService` | Plan lifecycle, pricing, billing intervals |
| `ClassScheduleService` | Class types, scheduled sessions, capacity, trainer validation, public schedule |
| `BookingService` | Booking eligibility, capacity, waitlist, cancellation cutoffs, late fees, staff overrides |
| `CheckInService` | QR/barcode lookup, eligibility, class-booking linkage, staff overrides |
| `AccessControlService` | Device registration, API-key management, rule evaluation, door decisions, heartbeats |
| `ReservationResourceService` | Resource groups/units, allocations, facility reservations, staff-linked resources |
| `StaffScheduleService` | Shift creation, overlap prevention, staff/location/role validation |
| `StaffTimeClockService` | Clock-in/out entries, active entry lookup |
| `PosService` | Point-of-sale purchases, Stripe terminal integration |

---

## Consumer Model (current branch: `customer`)

The core data model is a **Consumer** — a single `members` table record that can simultaneously belong to multiple segments:

| Segment | Condition |
|---|---|
| `Lead` | `leadStage = 'open'` |
| `Customer` | POS purchase tag (`pos:customer`) OR active one-time/package membership |
| `Member` | Active or trialing monthly/yearly membership |

Key fields on every consumer: `status`, `recordStatus`, `leadStage`, `segments[]`, `isLead`, `isCustomer`, `isMember`.

**Legacy normalisation**: incoming `status = 'lead'` is rewritten to `status = 'active', leadStage = 'open'`. The `MemberStatus.Lead` enum value still exists for backward compatibility but is never stored after normalisation.

**Segment derivation** is computed in `MemberService.enrichConsumer` by reading memberships and their plan billing intervals. It is always server-authoritative — the frontend must not infer segments from `status` alone.

**Uniqueness**: `(gym_id, lower(email))` and `(gym_id, barcode)` have partial unique DB indexes scoped to non-archived records (migration `017`). Application-level `ensureUnique` provides an early error message; the DB index is the safety net for race conditions.

**Performance**: `MemberService.list()` batch-loads all members, all memberships, and all plans for the gym in 3 parallel queries. Individual `get()` still does per-member lookups.

**API routes**:
- `GET /gyms/:gymId/consumers` — list active consumers with segments
- `POST /gyms/:gymId/consumers` — create consumer
- `PATCH /gyms/:gymId/consumers/:consumerId` — update
- `DELETE /gyms/:gymId/consumers/:consumerId` — archive
- `GET/POST /gyms/:gymId/consumers/:consumerId/memberships` — entitlements

`/members` routes are compatibility aliases over the same service layer.

---

## Persistence Layer

**Two drivers, one interface**: `backend/api/src/infrastructure/store/repositories.ts` defines all repository interfaces. Services depend only on these interfaces.

- `InMemoryStore` — used by default in unit/service tests; fast, no I/O
- `PostgresRepositories` — used when `PERSISTENCE_DRIVER=postgres`

**Selecting a driver**:
```
PERSISTENCE_DRIVER=postgres
DATABASE_URL=postgres://gym:gym@localhost:5432/gym_platform
```

**Migrations**: `npm run migrate -w @gym-platform/api` — runs SQL files in `backend/api/src/db/migrations/` in alphabetical order, tracks applied files in `schema_migrations`.

**Transactions**: `repositories.transaction(work)` — Postgres opens `BEGIN/COMMIT/ROLLBACK`; in-memory runs the callback directly.

**Adding a new repository method**: add to (1) the interface in `repositories.ts`, (2) the dispatch object in `PostgresRepositories` (the class method alone is not enough — it must be wired into the `readonly <name> = { ... }` object), (3) the `InMemoryStore`.

---

## Frontend Architecture

All frontend packages export **framework-neutral TypeScript model functions**. There is no React, Vue, or any UI framework in these packages. A renderer (web component, React app, etc.) calls these functions with data and receives plain objects describing screen state.

**Pattern**:
```ts
// Input: raw data from API + current user permissions + filter state
// Output: typed screen model ready to render
export function buildConsumerDashboardPage(input): ConsumerDashboardPage { ... }
```

**Key principle**: screen models are computed, not stored. Every field the renderer needs (labels, counts, hrefs, disabled states, permission gates) is in the returned object — no runtime logic in the renderer.

**Dashboard segment logic**: `frontend/dashboard/src/members/segments.ts` — reads `segments`/`isLead`/`isCustomer`/`isMember` from the API response. Does NOT fall back to inferring membership from `status`. If a consumer lacks these fields, treat them as unsegmented.

**Consumer dashboard** (`frontend/dashboard/src/consumers/`): tabbed surface with All / Members / Customers / Leads tabs. Each tab delegates to the appropriate list page builder. Summary counts include overlap (consumers in multiple segments) and unsegmented counts.

**`MemberView` type** (`frontend/dashboard/src/members/types.ts`): `recordStatus` is required. All fixture objects in tests must include it.

---

## Permissions

Permissions are strings defined in `packages/constants`. Roles carry an array of permission strings. Route handlers call `hasPermission(context, Permission.XxxYyy)` before delegating to services.

Key permissions: `member:read`, `member:write`, `plan:read`, `plan:write`, `class:read`, `class:write`, `booking:read`, `booking:write`, `staff:read`, `staff:invite`, `staff:role_assign`, `staff:remove`, `access:read`, `access:write`, `gym:read`, `gym:update`, `payment:read`, `payment:write`.

Platform admin (`platform:admin`) bypasses all gym-level permission checks.

---

## Security Rules

- Passwords: `crypto.scrypt`, never stored raw
- Access tokens: HMAC-signed, short-lived
- Refresh tokens: opaque, hashed before storage, rotated on every use
- Password resets revoke all outstanding refresh tokens
- Email/password reset tokens: single-use, expiring
- All gym resources validated against caller's `gymId` before service calls
- Removed staff: gym membership disabled (not deleted); audit log preserved
- Device authentication: API key in request body, hashed before storage, rotatable
- Custom roles cannot use reserved names or `platform:admin`; system roles cannot be edited

---

## Running the Project

```bash
# Install
npm install

# Start everything (API on :4000, frontend on :5173)
node tools/dev.mjs

# API only
npm run dev -w @gym-platform/api

# Run migrations
npm run migrate -w @gym-platform/api

# Seed dev data
npm run seed -w @gym-platform/api
```

**The dev API does not hot-reload.** Restart it after changing backend source files.

---

## Testing

```bash
npm test                  # all unit + service tests (vitest)
npm run test:e2e          # Playwright browser tests
npm run test:postgres     # real Postgres integration (requires Docker)
```

Focused runs:
```bash
npx vitest run frontend/dashboard/src/consumers/consumerDashboard.test.ts
npx vitest run backend/api/src/modules/members/member.service.test.ts
npx vitest run frontend/app/src/consumerCreate.test.ts
```

Unit tests use `InMemoryStore`. Postgres integration spins up a disposable `postgres:16-alpine` Docker container, runs migrations, executes the integration test, then tears the container down.

Pre-commit hook runs lint + typecheck + tests: `npm run precommit`.

---

## Key Invariants

1. **Services are the source of truth.** HTTP handlers validate and delegate; no business logic in `app.ts`.
2. **Consumer segments are server-computed.** Never infer `isLead`/`isCustomer`/`isMember` from `status` on the frontend.
3. **Lead alone grants nothing.** Lead state does not confer booking, check-in, or facility access eligibility.
4. **Tenant isolation is enforced twice**: route handler checks `gymId` belongs to caller; service methods re-check `gymId` on fetched records.
5. **Repository dispatch objects must be kept in sync.** Adding a method to a `PostgresRepositories` class method is not enough — wire it into the `readonly <name> = { ... }` dispatch object too.
6. **Migrations run in alphabetical order.** Name new files with the next number prefix: `017_...`, `018_...`.
7. **`MemberView.recordStatus` is required.** All test fixtures must supply it.
8. **`applyOptionalMemberFields` returns a new object.** Do not mutate member objects directly in the service layer.
