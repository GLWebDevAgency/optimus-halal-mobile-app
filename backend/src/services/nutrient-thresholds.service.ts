/**
 * Nutrient Thresholds Service — Per-nutrient breakdown with tiered levels.
 *
 * Pure synchronous service — no DB, no Redis, no side effects.
 *
 * Inspired by Yuka's NutritionFact.java (11 nutrients × 5 tiers × 2 categories).
 * Uses WHO/EFSA Daily Reference Values (DRV) for %VNR calculations.
 * Category-aware: beverages have stricter thresholds (6-160x tighter on sugars).
 *
 * Reuses detectCategory() from nutriscore.service.ts for beverage distinction.
 */

import { detectCategory } from "./nutriscore.service.js";
import type { Product } from "../db/schema/products.js";

// ── Types ───────────────────────────────────────────────────

export type NutrientLevel = "very_low" | "low" | "moderate" | "high" | "very_high";

export interface NutrientBreakdown {
  /** Nutrient identifier */
  nutrient: string;
  /** Localization key for the nutrient name */
  labelKey: string;
  /** Value per 100g/100ml */
  value: number;
  /** Unit */
  unit: string;
  /** Tiered level (5 levels) */
  level: NutrientLevel;
  /** Percentage of Daily Reference Value */
  dailyValuePercent: number;
  /** Whether product was classified as beverage */
  isBeverage: boolean;
  /** Whether this is a "negative" nutrient (high = bad) */
  isNegative: boolean;
}

// ── Daily Reference Values (EFSA 2017 / WHO 2023) ──────────

/** Adult DRV per day — used for %VNR calculation */
const DAILY_REFERENCE_VALUES: Record<string, number> = {
  energy_kcal: 2000,        // kcal
  fat: 70,                  // g — WHO upper bound
  saturated_fat: 20,        // g — <10% energy
  carbohydrates: 260,       // g — 45-65% energy
  sugars: 50,               // g — WHO free sugars <10% energy
  fiber: 25,                // g — EFSA adequate intake
  proteins: 50,             // g — 0.83g/kg × 60kg
  salt: 5,                  // g — WHO max
  sodium: 2,                // g
};

// ── Threshold Tables ────────────────────────────────────────

/**
 * Thresholds per 100g for standard foods.
 * 4 boundaries → 5 levels: very_low | low | moderate | high | very_high
 *
 * For "negative" nutrients (fat, saturated_fat, sugars, salt, sodium):
 *   very_low = excellent, very_high = concerning
 *
 * For "positive" nutrients (fiber, proteins):
 *   very_low = poor, very_high = excellent
 */
interface NutrientThresholds {
  /** [very_low/low, low/moderate, moderate/high, high/very_high] */
  standard: [number, number, number, number];
  /** Beverage thresholds (stricter, per 100ml) */
  beverage: [number, number, number, number];
  unit: string;
  labelKey: string;
  isNegative: boolean;
  drvKey: string;
}

const THRESHOLDS: Record<string, NutrientThresholds> = {
  energy_kcal: {
    standard: [40, 100, 200, 400],
    beverage: [10, 30, 60, 100],
    unit: "kcal",
    labelKey: "nutrientEnergy",
    isNegative: true,
    drvKey: "energy_kcal",
  },
  fat: {
    standard: [1.5, 5, 10, 20],
    beverage: [0.75, 2.5, 5, 10],
    unit: "g",
    labelKey: "nutrientFat",
    isNegative: true,
    drvKey: "fat",
  },
  saturated_fat: {
    standard: [0.75, 2.5, 5, 10],
    beverage: [0.375, 1.25, 2.5, 5],
    unit: "g",
    labelKey: "nutrientSaturatedFat",
    isNegative: true,
    drvKey: "saturated_fat",
  },
  carbohydrates: {
    standard: [10, 25, 45, 70],
    beverage: [2.5, 6, 11, 17],
    unit: "g",
    labelKey: "nutrientCarbohydrates",
    isNegative: false,
    drvKey: "carbohydrates",
  },
  sugars: {
    standard: [2.5, 7, 15, 25],
    beverage: [0.5, 2.5, 5, 10],
    unit: "g",
    labelKey: "nutrientSugars",
    isNegative: true,
    drvKey: "sugars",
  },
  fiber: {
    standard: [1, 2, 4, 6],
    beverage: [0.5, 1, 2, 3],
    unit: "g",
    labelKey: "nutrientFiber",
    isNegative: false,
    drvKey: "fiber",
  },
  proteins: {
    standard: [2, 5, 10, 17],
    beverage: [1, 2.5, 5, 8.5],
    unit: "g",
    labelKey: "nutrientProteins",
    isNegative: false,
    drvKey: "proteins",
  },
  salt: {
    standard: [0.1, 0.5, 1.2, 2],
    beverage: [0.05, 0.25, 0.6, 1],
    unit: "g",
    labelKey: "nutrientSalt",
    isNegative: true,
    drvKey: "salt",
  },
};

// ── Level Computation ───────────────────────────────────────

function computeLevel(value: number, boundaries: [number, number, number, number]): NutrientLevel {
  if (value <= boundaries[0]) return "very_low";
  if (value <= boundaries[1]) return "low";
  if (value <= boundaries[2]) return "moderate";
  if (value <= boundaries[3]) return "high";
  return "very_high";
}

// ── Main Function ───────────────────────────────────────────

/**
 * Computes per-nutrient breakdown with tiered levels and %DRV.
 *
 * Returns only nutrients for which we have data.
 * Category detection reuses NutriScore's detectCategory().
 */
export function computeNutrientBreakdown(product: Product): NutrientBreakdown[] {
  const category = detectCategory(product.category);
  const isBeverage = category === "beverages";

  const results: NutrientBreakdown[] = [];

  // Map DB columns to nutrient keys
  const nutrientValues: Record<string, number | null> = {
    energy_kcal: product.energyKcal100g ?? null,
    fat: product.fat100g ?? null,
    saturated_fat: product.saturatedFat100g ?? null,
    carbohydrates: product.carbohydrates100g ?? null,
    sugars: product.sugars100g ?? null,
    fiber: product.fiber100g ?? null,
    proteins: product.proteins100g ?? null,
    salt: product.salt100g ?? null,
  };

  for (const [key, thresholdDef] of Object.entries(THRESHOLDS)) {
    const value = nutrientValues[key];
    if (value == null || value < 0) continue;

    const boundaries = isBeverage ? thresholdDef.beverage : thresholdDef.standard;
    const level = computeLevel(value, boundaries);

    const drv = DAILY_REFERENCE_VALUES[thresholdDef.drvKey];
    const dailyValuePercent = drv ? Math.round((value / drv) * 100) : 0;

    results.push({
      nutrient: key,
      labelKey: thresholdDef.labelKey,
      value: Math.round(value * 10) / 10,
      unit: thresholdDef.unit,
      level,
      dailyValuePercent,
      isBeverage,
      isNegative: thresholdDef.isNegative,
    });
  }

  return results;
}
