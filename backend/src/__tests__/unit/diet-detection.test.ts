import { describe, it, expect } from "vitest";
import { analyzeDietary, type AdditiveForDiet } from "../../services/diet-detection.service.js";
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

const NO_ADDITIVES: AdditiveForDiet[] = [];

// ── Gluten Detection ──────────────────────────────────────────

describe("analyzeDietary — gluten", () => {
  it("detects gluten from ingredient text", () => {
    const product = makeProduct({ ingredientsText: "Farine de blé, sucre, sel" });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsGluten).toBe(true);
  });

  it("detects gluten from allergen tags", () => {
    const product = makeProduct({ allergensTags: ["en:gluten", "en:milk"] });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsGluten).toBe(true);
  });

  it("respects gluten-free label over ingredients", () => {
    const product = makeProduct({
      ingredientsText: "Farine de riz",
      labelsTags: ["en:gluten-free"],
    });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsGluten).toBe(false);
  });

  it("returns null when no data available", () => {
    const product = makeProduct();
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsGluten).toBeNull();
  });

  it("detects gluten from wheat keyword", () => {
    const product = makeProduct({ ingredientsText: "wheat flour, water, yeast" });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsGluten).toBe(true);
  });
});

// ── Lactose Detection ─────────────────────────────────────────

describe("analyzeDietary — lactose", () => {
  it("detects lactose from ingredients", () => {
    const product = makeProduct({ ingredientsText: "lait entier, sucre, cacao" });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsLactose).toBe(true);
  });

  it("detects lactose from allergen tags", () => {
    const product = makeProduct({ allergensTags: ["en:milk"] });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsLactose).toBe(true);
  });

  it("respects lactose-free label", () => {
    const product = makeProduct({
      ingredientsText: "lait sans lactose",
      labelsTags: ["en:lactose-free"],
    });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsLactose).toBe(false);
  });
});

// ── Palm Oil Detection ────────────────────────────────────────

describe("analyzeDietary — palm oil", () => {
  it("detects palm oil from ingredients", () => {
    const product = makeProduct({ ingredientsText: "sucre, huile de palme, noisettes" });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsPalmOil).toBe(true);
  });

  it("detects palm oil from OFF analysis tags", () => {
    const product = makeProduct({ ingredientsAnalysisTags: ["en:palm-oil"] });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsPalmOil).toBe(true);
  });

  it("respects palm-oil-free label", () => {
    const product = makeProduct({
      ingredientsText: "beurre de cacao",
      labelsTags: ["en:palm-oil-free"],
    });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsPalmOil).toBe(false);
  });

  it("returns false when no palm oil in ingredients", () => {
    const product = makeProduct({ ingredientsText: "farine, sucre, beurre" });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.containsPalmOil).toBe(false);
  });
});

// ── Vegetarian Detection ──────────────────────────────────────

describe("analyzeDietary — vegetarian", () => {
  it("detects non-vegetarian from gelatin ingredient", () => {
    const product = makeProduct({ ingredientsText: "sucre, gélatine, arôme" });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.isVegetarian).toBe(false);
  });

  it("detects non-vegetarian from additive flag", () => {
    const additives: AdditiveForDiet[] = [
      { code: "E441", isVegetarian: false, isVegan: false },
    ];
    const product = makeProduct({ ingredientsText: "sucre, arôme" });
    const result = analyzeDietary(product, additives);
    expect(result.isVegetarian).toBe(false);
  });

  it("detects vegetarian from OFF analysis tag", () => {
    const product = makeProduct({ ingredientsAnalysisTags: ["en:vegetarian"] });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.isVegetarian).toBe(true);
  });

  it("detects vegetarian from label", () => {
    const product = makeProduct({ labelsTags: ["en:vegetarian"] });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.isVegetarian).toBe(true);
  });
});

// ── Vegan Detection ───────────────────────────────────────────

describe("analyzeDietary — vegan", () => {
  it("detects non-vegan from milk ingredient", () => {
    const product = makeProduct({ ingredientsText: "farine, lait, beurre" });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.isVegan).toBe(false);
  });

  it("detects vegan from label", () => {
    const product = makeProduct({ labelsTags: ["en:vegan"] });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.isVegan).toBe(true);
  });

  it("detects non-vegan from additive flag", () => {
    const additives: AdditiveForDiet[] = [
      { code: "E120", isVegetarian: false, isVegan: false },
    ];
    const product = makeProduct({ ingredientsText: "sucre" });
    const result = analyzeDietary(product, additives);
    expect(result.isVegan).toBe(false);
  });

  it("detects vegan when only plant ingredients", () => {
    const product = makeProduct({ ingredientsText: "riz, soja, huile de tournesol" });
    const result = analyzeDietary(product, NO_ADDITIVES);
    expect(result.isVegan).toBe(true);
  });
});

// ── Full Analysis ─────────────────────────────────────────────

describe("analyzeDietary — Nutella-like product", () => {
  it("correctly analyzes a Nutella-type product", () => {
    const product = makeProduct({
      ingredientsText: "Sucre, huile de palme, noisettes 13%, cacao maigre, lait écrémé en poudre, lactosérum, émulsifiant : lécithines",
      allergensTags: ["en:milk", "en:nuts"],
      ingredientsAnalysisTags: ["en:palm-oil", "en:non-vegan"],
      labelsTags: [],
    });
    const result = analyzeDietary(product, NO_ADDITIVES);

    expect(result.containsGluten).toBe(false);
    expect(result.containsLactose).toBe(true);
    expect(result.containsPalmOil).toBe(true);
    expect(result.isVegetarian).toBe(true); // no meat/gelatin
    expect(result.isVegan).toBe(false); // contains milk
  });
});
