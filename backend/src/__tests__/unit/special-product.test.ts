import { describe, it, expect } from "vitest";
import { detectSpecialProduct } from "../../services/special-product.service.js";
import type { Product } from "../../db/schema/products.js";

// ── Helpers ───────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "test-id",
    barcode: "3256220141154",
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

// ── Non-special Products ──────────────────────────────────────

describe("detectSpecialProduct — non-special products", () => {
  it("returns null for generic food product", () => {
    const product = makeProduct({ name: "Biscuits au beurre", category: "Biscuits" });
    expect(detectSpecialProduct(product)).toBeNull();
  });

  it("returns null for product with no category", () => {
    const product = makeProduct({ name: "Unknown" });
    expect(detectSpecialProduct(product)).toBeNull();
  });
});

// ── Honey Detection ───────────────────────────────────────────

describe("detectSpecialProduct — honey", () => {
  it("detects honey from category", () => {
    const product = makeProduct({
      name: "Miel de lavande",
      category: "Miels",
    });
    const result = detectSpecialProduct(product);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("honey");
    expect(result!.bypassNutriScore).toBe(true);
  });

  it("evaluates 3 criteria for honey", () => {
    const product = makeProduct({
      name: "Miel de France Bio",
      category: "Miel",
      originsTags: ["en:france"],
      labelsTags: ["en:organic"],
      ingredientsText: "Miel",
    });
    const result = detectSpecialProduct(product);
    expect(result!.criteria).toHaveLength(3);

    // Origin France → pass
    expect(result!.criteria[0].pass).toBe(true);
    // Bio → pass
    expect(result!.criteria[1].pass).toBe(true);
    // Pure (no added sugar) → pass
    expect(result!.criteria[2].pass).toBe(true);
  });

  it("fails purity criterion when sugar is added", () => {
    const product = makeProduct({
      name: "Miel",
      category: "Miel",
      ingredientsText: "Miel, sirop de glucose",
    });
    const result = detectSpecialProduct(product);
    expect(result!.criteria[2].pass).toBe(false); // Pure → fail
  });

  it("computes correct qualityRatio", () => {
    const product = makeProduct({
      name: "Miel de lavande",
      category: "Miel",
      ingredientsText: "Miel",
      originsTags: ["en:france"],
      labelsTags: ["en:organic"],
    });
    const result = detectSpecialProduct(product);
    expect(result!.qualityRatio).toBe(1); // 3/3 criteria pass
  });
});

// ── Salt Detection ────────────────────────────────────────────

describe("detectSpecialProduct — salt", () => {
  it("detects sea salt", () => {
    const product = makeProduct({
      name: "Sel de mer",
      category: "Sel de table",
      ingredientsText: "Sel de mer, sel marin",
    });
    const result = detectSpecialProduct(product);
    expect(result!.type).toBe("salt");
    expect(result!.bypassNutriScore).toBe(true);
    expect(result!.criteria[0].pass).toBe(true); // sea salt → pass
  });

  it("fails anti-caking criterion", () => {
    const product = makeProduct({
      name: "Sel de table",
      category: "Sel de cuisine",
      ingredientsText: "Sel, anti-agglomérant : E536",
    });
    const result = detectSpecialProduct(product);
    expect(result!.criteria[1].pass).toBe(false); // anti-caking detected
  });

  it("does not match 'salt caramel' as salt product", () => {
    const product = makeProduct({
      name: "Chocolat salt caramel",
      category: "Confiserie",
    });
    expect(detectSpecialProduct(product)).toBeNull();
  });
});

// ── Chocolate Detection ───────────────────────────────────────

describe("detectSpecialProduct — chocolate", () => {
  it("detects pure chocolate", () => {
    const product = makeProduct({
      name: "Chocolat noir 85%",
      category: "Chocolat noir",
      ingredientsText: "Pâte de cacao, beurre de cacao, sucre",
      labelsTags: ["en:organic"],
      additivesTags: [],
    });
    const result = detectSpecialProduct(product);
    expect(result!.type).toBe("chocolate");
    expect(result!.bypassNutriScore).toBe(false); // chocolate still scored
    expect(result!.criteria[0].pass).toBe(true); // pure cocoa butter
    expect(result!.criteria[1].pass).toBe(true); // bio
  });

  it("fails palm oil criterion", () => {
    const product = makeProduct({
      name: "Chocolat au lait",
      category: "Chocolat",
      ingredientsText: "Sucre, huile de palme, cacao",
    });
    const result = detectSpecialProduct(product);
    expect(result!.criteria[3].pass).toBe(false); // palm oil detected
  });

  it("does not match chocolate biscuit as chocolate", () => {
    const product = makeProduct({
      name: "Biscuit chocolaté",
      category: "Biscuits au chocolat",
    });
    // Should NOT match — negative lookahead in regex prevents "biscuit"
    const result = detectSpecialProduct(product);
    expect(result).toBeNull();
  });
});

// ── Oil Detection ─────────────────────────────────────────────

describe("detectSpecialProduct — oil", () => {
  it("detects extra virgin olive oil", () => {
    const product = makeProduct({
      name: "Huile d'olive vierge extra",
      category: "Huiles d'olive",
      ingredientsText: "Huile d'olive vierge extra, première pression à froid",
      labelsTags: ["en:organic"],
    });
    const result = detectSpecialProduct(product);
    expect(result!.type).toBe("oil");
    expect(result!.criteria[0].pass).toBe(true); // extra virgin
    expect(result!.criteria[1].pass).toBe(true); // bio
    expect(result!.criteria[2].pass).toBe(true); // single origin
  });
});

// ── Coffee Detection ──────────────────────────────────────────

describe("detectSpecialProduct — coffee", () => {
  it("detects coffee and evaluates criteria", () => {
    const product = makeProduct({
      name: "Café arabica bio",
      category: "Cafés",
      ingredientsText: "100% arabica",
      labelsTags: ["en:organic", "en:fair-trade"],
    });
    const result = detectSpecialProduct(product);
    expect(result!.type).toBe("coffee");
    expect(result!.bypassNutriScore).toBe(true);
    expect(result!.criteria[0].pass).toBe(true); // arabica
    expect(result!.criteria[1].pass).toBe(true); // bio
    expect(result!.criteria[2].pass).toBe(true); // fair trade
    expect(result!.qualityRatio).toBe(1);
  });

  it("does not match coffee drink as coffee", () => {
    const product = makeProduct({
      name: "Café latte",
      category: "Boissons au café",
    });
    // "café" followed by "latte" → should not match (negative lookahead in categoryPatterns)
    expect(detectSpecialProduct(product)).toBeNull();
  });
});

// ── Tea Detection ─────────────────────────────────────────────

describe("detectSpecialProduct — tea", () => {
  it("detects tea and evaluates criteria", () => {
    const product = makeProduct({
      name: "Thé vert matcha bio",
      category: "Thés verts",
      ingredientsText: "Thé vert matcha",
      labelsTags: ["en:organic", "en:fair-trade"],
    });
    const result = detectSpecialProduct(product);
    expect(result!.type).toBe("tea");
    expect(result!.bypassNutriScore).toBe(true);
    expect(result!.criteria[0].pass).toBe(true); // bio
    expect(result!.criteria[1].pass).toBe(true); // no artificial
    expect(result!.criteria[2].pass).toBe(true); // fair trade
  });
});
