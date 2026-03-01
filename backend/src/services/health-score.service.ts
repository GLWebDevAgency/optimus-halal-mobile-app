/**
 * Naqiy Health Score — 4-axis nutritional scoring formula (100 pts max).
 *
 * Pure synchronous service — no DB, no Redis, no side effects.
 * All data must be pre-fetched by the caller (scan router).
 *
 * Axes:
 *   1. Profil Nutritionnel  (50 pts) — NutriScore grade, non-linear mapping
 *   2. Risque Additifs      (25 pts) — 4-tier toxicity + EFSA/ADI/banned modulators
 *   3. Transformation NOVA  (15 pts) — NOVA group 1-4
 *   4. Transparence Données (10 pts) — data completeness from OFF
 *
 * Scientific basis:
 *   - NutriScore: Srour et al., BMJ 2019 (dose-response for chronic disease)
 *   - NOVA: Monteiro et al., Public Health Nutrition 2018
 *   - Additives: EFSA opinions + IARC classifications
 */

// ── Types ───────────────────────────────────────────────────

export type ToxicityLevel = "safe" | "low_concern" | "moderate_concern" | "high_concern";
export type EfsaStatus = "approved" | "under_review" | "restricted" | "banned";

export interface AdditiveForScore {
  code: string;
  toxicityLevel: ToxicityLevel;
  efsaStatus: EfsaStatus;
  adiMgPerKg: number | null;
  bannedCountries: string[] | null;
}

export interface HealthScoreInput {
  nutriscoreGrade: string | null;
  novaGroup: number | null;
  additives: AdditiveForScore[];
  hasIngredientsList: boolean;
  hasNutritionFacts: boolean;
  hasAllergens: boolean;
  hasOrigin: boolean;
}

export interface AxisScore {
  score: number;
  max: number;
}

export interface HealthScoreResult {
  score: number | null;
  label: "excellent" | "good" | "mediocre" | "poor" | "very_poor" | null;
  axes: {
    nutrition: AxisScore | null;
    additives: AxisScore & { penalties: string[] };
    processing: AxisScore | null;
    transparency: AxisScore;
  };
  dataConfidence: "high" | "medium" | "low";
}

// ── Axe 1: Profil Nutritionnel (50 pts) ─────────────────────

const NUTRISCORE_POINTS: Record<string, number> = {
  a: 50,
  b: 40,
  c: 25,
  d: 12,
  e: 0,
};

function computeNutritionAxis(grade: string | null): AxisScore | null {
  if (!grade) return null;
  const pts = NUTRISCORE_POINTS[grade.toLowerCase()];
  if (pts === undefined) return null;
  return { score: pts, max: 50 };
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
): AxisScore & { penalties: string[] } {
  if (adds.length === 0) {
    return { score: 25, max: 25, penalties: [] };
  }

  let totalPenalty = 0;
  const penalties: string[] = [];

  for (const add of adds) {
    // EFSA banned → instant zero
    if (add.efsaStatus === "banned") {
      return { score: 0, max: 25, penalties: [`${add.code}: EFSA banned`] };
    }

    let penalty = TOXICITY_PENALTY[add.toxicityLevel] ?? 0;

    // Modulators
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

  return { score: Math.max(0, 25 - totalPenalty), max: 25, penalties };
}

// ── Axe 3: Transformation NOVA (15 pts) ─────────────────────

const NOVA_POINTS: Record<number, number> = {
  1: 15,
  2: 12,
  3: 8,
  4: 2,
};

function computeProcessingAxis(novaGroup: number | null): AxisScore | null {
  if (novaGroup == null || novaGroup < 1 || novaGroup > 4) return null;
  return { score: NOVA_POINTS[novaGroup] ?? 0, max: 15 };
}

// ── Axe 4: Transparence Données (10 pts) ────────────────────

function computeTransparencyAxis(input: HealthScoreInput): AxisScore {
  let score = 0;
  if (input.hasIngredientsList) score += 3;
  if (input.hasNutritionFacts) score += 3;
  if (input.hasAllergens) score += 2;
  if (input.hasOrigin) score += 2;
  return { score, max: 10 };
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
  processing: AxisScore | null,
  additivesCount: number,
): "high" | "medium" | "low" {
  const hasNutrition = nutrition != null;
  const hasProcessing = processing != null;
  if (hasNutrition && hasProcessing) return "high";
  if (hasNutrition || hasProcessing) return "medium";
  return additivesCount > 0 ? "medium" : "low";
}

// ── Public API ──────────────────────────────────────────────

export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  const nutrition = computeNutritionAxis(input.nutriscoreGrade);
  const additivesAxis = computeAdditivesAxis(input.additives);
  const processing = computeProcessingAxis(input.novaGroup);
  const transparency = computeTransparencyAxis(input);

  // Minimum data threshold: at least 2 of 3 primary axes must be computable
  const primaryAxesAvailable = [nutrition, additivesAxis, processing]
    .filter((a) => a != null).length;

  if (primaryAxesAvailable < 2) {
    return {
      score: null,
      label: null,
      axes: { nutrition, additives: additivesAxis, processing, transparency },
      dataConfidence: "low",
    };
  }

  // Sum available axes and compute proportional score out of 100
  let totalScore = 0;
  let totalMax = 0;

  if (nutrition) { totalScore += nutrition.score; totalMax += nutrition.max; }
  totalScore += additivesAxis.score; totalMax += additivesAxis.max;
  if (processing) { totalScore += processing.score; totalMax += processing.max; }
  totalScore += transparency.score; totalMax += transparency.max;

  const normalized = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return {
    score: normalized,
    label: getLabel(normalized),
    axes: { nutrition, additives: additivesAxis, processing, transparency },
    dataConfidence: getDataConfidence(nutrition, processing, input.additives.length),
  };
}
