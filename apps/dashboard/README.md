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
- Staff invite form state with email normalization.
- Staff invite email sending flow state with delivery status, retry/resend actions, selected/all sending, and normalized submission.
- Trainer public visibility setting with eligibility checks, profile slug normalization, public URL preview, and normalized submission.
- Trainer specialties editor with normalized specialties, add/remove helpers, duplicate detection, and normalized submission.
- Trainer bio editor with paragraph normalization, character-limit validation, dirty-state tracking, and normalized submission.
- Trainer profile image upload state with square headshot validation, current-image preview, eligibility locks, and normalized submission.
- Staff schedule availability model and editor with weekly availability normalization, overlap detection, dirty-state tracking, location selection, and normalized submission.
- Staff shift calendar view with weekly grouping, staff/location filters, coverage totals, overlap flags, and shift navigation actions.
- Staff shift conflict detection with invalid time, same-staff overlap, and outside-availability reports.
- Staff task assignment model, task list view, and completion flow with assignee filters, priority/status filters, due-state labels, summaries, row actions, completion blocking, and normalized submission.
- Role selection state that excludes owner/member-only roles.
- Pending invite list state.
- Staff invite acceptance form and submission state.
- Staff permission editing state with assignable role options.
- Custom role creation and edit screen state with grouped permission toggles.
- Staff access removal confirmation and normalized reason submission.
- Trainer-only and front-desk-only restricted dashboard views.

Implemented member modules:

- Member list page state with search, status/tag filters, summary counts, table rows, contact/tag labels, empty states, create/import actions, and permission-aware row actions.
- Member profile page state with identity/contact/emergency/tags/notes sections, membership history rows, membership summaries, empty membership state, and permission-aware actions.
- Member directory search state with normalized matching by name, email, phone, and barcode plus matched-field summaries.
- Member status-badge helpers for lead, trial, active, past due, frozen, cancelled, expired, and archived states, reused across member list, profile, and search rows.
- Member contact-information and emergency-contact section builders with completeness metadata and missing-state handling.
- Member notes section builder with normalized note text, character counts, preview text, and empty-state handling.

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
