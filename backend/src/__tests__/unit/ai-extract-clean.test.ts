import { describe, it, expect } from "vitest";
import { cleanResult } from "../../services/ai-extract/index.js";
import type { ExtractionResult } from "../../services/ai-extract/index.js";

// ── Helpers ───────────────────────────────────────────────────

function makeRaw(overrides: Partial<ExtractionResult> = {}): ExtractionResult {
  return {
    ingredients: ["sucre", "huile de palme", "noisettes"],
    additives: ["e322"],
    lang: "fr",
    ...overrides,
  };
}

// ── Compound Ingredient Preservation ─────────────────────────

describe("cleanResult — compound ingredient preservation", () => {
  it("preserves 'vinaigre de vin' as a complete compound", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["Farine de blé", "Eau", "Vinaigre de vin", "Sel"],
    }));
    expect(result.ingredients).toContain("vinaigre de vin");
  });

  it("preserves 'gélatine de porc' as a complete compound", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["Sucre", "Gélatine de porc", "Arôme"],
    }));
    expect(result.ingredients).toContain("gélatine de porc");
  });

  it("preserves 'gélatine bovine' as a complete compound", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["Sucre", "Gélatine bovine", "Arôme"],
    }));
    expect(result.ingredients).toContain("gélatine bovine");
  });

  it("preserves 'graisse de porc' as a complete compound", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["Graisse de porc", "Sel"],
    }));
    expect(result.ingredients).toContain("graisse de porc");
  });

  it("preserves 'huile de palme' as a complete compound", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["Huile de palme", "Sucre"],
    }));
    expect(result.ingredients).toContain("huile de palme");
  });

  it("preserves 'lait écrémé en poudre' as a complete compound", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["LAIT écrémé en poudre", "Sucre"],
    }));
    expect(result.ingredients).toContain("lait écrémé en poudre");
  });

  it("preserves 'mono - et diglycérides d'acides gras' as a complete compound", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["Mono - et diglycérides d'acides gras (origine végétale)"],
    }));
    expect(result.ingredients).toContain("mono - et diglycérides d'acides gras (origine végétale)");
  });

  it("preserves 'arôme naturel de vanille' as a complete compound", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["Arôme naturel de vanille"],
    }));
    expect(result.ingredients).toContain("arôme naturel de vanille");
  });
});

// ── Basic Cleaning ───────────────────────────────────────────

describe("cleanResult — basic cleaning", () => {
  it("lowercases all ingredients", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["SUCRE", "Huile De Palme", "NOISETTES 13%"],
    }));
    expect(result.ingredients).toEqual(["sucre", "huile de palme", "noisettes 13%"]);
  });

  it("trims whitespace from ingredients", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["  sucre  ", "sel "],
    }));
    expect(result.ingredients).toEqual(["sucre", "sel"]);
  });

  it("removes empty strings", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["sucre", "", "  ", "sel"],
    }));
    expect(result.ingredients).toEqual(["sucre", "sel"]);
  });

  it("deduplicates ingredients", () => {
    const result = cleanResult(makeRaw({
      ingredients: ["sucre", "sel", "Sucre", "SEL"],
    }));
    expect(result.ingredients).toEqual(["sucre", "sel"]);
  });

  it("normalizes additive codes to lowercase", () => {
    const result = cleanResult(makeRaw({
      additives: ["E322", "e471", "E300"],
    }));
    expect(result.additives).toEqual(["e322", "e471", "e300"]);
  });

  it("deduplicates additives", () => {
    const result = cleanResult(makeRaw({
      additives: ["e322", "E322", "e322i"],
    }));
    expect(result.additives).toEqual(["e322", "e322i"]);
  });

  it("defaults lang to 'unknown' when missing", () => {
    const result = cleanResult(makeRaw({ lang: undefined as any }));
    expect(result.lang).toBe("unknown");
  });
});

// ── V2 Enrichment Fields ─────────────────────────────────────

describe("cleanResult — V2 enrichment fields", () => {
  it("preserves valid novaEstimate (1-4)", () => {
    expect(cleanResult(makeRaw({ novaEstimate: 1 })).novaEstimate).toBe(1);
    expect(cleanResult(makeRaw({ novaEstimate: 4 })).novaEstimate).toBe(4);
  });

  it("drops invalid novaEstimate (0 or 5)", () => {
    expect(cleanResult(makeRaw({ novaEstimate: 0 as any })).novaEstimate).toBeUndefined();
    expect(cleanResult(makeRaw({ novaEstimate: 5 as any })).novaEstimate).toBeUndefined();
  });

  it("drops null/undefined novaEstimate", () => {
    expect(cleanResult(makeRaw({ novaEstimate: null as any })).novaEstimate).toBeUndefined();
    expect(cleanResult(makeRaw({})).novaEstimate).toBeUndefined();
  });

  it("preserves allergenHints and normalizes them", () => {
    const result = cleanResult(makeRaw({
      allergenHints: ["Gluten", "MILK", " soy "],
    }));
    expect(result.allergenHints).toEqual(["gluten", "milk", "soy"]);
  });

  it("deduplicates allergenHints", () => {
    const result = cleanResult(makeRaw({
      allergenHints: ["milk", "Milk", "MILK"],
    }));
    expect(result.allergenHints).toEqual(["milk"]);
  });

  it("drops empty allergenHints array", () => {
    const result = cleanResult(makeRaw({ allergenHints: [] }));
    expect(result.allergenHints).toBeUndefined();
  });

  it("preserves containsAlcohol boolean", () => {
    expect(cleanResult(makeRaw({ containsAlcohol: true })).containsAlcohol).toBe(true);
    expect(cleanResult(makeRaw({ containsAlcohol: false })).containsAlcohol).toBe(false);
  });

  it("drops non-boolean containsAlcohol", () => {
    expect(cleanResult(makeRaw({ containsAlcohol: "yes" as any })).containsAlcohol).toBeUndefined();
  });

  it("preserves isOrganic boolean", () => {
    expect(cleanResult(makeRaw({ isOrganic: true })).isOrganic).toBe(true);
    expect(cleanResult(makeRaw({ isOrganic: false })).isOrganic).toBe(false);
  });

  it("drops non-boolean isOrganic", () => {
    expect(cleanResult(makeRaw({ isOrganic: 1 as any })).isOrganic).toBeUndefined();
  });
});

// ── Real-World Product Scenarios ─────────────────────────────

describe("cleanResult — real product scenarios", () => {
  it("Nutella ingredients preserved correctly", () => {
    const result = cleanResult(makeRaw({
      ingredients: [
        "Sucre", "huile de palme", "NOISETTES 13%", "cacao maigre 7,4%",
        "LAIT écrémé en poudre 6,6%", "LACTOSERUM en poudre",
        "lécithines de SOJA", "vanilline",
      ],
      additives: ["e322"],
      lang: "fr",
      novaEstimate: 4,
      allergenHints: ["milk", "nuts", "soybeans"],
    }));

    expect(result.ingredients).toContain("huile de palme");
    expect(result.ingredients).toContain("lait écrémé en poudre 6,6%");
    expect(result.ingredients).toContain("lactoserum en poudre");
    expect(result.additives).toEqual(["e322"]);
    expect(result.novaEstimate).toBe(4);
    expect(result.allergenHints).toEqual(["milk", "nuts", "soybeans"]);
  });

  it("Toastiligne ingredients preserved correctly", () => {
    const result = cleanResult(makeRaw({
      ingredients: [
        "farine complète de blé", "eau", "gluten de blé", "levure", "sel",
        "farine de blé", "vinaigre", "propionate de calcium",
        "mono - et diglycérides d'acides gras (origine végétale)",
        "acide ascorbique",
      ],
      additives: ["e282", "e300", "e471"],
      lang: "fr",
      novaEstimate: 3,
      allergenHints: ["gluten"],
    }));

    expect(result.ingredients).toContain("vinaigre");
    expect(result.ingredients).toContain("mono - et diglycérides d'acides gras (origine végétale)");
    expect(result.additives).toEqual(["e282", "e300", "e471"]);
    expect(result.novaEstimate).toBe(3);
  });

  it("Product with wine vinegar preserved correctly", () => {
    const result = cleanResult(makeRaw({
      ingredients: [
        "tomates", "vinaigre de vin", "huile d'olive", "sel", "ail",
      ],
      additives: [],
      lang: "fr",
    }));

    expect(result.ingredients).toContain("vinaigre de vin");
    // Should NOT be simplified to just "vinaigre"
    expect(result.ingredients).not.toContain("vinaigre");
  });
});
