# Sprint 9: Backend Test Fortress — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring test coverage to the 3 most critical backend routers (scan, product, boycott) + unit test the halal analysis engine + complete the seed pipeline.

**Architecture:** Unit tests for pure functions, integration tests with real PostgreSQL/Redis for routers, mock only external HTTP (OpenFoodFacts API).

**Tech Stack:** Vitest, existing test infrastructure from Sprint 8

---

### Task 1: Complete Seed Pipeline — Add Boycott Data to run.ts

**Files:**
- Modify: `backend/src/db/seeds/run.ts`

**Steps:**
1. Import `BDS_SEED_DATA` from `./boycott-bds.js` and `boycottTargets` from schema
2. Add Phase 3 after stores: upsert boycott data using `ON CONFLICT DO UPDATE`
3. Add boycott count to summary stats
4. Verify: `pnpm tsx src/db/seeds/run.ts` runs without error (dry-run check: just verify import/compilation)

**Commit:** `feat: add boycott BDS data to seed pipeline`

---

### Task 2: Unit Test analyzeHalalStatus — All 4 Tiers

**Files:**
- Create: `backend/src/__tests__/barcode-analysis.test.ts`

**Tests:**
1. **Tier 1 — Certified:** labels_tags includes `en:halal` → status=halal, tier=certified, confidence=0.95
2. **Tier 1 — Certified FR:** labels_tags includes `fr:certifie-halal` → same result
3. **Tier 2 — Analyzed Clean:** normal ingredients, no haram/doubtful → status=halal, tier=analyzed_clean, confidence=0.8
4. **Tier 3 — Doubtful (ingredient):** whey/lactosérum detected → status=doubtful, confidence=0.6
5. **Tier 3 — Doubtful (additive E471):** additives_tags includes `en:e471` → doubtful
6. **Tier 3 → Halal (vegan override):** E471 + ingredients_analysis_tags includes `en:vegan` → halal (resolved)
7. **Tier 4 — Haram (ingredient):** porc/gelatin detected → status=haram, confidence>=0.85
8. **Tier 4 — Haram (additive E120):** additives_tags includes `en:e120` → haram, confidence=0.9
9. **Tier 4 — Haram (additive E441):** gélatine additive → haram
10. **Unknown:** no ingredients, no additives → status=unknown
11. **Multiple issues:** haram + doubtful → worst wins (haram)
12. **Real product — Nutella:** ingredients with lactosérum + E322 → doubtful (E322 halal but lactosérum doubtful)

**Commit:** `test: unit test analyzeHalalStatus — all 4 tiers + edge cases`

---

### Task 3: Seed Helper Extensions

**Files:**
- Modify: `backend/src/__tests__/helpers/seed.ts`

**Add:**
1. `seedBoycottTarget(overrides?)` — insert one boycott target, return it
2. `seedBoycottTargets()` — insert 3 targets (official_bds, grassroots, pressure), return them
3. `seedProduct(overrides?)` — insert a product with defaults, return it
4. `seedProductWithScan(userId)` — insert product + scan record, return both

**Commit:** `test: extend seed helpers for scan/product/boycott tests`

---

### Task 4: Integration Test — Boycott Router

**Files:**
- Create: `backend/src/__tests__/boycott.test.ts`

**Tests:**
1. `checkBrand` — exact match ("Coca-Cola") → isBoycotted: true
2. `checkBrand` — partial match ("coca") → isBoycotted: true (fuzzy)
3. `checkBrand` — no match ("Unknown Brand") → isBoycotted: false
4. `list` — returns all active targets, ordered by addedAt DESC
5. `list` — filtered by level (official_bds only)
6. `getById` — returns single target

**Commit:** `test: integration test boycott router — checkBrand, list, getById`

---

### Task 5: Integration Test — Product Router

**Files:**
- Create: `backend/src/__tests__/product.test.ts`

**Tests:**
1. `getById` — returns product by UUID
2. `getById` — throws notFound for missing product
3. `getByBarcode` — returns product by barcode
4. `getByBarcode` — returns null for unknown barcode
5. `search` — finds by name (ilike)
6. `search` — finds by brand
7. `search` — filters by halalStatus
8. `getAlternatives` — returns halal products in same category (excludes self)

**Commit:** `test: integration test product router — search, alternatives, CRUD`

---

### Task 6: Integration Test — Scan Router (Core Pipeline)

**Files:**
- Create: `backend/src/__tests__/scan.test.ts`

**Approach:** Mock `lookupBarcode` via `vi.mock("../../services/barcode.service.js")`. Keep `analyzeHalalStatus` real (already unit tested). Need authenticated caller.

**Tests:**
1. `scanBarcode` — new product (OFF found) → creates product + scan, returns full response with halalAnalysis
2. `scanBarcode` — existing product → re-runs analysis from stored offData, returns scan
3. `scanBarcode` — product not found on OFF → scan recorded with unknown status
4. `scanBarcode` — updates user stats (totalScans +1, XP +10)
5. `scanBarcode` — streak logic: same day = same streak, next day = streak+1, gap = reset to 1
6. `scanBarcode` — boycott brand detected → response includes boycott data
7. `getHistory` — returns user's scans ordered by scannedAt DESC
8. `getHistory` — pagination works (cursor-based)
9. `getStats` — returns correct stats after scans
10. `requestAnalysis` — creates analysis request record

**Commit:** `test: integration test scan router — full pipeline + streak + boycott`

---

### Task 7: Run All Tests + Fix Any Failures

**Steps:**
1. Run `pnpm test` in backend
2. Fix any failures
3. Run `pnpm typecheck` in backend
4. Ensure 0 errors

**Commit:** `fix: address test failures` (if needed)
