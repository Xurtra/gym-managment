# API Documentation

Base URL in local development: `http://localhost:4000`

## Health

- `GET /health` - confirms the API process is alive.

## Authentication

- `POST /auth/register` - creates a platform user; optionally creates an owner gym when `gymName` is supplied.
- `POST /auth/login` - exchanges email and password for access and refresh tokens.
- `POST /auth/refresh` - rotates a refresh token and returns a new access token and refresh token.
- `POST /auth/logout` - revokes the supplied refresh token.
- `POST /auth/forgot-password` - creates a password reset token for an existing user.
- `POST /auth/reset-password` - validates a reset token, updates the password, and revokes active refresh tokens.
- `POST /auth/verify-email` - validates an email verification token.
- `POST /auth/resend-verification` - creates a new verification token for an unverified user.
- `POST /auth/2fa/setup` - creates an authenticator-app secret for the authenticated user.
- `POST /auth/2fa/verify` - verifies a six-digit authenticator code, enables 2FA, and returns recovery codes.
- `POST /auth/2fa/recovery-codes` - regenerates recovery codes for an authenticated user with 2FA enabled.
- `GET /auth/me` - returns the authenticated user, memberships, and active gym context.

When 2FA is enabled, `POST /auth/login` returns `twoFactorRequired: true` after a correct email and password until the caller supplies either `twoFactorCode` or `recoveryCode`.

Protected endpoints require:

```http
Authorization: Bearer <access-token>
```

## Gyms

- `POST /gyms` - creates a gym for the authenticated user and assigns the owner role.
- `GET /gyms/:gymId` - returns gym profile, brand, business, operating-hours, feature-flag, and onboarding settings.
- `PATCH /gyms/:gymId` - updates gym settings including profile, logo URL, brand colors, business info, timezone, locale, operating hours, feature flags, and onboarding progress.

Gym settings routes enforce tenant access and `gym:read` or `gym:update`.

## Public Website & Signup

- `GET /public/gyms` - returns active gym names, slugs, and optional logos for the staff sign-in selector.
- `GET /public/gyms/:gymSlug` - returns public gym profile, brand, business, locale, timezone, and feature-flag data for an active gym.
- `GET /public/gyms/:gymSlug/plans` - returns active, public, non-archived membership plans for an active gym.
- `POST /public/gyms/:gymSlug/signup` - creates an online-signup member and assigns the selected public plan when online signup is enabled.

Public website routes do not require authentication. Public signup requires the gym `online_signup` feature flag, validates the request with the shared public-signup schema, rejects archived or private plans, creates an active or trial member based on the selected plan trial settings, assigns the corresponding active or trialing membership, and returns the member, membership, plan summary, and amount due today. The current public checkout UI still remains framework-neutral state: it validates and normalizes signup form data before submitting to this backend endpoint or future payment collection points.

The current Stripe Payments dashboard slice does not add dedicated backend endpoints yet. It is modeled as framework-neutral dashboard state around existing gym feature flags, roles, members, and future Stripe integration points. In practice, payment collection and refund actions are expected to require `payment:write`, payment-history visibility is expected to require `payment:read`, and point-of-sale collection depends on the gym `point_of_sale` feature flag plus a connected Stripe account.

## Locations

- `GET /gyms/:gymId/locations` - lists active locations for a gym.
- `GET /gyms/:gymId/locations/:locationId` - returns an active location detail record.
- `GET /gyms/:gymId/locations/:locationId/rooms` - returns class room names inferred from scheduled class sessions at that location, including session counts and the next scheduled session time.
- `POST /gyms/:gymId/locations` - creates a gym location.
- `PATCH /gyms/:gymId/locations/:locationId` - updates a location.
- `DELETE /gyms/:gymId/locations/:locationId` - archives a location.

Location routes enforce tenant access and role permissions.

## Roles

- `GET /gyms/:gymId/roles` - lists roles available in the gym for role-selection, staff-permission, and invite flows.
- `POST /gyms/:gymId/roles` - creates a custom, non-system gym role with selected permissions.
- `PATCH /gyms/:gymId/roles/:roleId` - edits a custom role name and permissions.
- `POST /gyms/:gymId/roles/assign` - assigns an existing gym role to a gym user.

Role listing requires `staff:read`. Custom role creation, custom role editing, and role assignment require `staff:role_assign`. Custom roles reject reserved default role names and `platform:admin`. System roles cannot be edited. Role assignment rejects owner/member role assignments, rejects self role changes, and writes a staff audit log when the role changes. The shared API client covers role listing, custom role create/update, and role assignment request construction.

## Staff Access

- `GET /gyms/:gymId/staff` - lists staff access records with user, role, and membership status.
- `GET /gyms/:gymId/staff/audit` - lists staff access audit entries for role changes and access removals.
- `DELETE /gyms/:gymId/staff/:userId` - removes staff access by disabling the gym-user membership and writing an audit entry. Optional JSON body: `{ "reason": "..." }`.

Staff access listing and audit reads require `staff:read`. Removing staff access requires `staff:remove`, rejects owner removal, rejects self-removal, and preserves the disabled membership row for history. These routes back the dashboard staff-management screens for staff profile access state, audit history, restricted-role administration, and staff removal flows.

## Staff Invites

- `GET /gyms/:gymId/staff/invites` - lists staff invites for the gym.
- `POST /gyms/:gymId/staff/invites` - creates a pending staff invite for an email and selected role, returning a one-time invite token.
- `POST /staff/invites/accept` - accepts a pending invite token, creates or verifies the invited user, grants the selected gym role, marks the invite accepted, and returns a dashboard session.

Staff invite listing requires `staff:read`; creating invites requires `staff:invite`. Invite creation rejects owner/member-role invites, duplicate pending invites, roles outside the gym, and users who already have gym access. The shared API client covers invite list/create/accept request paths, methods, auth behavior, and request bodies used by the staff invite, role-selection, and access-management flows.

## Consumers

- `GET /gyms/:gymId/consumers` - lists active, non-archived consumer records for a gym, including derived lead, customer, and member segments.
- `POST /gyms/:gymId/consumers` - creates a consumer profile with optional contact, barcode, emergency-contact, notes, tags, profile image, and lead-stage fields.
- `PATCH /gyms/:gymId/consumers/:consumerId` - updates consumer profile fields, record status, and lead stage.
- `DELETE /gyms/:gymId/consumers/:consumerId` - archives a consumer.
- `GET /gyms/:gymId/consumers/:consumerId/memberships` - lists entitlement assignments for a consumer.
- `POST /gyms/:gymId/consumers/:consumerId/memberships` - assigns an existing membership plan as a recurring subscription or one-time/package customer entitlement.
- `GET /gyms/:gymId/consumers/:consumerId/activities` - lists CRM timeline activity for a consumer, newest first.
- `POST /gyms/:gymId/consumers/:consumerId/activities` - logs a call, email, text, reply, tour, trial, follow-up outcome, cancellation reason, or general note with optional follow-up timing.

Consumer routes enforce tenant access and `member:read` or `member:write`. Consumer responses include `leadStage`, `segments`, `isLead`, `isCustomer`, and `isMember`. `lead` comes from an open lead stage, `member` comes from active or trialing monthly/yearly assignments, and `customer` comes from active or trialing one-time/package assignments. Lead state alone never grants booking, check-in, or access eligibility.

## Members

- `GET /gyms/:gymId/members` - lists active, non-archived members for a gym.
- `POST /gyms/:gymId/members` - creates a member profile with optional contact, barcode, emergency-contact, notes, and tag fields.
- `PATCH /gyms/:gymId/members/:memberId` - updates member profile fields and status.
- `DELETE /gyms/:gymId/members/:memberId` - archives a member.
- `GET /gyms/:gymId/members/:memberId/memberships` - lists membership assignments for a member.
- `POST /gyms/:gymId/members/:memberId/memberships` - assigns an existing membership plan to an existing member.

Member routes are compatibility aliases over the same consumer service layer. They continue to return the legacy-compatible member shape while also exposing the new consumer segment fields for transition. Use `/consumers` for mixed lead/customer/member workflows and keep `/members` for subscription-focused or older integrations.

## Membership Plans

- `GET /gyms/:gymId/membership-plans` - lists active, non-archived membership plans.
- `POST /gyms/:gymId/membership-plans` - creates monthly, yearly, one-time, or package pricing plans.
- `PATCH /gyms/:gymId/membership-plans/:planId` - updates pricing and plan metadata.
- `DELETE /gyms/:gymId/membership-plans/:planId` - archives a plan.

Plan routes enforce tenant access and `plan:read` or `plan:write`. Monthly and yearly plans are recurring subscription entitlements. One-time and package plans are customer entitlements; one-time plans default to `classAccessLimit: 1`, while package plans must provide a `classAccessLimit`. These routes back the dashboard membership-plan flows for list filtering by billing interval, detail sections, create/edit validation and normalized submissions, and archive confirmation state. The shared API client covers membership-plan list/create/update/archive request paths, methods, auth behavior, and request bodies used by those dashboard flows.

## Classes

- `GET /gyms/:gymId/class-types` - lists class templates for a gym.
- `POST /gyms/:gymId/class-types` - creates a class type with default duration, capacity, waitlist capacity, and public visibility.
- `POST /gyms/:gymId/class-sessions` - creates a scheduled class session for a class type and location, with optional cancellation cutoff and late fee settings.
- `GET /public/gyms/:gymSlug/schedule?from=<iso>&to=<iso>&locationId=<id>` - returns public scheduled class sessions in the requested date range, optionally filtered to one active location.

Class management routes enforce tenant access and `class:read` or `class:write`. Public schedule access does not require authentication.

The current Personal Training dashboard slice does not add dedicated backend endpoints yet. It is modeled as framework-neutral dashboard state around existing gym feature flags, members, staff, and location records. In practice, personal-training scheduling is expected to depend on the gym `personal_training` feature flag plus existing member, trainer, and location data, with create/edit and cancel actions expected to require the same authenticated write access used by adjacent scheduling flows.

## Bookings & Waitlists

- `GET /gyms/:gymId/class-sessions/:sessionId/bookings` - lists bookings and waitlist spots for a class session.
- `POST /gyms/:gymId/class-sessions/:sessionId/bookings` - creates a class booking for a member when class capacity is available.
- `POST /gyms/:gymId/class-sessions/:sessionId/bookings/manual` - creates a staff manual booking; staff can provide override flags and an override reason.
- `DELETE /gyms/:gymId/class-bookings/:bookingId` - cancels a booked or waitlisted spot; booked cancellations promote the next waitlisted member when possible.
- `POST /gyms/:gymId/class-sessions/:sessionId/waitlist` - joins the waitlist when booking capacity is full and waitlist capacity is available.
- `DELETE /gyms/:gymId/class-bookings/:bookingId/waitlist` - removes a waitlisted member from the waitlist.

Booking routes enforce tenant access and `booking:read` or `booking:write`. Class eligibility requires an active consumer record plus an active or trialing recurring, one-time, or package entitlement. Plans with `classAccessLimit` cap active upcoming booked classes; plans without a limit are treated as unlimited for class bookings. Lead state alone does not grant eligibility. Cancellations inside a session cutoff are marked late and receive the configured late cancellation fee. Waitlist promotions create pending notification events.

## Check-Ins

- `GET /gyms/:gymId/members/:memberId/check-in-code` - returns a member QR payload plus barcode data when a barcode is stored.
- `GET /gyms/:gymId/members/:memberId/check-ins` - lists check-ins recorded for a member.
- `POST /gyms/:gymId/check-ins` - records a staff, barcode, or QR-code check-in for a gym location, with optional class-session validation.

Check-in routes enforce tenant access and `member:read` or `member:write`. General facility check-ins require an active or trialing monthly/yearly entitlement. Class check-ins may use an active or trialing recurring, one-time, or package entitlement and require an active booked class spot unless staff submits an eligibility override reason. Frozen, expired, cancelled, past-due, lead-only, and archived consumers are denied.

## Access Control

- `GET /gyms/:gymId/access/devices` - lists access devices and marks stale devices offline.
- `POST /gyms/:gymId/access/devices` - registers a door or kiosk device and returns its one-time API key.
- `POST /gyms/:gymId/access/devices/:deviceId/rotate-key` - rotates a device API key and returns the new one-time key.
- `GET /gyms/:gymId/access/rules` - lists access rules.
- `POST /gyms/:gymId/access/rules` - creates a location rule by membership plan or all active members.
- `GET /gyms/:gymId/access/events` - lists unlock and denied access events.
- `POST /access/device-events` - device endpoint that authorizes a member credential and logs the decision.
- `POST /access/device-heartbeats` - device endpoint that records heartbeat time and restores active status.

Staff access routes enforce tenant access and `access:read` or `access:write`. General `all active members` access rules require active recurring monthly/yearly entitlements. Customer-only one-time/package consumers remain denied unless an explicit plan access rule grants that customer plan. Device event and heartbeat routes authenticate with the device API key in the request body.
