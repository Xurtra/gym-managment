# Feature Test Coverage Tracker

Tracks test coverage for every implemented feature. Columns: **Unit** (service-layer), **Int** (HTTP integration / system-flow), **E2E** (Playwright browser).

Legend: ✅ covered · ❌ not covered · 🔲 not applicable

---

## Repo & Project Setup

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Monorepo structure (workspaces, TS references) | 🔲 | 🔲 | 🔲 |
| TypeScript configuration across all packages | 🔲 | 🔲 | 🔲 |
| Linting, formatting, pre-commit checks | 🔲 | 🔲 | 🔲 |
| Shared UI package (buttons, inputs, tables, modals, layouts) | ✅ | 🔲 | 🔲 |
| Shared validation package (Zod schemas) | 🔲 | 🔲 | 🔲 |
| Shared API client package | ✅ | 🔲 | 🔲 |
| Shared constants package | 🔲 | 🔲 | 🔲 |
| Environment variable loading | 🔲 | 🔲 | 🔲 |
| Local Docker setup (Postgres, Redis, API, worker) | 🔲 | 🔲 | 🔲 |
| Seed script (demo gym, members, staff, classes, plans) | 🔲 | 🔲 | 🔲 |
| Database migration workflow | 🔲 | 🔲 | 🔲 |
| Base backend server with health check endpoint | 🔲 | ✅ | 🔲 |
| Base frontend routing (dashboard, member portal, public) | ✅ | 🔲 | 🔲 |
| Global error boundary for frontend apps | ✅ | 🔲 | 🔲 |
| Shared loading, empty-state, error-state components | ✅ | 🔲 | 🔲 |

---

## Authentication

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| User registration endpoint | ✅ | ✅ | ❌ |
| Login endpoint (email + password) | ✅ | ✅ | ❌ |
| Password hashing and verification | ❌ | ✅ | 🔲 |
| Refresh token rotation | ✅ | ✅ | 🔲 |
| Logout (invalidates refresh tokens) | ✅ | ✅ | 🔲 |
| Forgot password request endpoint | ✅ | ✅ | 🔲 |
| Password reset with expiring token | ✅ | ✅ | 🔲 |
| Email verification token flow | ✅ | ✅ | 🔲 |
| Resend verification email endpoint | ✅ | ✅ | 🔲 |
| Authenticated current-user endpoint | ✅ | ✅ | 🔲 |
| Frontend login screen | ✅ | 🔲 | ❌ |
| Frontend registration screen | ✅ | 🔲 | ❌ |
| Frontend forgot password screen | ✅ | 🔲 | 🔲 |
| Frontend reset password screen | ✅ | 🔲 | 🔲 |
| Protected route wrapper | ✅ | 🔲 | ❌ |
| Session persistence on page refresh | ✅ | 🔲 | 🔲 |
| Automatic token refresh in API client | ✅ | 🔲 | 🔲 |
| Forced logout when refresh token expires | ✅ | 🔲 | 🔲 |
| Two-factor authentication setup screen | ✅ | ✅ | 🔲 |
| Two-factor authentication verification endpoint | ✅ | ✅ | 🔲 |
| Recovery code generation for 2FA | ✅ | ✅ | 🔲 |
| Recovery code login flow | ✅ | ✅ | 🔲 |

---

## Tenancy & Gym Accounts

Note: Stripe test mode is now expected to run as one platform account plus one connected account per gym. For any gym-scoped Stripe/POS test to work, that gym must have a persisted `stripeAccountId` in settings.

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Gym account creation endpoint | ✅ | ✅ | 🔲 |
| Tenant isolation (gym context from auth) | ✅ | ✅ | 🔲 |
| Database schema gym-ID scoping | ✅ | ✅ | 🔲 |
| Gym profile settings page | ✅ | ✅ | ❌ |
| Gym logo upload flow | ✅ | 🔲 | 🔲 |
| Gym brand color settings | ✅ | 🔲 | 🔲 |
| Gym business information form | ✅ | ✅ | 🔲 |
| Gym timezone and locale settings | ✅ | ✅ | 🔲 |
| Gym operating hours editor | ✅ | ✅ | 🔲 |
| Gym feature flag settings | ✅ | ✅ | 🔲 |
| Gym onboarding checklist state | ✅ | 🔲 | ❌ |
| Onboarding wizard — gym details step | ✅ | 🔲 | ❌ |
| Onboarding wizard — location details step | ✅ | 🔲 | ❌ |
| Onboarding wizard — membership plans step | ✅ | 🔲 | ❌ |
| Onboarding wizard — payment connection step | ✅ | 🔲 | 🔲 |
| Onboarding wizard — website template step | ✅ | 🔲 | 🔲 |
| Onboarding progress indicator | ✅ | 🔲 | ❌ |

---

## Locations

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Create gym location endpoint | ✅ | ✅ | 🔲 |
| Edit gym location endpoint | ✅ | ✅ | 🔲 |
| Archive gym location endpoint | ✅ | ✅ | 🔲 |
| Location list page | ✅ | 🔲 | ❌ |
| Location detail page | ✅ | 🔲 | ❌ |
| Address validation fields | ✅ | 🔲 | 🔲 |
| Map-link display per location | ✅ | 🔲 | 🔲 |
| Location-specific business hours editor | ✅ | 🔲 | 🔲 |
| Location-specific class room management | ✅ | ✅ | 🔲 |
| Location-specific access rules | ✅ | ✅ | 🔲 |
| Location switcher in dashboard | ✅ | 🔲 | 🔲 |
| Location switcher in public schedule | 🔲 | ✅ | 🔲 |
| Multi-location member access setting | ✅ | 🔲 | 🔲 |
| Location-based reporting filters | ✅ | 🔲 | 🔲 |

---

## Roles & Permissions

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Role database model | ✅ | ✅ | 🔲 |
| Permission database model | ✅ | ✅ | 🔲 |
| Default roles (owner, manager, trainer, front desk, sales, accountant) | ✅ | ✅ | 🔲 |
| Role assignment endpoint | ✅ | ✅ | 🔲 |
| Permission guard middleware (backend routes) | ✅ | ✅ | 🔲 |
| Frontend permission guard (dashboard nav) | ✅ | 🔲 | 🔲 |
| Staff invite flow with role selection | ✅ | ✅ | ❌ |
| Accept staff invite flow | ✅ | ✅ | ❌ |
| Edit staff permissions screen | ✅ | ✅ | 🔲 |
| Remove staff access flow | ✅ | ✅ | 🔲 |
| Audit log on staff role change | ✅ | ✅ | 🔲 |
| Trainer-only restricted view | ✅ | 🔲 | 🔲 |
| Front desk-only restricted view | ✅ | 🔲 | 🔲 |
| Custom role creation screen | ✅ | ✅ | 🔲 |
| Custom role edit screen | ✅ | ✅ | 🔲 |
| Role reservable-resource toggle | ✅ | 🔲 | 🔲 |
| Trainer role defaults to reservable resource creation | ✅ | 🔲 | 🔲 |
| Role-based linked staff-resource create/archive | ✅ | 🔲 | 🔲 |
| Active staff backfill for newly reservable roles | ✅ | 🔲 | 🔲 |
| Direct database seeded role/resource mapping | 🔲 | ✅ | 🔲 |

---

## Dashboard Shell

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Dashboard layout (sidebar, top bar, content) | ✅ | 🔲 | ❌ |
| Dashboard navigation grouped by module | ✅ | 🔲 | ❌ |
| Account menu (profile, settings, logout) | ✅ | 🔲 | ❌ |
| Global gym search component | ✅ | 🔲 | 🔲 |
| Dashboard home with operational summary cards | ✅ | 🔲 | ❌ |
| Responsive mobile dashboard navigation | ✅ | 🔲 | 🔲 |
| Reusable page header component | ✅ | 🔲 | 🔲 |
| Reusable data table (sorting, pagination) | ✅ | 🔲 | 🔲 |
| Reusable filter drawer | ✅ | 🔲 | 🔲 |
| Reusable confirmation modal | ✅ | 🔲 | 🔲 |
| Reusable detail drawer | ✅ | 🔲 | 🔲 |
| Reusable toast notification system | ✅ | 🔲 | 🔲 |
| Reusable date range picker | ✅ | 🔲 | 🔲 |
| Reusable CSV upload component | ✅ | 🔲 | 🔲 |
| Reusable image upload component | ✅ | 🔲 | 🔲 |

---

## Staff Management

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Staff list page | ✅ | 🔲 | ❌ |
| Staff profile page | ✅ | 🔲 | ❌ |
| Create staff member form | ✅ | 🔲 | 🔲 |
| Edit staff member form | ✅ | 🔲 | 🔲 |
| Staff active/inactive status flow | ✅ | 🔲 | 🔲 |
| Staff invite email sending flow | ✅ | 🔲 | 🔲 |
| Trainer profile public visibility setting | ✅ | 🔲 | 🔲 |
| Trainer specialties editor | ✅ | 🔲 | 🔲 |
| Trainer bio editor | ✅ | 🔲 | 🔲 |
| Trainer profile image upload | ✅ | 🔲 | 🔲 |
| Staff schedule availability model | ✅ | 🔲 | 🔲 |
| Staff availability editor | ✅ | 🔲 | 🔲 |
| Staff shift creation endpoint | ✅ | ✅ | 🔲 |
| Staff shift calendar view | ✅ | 🔲 | 🔲 |
| Staff shift conflict detection | ✅ | 🔲 | 🔲 |
| Staff task assignment model | ✅ | 🔲 | 🔲 |
| Staff task list view | ✅ | 🔲 | 🔲 |
| Staff task completion flow | ✅ | 🔲 | 🔲 |

---

## Member Management

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Member database model | ✅ | ✅ | 🔲 |
| Create member endpoint | ✅ | ✅ | ❌ |
| Edit member endpoint | ✅ | ✅ | ❌ |
| Archive member endpoint | ✅ | ✅ | ❌ |
| Member list page | ✅ | 🔲 | ❌ |
| Member profile page | ✅ | 🔲 | ❌ |
| Member search (name, email, phone, barcode) | ✅ | 🔲 | ❌ |
| Member status badges | ✅ | 🔲 | 🔲 |
| Member contact information section | ✅ | 🔲 | 🔲 |
| Member emergency contact section | ✅ | 🔲 | 🔲 |
| Member notes section | ✅ | 🔲 | 🔲 |

---

## Membership Plans

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Membership plan database model | ✅ | ✅ | 🔲 |
| Create membership plan endpoint | ✅ | ✅ | 🔲 |
| Edit membership plan endpoint | ✅ | ✅ | 🔲 |
| Archive membership plan endpoint | ✅ | ✅ | 🔲 |
| Plan pricing (monthly, yearly, one-time, package) | ✅ | ✅ | 🔲 |
| Class access limit settings | ✅ | ✅ | 🔲 |
| Plan assignment to existing members | ✅ | ✅ | ❌ |

---

## Class Scheduling

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Class type database model | ✅ | ✅ | 🔲 |
| Class schedule database model | ✅ | ✅ | 🔲 |
| Class session creation endpoint | ✅ | ✅ | 🔲 |
| Assign trainer to class session | ✅ | ✅ | 🔲 |
| Assign room to class session | ✅ | ✅ | 🔲 |
| Automatic linked trainer resource allocation | ✅ | 🔲 | 🔲 |
| Trainer resource conflict blocking | ✅ | 🔲 | 🔲 |
| Missing linked trainer resource rejection | ✅ | 🔲 | 🔲 |
| Class capacity setting | ✅ | ✅ | 🔲 |
| Class waitlist capacity setting | ✅ | ✅ | 🔲 |
| Public schedule API endpoint | ✅ | ✅ | 🔲 |

---

## Bookings & Waitlists

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Class booking database model | ✅ | ✅ | 🔲 |
| Create booking endpoint | ✅ | ✅ | ❌ |
| Cancel booking endpoint | ✅ | ✅ | ❌ |
| Booking eligibility (active membership, plan limits) | ✅ | ✅ | 🔲 |
| Booking capacity check | ✅ | ✅ | 🔲 |
| Waitlist join endpoint | ✅ | ✅ | 🔲 |
| Waitlist leave endpoint | ✅ | ✅ | 🔲 |
| Automatic waitlist promotion logic | ✅ | ✅ | 🔲 |
| Waitlist promotion notification | ✅ | ✅ | 🔲 |
| Booking cancellation cutoff rules | ✅ | ✅ | 🔲 |
| Late cancellation fee logic | ✅ | ✅ | 🔲 |
| Staff booking override flow | ✅ | ✅ | 🔲 |
| Staff manual booking flow | ✅ | ✅ | 🔲 |

---

## Reservations & Reservable Resources

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Reservable resource database model | ✅ | 🔲 | 🔲 |
| Resource group and child-unit setup | ✅ | 🔲 | 🔲 |
| Location-scoped resource listing | ✅ | ✅ | ✅ |
| Gym-scoped staff-linked resources | ✅ | 🔲 | 🔲 |
| Manual staff-resource linkage role validation | ✅ | 🔲 | 🔲 |
| One active linked staff resource database constraint | 🔲 | ✅ | 🔲 |
| Amenity metadata for non-scarce equipment | ✅ | 🔲 | 🔲 |
| Safe resource archive behavior | ✅ | 🔲 | 🔲 |
| Rentable hours inherit from location hours | ✅ | 🔲 | 🔲 |
| Slot minimum, maximum, and increment validation | ✅ | 🔲 | 🔲 |
| Buffer-aware resource conflict checks | ✅ | 🔲 | 🔲 |
| Exclusive resource conflict blocking | ✅ | 🔲 | 🔲 |
| Shared resource capacity conflict blocking | ✅ | 🔲 | 🔲 |
| Class-session resource allocation bridge | ✅ | 🔲 | 🔲 |
| Staff conflict override with required reason | ✅ | 🔲 | 🔲 |
| Staff-created facility reservation flow | ✅ | ✅ | ✅ |
| Facility reservations attached to one customer | ✅ | ✅ | ✅ |
| Facility reservations do not create class waitlists | ✅ | 🔲 | 🔲 |
| Staff-approval confirmation status for resources | ✅ | 🔲 | 🔲 |
| Price/payment requirement snapshot at booking | ✅ | 🔲 | 🔲 |
| POS/payment reference state exposure | ✅ | ✅ | ✅ |
| Facility-specific cancellation fee policy | ✅ | 🔲 | 🔲 |
| Resource availability lookup | ✅ | ✅ | ✅ |
| Dashboard resource registry and availability state | ✅ | 🔲 | 🔲 |
| Dashboard facility reservation create/detail/cancel state | ✅ | 🔲 | ✅ |
| Dashboard class resource allocation submission | ✅ | 🔲 | 🔲 |
| API client reservation resource routes | ✅ | 🔲 | 🔲 |

---

## Check-Ins

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Check-in database model | ✅ | ✅ | 🔲 |
| Member QR code generation endpoint | ✅ | ✅ | 🔲 |
| Member barcode value storage | ✅ | ✅ | 🔲 |
| Front desk check-in search screen | ✅ | 🔲 | ❌ |
| QR scanner check-in screen | ✅ | 🔲 | ❌ |
| Barcode scanner input flow | ✅ | 🔲 | 🔲 |
| Check-in eligibility rules | ✅ | ✅ | 🔲 |
| Payment past-due warning on check-in | ✅ | ✅ | 🔲 |
| Membership frozen denial on check-in | ✅ | ✅ | 🔲 |
| Membership expired denial on check-in | ✅ | ✅ | 🔲 |
| Location access validation on check-in | ✅ | ✅ | 🔲 |
| Class booking validation on class check-in | ✅ | ✅ | 🔲 |
| Manual staff override check-in | ✅ | ✅ | 🔲 |
| Check-in success screen | ✅ | 🔲 | ❌ |
| Check-in denied screen | ✅ | 🔲 | ❌ |
| Check-in history page | ✅ | 🔲 | 🔲 |
| Check-in kiosk mode | ✅ | 🔲 | 🔲 |
| Kiosk auto-reset after check-in | ✅ | 🔲 | 🔲 |
| Check-in export to CSV | ✅ | 🔲 | 🔲 |

---

## Access Control

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Access device database model | ✅ | ✅ | 🔲 |
| Access rule database model | ✅ | ✅ | 🔲 |
| Access device registration screen | ✅ | ✅ | 🔲 |
| Access rule editor (by plan and location) | ✅ | ✅ | 🔲 |
| Access event API endpoint (door devices) | ✅ | ✅ | 🔲 |
| Door unlock authorization response logic | ✅ | ✅ | 🔲 |
| Access denied reason logging | ✅ | ✅ | 🔲 |
| Access event history page | ✅ | 🔲 | 🔲 |
| Device heartbeat endpoint | ✅ | ✅ | 🔲 |
| Device offline status detection | ✅ | ✅ | 🔲 |
| API key generation for access devices | ✅ | ✅ | 🔲 |
| API key rotation for access devices | ✅ | ✅ | 🔲 |

---

## Infrastructure & Security Utilities

| Feature | Unit | Int | E2E |
|---------|------|-----|-----|
| Password hashing (`passwords.ts` — scrypt) | ❌ | ✅ | 🔲 |
| JWT create/verify/expiry (`tokens.ts`) | ❌ | ✅ | 🔲 |
| Opaque token generation (`tokens.ts`) | ❌ | ✅ | 🔲 |
| URL slug normalization (`slug.ts`) | ❌ | ✅ | 🔲 |
| HTTP error formatting (`errors.ts`) | ❌ | ✅ | 🔲 |
| In-memory store gym isolation | ❌ | 🔲 | 🔲 |
| In-memory store sort/filter behaviors | ❌ | 🔲 | 🔲 |
| Postgres repository row mapping | ✅ | 🔲 | 🔲 |
| Postgres transaction commit/rollback | ✅ | 🔲 | 🔲 |

---

## Planned E2E Coverage (Playwright)

Priority order for initial Playwright suite:

| Flow | Status |
|------|--------|
| Owner registration → gym onboarding wizard | ❌ planned |
| Staff login → dashboard navigation | ❌ planned |
| Create member → assign plan → check-in | ❌ planned |
| Class booking → waitlist promotion on cancel | ❌ planned |
| Front desk check-in search flow | ❌ planned |
| Public website signup flow | ❌ planned |

---

## Coverage Summary

| Category | Unit | Integration | E2E |
|----------|------|-------------|-----|
| Repo Setup | 🔲 infra | 🔲 infra | 🔲 |
| Authentication | ✅ full | ✅ full | ❌ planned |
| Tenancy / Gym Accounts | ✅ full | ✅ full | ❌ partial planned |
| Locations | ✅ full | ✅ full | ❌ planned |
| Roles & Permissions | ✅ full | ✅ full | 🔲 |
| Dashboard Shell | ✅ full | 🔲 | ❌ planned |
| Staff Management | ✅ full | ✅ partial | 🔲 |
| Member Management | ✅ full | ✅ full | ❌ planned |
| Membership Plans | ✅ full | ✅ full | 🔲 |
| Class Scheduling | ✅ full | ✅ full | 🔲 |
| Bookings & Waitlists | ✅ full | ✅ full | ❌ planned |
| Reservations & Reservable Resources | ✅ full | ❌ planned | 🔲 |
| Check-Ins | ✅ full | ✅ full | ❌ planned |
| Access Control | ✅ full | ✅ full | 🔲 |
| Security Utilities | ❌ gaps | ✅ indirect | 🔲 |
