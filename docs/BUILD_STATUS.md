# Build Status

Source tracker: `gym_platform_development_only_tracker.xlsx`

Current tracker summary:

- Taken: 193
- Ongoing: 0
- Completed: 193

## Current Milestone

Milestone 1 is the backend foundation. Completed rows are marked in the tracker when code and verification are done; partial rows stay Ongoing.

Completed in code:

- Monorepo structure for API, frontend placeholders, and shared packages.
- TypeScript project references across apps and packages.
- Linting, formatting, type-check, test, build, and dev scripts.
- Shared constants package.
- Shared UI package with button, input, table, modal, card, layout, loading, empty, error, and error-boundary state models.
- Shared validation package.
- Shared API client package.
- Base frontend routing for dashboard, member portal, and public site renderer.
- Public website home, schedule, and plans logic with Website Builder feature gating, homepage content/theme state, schedule location filtering, public plan summaries, empty-state handling, and CTA state, plus signup and checkout logic with online-signup feature gating, public-plan selection, form validation, pricing and signup-fee summaries, checkout totals, and normalized public signup submissions.
- Dashboard auth screen and session logic for login, registration, forgot/reset password, protected routes, permission-guarded dashboard navigation, grouped shell navigation, global gym search, dashboard home summary cards, reusable page headers, reusable data tables, filter drawers, confirmation modals, detail drawers, toast notification centers, date range pickers, CSV uploaders, image uploaders, responsive mobile navigation, account menu, refresh persistence, token refresh, and forced logout.
- Environment loading and `.env.example`.
- Docker Compose for Postgres, Redis, and API.
- Docker Compose worker service and worker app foundation.
- Initial Postgres migration schema.
- Demo seed script.
- Backend health endpoint.
- Auth service and endpoints.
- Optional two-factor setup, verification endpoint, recovery code generation, recovery-code login, and dashboard 2FA screen models.
- Gym creation and tenant isolation.
- Gym profile, logo, brand color, business info, timezone/locale, operating-hours, feature-flag, and onboarding settings contracts.
- Dashboard gym settings and onboarding screen logic for profile, logo, brand, business info, timezone/locale, operating hours, feature flags, checklist, wizard steps, and progress.
- Default role/permission model, custom role creation/editing, role listing, role assignment, staff access listing/removal, staff audit logs, staff invite creation with role selection, and staff invite acceptance.
- Dashboard staff list page state with search, role/status filters, summary counts, row actions, staff profile page state with identity details and audit history, create/edit staff member form state with role selection, change detection, and email validation, staff active/inactive status flow state, staff invite flow state with email/message normalization, selected-role context, pending/expired invite summaries, and empty-state handling, staff invite email sending flow state, trainer public visibility setting with visibility summaries, trainer specialties editor with specialty counts and change summaries, trainer bio editor with change/summary state, trainer profile image upload with current-image and preview summaries, staff schedule availability model/editor with slot/conflict summaries and change state, staff shift calendar view with option counts and summary state, staff shift conflict detection with conflict summaries, staff task assignment/list/completion state with summary metadata, staff-role selection, invite acceptance form state with field-level models, completion summaries, and validation feedback, custom role create/edit forms with grouped permission summaries and validation, staff permission editing/removal state with summary and locked-state handling, trainer/front-desk restricted views with route/action counts, and submit eligibility.
- Dashboard member list and profile page state with reusable member status badges, badge legend summary state, dedicated contact-information, emergency-contact, and member-notes sections with field and summary metadata, search, status/tag filters, summary counts, contact/tag labels, detail sections, membership history rows, profile action and section counts, permission-aware create/import controls, and dedicated member-directory search by name, email, phone, and barcode with result and selection metadata.
- Dashboard lead list, lead profile, lead directory search, and lead conversion state with lead-only search/tag filters, section and tag summaries, selected-lead metadata, conversion target-status options, blocked-reason handling, and normalized conversion submission.
- Dashboard membership plan list, detail, create/edit, and archive state with billing-interval filters, pricing and visibility metadata, sectioned detail views, validation and change tracking, blocked-reason handling, confirmation state, and normalized submissions.
- Dashboard contracts-and-waivers list, detail, create/edit, and archive state with search and type filters, version and signature metadata, sectioned detail views, validation and change tracking, blocked-reason handling, confirmation state, and normalized submissions.
- Dashboard Stripe payment connection, collection, history, and detail/refund state with onboarding and capability summaries, point-of-sale gating, transaction filters and totals, grouped detail views, blocked-reason handling, and normalized collection/refund submissions.
- Dashboard class-session list, detail, create/edit, and cancel state with search, location and status filters, trainer and room labels, sectioned detail views, end-time validation, change tracking, scheduled-session locking, blocked-reason handling, confirmation state, and normalized submissions.
- Dashboard booking list, detail, cancel, staff manual booking, waitlist entry, and leave-waitlist state with member search, booking-status filters, waitlist-position and late-fee metadata, override handling, blocked-reason handling, confirmation state, and normalized submissions.
- Dashboard personal-training session list, detail, create/edit, and cancel state with feature-flag gating, trainer/status filters, sectioned detail views, time validation, change tracking, locked-state handling, blocked-reason handling, confirmation state, and normalized submissions.
- Gym-scoped location create, detail, update, list, room summary, public schedule filtering, and archive.
- Dashboard location screen logic for list/detail pages, address validation, map links, business hours, class room management, location-specific access rules, dashboard/public schedule switchers, multi-location member access summaries, and location reporting filters.
- Member database model plus create, update, list, archive, duplicate email, and duplicate barcode behavior.
- Membership plan database model plus create, update, list, archive, and monthly/yearly/one-time/package pricing fields.
- Class access limit settings on membership plans.
- Member membership assignment model and endpoint for existing members.
- Class type and class session models plus class session creation, public schedule API, capacity, waitlist capacity, trainer assignment, and room assignment fields.
- Class booking database model plus create/cancel booking endpoints.
- Waitlist join/leave endpoints, class capacity checks, active membership eligibility, plan class limit checks, automatic waitlist promotion, promotion notification outbox events, cancellation cutoff checks, late cancellation fee assessment, staff booking override flow, staff manual booking endpoint, and waitlist promotion unit coverage.
- Check-in database model, QR-code payload endpoint, barcode lookup, active-location validation, member/membership eligibility denials, class-booking validation, staff manual override flow, and check-in API/client coverage.
- Check-in dashboard screen logic for front desk search, QR scanning, barcode input, success/denied states, payment past-due warning state, check-in history, kiosk mode, kiosk auto-reset, and CSV export.
- Access control device, rule, and event models; device registration, API-key generation/rotation, heartbeat/offline detection, door unlock authorization, denied reason logging, event history endpoints, and dashboard screen logic for registration/rules/history.
- HTTP integration coverage for the class booking flow.
- Repository interfaces for the persistence boundary.
- Postgres repository adapter and transaction handling.
- Operations core Postgres migrations for gym settings, staff invites, members, membership plans, member memberships, class types, class sessions, bookings, booking policies, notification events, check-ins, and access control.
- Driver-based migration runner with `schema_migrations` tracking.
- Docker-backed Postgres API integration test runner is in place and now executes all `*.integration.test.ts` suites under `apps/api/src/modules/system`.
- Pre-commit hook path and precommit quality gate command.
- Unit tests for authentication, two-factor auth, permissions, tenant isolation, gym settings, dashboard onboarding, locations, dashboard location logic, roles, custom role creation/editing, staff access/audit/scheduling, staff invite creation/acceptance, dashboard staff list/profile/create/edit forms/status flow/invite email sending/trainer visibility/trainer specialties/trainer bio/trainer profile image/staff availability/shift calendar/shift conflicts/staff tasks, dashboard member list/profile/search/status-badge/contact-section/emergency-contact-section/notes-section logic, dashboard lead list/profile/search/conversion logic, dashboard membership-plan list/detail/create-edit/archive logic, dashboard contracts-and-waivers list/detail/create-edit/archive logic, dashboard Stripe payment connection/collection/history/detail-refund logic including limited-capability, validation-error, filtered-empty, and refund-blocking edge cases, dashboard staff invite and staff access logic, restricted staff views, dashboard shell layout/navigation/global search/home/page header/data table/filter drawer/confirmation modal/detail drawer/toast notification center/date range picker/CSV upload/image upload/mobile navigation/account menu, members, member memberships, membership plans, class scheduling, booking eligibility, cancellation policy, late fees, staff overrides, check-ins, check-in dashboard screen logic, access control, access-control dashboard screen logic, shared UI, frontend routing, dashboard auth flow, dashboard navigation permission guards, and API-client token refresh/location/staff/roles/member/lead/membership-plan routes with shared-member-route lead create and convert coverage plus membership-plan list/create/update/archive coverage.
- Full HTTP system-flow tests for the backend process, including operations core endpoints.

Still ongoing after this milestone:

- Add complete frontend screens.
- Continue through member management UI, reminder/confirmation notifications, payments, reporting, and deployment modules from the spreadsheet.

## Verification

Last verified commands:

```bash
npm run precommit
npm run build
npm --silent run seed -w @gym-platform/api
npm run tracker:summary
```
