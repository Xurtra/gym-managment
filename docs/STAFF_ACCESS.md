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

Framework-neutral staff access state lives under `apps/dashboard/src/staff`:

- `buildStaffPermissionsScreen` builds editable staff rows, assignable role options, removal confirmation state, and audit-trail state.
- `buildCustomRoleCreateScreen` and `buildCustomRoleEditScreen` build grouped permission toggles for custom roles.
- `createCustomRoleSubmission` trims role names, de-duplicates permissions, and strips `platform:admin`.
- `createStaffPermissionChangeSubmission` creates the role assignment payload.
- `createStaffAccessRemovalSubmission` normalizes the removal reason.
- `buildTrainerRestrictedView` and `buildFrontDeskRestrictedView` derive role-specific navigation and primary actions from the shared permission matrix.

## Persistence

`011_staff_audit_logs.sql` creates `staff_audit_logs` for role-change and access-removal history. The repository boundary exposes `staffAuditLogs` for memory and Postgres drivers.

## Tests

- `apps/api/src/modules/roles/role.service.test.ts`
- `apps/api/src/modules/system/system-flow.test.ts`
- `apps/dashboard/src/staff/staffInviteDashboard.test.ts`
- `packages/api-client/src/apiClientAuth.test.ts`
