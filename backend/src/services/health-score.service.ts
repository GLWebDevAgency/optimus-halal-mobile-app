/**
 * Naqiy Health Score V2 — 5-axis nutritional scoring formula.
 *
 * Pure synchronous service — no DB, no Redis, no side effects.
 * All data must be pre-fetched by the caller (scan router).
 *
 * Axes:
 *   1. Profil Nutritionnel  (40 pts) — NutriScore 2024 recalcule ou grade OFF fallback
 *   2. Risque Additifs      (25 pts) — 4-tier toxicity + EFSA/ADI/banned modulators
 *   3. Transformation NOVA  (15 pts) — NOVA group 1-4 + heuristique
 *   4. Completude Donnees   (10 pts) — data completeness enrichie
 *   5. Ajustement Profil    ([-10, +10]) — bonus/malus par profil utilisateur
 *
 * Scientific basis:
 *   - NutriScore 2024: Merz et al., Nature Food 2024
 *   - NOVA: Monteiro et al., Public Health Nutrition 2019
 *   - Additives: EFSA opinions + IARC classifications
 *   - Profils: EFSA DRV 2017, ANSES 2021, ESPEN 2014, ISSN 2017
 *
 * Changes V1 → V2:
 *   - Axe nutrition: 50→40 pts, recalcul NutriScore propre avec interpolation
 *   - Axe profil: NOUVEAU, exploite riskPregnant/riskChildren de la DB additives
 *   - Cap additif: high_concern present → score final max 49
 *   - Heuristique NOVA quand absent
 *   - Confiance 4 niveaux (ajout "very_low")
 */

import {
  computeNutriScore,
  extractNutrimentsFromOff,
  type NutrimentInput,
  type NutriScoreGrade,
  type NutriScoreResult,
} from "./nutriscore.service.js";

// ── Nutrient Anomaly Detection ──────────────────────────────

export type AnomalySeverity = "impossible" | "suspicious";

export interface NutrientAnomaly {
  field: string;
  value: number;
  threshold: number;
  severity: AnomalySeverity;
  message: string;
}

/** Categories where salt > 10g/100g is expected (soy sauce, bouillon, etc.) */
const SALT_EXEMPT_RE = /sauce|condiment|bouillon|assaisonnement|soja|soy|miso|anchoi|olive|câpre|sel\b|salt\b|seasoning/i;

/**
 * Detect anomalies in nutritional data.
 * Two layers:
 *   1. Standard nutriments validation (bounds + cross-checks)
 *   2. OFF NutriScore component validation (catches ingredient-estimated errors)
 */
export function detectNutrientAnomalies(
  nutriments: Record<string, number | string> | null | undefined,
  categories: string | null | undefined,
  offNutriscoreComponents?: { id: string; value: number }[],
): NutrientAnomaly[] {
  const anomalies: NutrientAnomaly[] = [];

  const num = (obj: Record<string, unknown>, key: string): number | null => {
    const v = obj[key];
    if (v == null || v === "") return null;
    const n = typeof v === "string" ? parseFloat(v as string) : v as number;
    return isNaN(n) ? null : n;
  };

  // Build a merged nutrient map: standard nutriments + OFF NutriScore components
  const merged: Record<string, number> = {};
  if (nutriments) {
    for (const key of ["salt_100g", "sodium_100g", "energy_100g", "fat_100g",
      "saturated_fat_100g", "sugars_100g", "proteins_100g", "fiber_100g",
      "carbohydrates_100g"]) {
      const v = num(nutriments as Record<string, unknown>, key);
      if (v != null) merged[key] = v;
    }
  }
  // OFF NutriScore components (may have values even when standard nutriments are null)
  if (offNutriscoreComponents) {
    for (const comp of offNutriscoreComponents) {
      const key = comp.id === "salt" ? "salt_100g"
        : comp.id === "sodium" ? "sodium_100g"
        : comp.id === "energy" ? "energy_100g"
        : comp.id === "saturated_fat" ? "saturated_fat_100g"
        : comp.id === "sugars" ? "sugars_100g"
        : comp.id === "fiber" ? "fiber_100g"
        : comp.id === "proteins" ? "proteins_100g"
        : comp.id === "fruits_vegetables_legumes" ? null
        : null;
      if (key && merged[key] == null) merged[key] = comp.value;
    }
  }

  if (Object.keys(merged).length === 0) return anomalies;

  // --- Layer 1: Absolute physical impossibilities ---

  const IMPOSSIBLE: [string, number, string][] = [
    ["energy_100g", 4200, "Energie > 4200 kJ (limite physique)"],
    ["fat_100g", 100, "Graisses > 100g (impossible)"],
    ["saturated_fat_100g", 100, "Graisses saturees > 100g (impossible)"],
    ["sugars_100g", 100, "Sucres > 100g (impossible)"],
    ["proteins_100g", 100, "Proteines > 100g (impossible)"],
    ["salt_100g", 50, "Sel > 50g (impossible pour un aliment)"],
  ];

  for (const [field, limit, msg] of IMPOSSIBLE) {
    const v = merged[field];
    if (v != null && v > limit) {
      anomalies.push({ field, value: v, threshold: limit, severity: "impossible", message: msg });
    }
  }

  // --- Layer 2: Cross-validation ---

  const fat = merged.fat_100g;
  const satFat = merged.saturated_fat_100g;
  if (fat != null && satFat != null && satFat > fat + 0.5) {
    anomalies.push({
      field: "saturated_fat_100g", value: satFat, threshold: fat,
      severity: "impossible",
      message: `Graisses saturees (${satFat}g) > graisses totales (${fat}g)`,
    });
  }

  const carbs = merged.carbohydrates_100g;
  const sugars = merged.sugars_100g;
  if (carbs != null && sugars != null && sugars > carbs + 0.5) {
    anomalies.push({
      field: "sugars_100g", value: sugars, threshold: carbs,
      severity: "impossible",
      message: `Sucres (${sugars}g) > glucides totaux (${carbs}g)`,
    });
  }

  // Macronutrient sum > 105g/100g
  const macroSum = (fat ?? 0) + (carbs ?? 0) + (merged.proteins_100g ?? 0);
  if (macroSum > 105 && fat != null && carbs != null) {
    anomalies.push({
      field: "macro_sum", value: macroSum, threshold: 105,
      severity: "suspicious",
      message: `Somme macronutriments = ${macroSum.toFixed(1)}g/100g (> 105g)`,
    });
  }

  // --- Layer 3: Category-aware suspicious thresholds ---

  const salt = merged.salt_100g ?? (merged.sodium_100g != null ? merged.sodium_100g * 2.5 : null);
  const isSaltExempt = categories ? SALT_EXEMPT_RE.test(categories) : false;
  if (salt != null && salt > 10 && !isSaltExempt) {
    anomalies.push({
      field: "salt_100g", value: salt, threshold: 10,
      severity: "suspicious",
      message: `Sel = ${salt.toFixed(1)}g/100g suspect pour cette categorie`,
    });
  }

  return anomalies;
}

// ── Types ───────────────────────────────────────────────────

export type ToxicityLevel = "safe" | "low_concern" | "moderate_concern" | "high_concern";
export type EfsaStatus = "approved" | "under_review" | "restricted" | "banned";

export type UserNutritionProfile =
  | "standard"
  | "pregnant"
  | "child"
  | "athlete"
  | "elderly";

export interface AdditiveForScore {
  code: string;
  toxicityLevel: ToxicityLevel;
  efsaStatus: EfsaStatus;
  adiMgPerKg: number | null;
  bannedCountries: string[] | null;
  /** From DB additives.risk_pregnant */
  riskPregnant?: boolean;
  /** From DB additives.risk_children */
  riskChildren?: boolean;
}

export interface HealthScoreInput {
  /** OFF nutriscore_grade (A-E) — used as fallback if nutriments insufficient */
  nutriscoreGrade: string | null;
  /** OFF nova_group (1-4) */
  novaGroup: number | null;
  /** Additives from DB lookup */
  additives: AdditiveForScore[];
  /** Data completeness flags */
  hasIngredientsList: boolean;
  hasNutritionFacts: boolean;
  hasAllergens: boolean;
  hasOrigin: boolean;
  /** OFF raw nutriments record — NEW in V2 for NutriScore recalculation */
  nutriments?: Record<string, number | string> | null;
  /** OFF product categories — NEW in V2 for NutriScore category detection */
  categories?: string | null;
  /** User nutrition profile — NEW in V2 */
  profile?: UserNutritionProfile;
  /** AI-estimated NOVA — fallback if OFF nova_group missing */
  aiNovaEstimate?: number | null;
  /** Number of detected additives (for NOVA heuristic) */
  additiveCount?: number;
  /** Number of ingredients (for NOVA heuristic) */
  ingredientCount?: number;
  /** AI-detected flags */
  containsAlcohol?: boolean;
  /** OFF nutriscore_data.components (negative + positive) for anomaly detection */
  offNutriscoreComponents?: { id: string; value: number }[];
}

export interface AxisScore {
  score: number;
  max: number;
}

export interface ProfileAdjustment {
  delta: number;
  reasons: string[];
}

export interface HealthScoreResult {
  score: number | null;
  label: "excellent" | "good" | "mediocre" | "poor" | "very_poor" | null;
  axes: {
    nutrition: (AxisScore & { grade?: NutriScoreGrade; source: "computed" | "off_grade" | "none" }) | null;
    additives: AxisScore & { penalties: string[] };
    processing: (AxisScore & { source: "off" | "ai" | "heuristic" }) | null;
    transparency: AxisScore;
    profile: ProfileAdjustment;
  };
  dataConfidence: "high" | "medium" | "low" | "very_low";
  /** True if a high_concern additive capped the score at 49 */
  cappedByAdditive: boolean;
  /** NutriScore detail if computed */
  nutriScoreDetail?: NutriScoreResult;
  /** Detected anomalies in OFF nutritional data */
  nutrientAnomalies?: NutrientAnomaly[];
}

// ── Axe 1: Profil Nutritionnel (40 pts) ─────────────────────

/** Interpolation table: grade → base points on 40-point scale */
const GRADE_BASE_POINTS: Record<NutriScoreGrade, number> = {
  a: 40,
  b: 33,
  c: 22,
  d: 10,
  e: 0,
};

/**
 * Interpolate within a grade for more granular scoring.
 * Grade C spans raw 3-10 (8 points) → maps to 22-31 Naqiy points.
 */
function interpolateNutritionPoints(raw: number, grade: NutriScoreGrade): number {
  switch (grade) {
    case "a": return 40; // raw <= 0 → always 40
    case "b": return 33 + (2 - Math.max(1, Math.min(2, raw))) * 3.5; // raw 1-2 → 33-36.5
    case "c": return 22 + (10 - Math.max(3, Math.min(10, raw))) * 1.375; // raw 3-10 → 22-31.6
    case "d": return 10 + (18 - Math.max(11, Math.min(18, raw))) * 1.5; // raw 11-18 → 10-20.5
    case "e": return Math.max(0, 10 - (Math.max(19, raw) - 19) * 0.3); // raw >= 19 → 0-10
  }
}

function computeNutritionAxis(
  nutriments: Record<string, number | string> | null | undefined,
  categories: string | null | undefined,
  offGrade: string | null,
): (AxisScore & { grade?: NutriScoreGrade; source: "computed" | "off_grade" | "none" }) | null {
  // Strategy 1: Compute NutriScore from raw nutriments
  if (nutriments && Object.keys(nutriments).length > 0) {
    const input = extractNutrimentsFromOff(nutriments);
    const result = computeNutriScore(input, categories);
    if (result) {
      const pts = Math.round(interpolateNutritionPoints(result.raw, result.grade));
      return { score: pts, max: 40, grade: result.grade, source: "computed" };
    }
  }

  // Strategy 2: Fallback to OFF grade
  if (offGrade) {
    const grade = offGrade.toLowerCase() as NutriScoreGrade;
    const basePts = GRADE_BASE_POINTS[grade];
    if (basePts !== undefined) {
      return { score: basePts, max: 40, grade, source: "off_grade" };
    }
  }

  return null;
}

// ── Axe 2: Risque Additifs (25 pts) ─────────────────────────

const TOXICITY_PENALTY: Record<ToxicityLevel, number> = {
  safe: 0,
  low_concern: 2,
  moderate_concern: 5,
  high_concern: 10,
};

function computeAdditivesAxis(
  adds: AdditiveForScore[],
): AxisScore & { penalties: string[]; hasHighConcern: boolean } {
  if (adds.length === 0) {
    return { score: 25, max: 25, penalties: [], hasHighConcern: false };
  }

  let totalPenalty = 0;
  const penalties: string[] = [];
  let hasHighConcern = false;

  for (const add of adds) {
    if (add.efsaStatus === "banned") {
      return { score: 0, max: 25, penalties: [`${add.code}: EFSA banned`], hasHighConcern: true };
    }

    if (add.toxicityLevel === "high_concern") hasHighConcern = true;

    let penalty = TOXICITY_PENALTY[add.toxicityLevel] ?? 0;

    if (add.efsaStatus === "restricted") {
      penalty = Math.round(penalty * 1.5);
      penalties.push(`${add.code}: EFSA restricted (x1.5)`);
    }
    if (add.adiMgPerKg != null && add.adiMgPerKg < 5) {
      penalty = Math.round(penalty * 1.3);
      penalties.push(`${add.code}: ADI < 5mg/kg (x1.3)`);
    }
    if (add.bannedCountries && add.bannedCountries.length >= 3) {
      penalty += 3;
      penalties.push(`${add.code}: banned in ${add.bannedCountries.length} countries (+3)`);
    }

    totalPenalty += penalty;
  }

  return { score: Math.max(0, 25 - totalPenalty), max: 25, penalties, hasHighConcern };
}

// ── Axe 3: Transformation NOVA (15 pts) ─────────────────────

// Linear 5-point steps aligned with Monteiro et al. (PHN 2019)
const NOVA_POINTS: Record<number, number> = {
  1: 15,  // Brut / non transforme
  2: 10,  // Ingredients culinaires de base
  3: 5,   // Aliments transformes
  4: 0,   // Ultra-transformes
};

/**
 * Heuristic NOVA estimation when OFF and AI both fail.
 * Based on additive count and product category.
 */
function estimateNovaHeuristic(
  additiveCount: number,
  ingredientCount: number,
  categories: string | null | undefined,
): number | null {
  if (additiveCount >= 5) return 4;
  if (additiveCount >= 3) return 4;

  const cats = (categories ?? "").toLowerCase();
  if (/snacks?|sodas?|confiserie|chips|bonbon|candy|energy.drink/.test(cats)) return 4;
  if (/conserve|fromage|cheese|pain.de.mie|surimi/.test(cats)) return 3;

  if (ingredientCount > 0 && ingredientCount <= 3 && additiveCount === 0) return 1;
  if (ingredientCount > 0 && ingredientCount <= 5 && additiveCount <= 1) return 2;

  return null;
}

function computeProcessingAxis(
  novaGroup: number | null,
  aiNovaEstimate: number | null | undefined,
  additiveCount: number,
  ingredientCount: number,
  categories: string | null | undefined,
): (AxisScore & { source: "off" | "ai" | "heuristic" }) | null {
  // Priority: OFF > AI > Heuristic
  if (novaGroup != null && novaGroup >= 1 && novaGroup <= 4) {
    return { score: NOVA_POINTS[novaGroup]!, max: 15, source: "off" };
  }
  if (aiNovaEstimate != null && aiNovaEstimate >= 1 && aiNovaEstimate <= 4) {
    return { score: NOVA_POINTS[aiNovaEstimate]!, max: 15, source: "ai" };
  }

  const heuristic = estimateNovaHeuristic(additiveCount, ingredientCount, categories);
  if (heuristic != null) {
    return { score: NOVA_POINTS[heuristic]!, max: 15, source: "heuristic" };
  }

  return null;
}

// ── Axe 4: Completude Donnees (10 pts) ──────────────────────

function computeTransparencyAxis(
  input: HealthScoreInput,
  nutritionComputed: boolean,
  novaAvailable: boolean,
): AxisScore {
  let score = 0;
  if (input.hasIngredientsList) score += 2;
  if (input.hasNutritionFacts) score += 3;
  if (input.hasAllergens) score += 1;
  if (input.hasOrigin) score += 1;
  if (nutritionComputed) score += 1.5;
  if (novaAvailable) score += 1.5;
  return { score: Math.min(10, Math.round(score)), max: 10 };
}

// ── Axe 5: Ajustement Profil ([-10, +10]) ───────────────────

function computeProfileAdjustment(
  profile: UserNutritionProfile,
  additives: AdditiveForScore[],
  nutriments: Record<string, number | string> | null | undefined,
  novaGroup: number | null,
  nutriScoreGrade: NutriScoreGrade | undefined,
): ProfileAdjustment {
  if (profile === "standard") return { delta: 0, reasons: [] };

  let delta = 0;
  const reasons: string[] = [];
  const n = nutriments ?? {};
  const num = (key: string): number | null => {
    const v = n[key];
    if (v == null || v === "") return null;
    const x = typeof v === "string" ? parseFloat(v) : v;
    return isNaN(x) ? null : x;
  };
  const sugars = num("sugars_100g");
  const proteins = num("proteins_100g");
  const fiber = num("fiber_100g");
  const salt = num("salt_100g") ?? (num("sodium_100g") != null ? (num("sodium_100g")! * 2.5) : null);

  switch (profile) {
    case "pregnant": {
      // Penalize risky additives for pregnancy
      for (const add of additives) {
        if (add.riskPregnant) {
          const pen = Math.min(3, 10 - Math.abs(delta)); // cap total at -10
          delta -= pen;
          reasons.push(`${add.code}: deconseille grossesse (-${pen})`);
        }
      }
      // NutriScore E → extra penalty (gestational diabetes risk)
      if (nutriScoreGrade === "e") {
        delta -= 2;
        reasons.push("NutriScore E: risque diabete gestationnel (-2)");
      }
      // High protein → slight bonus (iron-rich)
      if (proteins != null && proteins > 15) {
        delta += 1;
        reasons.push("Riche en proteines: +1");
      }
      break;
    }

    case "child": {
      // Penalize risky additives for children (Southampton Six etc.)
      for (const add of additives) {
        if (add.riskChildren) {
          const pen = Math.min(3, 10 - Math.abs(delta));
          delta -= pen;
          reasons.push(`${add.code}: deconseille enfants (-${pen})`);
        }
      }
      // High sugar penalty
      if (sugars != null && sugars > 20) {
        delta -= 3;
        reasons.push("Sucres > 20g/100g: -3 (OMS)");
      } else if (sugars != null && sugars > 15) {
        delta -= 1;
        reasons.push("Sucres > 15g/100g: -1");
      }
      // NOVA 4 extra penalty
      if (novaGroup === 4) {
        delta -= 2;
        reasons.push("Ultra-transforme (NOVA 4): -2");
      }
      // Calcium-rich bonus (dairy)
      if (proteins != null && proteins > 5 && fiber != null) {
        delta += 1;
        reasons.push("Source de calcium probable: +1");
      }
      break;
    }

    case "athlete": {
      // High protein bonus
      if (proteins != null && proteins > 15) {
        delta += 3;
        reasons.push("Proteines > 15g/100g: +3 (ISSN)");
      } else if (proteins != null && proteins > 10) {
        delta += 1;
        reasons.push("Proteines > 10g/100g: +1");
      }
      // Sodium tolerance (athletes sweat more)
      if (salt != null && salt > 1.5) {
        delta += 1;
        reasons.push("Sodium eleve tolere (sudation): +1");
      }
      // Ultra-processed with many additives still penalized
      if (novaGroup === 4 && additives.length > 5) {
        delta -= 2;
        reasons.push("NOVA 4 + nombreux additifs: -2");
      }
      break;
    }

    case "elderly": {
      // Low protein penalty (sarcopenia risk)
      if (proteins != null && proteins < 5) {
        delta -= 2;
        reasons.push("Proteines < 5g: risque sarcopenie (-2)");
      }
      // High protein bonus
      if (proteins != null && proteins > 15) {
        delta += 3;
        reasons.push("Proteines > 15g: prevention denutrition (+3)");
      }
      // Fiber bonus
      if (fiber != null && fiber > 5) {
        delta += 2;
        reasons.push("Fibres > 5g: transit/microbiome (+2)");
      }
      // High sodium penalty (hypertension)
      if (salt != null && salt > 2) {
        delta -= 2;
        reasons.push("Sel > 2g: risque cardiovasculaire (-2)");
      }
      // High concern additives extra penalty (vulnerability)
      for (const add of additives) {
        if (add.toxicityLevel === "high_concern") {
          delta -= 1;
          reasons.push(`${add.code}: vulnerabilite accrue (-1)`);
        }
      }
      break;
    }
  }

  // Clamp to [-10, +10]
  delta = Math.max(-10, Math.min(10, delta));

  return { delta, reasons };
}

// ── Score Label ─────────────────────────────────────────────

function getLabel(score: number): HealthScoreResult["label"] {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "mediocre";
  if (score >= 20) return "poor";
  return "very_poor";
}

// ── Data Confidence ─────────────────────────────────────────

function getDataConfidence(
  nutrition: AxisScore | null,
  nutritionSource: "computed" | "off_grade" | "none",
  processing: AxisScore | null,
  processingSource: string | null,
  additivesCount: number,
): HealthScoreResult["dataConfidence"] {
  const hasNutrition = nutrition != null;
  const hasProcessing = processing != null;

  if (hasNutrition && nutritionSource === "computed" && hasProcessing && processingSource === "off") {
    return "high";
  }
  if (hasNutrition && hasProcessing) return "high";
  if (hasNutrition || hasProcessing) return "medium";
  if (additivesCount > 0) return "low";
  return "very_low";
}

// ── Score Exclusion (GradeForbiddenReason pattern) ──────────

export type ScoreExclusionReason =
  | "missing_nutrition_data"
  | "not_food"
  | "too_generic"
  | "alcohol"
  | "baby_food"
  | "water";

/** Category patterns for products that should not receive a health score */
const NOT_FOOD_RE = /\b(cosm[eé]tique|cosmetic|supplement|compl[eé]ment alimentaire|dietary supplement|m[eé]dicament|medicine|detergent|savon|soap|shampo|dentifrice|toothpaste)\b/i;
const ALCOHOL_RE = /\b(bi[eè]re|beer|vin\b|wine|vodka|whisky|whiskey|rhum|rum|gin\b|cognac|champagne|cidre|cider|aperitif|ap[eé]ritif|liqueur|alcool|alcohol|sake|sak[eé])\b/i;
const BABY_FOOD_RE = /\b(b[eé]b[eé]|baby|infant|nourrisson|lait infantile|infant formula|petit pot|baby food)\b/i;
const WATER_RE = /^(eau|water|eau min[eé]rale|mineral water|eau de source|spring water|eau gazeuse|sparkling water)$/i;
const TOO_GENERIC_RE = /^(fruits?|l[eé]gumes?|vegetables?|viande|meat|poisson|fish|pain|bread|riz|rice|p[aâ]tes|pasta|farine|flour)$/i;

/**
 * Checks if a product should be excluded from health scoring.
 * Returns the exclusion reason, or null if the product can be scored.
 *
 * Inspired by Yuka GradeForbiddenReason (8 exclusion types).
 */
export function checkScoreExclusion(product: {
  name: string | null;
  category: string | null;
  categoryId: string | null;
  labelsTags: string[] | null;
  novaGroup: number | null;
  nutriscoreGrade: string | null;
  energyKcal100g: number | null;
  fat100g: number | null;
  sugars100g: number | null;
  salt100g: number | null;
  proteins100g: number | null;
}): ScoreExclusionReason | null {
  const searchText = [product.name, product.category, product.categoryId]
    .filter(Boolean)
    .join(" ");

  // Water — always A in NutriScore, but not meaningful as health score
  if (WATER_RE.test(product.name?.trim() ?? "")
    || WATER_RE.test(product.category?.trim() ?? "")) {
    return "water";
  }

  // Alcohol — legal & ethical reasons, not a "health" food
  if (ALCOHOL_RE.test(searchText)) return "alcohol";

  // Not food (cosmetics, supplements, detergents)
  if (NOT_FOOD_RE.test(searchText)) return "not_food";

  // Baby food — different nutritional standards (Codex STAN 72-1981)
  if (BABY_FOOD_RE.test(searchText)) return "baby_food";

  // Too generic (no real product data)
  if (TOO_GENERIC_RE.test(product.name?.trim() ?? "")) return "too_generic";

  // Missing nutrition data — need at least 3 nutrient values
  const hasEnoughData = [
    product.energyKcal100g,
    product.fat100g,
    product.sugars100g,
    product.salt100g,
    product.proteins100g,
  ].filter(v => v != null).length >= 3;

  if (!hasEnoughData && !product.nutriscoreGrade && !product.novaGroup) {
    return "missing_nutrition_data";
  }

  return null;
}

// ── Public API ──────────────────────────────────────────────

export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  const profile = input.profile ?? "standard";

  // --- Anomaly detection: validate OFF nutritional data ---
  const nutrientAnomalies = detectNutrientAnomalies(
    input.nutriments,
    input.categories,
    input.offNutriscoreComponents,
  );
  const hasImpossibleAnomaly = nutrientAnomalies.some(a => a.severity === "impossible");
  const hasSuspiciousAnomaly = nutrientAnomalies.length > 0;

  // If OFF grade relies on corrupted data, discard it
  // Condition: anomalies detected AND standard nutriments are absent/insufficient
  // (meaning OFF computed the grade from unreliable ingredient estimates)
  const standardNutrientsAvailable = input.nutriments
    && typeof input.nutriments === "object"
    && ["energy_100g", "fat_100g", "salt_100g", "proteins_100g"]
        .filter(k => {
          const v = input.nutriments![k];
          return v != null && v !== "";
        }).length >= 3;

  const offGradeReliable = !hasSuspiciousAnomaly || standardNutrientsAvailable;
  const effectiveOffGrade = offGradeReliable ? input.nutriscoreGrade : null;

  // Axe 1: Nutrition (40 pts) — recalcul propre > grade OFF > null
  const nutritionAxis = computeNutritionAxis(
    hasImpossibleAnomaly ? null : input.nutriments,
    input.categories,
    effectiveOffGrade,
  );

  // Get NutriScore detail for the result
  let nutriScoreDetail: NutriScoreResult | undefined;
  if (input.nutriments && Object.keys(input.nutriments).length > 0 && !hasImpossibleAnomaly) {
    const nutrInput = extractNutrimentsFromOff(input.nutriments);
    nutriScoreDetail = computeNutriScore(nutrInput, input.categories) ?? undefined;
  }

  // Axe 2: Additives (25 pts)
  const additivesAxis = computeAdditivesAxis(input.additives);

  // Axe 3: NOVA Processing (15 pts) with heuristic fallback
  const processingAxis = computeProcessingAxis(
    input.novaGroup,
    input.aiNovaEstimate,
    input.additiveCount ?? input.additives.length,
    input.ingredientCount ?? 0,
    input.categories,
  );

  // Axe 4: Transparency (10 pts)
  const transparencyAxis = computeTransparencyAxis(
    input,
    nutritionAxis?.source === "computed",
    processingAxis != null,
  );

  // Axe 5: Profile adjustment ([-10, +10])
  const profileAdjustment = computeProfileAdjustment(
    profile,
    input.additives,
    input.nutriments,
    input.novaGroup ?? input.aiNovaEstimate ?? null,
    nutriScoreDetail?.grade ?? (nutritionAxis?.grade as NutriScoreGrade | undefined),
  );

  // Minimum data: at least 2 of 3 primary axes
  const primaryAvailable = [nutritionAxis, additivesAxis, processingAxis]
    .filter(a => a != null).length;

  if (primaryAvailable < 2) {
    return {
      score: null,
      label: null,
      axes: {
        nutrition: nutritionAxis ? { ...nutritionAxis } : null,
        additives: additivesAxis,
        processing: processingAxis,
        transparency: transparencyAxis,
        profile: profileAdjustment,
      },
      dataConfidence: "very_low",
      cappedByAdditive: false,
      nutriScoreDetail,
      ...(nutrientAnomalies.length > 0 && { nutrientAnomalies }),
    };
  }

  // Sum available axes
  let totalScore = 0;
  let totalMax = 0;

  if (nutritionAxis) { totalScore += nutritionAxis.score; totalMax += nutritionAxis.max; }
  totalScore += additivesAxis.score; totalMax += additivesAxis.max;
  if (processingAxis) { totalScore += processingAxis.score; totalMax += processingAxis.max; }
  totalScore += transparencyAxis.score; totalMax += transparencyAxis.max;

  // Normalize to 0-90 (base without profile)
  let normalized = totalMax > 0 ? Math.round((totalScore / totalMax) * 90) : 0;

  // Apply profile delta
  normalized += profileAdjustment.delta;

  // Cap: high_concern additive → max 49
  let cappedByAdditive = false;
  if (additivesAxis.hasHighConcern && normalized > 49) {
    normalized = 49;
    cappedByAdditive = true;
  }

  // Final clamp [0, 100]
  normalized = Math.max(0, Math.min(100, normalized));

  // Compute base confidence, then degrade if anomalies detected
  let dataConfidence = getDataConfidence(
    nutritionAxis,
    nutritionAxis?.source ?? "none",
    processingAxis,
    processingAxis?.source ?? null,
    input.additives.length,
  );
  if (hasSuspiciousAnomaly && dataConfidence === "high") dataConfidence = "medium";
  if (hasImpossibleAnomaly && (dataConfidence === "high" || dataConfidence === "medium")) dataConfidence = "low";

  return {
    score: normalized,
    label: getLabel(normalized),
    axes: {
      nutrition: nutritionAxis ? { ...nutritionAxis } : null,
      additives: additivesAxis,
      processing: processingAxis,
      transparency: transparencyAxis,
      profile: profileAdjustment,
    },
    dataConfidence,
    cappedByAdditive,
    nutriScoreDetail,
    ...(nutrientAnomalies.length > 0 && { nutrientAnomalies }),
  };
}
