# Locations

This slice completes the dashboard and public-schedule location layer on top of the existing gym-scoped location API.

## Backend

- `LocationService.get` returns an active location inside a gym scope.
- `LocationService.listRooms` derives location room names from class sessions with `roomName`, including session count and next session time.
- `ClassScheduleService.publicSchedule` accepts an optional `locationId` filter and validates that the location belongs to the public gym.

API routes:

- `GET /gyms/:gymId/locations`
- `GET /gyms/:gymId/locations/:locationId`
- `GET /gyms/:gymId/locations/:locationId/rooms`
- `POST /gyms/:gymId/locations`
- `PATCH /gyms/:gymId/locations/:locationId`
- `DELETE /gyms/:gymId/locations/:locationId`
- `GET /public/gyms/:gymSlug/schedule?from=<iso>&to=<iso>&locationId=<id>`

## Dashboard Modules

Framework-neutral dashboard state lives under `frontend/dashboard/src/locations`:

- `list.ts` builds the active location list page with archived counts.
- `detail.ts` builds the location detail state with map links, address validation, hours, rooms, and access rules.
- `address.ts` validates address fields and creates Google Maps links.
- `hours.ts` builds a location-specific business hours editor and invalid-range state.
- `rooms.ts` builds room-management state from class-session room names.
- `access.ts` builds location-scoped access-rule views and member multi-location access summaries.
- `switchers.ts` builds dashboard and public schedule location switchers, including selected dashboard/public context and empty-state handling when no active locations exist.
- `reporting.ts` builds location-based reporting filters.

## Tests

- `frontend/dashboard/src/locations/locationDashboard.test.ts`
- `backend/api/src/modules/locations/location.service.test.ts`
- `backend/api/src/modules/classes/classSchedule.service.test.ts`
- `backend/api/src/modules/system/system-flow.test.ts`
- `packages/api-client/src/apiClientAuth.test.ts`
