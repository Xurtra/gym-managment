# Reservations & Reservable Resources

This slice introduces the bridge layer for facility reservations without rewriting existing class bookings.

## Model

- Reservable resources represent physical things that can be allocated: rooms, courts, pool lanes, massage chairs, or scarce equipment.
- Resources can be grouped with child units, such as `Courts > Court 2`.
- Non-scarce equipment stays as resource amenity metadata.
- Resource allocations block a resource for either a class session or a facility reservation.
- Facility reservations attach one customer/member to one resource time window.
- Class waitlists remain class-only.

## Behavior

- Exclusive resources hard-block overlapping allocations.
- Shared resources allow overlaps until configured capacity is reached.
- Staff can override conflicts with an override reason.
- Resource slot rules control minimum duration, maximum duration, increments, and buffers.
- Resource hours default from the location unless resource-specific hours are configured.
- Facility reservation price, payment requirement, and confirmation mode are snapshotted from the resource when booked.
- Facility cancellation policy is separate from class late-cancellation behavior.

## API

- `GET /gyms/:gymId/resources`
- `POST /gyms/:gymId/resources`
- `PATCH /gyms/:gymId/resources/:resourceId`
- `DELETE /gyms/:gymId/resources/:resourceId`
- `GET /gyms/:gymId/resources/:resourceId/availability?from=<iso>&to=<iso>`
- `POST /gyms/:gymId/class-sessions/:sessionId/resource-allocations`
- `GET /gyms/:gymId/facility-reservations`
- `POST /gyms/:gymId/facility-reservations`
- `GET /gyms/:gymId/facility-reservations/:reservationId`
- `DELETE /gyms/:gymId/facility-reservations/:reservationId`

## Tests

- `backend/api/src/modules/reservations/reservationResource.service.test.ts`
- `frontend/dashboard/src/reservations/reservationDashboard.test.ts`
