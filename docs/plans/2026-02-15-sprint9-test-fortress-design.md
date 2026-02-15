# Sprint 9: Backend Test Fortress — Design Document

> **Date:** 2026-02-15
> **Status:** Approved (CTO autonomous decision)

## Problem

5 of 14 backend routers are tested (auth, article, stats, profile, favorites). The 3 most critical routers — **scan**, **product**, **boycott** — have zero tests. The scan pipeline is the app's core value proposition: it touches OpenFoodFacts API, halal 4-tier analysis, boycott checking, DB writes, user stats/XP, and streak logic. A regression here breaks the entire app.

Additionally, the seed runner (`seeds/run.ts`) seeds certifiers and stores but NOT boycott data, despite 19 BDS entries being ready in `seeds/boycott-bds.ts`.

## Solution

1. **Unit test `analyzeHalalStatus`** — Pure function, no mocking needed. Cover all 4 tiers, vegan override, edge cases.
2. **Integration test scan router** — Mock `lookupBarcode` (external HTTP), test full DB flow.
3. **Integration test product router** — search, getById, getAlternatives.
4. **Integration test boycott router** — checkBrand fuzzy matching, list with filters.
5. **Complete seed pipeline** — Add boycott data to run.ts.

## Approach

- **Real PostgreSQL** (not SQLite) — schema uses `pgTable`, `pgEnum`, `unnest()`, `GREATEST()`
- **Mock only external I/O** — `lookupBarcode` (OpenFoodFacts HTTP) is mocked via `vi.mock`
- **No mocking DB or Redis** — integration tests hit real services
- **`beforeEach` TRUNCATE CASCADE** — Clean slate per test (existing pattern from Sprint 8)
- **Seed helpers** — Extend `seed.ts` with `seedBoycottTargets()`, `seedProducts()`

## Scope

| Router | Procedures | Tests to add |
|--------|-----------|-------------|
| scan | scanBarcode, getHistory, getStats, requestAnalysis | ~10 tests |
| product | getById, getByBarcode, search, getCategories, getAlternatives | ~8 tests |
| boycott | checkBrand, list, getById | ~6 tests |
| barcode.service | analyzeHalalStatus (pure) | ~12 tests |
| **Total** | | **~36 tests** |

## Out of Scope

- Mobile tests (Sprint 10)
- E2E tests (Sprint 11)
- Load testing
