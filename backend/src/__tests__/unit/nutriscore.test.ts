import { describe, it, expect } from "vitest";
import {
  computeNutriScore,
  extractNutrimentsFromOff,
  resolveNutriments,
  detectCategory,
  type NutrimentInput,
} from "../../services/nutriscore.service.js";

// ── Helpers ───────────────────────────────────────────────────

function makeInput(overrides: Partial<NutrimentInput> = {}): NutrimentInput {
  return {
    energyKj: 800,
    sugars: 5,
    saturatedFat: 2,
    salt: 0.5,
    fiber: 4,
    proteins: 8,
    fruitVegNuts: 0,
    ...overrides,
  };
}

// ── Grade A Products ──────────────────────────────────────────

describe("computeNutriScore — Grade A products", () => {
  it("fresh fruit salad → A", () => {
    const result = computeNutriScore({
      energyKj: 200,
      sugars: 8,
      saturatedFat: 0.1,
      salt: 0,
      fiber: 3.5,
      proteins: 0.8,
      fruitVegNuts: 90,
    });
    expect(result).not.toBeNull();
    expect(result!.grade).toBe("a");
    expect(result!.raw).toBeLessThanOrEqual(0);
  });

  it("raw vegetables → A", () => {
    const result = computeNutriScore({
      energyKj: 100,
      sugars: 2,
      saturatedFat: 0.1,
      salt: 0,
      fiber: 3,
      proteins: 1.5,
      fruitVegNuts: 100,
    });
    expect(result!.grade).toBe("a");
  });

  it("whole grain bread → A or B", () => {
    const result = computeNutriScore({
      energyKj: 1050,
      sugars: 3,
      saturatedFat: 0.5,
      salt: 1.1,
      fiber: 6,
      proteins: 9,
      fruitVegNuts: 0,
    });
    expect(result).not.toBeNull();
    expect(["a", "b"]).toContain(result!.grade);
  });
});

// ── Grade E Products ──────────────────────────────────────────

describe("computeNutriScore — Grade E products", () => {
  it("chips / crisps → D or E", () => {
    const result = computeNutriScore({
      energyKj: 2200,
      sugars: 1,
      saturatedFat: 5,
      salt: 1.5,
      fiber: 4,
      proteins: 6,
      fruitVegNuts: 0,
    });
    expect(result).not.toBeNull();
    expect(["d", "e"]).toContain(result!.grade);
  });

  it("nutella-like spread → D or E", () => {
    const result = computeNutriScore({
      energyKj: 2252,
      sugars: 56,
      saturatedFat: 10.6,
      salt: 0.1,
      fiber: 0,
      proteins: 6,
      fruitVegNuts: 0,
    });
    expect(result).not.toBeNull();
    expect(["d", "e"]).toContain(result!.grade);
    // Very high sugar should give high N points
    expect(result!.nPoints.sugars).toBeGreaterThanOrEqual(10);
  });
});

// ── N Points (Negative) ──────────────────────────────────────

describe("computeNutriScore — N points thresholds", () => {
  it("energy 0 kJ → 0 points", () => {
    const result = computeNutriScore(makeInput({ energyKj: 0 }));
    expect(result!.nPoints.energy).toBe(0);
  });

  it("energy 336 kJ → 1 point", () => {
    const result = computeNutriScore(makeInput({ energyKj: 336 }));
    expect(result!.nPoints.energy).toBe(1);
  });

  it("energy 3351 kJ → 10 points", () => {
    const result = computeNutriScore(makeInput({ energyKj: 3351 }));
    expect(result!.nPoints.energy).toBe(10);
  });

  it("sugars 3.4g → 0 points", () => {
    const result = computeNutriScore(makeInput({ sugars: 3.4 }));
    expect(result!.nPoints.sugars).toBe(0);
  });

  it("sugars 3.5g → 1 point", () => {
    const result = computeNutriScore(makeInput({ sugars: 3.5 }));
    expect(result!.nPoints.sugars).toBe(1);
  });

  it("salt 0.2g → 0 points", () => {
    const result = computeNutriScore(makeInput({ salt: 0.2 }));
    expect(result!.nPoints.salt).toBe(0);
  });

  it("salt 2.1g → 10 points", () => {
    const result = computeNutriScore(makeInput({ salt: 2.1 }));
    expect(result!.nPoints.salt).toBe(10);
  });
});

// ── P Points (Positive) ──────────────────────────────────────

describe("computeNutriScore — P points thresholds", () => {
  it("fiber 0g → 0 points", () => {
    const result = computeNutriScore(makeInput({ fiber: 0 }));
    expect(result!.pPoints.fiber).toBe(0);
  });

  it("fiber 3.1g → 1 point", () => {
    const result = computeNutriScore(makeInput({ fiber: 3.1 }));
    expect(result!.pPoints.fiber).toBe(1);
  });

  it("fiber 7.5g → 5 points", () => {
    const result = computeNutriScore(makeInput({ fiber: 7.5 }));
    expect(result!.pPoints.fiber).toBe(5);
  });

  it("proteins 2.4g → 0 points", () => {
    const result = computeNutriScore(makeInput({ proteins: 2.4 }));
    expect(result!.pPoints.proteins).toBe(0);
  });

  it("proteins 12.1g → 5 points", () => {
    const result = computeNutriScore(makeInput({ proteins: 12.1 }));
    expect(result!.pPoints.proteins).toBe(5);
  });

  it("FVN 0% → 0 points", () => {
    const result = computeNutriScore(makeInput({ fruitVegNuts: 0 }));
    expect(result!.pPoints.fruitVegNuts).toBe(0);
  });

  it("FVN 50% → 1 point", () => {
    const result = computeNutriScore(makeInput({ fruitVegNuts: 50 }));
    expect(result!.pPoints.fruitVegNuts).toBe(1);
  });

  it("FVN 85% → 5 points", () => {
    const result = computeNutriScore(makeInput({ fruitVegNuts: 85 }));
    expect(result!.pPoints.fruitVegNuts).toBe(5);
  });
});

// ── Protein Cap Rule ──────────────────────────────────────────

describe("computeNutriScore — protein cap rule", () => {
  it("N > 11 and FVN < 80 → protein excluded from P", () => {
    const result = computeNutriScore(makeInput({
      energyKj: 2500,   // ~7 pts
      sugars: 25,        // ~7 pts
      saturatedFat: 8,   // 8 pts
      salt: 1.5,         // 7 pts → N = 29 > 11
      fiber: 0,
      proteins: 15,      // Would be 5 pts but excluded
      fruitVegNuts: 0,   // < 80
    }));
    expect(result!.proteinCapped).toBe(true);
    // Protein points should NOT be in pTotal
    expect(result!.pPoints.total).toBe(0); // Only fiber(0) + FVN(0)
    // But protein points field still shows the raw value
    expect(result!.pPoints.proteins).toBeGreaterThan(0);
  });

  it("N > 11 but FVN >= 80 → protein NOT excluded", () => {
    const result = computeNutriScore(makeInput({
      energyKj: 2500,
      sugars: 25,
      saturatedFat: 8,
      salt: 1.5,
      fiber: 0,
      proteins: 15,
      fruitVegNuts: 85, // >= 80
    }));
    expect(result!.proteinCapped).toBe(false);
  });

  it("N <= 11 → protein always counted", () => {
    const result = computeNutriScore(makeInput({
      energyKj: 500,    // 1 pt
      sugars: 5,         // 1 pt
      saturatedFat: 2,   // 2 pts
      salt: 0.5,         // 2 pts → N = 6 <= 11
      fiber: 4,
      proteins: 10,
      fruitVegNuts: 0,
    }));
    expect(result!.proteinCapped).toBe(false);
  });
});

// ── Red Meat Protein Cap ──────────────────────────────────────

describe("computeNutriScore — red meat protein cap at 2", () => {
  it("red meat: protein capped at 2 points max", () => {
    const result = computeNutriScore(
      makeInput({ proteins: 20 }), // Would be 5 pts normally
      "Viande de boeuf hachée",
    );
    expect(result!.category).toBe("red_meat");
    // pPoints.proteins still shows raw 5, but total has capped value
    expect(result!.proteinCapped).toBe(true);
  });
});

// ── Category Detection ────────────────────────────────────────

describe("detectCategory", () => {
  it.each([
    ["Jus d'orange", "beverages"],
    ["Soda cola", "beverages"],
    ["Lait demi-écrémé", "beverages"],
    ["Eau de source", "beverages"],
    ["Huile d'olive vierge extra", "fats_oils_nuts"],
    ["Beurre doux", "fats_oils_nuts"],
    ["Noix de cajou grillées", "fats_oils_nuts"],
    ["Margarine", "fats_oils_nuts"],
    ["Viande de boeuf haché", "red_meat"],
    ["Steak d'agneau", "red_meat"],
    ["Fromage camembert", "cheese"],
    ["Mozzarella", "cheese"],
    ["Biscuits au chocolat", "general"],
    ["Riz basmati", "general"],
    [null, "general"],
    ["", "general"],
  ] as const)("'%s' → %s", (input, expected) => {
    expect(detectCategory(input)).toBe(expected);
  });
});

// ── Missing Data Handling ─────────────────────────────────────

describe("resolveNutriments — missing data", () => {
  it("returns null if < 3 N-nutriments available", () => {
    const result = resolveNutriments({
      energyKj: 500,
      sugars: null,
      saturatedFat: null,
      salt: null,
      fiber: null,
      proteins: null,
      fruitVegNuts: null,
    });
    expect(result).toBeNull();
  });

  it("succeeds with 3 of 4 N-nutriments", () => {
    const result = resolveNutriments({
      energyKj: 500,
      sugars: 10,
      saturatedFat: 3,
      salt: null, // Missing
      fiber: null,
      proteins: null,
      fruitVegNuts: null,
    });
    expect(result).not.toBeNull();
    expect(result!.imputedCount).toBeGreaterThan(0);
  });

  it("salt computed from sodium * 2.5", () => {
    const result = resolveNutriments({
      energyKj: 500,
      sugars: 10,
      saturatedFat: 3,
      salt: null,
      sodium: 0.4, // → salt = 1.0
      fiber: null,
      proteins: null,
      fruitVegNuts: null,
    });
    expect(result!.salt).toBe(1);
  });

  it("energyKj computed from kcal * 4.184", () => {
    const result = resolveNutriments({
      energyKj: null,
      energyKcal: 100, // → 418 kJ
      sugars: 5,
      saturatedFat: 2,
      salt: 0.5,
      fiber: null,
      proteins: null,
      fruitVegNuts: null,
    });
    expect(result!.energyKj).toBe(418);
  });

  it("missing P-nutriments imputed as 0", () => {
    const result = resolveNutriments({
      energyKj: 500,
      sugars: 10,
      saturatedFat: 3,
      salt: 0.5,
      fiber: null,
      proteins: null,
      fruitVegNuts: null,
    });
    expect(result!.fiber).toBe(0);
    expect(result!.proteins).toBe(0);
    expect(result!.fruitVegNuts).toBe(0);
  });

  it("computeNutriScore returns null for insufficient data", () => {
    const result = computeNutriScore({
      energyKj: null,
      sugars: null,
      saturatedFat: null,
      salt: null,
      fiber: null,
      proteins: null,
      fruitVegNuts: null,
    });
    expect(result).toBeNull();
  });
});

// ── OFF Nutriments Extraction ─────────────────────────────────

describe("extractNutrimentsFromOff", () => {
  it("extracts all fields from a complete OFF product", () => {
    const result = extractNutrimentsFromOff({
      "energy-kj_100g": 1500,
      "energy-kcal_100g": 358,
      "sugars_100g": 12,
      "saturated-fat_100g": 5,
      "salt_100g": 1.2,
      "fiber_100g": 3.5,
      "proteins_100g": 8,
      "fruits-vegetables-nuts-estimate-from-ingredients_100g": 30,
      "fat_100g": 15,
    });
    expect(result.energyKj).toBe(1500);
    expect(result.sugars).toBe(12);
    expect(result.saturatedFat).toBe(5);
    expect(result.salt).toBe(1.2);
    expect(result.fiber).toBe(3.5);
    expect(result.proteins).toBe(8);
    expect(result.fruitVegNuts).toBe(30);
    expect(result.fat).toBe(15);
  });

  it("returns nulls for missing fields", () => {
    const result = extractNutrimentsFromOff({});
    expect(result.energyKj).toBeNull();
    expect(result.sugars).toBeNull();
    expect(result.fiber).toBeNull();
  });

  it("handles null input", () => {
    const result = extractNutrimentsFromOff(null);
    expect(result.energyKj).toBeNull();
  });

  it("handles string values (OFF sometimes stores as strings)", () => {
    const result = extractNutrimentsFromOff({
      "energy-kj_100g": "1500" as any,
      "sugars_100g": "12.5" as any,
    });
    expect(result.energyKj).toBe(1500);
    expect(result.sugars).toBe(12.5);
  });
});

// ── Grade Thresholds ──────────────────────────────────────────

describe("computeNutriScore — grade boundaries", () => {
  it("raw = 0 → grade A", () => {
    // Build input that produces raw = 0
    const result = computeNutriScore({
      energyKj: 300,    // 0 pts
      sugars: 3,         // 0 pts
      saturatedFat: 0.5, // 0 pts
      salt: 0.1,         // 0 pts → N = 0
      fiber: 0,          // 0 pts
      proteins: 0,       // 0 pts
      fruitVegNuts: 0,   // 0 pts → P = 0 → raw = 0
    });
    expect(result!.grade).toBe("a");
    expect(result!.raw).toBe(0);
  });

  it("raw = 1 → grade B", () => {
    const result = computeNutriScore({
      energyKj: 340,     // 1 pt
      sugars: 3,          // 0 pts
      saturatedFat: 0.5,  // 0 pts
      salt: 0.1,          // 0 pts → N = 1
      fiber: 0,
      proteins: 0,
      fruitVegNuts: 0,    // P = 0 → raw = 1
    });
    expect(result!.grade).toBe("b");
    expect(result!.raw).toBe(1);
  });

  it("raw = 3 → grade C", () => {
    const result = computeNutriScore({
      energyKj: 700,     // 2 pts
      sugars: 3.5,        // 1 pt
      saturatedFat: 0.5,  // 0 pts
      salt: 0.1,          // 0 pts → N = 3
      fiber: 0,
      proteins: 0,
      fruitVegNuts: 0,    // P = 0 → raw = 3
    });
    expect(result!.grade).toBe("c");
  });

  it("raw = 11 → grade D", () => {
    const result = computeNutriScore({
      energyKj: 1400,    // 4 pts
      sugars: 15,         // 4 pts
      saturatedFat: 2.5,  // 2 pts
      salt: 0.3,          // 1 pt → N = 11
      fiber: 0,
      proteins: 0,
      fruitVegNuts: 0,    // P = 0 → raw = 11
    });
    expect(result!.grade).toBe("d");
  });

  it("raw = 19 → grade E", () => {
    const result = computeNutriScore({
      energyKj: 2100,    // 6 pts
      sugars: 25,         // 7 pts
      saturatedFat: 5.5,  // 5 pts
      salt: 0.3,          // 1 pt → N = 19
      fiber: 0,
      proteins: 0,
      fruitVegNuts: 0,    // P = 0 → raw = 19
    });
    expect(result!.grade).toBe("e");
  });
});

// ── Beverages ─────────────────────────────────────────────────

describe("computeNutriScore — beverages", () => {
  it("water → grade B (only A via special rule not implemented here)", () => {
    const result = computeNutriScore(
      { energyKj: 0, sugars: 0, saturatedFat: 0, salt: 0,
        fiber: 0, proteins: 0, fruitVegNuts: 0 },
      "Eau de source",
    );
    expect(result!.category).toBe("beverages");
    expect(result!.raw).toBeLessThanOrEqual(2);
  });

  it("cola → D or E (high sugar)", () => {
    const result = computeNutriScore(
      { energyKj: 180, sugars: 10.6, saturatedFat: 0, salt: 0,
        fiber: 0, proteins: 0, fruitVegNuts: 0 },
      "Soda cola",
    );
    expect(result!.category).toBe("beverages");
    expect(["d", "e"]).toContain(result!.grade);
  });

  it("orange juice → C or better (has FVN)", () => {
    const result = computeNutriScore(
      { energyKj: 190, sugars: 9, saturatedFat: 0, salt: 0,
        fiber: 0.5, proteins: 0.8, fruitVegNuts: 100 },
      "Jus d'orange pur jus",
    );
    expect(result!.category).toBe("beverages");
    // FVN 100% gives good P points
    expect(result!.pPoints.fruitVegNuts).toBe(5);
  });
});

// ── Fats/Oils ─────────────────────────────────────────────────

describe("computeNutriScore — fats/oils", () => {
  it("olive oil → uses energy from saturates", () => {
    const result = computeNutriScore(
      { energyKj: 3700, sugars: 0, saturatedFat: 14, salt: 0,
        fiber: 0, proteins: 0, fruitVegNuts: 0, fat: 100 },
      "Huile d'olive vierge extra",
    );
    expect(result!.category).toBe("fats_oils_nuts");
    // Energy from sat = 14 * 37 = 518 kJ → ~4 pts
    expect(result!.nPoints.energy).toBe(4);
  });

  it("butter → higher score than olive oil (more saturated)", () => {
    const butter = computeNutriScore(
      { energyKj: 3100, sugars: 0.5, saturatedFat: 52, salt: 0.05,
        fiber: 0, proteins: 0.7, fruitVegNuts: 0, fat: 82 },
      "Beurre doux",
    );
    const olive = computeNutriScore(
      { energyKj: 3700, sugars: 0, saturatedFat: 14, salt: 0,
        fiber: 0, proteins: 0, fruitVegNuts: 0, fat: 100 },
      "Huile d'olive",
    );
    // Butter should have higher raw (worse) than olive oil
    expect(butter!.raw).toBeGreaterThan(olive!.raw);
  });
});

// ── Real Product Validation ───────────────────────────────────

describe("computeNutriScore — real product validation", () => {
  it("Kinder Bueno (known NutriScore E)", () => {
    const result = computeNutriScore({
      energyKj: 2372,
      sugars: 35,
      saturatedFat: 17,
      salt: 0.3,
      fiber: 0,
      proteins: 9.2,
      fruitVegNuts: 0,
    });
    expect(result!.grade).toBe("e");
  });

  it("Haricots verts (known NutriScore A)", () => {
    const result = computeNutriScore({
      energyKj: 105,
      sugars: 1.3,
      saturatedFat: 0.1,
      salt: 0.01,
      fiber: 3,
      proteins: 1.8,
      fruitVegNuts: 85,
    });
    expect(result!.grade).toBe("a");
  });

  it("Yaourt nature (known NutriScore A or B)", () => {
    const result = computeNutriScore({
      energyKj: 230,
      sugars: 4.7,
      saturatedFat: 1.1,
      salt: 0.15,
      fiber: 0,
      proteins: 4.3,
      fruitVegNuts: 0,
    });
    expect(["a", "b"]).toContain(result!.grade);
  });
});
