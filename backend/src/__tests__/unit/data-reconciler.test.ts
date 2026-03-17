import { describe, it, expect } from "vitest";
import {
  reconcileNutriments,
  type ReconciliationReport,
} from "../../services/data-reconciler.service.js";

// ── Source 1 priority ────────────────────────────────────────

describe("DataReconciler — Source priority", () => {
  it("uses OFF nutriments as highest priority source", () => {
    const result = reconcileNutriments(
      { "energy-kcal_100g": 250, fat_100g: 10, sugars_100g: 15 },
      null,
      null,
    );
    expect(result.nutriments.energyKcal?.value).toBe(250);
    expect(result.nutriments.energyKcal?.source).toBe("off_nutriments");
    expect(result.nutriments.fat?.value).toBe(10);
    expect(result.nutriments.sugars?.value).toBe(15);
  });

  it("fills gaps from NutriScore components when OFF nutriments missing", () => {
    const result = reconcileNutriments(
      { fat_100g: 10 }, // Only fat from OFF
      [
        { id: "sugars", value: 12 },
        { id: "fiber", value: 3 },
      ],
      null,
    );
    expect(result.nutriments.fat?.source).toBe("off_nutriments");
    expect(result.nutriments.sugars?.value).toBe(12);
    expect(result.nutriments.sugars?.source).toBe("off_nutriscore_components");
    expect(result.nutriments.fiber?.value).toBe(3);
    expect(result.nutriments.fiber?.source).toBe("off_nutriscore_components");
  });

  it("fills gaps from DB columns when both OFF sources missing", () => {
    const result = reconcileNutriments(
      null,
      null,
      { energyKcal100g: 200, fat100g: 8, sugars100g: 20 },
    );
    expect(result.nutriments.energyKcal?.value).toBe(200);
    expect(result.nutriments.energyKcal?.source).toBe("db_columns");
    expect(result.nutriments.fat?.source).toBe("db_columns");
  });

  it("OFF nutriments take precedence over DB columns", () => {
    const result = reconcileNutriments(
      { fat_100g: 10 },
      null,
      { fat100g: 25 }, // Different value in DB
    );
    expect(result.nutriments.fat?.value).toBe(10);
    expect(result.nutriments.fat?.source).toBe("off_nutriments");
  });

  it("NutriScore components take precedence over DB columns", () => {
    const result = reconcileNutriments(
      null,
      [{ id: "sugars", value: 12 }],
      { sugars100g: 30 },
    );
    expect(result.nutriments.sugars?.value).toBe(12);
    expect(result.nutriments.sugars?.source).toBe("off_nutriscore_components");
  });
});

// ── Derived values ───────────────────────────────────────────

describe("DataReconciler — Derived values", () => {
  it("imputes salt from sodium (×2.5)", () => {
    const result = reconcileNutriments(
      { sodium_100g: 0.4 },
      null,
      null,
    );
    expect(result.nutriments.salt?.value).toBe(1); // 0.4 × 2.5
    expect(result.nutriments.salt?.source).toBe("imputed");
  });

  it("imputes sodium from salt (÷2.5)", () => {
    const result = reconcileNutriments(
      { salt_100g: 2.5 },
      null,
      null,
    );
    expect(result.nutriments.sodium?.value).toBe(1); // 2.5 / 2.5
    expect(result.nutriments.sodium?.source).toBe("imputed");
  });

  it("imputes energy kJ from kcal (×4.184)", () => {
    const result = reconcileNutriments(
      { "energy-kcal_100g": 100 },
      null,
      null,
    );
    expect(result.nutriments.energyKj?.value).toBe(418); // Math.round(100 × 4.184)
    expect(result.nutriments.energyKj?.source).toBe("imputed");
  });

  it("imputes energy kcal from kJ (÷4.184)", () => {
    const result = reconcileNutriments(
      { "energy_100g": 1000 },
      null,
      null,
    );
    expect(result.nutriments.energyKcal?.value).toBe(239); // Math.round(1000 / 4.184)
    expect(result.nutriments.energyKcal?.source).toBe("imputed");
  });
});

// ── Conflict detection ───────────────────────────────────────

describe("DataReconciler — Conflict detection", () => {
  it("detects conflict when OFF and DB values differ >20%", () => {
    const result = reconcileNutriments(
      { sugars_100g: 10 },
      null,
      { sugars100g: 30 }, // 200% difference
    );
    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toContain("sugars");
  });

  it("no conflict when values are within 20%", () => {
    const result = reconcileNutriments(
      { fat_100g: 10 },
      null,
      { fat100g: 11 }, // 10% difference
    );
    expect(result.hasConflicts).toBe(false);
  });

  it("detects conflict between OFF and NutriScore components", () => {
    const result = reconcileNutriments(
      { sugars_100g: 3.3 }, // Coca-Cola corrupt
      [{ id: "sugars", value: 10.6 }], // NutriScore has correct value
      null,
    );
    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toContain("sugars");
  });
});

// ── Coverage & completeness ─────────────────────────────────

describe("DataReconciler — Coverage", () => {
  it("full coverage with all 8 core fields", () => {
    const result = reconcileNutriments(
      {
        "energy-kcal_100g": 250,
        fat_100g: 10,
        "saturated-fat_100g": 3,
        carbohydrates_100g: 30,
        sugars_100g: 15,
        fiber_100g: 2,
        proteins_100g: 8,
        salt_100g: 1,
      },
      null,
      null,
    );
    expect(result.coverage).toBe(8);
    expect(result.completeness).toBe(1);
  });

  it("partial coverage", () => {
    const result = reconcileNutriments(
      { fat_100g: 10, sugars_100g: 15 },
      null,
      null,
    );
    expect(result.coverage).toBe(2);
    expect(result.completeness).toBe(0.25); // 2/8
  });

  it("empty sources → zero coverage", () => {
    const result = reconcileNutriments(null, null, null);
    expect(result.coverage).toBe(0);
    expect(result.completeness).toBe(0);
    expect(Object.keys(result.flat)).toHaveLength(0);
  });
});

// ── Flat record ─────────────────────────────────────────────

describe("DataReconciler — Flat record", () => {
  it("produces OFF-compatible keys", () => {
    const result = reconcileNutriments(
      { fat_100g: 10, "saturated-fat_100g": 3, sugars_100g: 15 },
      null,
      null,
    );
    expect(result.flat["fat_100g"]).toBe(10);
    expect(result.flat["saturated-fat_100g"]).toBe(3);
    expect(result.flat["sugars_100g"]).toBe(15);
  });

  it("merges from all sources into one flat record", () => {
    const result = reconcileNutriments(
      { fat_100g: 10 },
      [{ id: "sugars", value: 15 }],
      { proteins100g: 8 },
    );
    expect(result.flat["fat_100g"]).toBe(10);
    expect(result.flat["sugars_100g"]).toBe(15);
    expect(result.flat["proteins_100g"]).toBe(8);
    expect(result.sourceCounts.off_nutriments).toBe(1);
    expect(result.sourceCounts.off_nutriscore_components).toBe(1);
    expect(result.sourceCounts.db_columns).toBe(1);
  });
});
