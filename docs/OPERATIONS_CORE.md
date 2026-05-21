# Operations Core

This slice adds the first gym operations modules behind the existing tenant and role system.

## Modules

- `members` - member profile lifecycle with create, update, list, archive, duplicate email checks, and duplicate barcode checks.
- `membershipPlans` - plan lifecycle with monthly, yearly, one-time, and package billing intervals.
- `memberMemberships` - assignment of active plans to existing members for membership history and booking eligibility.
- `classes` - class type creation, class session scheduling, capacity/waitlist settings, trainer membership validation, and public schedule lookup.

## Dashboard Models

The dashboard member-management layer in `frontend/dashboard/src/members` now covers:

- member list state with search, status and tag filters, summary counts, filter-count metadata, and permission-aware actions
- member profile state with identity, contact, emergency-contact, tags, notes, section counts, action counts, and membership summaries
- member directory search state with result counts, selection metadata, and browse or found summaries
- reusable member status badges with category, check-in eligibility, sort order, and legend summary state
- dedicated contact-information, emergency-contact, and notes section builders with field or summary metadata

The dashboard leads-and-CRM layer in `frontend/dashboard/src/leads` now covers:

- lead list state with lead-only search and tag filters, summary counts, filter-count metadata, and permission-aware actions
- lead profile state with shared contact, emergency-contact, tags, notes, section counts, and tag summaries
- lead directory search state with result counts, selected-lead metadata, and browse or found summaries
- lead conversion state with target-status options, blocked reasons, and normalized submission

The dashboard membership-plan layer in `frontend/dashboard/src/membershipPlans` now covers:

- membership-plan list state with search and billing-interval filters, summary counts, pricing and visibility labels, detail routes, and permission-aware actions
- membership-plan detail state with pricing, access, settings, and history sections plus renewal and archive metadata
- membership-plan create and edit state with field validation, change tracking, summary labels, and normalized submissions
- membership-plan archive flow state with blocked reasons, pricing metadata, and confirmation state

The dashboard contracts-and-waivers layer in `frontend/dashboard/src/contractsWaivers` now covers:

- contracts-and-waivers list state with search and type filters, summary counts, version and signature labels, detail routes, and permission-aware actions
- contract-or-waiver detail state with overview, signature, and history sections plus version and status metadata
- contract-or-waiver create and edit state with title and version validation, change tracking, summary labels, and normalized submissions
- contract-or-waiver archive flow state with blocked reasons, type and version metadata, and confirmation state

The dashboard Stripe-payments layer in `frontend/dashboard/src/payments` now covers:

- Stripe connection state with onboarding and capability summaries, requirement counts, dashboard-link state, and permission-aware actions
- Stripe payment collection state with point-of-sale gating, member context, payment-method selection, amount and receipt validation, blocked reasons, and normalized collection submissions
- Stripe payment history state with query and status filters, transaction totals, empty states, and permission-aware collection actions
- Stripe payment detail and refund state with grouped transaction sections, refundable-amount summaries, blocked reasons, and normalized refund submissions

The dashboard bookings-and-waitlists layer in `frontend/dashboard/src/bookings` now covers:

- booking list state with member search, booking-status filters, summary counts, waitlist-position labels, late-fee metadata, and permission-aware actions
- booking detail state with member, booking, and operations sections plus waitlist, cancellation, late-fee, and override metadata
- booking cancel flow state with blocked reasons, confirmation state, and waitlist or late-fee context
- staff manual booking state with member selection, override options, required override reasons, summary metadata, and normalized submissions
- waitlist entry state with capacity and waitlist-capacity gating, next-position metadata, duplicate active-spot blocking, and normalized submissions
- leave-waitlist flow state with waitlist-only guards, blocked reasons, queue-position metadata, and confirmation state

The dashboard personal-training layer in `frontend/dashboard/src/personalTraining` now covers:

- session list state with feature-flag gating, member search, trainer and status filters, summary metadata, empty states, and permission-aware actions
- session detail state with member, schedule, and operations sections plus trainer, package, location, duration, and summary metadata
- session create and edit state with member/trainer selection, time validation, change tracking, locked-state handling, and normalized submissions
- session cancel flow state with blocked reasons, session metadata, and confirmation state

The dashboard check-in layer in `frontend/dashboard/src/checkIns` now covers:

- front desk search state with normalized member matching, result filtering, and selected-member context
- QR scanner and barcode-input state with normalized payload handling and check-in submission helpers
- success, denied, and past-due warning result state with class-booking and override metadata
- history state with filtering, sorting, totals, and CSV export formatting
- kiosk mode state with auto-reset scheduling and embedded result-screen state

The dashboard access-control layer in `frontend/dashboard/src/accessControl` now covers:

- access-device registration state with normalized naming, location selection, and submit eligibility
- access-device list and key-rotation state with offline counts, API-key preview metadata, rotation warnings, and status summaries
- access-rule editor state with location or plan selection, existing-rule summaries, and submit eligibility
- access-event history state with decision filtering, denied-count summaries, and sorted event visibility

The public website layer in `frontend/website-renderer/src` now covers:

- public site route and layout state
- public signup state with online-signup feature gating, public-plan filtering and selection, pricing and signup-fee summaries, and blocked or empty states
- public checkout state with selected-plan summaries, contact-field validation, checkout totals, unavailable-plan handling, and normalized signup submissions

## Persistence

The second migration, `002_operations_core.sql`, adds:

- `members`
- `membership_plans`
- `member_memberships`
- `class_types`
- `class_sessions`

Both in-memory and Postgres repositories implement the same repository interfaces for these models. Public schedule queries only return scheduled sessions attached to public class types.

## Seed Data

`npm run seed -w @gym-platform/api` creates a demo owner, gym, two locations, trainer, front desk user, pending staff invite, membership plans, members, class type, class sessions, location room summaries, and access rules. Set `PERSISTENCE_DRIVER=postgres` and `DATABASE_URL` to seed Postgres after running migrations.

The seed is intended for a clean development database.

## Verification

Coverage now includes module-level tests for members, plans, and classes, plus an HTTP system flow that exercises the operations endpoints with auth, tenant access, permissions, and the public schedule route.
