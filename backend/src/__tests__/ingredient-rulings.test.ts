import { describe, it, expect, beforeEach } from "vitest";
import { db } from "./helpers/test-context.js";
import { ingredientRulings } from "../db/schema/index.js";
import {
  testPattern,
  resolveRulingForMadhab,
  matchIngredientRulings,
  _resetIngredientRulingsCache,
} from "../services/barcode.service.js";
import type { IngredientRuling } from "../db/schema/ingredient-rulings.js";

// Helper to seed a ruling row
async function seedRuling(
  overrides: Partial<typeof ingredientRulings.$inferInsert> = {},
) {
  const [row] = await db
    .insert(ingredientRulings)
    .values({
      compoundPattern: "test",
      matchType: "contains",
      priority: 0,
      rulingDefault: "halal",
      confidence: 0.9,
      explanationFr: "Test",
      isActive: true,
      ...overrides,
    })
    .returning();
  return row;
}

// ── Pure function tests ──────────────────────────────────────

describe("testPattern", () => {
  it('"vin" word_boundary does NOT match inside "vinaigre de vin"', () => {
    // This was the core false-positive bug — "vin" matched inside "vinaigre"
    // word_boundary uses \b, so "vin" only matches as a standalone word
    expect(testPattern("vinaigre de vin", "vin", "word_boundary")).toBe(true);
    // But it must NOT match when "vin" appears only as a substring
    expect(testPattern("vinaigre", "vin", "word_boundary")).toBe(false);
    expect(testPattern("vinaigre balsamique", "vin", "word_boundary")).toBe(false);
  });

  it("exact match requires full equality", () => {
    expect(testPattern("porc", "porc", "exact")).toBe(true);
    expect(testPattern("porc fumé", "porc", "exact")).toBe(false);
  });

  it("contains matches substrings", () => {
    expect(testPattern("gélatine porcine", "porcine", "contains")).toBe(true);
    expect(testPattern("farine de blé", "porc", "contains")).toBe(false);
  });

  it("regex works for complex patterns", () => {
    expect(testPattern("e120", "e1[0-2]0", "regex")).toBe(true);
    expect(testPattern("e130", "e1[0-2]0", "regex")).toBe(false);
  });

  it("invalid regex doesn't throw", () => {
    expect(testPattern("test", "[invalid(", "regex")).toBe(false);
  });
});

describe("resolveRulingForMadhab", () => {
  // Build a minimal IngredientRuling-like object
  const fakeRuling = {
    rulingDefault: "haram",
    rulingHanafi: "doubtful",
    rulingShafii: "haram",
    rulingMaliki: "doubtful",
    rulingHanbali: "haram",
  } as IngredientRuling;

  it('returns rulingDefault for "general" madhab', () => {
    expect(resolveRulingForMadhab(fakeRuling, "general")).toBe("haram");
  });

  it("returns hanafi-specific ruling for gélatine porcine = DOUBTFUL", () => {
    expect(resolveRulingForMadhab(fakeRuling, "hanafi")).toBe("doubtful");
  });

  it("falls back to rulingDefault when madhab column is null", () => {
    const ruling = { ...fakeRuling, rulingMaliki: null } as IngredientRuling;
    expect(resolveRulingForMadhab(ruling, "maliki")).toBe("haram");
  });
});

// ── Integration tests (DB-driven) ───────────────────────────

describe("matchIngredientRulings", () => {
  beforeEach(() => {
    _resetIngredientRulingsCache();
  });

  it('"vinaigre de vin" (priority 110) overrides "vin" (priority 30) → result is HALAL', async () => {
    // Seed: "vin" keyword as haram (low priority)
    await seedRuling({
      compoundPattern: "vin",
      matchType: "word_boundary",
      priority: 30,
      rulingDefault: "haram",
      confidence: 0.95,
      explanationFr: "Le vin est haram",
    });
    // Seed: "vinaigre de vin" compound as halal (high priority, overrides "vin")
    await seedRuling({
      compoundPattern: "vinaigre de vin",
      matchType: "contains",
      priority: 110,
      rulingDefault: "halal",
      confidence: 0.9,
      explanationFr: "Vinaigre de vin est licite",
      overridesKeyword: "vin",
    });

    const results = await matchIngredientRulings(
      "eau, sel, vinaigre de vin, moutarde",
      "general",
    );

    // "vinaigre de vin" should be present and halal
    const vinaigreMatch = results.find((r) => r.pattern === "vinaigre de vin");
    expect(vinaigreMatch).toBeDefined();
    expect(vinaigreMatch!.ruling).toBe("halal");

    // "vin" should be suppressed by the override system
    const vinMatch = results.find((r) => r.pattern === "vin");
    expect(vinMatch).toBeUndefined();
  });

  it('"gélatine porcine" (priority 90) overrides "gélatine" (priority 25) → result is HARAM', async () => {
    await seedRuling({
      compoundPattern: "gélatine",
      matchType: "contains",
      priority: 25,
      rulingDefault: "doubtful",
      confidence: 0.6,
      explanationFr: "Source non précisée",
    });
    await seedRuling({
      compoundPattern: "gélatine porcine",
      matchType: "contains",
      priority: 90,
      rulingDefault: "haram",
      confidence: 0.88,
      explanationFr: "Gélatine de porc — haram",
      overridesKeyword: "gélatine",
    });

    const results = await matchIngredientRulings(
      "sucre, gélatine porcine, arômes",
      "general",
    );

    const porcineMatch = results.find((r) => r.pattern === "gélatine porcine");
    expect(porcineMatch).toBeDefined();
    expect(porcineMatch!.ruling).toBe("haram");

    // "gélatine" generic should be suppressed
    const genericMatch = results.find((r) => r.pattern === "gélatine");
    expect(genericMatch).toBeUndefined();
  });

  it("isActive = false excludes ruling from results", async () => {
    await seedRuling({
      compoundPattern: "porc",
      matchType: "contains",
      priority: 50,
      rulingDefault: "haram",
      confidence: 0.99,
      explanationFr: "Porc",
      isActive: false, // Disabled
    });

    const results = await matchIngredientRulings("porc, eau", "general");

    expect(results).toHaveLength(0);
  });
});
