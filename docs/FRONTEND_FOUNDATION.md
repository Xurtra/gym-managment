# Frontend Foundation

This slice adds the first frontend foundation layer without locking the repo into a visual framework.

## Shared UI

`packages/ui` exports framework-neutral models for:

- buttons
- inputs
- tables
- modals
- cards
- layouts
- loading states
- empty states
- error states
- error-boundary capture

## Routing

Base route tables and layout models now exist for:

- `frontend/dashboard`
- `frontend/member-portal`
- `frontend/website-renderer`

The dashboard also has protected-route resolution so authenticated pages redirect to `/login` when no session exists. Protected dashboard routes can declare required permissions, dashboard navigation is filtered against the current user's permission set so role-limited users only see reachable modules, and restricted-role dashboard views can derive active navigation context plus visible and hidden route availability from the shared permission matrix.

## Public Website

`frontend/website-renderer/src` also includes framework-neutral public-site models for:

- route and layout state for the public website shell
- public signup state with online-signup feature gating, public-plan filtering and selection, pricing and signup-fee summaries, and blocked or empty states
- public checkout state with selected-plan summaries, contact-field validation, checkout totals, unavailable-plan handling, and normalized signup submissions

## Dashboard Shell

`frontend/dashboard/src/shell` includes framework-neutral models for:

- sidebar state
- grouped module navigation
- global gym search across routes and permission-filtered gym entities
- top bar state
- dashboard homepage operational summary cards
- reusable page headers with breadcrumbs, actions, and tabs
- reusable data tables with sorting and pagination state
- reusable filter drawers with active counts and validation-aware actions
- reusable confirmation modals for primary and destructive actions
- reusable detail drawers with sections, actions, formatting, and empty states
- reusable toast notification centers with severity, queueing, actions, and dismiss controls
- reusable date range pickers with presets, validation, and apply/clear actions
- reusable CSV uploaders with file validation, required-column checks, previews, and template actions
- reusable image uploaders with type, size, dimension, aspect-ratio, preview, and alt-text handling
- content region state
- account menu profile/settings/logout actions
- mobile menu action state
- responsive mobile navigation state

## Dashboard Staff

`frontend/dashboard/src/staff` also includes framework-neutral staff-management models for:

- trainer public visibility setting with eligibility checks, visibility summaries, profile slug normalization, and public URL preview
- trainer specialties editor with specialty counts, duplicate detection, change summaries, and normalized submission
- trainer bio editor with character-limit validation, change tracking, summary state, and normalized submission
- trainer profile image upload with square-headshot validation, current-image and preview summaries, eligibility locks, and normalized submission
- staff schedule availability models and editor state with slot summaries, conflict detection, change tracking, and location selection
- staff shift calendar view with weekly grouping, staff/location filters, overlap flags, option counts, and coverage summaries
- staff shift conflict reporting with blocking and warning summaries plus affected staff and shift details
- staff task assignment, task list, and task completion state with assignee filters, status and priority summaries, due-state labels, blocking reasons, and normalized submission

## Dashboard Members

`frontend/dashboard/src/members` also includes framework-neutral member-management models for:

- member list state with search, status and tag filters, summary counts, filter-count metadata, permission-aware actions, and empty states
- member profile state with identity, contact, emergency-contact, tags, notes, membership history, section counts, action counts, and membership summaries
- member directory search state with name, email, phone, and barcode matching plus result counts, selection metadata, and browse or found summaries
- member status badges with category, check-in eligibility, sort order, and legend summary state
- contact-information and emergency-contact section builders with completeness metadata, field counts, summary labels, and missing-state handling
- member notes section builders with normalized text, character counts, preview text, summary labels, and empty-state handling

## Dashboard Leads

`frontend/dashboard/src/leads` also includes framework-neutral leads-and-CRM models for:

- lead list state with lead-only search and tag filters, summary counts, filter-count metadata, detail routes, and permission-aware actions
- lead profile state with shared contact, emergency-contact, tags, notes, section counts, and tag summaries
- lead directory search state with name, email, phone, and barcode matching plus result counts, selected-lead metadata, and browse or found summaries
- lead conversion state with target-status options, blocked-reason handling, submit eligibility, and normalized submission

## Dashboard Membership Plans

`frontend/dashboard/src/membershipPlans` also includes framework-neutral membership-plan models for:

- membership-plan list state with search and billing-interval filters, summary counts, pricing and visibility labels, detail routes, and permission-aware actions
- membership-plan detail state with pricing, access, settings, and history sections plus archive and renewal metadata
- membership-plan create and edit state with field validation, change tracking, archive locks, summary labels, and normalized submissions
- membership-plan archive flow state with blocked reasons, pricing metadata, and shared confirmation-modal state

## Dashboard Contracts & Waivers

`frontend/dashboard/src/contractsWaivers` also includes framework-neutral contracts-and-waivers models for:

- contracts-and-waivers list state with search and type filters, summary counts, version and signature labels, detail routes, and permission-aware actions
- contract-or-waiver detail state with overview, signature, and history sections plus version and status metadata
- contract-or-waiver create and edit state with title and version validation, change tracking, archive locks, summary labels, and normalized submissions
- contract-or-waiver archive flow state with blocked reasons, type and version metadata, and shared confirmation-modal state

## Dashboard Stripe Payments

`frontend/dashboard/src/payments` also includes framework-neutral Stripe-payments models for:

- Stripe connection state with onboarding and capability summaries, requirement counts, dashboard-link state, and permission-aware actions
- Stripe payment collection state with point-of-sale gating, member context, payment-method selection, amount and receipt validation, blocked reasons, and normalized collection submissions
- Stripe payment history state with query and status filters, transaction totals, empty states, and permission-aware collection actions
- Stripe payment detail and refund state with grouped transaction sections, refundable-amount summaries, blocked reasons, and normalized refund submissions

## Dashboard Bookings & Waitlists

`frontend/dashboard/src/bookings` also includes framework-neutral bookings-and-waitlists models for:

- booking list state with member search, booking-status filters, summary counts, waitlist-position labels, late-fee metadata, and permission-aware actions
- booking detail state with member, booking, and operations sections plus waitlist, cancellation, late-fee, and override metadata
- booking cancel flow state with blocked reasons, confirmation state, and waitlist/late-fee context
- staff manual booking state with member selection, override options, required override reasons, summary metadata, and normalized submissions
- waitlist entry state with capacity and waitlist-capacity gating, next-position metadata, duplicate active-spot blocking, and normalized submissions
- leave-waitlist flow state with waitlist-only guards, blocked reasons, queue-position metadata, and confirmation state

## Dashboard Personal Training

`frontend/dashboard/src/personalTraining` also includes framework-neutral personal-training models for:

- personal-training session list state with feature-flag gating, member search, trainer and status filters, summary counts, empty states, and permission-aware actions
- personal-training session detail state with member, schedule, and operations sections plus trainer, package, location, duration, and summary metadata
- personal-training session create and edit state with member and trainer selection, time validation, change tracking, locked-state handling, summary labels, and normalized submissions
- personal-training session cancel flow state with blocked reasons, session metadata, and confirmation state

## Dashboard Check-Ins

`frontend/dashboard/src/checkIns` also includes framework-neutral check-in models for:

- front desk member-search state with normalized member matching, result filtering, and selected-member context
- QR scanner and barcode-input state with normalized payload handling and check-in submission helpers
- success, denied, and past-due warning result state with class-booking and override metadata
- check-in history state with filtering, sorting, totals, and CSV export formatting
- kiosk mode state with auto-reset scheduling and embedded result-screen state

## Dashboard Access Control

`frontend/dashboard/src/accessControl` also includes framework-neutral access-control models for:

- access-device registration state with normalized naming, location selection, and submit eligibility
- access-device list and key-rotation state with offline counts, API-key preview metadata, rotation warnings, and status summaries
- access-rule editor state with location or plan selection, existing-rule summaries, and submit eligibility
- access-event history state with decision filtering, denied-count summaries, and sorted event visibility

## Auth Shell

`frontend/dashboard/src/auth` includes screen models for:

- login
- registration
- forgot password
- reset password
- two-factor setup
- two-factor code verification
- recovery codes
- recovery-code login

It also includes session persistence helpers, refresh-token application, and forced logout behavior.

## API Client Refresh

`GymApiClient` accepts an optional token store. When a protected request receives `401`, it uses the refresh token once, stores the new tokens, retries the original request, and clears the session plus calls `onSessionExpired` if refresh fails.

The shared client also covers gym role listing, custom role create/update, staff role assignment, staff access removal, audit-log listing, and staff invite request construction so the dashboard's roles-and-permissions flows share one request layer.
