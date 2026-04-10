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
