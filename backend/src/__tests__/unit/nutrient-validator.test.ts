import { describe, it, expect } from "vitest";
import {
  validateNutrients,
  checkGradeDiscrepancy,
  type ValidationResult,
} from "../../services/nutrient-validator.service.js";

// ── Helpers ───────────────────────────────────────────────────

function makeNutriments(overrides: Record<string, number> = {}): Record<string, number> {
  return {
    "energy-kcal_100g": 250,
    fat_100g: 10,
    "saturated-fat_100g": 3,
    carbohydrates_100g: 30,
    sugars_100g: 10,
    fiber_100g: 2,
    proteins_100g: 8,
    salt_100g: 1,
    ...overrides,
  };
}

// ── Layer 1: Physical impossibilities ─────────────────────────

describe("NutrientValidator — Layer 1: Physical impossibilities", () => {
  it("detects energy > 4200 kJ", () => {
    const result = validateNutrients({ energy_100g: 5000 }, null);
    expect(result.flag).toBe("unreliable");
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].field).toBe("energy_100g");
    expect(result.anomalies[0].severity).toBe("impossible");
  });

  it("detects fat > 100g", () => {
    const result = validateNutrients({ fat_100g: 120 }, null);
    expect(result.flag).toBe("unreliable");
    expect(result.anomalies[0].field).toBe("fat_100g");
  });

  it("detects salt > 50g", () => {
    const result = validateNutrients({ salt_100g: 60 }, null);
    expect(result.flag).toBe("unreliable");
  });

  it("passes normal values", () => {
    const result = validateNutrients(makeNutriments(), null);
    expect(result.anomalies.filter((a) => a.severity === "impossible")).toHaveLength(0);
  });
});

// ── Layer 2: Yuka cross-validation invariants ─────────────────

describe("NutrientValidator — Layer 2: Cross-validation invariants", () => {
  it("Invariant 1: saturated fat > total fat → impossible", () => {
    const result = validateNutrients(
      makeNutriments({ fat_100g: 5, "saturated-fat_100g": 8 }),
      null,
    );
    expect(result.flag).toBe("unreliable");
    expect(result.anomalies.some((a) => a.field === "saturated-fat_100g")).toBe(true);
    expect(result.reasons).toContain("fat_satfat_inconsistency");
  });

  it("Invariant 1: tolerates 0.5g rounding (sat=5.3, fat=5)", () => {
    const result = validateNutrients(
      makeNutriments({ fat_100g: 5, "saturated-fat_100g": 5.3 }),
      null,
    );
    // 5.3 <= 5 + 0.5 = 5.5 → no anomaly
    expect(result.anomalies.filter((a) => a.field === "saturated-fat_100g")).toHaveLength(0);
  });

  it("Invariant 4: sugar > carbs → impossible", () => {
    const result = validateNutrients(
      makeNutriments({ carbohydrates_100g: 15, sugars_100g: 20 }),
      null,
    );
    expect(result.flag).toBe("unreliable");
    expect(result.reasons).toContain("carbs_sugar_inconsistency");
  });

  it("Invariant 5: macro sum > 105g → suspicious", () => {
    const result = validateNutrients(
      makeNutriments({ fat_100g: 40, carbohydrates_100g: 40, proteins_100g: 30 }),
      null,
    );
    expect(result.anomalies.some((a) => a.field === "macro_sum")).toBe(true);
    expect(result.reasons).toContain("macro_sum_exceeds_weight");
  });

  it("Invariant 6: salt > 10g without exempt category → suspicious", () => {
    const result = validateNutrients(
      makeNutriments({ salt_100g: 15 }),
      "fromage",
    );
    expect(result.anomalies.some((a) => a.field === "salt_100g")).toBe(true);
  });

  it("Invariant 6: salt > 10g WITH exempt category (sauce soja) → no anomaly", () => {
    const result = validateNutrients(
      makeNutriments({ salt_100g: 15 }),
      "sauce soja",
    );
    expect(result.anomalies.filter((a) => a.field === "salt_100g")).toHaveLength(0);
  });
});

// ── Layer 3: Calorie formula check — THE KILLER ───────────────

describe("NutrientValidator — Layer 3: Calorie formula (Atwater)", () => {
  it("COCA-COLA BUG: 3.3g sugar but 42 kcal → critical anomaly", () => {
    // Real OFF data for Coca-Cola 5449000054227 (corrupt):
    // sugars=3.3g, carbs=10.6g (wrong), fat=0, protein=0, fiber=0, energy=42 kcal
    // Actually the corrupt data has sugars=3.3 AND carbs=3.3
    // Expected kcal from Atwater: 0×9 + 3.3×4 + 0×2 + 0×4 = 13.2
    // Actual: 42 kcal → deviation = |42-13.2|/42 = 68.6% → CRITICAL
    const result = validateNutrients({
      "energy-kcal_100g": 42,
      fat_100g: 0,
      "saturated-fat_100g": 0,
      carbohydrates_100g: 3.3, // wrong! should be 10.6
      sugars_100g: 3.3,        // wrong! should be 10.6
      fiber_100g: 0,
      proteins_100g: 0,
      salt_100g: 0.02,
    }, "sodas, boissons");

    expect(result.flag).toBe("unreliable");
    expect(result.anomalies.some((a) => a.field === "calorie_formula")).toBe(true);
    expect(result.reasons).toContain("calorie_formula_mismatch");

    const calorieAnomaly = result.anomalies.find((a) => a.field === "calorie_formula")!;
    expect(calorieAnomaly.severity).toBe("critical");
    expect(calorieAnomaly.value).toBe(42); // declared kcal
    // expected kcal should be ~13.2
    expect(calorieAnomaly.threshold).toBeCloseTo(13.2, 0);
  });

  it("COCA-COLA CORRECT DATA: 10.6g sugar, 42 kcal → valid", () => {
    // If OFF had correct data: carbs=10.6, sugars=10.6, kcal=42
    // Expected: 0×9 + 10.6×4 + 0×2 + 0×4 = 42.4 kcal
    // Deviation: |42-42.4|/42.4 = 0.9% → well within 30% → VALID
    const result = validateNutrients({
      "energy-kcal_100g": 42,
      fat_100g: 0,
      "saturated-fat_100g": 0,
      carbohydrates_100g: 10.6,
      sugars_100g: 10.6,
      fiber_100g: 0,
      proteins_100g: 0,
      salt_100g: 0.02,
    }, "sodas, boissons");

    expect(result.flag).toBe("valid");
    expect(result.anomalies.filter((a) => a.field === "calorie_formula")).toHaveLength(0);
  });

  it("normal product (beurre): fat-heavy, calories match → valid", () => {
    // Beurre: ~82g fat, ~0.7g carbs, ~0.7g protein, ~0.1g fiber, ~743 kcal
    // Expected: 82×9 + 0.7×4 + 0.1×2 + 0.7×4 = 738 + 2.8 + 0.2 + 2.8 = 743.8
    const result = validateNutrients({
      "energy-kcal_100g": 743,
      fat_100g: 82,
      "saturated-fat_100g": 52,
      carbohydrates_100g: 0.7,
      sugars_100g: 0.7,
      fiber_100g: 0.1,
      proteins_100g: 0.7,
      salt_100g: 0.04,
    }, "beurre, produits laitiers");

    expect(result.flag).toBe("valid");
  });

  it("skips calorie check when energy < 10 kcal (water, etc.)", () => {
    const result = validateNutrients({
      "energy-kcal_100g": 3,
      fat_100g: 0,
      carbohydrates_100g: 0,
      sugars_100g: 0,
      proteins_100g: 0,
    }, "eau");

    expect(result.anomalies.filter((a) => a.field === "calorie_formula")).toHaveLength(0);
  });

  it("handles missing macros gracefully (only fat available)", () => {
    const result = validateNutrients({
      "energy-kcal_100g": 200,
      fat_100g: 20,
    }, null);

    // Expected: 20×9 = 180. Declared: 200. Dev = |200-180|/200 = 10% → within 30% → valid
    expect(result.anomalies.filter((a) => a.field === "calorie_formula")).toHaveLength(0);
  });
});

// ── Grade Discrepancy ─────────────────────────────────────────

describe("checkGradeDiscrepancy", () => {
  it("no discrepancy (same grade) → null", () => {
    expect(checkGradeDiscrepancy("b", "b")).toBeNull();
  });

  it("1 grade apart (B vs C) → null (tolerated)", () => {
    expect(checkGradeDiscrepancy("b", "c")).toBeNull();
  });

  it("2 grades apart (A vs C) → critical anomaly", () => {
    const anomaly = checkGradeDiscrepancy("a", "c");
    expect(anomaly).not.toBeNull();
    expect(anomaly!.severity).toBe("critical");
    expect(anomaly!.field).toBe("grade_discrepancy");
  });

  it("3 grades apart (A vs D) → critical anomaly", () => {
    const anomaly = checkGradeDiscrepancy("a", "d");
    expect(anomaly).not.toBeNull();
    expect(anomaly!.severity).toBe("critical");
  });

  it("null grades → null (no check possible)", () => {
    expect(checkGradeDiscrepancy(null, "b")).toBeNull();
    expect(checkGradeDiscrepancy("a", null)).toBeNull();
    expect(checkGradeDiscrepancy(null, null)).toBeNull();
  });
});

// ── Integration: flag determination ───────────────────────────

describe("NutrientValidator — flag determination", () => {
  it("no anomalies → flag=valid", () => {
    const result = validateNutrients(makeNutriments(), null);
    expect(result.flag).toBe("valid");
    expect(result.anomalies).toHaveLength(0);
    expect(result.reasons).toHaveLength(0);
  });

  it("suspicious only (macro sum) → flag=suspicious", () => {
    // Energy must match Atwater formula to avoid triggering calorie_formula (critical).
    // fat=40×9 + carbs=40×4 + fiber=2×2 + proteins=30×4 = 360+160+4+120 = 644 kcal
    const result = validateNutrients(
      makeNutriments({ fat_100g: 40, carbohydrates_100g: 40, proteins_100g: 30, "energy-kcal_100g": 644 }),
      null,
    );
    expect(result.flag).toBe("suspicious");
  });

  it("critical (calorie mismatch) → flag=unreliable", () => {
    const result = validateNutrients({
      "energy-kcal_100g": 500,
      fat_100g: 2,
      carbohydrates_100g: 5,
      proteins_100g: 1,
    }, null);
    // Expected: 2×9 + 5×4 + 1×4 = 42. Declared: 500. Dev >30% → critical
    expect(result.flag).toBe("unreliable");
  });

  it("impossible (fat>100) → flag=unreliable", () => {
    const result = validateNutrients({ fat_100g: 150 }, null);
    expect(result.flag).toBe("unreliable");
  });

  it("empty nutriments → flag=valid (nothing to check)", () => {
    const result = validateNutrients(null, null);
    expect(result.flag).toBe("valid");
    expect(result.anomalies).toHaveLength(0);
  });

  it("empty object → flag=valid", () => {
    const result = validateNutrients({}, null);
    expect(result.flag).toBe("valid");
  });
});

// ── OFF NutriScore components fallback ────────────────────────

describe("NutrientValidator — OFF NutriScore components", () => {
  it("uses OFF components when standard nutriments missing", () => {
    const result = validateNutrients(null, null, [
      { id: "energy", value: 5000 }, // > 4200 kJ → impossible
    ]);
    expect(result.flag).toBe("unreliable");
    expect(result.anomalies[0].field).toBe("energy_100g");
  });

  it("standard nutriments take precedence over components", () => {
    const result = validateNutrients(
      { energy_100g: 1000 }, // normal
      null,
      [{ id: "energy", value: 5000 }], // would be impossible, but standard takes precedence
    );
    expect(result.flag).toBe("valid");
  });
});
