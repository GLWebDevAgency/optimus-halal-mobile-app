import { describe, it, expect } from "vitest";
import {
  computeHealthScore,
  detectNutrientAnomalies,
  checkScoreExclusion,
  type HealthScoreInput,
  type AdditiveForScore,
  type ScoreExclusionReason,
} from "../../services/health-score.service.js";

// ── Helpers ───────────────────────────────────────────────────

function makeInput(overrides: Partial<HealthScoreInput> = {}): HealthScoreInput {
  return {
    nutriscoreGrade: "b",
    novaGroup: 2,
    additives: [],
    hasIngredientsList: true,
    hasNutritionFacts: true,
    hasAllergens: true,
    hasOrigin: true,
    ...overrides,
  };
}

function makeAdditive(overrides: Partial<AdditiveForScore> = {}): AdditiveForScore {
  return {
    code: "E100",
    toxicityLevel: "safe",
    efsaStatus: "approved",
    adiMgPerKg: null,
    bannedCountries: null,
    ...overrides,
  };
}

// ── Complete Product (OFF grade fallback) ─────────────────────

describe("computeHealthScore V3 — complete product (OFF grade fallback)", () => {
  // V3 general: nutritionMax=60, additivesMax=20, NOVA max=10
  // OFF grade fallback → center of point range
  // A: center(60,60)=60, B: center(47,59)=53, C: center(25,46)=36, D: center(10,25)=18, E: center(0,10)=5

  it("grade A / NOVA 1 / no additives / full data → 90 (OFF fallback)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
    }));
    // nutrition=60/60, additives=20/20, processing=10/10
    // total=90/90, baseScore = round((90/90)*90) = 90
    expect(result.score).toBe(90);
    expect(result.label).toBe("excellent");
    expect(result.dataConfidence).toBe("high");
    expect(result.axes.nutrition?.source).toBe("off_grade");
    expect(result.cappedByAdditive).toBe(false);
    expect(result.category).toBe("general");
    expect(result.bonuses).toEqual({ bio: 0, aop: 0 });
  });

  it("grade E / NOVA 4 / no data → 25", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      novaGroup: 4,
      hasIngredientsList: false,
      hasNutritionFacts: false,
      hasAllergens: false,
      hasOrigin: false,
    }));
    // nutrition=5/60, additives=20/20, processing=0/10
    // total=25/90, baseScore = round((25/90)*90) = 25
    expect(result.score).toBe(25);
    expect(result.label).toBe("poor");
  });

  it("grade B / NOVA 2 / full data → 80", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
    }));
    // nutrition=53/60, additives=20/20, processing=7/10
    // total=80/90, baseScore = round((80/90)*90) = 80
    expect(result.score).toBe(80);
    expect(result.label).toBe("excellent");
  });

  it.each([
    // OFF grade → center of point range for general (nutritionMax=60)
    // A: (60+60)/2=60, B: (47+59)/2=53, C: (25+46)/2=35.5→36, D: (10+25)/2=17.5→18, E: (0+10)/2=5
    ["a", 60],
    ["b", 53],
    ["c", 36],
    ["d", 18],
    ["e", 5],
  ] as const)("OFF grade %s → %i/60 nutrition points (general)", (grade, expected) => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: grade }));
    expect(result.axes.nutrition?.score).toBe(expected);
    expect(result.axes.nutrition?.max).toBe(60);
    expect(result.axes.nutrition?.source).toBe("off_grade");
  });
});

// ── Computed NutriScore ──────────────────────────────────────

describe("computeHealthScore V3 — computed NutriScore", () => {
  it("computes NutriScore from raw nutriments (grade A product)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: 2,
      nutriments: {
        energy_100g: 400,
        sugars_100g: 3,
        saturated_fat_100g: 1,
        sodium_100g: 0.1,
        fiber_100g: 5,
        proteins_100g: 10,
        fruits_vegetables_nuts_100g: 60,
      },
      categories: "legumes",
    }));
    expect(result.axes.nutrition?.source).toBe("computed");
    expect(result.axes.nutrition?.grade).toBe("a");
    expect(result.axes.nutrition?.score).toBe(60); // grade A → full points (60 for general)
    expect(result.nutriScoreDetail).toBeDefined();
    expect(result.nutriScoreDetail?.grade).toBe("a");
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("falls back to OFF grade when nutriments are insufficient", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "c",
      nutriments: { energy_100g: 500 }, // only 1 N-nutriment
    }));
    expect(result.axes.nutrition?.source).toBe("off_grade");
    expect(result.axes.nutrition?.score).toBe(36); // center of C point range for general
  });

  it("computed NutriScore provides interpolated points within grade", () => {
    // A grade E product with high raw score → near 0 points
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: 1,
      nutriments: {
        energy_100g: 2500,
        sugars_100g: 50,
        saturated_fat_100g: 20,
        sodium_100g: 3,
        fiber_100g: 0,
        proteins_100g: 3,
      },
    }));
    expect(result.axes.nutrition?.source).toBe("computed");
    expect(result.axes.nutrition?.grade).toBe("e");
    // V3: grade E uses overshoot decay from max(0, ptsHi - round(overshoot * 0.5))
    expect(result.axes.nutrition!.score).toBeLessThanOrEqual(10);
  });

  it("nutriScoreDetail is populated when nutriments are provided", () => {
    const result = computeHealthScore(makeInput({
      nutriments: {
        energy_100g: 400,
        sugars_100g: 3,
        saturated_fat_100g: 1,
        sodium_100g: 0.1,
      },
    }));
    if (result.axes.nutrition?.source === "computed") {
      expect(result.nutriScoreDetail).toBeDefined();
    }
  });
});

// ── Insufficient Data ────────────────────────────────────────

describe("computeHealthScore V3 — insufficient data", () => {
  it("returns null score when only additives axis is available", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: null,
      additives: [makeAdditive()],
    }));
    expect(result.score).toBeNull();
    expect(result.label).toBeNull();
    expect(result.dataConfidence).toBe("very_low");
  });

  it("returns valid score when nutriscore + additives available (no NOVA)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: null,
    }));
    // V3 general: nutrition=53/60, additives=20/20
    // total=73/80, normalized=round((73/80)*90)=82
    expect(result.score).toBe(82);
    expect(result.label).toBe("excellent");
    expect(result.dataConfidence).toBe("medium");
    expect(result.axes.processing).toBeNull();
  });

  it("returns valid score when NOVA + additives available (no nutriscore)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: 1,
    }));
    // V3 general: additives=20/20, processing=10/10
    // total=30/30, normalized=round((30/30)*90)=90
    expect(result.score).toBe(90);
    expect(result.axes.nutrition).toBeNull();
  });

  it("unknown nutriscore grade is treated as null", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "x",
      novaGroup: null,
    }));
    expect(result.score).toBeNull();
  });
});

// ── Additives Axis (15-20 pts, category-dependent) ───────────

describe("computeHealthScore V3 — additives penalties", () => {
  // V3 general: additivesMax=20, penalties: safe=0, low_concern=1.5, moderate=4, high=8

  it("zero additives = 20/20 (general)", () => {
    const result = computeHealthScore(makeInput({ additives: [] }));
    expect(result.axes.additives.score).toBe(20);
    expect(result.axes.additives.max).toBe(20);
    expect(result.axes.additives.penalties).toEqual([]);
    expect(result.axes.additives.hasBanned).toBe(false);
  });

  it("EFSA banned additive → axe = 0 immediately, hasBanned = true", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({ code: "E123", efsaStatus: "banned" })],
    }));
    expect(result.axes.additives.score).toBe(0);
    expect(result.axes.additives.hasBanned).toBe(true);
    expect(result.axes.additives.penalties).toContain("E123: EFSA banned");
  });

  it("high_concern additive penalizes 8 points", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({ code: "E621", toxicityLevel: "high_concern" })],
    }));
    // round(max(0, 20 - 8)) = 12
    expect(result.axes.additives.score).toBe(12);
  });

  it("moderate_concern additive penalizes 4 points", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({ code: "E471", toxicityLevel: "moderate_concern" })],
    }));
    // round(max(0, 20 - 4)) = 16
    expect(result.axes.additives.score).toBe(16);
  });

  it("low_concern single additive → round(20 - 1.5) = 19 (NOT 18)", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({ code: "E330", toxicityLevel: "low_concern" })],
    }));
    // V3: low_concern=1.5, round(20 - 1.5) = round(18.5) = 19
    expect(result.axes.additives.score).toBe(19);
  });

  it("EFSA restricted multiplier (x1.3)", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({
        code: "E171",
        toxicityLevel: "moderate_concern",
        efsaStatus: "restricted",
      })],
    }));
    // 4 * 1.3 = 5.2 → round(20 - 5.2) = round(14.8) = 15
    expect(result.axes.additives.score).toBe(15);
    expect(result.axes.additives.penalties).toContain("E171: EFSA restricted (x1.3)");
  });

  it("ADI < 5mg/kg multiplier (x1.3)", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({
        code: "E951",
        toxicityLevel: "low_concern",
        adiMgPerKg: 4,
      })],
    }));
    // 1.5 * 1.3 = 1.95 → round(20 - 1.95) = round(18.05) = 18
    expect(result.axes.additives.score).toBe(18);
    expect(result.axes.additives.penalties).toContain("E951: ADI < 5mg/kg (x1.3)");
  });

  it("banned in 3+ countries adds +3 bonus penalty", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({
        code: "E102",
        toxicityLevel: "low_concern",
        bannedCountries: ["NO", "SE", "AT"],
      })],
    }));
    // 1.5 + 3 = 4.5 → round(20 - 4.5) = round(15.5) = 16
    expect(result.axes.additives.score).toBe(16);
    expect(result.axes.additives.penalties).toContain("E102: banned in 3 countries (+3)");
  });

  it("stacking: restricted + low ADI + banned countries", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({
        code: "E999",
        toxicityLevel: "high_concern",
        efsaStatus: "restricted",
        adiMgPerKg: 2,
        bannedCountries: ["NO", "SE", "AT", "FI"],
      })],
    }));
    // 8 * 1.3 = 10.4 * 1.3 = 13.52 + 3 = 16.52 → round(20 - 16.52) = round(3.48) = 3
    expect(result.axes.additives.score).toBe(3);
  });

  it("multiple additives accumulate penalties", () => {
    const result = computeHealthScore(makeInput({
      additives: [
        makeAdditive({ code: "E621", toxicityLevel: "high_concern" }),     // 8
        makeAdditive({ code: "E471", toxicityLevel: "moderate_concern" }), // 4
        makeAdditive({ code: "E330", toxicityLevel: "low_concern" }),      // 1.5
      ],
    }));
    // total penalty = 8 + 4 + 1.5 = 13.5 → round(20 - 13.5) = round(6.5) = 7
    expect(result.axes.additives.score).toBe(7);
  });

  it("penalties clamped to 0 (never negative)", () => {
    const result = computeHealthScore(makeInput({
      additives: [
        makeAdditive({ code: "E1", toxicityLevel: "high_concern" }), // 8
        makeAdditive({ code: "E2", toxicityLevel: "high_concern" }), // 8
        makeAdditive({ code: "E3", toxicityLevel: "high_concern" }), // 8
      ],
    }));
    // total penalty = 24 → round(max(0, 20-24)) = 0
    expect(result.axes.additives.score).toBe(0);
  });

  it("fats_oils_nuts category has additivesMax=15", () => {
    const result = computeHealthScore(makeInput({
      additives: [],
      categories: "huile d'olive",
    }));
    expect(result.axes.additives.max).toBe(15);
    expect(result.axes.additives.score).toBe(15);
  });

  it("cheese category has additivesMax=15", () => {
    const result = computeHealthScore(makeInput({
      additives: [],
      categories: "fromage camembert",
    }));
    expect(result.axes.additives.max).toBe(15);
  });
});

// ── NOVA Processing Axis (10 pts) ────────────────────────────

describe("computeHealthScore V3 — NOVA processing", () => {
  it.each([
    [1, 10],
    [2, 7],
    [3, 4],
    [4, 0],
  ])("NOVA %i → %i points (V3)", (nova, expected) => {
    const result = computeHealthScore(makeInput({ novaGroup: nova }));
    expect(result.axes.processing?.score).toBe(expected);
    expect(result.axes.processing?.max).toBe(10);
    expect(result.axes.processing?.source).toBe("off");
  });

  it("invalid NOVA (0 or 5) → null (falls to heuristic, which also returns null)", () => {
    expect(computeHealthScore(makeInput({ novaGroup: 0 })).axes.processing).toBeNull();
    expect(computeHealthScore(makeInput({ novaGroup: 5 })).axes.processing).toBeNull();
  });

  it("AI NOVA estimate used when OFF absent", () => {
    const result = computeHealthScore(makeInput({
      novaGroup: null,
      aiNovaEstimate: 3,
    }));
    expect(result.axes.processing?.score).toBe(4); // NOVA 3 → 4 pts in V3
    expect(result.axes.processing?.source).toBe("ai");
  });

  it("heuristic: 5+ additives → NOVA 4", () => {
    const result = computeHealthScore(makeInput({
      novaGroup: null,
      additiveCount: 7,
      ingredientCount: 20,
    }));
    expect(result.axes.processing?.score).toBe(0);
    expect(result.axes.processing?.source).toBe("heuristic");
  });

  it("heuristic: snack category → NOVA 4", () => {
    const result = computeHealthScore(makeInput({
      novaGroup: null,
      additiveCount: 0,
      ingredientCount: 10,
      categories: "Chips et snacks sales",
    }));
    expect(result.axes.processing?.score).toBe(0);
    expect(result.axes.processing?.source).toBe("heuristic");
  });

  it("heuristic: 3 ingredients, 0 additives → NOVA 1", () => {
    const result = computeHealthScore(makeInput({
      novaGroup: null,
      additiveCount: 0,
      ingredientCount: 3,
    }));
    expect(result.axes.processing?.score).toBe(10); // NOVA 1 → 10 pts in V3
    expect(result.axes.processing?.source).toBe("heuristic");
  });

  it("OFF NOVA takes priority over AI estimate", () => {
    const result = computeHealthScore(makeInput({
      novaGroup: 1,
      aiNovaEstimate: 4,
    }));
    expect(result.axes.processing?.score).toBe(10); // NOVA 1, not 4
    expect(result.axes.processing?.source).toBe("off");
  });
});

// ── Beverage Sugar Axis (20 pts, beverages only) ─────────────

describe("computeHealthScore V3 — beverage sugar axis", () => {
  it("0g sugar → 20 pts", () => {
    const result = computeHealthScore(makeInput({
      categories: "boisson",
      nutriments: {
        energy_100g: 0,
        sugars_100g: 0,
        saturated_fat_100g: 0,
        sodium_100g: 0,
      },
      nutriscoreGrade: "b",
      novaGroup: 1,
    }));
    expect(result.category).toBe("beverages");
    expect(result.axes.beverageSugar).toBeDefined();
    expect(result.axes.beverageSugar!.score).toBe(20);
    expect(result.axes.beverageSugar!.max).toBe(20);
  });

  it("10.6g sugar (Coca-Cola level) → 0 pts", () => {
    const result = computeHealthScore(makeInput({
      categories: "soda",
      nutriments: {
        energy_100g: 180,
        sugars_100g: 10.6,
        saturated_fat_100g: 0,
        sodium_100g: 0.01,
      },
      nutriscoreGrade: "e",
      novaGroup: 4,
    }));
    expect(result.axes.beverageSugar).toBeDefined();
    expect(result.axes.beverageSugar!.score).toBe(0);
  });

  it("1g sugar → 17 pts", () => {
    const result = computeHealthScore(makeInput({
      categories: "boisson",
      nutriments: {
        energy_100g: 20,
        sugars_100g: 1,
        saturated_fat_100g: 0,
        sodium_100g: 0,
      },
      nutriscoreGrade: "b",
      novaGroup: 1,
    }));
    expect(result.axes.beverageSugar!.score).toBe(17);
  });

  it("5g sugar → 10 pts", () => {
    const result = computeHealthScore(makeInput({
      categories: "jus de fruits",
      nutriments: {
        energy_100g: 100,
        sugars_100g: 5,
        saturated_fat_100g: 0,
        sodium_100g: 0,
      },
      nutriscoreGrade: "c",
      novaGroup: 2,
    }));
    expect(result.axes.beverageSugar!.score).toBe(10);
  });

  it("non-beverage has no beverageSugar axis", () => {
    const result = computeHealthScore(makeInput({
      categories: "biscuits",
      nutriments: {
        energy_100g: 2000,
        sugars_100g: 30,
        saturated_fat_100g: 10,
        sodium_100g: 0.5,
      },
    }));
    expect(result.axes.beverageSugar).toBeUndefined();
  });
});

// ── Bio/AOP Bonuses ──────────────────────────────────────────

describe("computeHealthScore V3 — bio/aop bonuses", () => {
  it("+7 for organic label", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
      labels: ["en:organic", "en:eu-organic"],
    }));
    expect(result.bonuses.bio).toBe(7);
    expect(result.bonuses.aop).toBe(0);
    // Base without bonus would be 80, with +7 = 87
    expect(result.score).toBe(87);
  });

  it("+3 for AOP label", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
      labels: ["en:pdo", "fr:aop"],
    }));
    expect(result.bonuses.bio).toBe(0);
    expect(result.bonuses.aop).toBe(3);
    expect(result.score).toBe(83);
  });

  it("+10 combined bio + aop", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
      labels: ["en:organic", "en:pdo"],
    }));
    expect(result.bonuses.bio).toBe(7);
    expect(result.bonuses.aop).toBe(3);
    expect(result.score).toBe(90);
  });

  it("no labels → 0 bonuses", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
    }));
    expect(result.bonuses).toEqual({ bio: 0, aop: 0 });
  });

  it("bio label detected via 'biologique'", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      labels: ["Agriculture biologique"],
    }));
    expect(result.bonuses.bio).toBe(7);
  });

  it("aop label detected via 'label rouge'", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      labels: ["Label Rouge"],
    }));
    expect(result.bonuses.aop).toBe(3);
  });

  it("bonuses capped at 100 total", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      labels: ["en:organic", "en:pdo"],
    }));
    // 90 + 7 + 3 = 100, clamped to 100
    expect(result.score).toBe(100);
  });
});

// ── Category Detection & Weights ─────────────────────────────

describe("computeHealthScore V3 — category detection", () => {
  it("detects beverages category", () => {
    const result = computeHealthScore(makeInput({ categories: "boisson gazeuse" }));
    expect(result.category).toBe("beverages");
    expect(result.axes.nutrition?.max).toBe(50);
    expect(result.axes.additives.max).toBe(20);
  });

  it("detects fats_oils_nuts category", () => {
    const result = computeHealthScore(makeInput({ categories: "huile d'olive" }));
    expect(result.category).toBe("fats_oils_nuts");
    expect(result.axes.nutrition?.max).toBe(55);
    expect(result.axes.additives.max).toBe(15);
  });

  it("detects cheese category", () => {
    const result = computeHealthScore(makeInput({ categories: "fromage" }));
    expect(result.category).toBe("cheese");
    expect(result.axes.nutrition?.max).toBe(55);
    expect(result.axes.additives.max).toBe(15);
  });

  it("detects red_meat category", () => {
    const result = computeHealthScore(makeInput({ categories: "boeuf" }));
    expect(result.category).toBe("red_meat");
    expect(result.axes.nutrition?.max).toBe(60);
    expect(result.axes.additives.max).toBe(20);
  });

  it("defaults to general category", () => {
    const result = computeHealthScore(makeInput({ categories: "biscuits" }));
    expect(result.category).toBe("general");
    expect(result.axes.nutrition?.max).toBe(60);
    expect(result.axes.additives.max).toBe(20);
  });
});

// ── Coca-Cola Regression Test ────────────────────────────────

describe("computeHealthScore V3 — Coca-Cola regression", () => {
  it("Coca-Cola scores ~21 (was 72 in V2)", () => {
    const result = computeHealthScore(makeInput({
      categories: "Soda, Boisson gazeuse",
      nutriments: {
        energy_100g: 180,
        sugars_100g: 10.6,
        saturated_fat_100g: 0,
        sodium_100g: 0.01,
        fiber_100g: 0,
        proteins_100g: 0,
      },
      nutriscoreGrade: "e",
      novaGroup: 4,
      additives: [
        makeAdditive({ code: "E150d", toxicityLevel: "low_concern" }),
        makeAdditive({ code: "E338", toxicityLevel: "low_concern" }),
      ],
      hasIngredientsList: true,
      hasNutritionFacts: true,
      hasAllergens: false,
      hasOrigin: false,
    }));

    expect(result.category).toBe("beverages");
    // Beverage sugar: 10.6g → 0 pts (max 20)
    expect(result.axes.beverageSugar).toBeDefined();
    expect(result.axes.beverageSugar!.score).toBe(0);
    // NOVA 4 → 0 pts (max 10)
    expect(result.axes.processing?.score).toBe(0);
    // Nutrition axis: grade E for beverages → low points
    // Additives: 2 low_concern = 2 * 1.5 = 3 penalty → round(20 - 3) = 17
    expect(result.axes.additives.score).toBe(17);

    // Score should be around 21 (significantly lower than V2's 72)
    expect(result.score).toBeGreaterThanOrEqual(15);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.label).toBe("poor");
  });
});

// ── Profile Adjustments ──────────────────────────────────────

describe("computeHealthScore V3 — profile adjustments", () => {
  it("standard profile → delta 0, no reasons", () => {
    const result = computeHealthScore(makeInput({ profile: "standard" }));
    expect(result.axes.profile.delta).toBe(0);
    expect(result.axes.profile.reasons).toEqual([]);
  });

  it("no profile specified defaults to standard", () => {
    const result = computeHealthScore(makeInput());
    expect(result.axes.profile.delta).toBe(0);
  });

  it("pregnant: penalizes riskPregnant additives", () => {
    const result = computeHealthScore(makeInput({
      profile: "pregnant",
      additives: [
        makeAdditive({ code: "E951", toxicityLevel: "moderate_concern", riskPregnant: true }),
      ],
    }));
    expect(result.axes.profile.delta).toBeLessThan(0);
    expect(result.axes.profile.reasons.some(r => r.includes("grossesse"))).toBe(true);
  });

  it("pregnant: extra penalty for NutriScore E", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      profile: "pregnant",
    }));
    expect(result.axes.profile.reasons.some(r => r.includes("diabete gestationnel"))).toBe(true);
  });

  it("child: penalizes riskChildren additives", () => {
    const result = computeHealthScore(makeInput({
      profile: "child",
      additives: [
        makeAdditive({ code: "E110", toxicityLevel: "moderate_concern", riskChildren: true }),
      ],
    }));
    expect(result.axes.profile.delta).toBeLessThan(0);
    expect(result.axes.profile.reasons.some(r => r.includes("enfants"))).toBe(true);
  });

  it("child: penalizes high sugar (> 20g/100g)", () => {
    const result = computeHealthScore(makeInput({
      profile: "child",
      nutriments: { sugars_100g: 25, energy_100g: 1500, saturated_fat_100g: 5, sodium_100g: 0.5 },
    }));
    expect(result.axes.profile.reasons.some(r => r.includes("Sucres > 20g"))).toBe(true);
  });

  it("child: extra penalty for NOVA 4", () => {
    const result = computeHealthScore(makeInput({
      novaGroup: 4,
      profile: "child",
    }));
    expect(result.axes.profile.reasons.some(r => r.includes("NOVA 4"))).toBe(true);
  });

  it("athlete: bonus for high protein (> 15g/100g)", () => {
    const result = computeHealthScore(makeInput({
      profile: "athlete",
      nutriments: { proteins_100g: 25, energy_100g: 600, sugars_100g: 2, saturated_fat_100g: 3, sodium_100g: 0.8 },
    }));
    expect(result.axes.profile.delta).toBeGreaterThan(0);
    expect(result.axes.profile.reasons.some(r => r.includes("ISSN"))).toBe(true);
  });

  it("athlete: sodium tolerance bonus", () => {
    const result = computeHealthScore(makeInput({
      profile: "athlete",
      nutriments: { salt_100g: 2, energy_100g: 600, sugars_100g: 2, saturated_fat_100g: 3, sodium_100g: 0.8 },
    }));
    expect(result.axes.profile.reasons.some(r => r.includes("sudation"))).toBe(true);
  });

  it("elderly: penalty for low protein (< 5g)", () => {
    const result = computeHealthScore(makeInput({
      profile: "elderly",
      nutriments: { proteins_100g: 2, energy_100g: 400, sugars_100g: 10, saturated_fat_100g: 3, sodium_100g: 0.3 },
    }));
    expect(result.axes.profile.delta).toBeLessThan(0);
    expect(result.axes.profile.reasons.some(r => r.includes("sarcopenie"))).toBe(true);
  });

  it("elderly: bonus for fiber (> 5g)", () => {
    const result = computeHealthScore(makeInput({
      profile: "elderly",
      nutriments: { fiber_100g: 8, proteins_100g: 10, energy_100g: 400, sugars_100g: 5, saturated_fat_100g: 2, sodium_100g: 0.3 },
    }));
    expect(result.axes.profile.reasons.some(r => r.includes("Fibres"))).toBe(true);
  });

  it("elderly: penalty for high sodium (> 2g salt)", () => {
    const result = computeHealthScore(makeInput({
      profile: "elderly",
      nutriments: { salt_100g: 3, proteins_100g: 10, energy_100g: 400, sugars_100g: 5, saturated_fat_100g: 2, sodium_100g: 1.2 },
    }));
    expect(result.axes.profile.reasons.some(r => r.includes("cardiovasculaire"))).toBe(true);
  });

  it("profile delta clamped to [-10, +10]", () => {
    const result = computeHealthScore(makeInput({
      profile: "athlete",
      nutriments: { proteins_100g: 50, salt_100g: 5, energy_100g: 2000, sugars_100g: 2, saturated_fat_100g: 3, sodium_100g: 2 },
    }));
    expect(result.axes.profile.delta).toBeLessThanOrEqual(10);
    expect(result.axes.profile.delta).toBeGreaterThanOrEqual(-10);
  });
});

// ── Additive Caps ─────────────────────────────────────────────

describe("computeHealthScore V3 — additive caps", () => {
  it("banned additive caps score at 25", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      additives: [makeAdditive({ code: "E123", efsaStatus: "banned" })],
    }));
    // Without cap, score would be high. With banned cap: 25
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.cappedByAdditive).toBe(true);
    expect(result.axes.additives.hasBanned).toBe(true);
  });

  it("high_concern additive caps score at 49", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      additives: [makeAdditive({ code: "E621", toxicityLevel: "high_concern" })],
    }));
    expect(result.score).toBe(49);
    expect(result.cappedByAdditive).toBe(true);
    expect(result.axes.additives.hasBanned).toBe(false);
  });

  it("no cap when product has no high_concern additive", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      additives: [makeAdditive({ toxicityLevel: "moderate_concern" })],
    }));
    expect(result.cappedByAdditive).toBe(false);
    expect(result.score).toBeGreaterThan(49);
  });

  it("score already below 25 is not affected by banned cap", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      novaGroup: 4,
      additives: [makeAdditive({ code: "E123", efsaStatus: "banned" })],
      hasIngredientsList: false,
      hasNutritionFacts: false,
      hasAllergens: false,
      hasOrigin: false,
    }));
    // Score would be very low without cap
    expect(result.score!).toBeLessThanOrEqual(25);
    // Not "capped" if already below
    if (result.score! < 25) {
      expect(result.cappedByAdditive).toBe(false);
    }
  });

  it("score already below 49 is not affected by high_concern cap", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      novaGroup: 4,
      additives: [makeAdditive({ code: "E621", toxicityLevel: "high_concern" })],
      hasIngredientsList: false,
      hasNutritionFacts: false,
      hasAllergens: false,
      hasOrigin: false,
    }));
    expect(result.score!).toBeLessThan(49);
    expect(result.cappedByAdditive).toBe(false);
  });
});

// ── No Transparency Axis ─────────────────────────────────────

describe("computeHealthScore V3 — no transparency axis", () => {
  it("result.axes should NOT have transparency property", () => {
    const result = computeHealthScore(makeInput());
    expect(result.axes).not.toHaveProperty("transparency");
  });
});

// ── Labels ───────────────────────────────────────────────────

describe("computeHealthScore V3 — labels", () => {
  it("grade A / NOVA 1 → excellent", () => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: "a", novaGroup: 1 }));
    expect(result.label).toBe("excellent");
  });

  it("grade B / NOVA 2 → excellent (80 in V3)", () => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: "b", novaGroup: 2 }));
    expect(result.label).toBe("excellent");
  });

  it("grade D / NOVA 3 → mediocre", () => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: "d", novaGroup: 3 }));
    // V3: nutrition=18/60, processing=4/10, additives=20/20
    // total=42/90, normalized=round((42/90)*90)=42
    expect(result.label).toBe("mediocre");
  });

  it("grade E / NOVA 4 → poor", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      novaGroup: 4,
      hasAllergens: false,
      hasOrigin: false,
    }));
    expect(["poor", "very_poor"]).toContain(result.label);
  });

  it("all labels are valid values", () => {
    const validLabels = ["excellent", "good", "mediocre", "poor", "very_poor"];
    for (const g of ["a", "b", "c", "d", "e"] as const) {
      const result = computeHealthScore(makeInput({ nutriscoreGrade: g }));
      expect(validLabels).toContain(result.label);
    }
  });
});

// ── Data Confidence ──────────────────────────────────────────

describe("computeHealthScore V3 — data confidence", () => {
  it("nutrition + processing → high", () => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: "a", novaGroup: 1 }));
    expect(result.dataConfidence).toBe("high");
  });

  it("computed NutriScore + OFF NOVA + hasIngredientsList → high", () => {
    const result = computeHealthScore(makeInput({
      novaGroup: 2,
      hasIngredientsList: true,
      nutriments: {
        energy_100g: 400,
        sugars_100g: 3,
        saturated_fat_100g: 1,
        sodium_100g: 0.1,
        fiber_100g: 5,
        proteins_100g: 10,
      },
    }));
    expect(result.dataConfidence).toBe("high");
  });

  it("nutrition only (no NOVA) → medium", () => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: "a", novaGroup: null }));
    expect(result.dataConfidence).toBe("medium");
  });

  it("processing only (no nutriscore) → medium", () => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: null, novaGroup: 1 }));
    expect(result.dataConfidence).toBe("medium");
  });

  it("insufficient data → very_low", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: null,
      additives: [makeAdditive()],
    }));
    expect(result.dataConfidence).toBe("very_low");
  });
});

// ── Proportional Scoring ─────────────────────────────────────

describe("computeHealthScore V3 — proportional scoring when axis absent", () => {
  it("NOVA absent: score proportional to (nutrition + additives)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: null,
    }));
    // V3 general: nutrition=60/60, additives=20/20
    // total=80/80, normalized=round((80/80)*90)=90
    expect(result.score).toBe(90);
  });

  it("nutriscore absent: score proportional to (additives + processing)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: 1,
    }));
    // V3 general: additives=20/20, processing=10/10
    // total=30/30, normalized=round((30/30)*90)=90
    expect(result.score).toBe(90);
  });

  it("both absent → null (insufficient primary axes)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: null,
    }));
    expect(result.score).toBeNull();
  });
});

// ── Result Structure ─────────────────────────────────────────

describe("computeHealthScore V3 — result structure", () => {
  it("includes all V3 fields in result", () => {
    const result = computeHealthScore(makeInput());
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("label");
    expect(result).toHaveProperty("axes");
    expect(result).toHaveProperty("dataConfidence");
    expect(result).toHaveProperty("cappedByAdditive");
    expect(result).toHaveProperty("bonuses");
    expect(result).toHaveProperty("category");
    expect(result.axes).toHaveProperty("nutrition");
    expect(result.axes).toHaveProperty("additives");
    expect(result.axes).toHaveProperty("processing");
    expect(result.axes).toHaveProperty("profile");
    expect(result.axes).not.toHaveProperty("transparency");
    expect(result.axes.additives).toHaveProperty("hasBanned");
  });

  it("profile axis always has delta and reasons", () => {
    const result = computeHealthScore(makeInput());
    expect(typeof result.axes.profile.delta).toBe("number");
    expect(Array.isArray(result.axes.profile.reasons)).toBe(true);
  });

  it("score is always in [0, 100] when not null", () => {
    const cases = [
      makeInput({ nutriscoreGrade: "a", novaGroup: 1 }),
      makeInput({ nutriscoreGrade: "e", novaGroup: 4, hasIngredientsList: false, hasNutritionFacts: false, hasAllergens: false, hasOrigin: false }),
      makeInput({ nutriscoreGrade: "c", novaGroup: 3, profile: "elderly", nutriments: { proteins_100g: 1, salt_100g: 5, energy_100g: 2000, sugars_100g: 50, saturated_fat_100g: 20, sodium_100g: 2 } }),
    ];
    for (const c of cases) {
      const result = computeHealthScore(c);
      if (result.score !== null) {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    }
  });
});

// ── Nutrient Anomaly Detection ──────────────────────────────

describe("detectNutrientAnomalies", () => {
  it("returns empty array for valid nutriments", () => {
    const anomalies = detectNutrientAnomalies(
      { energy_100g: 900, fat_100g: 12, saturated_fat_100g: 3, sugars_100g: 0, salt_100g: 1.2, proteins_100g: 24 },
      "Sardines en conserve",
    );
    expect(anomalies).toEqual([]);
  });

  it("detects suspicious salt for non-condiment products", () => {
    const anomalies = detectNutrientAnomalies(
      { salt_100g: 12.68 },
      "Sardines en conserve",
    );
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].field).toBe("salt_100g");
    expect(anomalies[0].severity).toBe("suspicious");
  });

  it("allows high salt for condiment categories", () => {
    const anomalies = detectNutrientAnomalies(
      { salt_100g: 15 },
      "Sauces soja, Condiments",
    );
    expect(anomalies).toEqual([]);
  });

  it("detects impossible saturated fat > total fat", () => {
    const anomalies = detectNutrientAnomalies(
      { fat_100g: 5, saturated_fat_100g: 10 },
      null,
    );
    expect(anomalies.some(a => a.severity === "impossible" && a.field === "saturated_fat_100g")).toBe(true);
  });

  it("detects impossible sugars > carbohydrates", () => {
    const anomalies = detectNutrientAnomalies(
      { carbohydrates_100g: 10, sugars_100g: 20 },
      null,
    );
    expect(anomalies.some(a => a.severity === "impossible" && a.field === "sugars_100g")).toBe(true);
  });

  it("detects suspicious macronutrient sum > 105g", () => {
    const anomalies = detectNutrientAnomalies(
      { fat_100g: 40, carbohydrates_100g: 50, proteins_100g: 20 },
      null,
    );
    expect(anomalies.some(a => a.field === "macro_sum")).toBe(true);
  });

  it("detects anomalies from OFF nutriscore components when standard nutriments null", () => {
    const anomalies = detectNutrientAnomalies(
      null,
      "Sardines en conserve",
      [
        { id: "energy", value: 981 },
        { id: "saturated_fat", value: 3.73 },
        { id: "sugars", value: 0 },
        { id: "salt", value: 12.68 },
      ],
    );
    expect(anomalies.some(a => a.field === "salt_100g" && a.severity === "suspicious")).toBe(true);
  });

  it("returns empty array when no data provided", () => {
    expect(detectNutrientAnomalies(null, null)).toEqual([]);
  });

  it("detects impossible energy > 4200 kJ", () => {
    const anomalies = detectNutrientAnomalies({ energy_100g: 5000 }, null);
    expect(anomalies.some(a => a.field === "energy_100g" && a.severity === "impossible")).toBe(true);
  });
});

// ── Anomaly Integration in Health Score ─────────────────────

describe("computeHealthScore V3 — nutrient anomaly handling", () => {
  it("sardines case: OFF grade E discarded when nutriscore components have suspicious salt", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      novaGroup: 3,
      nutriments: {},
      offNutriscoreComponents: [
        { id: "energy", value: 981 },
        { id: "saturated_fat", value: 3.73 },
        { id: "sugars", value: 0 },
        { id: "salt", value: 12.68 },
      ],
      categories: "Sardines en conserve",
    }));
    expect(result.nutrientAnomalies).toBeDefined();
    expect(result.nutrientAnomalies!.length).toBeGreaterThan(0);
    expect(result.dataConfidence).not.toBe("high");
    expect(result.axes.nutrition).toBeNull();
  });

  it("preserves OFF grade when standard nutriments are present despite suspicious values", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      novaGroup: 3,
      nutriments: {
        energy_100g: 981,
        fat_100g: 12,
        saturated_fat_100g: 3.73,
        sugars_100g: 0,
        salt_100g: 12.68,
        proteins_100g: 24,
      },
      categories: "Sardines en conserve",
    }));
    expect(result.nutrientAnomalies).toBeDefined();
    expect(result.axes.nutrition).not.toBeNull();
    expect(result.dataConfidence).not.toBe("high");
  });

  it("no anomalies → no nutrientAnomalies field", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
    }));
    expect(result.nutrientAnomalies).toBeUndefined();
  });
});

// ── Score Exclusion (checkScoreExclusion) ─────────────────────

function makeExclusionProduct(overrides: Partial<Parameters<typeof checkScoreExclusion>[0]> = {}): Parameters<typeof checkScoreExclusion>[0] {
  return {
    name: "Chocolat noir 70%",
    category: "Chocolats noirs",
    categoryId: "en:dark-chocolates",
    labelsTags: null,
    novaGroup: 3,
    nutriscoreGrade: "d",
    energyKcal100g: 550,
    fat100g: 42,
    sugars100g: 25,
    salt100g: 0.02,
    proteins100g: 8,
    ...overrides,
  };
}

describe("checkScoreExclusion", () => {
  // ── Water ──────────────────────────────────────────────────

  it("detects water from product name (French)", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Eau minérale",
      category: "Eaux",
    }));
    expect(result).toBe("water" satisfies ScoreExclusionReason);
  });

  it("detects water from product name (English)", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Spring water",
      category: "Waters",
    }));
    expect(result).toBe("water" satisfies ScoreExclusionReason);
  });

  it("detects water from category even when name is different", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Cristaline",
      category: "Eau de source",
    }));
    expect(result).toBe("water" satisfies ScoreExclusionReason);
  });

  it("detects sparkling water", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Eau gazeuse",
      category: "Eaux gazeuses",
    }));
    expect(result).toBe("water" satisfies ScoreExclusionReason);
  });

  // ── Alcohol ────────────────────────────────────────────────

  it("detects alcohol: beer (French)", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Bière blonde",
      category: "Bières",
    }));
    expect(result).toBe("alcohol" satisfies ScoreExclusionReason);
  });

  it("detects alcohol: wine (French)", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Vin rouge",
      category: "Vins rouges",
    }));
    expect(result).toBe("alcohol" satisfies ScoreExclusionReason);
  });

  it("detects alcohol: whisky", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Whisky single malt",
      category: "Spiritueux",
    }));
    expect(result).toBe("alcohol" satisfies ScoreExclusionReason);
  });

  it("detects alcohol from category only", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Kronenbourg 1664",
      category: "Bière blonde",
    }));
    expect(result).toBe("alcohol" satisfies ScoreExclusionReason);
  });

  // ── Not food ───────────────────────────────────────────────

  it("detects not-food: soap (French)", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Savon de Marseille",
      category: "Soins corporels",
    }));
    expect(result).toBe("not_food" satisfies ScoreExclusionReason);
  });

  it("detects not-food: toothpaste (French)", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Dentifrice menthe",
      category: "Hygiène bucco-dentaire",
    }));
    expect(result).toBe("not_food" satisfies ScoreExclusionReason);
  });

  it("detects not-food: cosmetic", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Crème hydratante",
      category: "Cosmétique",
    }));
    expect(result).toBe("not_food" satisfies ScoreExclusionReason);
  });

  it("detects not-food: dietary supplement", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Complément alimentaire vitamine D",
      category: "Compléments",
    }));
    expect(result).toBe("not_food" satisfies ScoreExclusionReason);
  });

  // ── Baby food ──────────────────────────────────────────────

  it("detects baby food (French)", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Lait infantile 1er âge",
      category: "Alimentation bébé",
    }));
    expect(result).toBe("baby_food" satisfies ScoreExclusionReason);
  });

  it("detects baby food (English)", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Infant formula stage 1",
      category: "Baby food",
    }));
    expect(result).toBe("baby_food" satisfies ScoreExclusionReason);
  });

  // ── Too generic ────────────────────────────────────────────

  it("detects too-generic name: Fruits", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Fruits",
      category: null,
      categoryId: null,
    }));
    expect(result).toBe("too_generic" satisfies ScoreExclusionReason);
  });

  it("detects too-generic name: Légumes", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Légumes",
      category: null,
      categoryId: null,
    }));
    expect(result).toBe("too_generic" satisfies ScoreExclusionReason);
  });

  it("detects too-generic name: Pain", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Pain",
      category: null,
      categoryId: null,
    }));
    expect(result).toBe("too_generic" satisfies ScoreExclusionReason);
  });

  it("detects too-generic name: Rice (English)", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Rice",
      category: null,
      categoryId: null,
    }));
    expect(result).toBe("too_generic" satisfies ScoreExclusionReason);
  });

  // ── Missing nutrition data ─────────────────────────────────

  it("returns missing_nutrition_data when no nutriscore, no NOVA, and insufficient nutrient values", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      nutriscoreGrade: null,
      novaGroup: null,
      energyKcal100g: null,
      fat100g: null,
      sugars100g: null,
      salt100g: null,
      proteins100g: null,
    }));
    expect(result).toBe("missing_nutrition_data" satisfies ScoreExclusionReason);
  });

  it("returns missing_nutrition_data with fewer than 3 nutrient values and no grade/nova", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      nutriscoreGrade: null,
      novaGroup: null,
      energyKcal100g: 200,
      fat100g: 10,
      sugars100g: null,
      salt100g: null,
      proteins100g: null,
    }));
    expect(result).toBe("missing_nutrition_data" satisfies ScoreExclusionReason);
  });

  it("does NOT exclude when nutriscore grade is present despite missing nutrient values", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      nutriscoreGrade: "c",
      novaGroup: null,
      energyKcal100g: null,
      fat100g: null,
      sugars100g: null,
      salt100g: null,
      proteins100g: null,
    }));
    expect(result).toBeNull();
  });

  it("does NOT exclude when NOVA group is present despite missing nutrient values", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      nutriscoreGrade: null,
      novaGroup: 2,
      energyKcal100g: null,
      fat100g: null,
      sugars100g: null,
      salt100g: null,
      proteins100g: null,
    }));
    expect(result).toBeNull();
  });

  it("does NOT exclude when 3+ nutrient values are present without grade/nova", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      nutriscoreGrade: null,
      novaGroup: null,
      energyKcal100g: 200,
      fat100g: 10,
      sugars100g: 5,
      salt100g: null,
      proteins100g: null,
    }));
    expect(result).toBeNull();
  });

  // ── Normal food (no exclusion) ─────────────────────────────

  it("returns null for normal food product", () => {
    const result = checkScoreExclusion(makeExclusionProduct());
    expect(result).toBeNull();
  });

  it("returns null for a typical food product with full data", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Biscuits sablés au beurre",
      category: "Biscuits",
      categoryId: "en:biscuits",
      nutriscoreGrade: "d",
      novaGroup: 4,
      energyKcal100g: 480,
      fat100g: 22,
      sugars100g: 28,
      salt100g: 0.8,
      proteins100g: 6,
    }));
    expect(result).toBeNull();
  });

  it("returns null for a product whose name contains 'pain' but is specific", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Pain de mie complet",
      category: "Pains de mie",
    }));
    expect(result).toBeNull();
  });

  // ── Priority: water checked before alcohol ─────────────────

  it("water exclusion takes priority over other checks", () => {
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Eau minérale",
      category: "Boissons",
    }));
    expect(result).toBe("water" satisfies ScoreExclusionReason);
  });
});
