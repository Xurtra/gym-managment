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
- Dashboard staff list page state with search, role/status filters, summary counts, row actions, staff profile page state with identity details and audit history, create/edit staff member form state with role selection, change detection, and email validation, staff active/inactive status flow state, staff invite flow state with email normalization, staff invite email sending flow state, trainer public visibility setting, trainer specialties editor, trainer bio editor, trainer profile image upload, staff schedule availability model, staff availability editor, staff shift calendar view, staff shift conflict detection, staff task assignment model, staff task list view, staff task completion flow, staff-role selection, pending invite list, invite acceptance form, custom role create/edit forms, staff permission editing/removal state, trainer/front-desk restricted views, and submit eligibility.
- Dashboard member list and profile page state with reusable member status badges, dedicated contact-information, emergency-contact, and member-notes sections, search, status/tag filters, summary counts, contact/tag labels, detail sections, membership history rows, profile actions, permission-aware create/import controls, and dedicated member-directory search by name, email, phone, and barcode.
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
- Optional Docker-backed Postgres API integration test path.
- Pre-commit hook path and precommit quality gate command.
- Unit tests for authentication, two-factor auth, permissions, tenant isolation, gym settings, dashboard onboarding, locations, dashboard location logic, roles, custom role creation/editing, staff access/audit/scheduling, staff invite creation/acceptance, dashboard staff list/profile/create/edit forms/status flow/invite email sending/trainer visibility/trainer specialties/trainer bio/trainer profile image/staff availability/shift calendar/shift conflicts/staff tasks, dashboard member list/profile/search/status-badge/contact-section/emergency-contact-section/notes-section logic, dashboard staff invite and staff access logic, restricted staff views, dashboard shell layout/navigation/global search/home/page header/data table/filter drawer/confirmation modal/detail drawer/toast notification center/date range picker/CSV upload/image upload/mobile navigation/account menu, members, member memberships, membership plans, class scheduling, booking eligibility, cancellation policy, late fees, staff overrides, check-ins, check-in dashboard screen logic, access control, access-control dashboard screen logic, shared UI, frontend routing, dashboard auth flow, dashboard navigation permission guards, and API-client token refresh/location/staff routes.
- Full HTTP system-flow tests for the backend process, including operations core endpoints.

Still ongoing after this milestone:

- Add Docker-backed API integration tests against real Postgres.
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
