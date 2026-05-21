# Staff Access

This slice adds staff permission editing, custom role creation/editing, staff access removal, audit logging, and restricted dashboard views.

## Backend

- `RoleService.listStaffAccess` returns gym staff with membership status and assigned role.
- `RoleService.createCustomRole` creates non-system gym roles with a custom name and selected permissions.
- `RoleService.updateCustomRole` edits custom role names and permissions while rejecting system-role edits.
- `RoleService.assignRole` now accepts an actor user ID, rejects owner/member role assignment, rejects self role changes, and records `staff_role_changed` audit entries when the role changes.
- `RoleService.removeStaffAccess` disables the target gym-user membership, rejects owner/self removal, and records `staff_access_removed` audit entries with an optional reason.
- Disabled staff memberships no longer grant permissions because `permissionsForUser` only honors active gym memberships.
- Custom roles reject reserved default role names and cannot include `platform:admin`.

API routes:

- `GET /gyms/:gymId/staff`
- `GET /gyms/:gymId/staff/audit`
- `POST /gyms/:gymId/roles`
- `PATCH /gyms/:gymId/roles/:roleId`
- `POST /gyms/:gymId/roles/assign`
- `DELETE /gyms/:gymId/staff/:userId`

## Dashboard

Framework-neutral staff access state lives under `frontend/dashboard/src/staff`:

- `buildStaffPermissionsScreen` builds editable staff rows, assignable role options, removal confirmation state, audit-trail state, summary counts, selected-staff context, locked-reason labels, and an empty state when no staff access records exist.
- `buildCustomRoleCreateScreen` and `buildCustomRoleEditScreen` build grouped permission toggles for custom roles, including permission-count summaries, per-group selection summaries, locked-role state, and role-name validation feedback.
- `createCustomRoleSubmission` trims role names, de-duplicates permissions, and strips `platform:admin`.
- `createStaffPermissionChangeSubmission` creates the role assignment payload.
- `createStaffAccessRemovalSubmission` normalizes the removal reason.
- `buildTrainerRestrictedView` and `buildFrontDeskRestrictedView` derive role-specific navigation and primary actions from the shared permission matrix, including active path, visible/hidden route counts, action counts, and summary labels for restricted dashboards.

Related staff-management dashboard models in the same module area also cover:

- trainer public visibility settings with eligibility checks, visibility labels, public URL previews, and normalized slug submission
- trainer specialties editing with duplicate detection, specialty counts, change summaries, and normalized submission
- trainer bio editing with character-limit validation, change tracking, summary state, and normalized submission
- trainer profile image upload state with square-headshot validation, current-image and preview summaries, and eligibility locks
- staff availability models and editor state with slot summaries, conflict detection, change tracking, and location selection
- staff shift calendar summaries with weekly grouping, staff/location filters, overlap flags, option counts, and coverage totals
- staff shift conflict reporting with blocking and warning summaries plus affected staff and shift details
- staff task assignment, task list, and task completion state with assignee filters, status and priority summaries, due-state labels, blocking reasons, and normalized submission

## Persistence

`011_staff_audit_logs.sql` creates `staff_audit_logs` for role-change and access-removal history. The repository boundary exposes `staffAuditLogs` for memory and Postgres drivers.

## Tests

- `backend/api/src/modules/roles/role.service.test.ts`
- `backend/api/src/modules/system/system-flow.test.ts`
- `frontend/dashboard/src/staff/staffInviteDashboard.test.ts`
- `packages/api-client/src/apiClientAuth.test.ts`
  Covers role/staff-access request paths, HTTP methods, auth headers, and request bodies for role listing, custom role create/update, role assignment, staff removal, audit listing, and staff invite flows.
