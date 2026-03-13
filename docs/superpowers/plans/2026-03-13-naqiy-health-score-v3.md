# Health Score V3 + Alert Pill Strip + Health Card Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three interconnected changes: (1) Fix backend health score formula so Coca-Cola scores ~15 instead of 72, (2) Replace massive BoycottCard + AlertStripCard with compact pill strip, (3) Redesign HealthNutritionCard into premium gradient-bar + grid-tile dashboard.

**Architecture:** Backend V3 formula rewrite (4 axes, category-aware interpolation, beverage sugar axis), mobile alert unification (single AlertPillStrip component), mobile health card rewrite (ScoreRing + GradientBar + AxisTile grid + BadgeStrip + NutrientGrid).

**Tech Stack:** TypeScript, Vitest (backend), React Native + Reanimated + Expo (mobile), Phosphor icons, expo-linear-gradient.

---

## File Structure

### Backend
| Action | File | Responsibility |
|--------|------|----------------|
| MODIFY | `backend/src/services/health-score.service.ts` | V3 formula: 4 axes, category-aware interpolation, beverage sugar, bio/aop bonuses |
| MODIFY | `backend/src/services/nutriscore.service.ts` | Export `GENERAL_GRADE_THRESHOLDS`, `BEV_GRADE_THRESHOLDS`, `FATS_GRADE_THRESHOLDS` |
| MODIFY | `backend/src/__tests__/unit/health-score.test.ts` | Rewrite all V2 tests → V3 expected values |

### Mobile — New
| Action | File | Responsibility |
|--------|------|----------------|
| CREATE | `optimus-halal/src/components/scan/AlertPillStrip.tsx` | Horizontal scrollable pill strip (boycott + allergen + health) |

### Mobile — Modified
| Action | File | Responsibility |
|--------|------|----------------|
| MODIFY | `optimus-halal/src/components/scan/HealthNutritionCard.tsx` | Full rewrite: gradient bar, axis tiles, badge strips, nutrient grid |
| MODIFY | `optimus-halal/src/components/scan/scan-types.ts` | Add `icon?: string` to PersonalAlert |
| MODIFY | `optimus-halal/app/scan-result.tsx` | Replace BoycottCard+AlertStripCard → AlertPillStrip, update HealthNutritionCard props |
| MODIFY | `optimus-halal/src/i18n/translations/fr.ts` | New i18n keys for V3 |
| MODIFY | `optimus-halal/src/i18n/translations/en.ts` | New i18n keys for V3 |
| MODIFY | `optimus-halal/src/i18n/translations/ar.ts` | New i18n keys for V3 |
| MODIFY | `optimus-halal/src/components/scan/scan-constants.ts` | Add gradient bar colors, axis icon mapping |

### Mobile — Deleted
| Action | File | Reason |
|--------|------|--------|
| DELETE | `optimus-halal/src/components/scan/AlertStripCard.tsx` | Replaced by AlertPillStrip |
| DELETE | `optimus-halal/src/components/scan/PersonalAlerts.tsx` | Merged into AlertPillStrip |

---

## Chunk 1: Backend V3 Formula

### Task 1: Export Grade Thresholds from nutriscore.service.ts

**Files:**
- Modify: `backend/src/services/nutriscore.service.ts:105-126`

- [ ] **Step 1: Add exports to grade threshold constants**

In `backend/src/services/nutriscore.service.ts`, the three grade threshold arrays (lines 105-126) are currently module-private (`const`). Add `export` keyword to each:

```typescript
export const GENERAL_GRADE_THRESHOLDS: [number, NutriScoreGrade][] = [
  [0, "a"],   // <= 0
  [2, "b"],   // 1-2
  [10, "c"],  // 3-10
  [18, "d"],  // 11-18
];
// >= 19 → "e"

export const FATS_GRADE_THRESHOLDS: [number, NutriScoreGrade][] = [
  [-6, "a"],  // <= -6
  [2, "b"],   // -5 to 2
  [10, "c"],  // 3-10
  [18, "d"],  // 11-18
];

export const BEV_GRADE_THRESHOLDS: [number, NutriScoreGrade][] = [
  // Water is always A (handled separately)
  [2, "b"],   // <= 2
  [6, "c"],   // 3-6
  [9, "d"],   // 7-9
];
// >= 10 → "e"
```

Also export `BEV_SUGARS_THRESHOLDS` (line 90) for beverage sugar axis reference:
```typescript
export const BEV_SUGARS_THRESHOLDS  = [0.5, 2, 3.5, 5, 6, 7, 8, 9, 10, 11];
```

- [ ] **Step 2: Verify no type errors**

Run: `cd backend && pnpm tsc --noEmit`
Expected: No errors — adding `export` is backward-compatible.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/nutriscore.service.ts
git commit -m "feat(health-score): export grade thresholds from nutriscore service for V3 consumption"
```

---

### Task 2: Write V3 Failing Tests — Core Formula

**Files:**
- Modify: `backend/src/__tests__/unit/health-score.test.ts`

The existing V2 tests reference `axes.transparency` and V2 expected values. We need to:
1. Update `makeInput` to support V3 fields (`labels`, `sugars100g`)
2. Replace V2 tests with V3 expectations

- [ ] **Step 1: Update makeInput helper and imports**

At the top of `health-score.test.ts`, update the import to include new types:

```typescript
import { describe, it, expect } from "vitest";
import {
  computeHealthScore,
  detectNutrientAnomalies,
  checkScoreExclusion,
  type HealthScoreInput,
  type AdditiveForScore,
  type ScoreExclusionReason,
  type HealthScoreCategory, // NEW
} from "../../services/health-score.service.js";
```

Update `makeInput`:
```typescript
function makeInput(overrides: Partial<HealthScoreInput> = {}): HealthScoreInput {
  return {
    nutriscoreGrade: "b",
    novaGroup: 2,
    additives: [],
    hasIngredientsList: true,
    hasNutritionFacts: true,
    hasAllergens: true,
    hasOrigin: true,
    labels: [],           // NEW V3
    ...overrides,
  };
}
```

- [ ] **Step 2: Write V3 core tests — category detection + interpolation**

Replace the `"computeHealthScore V2 — complete product"` describe block with:

```typescript
describe("computeHealthScore V3 — complete product (OFF grade fallback)", () => {
  it("grade A / NOVA 1 / general → ~87 (no transparency axis)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
    }));
    // V3: nutrition=60/60, additives=20/20, processing=10/10, no transparency
    // (90/90)*90 = 90, no bonuses, no profile
    expect(result.score).toBe(90);
    expect(result.label).toBe("excellent");
    expect(result.axes.transparency).toBeUndefined();
    expect(result.category).toBe("general");
  });

  it("grade E / NOVA 4 / general → ~20 (no transparency inflation)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      novaGroup: 4,
    }));
    // nutrition ~0/60, additives=20/20, processing=0/10
    // ~20/90 → (20/90)*90 = 20
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.label).toBe("poor");
  });

  it("result has category field", () => {
    const result = computeHealthScore(makeInput());
    expect(result).toHaveProperty("category");
  });

  it("result has bonuses field", () => {
    const result = computeHealthScore(makeInput());
    expect(result).toHaveProperty("bonuses");
    expect(result.bonuses).toHaveProperty("bio");
    expect(result.bonuses).toHaveProperty("aop");
  });
});
```

- [ ] **Step 3: Write V3 Coca-Cola regression test**

```typescript
describe("computeHealthScore V3 — beverage category", () => {
  it("Coca-Cola: beverage E / NOVA 4 / 2 low_concern additives → ~21", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: 4,
      categories: "Sodas, Boissons gazeuses",
      nutriments: {
        energy_100g: 180,
        sugars_100g: 10.6,
        saturated_fat_100g: 0,
        sodium_100g: 0.01,
        fiber_100g: 0,
        proteins_100g: 0,
      },
      additives: [
        makeAdditive({ code: "E150d", toxicityLevel: "low_concern" }),
        makeAdditive({ code: "E338", toxicityLevel: "low_concern" }),
      ],
    }));
    expect(result.category).toBe("beverages");
    // Nutrition: raw ~13 → grade E beverages → ~6/50
    // Additives: 20 - 1.5 - 1.5 = 17/20
    // NOVA: 0/10
    // Beverage sugar: 10.6g > 10 → 0/20
    // Total: ~23/100 → normalized: ~21
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBeGreaterThanOrEqual(10);
    expect(result.axes.beverageSugar).toBeDefined();
    expect(result.axes.beverageSugar!.score).toBe(0);
  });

  it("sparkling water (grade B beverage) → high score with sugar axis max", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: 1,
      categories: "Eaux gazeuses, Boissons",
      nutriments: {
        energy_100g: 0,
        sugars_100g: 0,
        saturated_fat_100g: 0,
        sodium_100g: 0.01,
        fiber_100g: 0,
        proteins_100g: 0,
      },
    }));
    // Beverages: good nutriscore → high nutrition, sugar 0 → 20/20
    expect(result.category).toBe("beverages");
    expect(result.axes.beverageSugar).toBeDefined();
    expect(result.axes.beverageSugar!.score).toBe(20);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });
});
```

- [ ] **Step 4: Write V3 bio/aop bonus tests**

```typescript
describe("computeHealthScore V3 — bio/aop bonuses", () => {
  it("bio label adds +7 bonus after normalization", () => {
    const withBio = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
      labels: ["en:organic", "en:eu-organic"],
    }));
    const withoutBio = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
      labels: [],
    }));
    expect(withBio.score! - withoutBio.score!).toBe(7);
    expect(withBio.bonuses.bio).toBe(7);
    expect(withoutBio.bonuses.bio).toBe(0);
  });

  it("aop/aoc label adds +3 bonus", () => {
    const withAop = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
      labels: ["en:pdo", "fr:aoc"],
    }));
    expect(withAop.bonuses.aop).toBe(3);
  });

  it("bio + aop = +10 total bonus", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
      labels: ["en:organic", "fr:aoc"],
    }));
    expect(result.bonuses.bio + result.bonuses.aop).toBe(10);
  });
});
```

- [ ] **Step 5: Write V3 additives axis tests (new weights)**

```typescript
describe("computeHealthScore V3 — additives (20 pts, new weights)", () => {
  it("zero additives = 20/20", () => {
    const result = computeHealthScore(makeInput({ additives: [] }));
    expect(result.axes.additives.score).toBe(20);
    expect(result.axes.additives.max).toBe(20);
  });

  it("low_concern penalty = 1.5 → round(20-1.5) = 19", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({ code: "E330", toxicityLevel: "low_concern" })],
    }));
    // 20 - 1.5 = 18.5 → Math.round(18.5) = 19
    expect(result.axes.additives.score).toBe(19);
  });

  it("moderate_concern penalty = 4", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({ code: "E471", toxicityLevel: "moderate_concern" })],
    }));
    expect(result.axes.additives.score).toBe(16); // 20 - 4
  });

  it("high_concern penalty = 8", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({ code: "E621", toxicityLevel: "high_concern" })],
    }));
    expect(result.axes.additives.score).toBe(12); // 20 - 8
  });

  it("EFSA restricted multiplier x1.3 (down from x1.5)", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({
        code: "E171",
        toxicityLevel: "moderate_concern",
        efsaStatus: "restricted",
      })],
    }));
    // 4 * 1.3 = 5.2 → round → 5 → 20 - 5 = 15
    expect(result.axes.additives.score).toBe(15);
  });

  it("banned additive → score 0/20 + final cap at 25", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      additives: [makeAdditive({ code: "E123", efsaStatus: "banned" })],
    }));
    expect(result.axes.additives.score).toBe(0);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.cappedByAdditive).toBe(true);
  });
});
```

- [ ] **Step 6: Write V3 NOVA axis tests (10 pts)**

```typescript
describe("computeHealthScore V3 — NOVA (10 pts)", () => {
  it.each([
    [1, 10],
    [2, 7],
    [3, 4],
    [4, 0],
  ])("NOVA %i → %i/10 points", (nova, expected) => {
    const result = computeHealthScore(makeInput({ novaGroup: nova }));
    expect(result.axes.processing?.score).toBe(expected);
    expect(result.axes.processing?.max).toBe(10);
  });
});
```

- [ ] **Step 7: Write V3 category-specific weight tests**

```typescript
describe("computeHealthScore V3 — category weights", () => {
  it("fats_oils_nuts: nutrition max = 55, additives max = 15", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      categories: "Huiles d'olive",
    }));
    expect(result.category).toBe("fats_oils_nuts");
    expect(result.axes.nutrition?.max).toBe(55);
    expect(result.axes.additives.max).toBe(15);
    expect(result.axes.beverageSugar).toBeUndefined();
  });

  it("cheese: nutrition max = 55, additives max = 15", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
      categories: "Fromages, Camembert",
    }));
    expect(result.category).toBe("cheese");
    expect(result.axes.nutrition?.max).toBe(55);
    expect(result.axes.additives.max).toBe(15);
  });

  it("red_meat: nutrition max = 60, additives max = 20", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "c",
      novaGroup: 2,
      categories: "Viande de boeuf",
    }));
    expect(result.category).toBe("red_meat");
    expect(result.axes.nutrition?.max).toBe(60);
    expect(result.axes.additives.max).toBe(20);
  });

  it("beverages: nutrition max = 50, has beverageSugar axis", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
      categories: "Jus de fruits",
      nutriments: { sugars_100g: 8, energy_100g: 180, saturated_fat_100g: 0, sodium_100g: 0.01 },
    }));
    expect(result.category).toBe("beverages");
    expect(result.axes.nutrition?.max).toBe(50);
    expect(result.axes.beverageSugar).toBeDefined();
  });
});
```

- [ ] **Step 8: Write V3 banned cap at 25 test**

```typescript
describe("computeHealthScore V3 — caps", () => {
  it("high_concern caps at 49", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      additives: [makeAdditive({ code: "E621", toxicityLevel: "high_concern" })],
    }));
    expect(result.score).toBeLessThanOrEqual(49);
    expect(result.cappedByAdditive).toBe(true);
  });

  it("banned caps at 25 (stricter than high_concern)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      additives: [makeAdditive({ code: "E123", efsaStatus: "banned" })],
    }));
    expect(result.score).toBeLessThanOrEqual(25);
  });
});
```

- [ ] **Step 9: Run tests to verify they FAIL**

Run: `cd backend && pnpm vitest run src/__tests__/unit/health-score.test.ts`
Expected: FAIL — V3 types and behavior don't exist yet.

- [ ] **Step 10: Commit failing tests**

```bash
git add backend/src/__tests__/unit/health-score.test.ts
git commit -m "test(health-score): write V3 failing tests — category-aware interpolation, beverage sugar, bio bonuses"
```

---

### Task 3: Implement V3 Formula in health-score.service.ts

**Files:**
- Modify: `backend/src/services/health-score.service.ts`

This is the core rewrite. Changes summarized:
1. Import `detectCategory`, `NutriScoreCategory`, and grade threshold arrays from nutriscore.service
2. Add `HealthScoreCategory` type alias + category weight maps
3. Rewrite `interpolateNutritionPoints` → `interpolateNutritionPointsV3` (category-aware)
4. Rewrite `computeNutritionAxis` to accept and use category
5. Rewrite `computeAdditivesAxis` with V3 penalties (20 pts max, new weights)
6. Rewrite `computeProcessingAxis` with V3 points (10 pts max)
7. Add `computeBeverageSugarAxis` (new)
8. Add `detectBioBonus` and `detectAopBonus` functions
9. Remove `computeTransparencyAxis` entirely
10. Update `HealthScoreInput` (add `labels`, explicit `sugars100g`)
11. Update `HealthScoreResult` (remove transparency, add bonuses, category, beverageSugar)
12. Rewrite `computeHealthScore` main function with V3 normalization order

- [ ] **Step 1: Add imports and HealthScoreCategory type**

At the top of `health-score.service.ts`, update imports (line 28-34):

```typescript
import {
  computeNutriScore,
  extractNutrimentsFromOff,
  detectCategory,
  type NutrimentInput,
  type NutriScoreCategory,
  type NutriScoreGrade,
  type NutriScoreResult,
  GENERAL_GRADE_THRESHOLDS,
  BEV_GRADE_THRESHOLDS,
  FATS_GRADE_THRESHOLDS,
} from "./nutriscore.service.js";
```

After the import, add:

```typescript
// ── V3 Category-Aware Types ──────────────────────────────────
export type HealthScoreCategory = NutriScoreCategory;
```

- [ ] **Step 2: Add category weight configuration**

Replace `GRADE_BASE_POINTS` (line 250-256) with the V3 configuration block:

```typescript
// ── V3 Category Weights ────────────────────────────────────────

const CATEGORY_NUTRITION_MAX: Record<HealthScoreCategory, number> = {
  general: 60, beverages: 50, fats_oils_nuts: 55, cheese: 55, red_meat: 60,
};

const CATEGORY_ADDITIVES_MAX: Record<HealthScoreCategory, number> = {
  general: 20, beverages: 20, fats_oils_nuts: 15, cheese: 15, red_meat: 20,
};

const NOVA_MAX = 10;
const BEVERAGE_SUGAR_MAX = 20;

// ── V3 Grade Boundaries per Category ───────────────────────────

const GRADE_BOUNDARIES: Record<HealthScoreCategory, Record<NutriScoreGrade, [number, number]>> = {
  general:        { a: [-Infinity, 0], b: [1, 2], c: [3, 10], d: [11, 18], e: [19, Infinity] },
  beverages:      { a: [-Infinity, -Infinity], b: [-Infinity, 2], c: [3, 6], d: [7, 9], e: [10, Infinity] },
  fats_oils_nuts: { a: [-Infinity, -6], b: [-5, 2], c: [3, 10], d: [11, 18], e: [19, Infinity] },
  cheese:         { a: [-Infinity, 0], b: [1, 2], c: [3, 10], d: [11, 18], e: [19, Infinity] },
  red_meat:       { a: [-Infinity, 0], b: [1, 2], c: [3, 10], d: [11, 18], e: [19, Infinity] },
};

function getGradePointRanges(nutritionMax: number): Record<NutriScoreGrade, [number, number]> {
  const m = nutritionMax;
  return {
    a: [m, m],
    b: [Math.round(m * 0.78), Math.round(m * 0.98)],
    c: [Math.round(m * 0.42), Math.round(m * 0.77)],
    d: [Math.round(m * 0.17), Math.round(m * 0.41)],
    e: [0, Math.round(m * 0.16)],
  };
}
```

- [ ] **Step 3: Replace interpolateNutritionPoints with V3 version**

Replace the function at line 262-270:

```typescript
function interpolateNutritionPointsV3(
  raw: number,
  grade: NutriScoreGrade,
  category: HealthScoreCategory,
): number {
  const nutritionMax = CATEGORY_NUTRITION_MAX[category];
  const [lo, hi] = GRADE_BOUNDARIES[category][grade];
  const [ptsLo, ptsHi] = getGradePointRanges(nutritionMax)[grade];

  // Grade A or single-point grade
  if (lo === hi || lo === -Infinity) return ptsHi;

  // Grade E with open-ended boundary: decay from ptsHi toward 0
  if (hi === Infinity) {
    const overshoot = raw - lo;
    return Math.max(0, ptsHi - Math.round(overshoot * 0.5));
  }

  // Standard interpolation within grade range
  const t = 1 - Math.min(1, Math.max(0, (raw - lo) / (hi - lo)));
  return Math.round(ptsLo + t * (ptsHi - ptsLo));
}
```

- [ ] **Step 4: Update computeNutritionAxis to use category**

Update function signature and body (line 272-297):

```typescript
function computeNutritionAxis(
  nutriments: Record<string, number | string> | null | undefined,
  categories: string | null | undefined,
  offGrade: string | null,
  category: HealthScoreCategory,
): (AxisScore & { grade?: NutriScoreGrade; source: "computed" | "off_grade" | "none" }) | null {
  const nutritionMax = CATEGORY_NUTRITION_MAX[category];

  // Strategy 1: Compute NutriScore from raw nutriments
  if (nutriments && Object.keys(nutriments).length > 0) {
    const input = extractNutrimentsFromOff(nutriments);
    const result = computeNutriScore(input, categories);
    if (result) {
      const pts = Math.round(interpolateNutritionPointsV3(result.raw, result.grade, category));
      return { score: pts, max: nutritionMax, grade: result.grade, source: "computed" };
    }
  }

  // Strategy 2: Fallback to OFF grade — use grade center for interpolation
  if (offGrade) {
    const grade = offGrade.toLowerCase() as NutriScoreGrade;
    if (GRADE_BOUNDARIES[category][grade]) {
      const ranges = getGradePointRanges(nutritionMax);
      const [lo, hi] = ranges[grade];
      const basePts = Math.round((lo + hi) / 2); // center of range
      return { score: basePts, max: nutritionMax, grade, source: "off_grade" };
    }
  }

  return null;
}
```

- [ ] **Step 5: Rewrite computeAdditivesAxis with V3 weights**

Replace the function at line 308-345:

```typescript
const TOXICITY_PENALTY_V3: Record<ToxicityLevel, number> = {
  safe: 0,
  low_concern: 1.5,
  moderate_concern: 4,
  high_concern: 8,
};

function computeAdditivesAxis(
  adds: AdditiveForScore[],
  maxScore: number,
): AxisScore & { penalties: string[]; hasHighConcern: boolean; hasBanned: boolean } {
  if (adds.length === 0) {
    return { score: maxScore, max: maxScore, penalties: [], hasHighConcern: false, hasBanned: false };
  }

  let totalPenalty = 0;
  const penalties: string[] = [];
  let hasHighConcern = false;
  let hasBanned = false;

  for (const add of adds) {
    if (add.efsaStatus === "banned") {
      return { score: 0, max: maxScore, penalties: [`${add.code}: EFSA banned`], hasHighConcern: true, hasBanned: true };
    }

    if (add.toxicityLevel === "high_concern") hasHighConcern = true;

    let penalty = TOXICITY_PENALTY_V3[add.toxicityLevel] ?? 0;

    // EFSA restricted: x1.3 (down from V2's x1.5)
    if (add.efsaStatus === "restricted") {
      penalty = Math.round(penalty * 1.3);
      penalties.push(`${add.code}: EFSA restricted (x1.3)`);
    }
    if (add.adiMgPerKg != null && add.adiMgPerKg < 5) {
      penalty = Math.round(penalty * 1.3);
      penalties.push(`${add.code}: ADI < 5mg/kg (x1.3)`);
    }
    if (add.bannedCountries && add.bannedCountries.length >= 3) {
      penalty += 3;
      penalties.push(`${add.code}: banned in ${add.bannedCountries.length} countries (+3)`);
    }

    totalPenalty += penalty;
  }

  return { score: Math.max(0, Math.round(maxScore - totalPenalty)), max: maxScore, penalties, hasHighConcern, hasBanned };
}
```

- [ ] **Step 6: Rewrite computeProcessingAxis with V3 points (10 max)**

Replace the function at lines 347-400:

```typescript
const NOVA_POINTS_V3: Record<number, number> = {
  1: 10,
  2: 7,
  3: 4,
  4: 0,
};

function computeProcessingAxis(
  novaGroup: number | null,
  aiNovaEstimate: number | null | undefined,
  additiveCount: number,
  ingredientCount: number,
  categories: string | null | undefined,
): (AxisScore & { source: "off" | "ai" | "heuristic" }) | null {
  if (novaGroup != null && novaGroup >= 1 && novaGroup <= 4) {
    return { score: NOVA_POINTS_V3[novaGroup]!, max: NOVA_MAX, source: "off" };
  }
  if (aiNovaEstimate != null && aiNovaEstimate >= 1 && aiNovaEstimate <= 4) {
    return { score: NOVA_POINTS_V3[aiNovaEstimate]!, max: NOVA_MAX, source: "ai" };
  }
  const heuristic = estimateNovaHeuristic(additiveCount, ingredientCount, categories);
  if (heuristic != null) {
    return { score: NOVA_POINTS_V3[heuristic]!, max: NOVA_MAX, source: "heuristic" };
  }
  return null;
}
```

Keep `estimateNovaHeuristic` as-is (unchanged).

- [ ] **Step 7: Add new computeBeverageSugarAxis**

After the processing axis function, add:

```typescript
// ── Axe 4: Sucres Boisson (20 pts, beverages only) ──────────

const BEVERAGE_SUGAR_TABLE: [number, number][] = [
  [0, 20],
  [1, 17],
  [2.5, 14],
  [5, 10],
  [7.5, 5],
  [10, 2],
];

function computeBeverageSugarAxis(
  sugars100g: number | null | undefined,
): AxisScore | null {
  if (sugars100g == null) return null;
  for (const [threshold, points] of BEVERAGE_SUGAR_TABLE) {
    if (sugars100g <= threshold) return { score: points, max: BEVERAGE_SUGAR_MAX };
  }
  return { score: 0, max: BEVERAGE_SUGAR_MAX }; // > 10g
}
```

- [ ] **Step 8: Add bio/aop bonus detection**

After the beverage sugar axis, add:

```typescript
// ── Bio / AOP Bonus Detection ────────────────────────────────

const BIO_LABELS_RE = /\b(organic|bio|biologique|ab|eu-organic)\b/i;
const AOP_LABELS_RE = /\b(pdo|pgi|tsg|aoc|aop|igp|label.rouge|stg)\b/i;

function detectBioBonus(labels: string[] | undefined): number {
  if (!labels || labels.length === 0) return 0;
  const joined = labels.join(" ");
  return BIO_LABELS_RE.test(joined) ? 7 : 0;
}

function detectAopBonus(labels: string[] | undefined): number {
  if (!labels || labels.length === 0) return 0;
  const joined = labels.join(" ");
  return AOP_LABELS_RE.test(joined) ? 3 : 0;
}
```

- [ ] **Step 9: Remove computeTransparencyAxis entirely**

Delete the function `computeTransparencyAxis` (lines 404-417).

- [ ] **Step 10: Update HealthScoreInput interface**

Add to `HealthScoreInput` (after line 215):

```typescript
  /** Product labels (en:organic, fr:aoc, etc.) — NEW V3 for bio/aop bonus */
  labels?: string[];
```

- [ ] **Step 11: Update HealthScoreResult interface**

Replace the `HealthScoreResult` interface (lines 228-245):

```typescript
export interface HealthScoreResult {
  score: number | null;
  label: "excellent" | "good" | "mediocre" | "poor" | "very_poor" | null;
  axes: {
    nutrition: (AxisScore & { grade?: NutriScoreGrade; source: "computed" | "off_grade" | "none" }) | null;
    additives: AxisScore & { penalties: string[]; hasHighConcern: boolean; hasBanned: boolean };
    processing: (AxisScore & { source: "off" | "ai" | "heuristic" }) | null;
    beverageSugar?: AxisScore;
    profile: ProfileAdjustment;
  };
  bonuses: { bio: number; aop: number };
  dataConfidence: "high" | "medium" | "low" | "very_low";
  cappedByAdditive: boolean;
  nutriScoreDetail?: NutriScoreResult;
  nutrientAnomalies?: NutrientAnomaly[];
  category: HealthScoreCategory;
}
```

- [ ] **Step 12: Rewrite computeHealthScore main function**

Replace the entire `computeHealthScore` function (lines 664-805):

```typescript
export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  const profile = input.profile ?? "standard";

  // --- Category detection ---
  const category: HealthScoreCategory = detectCategory(input.categories);
  const additivesMax = CATEGORY_ADDITIVES_MAX[category];

  // --- Anomaly detection ---
  const nutrientAnomalies = detectNutrientAnomalies(
    input.nutriments, input.categories, input.offNutriscoreComponents,
  );
  const hasImpossibleAnomaly = nutrientAnomalies.some(a => a.severity === "impossible");
  const hasSuspiciousAnomaly = nutrientAnomalies.length > 0;

  const standardNutrientsAvailable = input.nutriments
    && typeof input.nutriments === "object"
    && ["energy_100g", "fat_100g", "salt_100g", "proteins_100g"]
        .filter(k => { const v = input.nutriments![k]; return v != null && v !== ""; }).length >= 3;

  const offGradeReliable = !hasSuspiciousAnomaly || standardNutrientsAvailable;
  const effectiveOffGrade = offGradeReliable ? input.nutriscoreGrade : null;

  // --- Axe 1: Nutrition (category-dependent max) ---
  const nutritionAxis = computeNutritionAxis(
    hasImpossibleAnomaly ? null : input.nutriments,
    input.categories, effectiveOffGrade, category,
  );

  let nutriScoreDetail: NutriScoreResult | undefined;
  if (input.nutriments && Object.keys(input.nutriments).length > 0 && !hasImpossibleAnomaly) {
    const nutrInput = extractNutrimentsFromOff(input.nutriments);
    nutriScoreDetail = computeNutriScore(nutrInput, input.categories) ?? undefined;
  }

  // --- Axe 2: Additives (category-dependent max) ---
  const additivesAxis = computeAdditivesAxis(input.additives, additivesMax);

  // --- Axe 3: NOVA Processing (10 pts) ---
  const processingAxis = computeProcessingAxis(
    input.novaGroup, input.aiNovaEstimate,
    input.additiveCount ?? input.additives.length,
    input.ingredientCount ?? 0, input.categories,
  );

  // --- Axe 4: Beverage Sugar (20 pts, beverages only) ---
  const beverageSugarAxis = category === "beverages"
    ? computeBeverageSugarAxis(
        input.nutriments?.sugars_100g != null
          ? (typeof input.nutriments.sugars_100g === "string"
              ? parseFloat(input.nutriments.sugars_100g)
              : input.nutriments.sugars_100g as number)
          : null,
      )
    : undefined;

  // --- Profile adjustment ---
  const profileAdjustment = computeProfileAdjustment(
    profile, input.additives, input.nutriments,
    input.novaGroup ?? input.aiNovaEstimate ?? null,
    nutriScoreDetail?.grade ?? (nutritionAxis?.grade as NutriScoreGrade | undefined),
  );

  // --- Bonuses ---
  const bioBonus = detectBioBonus(input.labels);
  const aopBonus = detectAopBonus(input.labels);

  // --- Minimum data check ---
  const primaryAvailable = [nutritionAxis, additivesAxis, processingAxis]
    .filter(a => a != null).length;

  if (primaryAvailable < 2) {
    return {
      score: null, label: null,
      axes: {
        nutrition: nutritionAxis ? { ...nutritionAxis } : null,
        additives: additivesAxis,
        processing: processingAxis,
        ...(beverageSugarAxis && { beverageSugar: beverageSugarAxis }),
        profile: profileAdjustment,
      },
      bonuses: { bio: bioBonus, aop: aopBonus },
      dataConfidence: "very_low",
      cappedByAdditive: false,
      nutriScoreDetail,
      category,
      ...(nutrientAnomalies.length > 0 && { nutrientAnomalies }),
    };
  }

  // --- Step 1: Sum axis scores ---
  let totalScore = 0;
  let totalMax = 0;

  if (nutritionAxis) { totalScore += nutritionAxis.score; totalMax += nutritionAxis.max; }
  totalScore += additivesAxis.score; totalMax += additivesAxis.max;
  if (processingAxis) { totalScore += processingAxis.score; totalMax += processingAxis.max; }
  if (beverageSugarAxis) { totalScore += beverageSugarAxis.score; totalMax += beverageSugarAxis.max; }

  // --- Step 2: Normalize to 90 ---
  let normalized = totalMax > 0 ? Math.round((totalScore / totalMax) * 90) : 0;

  // --- Step 3: Add bonuses (after normalization) ---
  normalized += bioBonus + aopBonus;

  // --- Step 4: Add profile delta ---
  normalized += profileAdjustment.delta;

  // --- Step 5: Apply caps ---
  let cappedByAdditive = false;
  if (additivesAxis.hasBanned && normalized > 25) {
    normalized = 25;
    cappedByAdditive = true;
  } else if (additivesAxis.hasHighConcern && normalized > 49) {
    normalized = 49;
    cappedByAdditive = true;
  }

  // --- Step 6: Final clamp [0, 100] ---
  normalized = Math.max(0, Math.min(100, normalized));

  // --- Confidence ---
  let dataConfidence = getDataConfidence(
    nutritionAxis, nutritionAxis?.source ?? "none",
    processingAxis, processingAxis?.source ?? null,
    input.additives.length,
  );
  if (hasSuspiciousAnomaly && dataConfidence === "high") dataConfidence = "medium";
  if (hasImpossibleAnomaly && (dataConfidence === "high" || dataConfidence === "medium")) dataConfidence = "low";

  return {
    score: normalized,
    label: getLabel(normalized),
    axes: {
      nutrition: nutritionAxis ? { ...nutritionAxis } : null,
      additives: additivesAxis,
      processing: processingAxis,
      ...(beverageSugarAxis && { beverageSugar: beverageSugarAxis }),
      profile: profileAdjustment,
    },
    bonuses: { bio: bioBonus, aop: aopBonus },
    dataConfidence,
    cappedByAdditive,
    nutriScoreDetail,
    category,
    ...(nutrientAnomalies.length > 0 && { nutrientAnomalies }),
  };
}
```

- [ ] **Step 13: Run type check**

Run: `cd backend && pnpm tsc --noEmit`
Expected: No type errors.

- [ ] **Step 14: Run V3 tests**

Run: `cd backend && pnpm vitest run src/__tests__/unit/health-score.test.ts`
Expected: All V3 tests PASS. Some old V2 tests that reference `axes.transparency` will need to be removed/updated.

- [ ] **Step 15: Clean up remaining V2 test references**

Remove or update any remaining V2 test blocks:
- Delete `"computeHealthScore V2 — transparency"` describe block entirely
- Update `"computeHealthScore V2 — result structure"` to not check for `axes.transparency`
- Update `"computeHealthScore V2 — proportional scoring"` expected values (no transparency)
- Rename all `"V2"` → `"V3"` in describe block names

- [ ] **Step 16: Run full test suite**

Run: `cd backend && pnpm vitest run src/__tests__/unit/health-score.test.ts`
Expected: ALL tests pass.

- [ ] **Step 17: Commit**

```bash
git add backend/src/services/health-score.service.ts backend/src/__tests__/unit/health-score.test.ts
git commit -m "feat(health-score): implement V3 formula — category-aware interpolation, beverage sugar axis, bio/aop bonuses, remove transparency

Fixes Coca-Cola scoring from 72 → ~21. Adds:
- Category-specific grade boundaries (beverages, fats, cheese, red_meat)
- Beverage sugar axis (20 pts, beverages only)
- Bio (+7) and AOP (+3) bonuses after normalization
- Banned additive cap at 25 (stricter than high_concern 49)
- NOVA reduced 15→10 pts, additives reduced 25→20 pts
- Removed transparency axis (moved to dataConfidence)"
```

---

## Chunk 2: Mobile — Alert Pill Strip

### Task 4: Update scan-types.ts — Add icon to PersonalAlert

**Files:**
- Modify: `optimus-halal/src/components/scan/scan-types.ts:80-85`

- [ ] **Step 1: Add icon field to PersonalAlert**

```typescript
export interface PersonalAlert {
  type: "allergen" | "health" | "boycott";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  icon?: string;  // Phosphor icon name override (optional)
}
```

- [ ] **Step 2: Commit**

```bash
git add optimus-halal/src/components/scan/scan-types.ts
git commit -m "feat(scan-types): add icon field to PersonalAlert for AlertPillStrip"
```

---

### Task 5: Create AlertPillStrip Component

**Files:**
- Create: `optimus-halal/src/components/scan/AlertPillStrip.tsx`

- [ ] **Step 1: Write the AlertPillStrip component**

```typescript
/**
 * AlertPillStrip — Compact horizontal pill strip for alerts.
 *
 * Replaces BoycottCard (~200px red glow) + AlertStripCard (separate component)
 * with a single ~56px horizontal scrollable row of compact pills.
 *
 * @module components/scan/AlertPillStrip
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  HandHeartIcon,
  WarningCircleIcon,
  PillIcon,
  CaretRightIcon,
} from "phosphor-react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import type { PersonalAlert } from "./scan-types";

// ── Pill color mapping ──

const PILL_CONFIG: Record<string, { color: string; Icon: typeof HandHeartIcon }> = {
  boycott:  { color: "#ef4444", Icon: HandHeartIcon },
  allergen: { color: "#f97316", Icon: WarningCircleIcon },
  health:   { color: "#3b82f6", Icon: PillIcon },
};

// ── Props ──

export interface AlertPillStripProps {
  alerts: PersonalAlert[];
  staggerIndex?: number;
  onPillPress?: (alert: PersonalAlert) => void;
}

// ── Sub-component: AlertPill ──

function AlertPill({
  alert,
  index,
  onPress,
}: {
  alert: PersonalAlert;
  index: number;
  onPress?: (alert: PersonalAlert) => void;
}) {
  const { isDark } = useTheme();
  const config = PILL_CONFIG[alert.type] ?? PILL_CONFIG.health;
  const { color, Icon } = config;

  return (
    <Animated.View
      entering={FadeInRight.duration(250).delay(index * 80).springify()}
    >
      <PressableScale
        onPress={() => onPress?.(alert)}
        style={[styles.pill, {
          backgroundColor: isDark ? `${color}1A` : `${color}14`,
          borderColor: isDark ? `${color}40` : `${color}30`,
        }]}
        accessibilityRole="button"
        accessibilityLabel={alert.title}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${color}26` }]}>
          <Icon size={11} color={color} weight="bold" />
        </View>
        <Text
          style={[styles.pillLabel, { color }]}
          numberOfLines={1}
        >
          {alert.title}
        </Text>
        <CaretRightIcon size={10} color={`${color}80`} />
      </PressableScale>
    </Animated.View>
  );
}

// ── Main Component ──

export function AlertPillStrip({
  alerts,
  staggerIndex = 1,
  onPillPress,
}: AlertPillStripProps) {
  if (alerts.length === 0) return null;

  // Sort: boycott first, then allergens, then health
  const sorted = [...alerts].sort((a, b) => {
    const order: Record<string, number> = { boycott: 0, allergen: 1, health: 2 };
    return (order[a.type] ?? 3) - (order[b.type] ?? 3);
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {sorted.map((alert, idx) => (
        <AlertPill
          key={`${alert.type}-${idx}`}
          alert={alert}
          index={idx}
          onPress={onPillPress}
        />
      ))}
    </ScrollView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pillLabel: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    maxWidth: 200,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add optimus-halal/src/components/scan/AlertPillStrip.tsx
git commit -m "feat(scan): create AlertPillStrip — compact horizontal pill strip for boycott + allergen + health alerts"
```

---

### Task 6: Integrate AlertPillStrip in scan-result.tsx

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx`

- [ ] **Step 1: Update imports**

Replace line 50:
```typescript
import { AlertStripCard, type AlertItem } from "@/components/scan/AlertStripCard";
```
With:
```typescript
import { AlertPillStrip } from "@/components/scan/AlertPillStrip";
```

Remove `BoycottCard` from InlineScanSections import (line 56):
```typescript
import { CommunityVoteCard, NewProductBanner } from "@/components/scan/InlineScanSections";
```

- [ ] **Step 2: Build unified alert array**

Replace the `alertItems` transformation (lines 484-490) with:

```typescript
  // Unified alert array for AlertPillStrip
  const allAlerts: PersonalAlert[] = useMemo(() => {
    const alerts: PersonalAlert[] = [];

    // Boycott pill (if active)
    if (boycott?.isBoycotted) {
      for (const target of boycott.targets) {
        alerts.push({
          type: "boycott",
          severity: "high",
          title: `Boycott · ${target.companyName}`,
          description: target.reasonSummary ?? "",
        });
      }
    }

    // Personal alerts (allergens, health)
    for (const a of personalAlerts ?? []) {
      alerts.push(a);
    }

    return alerts;
  }, [boycott, personalAlerts]);
```

- [ ] **Step 3: Replace BoycottCard + AlertStripCard render**

Replace lines 648-656:
```tsx
          {/* BOYCOTT ALERT (conditional — prominent) */}
          {boycott?.isBoycotted && (
            <BoycottCard boycott={boycott} staggerIndex={1} />
          )}

          {/* ALERT STRIP (conditional) */}
          {alertItems.length > 0 && (
            <AlertStripCard alerts={alertItems} staggerIndex={2} />
          )}
```

With:
```tsx
          {/* ALERT PILL STRIP (boycott + allergens + health — unified) */}
          {allAlerts.length > 0 && (
            <AlertPillStrip alerts={allAlerts} staggerIndex={1} />
          )}
```

- [ ] **Step 4: Remove unused AlertItem type reference**

Remove any remaining `AlertItem` references and the `alertItems` variable if still present.

- [ ] **Step 5: Verify no type errors**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 6: Delete old AlertStripCard**

```bash
rm optimus-halal/src/components/scan/AlertStripCard.tsx
```

Note: `PersonalAlerts.tsx` may already be deleted from a prior commit. Safe no-op:
```bash
ls optimus-halal/src/components/scan/PersonalAlerts.tsx 2>/dev/null && rm optimus-halal/src/components/scan/PersonalAlerts.tsx || echo "Already deleted"
```

- [ ] **Step 7: Remove BoycottCard export from InlineScanSections**

In `optimus-halal/src/components/scan/InlineScanSections.tsx`, remove the entire `BoycottCard` component (lines 48-194) and its `BoycottCardProps` interface (lines 52-65). Also remove unused imports that were only used by BoycottCard (`ProhibitIcon`, `GlowCard`, `Linking`).

- [ ] **Step 8: Commit**

```bash
git add optimus-halal/app/scan-result.tsx optimus-halal/src/components/scan/AlertPillStrip.tsx optimus-halal/src/components/scan/InlineScanSections.tsx
git add -u optimus-halal/src/components/scan/AlertStripCard.tsx optimus-halal/src/components/scan/PersonalAlerts.tsx
git commit -m "feat(scan): replace BoycottCard + AlertStripCard with compact AlertPillStrip

200px red GlowCard → 36px compact pills. Boycott, allergen, and health
alerts unified into single horizontal scroll strip."
```

---

## Chunk 3: Mobile — Health & Nutrition Card Redesign

### Task 7: Add V3 Constants and i18n Keys

**Files:**
- Modify: `optimus-halal/src/components/scan/scan-constants.ts`
- Modify: `optimus-halal/src/i18n/translations/fr.ts`
- Modify: `optimus-halal/src/i18n/translations/en.ts`
- Modify: `optimus-halal/src/i18n/translations/ar.ts`

- [ ] **Step 1: Add axis icons and gradient colors to scan-constants.ts**

At the end of `scan-constants.ts`, add:

```typescript
// ── V3 Health Card Constants ──

export const GRADIENT_BAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"] as const;

/** Axis icon names (Phosphor) for AxisTile grid */
export const AXIS_ICONS = {
  nutrition: "Apple",
  additives: "Flask",
  processing: "Factory",
  beverageSugar: "Drop",
} as const;

/** Eco-Score colors (same scheme as NutriScore) */
export const ECOSCORE_COLORS: Record<string, string> = {
  a: "#038141",
  b: "#85BB2F",
  c: "#FECB02",
  d: "#EE8100",
  e: "#E63E11",
};
```

- [ ] **Step 2: Add V3 i18n keys to fr.ts**

Inside the `scanResult` key object in `fr.ts`, add:

```typescript
    // V3 Health Card
    axisNutrition: "Nutrition",
    axisAdditives: "Additifs",
    axisProcessing: "Transformation",
    axisBeverageSugar: "Sucres boisson",
    bonusBio: "Bonus Bio",
    bonusAop: "Label qualité",
    confidenceHigh: "Données fiables",
    confidenceMedium: "Données partielles",
    confidenceLow: "Données limitées",
    confidenceVeryLow: "Données insuffisantes",
    cappedWarning: "Score plafonné (additif à risque)",
    nutriScore: "NutriScore",
    novaLabel: "NOVA",
    ecoScoreLabel: "Eco-Score",
    sucres: "Sucres",
    graissesSat: "Graisses sat.",
    sel: "Sel",
    fibres: "Fibres",
```

- [ ] **Step 3: Add V3 i18n keys to en.ts**

```typescript
    axisNutrition: "Nutrition",
    axisAdditives: "Additives",
    axisProcessing: "Processing",
    axisBeverageSugar: "Beverage sugars",
    bonusBio: "Organic bonus",
    bonusAop: "Quality label",
    confidenceHigh: "Reliable data",
    confidenceMedium: "Partial data",
    confidenceLow: "Limited data",
    confidenceVeryLow: "Insufficient data",
    cappedWarning: "Score capped (risky additive)",
    nutriScore: "NutriScore",
    novaLabel: "NOVA",
    ecoScoreLabel: "Eco-Score",
    sucres: "Sugars",
    graissesSat: "Sat. fat",
    sel: "Salt",
    fibres: "Fiber",
```

- [ ] **Step 4: Add V3 i18n keys to ar.ts**

```typescript
    axisNutrition: "التغذية",
    axisAdditives: "المضافات",
    axisProcessing: "التحويل",
    axisBeverageSugar: "سكريات المشروب",
    bonusBio: "مكافأة عضوي",
    bonusAop: "علامة جودة",
    confidenceHigh: "بيانات موثوقة",
    confidenceMedium: "بيانات جزئية",
    confidenceLow: "بيانات محدودة",
    confidenceVeryLow: "بيانات غير كافية",
    cappedWarning: "نتيجة محدودة (مادة مضافة خطرة)",
    nutriScore: "نيوتري سكور",
    novaLabel: "نوفا",
    ecoScoreLabel: "إيكو سكور",
    sucres: "سكريات",
    graissesSat: "دهون مشبعة",
    sel: "ملح",
    fibres: "ألياف",
```

- [ ] **Step 5: Commit**

```bash
git add optimus-halal/src/components/scan/scan-constants.ts optimus-halal/src/i18n/translations/fr.ts optimus-halal/src/i18n/translations/en.ts optimus-halal/src/i18n/translations/ar.ts
git commit -m "feat(i18n): add V3 health card keys and scan-constants for gradient bar, axis tiles"
```

---

### Task 8: Rewrite HealthNutritionCard

**Files:**
- Modify: `optimus-halal/src/components/scan/HealthNutritionCard.tsx`

This is a full rewrite. The component goes from a simple card to a premium dashboard with:
- ScoreRing + gradient bar
- 2×2 axis tile grid
- Bio/AOP bonus badge
- NutriScore / NOVA / Eco-Score badge strips
- Dietary chips
- 2×2 nutrient grid
- Footer CTA

- [ ] **Step 1: Rewrite the full component**

Replace the entire content of `HealthNutritionCard.tsx`:

```typescript
/**
 * HealthNutritionCard V3 — Premium Health & Nutrition Dashboard
 *
 * Gradient bar + axis tile grid + badge strips + nutrient grid.
 * Yuka-level visual density with Naqiy gold accents.
 *
 * @module components/scan/HealthNutritionCard
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  HeartIcon,
  CaretRightIcon,
  AppleIcon,
  FlaskIcon,
  FactoryIcon,
  DropIcon,
  LeafIcon,
  SealCheckIcon,
  WarningIcon,
} from "phosphor-react-native";

import { SectionCard } from "./SectionCard";
import { ScoreRing } from "./ScoreRing";
import { NutrientBar } from "./NutrientBar";
import { DietaryChip } from "./DietaryChip";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold, halalStatus as halalStatusTokens } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import {
  NUTRISCORE_COLORS,
  NOVA_COLORS,
  ECOSCORE_COLORS,
  GRADIENT_BAR_COLORS,
  letterSpacing,
} from "./scan-constants";
import type { NutrientItem, DietaryItem } from "./scan-types";

// ── Types ──

interface AxisData {
  score: number;
  max: number;
  grade?: string;
  hasHighConcern?: boolean;
}

export interface HealthNutritionCardProps {
  healthScore: {
    score: number;
    label: string;
    axes: {
      nutrition: AxisData | null;
      additives: AxisData;
      processing: AxisData | null;
      beverageSugar?: AxisData;
    };
    bonuses: { bio: number; aop: number };
    dataConfidence: "high" | "medium" | "low" | "very_low";
    cappedByAdditive: boolean;
    category: string;
  } | null;
  nutriScoreGrade?: string;
  novaGroup?: number;
  ecoScoreGrade?: string;
  nutrientBreakdown: NutrientItem[];
  dietaryAnalysis: DietaryItem[];
  allergens: string[];
  traces: string[];
  onNutrientPress: (nutrient: NutrientItem) => void;
  onPress: () => void;
  staggerIndex?: number;
}

// ── Score color helper ──

function getScoreColor(score: number): string {
  if (score >= 76) return "#22c55e";
  if (score >= 51) return "#eab308";
  if (score >= 26) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number, t: any): string {
  if (score >= 80) return t.scanResult.scoreExcellent;
  if (score >= 60) return t.scanResult.scoreBon;
  if (score >= 40) return t.scanResult.scoreMediocre;
  if (score >= 20) return t.scanResult.scoreInsuffisant;
  return t.scanResult.scoreTresInsuffisant;
}

// ── Sub: GradientBar ──

function GradientBar({ score }: { score: number }) {
  const { isDark } = useTheme();
  return (
    <View style={styles.gradientBarContainer}>
      <LinearGradient
        colors={[...GRADIENT_BAR_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBar}
      />
      <View style={[styles.gradientIndicator, {
        left: `${Math.min(98, Math.max(2, score))}%`,
        backgroundColor: isDark ? "#fff" : "#111",
        borderColor: isDark ? "#333" : "#fff",
      }]} />
    </View>
  );
}

// ── Sub: AxisTile ──

const AXIS_ICON_MAP: Record<string, typeof AppleIcon> = {
  nutrition: AppleIcon,
  additives: FlaskIcon,
  processing: FactoryIcon,
  beverageSugar: DropIcon,
};

function AxisTile({ axisKey, data, label }: {
  axisKey: string;
  data: AxisData;
  label: string;
}) {
  const { isDark } = useTheme();
  const pct = data.max > 0 ? data.score / data.max : 0;
  const color = pct >= 0.7 ? "#22c55e" : pct >= 0.4 ? "#f97316" : "#ef4444";
  const Icon = AXIS_ICON_MAP[axisKey] ?? AppleIcon;

  return (
    <View style={[styles.axisTile, {
      backgroundColor: isDark ? `${color}14` : `${color}0A`,
    }]}>
      <View style={styles.axisTileHeader}>
        <Icon size={14} color={color} weight="bold" />
        <Text style={[styles.axisTileLabel, { color: isDark ? "#e5e7eb" : "#374151" }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.axisTileScore, { color }]}>
        {data.score}/{data.max}
      </Text>
      <View style={[styles.axisTileBar, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
        <View style={[styles.axisTileBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Sub: BadgeStrip ──

function BadgeStrip({ label, grades, activeGrade, colorMap }: {
  label: string;
  grades: string[];
  activeGrade: string;
  colorMap: Record<string, string>;
}) {
  const { isDark } = useTheme();
  return (
    <View style={styles.badgeStripRow}>
      <View style={styles.badgeStripGrades}>
        {grades.map((g) => {
          const isActive = g.toLowerCase() === activeGrade.toLowerCase();
          const color = colorMap[g.toLowerCase()] ?? "#6b7280";
          return (
            <View
              key={g}
              style={[
                styles.badgeRect,
                isActive
                  ? { backgroundColor: color, transform: [{ scale: 1.15 }] }
                  : { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
              ]}
            >
              <Text style={[
                styles.badgeRectText,
                isActive
                  ? { color: "#fff", fontWeight: "800" }
                  : { color: isDark ? "#6b7280" : "#9ca3af", opacity: 0.5 },
              ]}>
                {g.toUpperCase()}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.badgeStripLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Sub: BonusBadge ──

function BonusBadge({ label, points }: { label: string; points: number }) {
  const { isDark } = useTheme();
  if (points === 0) return null;
  return (
    <View style={[styles.bonusBadge, {
      backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)",
      borderColor: isDark ? "rgba(34,197,94,0.30)" : "rgba(34,197,94,0.20)",
    }]}>
      <LeafIcon size={14} color="#22c55e" weight="bold" />
      <Text style={[styles.bonusBadgeText, { color: "#22c55e" }]}>
        {label}
      </Text>
      <Text style={[styles.bonusBadgePoints, { color: "#22c55e" }]}>
        +{points}
      </Text>
    </View>
  );
}

// ── Sub: NutrientGridCell ──

function NutrientGridCell({ name, value, unit, level, onPress }: {
  name: string;
  value: number;
  unit: string;
  level: string;
  onPress: () => void;
}) {
  const { isDark } = useTheme();
  const color = level === "low" ? "#22c55e" : level === "high" ? "#ef4444" : "#f97316";
  const pct = Math.min(100, value * 3); // rough visual scale

  return (
    <Pressable onPress={onPress} style={[styles.nutrientCell, {
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    }]}>
      <Text style={[styles.nutrientCellName, { color: isDark ? "#d1d5db" : "#4b5563" }]}>
        {name}
      </Text>
      <Text style={[styles.nutrientCellValue, { color: isDark ? "#f3f4f6" : "#111827" }]}>
        {value}{unit}
      </Text>
      <View style={[styles.nutrientCellBar, {
        backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <View style={[styles.nutrientCellBarFill, {
          width: `${Math.min(100, pct)}%`,
          backgroundColor: color,
        }]} />
      </View>
    </Pressable>
  );
}

// ── Main Component ──

export function HealthNutritionCard({
  healthScore,
  nutriScoreGrade,
  novaGroup,
  ecoScoreGrade,
  nutrientBreakdown,
  dietaryAnalysis,
  allergens,
  traces,
  onNutrientPress,
  onPress,
  staggerIndex = 4,
}: HealthNutritionCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const score = healthScore?.score ?? 0;
  const scoreLabel = healthScore
    ? getScoreLabel(score, t)
    : t.scanResult.donneesInsuffisantes;

  const axes = healthScore?.axes;
  const bonuses = healthScore?.bonuses;
  const isBeverage = healthScore?.category === "beverages";

  // Top 4 nutrients for grid
  const topNutrients = nutrientBreakdown.slice(0, 4);

  return (
    <SectionCard
      icon={<HeartIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.santeNutrition}
      staggerIndex={staggerIndex}
    >
      {/* ── Score hero: ScoreRing + label + confidence ── */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreRingWrapper}>
          <ScoreRing score={healthScore?.score ?? null} size={90} label={scoreLabel} />
        </View>
        <View style={styles.scoreInfo}>
          <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
            {score}<Text style={styles.scoreMax}>/100</Text>
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>
            {scoreLabel}
          </Text>
          {healthScore?.dataConfidence && (
            <Text style={[styles.confidenceBadge, { color: colors.textMuted }]}>
              {({ high: t.scanResult.confidenceHigh, medium: t.scanResult.confidenceMedium, low: t.scanResult.confidenceLow, very_low: t.scanResult.confidenceVeryLow } as Record<string, string>)[healthScore.dataConfidence]
                ?? healthScore.dataConfidence}
            </Text>
          )}
          {healthScore?.cappedByAdditive && (
            <View style={[styles.cappedBadge, {
              backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
            }]}>
              <WarningIcon size={10} color="#ef4444" weight="bold" />
              <Text style={[styles.cappedText, { color: "#ef4444" }]}>
                {t.scanResult.cappedWarning}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Gradient bar ── */}
      {healthScore && <GradientBar score={score} />}

      {/* ── Axis tiles (2×2 grid) ── */}
      {axes && (
        <View style={styles.axisTileGrid}>
          {axes.nutrition && (
            <AxisTile axisKey="nutrition" data={axes.nutrition} label={t.scanResult.axisNutrition} />
          )}
          <AxisTile axisKey="additives" data={axes.additives} label={t.scanResult.axisAdditives} />
          {axes.processing && (
            <AxisTile axisKey="processing" data={axes.processing} label={t.scanResult.axisProcessing} />
          )}
          {isBeverage && axes.beverageSugar && (
            <AxisTile axisKey="beverageSugar" data={axes.beverageSugar} label={t.scanResult.axisBeverageSugar} />
          )}
        </View>
      )}

      {/* ── Bio/AOP bonuses ── */}
      {bonuses && (bonuses.bio > 0 || bonuses.aop > 0) && (
        <View style={styles.bonusRow}>
          {bonuses.bio > 0 && <BonusBadge label={t.scanResult.bonusBio} points={bonuses.bio} />}
          {bonuses.aop > 0 && <BonusBadge label={t.scanResult.bonusAop} points={bonuses.aop} />}
        </View>
      )}

      {/* ── Badge strips (NutriScore / NOVA / Eco-Score) ── */}
      {(nutriScoreGrade || novaGroup != null || ecoScoreGrade) && (
        <>
          <View style={[styles.subDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />
          {nutriScoreGrade && (
            <BadgeStrip
              label={t.scanResult.nutriScore}
              grades={["a", "b", "c", "d", "e"]}
              activeGrade={nutriScoreGrade}
              colorMap={NUTRISCORE_COLORS}
            />
          )}
          {novaGroup != null && (
            <BadgeStrip
              label={t.scanResult.novaLabel}
              grades={["1", "2", "3", "4"]}
              activeGrade={String(novaGroup)}
              colorMap={Object.fromEntries(Object.entries(NOVA_COLORS).map(([k, v]) => [k, v]))}
            />
          )}
          {ecoScoreGrade && (
            <BadgeStrip
              label={t.scanResult.ecoScoreLabel}
              grades={["a", "b", "c", "d", "e"]}
              activeGrade={ecoScoreGrade}
              colorMap={ECOSCORE_COLORS}
            />
          )}
        </>
      )}

      {/* ── Dietary chips ── */}
      {dietaryAnalysis.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dietaryScroll}
          contentContainerStyle={styles.dietaryContent}
        >
          {dietaryAnalysis.map((item, idx) => (
            <DietaryChip
              key={item.key}
              label={item.label}
              status={item.status}
              icon={item.icon as any}
              index={idx}
            />
          ))}
        </ScrollView>
      )}

      {/* ── Nutrient grid (2×2) ── */}
      {topNutrients.length > 0 && (
        <>
          <View style={[styles.subDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />
          <Text style={[styles.subHeader, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.detailNutritionnel}
          </Text>
          <View style={styles.nutrientGrid}>
            {topNutrients.map((nb) => (
              <NutrientGridCell
                key={nb.key}
                name={nb.name}
                value={nb.value}
                unit={nb.unit}
                level={nb.level}
                onPress={() => onNutrientPress(nb)}
              />
            ))}
          </View>
        </>
      )}

      {/* ── Allergens ── */}
      {(allergens.length > 0 || traces.length > 0) && (
        <>
          <View style={[styles.subDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />
          <Text style={[styles.subHeader, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.allergenesTitle}
          </Text>
          <View style={styles.allergenRow}>
            {allergens.map((a) => (
              <View key={a} style={[styles.allergenChip, {
                backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
              }]}>
                <View style={[styles.allergenDot, { backgroundColor: halalStatusTokens.haram.base }]} />
                <Text style={[styles.allergenText, { color: colors.textPrimary }]}>{a}</Text>
              </View>
            ))}
          </View>
          {traces.length > 0 && (
            <>
              <Text style={[styles.tracesLabel, { color: colors.textMuted }]}>
                {t.scanResult.tracesLabel}
              </Text>
              <View style={styles.allergenRow}>
                {traces.map((tr) => (
                  <View key={tr} style={[styles.allergenChip, styles.traceChip, {
                    borderColor: isDark ? "rgba(249,115,22,0.30)" : "rgba(249,115,22,0.20)",
                  }]}>
                    <View style={[styles.allergenDot, { backgroundColor: halalStatusTokens.doubtful.base }]} />
                    <Text style={[styles.allergenText, { color: colors.textPrimary }]}>{tr}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}

      {/* ── Footer CTA ── */}
      <View style={styles.footerCTA}>
        <Pressable onPress={onPress} style={styles.footerCTARow} accessibilityRole="button">
          <Text style={[styles.footerCTAText, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.voirDetail}
          </Text>
          <CaretRightIcon size={14} color={isDark ? gold[400] : gold[700]} />
        </Pressable>
      </View>
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  // Score hero
  scoreRow: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  scoreRingWrapper: { alignItems: "center" },
  scoreInfo: { flex: 1, gap: 4 },
  scoreValue: { fontSize: 28, fontWeight: "800" },
  scoreMax: { fontSize: 14, fontWeight: "400", opacity: 0.5 },
  scoreLabel: { fontSize: fontSizeTokens.caption, fontWeight: fontWeightTokens.medium },
  confidenceBadge: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.medium },
  cappedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2,
    alignSelf: "flex-start",
  },
  cappedText: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.semiBold },

  // Gradient bar
  gradientBarContainer: { height: 8, borderRadius: 4, overflow: "hidden", marginTop: spacing.lg, position: "relative" },
  gradientBar: { flex: 1, borderRadius: 4 },
  gradientIndicator: {
    position: "absolute", top: -2, width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, marginLeft: -6,
  },

  // Axis tiles
  axisTileGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg,
  },
  axisTile: {
    flex: 1, minWidth: "45%", padding: spacing.md, borderRadius: radius.md,
  },
  axisTileHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  axisTileLabel: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.semiBold },
  axisTileScore: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  axisTileBar: { height: 3, borderRadius: 2, marginTop: 6, overflow: "hidden" },
  axisTileBarFill: { height: "100%", borderRadius: 2 },

  // Bonus badges
  bonusRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  bonusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1,
  },
  bonusBadgeText: { fontSize: fontSizeTokens.caption, fontWeight: fontWeightTokens.semiBold },
  bonusBadgePoints: { fontSize: fontSizeTokens.caption, fontWeight: "800" },

  // Badge strips
  badgeStripRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: spacing.md,
  },
  badgeStripGrades: { flexDirection: "row", gap: 4 },
  badgeRect: {
    width: 28, height: 24, borderRadius: 4,
    alignItems: "center", justifyContent: "center",
  },
  badgeRectText: { fontSize: 11, fontWeight: "700" },
  badgeStripLabel: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.medium },

  // Dietary
  dietaryScroll: { marginTop: spacing.lg, marginHorizontal: -spacing["3xl"] },
  dietaryContent: { paddingHorizontal: spacing["3xl"], gap: spacing.sm },

  // Nutrient grid
  nutrientGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  nutrientCell: {
    flex: 1, minWidth: "45%", padding: spacing.md, borderRadius: radius.md,
  },
  nutrientCellName: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.medium },
  nutrientCellValue: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  nutrientCellBar: { height: 3, borderRadius: 2, marginTop: 6, overflow: "hidden" },
  nutrientCellBarFill: { height: "100%", borderRadius: 2 },

  // Shared
  subDivider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.lg },
  subHeader: {
    fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.bold,
    textTransform: "uppercase", letterSpacing: letterSpacing.wider, marginBottom: spacing.md,
  },
  allergenRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  allergenChip: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full,
  },
  traceChip: { backgroundColor: "transparent", borderWidth: 1, borderStyle: "dashed" },
  allergenDot: { width: 8, height: 8, borderRadius: 4 },
  allergenText: { fontSize: fontSizeTokens.caption, fontWeight: fontWeightTokens.medium },
  tracesLabel: { fontSize: fontSizeTokens.caption, marginTop: spacing.md, marginBottom: spacing.sm },
  footerCTA: { alignItems: "flex-end", marginTop: spacing.lg },
  footerCTARow: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerCTAText: { fontSize: fontSizeTokens.caption, fontWeight: fontWeightTokens.semiBold },
});
```

- [ ] **Step 2: Verify no import errors**

Run: `cd optimus-halal && npx tsc --noEmit`

Note: This may surface errors in `scan-result.tsx` if the `HealthNutritionCardProps` interface changed. Those will be fixed in the next task.

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/HealthNutritionCard.tsx
git commit -m "feat(scan): rewrite HealthNutritionCard V3 — gradient bar, axis tiles, badge strips, nutrient grid

Premium dashboard with ScoreRing, gradient bar indicator, 2×2 axis tile
grid, bio/aop bonus badges, NutriScore/NOVA/Eco badge strips, 2×2
nutrient grid. Dark mode support, Phosphor icons throughout."
```

---

### Task 9: Update scan-result.tsx — Wire V3 HealthNutritionCard Props

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx`

- [ ] **Step 1: Update HealthNutritionCard props in render**

Replace the HealthNutritionCard render block (lines 693-714) with V3 props:

```tsx
          {/* HEALTH & NUTRITION — V3 */}
          <HealthNutritionCard
            healthScore={healthScore ? {
              score: healthScore.score ?? 0,
              label: healthScore.label ?? "unknown",
              axes: {
                nutrition: healthScore.axes?.nutrition ?? null,
                additives: healthScore.axes?.additives ?? { score: 0, max: 20 },
                processing: healthScore.axes?.processing ?? null,
                beverageSugar: healthScore.axes?.beverageSugar,
              },
              bonuses: healthScore.bonuses ?? { bio: 0, aop: 0 },
              dataConfidence: healthScore.dataConfidence ?? "low",
              cappedByAdditive: healthScore.cappedByAdditive ?? false,
              category: healthScore.category ?? "general",
            } : null}
            nutriScoreGrade={offExtras?.nutriscoreGrade ?? undefined}
            novaGroup={offExtras?.novaGroup ?? undefined}
            ecoScoreGrade={offExtras?.ecoscoreGrade ?? undefined}
            nutrientBreakdown={nutrientItems}
            dietaryAnalysis={dietaryItems}
            allergens={allergensTags
              .filter((t_: string) => {
                const clean = t_.replace(/^(en|fr):/, "").toLowerCase();
                return !NON_ALLERGEN_TAGS.has(clean);
              })
              .map((t_: string) => t_.replace(/^(en|fr):/, "").replace(/-/g, " "))}
            traces={(offExtras?.tracesTags ?? []).map((t_: string) => t_.replace(/^(en|fr):/, "").replace(/-/g, " "))}
            onNutrientPress={(nb) => setSelectedNutrient({
              nutrient: nb.key, value: nb.value, unit: nb.unit,
              level: nb.level as any, dailyValuePercent: nb.percentage, isNegative: !nb.isPositive,
            })}
            onPress={() => setShowScoreDetailSheet(true)}
            staggerIndex={4}
          />
```

- [ ] **Step 2: Verify type check passes**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/app/scan-result.tsx
git commit -m "feat(scan): wire V3 HealthNutritionCard props in scan-result orchestrator

Passes V3 axes, bonuses, category, dataConfidence to new card.
Wires 'Voir le détail' CTA to ScoreDetailBottomSheet."
```

---

### Task 10: Update getDataConfidence for V3 Spec

**Files:**
- Modify: `backend/src/services/health-score.service.ts` (function `getDataConfidence`, lines 569-586)

The spec defines new confidence criteria: `high` = NutriScore computed + NOVA available + ingredients list; `medium` = NutriScore computed OR NOVA available; `low` = Only OFF grade fallback; `very_low` = No nutrition data at all.

- [ ] **Step 1: Update getDataConfidence function**

Replace the existing `getDataConfidence` function:

```typescript
function getDataConfidence(
  nutrition: AxisScore | null,
  nutritionSource: "computed" | "off_grade" | "none",
  processing: AxisScore | null,
  processingSource: string | null,
  additivesCount: number,
  hasIngredientsList: boolean,
): HealthScoreResult["dataConfidence"] {
  const hasNutrition = nutrition != null;
  const hasProcessing = processing != null;
  const isComputed = nutritionSource === "computed";

  // High: NutriScore computed + NOVA available + ingredients list
  if (isComputed && hasProcessing && hasIngredientsList) return "high";
  // High: both present (even if OFF grade fallback)
  if (hasNutrition && hasProcessing) return "high";
  // Medium: one of the two primary axes
  if (hasNutrition || hasProcessing) return "medium";
  // Low: at least some additive data
  if (additivesCount > 0) return "low";
  // Very low: nothing
  return "very_low";
}
```

- [ ] **Step 2: Update call site in computeHealthScore to pass hasIngredientsList**

In the `computeHealthScore` function, update the call to `getDataConfidence`:

```typescript
  let dataConfidence = getDataConfidence(
    nutritionAxis, nutritionAxis?.source ?? "none",
    processingAxis, processingAxis?.source ?? null,
    input.additives.length,
    input.hasIngredientsList,  // NEW parameter
  );
```

- [ ] **Step 3: Run tests**

Run: `cd backend && pnpm vitest run src/__tests__/unit/health-score.test.ts`
Expected: All tests pass (existing confidence tests may need minor updates).

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/health-score.service.ts
git commit -m "feat(health-score): update getDataConfidence for V3 spec criteria"
```

---

### Task 11: Update ScoreDetailBottomSheet for V3 Axes

**Files:**
- Modify: `optimus-halal/src/components/scan/ScoreDetailBottomSheet.tsx`

The current `ScoreDetailBottomSheet` shows certifier trust score breakdown (4-block semantic bars: ritual, ops, tayyib, transparency). For V3, it needs to also display health score V3 axes when opened from the HealthNutritionCard "Voir le détail" CTA.

Note: The existing sheet is for certifier trust scores. We need to add a **health score detail mode** that shows V3 axes breakdown. Since this is a complex component, the minimal change is:

- [ ] **Step 1: Read the full ScoreDetailBottomSheet to understand its current interface**

Read: `optimus-halal/src/components/scan/ScoreDetailBottomSheet.tsx`

- [ ] **Step 2: Add V3 health axes display mode**

The simplest approach: add an optional `healthAxes` prop. When present, render V3 axis breakdown instead of certifier trust bars. This keeps backward compatibility with existing certifier usage.

Add to the component's props interface:

```typescript
// Add alongside existing props
healthAxes?: {
  nutrition: { score: number; max: number; grade?: string } | null;
  additives: { score: number; max: number; hasHighConcern: boolean };
  processing: { score: number; max: number } | null;
  beverageSugar?: { score: number; max: number };
  bonuses: { bio: number; aop: number };
  category: string;
};
```

When `healthAxes` is provided, render a simple axis list instead of the certifier blocks:
- Each axis as a labeled progress bar with score/max
- Bonus badges if bio or aop > 0
- Category badge

Implementation details depend on the full component structure — the implementer should read the component first and adapt the V3 display to match the existing visual language.

- [ ] **Step 3: Wire in scan-result.tsx**

Update the `ScoreDetailBottomSheet` usage in `scan-result.tsx` to pass `healthAxes` when `showScoreDetailSheet` is triggered from the health card:

```tsx
<ScoreDetailBottomSheet
  visible={showScoreDetailSheet}
  onClose={() => setShowScoreDetailSheet(false)}
  // ... existing certifier props ...
  healthAxes={healthScore ? {
    nutrition: healthScore.axes?.nutrition ?? null,
    additives: healthScore.axes?.additives ?? { score: 0, max: 20, hasHighConcern: false },
    processing: healthScore.axes?.processing ?? null,
    beverageSugar: healthScore.axes?.beverageSugar,
    bonuses: healthScore.bonuses ?? { bio: 0, aop: 0 },
    category: healthScore.category ?? "general",
  } : undefined}
/>
```

- [ ] **Step 4: Commit**

```bash
git add optimus-halal/src/components/scan/ScoreDetailBottomSheet.tsx optimus-halal/app/scan-result.tsx
git commit -m "feat(scan): add V3 health axes display to ScoreDetailBottomSheet"
```

---

### Task 12: Final Cleanup and Verification

- [ ] **Step 1: Verify all deleted files are gone**

```bash
ls optimus-halal/src/components/scan/AlertStripCard.tsx 2>&1
ls optimus-halal/src/components/scan/PersonalAlerts.tsx 2>&1
```
Expected: "No such file or directory" for both.

- [ ] **Step 2: Run backend type check**

Run: `cd backend && pnpm tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Run backend tests**

Run: `cd backend && pnpm vitest run src/__tests__/unit/health-score.test.ts`
Expected: All tests pass.

- [ ] **Step 4: Run mobile type check**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Search for dead imports**

```bash
grep -r "AlertStripCard\|BoycottCard" optimus-halal/app/ optimus-halal/src/ --include="*.tsx" --include="*.ts"
grep -r "axes.transparency" backend/src/ --include="*.ts"
```
Expected: No matches (all old references removed).

- [ ] **Step 6: Final commit if any cleanup needed**

```bash
git add -A
git diff --cached --name-only | head -20
# If changes exist:
git commit -m "chore: final cleanup — remove dead imports and V2 references"
```
