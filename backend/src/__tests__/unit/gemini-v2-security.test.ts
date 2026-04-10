import { describe, it, expect } from "vitest";
import { validateSemanticResult } from "../../services/ai-extract/providers/gemini-v2.provider.js";

describe("gemini-v2 security guards", () => {
  const sourceText = "sucre, huile de palme, gomme-laque, lécithine de soja";

  it("accepts valid matched_term that is substring of source", () => {
    const result = {
      detected_substances: [
        { substance_id: "SHELLAC", matched_term: "gomme-laque", match_source: "canonical_fr", confidence: 0.95 },
      ],
    };
    const validated = validateSemanticResult(result as any, sourceText);
    expect(validated.detected_substances).toHaveLength(1);
  });

  it("rejects matched_term that is NOT a substring of source (C6)", () => {
    const result = {
      detected_substances: [
        { substance_id: "SHELLAC", matched_term: "HALLUCINATED_TERM", match_source: "alias", confidence: 0.9 },
      ],
    };
    const validated = validateSemanticResult(result as any, sourceText);
    expect(validated.detected_substances).toHaveLength(0); // stripped
  });

  it("rejects substances with confidence below 0.6", () => {
    const result = {
      detected_substances: [
        { substance_id: "SHELLAC", matched_term: "gomme-laque", match_source: "canonical_fr", confidence: 0.3 },
      ],
    };
    const validated = validateSemanticResult(result as any, sourceText);
    expect(validated.detected_substances).toHaveLength(0);
  });

  it("strips duplicate substance_ids keeping highest confidence", () => {
    const result = {
      detected_substances: [
        { substance_id: "SHELLAC", matched_term: "gomme laque", match_source: "canonical_fr", confidence: 0.9 },
        { substance_id: "SHELLAC", matched_term: "gomme laque", match_source: "alias", confidence: 0.7 },
      ],
    };
    const validated = validateSemanticResult(result as any, sourceText.replace(/-/g, " "));
    expect(validated.detected_substances).toHaveLength(1);
    expect(validated.detected_substances[0].confidence).toBe(0.9);
  });
});
