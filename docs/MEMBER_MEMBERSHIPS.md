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

## Booking Eligibility

Class bookings now require:

- member profile status is `active` or `trial`
- at least one active/trialing membership assignment
- available plan class access when all active plans define `classAccessLimit`

If any active plan has no `classAccessLimit`, the member is treated as unlimited for active upcoming booked classes. If all active plans have limits, the limits are summed.
