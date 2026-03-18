/**
 * NutrientValidator — Yuka-grade cross-validation of nutritional data.
 *
 * Inspired by Yuka's NutritionFactsVerifier (7 invariants).
 * Detects corrupt OFF data BEFORE it reaches the scoring engine.
 *
 * Philosophy: "في الشك أمسك" — when data is unreliable, say "I don't know"
 * rather than compute a misleading score.
 *
 * Three severity levels:
 *   - "impossible": physically impossible values (fat > 100g)
 *   - "suspicious": plausible but questionable (macro sum > 105g)
 *   - "critical": internal consistency failure (calorie formula mismatch)
 *     → triggers dataQualityFlag = "unreliable" → score = null
 *
 * @module services/nutrient-validator
 */

// ── Types ───────────────────────────────────────────────────

export type AnomalySeverity = "impossible" | "suspicious" | "critical";

export interface NutrientAnomaly {
  field: string;
  value: number;
  threshold: number;
  severity: AnomalySeverity;
  message: string;
}

export type DataQualityFlag = "valid" | "suspicious" | "unreliable";

export interface ValidationResult {
  flag: DataQualityFlag;
  anomalies: NutrientAnomaly[];
  reasons: string[];
}

// ── Constants ───────────────────────────────────────────────

/** Categories where salt > 10g/100g is expected */
const SALT_EXEMPT_RE =
  /sauce|condiment|bouillon|assaisonnement|soja|soy|miso|anchoi|olive|câpre|sel\b|salt\b|seasoning/i;

/** Calorie formula tolerance (Yuka uses 30%) */
const CALORIE_TOLERANCE = 0.30;

/** Minimum expected kcal to apply calorie formula check (skip near-zero products) */
const CALORIE_MIN_THRESHOLD = 10;

// ── Helpers ─────────────────────────────────────────────────

function num(
  obj: Record<string, unknown>,
  key: string,
): number | null {
  const v = obj[key];
  if (v == null || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}

// ── Main Validator ──────────────────────────────────────────

/**
 * Validate nutritional data with 7 Yuka-grade invariants + physical bounds.
 *
 * Returns a DataQualityFlag that determines whether the product
 * should get a health score ("valid"/"suspicious") or be forced
 * to score=null ("unreliable").
 */
export function validateNutrients(
  nutriments: Record<string, number | string> | null | undefined,
  categories: string | null | undefined,
  offNutriscoreComponents?: { id: string; value: number }[],
): ValidationResult {
  const anomalies: NutrientAnomaly[] = [];
  const reasons: string[] = [];

  // ── Merge nutriment sources ──

  const merged: Record<string, number> = {};

  if (nutriments) {
    for (const key of [
      "salt_100g", "sodium_100g", "energy_100g", "energy-kcal_100g",
      "fat_100g", "saturated-fat_100g", "saturated_fat_100g",
      "sugars_100g", "proteins_100g", "fiber_100g",
      "carbohydrates_100g", "trans-fat_100g",
    ]) {
      const v = num(nutriments as Record<string, unknown>, key);
      if (v != null) merged[key] = v;
    }
  }

  if (offNutriscoreComponents) {
    for (const comp of offNutriscoreComponents) {
      const key =
        comp.id === "salt" ? "salt_100g" :
        comp.id === "sodium" ? "sodium_100g" :
        comp.id === "energy" ? "energy_100g" :
        comp.id === "saturated_fat" ? "saturated-fat_100g" :
        comp.id === "sugars" ? "sugars_100g" :
        comp.id === "fiber" ? "fiber_100g" :
        comp.id === "proteins" ? "proteins_100g" :
        null;
      if (key && merged[key] == null) merged[key] = comp.value;
    }
  }

  if (Object.keys(merged).length === 0) {
    return { flag: "valid", anomalies: [], reasons: [] };
  }

  // ── Resolve nutrient aliases ──

  const fat = merged.fat_100g ?? null;
  const satFat = merged["saturated-fat_100g"] ?? merged.saturated_fat_100g ?? null;
  const transFat = merged["trans-fat_100g"] ?? null;
  const carbs = merged.carbohydrates_100g ?? null;
  const sugars = merged.sugars_100g ?? null;
  const fiber = merged.fiber_100g ?? null;
  const proteins = merged.proteins_100g ?? null;
  const salt = merged.salt_100g ?? (merged.sodium_100g != null ? merged.sodium_100g * 2.5 : null);
  const energyKcal = merged["energy-kcal_100g"] ?? (merged.energy_100g != null ? merged.energy_100g / 4.184 : null);

  // ════════════════════════════════════════════════════════════
  // LAYER 1: Physical impossibilities (severity: "impossible")
  // ════════════════════════════════════════════════════════════

  const IMPOSSIBLE: [string, number | null, number, string][] = [
    ["energy_100g", merged.energy_100g ?? null, 4200, "Energie > 4200 kJ (limite physique)"],
    ["fat_100g", fat, 100, "Graisses > 100g (impossible)"],
    ["saturated-fat_100g", satFat, 100, "Graisses saturees > 100g (impossible)"],
    ["sugars_100g", sugars, 100, "Sucres > 100g (impossible)"],
    ["proteins_100g", proteins, 100, "Proteines > 100g (impossible)"],
    ["salt_100g", salt, 50, "Sel > 50g (impossible pour un aliment)"],
  ];

  for (const [field, value, limit, msg] of IMPOSSIBLE) {
    if (value != null && value > limit) {
      anomalies.push({ field, value, threshold: limit, severity: "impossible", message: msg });
      reasons.push(field + "_impossible");
    }
  }

  // ════════════════════════════════════════════════════════════
  // LAYER 2: Yuka cross-validation invariants (severity varies)
  // ════════════════════════════════════════════════════════════

  // Invariant 1: Fat >= Saturated Fat
  if (fat != null && satFat != null && satFat > fat + 0.5) {
    anomalies.push({
      field: "saturated-fat_100g", value: satFat, threshold: fat,
      severity: "impossible",
      message: `Graisses saturees (${satFat}g) > graisses totales (${fat}g)`,
    });
    reasons.push("fat_satfat_inconsistency");
  }

  // Invariant 2: Fat >= Trans Fat
  if (fat != null && transFat != null && transFat > fat + 0.5) {
    anomalies.push({
      field: "trans-fat_100g", value: transFat, threshold: fat,
      severity: "impossible",
      message: `Graisses trans (${transFat}g) > graisses totales (${fat}g)`,
    });
    reasons.push("fat_transfat_inconsistency");
  }

  // Invariant 3: Fat >= Saturated + Trans
  if (fat != null && satFat != null && transFat != null && (satFat + transFat) > fat + 0.5) {
    anomalies.push({
      field: "fat_components_sum", value: satFat + transFat, threshold: fat,
      severity: "impossible",
      message: `Sat (${satFat}g) + Trans (${transFat}g) = ${(satFat + transFat).toFixed(1)}g > graisses totales (${fat}g)`,
    });
    reasons.push("fat_components_exceed_total");
  }

  // Invariant 4: Carbs >= Sugar
  if (carbs != null && sugars != null && sugars > carbs + 0.5) {
    anomalies.push({
      field: "sugars_100g", value: sugars, threshold: carbs,
      severity: "impossible",
      message: `Sucres (${sugars}g) > glucides totaux (${carbs}g)`,
    });
    reasons.push("carbs_sugar_inconsistency");
  }

  // Invariant 5: Macro sum <= 105g/100g (Yuka: 5% tolerance, 20% for tiny servings)
  const macroSum = (fat ?? 0) + (carbs ?? 0) + (proteins ?? 0);
  if (macroSum > 105 && fat != null && carbs != null) {
    anomalies.push({
      field: "macro_sum", value: macroSum, threshold: 105,
      severity: "suspicious",
      message: `Somme macronutriments = ${macroSum.toFixed(1)}g/100g (> 105g)`,
    });
    reasons.push("macro_sum_exceeds_weight");
  }

  // Invariant 6: Category-aware salt threshold
  const isSaltExempt = categories ? SALT_EXEMPT_RE.test(categories) : false;
  if (salt != null && salt > 10 && !isSaltExempt) {
    anomalies.push({
      field: "salt_100g", value: salt, threshold: 10,
      severity: "suspicious",
      message: `Sel = ${salt.toFixed(1)}g/100g suspect pour cette categorie`,
    });
    reasons.push("salt_category_suspicious");
  }

  // ════════════════════════════════════════════════════════════
  // LAYER 3: Calorie formula check — THE KILLER (severity: "critical")
  //
  // Yuka formula: expectedKcal = fat×9 + carbs×4 + fiber×2 + protein×4
  // Tolerance: 30% (same as Yuka's NutritionFactsViewModel)
  //
  // This catches the Coca-Cola bug: OFF says 3.3g sugar but 42 kcal
  //   expected = 0×9 + 3.3×4 + 0×2 + 0×4 = 13.2 kcal
  //   deviation = |42 - 13.2| / 42 = 68.6% → CRITICAL
  // ════════════════════════════════════════════════════════════

  if (energyKcal != null && energyKcal >= CALORIE_MIN_THRESHOLD) {
    // Need at least fat OR carbs to compute expected
    if (fat != null || carbs != null) {
      const expectedKcal =
        (fat ?? 0) * 9 +
        (carbs ?? 0) * 4 +
        (fiber ?? 0) * 2 +
        (proteins ?? 0) * 4;

      // Only check if expected is meaningful (> 0)
      if (expectedKcal > 0) {
        const deviation = Math.abs(energyKcal - expectedKcal) / Math.max(expectedKcal, energyKcal);

        if (deviation > CALORIE_TOLERANCE) {
          anomalies.push({
            field: "calorie_formula",
            value: energyKcal,
            threshold: expectedKcal,
            severity: "critical",
            message: `Calories declarees (${energyKcal.toFixed(0)} kcal) vs formule Atwater (${expectedKcal.toFixed(0)} kcal) : ecart de ${(deviation * 100).toFixed(0)}% (seuil: ${CALORIE_TOLERANCE * 100}%)`,
          });
          reasons.push("calorie_formula_mismatch");
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // LAYER 4: Grade discrepancy check (severity: "critical")
  //
  // If we can compute a NutriScore from nutriments, compare with OFF grade.
  // A discrepancy of ≥2 grades (e.g. computed A vs OFF E) signals data issues.
  // We DON'T import computeNutriScore here to stay pure — the caller passes
  // the computed grade if available.
  // ════════════════════════════════════════════════════════════
  // (Grade discrepancy is checked by the caller in health-score.service.ts
  //  since it requires the NutriScore computation result)

  // ── Determine overall flag ──

  const hasCritical = anomalies.some((a) => a.severity === "critical");
  const hasImpossible = anomalies.some((a) => a.severity === "impossible");
  const hasSuspicious = anomalies.some((a) => a.severity === "suspicious");

  let flag: DataQualityFlag;
  if (hasCritical || hasImpossible) {
    flag = "unreliable";
  } else if (hasSuspicious) {
    flag = "suspicious";
  } else {
    flag = "valid";
  }

  return { flag, anomalies, reasons };
}

/**
 * Check for grade discrepancy between computed and OFF-provided grades.
 * Returns a critical anomaly if discrepancy >= 2 grade levels.
 */
export function checkGradeDiscrepancy(
  computedGrade: string | null | undefined,
  offGrade: string | null | undefined,
): NutrientAnomaly | null {
  if (!computedGrade || !offGrade) return null;

  const gradeOrder: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };
  const cIdx = gradeOrder[computedGrade.toLowerCase()];
  const oIdx = gradeOrder[offGrade.toLowerCase()];

  if (cIdx == null || oIdx == null) return null;

  const gap = Math.abs(cIdx - oIdx);
  if (gap >= 2) {
    return {
      field: "grade_discrepancy",
      value: cIdx,
      threshold: oIdx,
      severity: "critical",
      message: `NutriScore calcule (${computedGrade.toUpperCase()}) vs OFF (${offGrade.toUpperCase()}) : ecart de ${gap} niveaux`,
    };
  }

  return null;
}
