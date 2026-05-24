# Testing

The backend test suite has two layers.

## Unit-Level Service Tests

- Authentication service: registration, login, refresh-token rotation, password reset, email verification, two-factor setup, authenticator-code login, and recovery-code login.
- Tenant service: unique gym slugs and tenant isolation.
- Gym settings: profile, logo URL, brand colors, business info, operating hours, and onboarding progress updates.
- Role service: default permissions, custom role creation/editing including reservable-resource role toggles, role assignment, linked staff-resource creation/archive, role listing, staff access listing/removal, staff audit logging, staff invite creation with role selection, invite acceptance, and backfill of active staff in newly reservable roles.
- Staff schedule service: shift creation, active staff checks, location checks, staff-role validation, and overlap rejection.
- Location service: create, detail lookup, update, archive, duplicate-name protection, and class room summaries.
- Member service: create, update, archive, and duplicate email/barcode protection.
- Member membership service: plan assignment and membership history listing.
- Membership plan service: pricing intervals, update, archive, and duplicate-name protection.
- Class schedule service: class type creation, session scheduling, public schedule filtering, invalid time rejection, trainer validation, automatic linked trainer resource allocation, missing trainer-resource rejection, and trainer conflict blocking.
- Booking service: capacity checks, active membership eligibility, plan class limits, duplicate active spot rejection, waitlist join/leave, member eligibility, waitlist promotion, promotion notifications, cancellation cutoffs, late fees, and staff manual overrides.
- Reservation resource service: resource groups and child units, location-scoped and gym-scoped staff resource listing, amenity metadata, safe archive behavior, manual staff-link role validation, inherited rentable hours, slot min/max/increment rules, buffer conflicts, exclusive and shared-capacity allocation conflicts across class sessions and facility reservations including staff-linked trainer resources, override reason enforcement, class-only waitlist preservation, price/payment/POS snapshotting, staff-approval confirmation status, and facility-specific cancellation fees.
- Check-in service: QR/barcode lookup, member and membership denials, class booking validation, class-booking linkage, and staff eligibility overrides.
- Dashboard check-in modules: front desk search, QR scanner, barcode input, success/denied result states, past-due warning state, history filtering, kiosk auto-reset, and CSV export.
- Access control service: device registration, rule-based unlocks, denied reason logging, heartbeats, offline detection, and API-key rotation.
- Dashboard access-control modules: device registration/list/rotation state, rule editor state, and event history filtering.
- Shared UI package: primitive UI state models and error-boundary state.
- Frontend routing/auth/shell modules: dashboard protected routes, permission-guarded dashboard navigation, grouped module navigation, shell layout, global gym search, dashboard home summary cards, reusable page headers, reusable data tables, filter drawers, confirmation modals, detail drawers, toast notification centers, date range pickers, CSV uploaders, image uploaders, responsive mobile navigation, account menu, member portal routes, public site routes, auth screens, 2FA setup/verification/recovery-code screens, session persistence, token refresh application, and forced logout.
- Public website signup and checkout modules: online-signup feature gating, public-plan filtering and selection, empty and blocked states, contact-field validation, pricing and signup-fee summaries, checkout totals, unavailable-plan handling, and normalized public signup submissions.
- Dashboard gym settings/onboarding modules: profile settings, logo upload state, brand colors, business info, timezone/locale, operating hours, feature flags, onboarding checklist, wizard steps, and progress indicator.
- Dashboard location modules: list/detail state, address validation, map links, business hours, room management, access rules, location switchers, multi-location member access, and reporting filters.
- Dashboard staff modules: staff list search/filter/table state, staff profile detail/action/audit state, create/edit staff member form state, staff active/inactive status flow, staff invite form state, staff invite email sending state, trainer public visibility setting with visibility summaries, trainer specialties editor with specialty counts/change summaries, trainer bio editor with change/summary state, trainer profile image upload with preview/current-image summaries, staff schedule availability model/editor with slot/conflict summaries, staff shift calendar view with option counts and summary state, staff shift conflict detection with conflict summaries, staff task assignment/list/completion state with summary metadata, role selection, pending invite list, normalized invite submission, accept-invite form state, normalized acceptance submission, staff permission editing/removal state with summary/locked-state handling, custom role create/edit state with grouped permission summaries, reservable-resource role toggles, and validation, and trainer/front-desk restricted views with route/action count coverage.
- Dashboard member modules: member list search/filter/table state with summary and filter-count metadata, member profile detail sections with section/action counts and membership summaries, reusable member status badges with legend summary coverage, dedicated contact-information, emergency-contact, and notes sections with field or summary metadata, dedicated member search by name/email/phone/barcode with result and selection metadata, status/tag summaries, contact/tag labels, and permission-aware row actions.
- Dashboard leads modules: lead list state with lead-only search/tag filters and filter-count metadata, lead profile detail state with section and tag summaries, lead directory search with selected-lead metadata, and lead conversion state with target-status options, blocked reasons, and normalized submission.
- Dashboard membership-plan modules: list state with search and billing-interval filters, summary counts, pricing and visibility labels, detail routes, and permission-aware actions; detail state with pricing/access/settings/history sections; create/edit state with validation, change tracking, archive locks, and normalized submissions; and archive flow state with blocked reasons and confirmation coverage.
- Dashboard contracts-and-waivers modules: list state with search and type filters, summary counts, version and signature labels, detail routes, and permission-aware actions; detail state with overview/signature/history sections; create/edit state with title and version validation, change tracking, archive locks, and normalized submissions; and archive flow state with blocked reasons and confirmation coverage.
- Dashboard Stripe-payments modules: connection state with onboarding, limited-capability, and capability summaries; payment collection state with point-of-sale gating, member context, method selection, validation errors, and normalized submissions; history state with query and status filters plus totals and filtered-empty behavior; and payment detail/refund state with refundable-amount summaries, failed-payment or no-balance blocking, and normalized submissions.
- Dashboard bookings-and-waitlists modules: booking list state with member search, booking-status filters, waitlist-position and late-fee metadata, detail state with member/booking/operations sections, booking cancel state with confirmation and late-fee context, staff manual booking state with override validation and normalized submissions, waitlist entry state with capacity and queue-position metadata, and leave-waitlist state with waitlist-only blocking and confirmation coverage.
- Dashboard reservation modules: resource registry state including staff-linked resources, resource create submissions, resource availability/calendar state, staff facility reservation create/detail/cancel state, and class scheduler resource allocation submissions.
- Dashboard personal-training modules: session list state with feature-flag gating, member search, trainer/status filters, summary metadata, and empty states; detail state with member/schedule/operations sections; create/edit state with time validation, change tracking, locked-state handling, and normalized submissions; and cancel flow state with blocked reasons and confirmation coverage.
- API client: automatic refresh-token retry, token clearing when refresh fails, location detail/room routes, public schedule location filters, role listing, custom role create/update, staff access/audit routes, staff role assignment/removal, staff invite create/accept routes, member list/create/update/archive routes, lead create/convert flows through the shared member routes, member-membership list/assign routes, membership-plan list/create/update/archive routes, and reservation resource/facility reservation routes, including request path/method/body/auth coverage for the shared client methods.
- Postgres repository adapter: row mapping and transaction commit/rollback behavior.

## Full Process Test

`backend/api/src/modules/system/system-flow.test.ts` starts the API with a real HTTP server on an ephemeral port and tests the current backend process end to end:

- Owner registration and gym creation.
- Authenticated current-user lookup.
- Email verification.
- Gym-scoped location create, list, detail, update, room summary, and archive.
- Refresh-token rotation and refresh-token reuse rejection.
- Logout invalidation.
- Tenant isolation against an outside user.
- Custom role creation/editing, role assignment, staff access listing/removal, staff audit logging, role listing, staff invite creation by an owner, and invite acceptance by the invited staff user.
- Member, member-membership, membership-plan, class-type, class-session, public schedule with location filtering, booking, staff manual booking, waitlist, check-in, and access-control endpoints.
- Password reset with active refresh-token revocation.

Run everything with:

```bash
npm test
```

## Postgres Integration

The default suite skips the live Postgres flow. Run it with Docker:

```bash
npm run test:postgres
```

That command starts a disposable Postgres container, runs migrations, runs the gated Postgres API flow test, and tears the container down.

The Postgres flow also includes direct SQL seeding for role-gated staff resources. That coverage verifies that production-shaped rows inserted outside service helpers still map correctly through the repository layer and that the database enforces one active linked resource per staff user per gym.

## Playwright E2E

Run the standard browser suite with:

```bash
npm run test:e2e
```

Developers can also run the same suite in an observable mode that is easier to watch locally. Observable mode runs headed, uses a single worker, slows actions down, disables web-server reuse, and shows a visible cursor overlay over interacted elements.

Use it with:

```bash
npm run test:e2e:observe
```

You can still pass normal Playwright filters and file arguments:

```bash
npm run test:e2e:observe -- e2e/auth.spec.ts -g "owner can register via API and log in via the dashboard UI"
```

Observable mode is controlled by these environment variables:

- `PLAYWRIGHT_OBSERVABLE=1` enables headed developer-observable execution.
- `PLAYWRIGHT_OBSERVABLE_DELAY_MS=400` controls the pause between visible actions.
- `PLAYWRIGHT_OBSERVABLE_CURSOR=0` disables the cursor overlay if a developer only wants slowed actions.

New end-to-end specs should import `test` and `expect` from `e2e/observableTest.ts` so they automatically participate in the shared observability layer.
