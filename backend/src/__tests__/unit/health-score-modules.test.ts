import { describe, it, expect } from "vitest";
import { computeHealthScore, type HealthScoreInput } from "../../services/health-score.service.js";

// ── Helpers ──────────────────────────────────────────────────

function makeBaseInput(overrides: Partial<HealthScoreInput> = {}): HealthScoreInput {
  return {
    nutriscoreGrade: "c",
    novaGroup: 3,
    additives: [],
    hasIngredientsList: true,
    hasNutritionFacts: true,
    hasAllergens: false,
    hasOrigin: false,
    nutriments: {
      "energy-kcal_100g": 250,
      fat_100g: 10,
      "saturated-fat_100g": 3,
      carbohydrates_100g: 30,
      sugars_100g: 15,
      fiber_100g: 2,
      proteins_100g: 8,
      salt_100g: 1,
    },
    categories: "produits alimentaires",
    ...overrides,
  };
}

// ── MODULE 4: Special Product NutriScore Bypass ──────────────

describe("HealthScore — Special Product NutriScore Bypass", () => {
  it("uses qualityRatio as nutrition score when bypassNutriScore=true", () => {
    const result = computeHealthScore(makeBaseInput({
      specialProduct: {
        bypassNutriScore: true,
        qualityRatio: 1.0, // All criteria pass → full nutrition score
        type: "honey",
      },
    }));

    expect(result.score).not.toBeNull();
    // With qualityRatio=1.0, nutrition axis should be at max
    expect(result.axes.nutrition?.score).toBe(result.axes.nutrition?.max);
  });

  it("low qualityRatio → lower nutrition score", () => {
    const result = computeHealthScore(makeBaseInput({
      specialProduct: {
        bypassNutriScore: true,
        qualityRatio: 0.33, // Only 1/3 criteria pass
        type: "honey",
      },
    }));

    expect(result.score).not.toBeNull();
    // Nutrition score should be ~33% of max
    const nutritionAxis = result.axes.nutrition!;
    expect(nutritionAxis.score).toBeLessThan(nutritionAxis.max * 0.5);
    expect(nutritionAxis.score).toBeGreaterThan(0);
  });

  it("bypassNutriScore=false → normal NutriScore computation", () => {
    const resultBypass = computeHealthScore(makeBaseInput({
      specialProduct: {
        bypassNutriScore: false, // Don't bypass
        qualityRatio: 1.0,
        type: "chocolate",
      },
    }));

    const resultNormal = computeHealthScore(makeBaseInput());

    // Same score — bypass is not active
    expect(resultBypass.score).toBe(resultNormal.score);
  });

  it("no specialProduct → normal computation", () => {
    const result = computeHealthScore(makeBaseInput({
      specialProduct: null,
    }));
    expect(result.score).not.toBeNull();
  });
});

// ── Beverage Score Modifier Integration ──────────────────────

describe("HealthScore — Beverage Score Modifier", () => {
  it("applies negative beverage modifier", () => {
    const resultWithout = computeHealthScore(makeBaseInput({
      categories: "boissons, sodas",
      nutriments: {
        "energy-kcal_100g": 42,
        fat_100g: 0,
        "saturated-fat_100g": 0,
        carbohydrates_100g: 10.6,
        sugars_100g: 10.6,
        fiber_100g: 0,
        proteins_100g: 0,
        salt_100g: 0.02,
      },
    }));

    const resultWith = computeHealthScore(makeBaseInput({
      categories: "boissons, sodas",
      nutriments: {
        "energy-kcal_100g": 42,
        fat_100g: 0,
        "saturated-fat_100g": 0,
        carbohydrates_100g: 10.6,
        sugars_100g: 10.6,
        fiber_100g: 0,
        proteins_100g: 0,
        salt_100g: 0.02,
      },
      beverageScoreModifier: -15, // Heavy penalty from BeverageIntelligence
    }));

    // Score with beverage modifier should be lower
    if (resultWithout.score != null && resultWith.score != null) {
      expect(resultWith.score).toBeLessThan(resultWithout.score);
    }
  });

  it("zero modifier has no effect", () => {
    const resultA = computeHealthScore(makeBaseInput());
    const resultB = computeHealthScore(makeBaseInput({ beverageScoreModifier: 0 }));
    expect(resultA.score).toBe(resultB.score);
  });
});

// ── Data Quality Gate still works with new features ──────────

describe("HealthScore — Data Quality Gate with modules", () => {
  it("unreliable data → score=null even with specialProduct", () => {
    const result = computeHealthScore(makeBaseInput({
      nutriments: {
        "energy-kcal_100g": 500, // Declared
        fat_100g: 2,             // Expected: 2×9 + 5×4 + 1×4 = 42
        carbohydrates_100g: 5,   // Deviation: |500-42|/500 = 91.6% → CRITICAL
        proteins_100g: 1,
      },
      specialProduct: {
        bypassNutriScore: true,
        qualityRatio: 1.0,
        type: "honey",
      },
    }));
    expect(result.score).toBeNull();
    expect(result.dataQualityFlag).toBe("unreliable");
  });
});
