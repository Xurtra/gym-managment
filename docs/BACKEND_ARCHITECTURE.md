# Backend Architecture

## Module Boundaries

The backend is organized around domain services instead of route-heavy logic.

- `AuthService` owns identity, password hashing, sessions, refresh-token rotation, password reset tokens, and email verification tokens.
- `TenancyService` owns gym creation and tenant isolation rules.
- `RoleService` owns default roles, custom role creation/editing, permission lookup, permission guards, role listing, staff access listing/removal, role assignment, staff audit logs, and staff invite creation.
- `StaffScheduleService` owns staff shift creation rules, active staff validation, location validation, shift-role validation, and overlap prevention.
- `AuthService` owns staff invite acceptance because acceptance can create an identity and issue a dashboard session.
- `LocationService` owns gym-scoped location lifecycle rules, active detail lookup, and room summaries derived from scheduled class sessions.
- `MemberService` owns gym-scoped member profile lifecycle and duplicate member identifiers.
- `MemberMembershipService` owns assignment of membership plans to existing members and membership history reads.
- `MembershipPlanService` owns gym-scoped plan lifecycle and pricing fields.
- `ClassScheduleService` owns class templates, scheduled sessions, capacity settings, trainer validation, and public schedule lookup.
- `BookingService` owns class booking capacity checks, active membership eligibility, plan class limits, waitlist joins/leaves, duplicate active booking guards, waitlist promotion, cancellation cutoff evaluation, late fee assessment, and staff manual overrides.
- `CheckInService` owns member lookup by ID, barcode, or QR payload, location validation, member and membership eligibility, class booking validation, and staff override audit metadata.
- `AccessControlService` owns access device registration, API-key rotation, heartbeat/offline status, access rule evaluation, door unlock decisions, and denied reason logging.
- The notification repository currently acts as an outbox for pending waitlist promotion notification events.
- `apps/api/src/infrastructure/store/repositories.ts` defines the persistence contracts.
- `InMemoryStore` is the fast repository implementation used for local tests.
- `PostgresRepositories` is the SQL implementation used when `PERSISTENCE_DRIVER=postgres`.

HTTP handlers in `apps/api/src/app.ts` validate requests, authenticate callers, enforce tenant/permission checks, and delegate business behavior to services.

The dashboard workflow is currently modeled as framework-neutral TypeScript in `apps/dashboard/src`. Shell modules own grouped sidebar navigation, top bar state, global gym search, dashboard home summary cards, reusable page headers, reusable data tables, filter drawers, confirmation modals, detail drawers, toast notification centers, date range pickers, CSV uploaders, image uploaders, responsive mobile navigation, content region state, and account menu actions. Staff modules own staff list search/filter/table state, staff profile detail/action/audit state, create/edit staff member form state, staff active/inactive status flow state, staff invite form state, staff invite email sending state, trainer public visibility setting, trainer specialties editor, trainer bio editor, trainer profile image upload, staff schedule availability model, staff availability editor, staff shift calendar view, staff shift conflict detection, staff task assignment model, staff task list view, staff task completion flow, role selection, invite acceptance, pending invite lists, custom role create/edit state, staff permission editing/removal state, audit-trail state, and trainer/front-desk restricted views. Member modules own reusable member status badges, member list search/filter/table state, member profile detail sections, dedicated contact-information, emergency-contact, and notes sections, membership summary/history state, dedicated member-directory search by name/email/phone/barcode, status/tag summaries, contact/tag labels, and permission-aware row actions. Location modules own list/detail state, address validation, map links, business hours, room management, switchers, multi-location member access summaries, and reporting filters. Check-in modules own front desk search state, QR and barcode scanner state, success/denied result state, past-due warnings, history filtering, kiosk auto-reset behavior, and CSV export formatting. Access-control modules own device registration/list/rotation state, rule editor state, and access event history filtering.

## Security Rules

- Passwords are hashed with Node `crypto.scrypt`; raw passwords are never stored.
- Access tokens are HMAC-signed and short lived.
- Refresh tokens are opaque, hashed before storage, and rotated on every refresh.
- Password resets revoke outstanding refresh tokens for the user.
- Email verification and password reset tokens are single use and expire.
- Gym-owned resources carry `gymId`; route handlers enforce gym access before service calls.
- Removed staff access is represented by a disabled gym membership, so permission lookup and tenant access checks stop granting access while audit history remains intact.
- Custom gym roles cannot use reserved default role names or `platform:admin`, and system roles cannot be edited through custom role endpoints.

## Persistence

The backend uses asynchronous repository interfaces so services do not care whether persistence is memory-backed or SQL-backed. `createServices` wires the in-memory implementation by default; `createPostgresServices` wires `pg` and the Postgres adapter.

Migration files live in `apps/api/src/db/migrations`. `npm run migrate -w @gym-platform/api` applies unapplied files through the `pg` driver and records them in `schema_migrations`.

Multi-write operations use `repositories.transaction(...)`; Postgres opens `BEGIN` / `COMMIT` / `ROLLBACK`, while the in-memory adapter runs the same callback directly.

Next persistence step:

1. Add Docker-backed integration tests against real Postgres.
2. Add transaction-focused tests around registration and gym creation failures.
3. Broaden the Postgres-backed flow test to cover members, plans, class scheduling, bookings, and check-ins.

## Test Coverage

- `auth.service.test.ts` covers registration, login, refresh rotation, password reset, and email verification.
- `role.service.test.ts` covers default role permissions, custom role creation/editing, role assignment, staff access listing/removal, staff audit logging, staff invite creation, and invite acceptance.
- `tenancy.service.test.ts` covers unique gym slugs and tenant access rejection.
- `location.service.test.ts` covers create, detail lookup, update, archive, duplicate-name rules, and class room summaries.
- `member.service.test.ts` covers create, update, archive, duplicate email, and duplicate barcode rules.
- `membershipPlan.service.test.ts` covers pricing intervals, update, archive, and duplicate-name rules.
- `classSchedule.service.test.ts` covers class type creation, class session creation, public schedule filtering, invalid time rejection, and trainer validation.
- `memberMembership.service.test.ts` covers member plan assignment and membership history reads.
- `booking.service.test.ts` covers capacity checks, active membership eligibility, plan class limits, waitlist join/leave, duplicate active spots, member eligibility, automatic waitlist promotion, promotion notifications, cancellation cutoffs, late fees, and staff manual overrides.
- `checkIn.service.test.ts` covers QR/barcode lookup, member and membership denials, class booking validation, class-booking linkage, and staff eligibility overrides.
- `checkInDashboard.test.ts` covers check-in search, QR scanner, barcode scanner, success/denied screen states, past-due warning state, history filtering, kiosk auto-reset, and CSV export.
- `accessControl.service.test.ts` covers device registration, plan-based unlocks, denied reason logging, heartbeats, offline detection, and API-key rotation.
- `accessControlDashboard.test.ts` covers device registration, offline display, key rotation state, rule editor state, and access event history filtering.
- `postgresRepositories.test.ts` covers SQL adapter mapping and transaction commit/rollback behavior.
- `system-flow.test.ts` starts a real HTTP server and verifies owner onboarding, sessions, email verification, tenant guards, role assignment, staff invite creation, location lifecycle/detail/room endpoints, operations-core endpoints, booking/waitlist endpoints, check-in endpoints, logout, and password reset.
