# Sprint 8: Testing & Observability — Design

**Date:** 2026-02-15
**Status:** Approved (autonomous CTO decision)
**Branch:** `sprint8/testing-observability`

## Problem

91 tRPC endpoints, 40 screens, 0 tests, 0 crash reporting, 0 analytics.
Every future sprint multiplies the untested surface. One bad refactor ships a regression with no safety net.

## Decision

**Approach B: Critical path tests + observability** — maximum ROI without blocking features.

Rejected alternatives:
- Full TDD retrofit (80%+ coverage) — overkill for MVP stage, 2-3 week blocker
- Observability only (Sentry + PostHog, no tests) — no regression safety net

## Architecture

### 1. Backend Testing

**Stack:** Vitest + tRPC `createCallerFactory` + in-memory SQLite (better-sqlite3)

**15 critical procedures tested:**

| Router | Procedures | Rationale |
|--------|-----------|-----------|
| auth | register, login, refresh, me | Auth broken = app dead |
| scan | scanBarcode, getHistory | Core feature (80% usage) |
| product | getByBarcode, search | Scan depends on this |
| favorites | add, remove, list | Data loss risk |
| profile | getProfile, updateProfile | User identity |
| article | list (cursor) | Recently fixed cursor bug |
| stats | userDashboard | Home screen data |

**Test structure:**
```
backend/
├── vitest.config.ts
├── src/__tests__/
│   ├── setup.ts              # In-memory DB + seed
│   ├── helpers/
│   │   └── caller.ts         # createCallerFactory wrapper
│   ├── auth.test.ts
│   ├── scan.test.ts
│   ├── product.test.ts
│   ├── favorites.test.ts
│   ├── profile.test.ts
│   ├── article.test.ts
│   └── stats.test.ts
```

**In-memory DB strategy:**
- Drizzle supports `better-sqlite3` driver for tests
- Each test file gets a fresh DB via `beforeEach` migration + seed
- No Docker, no network, no flaky CI

### 2. Mobile Smoke Tests

**Stack:** Jest (Expo built-in) + @testing-library/react-native

**4 critical screens — render-only smoke tests:**

| Screen | What's tested |
|--------|--------------|
| Home (index.tsx) | Renders with mock tRPC, shows skeleton then content |
| Scanner | Renders permission request state |
| Scan Result | Renders with mock product data |
| Login | Renders form fields, validates inputs |

**Mock strategy:** Custom tRPC provider wrapper with static query data. No MSW needed for smoke tests.

### 3. Sentry (Backend + Mobile)

**Backend:**
- `@sentry/node` — Hono middleware for unhandled exceptions
- tRPC `onError` handler → `Sentry.captureException`
- Environment: `SENTRY_DSN` env var, `production`/`preview` separation

**Mobile:**
- `@sentry/react-native` — native crash reporting + ANR detection
- Expo Router navigation breadcrumbs
- Source maps via EAS Build hooks

### 4. PostHog Analytics (Mobile only)

- `posthog-react-native` SDK
- Auto screen tracking via Expo Router navigation listener
- Custom events: `scan_barcode`, `add_favorite`, `share_product`, `view_article`
- No PII — anonymous user ID only

### 5. CI Integration

Update `.github/workflows/backend-ci.yml`:
- Add `test` job: `pnpm test` before build

Update `.github/workflows/mobile-ci.yml`:
- Add `test` job: `pnpm test` before typecheck

## Out of Scope

- E2E tests (Maestro/Detox) — Sprint 9
- Backend load testing — premature at current scale
- A/B testing — premature
- Full component testing with interaction — smoke tests only for now

## Success Criteria

- [ ] `pnpm test` passes in backend/ with 15+ test cases
- [ ] `pnpm test` passes in optimus-halal/ with 4 smoke tests
- [ ] Sentry receives test error from both backend and mobile
- [ ] PostHog receives screen_view event from mobile
- [ ] CI/CD runs tests on every PR
