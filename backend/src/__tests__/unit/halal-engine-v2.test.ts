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
