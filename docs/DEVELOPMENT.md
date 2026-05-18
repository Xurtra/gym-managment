# Development

## Pre-Commit Checks

The repository includes `.githooks/pre-commit`. The hook runs:

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
npm run build
npm run dev:api
npm run dev:worker
```

## Environment Files

Copy `.env.example` to `.env` for local development.

Environment file loading is layered by `NODE_ENV`:

- `development`: `.env`, then `.env.local`, then `.env.development`
- `test`: `.env`, then `.env.test`
- `staging`: `.env`, then `.env.staging`
- `production`: `.env`, then `.env.production`

Existing process environment variables still win over file-loaded values.
