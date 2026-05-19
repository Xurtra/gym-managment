# Dashboard App

Staff dashboard workspace.

The first implemented dashboard slice is the check-in workflow. It is framework-neutral TypeScript for now so the search, scanner, result, kiosk, history, and export behavior can be tested before a visual shell is selected.

Implemented foundation/auth modules:

- Dashboard route table and layout state.
- Dashboard app shell with sidebar, top bar, content region, and mobile menu action state.
- Dashboard navigation grouped by module.
- Global gym search state for routes and permission-filtered gym entities.
- Dashboard homepage summary cards for operational metrics.
- Responsive mobile dashboard navigation state.
- Reusable page header state with breadcrumbs, actions, and tabs.
- Reusable data table state with sorting and pagination.
- Reusable filter drawer state with active counts and validation-aware actions.
- Reusable confirmation modal state for primary and destructive actions.
- Reusable detail drawer state with sections, actions, formatting, and empty states.
- Reusable toast notification center state with severity, queueing, actions, and dismiss controls.
- Reusable date range picker state with presets, validation, and apply/clear actions.
- Reusable CSV upload state with file validation, required-column checks, preview rows, and template action.
- Reusable image upload state with type, size, dimension, aspect-ratio, preview, and alt-text handling.
- Account menu state for profile, settings, and logout actions.
- Protected route resolution for authenticated pages.
- Permission-guarded dashboard navigation for role-aware menu visibility.
- Route loading and error states.
- Login, registration, forgot password, and reset password screen models.
- Two-factor setup, verification, recovery code, and recovery-login screen models.
- Session persistence, token refresh application, and forced logout state.

Implemented gym settings/onboarding modules:

- Profile settings state.
- Logo upload flow state.
- Brand color settings state.
- Business information form state.
- Timezone and locale settings state.
- Operating hours editor state.
- Feature flag settings state.
- Onboarding checklist, wizard step, and progress state.

Implemented location modules:

- Location list and detail page state.
- Address validation and map-link generation.
- Location-specific business hours editor state.
- Location room management state based on class-session rooms.
- Location-scoped access-rule state.
- Dashboard and public schedule location switchers.
- Multi-location member access summaries.
- Location-based reporting filters.

Implemented staff modules:

- Staff list page state with search, role/status filters, summary counts, table rows, and row actions.
- Staff profile page state with identity details, role/status metadata, permission-aware actions, and audit history.
- Create staff member form state with profile fields, role selection, email validation, and normalized submission.
- Edit staff member form state with change detection, locked-state handling, role selection, and normalized submission.
- Staff active/inactive status flow state with activate/deactivate permissions, locked protections, confirmation, and normalized submission.
- Staff invite form state with email/message normalization, role-selection context, pending-invite summaries, and empty-state handling.
- Staff invite email sending flow state with delivery status, retry/resend actions, selected/all sending, and normalized submission.
- Trainer public visibility setting with eligibility checks, visibility summaries, profile slug normalization, public URL preview, and normalized submission.
- Trainer specialties editor with specialty counts, change summaries, add/remove helpers, duplicate detection, and normalized submission.
- Trainer bio editor with paragraph normalization, character-limit validation, change tracking, summary state, and normalized submission.
- Trainer profile image upload state with square headshot validation, current-image and preview summaries, eligibility locks, and normalized submission.
- Staff schedule availability model and editor with weekly availability normalization, slot/conflict summaries, overlap detection, change tracking, location selection, and normalized submission.
- Staff shift calendar view with weekly grouping, staff/location filters, coverage totals, overlap flags, option counts, and shift navigation actions.
- Staff shift conflict detection with conflict summaries, invalid time, same-staff overlap, and outside-availability reports.
- Staff task assignment model, task list view, and completion flow with assignee filters, priority/status filters, due-state labels, summaries, row actions, completion blocking, and normalized submission.
- Role selection state that excludes owner/member-only roles.
- Pending invite list state.
- Staff invite acceptance form state with field-level models, completion summaries, validation feedback, and normalized submission.
- Staff permission editing state with assignable role options.
- Custom role creation and edit screen state with grouped permission toggles.
- Staff access removal confirmation and normalized reason submission.
- Trainer-only and front-desk-only restricted dashboard views.

Implemented member modules:

- Member list page state with search, status/tag filters, summary counts, filter-count metadata, table rows, contact/tag labels, empty states, create/import actions, and permission-aware row actions.
- Member profile page state with identity/contact/emergency/tags/notes sections, section and action counts, membership history rows, membership counts, membership summaries and summary labels, empty membership state, and permission-aware actions.
- Member directory search state with normalized matching by name, email, phone, and barcode plus matched-field summaries, result counts, selection metadata, and browse or found summaries.
- Member status-badge helpers for lead, trial, active, past due, frozen, cancelled, expired, and archived states, including category, check-in eligibility, sort order, and legend summary state, reused across member list, profile, and search rows.
- Member contact-information and emergency-contact section builders with completeness metadata, field counts, summary labels, and missing-state handling.
- Member notes section builder with normalized note text, character counts, preview text, summary labels, and empty-state handling.

Implemented leads and CRM modules:

- Lead list page state with lead-only filtering, search and tag filters, summary counts, filter-count metadata, detail routes, and permission-aware actions.
- Lead profile page state with contact, emergency-contact, tags, notes, section counts, tag summaries, and permission-aware actions.
- Lead directory search state with name, email, phone, and barcode matching plus result counts, selected-lead metadata, and browse or found summaries.
- Lead conversion state with target-status options, blocked-reason handling, submit eligibility, and normalized conversion submission.

Implemented membership plan modules:

- Membership plan list page state with search and billing-interval filters, summary counts, pricing and visibility labels, detail routes, empty states, and permission-aware actions.
- Membership plan detail page state with pricing, access, settings, and history sections plus visibility, renewal, archive state, and permission-aware actions.
- Membership plan create and edit screen state with field validation, change detection, archive locks, summary labels, and normalized submissions.
- Membership plan archive flow state with blocked-reason handling, confirmation modal state, pricing metadata, and permission-aware archive actions.

Implemented contracts and waivers modules:

- Contracts and waivers list page state with search and type filters, summary counts, version and signature labels, detail routes, empty states, and permission-aware actions.
- Contract or waiver detail page state with overview, signature, and history sections plus version, status, summary, and permission-aware actions.
- Contract or waiver create and edit screen state with title or version validation, change detection, archive locks, summary labels, and normalized submissions.
- Contract or waiver archive flow state with blocked-reason handling, confirmation modal state, type and version metadata, and permission-aware archive actions.

Implemented Stripe payments modules:

- Stripe connection state with connected, onboarding-required, limited, and read-only account summaries plus dashboard-link and onboarding actions.
- Stripe payment collection state with point-of-sale gating, member context, method selection, amount and receipt validation, blocked-reason handling, and normalized collection submissions.
- Stripe payment history state with query and status filters, transaction summaries, empty states, totals, and permission-aware collection actions.
- Stripe payment detail and refund state with grouped transaction sections, refundable-amount summaries, refund eligibility, blocked-reason handling, and normalized refund submissions.

Implemented class-scheduling modules:

- Class-session list page state with search, location and status filters, summary counts, trainer or room labels, visibility metadata, empty states, and permission-aware actions.
- Class-session detail page state with schedule, capacity, and operations sections plus duration, visibility, summary, and permission-aware actions.
- Class-session create and edit screen state with class type, location, and trainer selection, field validation, end-time checks, change tracking, locked-state handling, summary labels, and normalized submissions.
- Class-session cancel flow state with blocked-reason handling, scheduled-session guards, and confirmation modal state.

Implemented bookings and waitlists modules:

- Booking list page state with member search, booking-status filters, summary counts, waitlist-position labels, late-fee and override labels, empty states, and permission-aware actions.
- Booking detail page state with member, booking, and operations sections plus waitlist, cancellation, late-fee, override, summary, and permission-aware actions.
- Booking cancel flow state with blocked-reason handling, late-fee metadata, waitlist context, and confirmation modal state.
- Staff manual booking flow state with member selection, capacity or eligibility or plan-limit override options, required override reasons, blocked-reason handling, summary metadata, and normalized submissions.
- Waitlist entry flow state with capacity and waitlist-capacity gating, next-position metadata, duplicate active-spot blocking, summary state, and normalized submissions.
- Leave-waitlist flow state with waitlist-only status guards, blocked-reason handling, queue-position metadata, and confirmation modal state.

Implemented personal-training modules:

- Personal-training session list page state with feature-flag gating, member search, trainer/status filters, summary counts, empty states, and permission-aware actions.
- Personal-training session detail page state with member, schedule, and operations sections plus trainer, package, location, duration, summary, and permission-aware actions.
- Personal-training session create and edit screen state with member/trainer selection, time validation, change tracking, locked-state handling, summary labels, and normalized submissions.
- Personal-training session cancel flow state with blocked-reason handling, session metadata, and confirmation modal state.

Implemented check-in modules:

- Front desk member search screen model.
- QR scanner screen model and QR payload parsing.
- Barcode scanner input flow.
- Success and denied result screen models.
- Past-due warning state for denied check-ins.
- Check-in history filtering and sorting.
- Kiosk mode state with auto-reset scheduling.
- CSV export for check-in history.

Implemented access-control modules:

- Access device registration state.
- Access device list and offline count state.
- Access device API-key rotation state.
- Access rule editor state by plan and location.
- Access event history filtering and denied counts.
