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

describe("computeHealthScore V2 — complete product", () => {
  it("grade A / NOVA 1 / no additives / full data → 89 (OFF fallback ceiling)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
    }));
    // V2: nutrition=40/40, additives=25/25, processing=15/15, transparency=9/10
    // normalized = (89/90)*90 = 89
    expect(result.score).toBe(89);
    expect(result.label).toBe("excellent");
    expect(result.dataConfidence).toBe("high");
    expect(result.axes.nutrition?.source).toBe("off_grade");
    expect(result.cappedByAdditive).toBe(false);
  });

  it("grade E / NOVA 4 / no data → 27", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      novaGroup: 4,
      hasIngredientsList: false,
      hasNutritionFacts: false,
      hasAllergens: false,
      hasOrigin: false,
    }));
    // nutrition=0/40, additives=25/25, processing=0/15, transparency=2/10
    expect(result.score).toBe(27);
    expect(result.label).toBe("poor");
  });

  it("grade B / NOVA 2 / full data → 77", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "b",
      novaGroup: 2,
    }));
    // nutrition=33/40, additives=25/25, processing=10/15, transparency=9/10
    expect(result.score).toBe(77);
    expect(result.label).toBe("good");
  });

  it.each([
    ["a", 40],
    ["b", 33],
    ["c", 22],
    ["d", 10],
    ["e", 0],
  ] as const)("OFF grade %s → %i/40 nutrition points", (grade, expected) => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: grade }));
    expect(result.axes.nutrition?.score).toBe(expected);
    expect(result.axes.nutrition?.max).toBe(40);
    expect(result.axes.nutrition?.source).toBe("off_grade");
  });
});

// ── Computed NutriScore ──────────────────────────────────────

describe("computeHealthScore V2 — computed NutriScore", () => {
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
    expect(result.axes.nutrition?.score).toBe(40);
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
    expect(result.axes.nutrition?.score).toBe(22);
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
    // Interpolation: raw >= 19 → decreasing from 10 toward 0
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
    // NutriScore may or may not compute (depends on having 3/4 N-nutrients)
    // But nutriScoreDetail should exist if computed
    if (result.axes.nutrition?.source === "computed") {
      expect(result.nutriScoreDetail).toBeDefined();
    }
  });
});

// ── Insufficient Data ────────────────────────────────────────

describe("computeHealthScore V2 — insufficient data", () => {
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
    // nutrition=33/40, additives=25/25, transparency=7/10 (no NOVA bonus)
    // total=65/75, normalized=(65/75)*90=78
    expect(result.score).toBe(78);
    expect(result.label).toBe("good");
    expect(result.dataConfidence).toBe("medium");
    expect(result.axes.processing).toBeNull();
  });

  it("returns valid score when NOVA + additives available (no nutriscore)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: 1,
    }));
    // additives=25/25, processing=15/15, transparency=9/10 (NOVA available)
    // total=49/50, normalized=(49/50)*90=88
    expect(result.score).toBe(88);
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

// ── Additives Axis (25 pts) ──────────────────────────────────

describe("computeHealthScore V2 — additives penalties", () => {
  it("zero additives = 25/25", () => {
    const result = computeHealthScore(makeInput({ additives: [] }));
    expect(result.axes.additives.score).toBe(25);
    expect(result.axes.additives.penalties).toEqual([]);
  });

  it("EFSA banned additive → axe = 0 immediately", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({ code: "E123", efsaStatus: "banned" })],
    }));
    expect(result.axes.additives.score).toBe(0);
    expect(result.axes.additives.penalties).toContain("E123: EFSA banned");
  });

  it("high_concern additive penalizes 10 points", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({ code: "E621", toxicityLevel: "high_concern" })],
    }));
    expect(result.axes.additives.score).toBe(15); // 25 - 10
  });

  it("moderate_concern additive penalizes 5 points", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({ code: "E471", toxicityLevel: "moderate_concern" })],
    }));
    expect(result.axes.additives.score).toBe(20); // 25 - 5
  });

  it("EFSA restricted multiplier (x1.5)", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({
        code: "E171",
        toxicityLevel: "moderate_concern",
        efsaStatus: "restricted",
      })],
    }));
    // 5 * 1.5 = 7.5 → round → 8 → 25 - 8 = 17
    expect(result.axes.additives.score).toBe(17);
    expect(result.axes.additives.penalties).toContain("E171: EFSA restricted (x1.5)");
  });

  it("ADI < 5mg/kg multiplier (x1.3)", () => {
    const result = computeHealthScore(makeInput({
      additives: [makeAdditive({
        code: "E951",
        toxicityLevel: "low_concern",
        adiMgPerKg: 4,
      })],
    }));
    // 2 * 1.3 = 2.6 → round → 3 → 25 - 3 = 22
    expect(result.axes.additives.score).toBe(22);
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
    // 2 + 3 = 5 → 25 - 5 = 20
    expect(result.axes.additives.score).toBe(20);
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
    // 10 * 1.5 = 15 → round → 15 * 1.3 = 19.5 → round → 20 + 3 = 23 → 25-23=2
    expect(result.axes.additives.score).toBe(2);
  });

  it("multiple additives accumulate penalties", () => {
    const result = computeHealthScore(makeInput({
      additives: [
        makeAdditive({ code: "E621", toxicityLevel: "high_concern" }),     // -10
        makeAdditive({ code: "E471", toxicityLevel: "moderate_concern" }), // -5
        makeAdditive({ code: "E330", toxicityLevel: "low_concern" }),      // -2
      ],
    }));
    expect(result.axes.additives.score).toBe(8); // 25 - 17
  });

  it("penalties clamped to 0 (never negative)", () => {
    const result = computeHealthScore(makeInput({
      additives: [
        makeAdditive({ code: "E1", toxicityLevel: "high_concern" }), // -10
        makeAdditive({ code: "E2", toxicityLevel: "high_concern" }), // -10
        makeAdditive({ code: "E3", toxicityLevel: "high_concern" }), // -10
      ],
    }));
    expect(result.axes.additives.score).toBe(0);
  });
});

// ── NOVA Processing Axis (15 pts) ────────────────────────────

describe("computeHealthScore V2 — NOVA processing", () => {
  it.each([
    [1, 15],
    [2, 10],
    [3, 5],
    [4, 0],
  ])("NOVA %i → %i points", (nova, expected) => {
    const result = computeHealthScore(makeInput({ novaGroup: nova }));
    expect(result.axes.processing?.score).toBe(expected);
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
    expect(result.axes.processing?.score).toBe(5);
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
    expect(result.axes.processing?.score).toBe(15);
    expect(result.axes.processing?.source).toBe("heuristic");
  });

  it("OFF NOVA takes priority over AI estimate", () => {
    const result = computeHealthScore(makeInput({
      novaGroup: 1,
      aiNovaEstimate: 4,
    }));
    expect(result.axes.processing?.score).toBe(15); // NOVA 1, not 4
    expect(result.axes.processing?.source).toBe("off");
  });
});

// ── Transparency Axis (10 pts) ───────────────────────────────

describe("computeHealthScore V2 — transparency", () => {
  it("all data + computed NutriScore + NOVA → 10/10", () => {
    const result = computeHealthScore(makeInput({
      novaGroup: 2,
      nutriments: {
        energy_100g: 400,
        sugars_100g: 3,
        saturated_fat_100g: 1,
        sodium_100g: 0.1,
        fiber_100g: 5,
        proteins_100g: 10,
      },
    }));
    // 2+3+1+1+1.5(computed)+1.5(NOVA) = 10
    expect(result.axes.transparency).toEqual({ score: 10, max: 10 });
  });

  it("all data + OFF grade only (no computed) → 9/10", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
    }));
    // 2+3+1+1+0(not computed)+1.5(NOVA) = 8.5 → 9
    expect(result.axes.transparency.score).toBe(9);
  });

  it("all data + no NOVA → 7/10", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: null,
    }));
    // 2+3+1+1+0+0 = 7
    expect(result.axes.transparency.score).toBe(7);
  });

  it("no data flags but NOVA present → 2/10", () => {
    const result = computeHealthScore(makeInput({
      hasIngredientsList: false,
      hasNutritionFacts: false,
      hasAllergens: false,
      hasOrigin: false,
    }));
    // 0+0+0+0+0+1.5(NOVA) = 1.5 → 2
    expect(result.axes.transparency.score).toBe(2);
  });

  it("partial data: ingredients + nutrition only → 7/10", () => {
    const result = computeHealthScore(makeInput({
      hasIngredientsList: true,
      hasNutritionFacts: true,
      hasAllergens: false,
      hasOrigin: false,
    }));
    // 2+3+0+0+0+1.5(NOVA from default novaGroup=2) = 6.5 → 7
    expect(result.axes.transparency.score).toBe(7);
  });
});

// ── Profile Adjustments (V2 NEW) ─────────────────────────────

describe("computeHealthScore V2 — profile adjustments", () => {
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
    // Athlete with everything good — many bonuses
    const result = computeHealthScore(makeInput({
      profile: "athlete",
      nutriments: { proteins_100g: 50, salt_100g: 5, energy_100g: 2000, sugars_100g: 2, saturated_fat_100g: 3, sodium_100g: 2 },
    }));
    expect(result.axes.profile.delta).toBeLessThanOrEqual(10);
    expect(result.axes.profile.delta).toBeGreaterThanOrEqual(-10);
  });
});

// ── High Concern Additive Cap (V2 NEW) ───────────────────────

describe("computeHealthScore V2 — high concern cap", () => {
  it("caps score at 49 when high_concern additive present", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      additives: [makeAdditive({ code: "E621", toxicityLevel: "high_concern" })],
    }));
    // Without cap, score would be ~77. With cap: 49
    expect(result.score).toBe(49);
    expect(result.cappedByAdditive).toBe(true);
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

  it("banned additive triggers cap (banned implies high concern)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: 1,
      additives: [makeAdditive({ code: "E123", efsaStatus: "banned" })],
    }));
    // EFSA banned sets hasHighConcern via the banned check
    // Actually banned returns early with score=0 and hasHighConcern=true
    expect(result.cappedByAdditive).toBe(true);
  });

  it("score already below 49 is not affected by cap", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      novaGroup: 4,
      additives: [makeAdditive({ code: "E621", toxicityLevel: "high_concern" })],
      hasIngredientsList: false,
      hasNutritionFacts: false,
      hasAllergens: false,
      hasOrigin: false,
    }));
    // Score would be ~20 without cap
    expect(result.score!).toBeLessThan(49);
    expect(result.cappedByAdditive).toBe(false); // not capped because already below
  });
});

// ── Labels ───────────────────────────────────────────────────

describe("computeHealthScore V2 — labels", () => {
  it("grade A / NOVA 1 → excellent", () => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: "a", novaGroup: 1 }));
    expect(result.label).toBe("excellent");
  });

  it("grade B / NOVA 2 → good", () => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: "b", novaGroup: 2 }));
    expect(result.label).toBe("good");
  });

  it("grade D / NOVA 3 → mediocre", () => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: "d", novaGroup: 3 }));
    // nutrition=10/40, processing=5/15, additives=25/25, transparency=9/10
    // total=49/90, normalized=(49/90)*90=49
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

describe("computeHealthScore V2 — data confidence", () => {
  it("nutrition + processing → high", () => {
    const result = computeHealthScore(makeInput({ nutriscoreGrade: "a", novaGroup: 1 }));
    expect(result.dataConfidence).toBe("high");
  });

  it("computed NutriScore + OFF NOVA → high", () => {
    const result = computeHealthScore(makeInput({
      novaGroup: 2,
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

describe("computeHealthScore V2 — proportional scoring when axis absent", () => {
  it("NOVA absent: score proportional to (nutrition + additives + transparency)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "a",
      novaGroup: null,
    }));
    // nutrition=40/40, additives=25/25, transparency=7/10
    // total=72/75, normalized=(72/75)*90=86
    expect(result.score).toBe(86);
  });

  it("nutriscore absent: score proportional to (additives + processing + transparency)", () => {
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: null,
      novaGroup: 1,
    }));
    // additives=25/25, processing=15/15, transparency=9/10
    // total=49/50, normalized=(49/50)*90=88
    expect(result.score).toBe(88);
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

describe("computeHealthScore V2 — result structure", () => {
  it("includes all V2 fields in result", () => {
    const result = computeHealthScore(makeInput());
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("label");
    expect(result).toHaveProperty("axes");
    expect(result).toHaveProperty("dataConfidence");
    expect(result).toHaveProperty("cappedByAdditive");
    expect(result.axes).toHaveProperty("nutrition");
    expect(result.axes).toHaveProperty("additives");
    expect(result.axes).toHaveProperty("processing");
    expect(result.axes).toHaveProperty("transparency");
    expect(result.axes).toHaveProperty("profile");
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
    // Simulates the sardines case: standard nutriments null but OFF computed from estimates
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

describe("computeHealthScore V2 — nutrient anomaly handling", () => {
  it("sardines case: OFF grade E discarded when nutriscore components have suspicious salt", () => {
    // Sardines with OFF grade E (from bad salt data) but no standard nutriments
    const result = computeHealthScore(makeInput({
      nutriscoreGrade: "e",
      novaGroup: 3,
      nutriments: {},  // standard nutriments absent
      offNutriscoreComponents: [
        { id: "energy", value: 981 },
        { id: "saturated_fat", value: 3.73 },
        { id: "sugars", value: 0 },
        { id: "salt", value: 12.68 },  // suspicious: 12.68g for sardines
      ],
      categories: "Sardines en conserve",
    }));
    // OFF grade "e" should be discarded because:
    // 1. Suspicious salt anomaly detected
    // 2. Standard nutriments are absent (grade based on unreliable estimates)
    // Without nutrition axis, score is proportional to remaining axes
    expect(result.nutrientAnomalies).toBeDefined();
    expect(result.nutrientAnomalies!.length).toBeGreaterThan(0);
    expect(result.dataConfidence).not.toBe("high");
    // The score should NOT be 39 (the broken value)
    expect(result.axes.nutrition).toBeNull();
  });

  it("preserves OFF grade when standard nutriments are present despite suspicious values", () => {
    // If user/OFF provides actual nutriments with a suspicious value, we still compute
    // but degrade confidence — the data is at least "declared"
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
    // Standard nutriments are present (>= 3 key fields), so OFF grade is kept
    // But confidence is degraded due to suspicious salt
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
    // A product named "Eau" with an alcohol-sounding category should still be "water"
    const result = checkScoreExclusion(makeExclusionProduct({
      name: "Eau minérale",
      category: "Boissons",
    }));
    expect(result).toBe("water" satisfies ScoreExclusionReason);
  });
});
