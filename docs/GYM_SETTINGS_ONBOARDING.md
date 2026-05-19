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
- onboarding checklist, including the membership-plans setup step
- onboarding wizard steps, including membership-plan selection, Stripe payment-connection routing, and progress routing
- onboarding progress indicator with the next membership-plan or payment-connection step when it is still incomplete

The public website signup and checkout models in `apps/website-renderer/src` also depend on these gym settings. In particular, the `online_signup` feature flag and the set of active, public membership plans determine whether the public signup flow is available and which plans can proceed into checkout.
