# Staff Invites

This slice adds staff invite creation with role selection and invite acceptance.

## Backend

- `StaffInvite` records are gym-scoped and store email, selected role, inviter, token hash, status, expiry, and timestamps.
- Invite tokens are generated once and returned only at creation time; the stored value is hashed.
- Invite creation validates that the role belongs to the gym, rejects owner/member-role invites, rejects duplicate pending invites, and rejects existing users who already have gym access.
- Pending invites automatically transition to `expired` when listed or checked after their expiry.
- Invite acceptance validates the token, creates a new active user or verifies the password for an existing invited user, creates the gym-user membership with the selected role, marks the invite accepted, and returns access/refresh tokens.

API routes:

- `GET /gyms/:gymId/roles`
- `GET /gyms/:gymId/staff/invites`
- `POST /gyms/:gymId/staff/invites`
- `POST /staff/invites/accept`

## Dashboard

Framework-neutral dashboard state lives under `apps/dashboard/src/staff`:

- `buildStaffInviteFlow` builds the email field, role-selection options, pending invite table, and send state.
- `createStaffInviteSubmission` normalizes email and optional message text before API submission.
- `buildStaffInviteAcceptScreen` builds the accept-invite form state.
- `createStaffInviteAcceptanceSubmission` normalizes the token and name fields before API submission.

## Persistence

`010_staff_invites.sql` creates `staff_invites` with a partial unique index for one pending invite per gym/email pair.

## Tests

- `apps/api/src/modules/roles/role.service.test.ts`
- `apps/api/src/modules/system/system-flow.test.ts`
- `apps/dashboard/src/staff/staffInviteDashboard.test.ts`
- `packages/api-client/src/apiClientAuth.test.ts`
