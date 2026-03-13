import { describe, it, expect } from "vitest";
import { computeNutrientBreakdown, type NutrientBreakdown } from "../../services/nutrient-thresholds.service.js";
import type { Product } from "../../db/schema/products.js";

// ── Helpers ───────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "test-id",
    barcode: "3017620422003",
    name: "Test Product",
    brand: null,
    brandLogo: null,
    category: null,
    categoryId: null,
    description: null,
    imageUrl: null,
    ingredients: null,
    halalStatus: "unknown",
    confidenceScore: 0,
    certifierId: null,
    certifierName: null,
    certifierLogo: null,
    nutritionFacts: null,
    price: null,
    currency: "EUR",
    inStock: true,
    offData: null,
    lastSyncedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    genericName: null,
    brandOwner: null,
    quantity: null,
    servingSize: null,
    countriesTags: null,
    ingredientsText: null,
    allergensTags: null,
    tracesTags: null,
    additivesTags: null,
    ingredientsAnalysisTags: null,
    nutriscoreGrade: null,
    novaGroup: null,
    ecoscoreGrade: null,
    energyKcal100g: null,
    fat100g: null,
    saturatedFat100g: null,
    carbohydrates100g: null,
    sugars100g: null,
    fiber100g: null,
    proteins100g: null,
    salt100g: null,
    labelsTags: null,
    embCodes: null,
    originsTags: null,
    manufacturingPlaces: null,
    imageIngredientsUrl: null,
    imageNutritionUrl: null,
    imageFrontUrl: null,
    imageR2Key: null,
    completeness: null,
    dataSources: null,
    offLastModified: null,
    analysisVersion: 1,
    ...overrides,
  } as Product;
}

function findNutrient(results: NutrientBreakdown[], key: string): NutrientBreakdown | undefined {
  return results.find(r => r.nutrient === key);
}

// ── Basic Functionality ───────────────────────────────────────

describe("computeNutrientBreakdown — basics", () => {
  it("returns empty array when no nutrition data", () => {
    const product = makeProduct();
    const results = computeNutrientBreakdown(product);
    expect(results).toHaveLength(0);
  });

  it("returns breakdown for available nutrients only", () => {
    const product = makeProduct({
      sugars100g: 10,
      salt100g: 0.5,
    });
    const results = computeNutrientBreakdown(product);
    expect(results).toHaveLength(2);
    expect(findNutrient(results, "sugars")).toBeDefined();
    expect(findNutrient(results, "salt")).toBeDefined();
    expect(findNutrient(results, "fat")).toBeUndefined();
  });
});

// ── Standard Food Thresholds ──────────────────────────────────

describe("computeNutrientBreakdown — standard food levels", () => {
  it("sugars 1g → very_low", () => {
    const product = makeProduct({ sugars100g: 1 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "sugars")?.level).toBe("very_low");
  });

  it("sugars 5g → low", () => {
    const product = makeProduct({ sugars100g: 5 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "sugars")?.level).toBe("low");
  });

  it("sugars 12g → moderate", () => {
    const product = makeProduct({ sugars100g: 12 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "sugars")?.level).toBe("moderate");
  });

  it("sugars 20g → high", () => {
    const product = makeProduct({ sugars100g: 20 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "sugars")?.level).toBe("high");
  });

  it("sugars 30g → very_high", () => {
    const product = makeProduct({ sugars100g: 30 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "sugars")?.level).toBe("very_high");
  });

  it("salt 0.05g → very_low", () => {
    const product = makeProduct({ salt100g: 0.05 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "salt")?.level).toBe("very_low");
  });

  it("salt 2.5g → very_high", () => {
    const product = makeProduct({ salt100g: 2.5 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "salt")?.level).toBe("very_high");
  });
});

// ── Beverage-specific Thresholds ──────────────────────────────

describe("computeNutrientBreakdown — beverage thresholds (stricter)", () => {
  it("classifies beverage with stricter sugar threshold", () => {
    const product = makeProduct({
      category: "Soda", // singular to match \bsoda\b word boundary
      sugars100g: 8, // moderate for food, high for beverage
    });
    const results = computeNutrientBreakdown(product);
    const sugars = findNutrient(results, "sugars");
    expect(sugars?.isBeverage).toBe(true);
    expect(sugars?.level).toBe("high"); // 8g for bev: > 5 (moderate), <= 10 (high boundary)
  });

  it("soda with 11g sugars → very_high", () => {
    const product = makeProduct({
      category: "boisson gazeuse",
      sugars100g: 11,
    });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "sugars")?.level).toBe("very_high");
  });
});

// ── Daily Value Percent ───────────────────────────────────────

describe("computeNutrientBreakdown — %DRV", () => {
  it("calculates correct %DRV for sugars (DRV=50g)", () => {
    const product = makeProduct({ sugars100g: 25 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "sugars")?.dailyValuePercent).toBe(50); // 25/50 = 50%
  });

  it("calculates correct %DRV for salt (DRV=5g)", () => {
    const product = makeProduct({ salt100g: 1 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "salt")?.dailyValuePercent).toBe(20); // 1/5 = 20%
  });

  it("calculates correct %DRV for proteins (DRV=50g)", () => {
    const product = makeProduct({ proteins100g: 15 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "proteins")?.dailyValuePercent).toBe(30); // 15/50 = 30%
  });
});

// ── isNegative flag ───────────────────────────────────────────

describe("computeNutrientBreakdown — isNegative", () => {
  it("marks sugars as negative nutrient", () => {
    const product = makeProduct({ sugars100g: 10 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "sugars")?.isNegative).toBe(true);
  });

  it("marks fiber as positive nutrient", () => {
    const product = makeProduct({ fiber100g: 5 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "fiber")?.isNegative).toBe(false);
  });

  it("marks proteins as positive nutrient", () => {
    const product = makeProduct({ proteins100g: 10 });
    const results = computeNutrientBreakdown(product);
    expect(findNutrient(results, "proteins")?.isNegative).toBe(false);
  });
});

// ── Complete Product ──────────────────────────────────────────

describe("computeNutrientBreakdown — full Nutella-like product", () => {
  it("returns 8 nutrients with correct levels", () => {
    const product = makeProduct({
      category: "pâte à tartiner",
      energyKcal100g: 539,
      fat100g: 30.9,
      saturatedFat100g: 10.6,
      carbohydrates100g: 57.5,
      sugars100g: 56.3,
      fiber100g: 3.4,
      proteins100g: 6.3,
      salt100g: 0.107,
    });
    const results = computeNutrientBreakdown(product);
    expect(results).toHaveLength(8);

    expect(findNutrient(results, "sugars")?.level).toBe("very_high"); // 56.3g >> 25g
    expect(findNutrient(results, "saturated_fat")?.level).toBe("very_high"); // 10.6g > 10g
    expect(findNutrient(results, "fat")?.level).toBe("very_high"); // 30.9g > 20g
    expect(findNutrient(results, "salt")?.level).toBe("low"); // 0.107g > 0.1g boundary → low
    expect(findNutrient(results, "fiber")?.level).toBe("moderate"); // 3.4g: 2 < 3.4 < 4
    expect(findNutrient(results, "proteins")?.level).toBe("moderate"); // 6.3g: 5 < 6.3 ≤ 10
  });
});
