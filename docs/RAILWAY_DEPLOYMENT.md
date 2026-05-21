# Railway Deployment

This project should be deployed as two Railway services from the same GitHub repo:

- API service: Node backend
- Frontend service: Vite static app

Use the same Railway Postgres service for persistent data.

## API Service

Recommended Railway settings:

```text
Root directory: /
Build command: npm ci && npm run build:api
Pre-deploy command: npm run migrate:api
Start command: npm run start:api
Healthcheck path: /health
```

Required variables:

```env
NODE_ENV=production
PERSISTENCE_DRIVER=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
ACCESS_TOKEN_SECRET=<long-random-secret>
```

Stripe variables when using real Stripe:

```env
STRIPE_MOCK_MODE=false
STRIPE_SECRET_KEY=sk_test_or_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ONBOARDING_REFRESH_URL=https://<frontend-domain>/?gymSlug=demo-strength-club#/dashboard
STRIPE_ONBOARDING_RETURN_URL=https://<frontend-domain>/?gymSlug=demo-strength-club#/dashboard
STRIPE_SUBSCRIPTION_SUCCESS_URL=https://<frontend-domain>/?gymSlug=demo-strength-club#/dashboard
STRIPE_SUBSCRIPTION_CANCEL_URL=https://<frontend-domain>/?gymSlug=demo-strength-club#/dashboard
```

The API reads Railway's `PORT` automatically. `API_PORT` is only needed for local overrides.
The repo includes `railway.json` with the API build, pre-deploy migration, and start commands.

## Frontend Service

Recommended Railway settings:

```text
Root directory: /
Build command: npm ci && npm run build:frontend
Start command: npm run railway:frontend:start
```

Required variables:

```env
VITE_API_BASE_URL=https://<api-domain>
```

Set `VITE_API_BASE_URL` before building the frontend. Vite bakes this value into the compiled app.

## Database

The API service should reference the Postgres service variable instead of pasting credentials:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Migrations run through the API service pre-deploy command:

```bash
npm run migrate:api
```

Manual migration command:

```bash
DATABASE_URL=<database-url> PERSISTENCE_DRIVER=postgres npm run migrate:api
```

## Webhooks

Create a Stripe webhook endpoint pointing to:

```text
https://<api-domain>/stripe/webhooks
```

Subscribe to:

- `account.updated`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_intent.requires_action`
- `charge.refunded`
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

After rotating any exposed Railway database password, update the Postgres variable reference and redeploy the API service so the pre-deploy migration command runs against the new credentials.
