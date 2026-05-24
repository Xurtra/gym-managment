# Backend Architecture

## Module Boundaries

The backend is organized around domain services instead of route-heavy logic.

- `AuthService` owns identity, password hashing, sessions, refresh-token rotation, password reset tokens, and email verification tokens.
- `TenancyService` owns gym creation and tenant isolation rules.
- `RoleService` owns default roles, custom role creation/editing, permission lookup, permission guards, role listing, staff access listing/removal, role assignment, staff audit logs, and staff invite creation.
- `StaffScheduleService` owns staff shift creation rules, active staff validation, location validation, shift-role validation, and overlap prevention.
- `AuthService` owns staff invite acceptance because acceptance can create an identity and issue a dashboard session.
- `LocationService` owns gym-scoped location lifecycle rules, active detail lookup, and room summaries derived from scheduled class sessions.
- `MemberService` owns gym-scoped consumer lifecycle (create, update, archive), duplicate email/barcode enforcement, legacy `lead` status normalisation, and consumer-segment derivation. Segments (`Lead`, `Customer`, `Member`) are computed from `leadStage`, POS purchase tags, and active membership plan types — consumers may belong to multiple segments simultaneously.
- `MemberMembershipService` owns assignment of membership plans to existing members and membership history reads.
- `MembershipPlanService` owns gym-scoped plan lifecycle and pricing fields.
- `ClassScheduleService` owns class templates, scheduled sessions, capacity settings, trainer validation, and public schedule lookup.
- `BookingService` owns class booking capacity checks, active membership eligibility, plan class limits, waitlist joins/leaves, duplicate active booking guards, waitlist promotion, cancellation cutoff evaluation, late fee assessment, and staff manual overrides.
- `CheckInService` owns member lookup by ID, barcode, or QR payload, location validation, member and membership eligibility, class booking validation, and staff override audit metadata.
- `AccessControlService` owns access device registration, API-key rotation, heartbeat/offline status, access rule evaluation, door unlock decisions, and denied reason logging.
- The notification repository currently acts as an outbox for pending waitlist promotion notification events.
- `backend/api/src/infrastructure/store/repositories.ts` defines the persistence contracts. `MemberMembershipRepository` exposes both `listMemberMembershipsForMember` (single-member lookup) and `listMemberMembershipsForGym` (batch lookup used by `MemberService.list` to avoid N+1 queries).
- `InMemoryStore` is the fast repository implementation used for local tests.
- `PostgresRepositories` is the SQL implementation used when `PERSISTENCE_DRIVER=postgres`.

HTTP handlers in `backend/api/src/app.ts` validate requests, authenticate callers, enforce tenant/permission checks, and delegate business behavior to services.

The dashboard workflow is currently modeled as framework-neutral TypeScript in `frontend/dashboard/src`. Shell modules own grouped sidebar navigation, top bar state, global gym search, dashboard home summary cards, reusable page headers, reusable data tables, filter drawers, confirmation modals, detail drawers, toast notification centers, date range pickers, CSV uploaders, image uploaders, responsive mobile navigation, content region state, and account menu actions. Staff modules own staff list search/filter/table state, staff profile detail/action/audit state, create/edit staff member form state, staff active/inactive status flow state, staff invite form state with selected-role context, pending and expired invite summaries, and empty-state handling, staff invite email sending state, trainer public visibility setting with visibility summaries, trainer specialties editor with specialty counts and change summaries, trainer bio editor with change/summary state, trainer profile image upload with current-image and preview summaries, staff schedule availability model/editor with slot/conflict summaries and change state, staff shift calendar view with option counts and schedule summaries, staff shift conflict detection with conflict summaries, staff task assignment/list/completion state with summary metadata, role selection, invite acceptance state with field-level models, completion summaries, and validation feedback, custom role create/edit state with grouped permission summaries and validation, staff permission editing/removal state with summary and locked-state context, audit-trail state, and trainer/front-desk restricted views with route and action counts. Member modules own reusable member status badges with category, check-in eligibility, and legend summary state; member list search/filter/table state with summary and filter-count metadata; member profile detail sections with section counts, membership counts, action counts, and summary labels; dedicated contact-information, emergency-contact, and notes sections with field or summary metadata; membership summary/history state; dedicated member-directory search by name/email/phone/barcode with result and selection metadata; status/tag summaries; contact/tag labels; and permission-aware row actions. Consumer modules own the unified consumer dashboard with tabbed segments (All / Members / Customers / Leads), per-tab counts, a cross-segment summary (total, per-segment, overlap, and unsegmented counts), and a create-consumer action. Each tab delegates to the appropriate member-list or lead-list page model. Segment classification reads the enriched `segments`/`isLead`/`isCustomer`/`isMember` fields returned by the API; no status-based fallback inference is performed in the dashboard. Leads modules own lead list state with lead-only search and tag filters, summary and filter-count metadata, lead profile detail state with tag summaries and shared contact or notes sections, lead directory search state with selected-lead metadata, and lead conversion state with target-status options, blocked reasons, and normalized submission. Membership-plan modules own list state with billing-interval filters, pricing and visibility labels, summary counts, and permission-aware actions; detail state with pricing, access, settings, and history sections; create/edit state with validation, change tracking, and normalized submissions; and archive flow state with blocked reasons and confirmation metadata. Contracts-and-waivers modules own list state with search and type filters, summary counts, version and signature labels, and permission-aware actions; detail state with overview, signature, and history sections; create/edit state with validation, change tracking, and normalized submissions; and archive flow state with blocked reasons and confirmation metadata. Stripe-payments modules own connection state with onboarding and capability summaries, payment collection state with point-of-sale gating and member context, payment history state with transaction filters and totals, and payment detail/refund state with grouped detail sections, refundable-amount summaries, blocked reasons, and normalized submissions. Booking modules own booking list state with member search, booking-status filters, waitlist-position and late-fee metadata, and permission-aware actions; booking detail state with member, booking, and operations sections; booking cancel state with blocked reasons, confirmation state, and late-fee/waitlist context; staff manual booking state with override flags, required override reasons, and normalized submissions; waitlist entry state with capacity gating, next-position metadata, duplicate active-spot blocking, and normalized submissions; and leave-waitlist state with waitlist-only guards and confirmation metadata. Personal-training modules own session list state with feature-flag gating, member search, trainer/status filters, and permission-aware actions; session detail state with member, schedule, and operations sections; create/edit state with member/trainer selection, time validation, change tracking, locked-state handling, and normalized submissions; and cancel flow state with blocked reasons, confirmation state, and session metadata. Location modules own list/detail state, address validation, map links, business hours, room management, switchers, multi-location member access summaries, and reporting filters. Check-in modules own front desk search state, QR and barcode scanner state, success/denied result state, past-due warnings, history filtering, kiosk auto-reset behavior, and CSV export formatting. Access-control modules own device registration/list/rotation state, rule editor state, and access event history filtering.

The public website workflow is currently modeled as framework-neutral TypeScript in `frontend/website-renderer/src`. Public-site modules own the route table and layout state, Website Builder home/schedule/plans state for feature gating, homepage content/theme summaries, public schedule location filtering, plan-card summaries, empty-state handling, and CTA state, plus public signup and checkout state for online-signup feature gating, public-plan selection, form validation, pricing and signup-fee summaries, checkout totals, and normalized signup submissions.

## Security Rules

- Passwords are hashed with Node `crypto.scrypt`; raw passwords are never stored.
- Access tokens are HMAC-signed and short lived.
- Refresh tokens are opaque, hashed before storage, and rotated on every refresh.
- Password resets revoke outstanding refresh tokens for the user.
- Email verification and password reset tokens are single use and expire.
- Gym-owned resources carry `gymId`; route handlers enforce gym access before service calls.
- Removed staff access is represented by a disabled gym membership, so permission lookup and tenant access checks stop granting access while audit history remains intact.
- Custom gym roles cannot use reserved default role names or `platform:admin`, and system roles cannot be edited through custom role endpoints.
- Stripe payment collection and refund actions are gated by `payment:write`, while payment-history visibility requires payment read access; dashboard payment flows also require the `point_of_sale` feature flag and a connected, charge-enabled Stripe account before staff can collect payments.

## Persistence

The backend uses asynchronous repository interfaces so services do not care whether persistence is memory-backed or SQL-backed. `createServices` wires the in-memory implementation by default; `createPostgresServices` wires `pg` and the Postgres adapter.

Migration files live in `backend/api/src/db/migrations`. `npm run migrate -w @gym-platform/api` applies unapplied files in alphabetical order through the `pg` driver and records them in `schema_migrations`. Migration `014_consumer_model.sql` added `record_status` and `lead_stage` columns to `members` and backfilled legacy `lead`/`archived` statuses. Migration `017_consumer_unique_constraints.sql` added partial unique indexes on `(gym_id, lower(email))` and `(gym_id, barcode)` scoped to non-archived records, closing the race window left by application-level duplicate checks.

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
- `member.service.test.ts` covers create, update, archive, duplicate email, duplicate barcode rules, legacy `lead` status normalisation, and overlapping consumer-segment derivation (a member can be simultaneously a Lead, Customer, and Member).
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
