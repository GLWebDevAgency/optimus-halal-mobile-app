/**
 * Data Pipeline Audit — cross-references OFF raw data, normalizer,
 * and ingredient ruling matching to find coverage gaps.
 *
 * Tests the FULL chain: ingredients_text → normalizeIngredientText() → testPattern()
 * This catches mismatches between what OFF provides and what our rulings detect.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  normalizeIngredientText,
  stripDiacritics,
} from "../../services/ingredient-normalizer.js";
import { testPattern } from "../../services/barcode.service.js";

// ── Simulate the matching pipeline ───────────────────────────
// This mirrors matchIngredientRulings() logic without DB access.

interface SimulatedRuling {
  compoundPattern: string;
  matchType: "exact" | "contains" | "word_boundary" | "regex";
  priority: number;
  ruling: string; // halal | haram | doubtful
  overridesKeyword?: string;
}

// Subset of ingredient_rulings that are relevant for our test products
const RELEVANT_RULINGS: SimulatedRuling[] = [
  // Safe compounds (priority 100+)
  { compoundPattern: "vinaigre de vin", matchType: "contains", priority: 110, ruling: "doubtful", overridesKeyword: "vin" },
  { compoundPattern: "vinaigre", matchType: "word_boundary", priority: 105, ruling: "halal", overridesKeyword: "vin" },
  { compoundPattern: "vinegar", matchType: "word_boundary", priority: 105, ruling: "halal", overridesKeyword: "wine" },
  { compoundPattern: "wine vinegar", matchType: "contains", priority: 110, ruling: "doubtful", overridesKeyword: "wine" },
  { compoundPattern: "gélatine bovine halal", matchType: "contains", priority: 100, ruling: "halal" },
  { compoundPattern: "gélatine de poisson", matchType: "contains", priority: 100, ruling: "halal" },
  { compoundPattern: "présure microbienne", matchType: "contains", priority: 100, ruling: "halal" },

  // Haram compounds (50-99)
  { compoundPattern: "gélatine porcine", matchType: "contains", priority: 90, ruling: "haram" },
  { compoundPattern: "gélatine de porc", matchType: "contains", priority: 90, ruling: "haram" },
  { compoundPattern: "graisse de porc", matchType: "contains", priority: 90, ruling: "haram" },

  // Keywords (1-49)
  { compoundPattern: "porc", matchType: "word_boundary", priority: 40, ruling: "haram" },
  { compoundPattern: "pork", matchType: "word_boundary", priority: 40, ruling: "haram" },
  { compoundPattern: "lard", matchType: "word_boundary", priority: 35, ruling: "haram" },
  { compoundPattern: "saindoux", matchType: "word_boundary", priority: 35, ruling: "haram" },
  { compoundPattern: "gelatin", matchType: "word_boundary", priority: 25, ruling: "doubtful" },
  { compoundPattern: "gélatine", matchType: "word_boundary", priority: 25, ruling: "doubtful" },
  { compoundPattern: "vin", matchType: "word_boundary", priority: 30, ruling: "haram" },
  { compoundPattern: "wine", matchType: "word_boundary", priority: 30, ruling: "haram" },
  { compoundPattern: "alcool", matchType: "word_boundary", priority: 30, ruling: "haram" },
  { compoundPattern: "alcohol", matchType: "word_boundary", priority: 30, ruling: "haram" },
  { compoundPattern: "carmine", matchType: "word_boundary", priority: 30, ruling: "haram" },
  { compoundPattern: "cochineal", matchType: "word_boundary", priority: 30, ruling: "haram" },
  { compoundPattern: "rennet", matchType: "word_boundary", priority: 20, ruling: "doubtful" },
  { compoundPattern: "présure", matchType: "word_boundary", priority: 20, ruling: "doubtful" },
  { compoundPattern: "whey", matchType: "word_boundary", priority: 18, ruling: "doubtful" },
  { compoundPattern: "lactosérum", matchType: "word_boundary", priority: 18, ruling: "doubtful" },
  { compoundPattern: "mono-", matchType: "contains", priority: 15, ruling: "doubtful" },
  { compoundPattern: "e471", matchType: "word_boundary", priority: 15, ruling: "doubtful" },
  { compoundPattern: "e441", matchType: "word_boundary", priority: 50, ruling: "haram" },
  { compoundPattern: "e120", matchType: "word_boundary", priority: 30, ruling: "haram" },
  { compoundPattern: "e542", matchType: "word_boundary", priority: 50, ruling: "haram" },
  { compoundPattern: "l-cystéine", matchType: "word_boundary", priority: 20, ruling: "doubtful" },
  { compoundPattern: "e920", matchType: "word_boundary", priority: 20, ruling: "doubtful" },
];

function simulateMatching(rawText: string): { pattern: string; ruling: string; priority: number }[] {
  const normalized = normalizeIngredientText(rawText);
  const lower = normalized.toLowerCase();

  const overrideMap = new Map<string, number>();
  const directMatches: SimulatedRuling[] = [];

  for (const ruling of RELEVANT_RULINGS) {
    const pattern = ruling.compoundPattern.toLowerCase();
    if (!testPattern(lower, pattern, ruling.matchType)) continue;
    directMatches.push(ruling);
    if (ruling.overridesKeyword) {
      const key = ruling.overridesKeyword.toLowerCase();
      const existing = overrideMap.get(key) ?? 0;
      if (ruling.priority > existing) overrideMap.set(key, ruling.priority);
    }
  }

  const sorted = directMatches.sort((a, b) => b.priority - a.priority);
  const results: { pattern: string; ruling: string; priority: number }[] = [];
  const seenPatterns = new Set<string>();

  for (const ruling of sorted) {
    const patternKey = ruling.compoundPattern.toLowerCase();
    if (seenPatterns.has(patternKey)) continue;
    const overridePriority = overrideMap.get(patternKey);
    if (overridePriority !== undefined && overridePriority > ruling.priority) continue;
    seenPatterns.add(patternKey);
    results.push({ pattern: ruling.compoundPattern, ruling: ruling.ruling, priority: ruling.priority });
  }

  return results;
}

// ══════════════════════════════════════════════════════════════
// NUTELLA — OFF raw ingredients_text
// ══════════════════════════════════════════════════════════════

describe("Pipeline Audit — Nutella (3017620422003)", () => {
  const RAW_TEXT = "Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants: lécithines [SOJA), vanilline. Sans gluten.";

  it("normalization handles 'LACTOSERUM' → matches 'lactosérum' via diacritics stripping", () => {
    const normalized = normalizeIngredientText(RAW_TEXT).toLowerCase();
    // testPattern now strips diacritics from both sides:
    // pattern "lactosérum" → "lactoserum", text "lactoserum" → "lactoserum" → MATCH
    const matchResult = testPattern(normalized, "lactosérum", "word_boundary");
    expect(matchResult).toBe(true); // FIXED: diacritics-insensitive matching
  });

  it("Nutella's LACTOSERUM now matches 'lactosérum' ruling", () => {
    const results = simulateMatching(RAW_TEXT);
    const wheyMatch = results.find((r) => r.pattern === "lactosérum" || r.pattern === "whey");
    expect(wheyMatch).toBeDefined(); // FIXED: accent-insensitive matching
    expect(wheyMatch!.ruling).toBe("doubtful");
  });

  it("no false haram/doubtful for 'lécithines' or 'vanilline'", () => {
    const results = simulateMatching(RAW_TEXT);
    const badMatches = results.filter((r) => r.ruling === "haram" || r.ruling === "doubtful");
    // We should NOT have false positives like "vin" matching inside "vanilline"
    const vinMatch = badMatches.find((r) => r.pattern === "vin");
    expect(vinMatch).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════
// TOASTILIGNE — OFF raw ingredients_text
// ══════════════════════════════════════════════════════════════

describe("Pipeline Audit — Toastiligne (3760049790252)", () => {
  const RAW_TEXT = "Farine complète de BLÉ* 61%, eau, GLUTEN DE BLÉ, levure sel, farine de BLÉ*0,7%, vinaigre, conservateur : propionate de calcium, émulsifiant : mono - et diglycérides d'acides gras (origine végétale), agent de traitement de la farine : acide ascorbique. Traces éventuelles de soja, moutarde et graines de sésame. * Ingrédients issus du commerce équitable français.";

  it("matches 'vinaigre' as halal (not 'vin')", () => {
    const results = simulateMatching(RAW_TEXT);
    const vinaigreMatch = results.find((r) => r.pattern === "vinaigre");
    expect(vinaigreMatch).toBeDefined();
    expect(vinaigreMatch!.ruling).toBe("halal");

    // "vin" must be overridden by "vinaigre"
    const vinMatch = results.find((r) => r.pattern === "vin");
    expect(vinMatch).toBeUndefined();
  });

  it("matches 'mono-' as doubtful (E471 emulsifier)", () => {
    const results = simulateMatching(RAW_TEXT);
    const monoMatch = results.find((r) => r.pattern === "mono-");
    expect(monoMatch).toBeDefined();
    expect(monoMatch!.ruling).toBe("doubtful");
  });
});

// ══════════════════════════════════════════════════════════════
// ACCENT MATCHING — the core problem
// ══════════════════════════════════════════════════════════════

describe("Pipeline Audit — Accent matching (FIXED)", () => {
  it("'lactosérum' pattern matches 'lactoserum' (no accent) via diacritics stripping", () => {
    expect(testPattern("lactoserum en poudre", "lactosérum", "word_boundary")).toBe(true);
  });

  it("'gélatine' pattern matches 'gelatine' (no accent) via diacritics stripping", () => {
    expect(testPattern("gelatine de boeuf", "gélatine", "word_boundary")).toBe(true);
  });

  it("'présure' pattern matches 'presure' (no accent) via diacritics stripping", () => {
    expect(testPattern("presure animale", "présure", "word_boundary")).toBe(true);
  });

  it("'éthanol' pattern matches 'ethanol' (no accent) via diacritics stripping", () => {
    expect(testPattern("ethanol", "éthanol", "word_boundary")).toBe(true);
  });

  it("'l-cystéine' pattern matches 'l-cysteine' (no accent) via diacritics stripping", () => {
    expect(testPattern("l-cysteine", "l-cystéine", "word_boundary")).toBe(true);
  });

  it("'bière' pattern matches 'biere' (no accent) via diacritics stripping", () => {
    expect(testPattern("biere", "bière", "word_boundary")).toBe(true);
  });

  it("accented pattern still matches accented text (exact match preserved)", () => {
    expect(testPattern("gélatine de boeuf", "gélatine", "word_boundary")).toBe(true);
  });

  it("'contains' match type also handles diacritics", () => {
    expect(testPattern("gelatine bovine halal", "gélatine bovine halal", "contains")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════
// PRODUCTS WITH WINE VINEGAR
// ══════════════════════════════════════════════════════════════

describe("Pipeline Audit — Wine vinegar products", () => {
  it("'vinaigre de vin rouge' matches 'vinaigre de vin' (contains)", () => {
    const results = simulateMatching("tomates, vinaigre de vin rouge, huile d'olive, sel");
    const match = results.find((r) => r.pattern === "vinaigre de vin");
    expect(match).toBeDefined();
    expect(match!.ruling).toBe("doubtful");
    // "vin" should be overridden
    expect(results.find((r) => r.pattern === "vin")).toBeUndefined();
  });

  it("'wine vinegar' in English text matches correctly", () => {
    const results = simulateMatching("tomatoes, wine vinegar, olive oil, salt");
    const match = results.find((r) => r.pattern === "wine vinegar");
    expect(match).toBeDefined();
    expect(match!.ruling).toBe("doubtful");
    // "wine" should be overridden
    expect(results.find((r) => r.pattern === "wine")).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════
// OFF REAL-WORLD TEXT VARIANTS
// ══════════════════════════════════════════════════════════════

describe("Pipeline Audit — Real-world OFF text variants", () => {
  it("handles German product (Schweinefett → graisse de porc via synonym)", () => {
    const normalized = normalizeIngredientText("Schweinefett, Salz, Wasser");
    // Synonym injection should append: " | graisse de porc"
    expect(normalized.toLowerCase()).toContain("graisse de porc");
  });

  it("handles Italian product (gelatina → gélatine via synonym)", () => {
    const normalized = normalizeIngredientText("zucchero, gelatina, aromi");
    expect(normalized.toLowerCase()).toContain("gélatine");
  });

  it("handles OCR-degraded text (gé1atine → gélatine)", () => {
    const normalized = normalizeIngredientText("sucre, gé1atine, arôme");
    expect(normalized.toLowerCase()).toContain("gélatine");
    expect(normalized.toLowerCase()).not.toContain("gé1atine");
  });

  it("handles E-code variants (E.471, E 471 → e471)", () => {
    const normalized = normalizeIngredientText("émulsifiant : E.471, antioxydant : E 300");
    expect(normalized.toLowerCase()).toContain("e471");
    expect(normalized.toLowerCase()).toContain("e300");
  });
});
