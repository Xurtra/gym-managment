# Operations Core

This slice adds the first gym operations modules behind the existing tenant and role system.

## Modules

- `members` - member profile lifecycle with create, update, list, archive, duplicate email checks, and duplicate barcode checks.
- `membershipPlans` - plan lifecycle with monthly, yearly, one-time, and package billing intervals.
- `memberMemberships` - assignment of active plans to existing members for membership history and booking eligibility.
- `classes` - class type creation, class session scheduling, capacity/waitlist settings, trainer membership validation, and public schedule lookup.

## Persistence

The second migration, `002_operations_core.sql`, adds:

- `members`
- `membership_plans`
- `member_memberships`
- `class_types`
- `class_sessions`

Both in-memory and Postgres repositories implement the same repository interfaces for these models. Public schedule queries only return scheduled sessions attached to public class types.

## Seed Data

`npm run seed -w @gym-platform/api` creates a demo owner, gym, two locations, trainer, front desk user, pending staff invite, membership plans, members, class type, class sessions, location room summaries, and access rules. Set `PERSISTENCE_DRIVER=postgres` and `DATABASE_URL` to seed Postgres after running migrations.

The seed is intended for a clean development database.

## Verification

Coverage now includes module-level tests for members, plans, and classes, plus an HTTP system flow that exercises the operations endpoints with auth, tenant access, permissions, and the public schedule route.
