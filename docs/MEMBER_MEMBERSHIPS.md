# Consumer Entitlements

This slice is the v1 entitlement bridge between consumer profiles and membership plans. The database table remains `member_memberships` for compatibility, but the domain now treats assignments as consumer entitlements.

## Model

`member_memberships` records:

- consumer/member
- plan
- status
- start date
- optional end date
- optional cancellation date

Active entitlement checks use assignments with `active` or `trialing` status, a start date at or before the current time, and no expired end date. Monthly and yearly plans derive the `member` segment. One-time and package plans derive the `customer` segment.

## Endpoints

- `GET /gyms/:gymId/consumers/:consumerId/memberships`
- `POST /gyms/:gymId/consumers/:consumerId/memberships`
- `GET /gyms/:gymId/members/:memberId/memberships`
- `POST /gyms/:gymId/members/:memberId/memberships`

Creating an assignment requires the consumer and plan to belong to the same gym. Archived consumers and archived plans cannot receive new assignments. Member endpoints remain compatibility aliases over the same service.

## Plan Limits

One-time plans default to `classAccessLimit: 1` when no explicit limit is supplied. Package plans must provide `classAccessLimit`. Monthly and yearly plans may omit the limit for unlimited class booking capacity.

## Dashboard

The consumer/member dashboard profile state in `frontend/dashboard/src/members` consumes these records to build:

- membership history rows ordered by active or current state first
- per-membership status labels, active flags, and date-range labels
- membership summary counts for active, trialing, paused, cancelled, and expired assignments
- empty membership state and profile-level membership summary labels
- overlapping Lead, Customer, and Member segment badges and counts

The membership-plan dashboard state in `frontend/dashboard/src/membershipPlans` works against the same plan records before and during assignment, and now covers:

- plan list filtering and summary counts across active plan inventory
- plan detail sections for pricing, access, settings, and history
- create/edit validation and normalized submission state for assignable plans
- archive flow state that removes plans from future assignment while preserving history rows

The Leads & CRM dashboard state in `frontend/dashboard/src/leads` uses the same consumer model ahead of plan assignment. Lead conversion updates `leadStage` to `converted`, and lead/customer/member overlap remains valid when a consumer also holds active entitlements.

The Stripe Payments dashboard state in `frontend/dashboard/src/payments` uses the same member and membership context to drive front-desk payment collection, history review, and refund workflows. That keeps payment follow-up tied to the same active-member records and standing checks that determine whether a member can continue through the broader membership-assignment and profile flows.

The check-in dashboard state in `frontend/dashboard/src/checkIns` uses the same member and membership context to drive front-desk eligibility review, denied-state messaging, and history visibility. That keeps check-in decisions tied to the same active or trialing assignment rules that govern broader membership standing.

## Booking And Access Eligibility

Class bookings now require:

- consumer record status is `active`
- at least one active/trialing entitlement assignment
- available plan class access when all active plans define `classAccessLimit`

If any active plan has no `classAccessLimit`, the consumer is treated as unlimited for active upcoming booked classes. If all active plans have limits, the limits are summed.

General facility check-ins and all-active access rules require an active recurring monthly/yearly entitlement. Class check-ins and class bookings can use active recurring, one-time, or package entitlements. Customer-only consumers can unlock a door only when a matching explicit plan access rule exists.
