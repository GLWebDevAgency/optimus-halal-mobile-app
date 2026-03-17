/**
 * DataReconciler — Multi-source nutriment resolution with provenance tracking.
 *
 * Pure synchronous service — no DB, no Redis, no side effects.
 *
 * Yuka's architecture uses Firestore pre-computed data + Goodtoucan backend + TFLite OCR
 * as fallback layers. We have:
 *   Source 1: OFF raw nutriments (highest fidelity — actual lab values)
 *   Source 2: OFF nutriscore_data.components (pre-processed for NS algorithm)
 *   Source 3: DB denormalized columns (from V2 import, may be stale)
 *
 * Priority: OFF nutriments > NutriScore components > DB columns
 * Each field tracks its provenance so downstream (NutrientValidator, HealthScore)
 * can weight confidence accordingly.
 *
 * @module services/data-reconciler
 */

// ── Types ───────────────────────────────────────────────────

export type NutrimentSource = "off_nutriments" | "off_nutriscore_components" | "db_columns" | "imputed";

export interface ReconciledField {
  value: number;
  source: NutrimentSource;
}

export interface ReconciledNutriments {
  energyKcal: ReconciledField | null;
  energyKj: ReconciledField | null;
  fat: ReconciledField | null;
  saturatedFat: ReconciledField | null;
  transFat: ReconciledField | null;
  carbohydrates: ReconciledField | null;
  sugars: ReconciledField | null;
  fiber: ReconciledField | null;
  proteins: ReconciledField | null;
  salt: ReconciledField | null;
  sodium: ReconciledField | null;
}

export interface ReconciliationReport {
  /** Reconciled nutriment values */
  nutriments: ReconciledNutriments;
  /** Flat record for passing to existing services (keys = OFF format) */
  flat: Record<string, number>;
  /** How many fields came from each source */
  sourceCounts: Record<NutrimentSource, number>;
  /** Number of fields with data (out of 11) */
  coverage: number;
  /** Data completeness ratio (0-1) */
  completeness: number;
  /** True if any field had conflicting values across sources */
  hasConflicts: boolean;
  /** List of fields where sources disagreed (>20% deviation) */
  conflicts: string[];
}

// ── Helpers ───────────────────────────────────────────────────

function safeNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Check if two values conflict (>20% relative deviation) */
function valuesConflict(a: number, b: number): boolean {
  if (a === 0 && b === 0) return false;
  const max = Math.max(Math.abs(a), Math.abs(b));
  if (max === 0) return false;
  return Math.abs(a - b) / max > 0.20;
}

// ── OFF NutriScore component ID → nutriment key mapping ──────

const COMPONENT_MAP: Record<string, keyof ReconciledNutriments> = {
  energy: "energyKj",
  sugars: "sugars",
  saturated_fat: "saturatedFat",
  salt: "salt",
  sodium: "sodium",
  fiber: "fiber",
  proteins: "proteins",
};

// ── Main reconciliation function ─────────────────────────────

/**
 * Reconcile nutriment data from up to 3 sources.
 * Returns a unified nutriment record with provenance for each field.
 *
 * @param offNutriments - OFF raw nutriments record (source 1, highest priority)
 * @param offNutriscoreComponents - OFF nutriscore_data.components (source 2)
 * @param dbColumns - DB denormalized columns from products table (source 3)
 */
export function reconcileNutriments(
  offNutriments: Record<string, number | string> | null | undefined,
  offNutriscoreComponents: { id: string; value: number }[] | null | undefined,
  dbColumns: {
    energyKcal100g?: number | null;
    fat100g?: number | null;
    saturatedFat100g?: number | null;
    carbohydrates100g?: number | null;
    sugars100g?: number | null;
    fiber100g?: number | null;
    proteins100g?: number | null;
    salt100g?: number | null;
  } | null | undefined,
): ReconciliationReport {
  const result: ReconciledNutriments = {
    energyKcal: null,
    energyKj: null,
    fat: null,
    saturatedFat: null,
    transFat: null,
    carbohydrates: null,
    sugars: null,
    fiber: null,
    proteins: null,
    salt: null,
    sodium: null,
  };

  const sourceCounts: Record<NutrimentSource, number> = {
    off_nutriments: 0,
    off_nutriscore_components: 0,
    db_columns: 0,
    imputed: 0,
  };

  const conflicts: string[] = [];

  // ── Source 1: OFF raw nutriments (highest priority) ──

  type FieldDef = [keyof ReconciledNutriments, string[]];

  const OFF_FIELDS: FieldDef[] = [
    ["energyKcal", ["energy-kcal_100g"]],
    ["energyKj", ["energy-kj_100g", "energy_100g"]],
    ["fat", ["fat_100g"]],
    ["saturatedFat", ["saturated-fat_100g", "saturated_fat_100g"]],
    ["transFat", ["trans-fat_100g"]],
    ["carbohydrates", ["carbohydrates_100g"]],
    ["sugars", ["sugars_100g"]],
    ["fiber", ["fiber_100g"]],
    ["proteins", ["proteins_100g"]],
    ["salt", ["salt_100g"]],
    ["sodium", ["sodium_100g"]],
  ];

  if (offNutriments) {
    for (const [field, keys] of OFF_FIELDS) {
      for (const key of keys) {
        const v = safeNum(offNutriments[key]);
        if (v != null) {
          result[field] = { value: v, source: "off_nutriments" };
          sourceCounts.off_nutriments++;
          break;
        }
      }
    }
  }

  // ── Source 2: OFF NutriScore components (fill gaps) ──

  if (offNutriscoreComponents) {
    for (const comp of offNutriscoreComponents) {
      const field = COMPONENT_MAP[comp.id];
      if (!field) continue;

      if (result[field] == null) {
        result[field] = { value: comp.value, source: "off_nutriscore_components" };
        sourceCounts.off_nutriscore_components++;
      } else if (valuesConflict(result[field]!.value, comp.value)) {
        conflicts.push(field);
      }
    }
  }

  // ── Source 3: DB denormalized columns (fill remaining gaps) ──

  type DbFieldDef = [keyof ReconciledNutriments, keyof NonNullable<typeof dbColumns>];

  const DB_FIELDS: DbFieldDef[] = [
    ["energyKcal", "energyKcal100g"],
    ["fat", "fat100g"],
    ["saturatedFat", "saturatedFat100g"],
    ["carbohydrates", "carbohydrates100g"],
    ["sugars", "sugars100g"],
    ["fiber", "fiber100g"],
    ["proteins", "proteins100g"],
    ["salt", "salt100g"],
  ];

  if (dbColumns) {
    for (const [field, dbKey] of DB_FIELDS) {
      const v = safeNum(dbColumns[dbKey]);
      if (v == null) continue;

      if (result[field] == null) {
        result[field] = { value: v, source: "db_columns" };
        sourceCounts.db_columns++;
      } else if (valuesConflict(result[field]!.value, v)) {
        conflicts.push(field);
      }
    }
  }

  // ── Derived values (imputed) ──

  // Salt ↔ Sodium conversion
  if (result.salt == null && result.sodium != null) {
    result.salt = { value: result.sodium.value * 2.5, source: "imputed" };
    sourceCounts.imputed++;
  } else if (result.sodium == null && result.salt != null) {
    result.sodium = { value: result.salt.value / 2.5, source: "imputed" };
    sourceCounts.imputed++;
  }

  // Energy kJ ↔ kcal conversion
  if (result.energyKj == null && result.energyKcal != null) {
    result.energyKj = { value: Math.round(result.energyKcal.value * 4.184), source: "imputed" };
    sourceCounts.imputed++;
  } else if (result.energyKcal == null && result.energyKj != null) {
    result.energyKcal = { value: Math.round(result.energyKj.value / 4.184), source: "imputed" };
    sourceCounts.imputed++;
  }

  // ── Build flat record (OFF-compatible keys) ──

  const flat: Record<string, number> = {};
  if (result.energyKcal) flat["energy-kcal_100g"] = result.energyKcal.value;
  if (result.energyKj) flat["energy_100g"] = result.energyKj.value;
  if (result.fat) flat["fat_100g"] = result.fat.value;
  if (result.saturatedFat) flat["saturated-fat_100g"] = result.saturatedFat.value;
  if (result.transFat) flat["trans-fat_100g"] = result.transFat.value;
  if (result.carbohydrates) flat["carbohydrates_100g"] = result.carbohydrates.value;
  if (result.sugars) flat["sugars_100g"] = result.sugars.value;
  if (result.fiber) flat["fiber_100g"] = result.fiber.value;
  if (result.proteins) flat["proteins_100g"] = result.proteins.value;
  if (result.salt) flat["salt_100g"] = result.salt.value;
  if (result.sodium) flat["sodium_100g"] = result.sodium.value;

  // ── Compute coverage ──

  const CORE_FIELDS: (keyof ReconciledNutriments)[] = [
    "energyKcal", "fat", "saturatedFat", "carbohydrates",
    "sugars", "fiber", "proteins", "salt",
  ];
  const coverage = CORE_FIELDS.filter(f => result[f] != null).length;
  const completeness = coverage / CORE_FIELDS.length;

  return {
    nutriments: result,
    flat,
    sourceCounts,
    coverage,
    completeness,
    hasConflicts: conflicts.length > 0,
    conflicts: [...new Set(conflicts)],
  };
}
