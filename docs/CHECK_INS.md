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

The dashboard check-in flow lives under `apps/dashboard/src/checkIns` as framework-neutral TypeScript modules:

- `search.ts` builds the front desk member search state.
- `scanner.ts` builds QR scanner and barcode input states and check-in submissions.
- `screens.ts` builds front desk, success, denied, and past-due warning states.
- `history.ts` filters check-in history and exports CSV.
- `kiosk.ts` builds kiosk mode state and auto-reset behavior.

These modules are intentionally UI-framework independent. They give the next visual shell a tested contract for what each screen should display and submit.
