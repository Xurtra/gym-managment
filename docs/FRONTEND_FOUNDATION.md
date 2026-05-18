# Frontend Foundation

This slice adds the first frontend foundation layer without locking the repo into a visual framework.

## Shared UI

`packages/ui` exports framework-neutral models for:

- buttons
- inputs
- tables
- modals
- cards
- layouts
- loading states
- empty states
- error states
- error-boundary capture

## Routing

Base route tables and layout models now exist for:

- `apps/dashboard`
- `apps/member-portal`
- `apps/website-renderer`

The dashboard also has protected-route resolution so authenticated pages redirect to `/login` when no session exists. Protected dashboard routes can declare required permissions, and dashboard navigation is filtered against the current user's permission set so role-limited users only see reachable modules.

## Dashboard Shell

`apps/dashboard/src/shell` includes framework-neutral models for:

- sidebar state
- grouped module navigation
- global gym search across routes and permission-filtered gym entities
- top bar state
- dashboard homepage operational summary cards
- reusable page headers with breadcrumbs, actions, and tabs
- reusable data tables with sorting and pagination state
- reusable filter drawers with active counts and validation-aware actions
- reusable confirmation modals for primary and destructive actions
- reusable detail drawers with sections, actions, formatting, and empty states
- reusable toast notification centers with severity, queueing, actions, and dismiss controls
- reusable date range pickers with presets, validation, and apply/clear actions
- reusable CSV uploaders with file validation, required-column checks, previews, and template actions
- reusable image uploaders with type, size, dimension, aspect-ratio, preview, and alt-text handling
- content region state
- account menu profile/settings/logout actions
- mobile menu action state
- responsive mobile navigation state

## Auth Shell

`apps/dashboard/src/auth` includes screen models for:

- login
- registration
- forgot password
- reset password
- two-factor setup
- two-factor code verification
- recovery codes
- recovery-code login

It also includes session persistence helpers, refresh-token application, and forced logout behavior.

## API Client Refresh

`GymApiClient` accepts an optional token store. When a protected request receives `401`, it uses the refresh token once, stores the new tokens, retries the original request, and clears the session plus calls `onSessionExpired` if refresh fails.
