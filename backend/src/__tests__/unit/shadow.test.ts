import { describe, it, expect } from "vitest";
import { runShadowExtraction } from "../../services/ai-extract/shadow.js";

describe("shadow mode", () => {
  const mockV1 = async () => ({ ingredients: ["sucre"], additives: [], lang: "fr" });
  const mockV2 = async () => ({
    ingredients: ["sucre"], additives: [], lang: "fr",
    product_category: "candy" as const, product_usage: "ingestion" as const,
    detected_substances: [], animal_source_hints: [],
    alcohol_context: { present: false, role: "none" as const },
    meat_classification: null,
    novaEstimate: 4 as const, allergenHints: [], containsAlcohol: false, isOrganic: false,
  });
  const mockV2Fail = async () => { throw new Error("Gemini down"); };

  it("off mode returns V1 only", async () => {
    const r = await runShadowExtraction("x", mockV1, mockV2, "off");
    expect(r.source).toBe("v1");
    expect(r.shadowDivergences).toBeUndefined();
  });

  it("on mode returns V2 only", async () => {
    const r = await runShadowExtraction("x", mockV1, mockV2, "on");
    expect(r.source).toBe("v2");
  });

  it("shadow mode returns V1 as primary with divergences", async () => {
    const r = await runShadowExtraction("x", mockV1, mockV2, "shadow");
    expect(r.source).toBe("v1");
    expect(r.shadowDivergences).toBeDefined();
    expect(r.shadowDivergences!.convergent).toBe(true);
  });

  it("shadow mode handles V2 failure gracefully", async () => {
    const r = await runShadowExtraction("x", mockV1, mockV2Fail, "shadow");
    expect(r.source).toBe("v1");
    expect(r.primary).not.toBeNull();
    // V2 failed, no divergences computed
  });
});
