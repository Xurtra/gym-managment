# Bookings & Waitlists

This slice adds class booking and waitlist backend logic behind the existing class schedule, tenant, and role systems.

## Rules

- A class session must be scheduled and in the future to accept bookings or waitlist joins.
- A member must belong to the gym, have an active or trial profile status, and have an active or trialing membership assignment.
- A member can have only one active booked or waitlisted spot per class session.
- Direct booking is allowed until `classSession.capacity` is reached.
- Direct booking must stay within the member's active plan class access limits.
- Waitlist joining is allowed only after class capacity is full and until `classSession.waitlistCapacity` is reached.
- Cancelling a booked spot promotes the earliest waitlisted member into a booked spot.
- Promotion creates a pending `waitlist_promoted` notification event.
- Cancellations inside a class session's cancellation cutoff are marked late.
- Late cancellations receive the class session's configured late cancellation fee.
- Staff manual bookings can override capacity, eligibility, or plan limits when an override reason is provided.
- Leaving the waitlist cancels that waitlist spot and compacts waitlist positions.

## Storage

`003_bookings_waitlists.sql` adds `class_bookings` with status, booked time, cancellation time, promotion time, and waitlist position fields. A partial unique index prevents duplicate active bookings or waitlist spots for the same member and class session.

`005_booking_policies.sql` adds class-session cancellation policy fields, booking late-fee and staff-override metadata, and a `notification_events` outbox table for waitlist promotion notifications.

## Endpoints

- `GET /gyms/:gymId/class-sessions/:sessionId/bookings`
- `POST /gyms/:gymId/class-sessions/:sessionId/bookings`
- `POST /gyms/:gymId/class-sessions/:sessionId/bookings/manual`
- `DELETE /gyms/:gymId/class-bookings/:bookingId`
- `POST /gyms/:gymId/class-sessions/:sessionId/waitlist`
- `DELETE /gyms/:gymId/class-bookings/:bookingId/waitlist`

## Not Yet Covered

Reminder triggers, confirmation email/SMS delivery, and attendance/check-in links are still future rows.
