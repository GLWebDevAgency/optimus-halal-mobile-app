/**
 * BeverageIntelligence — Subcategory detection & beverage-specific analysis.
 *
 * Pure synchronous service — no DB, no Redis, no side effects.
 *
 * Yuka's approach (decompiled from NutritionFactsViewModel):
 *   - 6x stricter sugar thresholds for beverages vs solids
 *     Solid: [0, 9, 18, 31, 45]g    → Yuka labels
 *     Beverage: [0, 1.5, 3, 7, 13]g → Yuka labels
 *   - Sweetener detection for "0-sugar" marketing claims
 *   - Caffeine/taurine warnings for energy drinks
 *   - Subcategory-specific expectations (juice has natural sugar → less penalty)
 *
 * @module services/beverage-intelligence
 */

// ── Types ───────────────────────────────────────────────────

export type BeverageSubcategory =
  | "water"
  | "soda"
  | "juice"
  | "energy_drink"
  | "dairy_drink"
  | "hot_beverage"
  | "plant_milk"
  | "alcohol"
  | "other_beverage";

export type SugarLevel = "none" | "low" | "moderate" | "high" | "very_high";

export interface SweetenerInfo {
  detected: boolean;
  codes: string[];
  /** True if both sugar AND sweeteners detected (misleading "light" marketing) */
  dualSweetened: boolean;
}

export interface CaffeineInfo {
  detected: boolean;
  /** Estimated caffeine level based on category */
  level: "none" | "low" | "moderate" | "high";
  /** Sources detected */
  sources: string[];
}

export interface BeverageAnalysis {
  /** Detected beverage subcategory */
  subcategory: BeverageSubcategory;
  /** i18n key for subcategory label */
  subcategoryLabelKey: string;
  /** Sugar analysis with beverage-specific thresholds */
  sugar: {
    grams: number | null;
    level: SugarLevel;
    /** Yuka-style label key */
    labelKey: string;
    /** Percentage of max recommended daily intake (25g WHO) */
    percentDailyMax: number | null;
  };
  /** Sweetener detection */
  sweeteners: SweetenerInfo;
  /** Caffeine/stimulant detection */
  caffeine: CaffeineInfo;
  /** True if this beverage has natural sugar (juice, dairy) — less alarming */
  hasNaturalSugar: boolean;
  /** Score modifier for health score engine (negative = penalty) */
  scoreModifier: number;
  /** Human-readable insight keys for frontend display */
  insights: string[];
}

// ── Constants ───────────────────────────────────────────────

/** Yuka beverage sugar thresholds (g/100ml) and labels */
const BEVERAGE_SUGAR_LEVELS: [number, SugarLevel, string][] = [
  [0, "none", "beverageSugarNone"],
  [1.5, "low", "beverageSugarLow"],
  [3, "moderate", "beverageSugarModerate"],
  [7, "high", "beverageSugarHigh"],
  [13, "very_high", "beverageSugarVeryHigh"],
];

/** WHO recommended max daily added sugar: 25g (6 teaspoons) */
const WHO_DAILY_SUGAR_MAX = 25;

// ── Detection Patterns ──────────────────────────────────────

const SODA_RE = /\b(soda|coca|pepsi|fanta|sprite|orangina|limonade|lemonade|schweppes|7[- ]?up|mountain.?dew|dr[. ]pepper|tonic|ginger.?ale|cola)\b/i;
const JUICE_RE = /\b(jus|juice|nectar|smoothie|pur jus|100\s*%\s*jus|100\s*%\s*juice|jus de fruit|jus d'orange|jus de pomme|pressed|presse)\b/i;
const ENERGY_RE = /\b(energy|[eé]nerg[iy]|red.?bull|monster|burn|rockstar|reign|bang|celsius|guarana|taurine)\b/i;
const DAIRY_DRINK_RE = /\b(lait|milk|yaourt [aà] boire|drinking yogurt|kefir|lassi|ayran|lben|leben|raib|raibi|actimel|yakult)\b/i;
const PLANT_MILK_RE = /\b(lait d'amande|almond milk|lait de soja|soy milk|lait d'avoine|oat milk|lait de coco|coconut milk|lait de riz|rice milk|lait de noisette|hazelnut milk|boisson v[eé]g[eé]tale|plant.?based)\b/i;
const HOT_BEVERAGE_RE = /\b(caf[eé]|coffee|th[eé]\b|tea\b|chocolat chaud|hot chocolate|cappuccino|latte|espresso|infusion|tisane|mate|matcha|chicor[eé]e|chicory)\b/i;
const WATER_RE = /\b(eau|water|eau min[eé]rale|mineral water|eau de source|spring water|eau gazeuse|sparkling water|eau plate|still water)\b/i;
const ALCOHOL_RE = /\b(bi[eè]re|beer|vin\b|wine|vodka|whisky|whiskey|rhum|rum|gin\b|cognac|champagne|cidre|cider|aperitif|ap[eé]ritif|liqueur|alcool|alcohol|sake|sak[eé])\b/i;

/** Artificial sweetener detection (E-codes + names) */
const SWEETENER_PATTERNS: [RegExp, string][] = [
  [/\be950\b/i, "E950"],
  [/\be951\b|aspartame/i, "E951"],
  [/\be952\b|cyclamate/i, "E952"],
  [/\be954\b|saccharin/i, "E954"],
  [/\be955\b|sucralose/i, "E955"],
  [/\be960\b|stevia|steviol/i, "E960"],
  [/\be961\b|neotame/i, "E961"],
  [/\be962\b/i, "E962"],
  [/\be967\b|xylitol/i, "E967"],
  [/\be968\b|erythritol/i, "E968"],
  [/\bacesulfame/i, "E950"],
  [/\bmaltitol/i, "E965"],
  [/\bsorbitol/i, "E420"],
];

/** Caffeine source patterns */
const CAFFEINE_PATTERNS: [RegExp, string][] = [
  [/\bcaf[eé]ine/i, "caffeine"],
  [/\bguarana/i, "guarana"],
  [/\btaurine/i, "taurine"],
  [/\bginseng/i, "ginseng"],
  [/\bmate\b/i, "mate"],
  [/\bth[eé]ine/i, "theine"],
];

// ── Subcategory Detection ───────────────────────────────────

const SUBCATEGORY_LABELS: Record<BeverageSubcategory, string> = {
  water: "beverageSubcategoryWater",
  soda: "beverageSubcategorySoda",
  juice: "beverageSubcategoryJuice",
  energy_drink: "beverageSubcategoryEnergyDrink",
  dairy_drink: "beverageSubcategoryDairyDrink",
  hot_beverage: "beverageSubcategoryHotBeverage",
  plant_milk: "beverageSubcategoryPlantMilk",
  alcohol: "beverageSubcategoryAlcohol",
  other_beverage: "beverageSubcategoryOther",
};

function detectSubcategory(searchText: string): BeverageSubcategory {
  // Order matters: more specific first
  if (WATER_RE.test(searchText)) return "water";
  if (ALCOHOL_RE.test(searchText)) return "alcohol";
  if (ENERGY_RE.test(searchText)) return "energy_drink";
  if (PLANT_MILK_RE.test(searchText)) return "plant_milk";
  if (DAIRY_DRINK_RE.test(searchText)) return "dairy_drink";
  if (JUICE_RE.test(searchText)) return "juice";
  if (SODA_RE.test(searchText)) return "soda";
  if (HOT_BEVERAGE_RE.test(searchText)) return "hot_beverage";
  return "other_beverage";
}

// ── Sugar Level Analysis ────────────────────────────────────

function analyzeSugarLevel(grams: number | null): {
  level: SugarLevel;
  labelKey: string;
  percentDailyMax: number | null;
} {
  if (grams == null) {
    return { level: "none", labelKey: "beverageSugarUnknown", percentDailyMax: null };
  }

  let level: SugarLevel = "very_high";
  let labelKey = "beverageSugarVeryHigh";

  for (const [threshold, lev, key] of BEVERAGE_SUGAR_LEVELS) {
    if (grams <= threshold) {
      level = lev;
      labelKey = key;
      break;
    }
  }

  // If didn't match any threshold, it's > 13g → very_high
  const percentDailyMax = Math.round((grams / WHO_DAILY_SUGAR_MAX) * 100);

  return { level, labelKey, percentDailyMax };
}

// ── Sweetener Detection ─────────────────────────────────────

function detectSweeteners(
  ingredientsText: string | null | undefined,
  additivesTags: string[] | null | undefined,
): SweetenerInfo {
  const searchText = [
    ingredientsText ?? "",
    ...(additivesTags ?? []),
  ].join(" ");

  const codes: string[] = [];
  for (const [pattern, code] of SWEETENER_PATTERNS) {
    if (pattern.test(searchText) && !codes.includes(code)) {
      codes.push(code);
    }
  }

  return {
    detected: codes.length > 0,
    codes,
    dualSweetened: false, // Set by caller after sugar analysis
  };
}

// ── Caffeine Detection ──────────────────────────────────────

function detectCaffeine(
  ingredientsText: string | null | undefined,
  subcategory: BeverageSubcategory,
): CaffeineInfo {
  const text = ingredientsText ?? "";
  const sources: string[] = [];

  for (const [pattern, source] of CAFFEINE_PATTERNS) {
    if (pattern.test(text) && !sources.includes(source)) {
      sources.push(source);
    }
  }

  // Infer caffeine from subcategory if not in ingredients
  if (sources.length === 0) {
    if (subcategory === "energy_drink") {
      return { detected: true, level: "high", sources: ["inferred_energy_drink"] };
    }
    if (subcategory === "hot_beverage") {
      return { detected: true, level: "moderate", sources: ["inferred_hot_beverage"] };
    }
    return { detected: false, level: "none", sources: [] };
  }

  const level: CaffeineInfo["level"] =
    subcategory === "energy_drink" || sources.includes("guarana") ? "high" :
    sources.includes("caffeine") || sources.includes("theine") ? "moderate" :
    "low";

  return { detected: true, level, sources };
}

// ── Score Modifier ──────────────────────────────────────────

/**
 * Compute a score modifier that can be applied by the health score engine.
 * Negative values = penalty, positive = bonus.
 */
function computeScoreModifier(
  subcategory: BeverageSubcategory,
  sugarLevel: SugarLevel,
  sweeteners: SweetenerInfo,
  caffeine: CaffeineInfo,
): number {
  let modifier = 0;

  // Sugar penalty (Yuka's 6x stricter approach)
  switch (sugarLevel) {
    case "none": break;
    case "low": modifier -= 2; break;
    case "moderate": modifier -= 5; break;
    case "high": modifier -= 10; break;
    case "very_high": modifier -= 15; break;
  }

  // Sweetener penalty (misleading "0-sugar" marketing)
  if (sweeteners.detected) modifier -= 3;
  if (sweeteners.dualSweetened) modifier -= 2; // Extra penalty for sugar + sweetener combo

  // Caffeine penalty for energy drinks
  if (caffeine.level === "high") modifier -= 5;

  // Subcategory adjustments
  if (subcategory === "water") modifier = 0; // Water is neutral
  if (subcategory === "juice") modifier += 3; // Natural sugar less penalized

  // Clamp to [-20, 0] (never a bonus for beverages except juice/water)
  return Math.max(-20, Math.min(0, modifier));
}

// ── Main Function ───────────────────────────────────────────

/**
 * Analyze a beverage product with subcategory detection and Yuka-grade sugar analysis.
 *
 * @param categories - OFF categories string
 * @param name - Product name
 * @param nutriments - OFF nutriments record
 * @param ingredientsText - Raw ingredients text
 * @param additivesTags - OFF additives tags
 * @returns BeverageAnalysis or null if not a beverage
 */
export function analyzeBeverage(
  categories: string | null | undefined,
  name: string | null | undefined,
  nutriments: Record<string, number | string> | null | undefined,
  ingredientsText: string | null | undefined,
  additivesTags: string[] | null | undefined,
): BeverageAnalysis | null {
  const searchText = [categories ?? "", name ?? ""].join(" ");

  // Must be detectable as a beverage
  const subcategory = detectSubcategory(searchText);
  if (subcategory === "other_beverage" && !isBeverageByNutriments(nutriments)) {
    return null;
  }

  // Sugar analysis
  const sugarsVal = nutriments?.["sugars_100g"];
  const sugarsGrams = sugarsVal != null && sugarsVal !== ""
    ? (typeof sugarsVal === "string" ? parseFloat(sugarsVal) : sugarsVal)
    : null;
  const sugarAnalysis = analyzeSugarLevel(
    sugarsGrams != null && !isNaN(sugarsGrams) ? sugarsGrams : null,
  );

  // Sweetener detection
  const sweeteners = detectSweeteners(ingredientsText, additivesTags);
  // Dual-sweetened: has both sugar > 1g AND artificial sweeteners
  if (sweeteners.detected && sugarsGrams != null && sugarsGrams > 1) {
    sweeteners.dualSweetened = true;
  }

  // Caffeine detection
  const caffeine = detectCaffeine(ingredientsText, subcategory);

  // Natural sugar categories
  const hasNaturalSugar = ["juice", "dairy_drink", "plant_milk"].includes(subcategory);

  // Score modifier
  const scoreModifier = computeScoreModifier(
    subcategory,
    sugarAnalysis.level,
    sweeteners,
    caffeine,
  );

  // Build insights
  const insights: string[] = [];
  if (sugarAnalysis.level === "very_high") insights.push("beverageInsightVeryHighSugar");
  if (sugarAnalysis.level === "high") insights.push("beverageInsightHighSugar");
  if (sweeteners.dualSweetened) insights.push("beverageInsightDualSweetened");
  if (sweeteners.detected && sugarAnalysis.level === "none") insights.push("beverageInsightSweetenerOnly");
  if (caffeine.level === "high") insights.push("beverageInsightHighCaffeine");
  if (subcategory === "water") insights.push("beverageInsightWater");
  if (hasNaturalSugar && sugarAnalysis.level !== "none") insights.push("beverageInsightNaturalSugar");

  return {
    subcategory,
    subcategoryLabelKey: SUBCATEGORY_LABELS[subcategory],
    sugar: {
      grams: sugarsGrams != null && !isNaN(sugarsGrams) ? sugarsGrams : null,
      ...sugarAnalysis,
    },
    sweeteners,
    caffeine,
    hasNaturalSugar,
    scoreModifier,
    insights,
  };
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Heuristic: detect if a product is likely a beverage from its nutriments.
 * Beverages typically have very low energy and near-zero fat/protein.
 */
function isBeverageByNutriments(nutriments: Record<string, number | string> | null | undefined): boolean {
  if (!nutriments) return false;
  const energy = Number(nutriments["energy-kcal_100g"]);
  const fat = Number(nutriments["fat_100g"]);
  const proteins = Number(nutriments["proteins_100g"]);
  // Very low energy + near-zero macros → likely a beverage
  return energy < 80 && fat < 1 && proteins < 2;
}

export { detectSubcategory, analyzeSugarLevel };
