# Development

## Pre-Commit Checks

The repository includes a cross-platform Node-based `.githooks/pre-commit`. The hook runs:

```bash
npm run precommit
```

That command runs lint, type-check, and tests. `npm install` runs the `prepare` script, which configures Git to use `.githooks` when the directory is a Git repository. In non-Git environments it exits cleanly.

Manual setup:

```bash
git config core.hooksPath .githooks
```

## Useful Commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run test:e2e:observe
npm run build
npm run dev:api
npm run dev:worker
```

For developer-observable Playwright runs, use:

```bash
npm run test:e2e:observe -- e2e/auth.spec.ts -g "owner can register via API and log in via the dashboard UI"
```

That mode opens a headed browser, slows actions down for local observation, forces a single worker, and draws a cursor overlay over interacted elements. Tune it with `PLAYWRIGHT_OBSERVABLE_DELAY_MS` or disable the cursor with `PLAYWRIGHT_OBSERVABLE_CURSOR=0`.

Focused dashboard staff-management coverage is in:

```bash
npx vitest run frontend/dashboard/src/staff/staffInviteDashboard.test.ts
```

Focused dashboard member-management coverage is in:

```bash
npx vitest run frontend/dashboard/src/members/memberDashboard.test.ts
npx vitest run frontend/dashboard/src/members/memberSearch.test.ts
npx vitest run frontend/dashboard/src/members/memberStatusBadges.test.ts
npx vitest run frontend/dashboard/src/members/memberProfileSections.test.ts
```

Focused dashboard leads-and-CRM coverage is in:

```bash
npx vitest run frontend/dashboard/src/leads/leadsDashboard.test.ts
```

Focused dashboard membership-plan coverage is in:

```bash
npx vitest run frontend/dashboard/src/membershipPlans/membershipPlansDashboard.test.ts
```

Focused dashboard contracts-and-waivers coverage is in:

```bash
npx vitest run frontend/dashboard/src/contractsWaivers/contractsWaiversDashboard.test.ts
```

Focused dashboard Stripe-payments coverage is in:

```bash
npx vitest run frontend/dashboard/src/payments/paymentsDashboard.test.ts
```

Focused dashboard bookings-and-waitlists coverage is in:

```bash
npx vitest run frontend/dashboard/src/bookings/bookingsDashboard.test.ts
```

Focused dashboard personal-training coverage is in:

```bash
npx vitest run frontend/dashboard/src/personalTraining/personalTrainingDashboard.test.ts
```

Focused dashboard check-in coverage is in:

```bash
npx vitest run frontend/dashboard/src/checkIns/checkInDashboard.test.ts
```

Focused dashboard access-control coverage is in:

```bash
npx vitest run frontend/dashboard/src/accessControl/accessControlDashboard.test.ts
```

Focused public website signup-and-checkout coverage is in:

```bash
npx vitest run frontend/website-renderer/src/publicRoutes.test.ts
npx vitest run frontend/website-renderer/src/signup.test.ts
npx vitest run frontend/website-renderer/src/checkout.test.ts
```

## Environment Files

Copy `.env.example` to `.env` for local development.

Environment file loading is layered by `NODE_ENV`:

- `development`: `.env`, then `.env.local`, then `.env.development`
- `test`: `.env`, then `.env.test`
- `staging`: `.env`, then `.env.staging`
- `production`: `.env`, then `.env.production`

Existing process environment variables still win over file-loaded values.
