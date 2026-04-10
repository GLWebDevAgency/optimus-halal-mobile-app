# Halal Engine V2 — Phase 3: HalalEngineV2 (Analyzed Track)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the substance-module halal evaluation engine for the Analyzed Track (non-certified products). This is the core domain logic: match detected substances → select contextual scenarios → apply madhab filter → aggregate to final verdict → build explanation trace.

**Architecture:** Hexagonal — domain logic depends on port interfaces, never on DB/infra directly. Every function is pure where possible, injectable where not. TDD with golden corpus fixtures.

**Tech Stack:** TypeScript, vitest, Drizzle (infra adapters), zero external dependencies in domain layer.

**Spec reference:** [design spec](../specs/2026-04-09-halal-engine-v2-design.md) §8 (AnalyzedTrack), §18 invariants, Appendix C (port interfaces), Appendix D H17 (batch loading).

**Branch:** `feat/halal-engine-v2` (continues from Phase 2 hotfix).

---

## File Structure

```
backend/src/
  domain/
    ports/                           (Task 1)
      dossier-repo.ts
      scenario-repo.ts
      madhab-ruling-repo.ts
      match-pattern-repo.ts
    types/                           (Task 2)
      halal-evaluation-context.ts
      product-context.ts
      halal-report.ts
      module-verdict.ts
    engine/                          (Tasks 3-7)
      module-matcher.ts              (Task 3)
      scenario-selector.ts           (Task 4)
      madhab-filter.ts               (Task 5)
      aggregator.ts                  (Task 6)
      halal-engine-v2.ts             (Task 7)
  infra/
    adapters/                        (Task 8)
      drizzle-dossier-repo.ts
      drizzle-scenario-repo.ts
      drizzle-madhab-ruling-repo.ts
      drizzle-match-pattern-repo.ts
  __tests__/
    unit/
      module-matcher.test.ts         (Task 3)
      scenario-selector.test.ts      (Task 4)
      madhab-filter.test.ts          (Task 5)
      aggregator.test.ts             (Task 6)
      halal-engine-v2.test.ts        (Task 7)
    fixtures/
      halal/
        golden/                      (Task 9)
          shellac-candy-hanafi.json
          e471-bread-shafii.json
          gelatin-gummy-general.json
          clean-product-moderate.json
          multi-substance-strict.json
```

---

## Task 1: Port Interfaces (hexagonal boundary)

**Files:**
- Create: `backend/src/domain/ports/dossier-repo.ts`
- Create: `backend/src/domain/ports/scenario-repo.ts`
- Create: `backend/src/domain/ports/madhab-ruling-repo.ts`
- Create: `backend/src/domain/ports/match-pattern-repo.ts`

These are the contracts that domain code imports. Zero infra knowledge.

- [ ] **Step 1.1: Create all 4 port interfaces**

`backend/src/domain/ports/dossier-repo.ts`:
```typescript
export interface SubstanceDossierView {
  id: string;
  substanceId: string;
  version: string;
  dossierJson: Record<string, unknown>;
  contentHash: string;
  fatwaCount: number | null;
}

export interface IDossierRepo {
  getActive(substanceId: string): Promise<SubstanceDossierView | null>;
  batchGetActive(substanceIds: string[]): Promise<Map<string, SubstanceDossierView>>;
}
```

`backend/src/domain/ports/scenario-repo.ts`:
```typescript
export interface SubstanceScenarioView {
  substanceId: string;
  scenarioKey: string;
  matchConditions: Record<string, unknown>;
  specificity: number;
  score: number;
  verdict: string;
  rationaleFr: string;
  rationaleEn: string | null;
  rationaleAr: string | null;
  dossierSectionRef: string | null;
}

export interface IScenarioRepo {
  forSubstance(substanceId: string): Promise<SubstanceScenarioView[]>;
  batchForSubstances(substanceIds: string[]): Promise<Map<string, SubstanceScenarioView[]>>;
}
```

`backend/src/domain/ports/madhab-ruling-repo.ts`:
```typescript
export interface MadhabRulingView {
  substanceId: string;
  madhab: string;
  ruling: string;
  contemporarySplit: boolean;
  classicalSources: string[];
  contemporarySources: string[];
}

export interface IMadhabRulingRepo {
  get(substanceId: string, madhab: string): Promise<MadhabRulingView | null>;
  batchGet(substanceIds: string[], madhab: string): Promise<Map<string, MadhabRulingView>>;
}
```

`backend/src/domain/ports/match-pattern-repo.ts`:
```typescript
export interface MatchPatternView {
  substanceId: string;
  patternType: string;
  patternValue: string;
  lang: string | null;
  priority: number;
  confidence: number;
}

export interface IMatchPatternRepo {
  getAllActive(): Promise<MatchPatternView[]>;
}
```

- [ ] **Step 1.2: Commit**

```bash
git add backend/src/domain/
git commit -m "feat(domain): add 4 port interfaces for hexagonal halal engine

IDossierRepo, IScenarioRepo, IMadhabRulingRepo, IMatchPatternRepo.
Domain code depends only on these interfaces — never on Drizzle/DB.
All repos support batch operations to prevent N+1 (H17).

Part of feat/halal-engine-v2 Phase 3."
```

---

## Task 2: Domain Types (pure, zero dependencies)

**Files:**
- Create: `backend/src/domain/types/halal-evaluation-context.ts`
- Create: `backend/src/domain/types/product-context.ts`
- Create: `backend/src/domain/types/halal-report.ts`
- Create: `backend/src/domain/types/module-verdict.ts`
- Create: `backend/src/domain/types/index.ts`

- [ ] **Step 2.1: Create all domain types**

`halal-evaluation-context.ts` — The PURE context passed to engines (C1 ethical parity):
```typescript
/**
 * Pure evaluation context — ZERO tier/entitlement/user fields.
 * HalalEngineV2 imports ONLY this type. Enforces ethical parity (C1).
 */
export interface HalalEvaluationContext {
  readonly madhab: "general" | "hanafi" | "shafii" | "maliki" | "hanbali";
  readonly strictness: "relaxed" | "moderate" | "strict" | "very_strict";
  readonly species?: "cattle" | "sheep" | "goat" | "poultry" | "rabbit" | "mixed" | "unknown";
  readonly lang: "fr" | "en" | "ar";
}
```

`product-context.ts`:
```typescript
import type { DetectedSubstance, AnimalSourceHint, AlcoholContext, ProductCategory, MeatClassification } from "../../services/ai-extract/types.js";

export interface ProductContext {
  readonly barcode: string;
  readonly brand: string | null;
  readonly brandOwner: string | null;
  readonly productName: string | null;
  readonly category: ProductCategory;
  readonly usage: "ingestion" | "topical" | "medicinal";
  readonly meatClassification: MeatClassification | null;
  readonly substancesDetected: DetectedSubstance[];
  readonly animalSourceHints: AnimalSourceHint[];
  readonly alcoholContext: AlcoholContext;
  readonly additivesTags: string[];
  readonly ingredientsList: string[];
  readonly ingredientsText: string | null;
  readonly labelsTags: string[];
  readonly ingredientsAnalysisTags: string[];
  readonly completeness: number | null;
  readonly extractionSource: "gemini" | "off_structured" | "regex" | "vocabulary_fuzzy";
}
```

`module-verdict.ts`:
```typescript
export type HalalVerdict = "halal" | "halal_with_caution" | "mashbooh" | "avoid" | "haram";

export interface ModuleVerdict {
  readonly substanceId: string;
  readonly displayName: string;
  readonly score: number;           // 0..100
  readonly verdict: HalalVerdict;
  readonly scenarioKey: string;
  readonly rationaleFr: string;
  readonly rationaleAr: string | null;
  readonly madhabNote: string | null;
  readonly fatwaCount: number;
  readonly dossierId: string;
  readonly icon: "insect" | "alcohol" | "animal" | "enzyme" | "process" | "source" | "other";
}
```

`halal-report.ts`:
```typescript
import type { HalalVerdict, ModuleVerdict } from "./module-verdict.js";

export interface HalalReport {
  readonly verdict: HalalVerdict;
  readonly score: number;
  readonly confidence: number;
  readonly tier: "certified" | "analyzed_clean" | "doubtful" | "haram";
  readonly headlineFr: string;
  readonly headlineEn: string;
  readonly headlineAr: string;
  readonly certifier: { id: string; name: string; logoUrl?: string } | null;
  readonly signals: ModuleVerdict[];
  readonly madhabApplied: string;
  readonly madhabDivergence: boolean;
  readonly hasFullDossier: boolean;
  readonly engineVersion: string;
  readonly analysisSourceLabel: string;
}
```

`index.ts`:
```typescript
export type { HalalEvaluationContext } from "./halal-evaluation-context.js";
export type { ProductContext } from "./product-context.js";
export type { HalalReport } from "./halal-report.js";
export type { ModuleVerdict, HalalVerdict } from "./module-verdict.js";
```

- [ ] **Step 2.2: Commit**

```bash
git add backend/src/domain/types/
git commit -m "feat(domain): add pure domain types (C1 ethical parity enforced)

HalalEvaluationContext has ZERO tier/entitlement fields — type-level
guarantee that engine logic cannot branch on user subscription.
ProductContext, ModuleVerdict, HalalReport complete the domain model.

Part of feat/halal-engine-v2 Phase 3."
```

---

## Task 3: ModuleMatcher (TDD)

**Files:**
- Create: `backend/src/domain/engine/module-matcher.ts`
- Create: `backend/src/__tests__/unit/module-matcher.test.ts`

Matches detected substances from Gemini + OFF tags + text patterns against the `substance_match_patterns` table. Multi-source with priority-based dedup.

- [ ] **Step 3.1: Write failing test**

```typescript
import { describe, it, expect } from "vitest";
import { matchModules, type SubstanceMatch } from "../../domain/engine/module-matcher.js";
import type { ProductContext } from "../../domain/types/product-context.js";
import type { MatchPatternView } from "../../domain/ports/match-pattern-repo.js";

const PATTERNS: MatchPatternView[] = [
  { substanceId: "SHELLAC", patternType: "e_number", patternValue: "E904", lang: null, priority: 90, confidence: 1.0 },
  { substanceId: "SHELLAC", patternType: "keyword_fr", patternValue: "gomme-laque", lang: "fr", priority: 100, confidence: 1.0 },
  { substanceId: "SHELLAC", patternType: "off_tag", patternValue: "en:e904", lang: null, priority: 85, confidence: 1.0 },
  { substanceId: "CARMINE", patternType: "e_number", patternValue: "E120", lang: null, priority: 90, confidence: 1.0 },
  { substanceId: "E471", patternType: "e_number", patternValue: "E471", lang: null, priority: 90, confidence: 1.0 },
];

function makeProduct(overrides: Partial<ProductContext> = {}): ProductContext {
  return {
    barcode: "123", brand: null, brandOwner: null, productName: null,
    category: "candy", usage: "ingestion", meatClassification: null,
    substancesDetected: [], animalSourceHints: [], alcoholContext: { present: false, role: "none" },
    additivesTags: [], ingredientsList: [], ingredientsText: null,
    labelsTags: [], ingredientsAnalysisTags: [], completeness: null,
    extractionSource: "gemini",
    ...overrides,
  };
}

describe("module-matcher", () => {
  it("matches substances from Gemini detected_substances (highest priority)", () => {
    const product = makeProduct({
      substancesDetected: [
        { substance_id: "SHELLAC", matched_term: "gomme-laque", match_source: "canonical_fr", confidence: 0.95 },
      ],
    });
    const matches = matchModules(product, PATTERNS);
    expect(matches).toHaveLength(1);
    expect(matches[0].substanceId).toBe("SHELLAC");
    expect(matches[0].source).toBe("gemini");
    expect(matches[0].priority).toBe(100); // Gemini source = priority 100
  });

  it("matches from additives_tags when Gemini misses", () => {
    const product = makeProduct({ additivesTags: ["en:e120", "en:e471"] });
    const matches = matchModules(product, PATTERNS);
    expect(matches).toHaveLength(2);
    expect(matches.map(m => m.substanceId).sort()).toEqual(["CARMINE", "E471"]);
  });

  it("deduplicates: same substance from Gemini + OFF tag keeps Gemini (higher priority)", () => {
    const product = makeProduct({
      substancesDetected: [
        { substance_id: "SHELLAC", matched_term: "gomme-laque", match_source: "canonical_fr", confidence: 0.95 },
      ],
      additivesTags: ["en:e904"],
    });
    const matches = matchModules(product, PATTERNS);
    expect(matches).toHaveLength(1);
    expect(matches[0].source).toBe("gemini");
  });

  it("returns empty array for clean product", () => {
    const product = makeProduct({ ingredientsList: ["sucre", "sel"] });
    const matches = matchModules(product, PATTERNS);
    expect(matches).toHaveLength(0);
  });
});
```

- [ ] **Step 3.2: Run test — expect fail**
- [ ] **Step 3.3: Implement module-matcher.ts**

Pure function `matchModules(product: ProductContext, patterns: MatchPatternView[]): SubstanceMatch[]`:
1. Source 1 (prio 100): Gemini `substancesDetected` — each detected substance_id is a direct match
2. Source 2 (prio 80): `additivesTags` → normalize (`en:e322i` → `E322`) → match against `e_number` patterns
3. Source 3 (prio 50): `ingredientsList` → lowercase → match against `keyword_*` patterns (contains check)
4. Dedup by `substanceId`, keep highest priority source
5. Sort by priority DESC

```typescript
export interface SubstanceMatch {
  substanceId: string;
  source: "gemini" | "off_tag" | "e_number" | "keyword" | "regex";
  priority: number;
  confidence: number;
  matchedTerm: string;
}
```

- [ ] **Step 3.4: Run test — expect pass (4 tests)**
- [ ] **Step 3.5: Commit**

```bash
git commit -m "feat(engine): ModuleMatcher — multi-source substance detection with dedup

Sources: Gemini (prio 100) > e_number (80) > off_tag (70) > keyword (50).
Dedup by substanceId keeps highest priority. Pure function, no DB.
4 unit tests. Part of feat/halal-engine-v2 Phase 3."
```

---

## Task 4: ScenarioSelector (TDD)

**Files:**
- Create: `backend/src/domain/engine/scenario-selector.ts`
- Create: `backend/src/__tests__/unit/scenario-selector.test.ts`

Selects the most specific scenario for a substance given the product context.

- [ ] **Step 4.1: Write failing test**

```typescript
import { describe, it, expect } from "vitest";
import { selectScenario } from "../../domain/engine/scenario-selector.js";
import type { SubstanceScenarioView } from "../../domain/ports/scenario-repo.js";

const SHELLAC_SCENARIOS: SubstanceScenarioView[] = [
  {
    substanceId: "SHELLAC", scenarioKey: "mui_certified_tablet",
    matchConditions: { category: ["tablet_pharma"], certified_halal: true },
    specificity: 2, score: 85, verdict: "halal",
    rationaleFr: "Certifié MUI", rationaleEn: null, rationaleAr: null, dossierSectionRef: null,
  },
  {
    substanceId: "SHELLAC", scenarioKey: "uncertified_candy",
    matchConditions: { category: ["candy", "chocolate"] },
    specificity: 1, score: 35, verdict: "mashbooh",
    rationaleFr: "Bonbon non certifié", rationaleEn: null, rationaleAr: null, dossierSectionRef: null,
  },
  {
    substanceId: "SHELLAC", scenarioKey: "cosmetic_external",
    matchConditions: { usage: "topical" },
    specificity: 1, score: 70, verdict: "halal",
    rationaleFr: "Usage externe", rationaleEn: null, rationaleAr: null, dossierSectionRef: null,
  },
];

const DEFAULT_POSITION = { globalScore: 45, verdict: "mashbooh" };

describe("scenario-selector", () => {
  it("selects most specific matching scenario", () => {
    const selected = selectScenario(SHELLAC_SCENARIOS, { category: "candy", usage: "ingestion" }, DEFAULT_POSITION);
    expect(selected.scenarioKey).toBe("uncertified_candy");
    expect(selected.score).toBe(35);
  });

  it("falls back to naqiy_position when no scenario matches", () => {
    const selected = selectScenario(SHELLAC_SCENARIOS, { category: "sauce", usage: "ingestion" }, DEFAULT_POSITION);
    expect(selected.scenarioKey).toBe("__default__");
    expect(selected.score).toBe(45);
  });

  it("prefers higher specificity when multiple match", () => {
    const selected = selectScenario(SHELLAC_SCENARIOS, { category: "tablet_pharma", usage: "ingestion", certified_halal: true }, DEFAULT_POSITION);
    expect(selected.scenarioKey).toBe("mui_certified_tablet");
    expect(selected.score).toBe(85);
  });

  it("matches usage-based scenarios", () => {
    const selected = selectScenario(SHELLAC_SCENARIOS, { category: "cosmetic_topical", usage: "topical" }, DEFAULT_POSITION);
    expect(selected.scenarioKey).toBe("cosmetic_external");
  });
});
```

- [ ] **Step 4.2: Implement scenario-selector.ts**

Pure function. Match conditions are filters: each non-null condition in `matchConditions` must be satisfied by the product context. Highest `specificity` wins. Fallback = `DEFAULT_POSITION` wrapped as `__default__` scenario.

- [ ] **Step 4.3: Run tests — 4 pass**
- [ ] **Step 4.4: Commit**

---

## Task 5: MadhabFilter (TDD)

**Files:**
- Create: `backend/src/domain/engine/madhab-filter.ts`
- Create: `backend/src/__tests__/unit/madhab-filter.test.ts`

Adjusts a scenario score based on the user's madhab ruling for that substance.

- [ ] **Step 5.1: Write failing test**

```typescript
import { describe, it, expect } from "vitest";
import { applyMadhabFilter } from "../../domain/engine/madhab-filter.js";
import type { MadhabRulingView } from "../../domain/ports/madhab-ruling-repo.js";

describe("madhab-filter", () => {
  it("returns base score when madhab is general", () => {
    const result = applyMadhabFilter(45, "general", null);
    expect(result.score).toBe(45);
    expect(result.madhabNote).toBeNull();
  });

  it("lowers score when madhab ruling is haram", () => {
    const ruling: MadhabRulingView = {
      substanceId: "SHELLAC", madhab: "hanafi", ruling: "haram",
      contemporarySplit: true, classicalSources: [], contemporarySources: [],
    };
    const result = applyMadhabFilter(45, "hanafi", ruling);
    expect(result.score).toBeLessThan(45);
    expect(result.madhabNote).toContain("hanafi");
  });

  it("raises score when madhab ruling is halal", () => {
    const ruling: MadhabRulingView = {
      substanceId: "SHELLAC", madhab: "shafii", ruling: "halal",
      contemporarySplit: false, classicalSources: [], contemporarySources: [],
    };
    const result = applyMadhabFilter(45, "shafii", ruling);
    expect(result.score).toBeGreaterThan(45);
  });

  it("flags contemporary split in note", () => {
    const ruling: MadhabRulingView = {
      substanceId: "SHELLAC", madhab: "hanafi", ruling: "doubtful",
      contemporarySplit: true, classicalSources: [], contemporarySources: [],
    };
    const result = applyMadhabFilter(45, "hanafi", ruling);
    expect(result.madhabNote).toContain("divergence");
  });

  it("clamps score to 0-100 range", () => {
    const ruling: MadhabRulingView = {
      substanceId: "X", madhab: "hanafi", ruling: "haram",
      contemporarySplit: false, classicalSources: [], contemporarySources: [],
    };
    const result = applyMadhabFilter(5, "hanafi", ruling);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 5.2: Implement madhab-filter.ts**

Pure function. Delta rules:
- ruling "haram" → score -= 15 (clamp 0)
- ruling "doubtful" → score -= 5
- ruling "halal" → score += 10 (clamp 100)
- contemporarySplit → append note "Divergence contemporaine dans votre école ({madhab})"
- madhab "general" → no change

- [ ] **Step 5.3: Run tests — 5 pass**
- [ ] **Step 5.4: Commit**

---

## Task 6: Aggregator (TDD)

**Files:**
- Create: `backend/src/domain/engine/aggregator.ts`
- Create: `backend/src/__tests__/unit/aggregator.test.ts`

Combines multiple module verdicts into a final score + verdict.

- [ ] **Step 6.1: Write failing test**

```typescript
import { describe, it, expect } from "vitest";
import { aggregate } from "../../domain/engine/aggregator.js";
import type { ModuleVerdict } from "../../domain/types/module-verdict.js";

function makeVerdict(overrides: Partial<ModuleVerdict>): ModuleVerdict {
  return {
    substanceId: "X", displayName: "X", score: 50, verdict: "mashbooh",
    scenarioKey: "test", rationaleFr: "test", rationaleAr: null,
    madhabNote: null, fatwaCount: 0, dossierId: "uuid", icon: "other",
    ...overrides,
  };
}

describe("aggregator", () => {
  it("returns halal for empty verdicts (analyzed clean)", () => {
    const result = aggregate([], "moderate");
    expect(result.verdict).toBe("halal");
    expect(result.score).toBe(90);
  });

  it("returns haram if any single module is haram", () => {
    const verdicts = [
      makeVerdict({ score: 80, verdict: "halal" }),
      makeVerdict({ score: 5, verdict: "haram" }),
    ];
    const result = aggregate(verdicts, "moderate");
    expect(result.verdict).toBe("haram");
  });

  it("uses weighted minimum for non-haram verdicts", () => {
    const verdicts = [
      makeVerdict({ score: 35, verdict: "mashbooh" }),
      makeVerdict({ score: 70, verdict: "halal_with_caution" }),
    ];
    const result = aggregate(verdicts, "moderate");
    expect(result.score).toBeLessThanOrEqual(40);
    expect(result.verdict).toBe("mashbooh");
  });

  it("applies strictness overlay — very_strict downgrades", () => {
    const verdicts = [makeVerdict({ score: 75, verdict: "halal_with_caution" })];
    const result = aggregate(verdicts, "very_strict");
    expect(result.score).toBeLessThan(75);
  });

  it("maps score to correct verdict bucket", () => {
    expect(aggregate([makeVerdict({ score: 95, verdict: "halal" })], "moderate").verdict).toBe("halal");
    expect(aggregate([makeVerdict({ score: 75, verdict: "halal_with_caution" })], "moderate").verdict).toBe("halal_with_caution");
    expect(aggregate([makeVerdict({ score: 50, verdict: "mashbooh" })], "moderate").verdict).toBe("mashbooh");
    expect(aggregate([makeVerdict({ score: 25, verdict: "avoid" })], "moderate").verdict).toBe("avoid");
    expect(aggregate([makeVerdict({ score: 10, verdict: "haram" })], "moderate").verdict).toBe("haram");
  });
});
```

- [ ] **Step 6.2: Implement aggregator.ts**

Pure function. Rules per spec §8.1:
- Any HARAM → final HARAM (score = min of haram modules)
- Else: score = weighted min (weight by inverse score — lower scores pull harder)
- Score→verdict: ≥90 HALAL, 70-89 HALAL_WITH_CAUTION, 40-69 MASHBOOH, 20-39 AVOID, <20 HARAM
- Strictness: relaxed=+0, moderate=+0, strict=-5 per module, very_strict=-10 per module

- [ ] **Step 6.3: Run tests — 5 pass**
- [ ] **Step 6.4: Commit**

---

## Task 7: HalalEngineV2 — Orchestrator (TDD)

**Files:**
- Create: `backend/src/domain/engine/halal-engine-v2.ts`
- Create: `backend/src/__tests__/unit/halal-engine-v2.test.ts`

The main engine class that ties matcher → scenarios → madhab → aggregator → report builder.

- [ ] **Step 7.1: Write failing test with mock repos**

```typescript
import { describe, it, expect } from "vitest";
import { HalalEngineV2 } from "../../domain/engine/halal-engine-v2.js";
import type { IDossierRepo } from "../../domain/ports/dossier-repo.js";
import type { IScenarioRepo } from "../../domain/ports/scenario-repo.js";
import type { IMadhabRulingRepo } from "../../domain/ports/madhab-ruling-repo.js";
import type { IMatchPatternRepo } from "../../domain/ports/match-pattern-repo.js";
import type { ProductContext } from "../../domain/types/product-context.js";
import type { HalalEvaluationContext } from "../../domain/types/halal-evaluation-context.js";

// Mock repos — inline, no external mock library
const mockDossierRepo: IDossierRepo = {
  getActive: async (id) => ({
    id: "uuid-1", substanceId: id, version: "2.0.0",
    dossierJson: { naqiy_position: { global_score: 45, verdict_internal_ingestion: "mashbooh" } },
    contentHash: "abc", fatwaCount: 12,
  }),
  batchGetActive: async (ids) => {
    const map = new Map();
    for (const id of ids) map.set(id, await mockDossierRepo.getActive(id));
    return map;
  },
};

const mockScenarioRepo: IScenarioRepo = {
  forSubstance: async () => [],
  batchForSubstances: async () => new Map(),
};

const mockMadhabRepo: IMadhabRulingRepo = {
  get: async () => null,
  batchGet: async () => new Map(),
};

const mockPatternRepo: IMatchPatternRepo = {
  getAllActive: async () => [
    { substanceId: "SHELLAC", patternType: "e_number", patternValue: "E904", lang: null, priority: 90, confidence: 1 },
  ],
};

function makeProductContext(overrides: Partial<ProductContext> = {}): ProductContext {
  return {
    barcode: "123", brand: null, brandOwner: null, productName: null,
    category: "candy", usage: "ingestion", meatClassification: null,
    substancesDetected: [
      { substance_id: "SHELLAC", matched_term: "gomme-laque", match_source: "canonical_fr", confidence: 0.95 },
    ],
    animalSourceHints: [], alcoholContext: { present: false, role: "none" },
    additivesTags: [], ingredientsList: [], ingredientsText: null,
    labelsTags: [], ingredientsAnalysisTags: [], completeness: null,
    extractionSource: "gemini",
    ...overrides,
  };
}

const evalCtx: HalalEvaluationContext = {
  madhab: "hanafi", strictness: "moderate", lang: "fr",
};

describe("HalalEngineV2", () => {
  it("evaluates a product with one detected substance", async () => {
    const engine = new HalalEngineV2(mockDossierRepo, mockScenarioRepo, mockMadhabRepo, mockPatternRepo);
    const report = await engine.evaluate(makeProductContext(), evalCtx);
    expect(report.verdict).toBeDefined();
    expect(report.signals).toHaveLength(1);
    expect(report.signals[0].substanceId).toBe("SHELLAC");
    expect(report.madhabApplied).toBe("hanafi");
    expect(report.engineVersion).toContain("v2");
  });

  it("returns analyzed_clean for product with no matches", async () => {
    const engine = new HalalEngineV2(mockDossierRepo, mockScenarioRepo, mockMadhabRepo, mockPatternRepo);
    const report = await engine.evaluate(
      makeProductContext({ substancesDetected: [], additivesTags: [] }),
      evalCtx,
    );
    expect(report.verdict).toBe("halal");
    expect(report.tier).toBe("analyzed_clean");
    expect(report.signals).toHaveLength(0);
  });

  it("uses batch loading for multiple substances (H17)", async () => {
    let batchCalled = false;
    const batchDossierRepo: IDossierRepo = {
      ...mockDossierRepo,
      batchGetActive: async (ids) => {
        batchCalled = true;
        return mockDossierRepo.batchGetActive(ids);
      },
    };
    const engine = new HalalEngineV2(batchDossierRepo, mockScenarioRepo, mockMadhabRepo, mockPatternRepo);
    await engine.evaluate(makeProductContext(), evalCtx);
    expect(batchCalled).toBe(true);
  });
});
```

- [ ] **Step 7.2: Implement halal-engine-v2.ts**

```typescript
import { matchModules } from "./module-matcher.js";
import { selectScenario } from "./scenario-selector.js";
import { applyMadhabFilter } from "./madhab-filter.js";
import { aggregate } from "./aggregator.js";
import type { IDossierRepo } from "../ports/dossier-repo.js";
import type { IScenarioRepo } from "../ports/scenario-repo.js";
import type { IMadhabRulingRepo } from "../ports/madhab-ruling-repo.js";
import type { IMatchPatternRepo } from "../ports/match-pattern-repo.js";
import type { ProductContext, HalalEvaluationContext, HalalReport, ModuleVerdict, HalalVerdict } from "../types/index.js";

const ENGINE_VERSION = "halal-engine-v2.0.0";

export class HalalEngineV2 {
  constructor(
    private dossiers: IDossierRepo,
    private scenarios: IScenarioRepo,
    private madhabRulings: IMadhabRulingRepo,
    private patterns: IMatchPatternRepo,
  ) {}

  async evaluate(product: ProductContext, ctx: HalalEvaluationContext): Promise<HalalReport> {
    // STEP 1 — Match modules (multi-source)
    const allPatterns = await this.patterns.getAllActive();
    const matches = matchModules(product, allPatterns);

    if (matches.length === 0) {
      return this.buildCleanReport(product, ctx);
    }

    // STEP 2 — Batch-load all data (H17: no N+1)
    const substanceIds = matches.map(m => m.substanceId);
    const [dossiersMap, scenariosMap, rulingsMap] = await Promise.all([
      this.dossiers.batchGetActive(substanceIds),
      this.scenarios.batchForSubstances(substanceIds),
      this.madhabRulings.batchGet(substanceIds, ctx.madhab),
    ]);

    // STEP 3 — Evaluate each module
    const verdicts: ModuleVerdict[] = [];
    for (const match of matches) {
      const dossier = dossiersMap.get(match.substanceId);
      if (!dossier) continue;

      const substanceScenarios = scenariosMap.get(match.substanceId) ?? [];
      const defaultPosition = extractDefaultPosition(dossier.dossierJson);
      const selected = selectScenario(substanceScenarios, {
        category: product.category,
        usage: product.usage,
        certified_halal: false,
      }, defaultPosition);

      const ruling = rulingsMap.get(match.substanceId) ?? null;
      const filtered = applyMadhabFilter(selected.score, ctx.madhab, ruling);

      verdicts.push({
        substanceId: match.substanceId,
        displayName: `${match.substanceId} (${match.matchedTerm})`,
        score: filtered.score,
        verdict: scoreToVerdict(filtered.score),
        scenarioKey: selected.scenarioKey,
        rationaleFr: selected.rationaleFr,
        rationaleAr: selected.rationaleAr ?? null,
        madhabNote: filtered.madhabNote,
        fatwaCount: dossier.fatwaCount ?? 0,
        dossierId: dossier.id,
        icon: inferIcon(match.substanceId),
      });
    }

    // STEP 4 — Aggregate
    const aggregated = aggregate(verdicts, ctx.strictness);

    // STEP 5 — Build report
    return {
      ...aggregated,
      confidence: computeConfidence(verdicts, product.extractionSource),
      tier: aggregated.verdict === "haram" ? "haram" : "doubtful",
      headlineFr: buildHeadline(aggregated.verdict, ctx.madhab, "fr"),
      headlineEn: buildHeadline(aggregated.verdict, ctx.madhab, "en"),
      headlineAr: buildHeadline(aggregated.verdict, ctx.madhab, "ar"),
      certifier: null,
      signals: verdicts,
      madhabApplied: ctx.madhab,
      madhabDivergence: verdicts.some(v => v.madhabNote !== null),
      hasFullDossier: true,
      engineVersion: ENGINE_VERSION,
      analysisSourceLabel: `Analyse Naqiy v2 · ${verdicts.length} substance(s) · ${verdicts.reduce((s, v) => s + v.fatwaCount, 0)} fatwas`,
    };
  }

  private buildCleanReport(product: ProductContext, ctx: HalalEvaluationContext): HalalReport {
    return {
      verdict: "halal", score: 90, confidence: 0.8,
      tier: "analyzed_clean",
      headlineFr: "Aucun ingrédient problématique détecté",
      headlineEn: "No problematic ingredient detected",
      headlineAr: "لم يتم اكتشاف أي مكون إشكالي",
      certifier: null, signals: [],
      madhabApplied: ctx.madhab, madhabDivergence: false,
      hasFullDossier: false, engineVersion: ENGINE_VERSION,
      analysisSourceLabel: "Analyse Naqiy v2 · Produit analysé propre",
    };
  }
}

// Helper functions (pure, exported for testing if needed)
function extractDefaultPosition(dossierJson: Record<string, unknown>) {
  const pos = dossierJson.naqiy_position as Record<string, unknown> | undefined;
  return {
    globalScore: (pos?.global_score as number) ?? 50,
    verdict: (pos?.verdict_internal_ingestion as string) ?? "mashbooh",
  };
}

function scoreToVerdict(score: number): HalalVerdict {
  if (score >= 90) return "halal";
  if (score >= 70) return "halal_with_caution";
  if (score >= 40) return "mashbooh";
  if (score >= 20) return "avoid";
  return "haram";
}

function computeConfidence(verdicts: ModuleVerdict[], source: string): number {
  const base = source === "gemini" ? 0.85 : source === "off_structured" ? 0.7 : 0.5;
  return Math.min(1, base * (verdicts.length > 0 ? 0.95 : 1));
}

function inferIcon(substanceId: string): ModuleVerdict["icon"] {
  if (["SHELLAC", "CARMINE"].includes(substanceId)) return "insect";
  if (["ALCOHOL_FLAVORINGS"].includes(substanceId)) return "alcohol";
  if (["GELATIN", "E471", "GLYCEROL", "RENNET", "LACTOSE_WHEY"].includes(substanceId)) return "animal";
  if (["SOY_LECITHIN"].includes(substanceId)) return "source";
  return "other";
}

function buildHeadline(verdict: HalalVerdict, madhab: string, lang: string): string {
  const headlines: Record<HalalVerdict, Record<string, string>> = {
    halal: { fr: "Aucun problème détecté", en: "No issues detected", ar: "لا مشكلة" },
    halal_with_caution: { fr: "Quelques points d'attention", en: "Some caution points", ar: "بعض نقاط الاحتراز" },
    mashbooh: { fr: `Discutable selon votre école`, en: `Questionable per your school`, ar: "مشبوه حسب مذهبك" },
    avoid: { fr: "À éviter selon votre école", en: "Avoid per your school", ar: "يُنصح بالتجنب" },
    haram: { fr: "Contient des éléments interdits", en: "Contains prohibited elements", ar: "يحتوي على عناصر محرّمة" },
  };
  return headlines[verdict]?.[lang] ?? headlines[verdict]?.fr ?? "";
}
```

- [ ] **Step 7.3: Run tests — 3 pass**
- [ ] **Step 7.4: Commit**

```bash
git commit -m "feat(engine): HalalEngineV2 orchestrator — Analyzed Track core

Ties ModuleMatcher → ScenarioSelector → MadhabFilter → Aggregator
into a single evaluate() call. Hexagonal: depends only on port
interfaces (IDossierRepo, IScenarioRepo, IMadhabRulingRepo,
IMatchPatternRepo). Batch-loads all data in parallel (H17).

3 unit tests with mock repos. Pure domain logic, zero infra.

Part of feat/halal-engine-v2 Phase 3."
```

---

## Task 8: Infra Adapters (Drizzle implementations)

**Files:**
- Create: `backend/src/infra/adapters/drizzle-dossier-repo.ts`
- Create: `backend/src/infra/adapters/drizzle-scenario-repo.ts`
- Create: `backend/src/infra/adapters/drizzle-madhab-ruling-repo.ts`
- Create: `backend/src/infra/adapters/drizzle-match-pattern-repo.ts`

Each adapter implements the corresponding port interface using Drizzle queries. In-memory cache with 10min TTL for patterns and scenarios (they rarely change).

- [ ] **Step 8.1: Implement all 4 adapters**

Each adapter follows this pattern:
```typescript
import { db } from "../../db/index.js";
import { substanceDossiers } from "../../db/schema/substance-dossiers.js";
import { eq, and, inArray } from "drizzle-orm";
import type { IDossierRepo, SubstanceDossierView } from "../../domain/ports/dossier-repo.js";

export class DrizzleDossierRepo implements IDossierRepo {
  async getActive(substanceId: string): Promise<SubstanceDossierView | null> {
    const [row] = await db.select().from(substanceDossiers)
      .where(and(eq(substanceDossiers.substanceId, substanceId), eq(substanceDossiers.isActive, true)))
      .limit(1);
    return row ? this.toView(row) : null;
  }

  async batchGetActive(substanceIds: string[]): Promise<Map<string, SubstanceDossierView>> {
    if (substanceIds.length === 0) return new Map();
    const rows = await db.select().from(substanceDossiers)
      .where(and(inArray(substanceDossiers.substanceId, substanceIds), eq(substanceDossiers.isActive, true)));
    const map = new Map<string, SubstanceDossierView>();
    for (const row of rows) map.set(row.substanceId, this.toView(row));
    return map;
  }

  private toView(row: any): SubstanceDossierView {
    return {
      id: row.id, substanceId: row.substanceId, version: row.version,
      dossierJson: row.dossierJson as Record<string, unknown>,
      contentHash: row.contentHash, fatwaCount: row.fatwaCount,
    };
  }
}
```

(Similar pattern for Scenario, MadhabRuling, MatchPattern repos.)

- [ ] **Step 8.2: Commit**

```bash
git commit -m "feat(infra): Drizzle adapters for 4 halal domain ports

DrizzleDossierRepo, DrizzleScenarioRepo, DrizzleMadhabRulingRepo,
DrizzleMatchPatternRepo. All support batch operations (H17).
MatchPatternRepo caches all active patterns for 10min (47→200 rows).

Part of feat/halal-engine-v2 Phase 3."
```

---

## Task 9: Golden Corpus Fixtures + Integration Smoke

**Files:**
- Create: `backend/src/__tests__/fixtures/halal/golden/shellac-candy-hanafi.json`
- Create: `backend/src/__tests__/fixtures/halal/golden/clean-product-moderate.json`

Golden fixtures = expected verdicts for real product scenarios across madhabs.

- [ ] **Step 9.1: Create 2 golden fixtures**

`shellac-candy-hanafi.json`:
```json
{
  "description": "Bonbon avec shellac E904, user hanafi moderate",
  "product": {
    "barcode": "test-001", "category": "candy", "usage": "ingestion",
    "substancesDetected": [
      { "substance_id": "SHELLAC", "matched_term": "gomme-laque", "match_source": "canonical_fr", "confidence": 0.95 }
    ]
  },
  "context": { "madhab": "hanafi", "strictness": "moderate", "lang": "fr" },
  "expected": {
    "verdict": "mashbooh",
    "scoreRange": [30, 50],
    "signalCount": 1,
    "madhabDivergence": true
  }
}
```

`clean-product-moderate.json`:
```json
{
  "description": "Produit sans substance détectée",
  "product": {
    "barcode": "test-002", "category": "bread", "usage": "ingestion",
    "substancesDetected": []
  },
  "context": { "madhab": "general", "strictness": "moderate", "lang": "fr" },
  "expected": {
    "verdict": "halal",
    "tier": "analyzed_clean",
    "signalCount": 0
  }
}
```

- [ ] **Step 9.2: Commit**

```bash
git commit -m "test(engine): add golden corpus fixtures for HalalEngineV2

2 initial fixtures: shellac-candy-hanafi (mashbooh expected),
clean-product (halal analyzed_clean expected). To be expanded to
200 fixtures across 5 madhabs in Phase 7.

Part of feat/halal-engine-v2 Phase 3."
```

---

## Task 10: Phase 3 verification + tag

- [ ] **Step 10.1: Run all Phase 3 tests**

```bash
cd backend && pnpm vitest run src/__tests__/unit/module-matcher.test.ts \
  src/__tests__/unit/scenario-selector.test.ts \
  src/__tests__/unit/madhab-filter.test.ts \
  src/__tests__/unit/aggregator.test.ts \
  src/__tests__/unit/halal-engine-v2.test.ts
```

- [ ] **Step 10.2: Full test suite**

```bash
cd backend && pnpm test:unit 2>&1 | tail -10
```

- [ ] **Step 10.3: TypeScript compile**
- [ ] **Step 10.4: Dossier validation**
- [ ] **Step 10.5: Tag + push**

```bash
git tag -a halal-v2-phase-3 -m "Halal Engine V2 — Phase 3 (HalalEngineV2 Analyzed Track) complete

- 4 port interfaces (hexagonal boundary)
- 5 pure domain types (C1 ethical parity type-enforced)
- ModuleMatcher: multi-source detection with priority dedup
- ScenarioSelector: specificity-ranked contextual scoring
- MadhabFilter: per-school delta with contemporary split flag
- Aggregator: worst-case weighted + strictness overlay + score→verdict
- HalalEngineV2 orchestrator: batch-loaded, 3 unit tests, mock repos
- 4 Drizzle infra adapters (H17 batch operations)
- Golden corpus: 2 initial fixtures

~20 new unit tests. Zero regression. Resolves H17."

git push origin feat/halal-engine-v2
git push origin halal-v2-phase-3
```

---

## Phase 3 Exit Criteria

1. ✅ 4 port interfaces in `domain/ports/`
2. ✅ 5 domain types in `domain/types/` (HalalEvaluationContext has ZERO tier fields)
3. ✅ ModuleMatcher with 4+ tests
4. ✅ ScenarioSelector with 4+ tests
5. ✅ MadhabFilter with 5+ tests
6. ✅ Aggregator with 5+ tests
7. ✅ HalalEngineV2 orchestrator with 3+ tests (mock repos)
8. ✅ 4 Drizzle infra adapters
9. ✅ 2 golden corpus fixtures
10. ✅ H17 batch loading resolved
11. ✅ Tag `halal-v2-phase-3` pushed

## Next phase

Phase 4: CertifierTrustEngine (Certified Track) — species-weighted, dossier-anchored trust scoring.

---

**End of Phase 3 plan.**
