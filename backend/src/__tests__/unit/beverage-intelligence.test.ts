import { describe, it, expect } from "vitest";
import {
  analyzeBeverage,
  detectSubcategory,
  analyzeSugarLevel,
  type BeverageAnalysis,
} from "../../services/beverage-intelligence.service.js";

// ── Subcategory detection ────────────────────────────────────

describe("BeverageIntelligence — Subcategory detection", () => {
  it("detects soda (Coca-Cola)", () => {
    expect(detectSubcategory("soda, boissons gazeuses, coca-cola")).toBe("soda");
  });

  it("detects juice", () => {
    expect(detectSubcategory("jus de fruits, jus d'orange")).toBe("juice");
  });

  it("detects energy drink", () => {
    expect(detectSubcategory("boissons energisantes, energy drink, red bull")).toBe("energy_drink");
  });

  it("detects dairy drink", () => {
    expect(detectSubcategory("lait demi-ecreme, produits laitiers")).toBe("dairy_drink");
  });

  it("detects plant milk", () => {
    expect(detectSubcategory("boisson vegetale, lait d'amande")).toBe("plant_milk");
  });

  it("detects water", () => {
    expect(detectSubcategory("eau minerale naturelle")).toBe("water");
  });

  it("detects hot beverage", () => {
    expect(detectSubcategory("cafe moulu arabica")).toBe("hot_beverage");
  });

  it("detects alcohol", () => {
    expect(detectSubcategory("biere blonde artisanale")).toBe("alcohol");
  });

  it("returns other_beverage for unknown", () => {
    expect(detectSubcategory("boisson exotique speciale")).toBe("other_beverage");
  });
});

// ── Sugar level analysis (Yuka thresholds) ───────────────────

describe("BeverageIntelligence — Sugar levels (Yuka thresholds)", () => {
  it("0g sugar → none", () => {
    const { level } = analyzeSugarLevel(0);
    expect(level).toBe("none");
  });

  it("1g sugar → low", () => {
    const { level } = analyzeSugarLevel(1);
    expect(level).toBe("low");
  });

  it("2g sugar → moderate", () => {
    const { level } = analyzeSugarLevel(2);
    expect(level).toBe("moderate");
  });

  it("5g sugar → high", () => {
    const { level } = analyzeSugarLevel(5);
    expect(level).toBe("high");
  });

  it("10.6g sugar (Coca-Cola) → very_high", () => {
    const { level, percentDailyMax } = analyzeSugarLevel(10.6);
    expect(level).toBe("very_high");
    expect(percentDailyMax).toBe(42); // 10.6/25 × 100
  });

  it("null sugar → none with no percentDailyMax", () => {
    const { level, percentDailyMax } = analyzeSugarLevel(null);
    expect(level).toBe("none");
    expect(percentDailyMax).toBeNull();
  });
});

// ── Full beverage analysis ──────────────────────────────────

describe("BeverageIntelligence — analyzeBeverage", () => {
  it("Coca-Cola: soda, very high sugar, score penalty", () => {
    const result = analyzeBeverage(
      "sodas, boissons gazeuses",
      "Coca-Cola",
      { sugars_100g: 10.6, "energy-kcal_100g": 42 },
      "eau gazéifiée, sucre, colorant: caramel (E150d)",
      ["en:e150d", "en:e338"],
    );
    expect(result).not.toBeNull();
    expect(result!.subcategory).toBe("soda");
    expect(result!.sugar.level).toBe("very_high");
    expect(result!.sugar.grams).toBe(10.6);
    expect(result!.scoreModifier).toBeLessThan(-10); // Heavy penalty
    expect(result!.hasNaturalSugar).toBe(false);
    expect(result!.insights).toContain("beverageInsightVeryHighSugar");
  });

  it("Coca-Cola Zero: soda, no sugar, sweeteners detected", () => {
    const result = analyzeBeverage(
      "sodas, boissons gazeuses",
      "Coca-Cola Zero",
      { sugars_100g: 0, "energy-kcal_100g": 1 },
      "eau gazéifiée, aspartame, acesulfame-k",
      ["en:e951", "en:e950"],
    );
    expect(result).not.toBeNull();
    expect(result!.sugar.level).toBe("none");
    expect(result!.sweeteners.detected).toBe(true);
    expect(result!.sweeteners.codes).toContain("E951");
    expect(result!.sweeteners.codes).toContain("E950");
    expect(result!.sweeteners.dualSweetened).toBe(false); // No sugar + sweetener
    expect(result!.insights).toContain("beverageInsightSweetenerOnly");
  });

  it("Orange juice: juice, natural sugar, less penalty", () => {
    const result = analyzeBeverage(
      "jus de fruits, jus d'orange",
      "Tropicana pur jus",
      { sugars_100g: 8.9, "energy-kcal_100g": 45 },
      "jus d'orange",
      [],
    );
    expect(result).not.toBeNull();
    expect(result!.subcategory).toBe("juice");
    expect(result!.hasNaturalSugar).toBe(true);
    // Juice gets +3 bonus offsetting some sugar penalty
    expect(result!.scoreModifier).toBeGreaterThan(-15);
    expect(result!.insights).toContain("beverageInsightNaturalSugar");
  });

  it("Evian: water, no penalties", () => {
    const result = analyzeBeverage(
      "eau minerale naturelle",
      "Evian",
      { sugars_100g: 0, "energy-kcal_100g": 0 },
      null,
      [],
    );
    expect(result).not.toBeNull();
    expect(result!.subcategory).toBe("water");
    expect(result!.scoreModifier).toBe(0);
    expect(result!.insights).toContain("beverageInsightWater");
  });

  it("Red Bull: energy drink, caffeine detected", () => {
    const result = analyzeBeverage(
      "boissons energisantes, energy drink",
      "Red Bull",
      { sugars_100g: 11, "energy-kcal_100g": 46 },
      "eau, sucre, taurine, caféine, vitamines",
      [],
    );
    expect(result).not.toBeNull();
    expect(result!.subcategory).toBe("energy_drink");
    expect(result!.caffeine.detected).toBe(true);
    expect(result!.caffeine.level).toBe("high");
    expect(result!.caffeine.sources).toContain("taurine");
    expect(result!.caffeine.sources).toContain("caffeine");
    expect(result!.insights).toContain("beverageInsightHighCaffeine");
  });

  it("returns null for non-beverage", () => {
    const result = analyzeBeverage(
      "biscuits, confiserie",
      "Oreo",
      { sugars_100g: 40, "energy-kcal_100g": 480, fat_100g: 20, proteins_100g: 5 },
      null,
      [],
    );
    expect(result).toBeNull();
  });

  it("dual-sweetened product: sugar + sweetener", () => {
    const result = analyzeBeverage(
      "sodas, boissons",
      "Soda Light Plus",
      { sugars_100g: 5, "energy-kcal_100g": 25 },
      "eau, sucre, aspartame",
      ["en:e951"],
    );
    expect(result).not.toBeNull();
    expect(result!.sweeteners.dualSweetened).toBe(true);
    expect(result!.insights).toContain("beverageInsightDualSweetened");
  });
});
