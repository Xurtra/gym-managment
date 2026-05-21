# Check-Ins

This slice adds backend check-in logic for front desk staff, barcode scanners, and member QR payloads.

## Rules

- Check-ins are scoped to a gym and an active gym location.
- A member can be resolved by `memberId`, stored `barcode`, or QR payload in the form `gym:<gymId>:member:<memberId>`.
- Active and trial members are eligible for normal facility check-in.
- Frozen, expired, cancelled, and past-due members are recorded as denied check-ins.
- Members also need an active or trialing membership assignment whose date range includes the check-in time.
- Class check-ins require a scheduled class session and an active booked class booking for the member.
- Staff can override an eligibility denial only when an override reason is supplied.

## Persistence

`006_check_ins.sql` adds `check_ins` with gym, member, location, optional class session, optional booking, status, method, denial reason, staff override metadata, creator, and timestamps.

Both the in-memory and Postgres repositories expose:

- `createCheckIn`
- `listCheckInsForMember`
- `listCheckInsForGym`

## API

- `GET /gyms/:gymId/members/:memberId/check-in-code`
- `GET /gyms/:gymId/members/:memberId/check-ins`
- `POST /gyms/:gymId/check-ins`

The create endpoint accepts `memberId`, `barcode`, or `qrPayload`, plus `locationId`. `classSessionId` is optional for class attendance validation.

## Dashboard Flow Modules

The dashboard check-in flow lives under `frontend/dashboard/src/checkIns` as framework-neutral TypeScript modules:

- `search.ts` builds the front desk member search state.
- `scanner.ts` builds QR scanner and barcode input states and check-in submissions.
- `screens.ts` builds front desk, success, denied, and past-due warning states.
- `history.ts` filters check-in history and exports CSV.
- `kiosk.ts` builds kiosk mode state and auto-reset behavior.

These modules are intentionally UI-framework independent. They give the next visual shell a tested contract for what each screen should display and submit.

They also align with the member-management dashboard models in `frontend/dashboard/src/members`, which provide the member status badges, membership summaries, contact details, and searchable member directory data used to explain or route check-in eligibility decisions. The membership-plan dashboard models in `frontend/dashboard/src/membershipPlans` build on the same plan records used for active or trialing assignment eligibility, so plan pricing, access limits, archive state, and create/edit validation all stay consistent with the plan data that drives check-in qualification. The Leads & CRM dashboard models in `frontend/dashboard/src/leads` build on the same member records and status metadata, so lead search and lead conversion state can route prospective members into the active or trial statuses required before normal check-in eligibility begins. The Stripe Payments dashboard models in `frontend/dashboard/src/payments` use those same member records, permission gates, and point-of-sale flags to support the front-desk follow-up path when a denied or past-due check-in needs payment review before the member returns to good standing. The Personal Training dashboard models in `frontend/dashboard/src/personalTraining` build on the same member, trainer, and location context, so personal-training session scheduling stays aligned with the operational records front-desk staff use when reviewing a member's activity and eligibility state.
