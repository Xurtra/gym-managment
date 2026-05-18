# Gym Settings & Onboarding

This slice adds gym account settings and onboarding state for the dashboard.

## Backend

Gym records now support:

- `logoUrl`
- `brandColors`
- `businessInfo`
- gym-level `operatingHours`
- `featureFlags`
- `onboardingCompletedSteps`
- timezone and locale settings

API routes:

- `GET /gyms/:gymId`
- `PATCH /gyms/:gymId`

The routes enforce tenant access and `gym:read` or `gym:update`.

## Dashboard Modules

Framework-neutral dashboard state lives under `apps/dashboard/src/gymSettings`:

- profile settings page
- logo upload flow state
- brand color settings
- business information form
- timezone and locale settings
- operating hours editor
- feature flag settings
- onboarding checklist
- onboarding wizard steps
- onboarding progress indicator
