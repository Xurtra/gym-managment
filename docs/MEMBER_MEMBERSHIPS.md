# Member Memberships

This slice adds the bridge between member profiles and membership plans.

## Model

`member_memberships` records:

- member
- plan
- status
- start date
- optional end date
- optional cancellation date

Active booking eligibility uses memberships with `active` or `trialing` status, a start date at or before the current time, and no expired end date.

## Endpoints

- `GET /gyms/:gymId/members/:memberId/memberships`
- `POST /gyms/:gymId/members/:memberId/memberships`

Creating an assignment requires the member and plan to belong to the same gym. Archived members and archived plans cannot receive new assignments.

## Dashboard

The member dashboard profile state in `frontend/dashboard/src/members` consumes these records to build:

- membership history rows ordered by active or current state first
- per-membership status labels, active flags, and date-range labels
- membership summary counts for active, trialing, paused, cancelled, and expired assignments
- empty membership state and profile-level membership summary labels

The membership-plan dashboard state in `frontend/dashboard/src/membershipPlans` works against the same plan records before and during assignment, and now covers:

- plan list filtering and summary counts across active plan inventory
- plan detail sections for pricing, access, settings, and history
- create/edit validation and normalized submission state for assignable plans
- archive flow state that removes plans from future assignment while preserving history rows

The Leads & CRM dashboard state in `frontend/dashboard/src/leads` uses the same member model ahead of plan assignment. Lead conversion moves a record from `lead` into `trial` or `active`, which then allows the existing member dashboard and membership-assignment flows to take over for plan history, eligibility, and profile summaries.

The Stripe Payments dashboard state in `frontend/dashboard/src/payments` uses the same member and membership context to drive front-desk payment collection, history review, and refund workflows. That keeps payment follow-up tied to the same active-member records and standing checks that determine whether a member can continue through the broader membership-assignment and profile flows.

The check-in dashboard state in `frontend/dashboard/src/checkIns` uses the same member and membership context to drive front-desk eligibility review, denied-state messaging, and history visibility. That keeps check-in decisions tied to the same active or trialing assignment rules that govern broader membership standing.

## Booking Eligibility

Class bookings now require:

- member profile status is `active` or `trial`
- at least one active/trialing membership assignment
- available plan class access when all active plans define `classAccessLimit`

If any active plan has no `classAccessLimit`, the member is treated as unlimited for active upcoming booked classes. If all active plans have limits, the limits are summed.
