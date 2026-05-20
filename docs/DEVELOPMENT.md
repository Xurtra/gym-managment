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
npm run setup:demo
npm run dev:api:postgres
npm run dev:frontend
npm run lint
npm run typecheck
npm test
npm run build
npm run dev:api
npm run dev:worker
```

## Stable Local Demo

Use the Postgres-backed demo flow when you want accounts, gyms, and members to survive API restarts:

```bash
npm install
npm run setup:demo
npm run dev:api:postgres
npm run dev:frontend
```

Open:

```text
http://127.0.0.1:5173/?gymSlug=demo-strength-club#/dashboard
```

Demo credentials:

```text
owner@example.com
Password123
```

`npm run setup:demo` requires Docker Desktop to be running. It starts Docker Compose services for Postgres and Redis, runs API migrations, and seeds the demo gym when `owner@example.com` is not already present. Use `npm run setup:demo -- --reset` to remove the local Docker database volume and recreate the demo from scratch.

The normal `npm run dev:api` command still uses the default memory-backed API unless environment variables override it. Memory mode is useful for quick tests, but any data created through the browser disappears when that API process restarts.

## Stripe Payments

Local development uses mock Stripe by default, so the Payments tab can connect an account, enable point of sale, collect payments, and refund payments without live Stripe credentials.

Real Stripe configuration is environment-driven:

```env
STRIPE_MOCK_MODE=false
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_ONBOARDING_REFRESH_URL=http://127.0.0.1:5173/?gymSlug=demo-strength-club#/dashboard
STRIPE_ONBOARDING_RETURN_URL=http://127.0.0.1:5173/?gymSlug=demo-strength-club#/dashboard
```

The backend stores Stripe account state and payment transactions in memory or Postgres. With `STRIPE_MOCK_MODE=false`, the Payments tab creates or refreshes an Express connected account and returns a Stripe-hosted onboarding link. After onboarding, Stripe sends `account.updated` to `POST /stripe/webhooks`; that webhook updates `chargesEnabled`, `payoutsEnabled`, and outstanding requirements locally.

Live manual-entry test payments create PaymentIntents on the connected account. Use a Stripe test PaymentMethod ID such as `pm_card_visa` in the Payments tab's "Stripe payment method ID" field to confirm a test payment server-side. If that field is blank, the API creates a pending PaymentIntent and returns its client secret for a future Stripe.js payment form. Refunds call Stripe and then update local state; Stripe `charge.refunded` webhooks also sync refund totals.

For local webhook testing, install the Stripe CLI and forward events:

```bash
stripe listen --forward-to localhost:4000/stripe/webhooks
```

Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

Focused dashboard staff-management coverage is in:

```bash
npx vitest run apps/dashboard/src/staff/staffInviteDashboard.test.ts
```

Focused dashboard member-management coverage is in:

```bash
npx vitest run apps/dashboard/src/members/memberDashboard.test.ts
npx vitest run apps/dashboard/src/members/memberSearch.test.ts
npx vitest run apps/dashboard/src/members/memberStatusBadges.test.ts
npx vitest run apps/dashboard/src/members/memberProfileSections.test.ts
```

Focused dashboard leads-and-CRM coverage is in:

```bash
npx vitest run apps/dashboard/src/leads/leadsDashboard.test.ts
```

Focused dashboard membership-plan coverage is in:

```bash
npx vitest run apps/dashboard/src/membershipPlans/membershipPlansDashboard.test.ts
```

Focused dashboard contracts-and-waivers coverage is in:

```bash
npx vitest run apps/dashboard/src/contractsWaivers/contractsWaiversDashboard.test.ts
```

Focused dashboard Stripe-payments coverage is in:

```bash
npx vitest run apps/dashboard/src/payments/paymentsDashboard.test.ts
```

Focused dashboard bookings-and-waitlists coverage is in:

```bash
npx vitest run apps/dashboard/src/bookings/bookingsDashboard.test.ts
```

Focused dashboard personal-training coverage is in:

```bash
npx vitest run apps/dashboard/src/personalTraining/personalTrainingDashboard.test.ts
```

Focused dashboard check-in coverage is in:

```bash
npx vitest run apps/dashboard/src/checkIns/checkInDashboard.test.ts
```

Focused dashboard access-control coverage is in:

```bash
npx vitest run apps/dashboard/src/accessControl/accessControlDashboard.test.ts
```

Focused public website signup-and-checkout coverage is in:

```bash
npx vitest run apps/website-renderer/src/publicRoutes.test.ts
npx vitest run apps/website-renderer/src/signup.test.ts
npx vitest run apps/website-renderer/src/checkout.test.ts
```

## Environment Files

Copy `.env.example` to `.env` for local development.

Environment file loading is layered by `NODE_ENV`:

- `development`: `.env`, then `.env.local`, then `.env.development`
- `test`: `.env`, then `.env.test`
- `staging`: `.env`, then `.env.staging`
- `production`: `.env`, then `.env.production`

Existing process environment variables still win over file-loaded values.
