# Gym Management Platform

This repository is now scaffolded as a TypeScript monorepo for a modular gym management platform. The backend foundation focuses on correctness first: authentication, tenant scoping, roles/permissions, staff access, locations, members, membership plans, member plan assignments, class scheduling, bookings, waitlists, check-ins, access control, migrations, seed data, and shared contracts.

## Workspace Layout

- `apps/api` - backend API service and domain modules.
- `apps/dashboard` - staff dashboard route, auth, gym settings, locations, members, check-in, and access-control screen logic.
- `apps/member-portal` - member-facing route and layout logic.
- `apps/website-renderer` - public website route and layout logic.
- `packages/ui` - shared UI state models for primitives and common states.
- `packages/constants` - shared roles, permissions, statuses, feature flags, and token constants.
- `packages/validation` - shared request validation schemas.
- `packages/api-client` - typed frontend-to-backend API client.
- `docs` - implementation notes, status, and API documentation.

## Commands

```bash
npm install
npm run typecheck
npm test
npm run test:postgres
npm run build
npm run migrate -w @gym-platform/api
npm run dev:api
npm run dev:worker
npm run tracker:summary
```

The API defaults to `http://0.0.0.0:4000`. Copy `.env.example` to `.env` when local secrets or service URLs need to differ. `PERSISTENCE_DRIVER=memory` is the local default; set `PERSISTENCE_DRIVER=postgres` with `DATABASE_URL` to run against Postgres.

`npm run test:postgres` requires Docker. It starts a disposable Postgres container on port `55432`, runs migrations, executes the Postgres-backed API flow test, and removes the container.

## Backend Milestone 1

Implemented backend modules:

- Auth registration, login, refresh-token rotation, logout, forgot/reset password, email verification, two-factor auth, recovery-code login, and current-user lookup.
- Tenant gym creation and user-to-gym isolation.
- Gym profile settings, brand/logo/business settings, feature flags, operating hours, and onboarding progress.
- Role and permission defaults for owner, manager, trainer, front desk, sales, accountant, and member, plus custom role creation/editing, staff invite creation/acceptance, staff role editing, staff access removal, and staff audit logs.
- Shared UI primitives, frontend route tables, protected route logic, dashboard shell layout, grouped dashboard navigation, global gym search, dashboard home summary cards, reusable page headers, reusable data tables, filter drawers, confirmation modals, detail drawers, toast notification centers, date range pickers, CSV uploaders, image uploaders, responsive mobile navigation, account menu state, auth and 2FA screen models, session persistence, automatic token refresh, and forced logout handling.
- Dashboard gym settings and onboarding screen logic.
- Dashboard staff list, staff profile, create/edit staff member forms, staff active/inactive status flow, staff invite/email sending, trainer public visibility/specialties/bio/profile image, staff availability/scheduling/shift calendar/conflict detection, staff task assignment/list/completion views, invite acceptance, custom role creation/editing, staff permission editing, staff access removal, and trainer/front-desk restricted-view logic.
- Dashboard member list and profile page logic with reusable status badges, dedicated contact, emergency-contact, and notes sections, status/tag filters, detail sections, membership rows, permission-aware actions, and dedicated member search by name, email, phone, and barcode.
- Location create, detail, update, list, archive, room-summary, public schedule filtering, and dashboard location screen logic scoped by gym ID.
- Member create, update, list, archive, duplicate email, and duplicate barcode logic.
- Membership plan create, update, list, archive, and pricing interval logic.
- Member membership assignment and history lookup for existing members.
- Class type creation, class session scheduling, capacity settings, trainer validation, room assignment, and public schedule lookup with optional location filtering.
- Class booking creation/cancellation, waitlist join/leave, active membership eligibility, plan class limits, capacity checks, duplicate active spot checks, automatic waitlist promotion, promotion notification outbox events, cancellation cutoff checks, late cancellation fee assessment, and staff manual overrides.
- Check-in creation by staff, barcode, or QR payload, member eligibility denial, membership eligibility denial, class-booking validation, and staff override auditing.
- Dashboard check-in screen logic for front desk search, QR scanning, barcode input, success/denied results, past-due warnings, history, kiosk mode, auto-reset, and CSV export.
- Access control device registration, API-key generation/rotation, access rules by plan/location, door unlock authorization, denied event logging, heartbeat/offline status, event history, and dashboard access-control screen logic.
- Postgres initial schema migration.
- Local Docker services for Postgres, Redis, and the API.
- Local Docker worker service.
- Demo seed script for an owner, staff, a pending staff invite, gym, two locations, members, plans, member memberships, policy-configured scheduled classes, a class booking, a class check-in, and access-control device/rule/event data.
- Repository interfaces around users, gyms, roles, gym memberships, staff invites, staff audit logs, locations, members, plans, member memberships, classes, bookings, check-ins, access control, notification events, and tokens.
- Postgres repository adapter with transaction handling.
- Optional Docker-backed Postgres API integration test.
- Unit and full HTTP system-flow tests for the backend slice.
- Git pre-commit hook path with lint, type-check, and test gates.

The API can now run against either in-memory repositories or Postgres repositories. The next persistence step is broadening the Docker-backed integration test to cover the complete operations and bookings API flow against a real Postgres database.
