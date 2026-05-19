# Access Control

This slice adds backend and dashboard logic for door/device access control.

## Rules

- Staff register devices against active gym locations.
- Device API keys are generated once and stored only as SHA-256 hashes plus a preview.
- Device keys can be rotated; old keys stop working immediately.
- Devices send heartbeats with their API key.
- Active devices with stale heartbeats are marked offline when staff lists devices.
- Access rules are scoped to a gym location and either a membership plan or all active members.
- Door authorization resolves a member by ID, barcode, or QR payload.
- Unlock requires an active or trial member, an active or trialing membership, and a matching access rule.
- Every device authorization creates an access event with `unlock` or `deny` plus a reason.

## API

- `GET /gyms/:gymId/access/devices`
- `POST /gyms/:gymId/access/devices`
- `POST /gyms/:gymId/access/devices/:deviceId/rotate-key`
- `GET /gyms/:gymId/access/rules`
- `POST /gyms/:gymId/access/rules`
- `GET /gyms/:gymId/access/events`
- `POST /access/device-events`
- `POST /access/device-heartbeats`

## Dashboard Modules

Framework-neutral dashboard state lives under `apps/dashboard/src/accessControl`:

- `devices.ts` builds device registration, offline list, and key rotation states.
- `rules.ts` builds the location/plan rule editor state.
- `events.ts` filters and sorts access event history.

These modules align with the membership-plan dashboard models in `apps/dashboard/src/membershipPlans`, so plan list filtering, detail metadata, create/edit validation, and archive state stay consistent with the active plan records available for location access-rule selection. They also align with the Stripe Payments dashboard models in `apps/dashboard/src/payments`, where the same front-desk permission gates and point-of-sale feature flags help determine which operational actions are available when staff need to resolve a denied member state before access is restored.
They also align with the check-in dashboard models in `apps/dashboard/src/checkIns`, where the same member credential resolution, denied-state reasoning, and front-desk location context support both facility check-in decisions and door-access authorization flows.
