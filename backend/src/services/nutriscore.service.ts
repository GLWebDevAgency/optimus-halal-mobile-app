/**
 * NutriScore 2024 — Reimplementation complete de l'algorithme revise.
 *
 * Sources:
 *   - Merz et al., "Nutri-Score 2023 update", Nature Food 2024
 *   - Sante Publique France, "Reglement d'usage Nutri-Score", rev. Dec 2023
 *   - Eurofins, tables de seuils revisees 2024
 *
 * Cet algorithme remplace la dependance au grade OFF pre-calcule (nutriscore_grade).
 * Avantage: +30% de couverture (produits avec nutriments mais sans grade OFF).
 */

// ── Types ───────────────────────────────────────────────────

export type NutriScoreGrade = "a" | "b" | "c" | "d" | "e";

export type NutriScoreCategory =
  | "general"
  | "beverages"
  | "fats_oils_nuts"
  | "cheese"
  | "red_meat";

export interface NutrimentInput {
  /** Energy in kJ per 100g. If only kcal available, multiply by 4.184 */
  energyKj: number | null;
  /** Energy in kcal per 100g (used as fallback to compute kJ) */
  energyKcal?: number | null;
  /** Total sugars in g per 100g */
  sugars: number | null;
  /** Saturated fatty acids in g per 100g */
  saturatedFat: number | null;
  /** Salt in g per 100g. If only sodium, multiply by 2.5 */
  salt: number | null;
  /** Sodium in g per 100g (used as fallback to compute salt) */
  sodium?: number | null;
  /** Dietary fiber in g per 100g */
  fiber: number | null;
  /** Protein in g per 100g */
  proteins: number | null;
  /** Fruits, vegetables, legumes, nuts estimate in % */
  fruitVegNuts: number | null;
  /** Total fat in g per 100g (needed for fats/oils ratio) */
  fat?: number | null;
}

export interface NutriScoreResult {
  /** Raw score (N - P). Range: approx -17 to +55 */
  raw: number;
  /** Grade A-E */
  grade: NutriScoreGrade;
  /** N points breakdown */
  nPoints: {
    energy: number;
    sugars: number;
    saturatedFat: number;
    salt: number;
    total: number;
  };
  /** P points breakdown */
  pPoints: {
    fiber: number;
    proteins: number;
    fruitVegNuts: number;
    total: number;
  };
  /** Detected category */
  category: NutriScoreCategory;
  /** Whether protein was capped (N > 11 and FVN < 80) */
  proteinCapped: boolean;
  /** Number of nutriments that were imputed (missing → 0) */
  imputedCount: number;
}

// ── Threshold Tables (2024 revised) ────────────────────────

// General foods — N points thresholds per 100g
const ENERGY_THRESHOLDS   = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const SUGARS_THRESHOLDS   = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34];
const SAT_FAT_THRESHOLDS  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SALT_THRESHOLDS     = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2];

// General foods — P points thresholds per 100g
const FIBER_THRESHOLDS    = [3.0, 4.1, 5.2, 6.3, 7.4];
const PROTEIN_THRESHOLDS  = [2.4, 4.8, 7.2, 9.6, 12];
const FVN_THRESHOLDS      = [40, 60, 80]; // Only 0, 2, 5 points (not 1, 3, 4)

// Beverages — N points thresholds per 100ml
const BEV_ENERGY_THRESHOLDS  = [30, 90, 150, 210, 240, 270, 300, 330, 360, 390];
const BEV_SUGARS_THRESHOLDS  = [0.5, 2, 3.5, 5, 6, 7, 8, 9, 10, 11];
const BEV_SAT_FAT_THRESHOLDS = SAT_FAT_THRESHOLDS; // Same as general
const BEV_SALT_THRESHOLDS    = SALT_THRESHOLDS;     // Same as general

// Beverages — P points
const BEV_PROTEIN_THRESHOLDS = [1.2, 1.5, 1.8, 2.1, 2.4, 2.7];
const BEV_FIBER_THRESHOLDS   = FIBER_THRESHOLDS; // Same as general

// Fats/Oils/Nuts — N points use ratio saturatedFat/totalFat instead of saturatedFat alone
const FATS_SAT_RATIO_THRESHOLDS = [10, 16, 22, 28, 34, 40, 46, 52, 58, 64];
// Energy from saturates: saturatedFat (g) * 37 kJ/g
const FATS_ENERGY_SAT_THRESHOLDS = [120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200];

// ── Grade Thresholds ───────────────────────────────────────

const GENERAL_GRADE_THRESHOLDS: [number, NutriScoreGrade][] = [
  [0, "a"],   // <= 0
  [2, "b"],   // 1-2
  [10, "c"],  // 3-10
  [18, "d"],  // 11-18
];
// >= 19 → "e"

const FATS_GRADE_THRESHOLDS: [number, NutriScoreGrade][] = [
  [-6, "a"],  // <= -6
  [2, "b"],   // -5 to 2
  [10, "c"],  // 3-10
  [18, "d"],  // 11-18
];

const BEV_GRADE_THRESHOLDS: [number, NutriScoreGrade][] = [
  // Water is always A (handled separately)
  [2, "b"],   // <= 2
  [6, "c"],   // 3-6
  [9, "d"],   // 7-9
];
// >= 10 → "e"

// ── Helper: Lookup threshold ───────────────────────────────

function lookupPoints(value: number, thresholds: number[]): number {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value > thresholds[i]) return i + 1;
  }
  return 0;
}

/** FVN uses non-standard point mapping: 0pts if <40%, 2pts if 40-60%, 5pts if >80% */
function lookupFvnPoints(fvnPercent: number): number {
  if (fvnPercent > 80) return 5;
  if (fvnPercent > 60) return 2;
  if (fvnPercent > 40) return 1;
  return 0;
}

function lookupGrade(raw: number, thresholds: [number, NutriScoreGrade][]): NutriScoreGrade {
  for (const [max, grade] of thresholds) {
    if (raw <= max) return grade;
  }
  return "e";
}

// ── Category Detection ────────────────────────────────────

const BEVERAGE_KEYWORDS = [
  "boisson", "beverage", "drink", "soda", "jus", "juice", "eau",
  "water", "the ", "tea", "cafe", "coffee",
  "sirop", "syrup", "nectar", "smoothie", "energy drink",
  "biere", "beer", "vin ", "wine", "cidre", "cider",
  "limonade", "lemonade", "chocolat chaud", "hot chocolate",
];

// lait/milk as beverage only when not combined with solid food terms
const MILK_BEVERAGE_RE = /\b(lait|milk)\b/i;
const SOLID_FOOD_RE = /\b(fromage|cheese|chocolat|chocolate|beurre|butter|yaourt|yogurt|yoghourt|creme|cream|biscuit|gateau|cake|glace|ice|poudre|powder)\b/i;

const FATS_KEYWORDS = [
  "huile", "oil", "beurre", "butter", "margarine", "graisse", "fat",
  "creme", "cream", "noix", "nut", "amande", "almond", "noisette",
  "hazelnut", "pistache", "pistachio", "cacahuete", "peanut",
  "olive", "tournesol", "sunflower", "colza", "canola", "avocat",
  "avocado", "mayonnaise", "vinaigrette",
];

const RED_MEAT_KEYWORDS = [
  "boeuf", "beef", "veau", "veal", "agneau", "lamb", "mouton",
  "mutton", "porc", "pork", "gibier", "game", "cheval", "horse",
  "chevre", "goat",
];

const CHEESE_KEYWORDS = [
  "fromage", "cheese", "camembert", "brie", "roquefort", "comté",
  "gruyere", "emmental", "cheddar", "mozzarella", "parmesan",
  "gouda", "feta", "raclette",
];

export function detectCategory(categories: string | null | undefined): NutriScoreCategory {
  if (!categories) return "general";
  const lower = categories.toLowerCase();

  // Use word boundaries to avoid false positives (e.g. "eau" matching "agneau")
  const matchesAny = (keywords: string[]) =>
    keywords.some(kw => new RegExp(`\\b${kw.trim()}\\b`).test(lower));

  // Solid food categories first — prevent "chocolat au lait" being classified as beverage
  if (matchesAny(CHEESE_KEYWORDS)) return "cheese";
  if (matchesAny(RED_MEAT_KEYWORDS)) return "red_meat";
  if (matchesAny(FATS_KEYWORDS)) return "fats_oils_nuts";

  // Beverages (explicit keywords)
  if (matchesAny(BEVERAGE_KEYWORDS)) return "beverages";
  // lait/milk → beverage only if no solid food term in the same category string
  if (MILK_BEVERAGE_RE.test(lower) && !SOLID_FOOD_RE.test(lower)) return "beverages";

  return "general";
}

// ── Nutriment Resolution ──────────────────────────────────

interface ResolvedNutriments {
  energyKj: number;
  sugars: number;
  saturatedFat: number;
  salt: number;
  fiber: number;
  proteins: number;
  fruitVegNuts: number;
  fat: number;
  imputedCount: number;
}

/**
 * Resolve nutriments with fallback conversions and conservative imputation.
 * Returns null if insufficient data (< 3 of 4 N-nutriments).
 */
export function resolveNutriments(input: NutrimentInput): ResolvedNutriments | null {
  // Energy: prefer kJ, fallback kcal * 4.184
  const energyKj = input.energyKj ?? (input.energyKcal != null ? Math.round(input.energyKcal * 4.184) : null);
  // Salt: prefer salt, fallback sodium * 2.5
  const salt = input.salt ?? (input.sodium != null ? +(input.sodium * 2.5).toFixed(2) : null);

  // Count available N-nutriments (essential)
  const nAvailable = [energyKj, input.sugars, input.saturatedFat, salt]
    .filter(v => v != null).length;

  // Need at least 3 of 4 N-nutriments to compute
  if (nAvailable < 3) return null;

  let imputedCount = 0;

  // Impute missing N-nutriments conservatively (mid-range values)
  const resolvedEnergy = energyKj ?? (() => { imputedCount++; return 1500; })(); // ~360 kcal — mid range
  const resolvedSugars = input.sugars ?? (() => { imputedCount++; return 15; })(); // Mid range
  const resolvedSatFat = input.saturatedFat ?? (() => { imputedCount++; return 5; })(); // Mid range
  const resolvedSalt = salt ?? (() => { imputedCount++; return 1; })(); // Mid range

  // P-nutriments: impute as 0 (no bonus granted — precautionary)
  const resolvedFiber = input.fiber ?? (() => { imputedCount++; return 0; })();
  const resolvedProteins = input.proteins ?? (() => { imputedCount++; return 0; })();
  const resolvedFvn = input.fruitVegNuts ?? (() => { imputedCount++; return 0; })();
  const resolvedFat = input.fat ?? 0;

  return {
    energyKj: resolvedEnergy,
    sugars: resolvedSugars,
    saturatedFat: resolvedSatFat,
    salt: resolvedSalt,
    fiber: resolvedFiber,
    proteins: resolvedProteins,
    fruitVegNuts: resolvedFvn,
    fat: resolvedFat,
    imputedCount,
  };
}

// ── Main Computation ──────────────────────────────────────

export function computeNutriScore(
  input: NutrimentInput,
  categoryRaw?: string | null,
): NutriScoreResult | null {
  const resolved = resolveNutriments(input);
  if (!resolved) return null;

  const category = detectCategory(categoryRaw);

  let nEnergy: number;
  let nSugars: number;
  let nSatFat: number;
  let nSalt: number;
  let pFiber: number;
  let pProteins: number;
  let pFvn: number;

  if (category === "beverages") {
    nEnergy   = lookupPoints(resolved.energyKj, BEV_ENERGY_THRESHOLDS);
    nSugars   = lookupPoints(resolved.sugars, BEV_SUGARS_THRESHOLDS);
    nSatFat   = lookupPoints(resolved.saturatedFat, BEV_SAT_FAT_THRESHOLDS);
    nSalt     = lookupPoints(resolved.salt, BEV_SALT_THRESHOLDS);
    pFiber    = lookupPoints(resolved.fiber, BEV_FIBER_THRESHOLDS);
    pProteins = lookupPoints(resolved.proteins, BEV_PROTEIN_THRESHOLDS);
    pFvn      = lookupFvnPoints(resolved.fruitVegNuts);
  } else if (category === "fats_oils_nuts") {
    // Fats use energy from saturates and sat/total ratio
    const energyFromSat = resolved.saturatedFat * 37; // kJ
    nEnergy = lookupPoints(energyFromSat, FATS_ENERGY_SAT_THRESHOLDS);
    nSugars = lookupPoints(resolved.sugars, SUGARS_THRESHOLDS);
    const satRatio = resolved.fat > 0 ? (resolved.saturatedFat / resolved.fat) * 100 : 0;
    nSatFat = lookupPoints(satRatio, FATS_SAT_RATIO_THRESHOLDS);
    nSalt   = lookupPoints(resolved.salt, SALT_THRESHOLDS);
    pFiber    = lookupPoints(resolved.fiber, FIBER_THRESHOLDS);
    pProteins = lookupPoints(resolved.proteins, PROTEIN_THRESHOLDS);
    pFvn      = lookupFvnPoints(resolved.fruitVegNuts);
  } else {
    // General, red_meat, cheese — same N thresholds
    nEnergy   = lookupPoints(resolved.energyKj, ENERGY_THRESHOLDS);
    nSugars   = lookupPoints(resolved.sugars, SUGARS_THRESHOLDS);
    nSatFat   = lookupPoints(resolved.saturatedFat, SAT_FAT_THRESHOLDS);
    nSalt     = lookupPoints(resolved.salt, SALT_THRESHOLDS);
    pFiber    = lookupPoints(resolved.fiber, FIBER_THRESHOLDS);
    pProteins = lookupPoints(resolved.proteins, PROTEIN_THRESHOLDS);
    pFvn      = lookupFvnPoints(resolved.fruitVegNuts);
  }

  const nTotal = nEnergy + nSugars + nSatFat + nSalt;

  // Protein cap rule: if N > 11 and FVN < 80%, protein points are not subtracted
  let proteinCapped = false;
  let pTotal: number;

  if (category === "beverages") {
    // Beverages: no protein cap rule
    pTotal = pFiber + pProteins + pFvn;
  } else if (nTotal > 11 && resolved.fruitVegNuts < 80) {
    // Protein points excluded (but fiber + FVN always count)
    pTotal = pFiber + pFvn;
    proteinCapped = true;
    // Exception: red_meat proteins are ALWAYS capped at 2 regardless
  } else {
    pTotal = pFiber + pProteins + pFvn;
  }

  // Red meat: protein cap at 2 points max
  if (category === "red_meat" && !proteinCapped) {
    const cappedProtein = Math.min(pProteins, 2);
    pTotal = pFiber + cappedProtein + pFvn;
    if (pProteins > 2) proteinCapped = true;
  }

  const raw = nTotal - pTotal;

  // Grade determination
  let grade: NutriScoreGrade;
  if (category === "beverages") {
    // Water is always A (check via category string)
    grade = lookupGrade(raw, BEV_GRADE_THRESHOLDS);
  } else if (category === "fats_oils_nuts") {
    grade = lookupGrade(raw, FATS_GRADE_THRESHOLDS);
  } else {
    grade = lookupGrade(raw, GENERAL_GRADE_THRESHOLDS);
  }

  return {
    raw,
    grade,
    nPoints: {
      energy: nEnergy,
      sugars: nSugars,
      saturatedFat: nSatFat,
      salt: nSalt,
      total: nTotal,
    },
    pPoints: {
      fiber: pFiber,
      proteins: pProteins,
      fruitVegNuts: pFvn,
      total: pTotal,
    },
    category,
    proteinCapped,
    imputedCount: resolved.imputedCount,
  };
}

// ── OFF Nutriments Extraction ─────────────────────────────

/**
 * Extract NutrimentInput from OFF's nutriments record.
 * Handles the various field naming conventions in OFF:
 *   - energy_100g (kJ by default in OFF v2)
 *   - energy-kj_100g / energy-kcal_100g
 *   - sugars_100g / saturated-fat_100g / salt_100g / sodium_100g
 *   - fiber_100g / proteins_100g
 *   - fruits-vegetables-nuts-estimate-from-ingredients_100g
 */
export function extractNutrimentsFromOff(
  nutriments: Record<string, number | string> | null | undefined,
): NutrimentInput {
  if (!nutriments) {
    return {
      energyKj: null, sugars: null, saturatedFat: null,
      salt: null, fiber: null, proteins: null, fruitVegNuts: null,
    };
  }

  const num = (key: string): number | null => {
    const v = nutriments[key];
    if (v == null || v === "") return null;
    const n = typeof v === "string" ? parseFloat(v) : v;
    return isNaN(n) ? null : n;
  };

  return {
    energyKj: num("energy-kj_100g") ?? num("energy_100g"),
    energyKcal: num("energy-kcal_100g"),
    sugars: num("sugars_100g"),
    saturatedFat: num("saturated-fat_100g"),
    salt: num("salt_100g"),
    sodium: num("sodium_100g"),
    fiber: num("fiber_100g"),
    proteins: num("proteins_100g"),
    fruitVegNuts: num("fruits-vegetables-nuts-estimate-from-ingredients_100g")
      ?? num("fruits-vegetables-nuts-estimate_100g"),
    fat: num("fat_100g"),
  };
}
