/**
 * Diet Detection Service — Auto-detects dietary concerns from product data.
 *
 * Pure synchronous service — no DB, no Redis, no side effects.
 * Analyses ingredients, labels, allergens, and additives to determine
 * 5 dietary concerns: gluten, lactose, palm oil, vegetarian, vegan.
 *
 * Inspired by Yuka's diet system (5 auto-detected concerns).
 * Data sources: OFF ingredientsAnalysisTags, allergensTags, labelsTags,
 * ingredientsText, and Naqiy additives DB (isVegetarian/isVegan columns).
 */

import type { Product } from "../db/schema/products.js";

// ── Types ───────────────────────────────────────────────────

export interface DietaryAnalysis {
  containsGluten: boolean | null;
  containsLactose: boolean | null;
  containsPalmOil: boolean | null;
  isVegetarian: boolean | null;
  isVegan: boolean | null;
}

export interface AdditiveForDiet {
  code: string;
  isVegetarian: boolean | null;
  isVegan: boolean | null;
}

// ── Regex Patterns ──────────────────────────────────────────

// Gluten-containing cereals (Codex Alimentarius list)
// Note: \b doesn't work with accented chars in JS regex — use lookahead/lookbehind or simpler patterns
const GLUTEN_INGREDIENTS_RE =
  /(?:^|[\s,;.(\/\-])(?:bl[eé]|wheat|orge|barley|seigle|rye|avoine|oat|[eé]peautre|spelt|kamut|triticale|malt|gluten|seitan|froment|semoule|semolina|couscous|boulgour|bulgur|f[eé]cule de bl[eé])(?:$|[\s,;.)\/\-%])/i;

// Allergen tags from OFF that indicate gluten
const GLUTEN_ALLERGEN_TAGS = [
  "en:gluten",
  "en:wheat",
  "en:barley",
  "en:rye",
  "en:oats",
  "en:spelt",
  "en:kamut",
];

// Labels indicating gluten-free
const GLUTEN_FREE_LABELS = [
  "en:gluten-free",
  "en:no-gluten",
  "fr:sans-gluten",
];

// Lactose/dairy ingredients
const LACTOSE_INGREDIENTS_RE =
  /\b(lait|milk|lactose|lactos[eé]rum|whey|cas[eé]ine|casein|beurre|butter|cr[eè]me|cream|fromage|cheese|yaourt|yogurt|yoghourt|petit-lait|buttermilk|babeurre|lact[eé]al|dairy|prot[eé]ines? de lait|milk protein|lactalbumine|lactoglobuline)\b/i;

const LACTOSE_ALLERGEN_TAGS = [
  "en:milk",
  "en:lactose",
];

const LACTOSE_FREE_LABELS = [
  "en:lactose-free",
  "en:no-lactose",
  "en:dairy-free",
  "en:no-dairy",
  "fr:sans-lactose",
  "fr:sans-lait",
];

// Palm oil ingredients
const PALM_OIL_INGREDIENTS_RE =
  /\b(huile de palme|palm oil|palmiste|palm kernel|palme|palmitic|palmitique|graisse de palme|palm fat|huile v[eé]g[eé]tale de palme|glyc[eé]rine de palme|ol[eé]ine de palme|palm olein|st[eé]arine de palme|palm stearin)\b/i;

// OFF tags for confirmed palm oil presence
const PALM_OIL_ANALYSIS_TAGS = [
  "en:palm-oil",
];
// Tags that indicate uncertainty — treated as null (unknown), not true
const PALM_OIL_UNKNOWN_TAGS = [
  "en:palm-oil-content-unknown",
  "en:may-contain-palm-oil",
];

const PALM_OIL_FREE_LABELS = [
  "en:palm-oil-free",
  "en:no-palm-oil",
  "fr:sans-huile-de-palme",
];

// Vegan-incompatible ingredients
const NON_VEGAN_INGREDIENTS_RE =
  /\b(lait|milk|oeuf|egg|miel|honey|g[eé]latine|gelatin|beurre|butter|cr[eè]me|cream|fromage|cheese|yaourt|yogurt|cas[eé]ine|casein|lactos[eé]rum|whey|carmine|cochenille|cire d'abeille|beeswax|lanoline|lanolin|suif|tallow|saindoux|lard|shellac|gomme laque|anchois|anchovy|poisson|fish|crustac[eé]|crustacean|mollusque|mollusk|viande|meat|poulet|chicken|boeuf|beef|porc|pork|agneau|lamb|canard|duck)\b/i;

// Vegetarian-incompatible ingredients (subset — no dairy/eggs which are vegetarian-compatible)
const NON_VEGETARIAN_INGREDIENTS_RE =
  /\b(g[eé]latine|gelatin|pr[eé]sure|rennet|carmine|cochenille|suif|tallow|saindoux|lard|anchois|anchovy|poisson|fish|crustac[eé]|crustacean|mollusque|mollusk|viande|meat|poulet|chicken|boeuf|beef|porc|pork|agneau|lamb|canard|duck|shellac|gomme laque|isinglass|colle de poisson|chitine|chitin)\b/i;

// OFF analysis tags for vegan/vegetarian
const VEGAN_ANALYSIS_TAGS = {
  yes: ["en:vegan"],
  no: ["en:non-vegan", "en:maybe-vegan"],
};

const VEGETARIAN_ANALYSIS_TAGS = {
  yes: ["en:vegetarian"],
  no: ["en:non-vegetarian", "en:maybe-vegetarian"],
};

const VEGAN_LABELS = [
  "en:vegan",
  "fr:vegan",
  "fr:v\u00e9gan",
];

const VEGETARIAN_LABELS = [
  "en:vegetarian",
  "fr:v\u00e9g\u00e9tarien",
];

// ── Helpers ─────────────────────────────────────────────────

function hasAnyTag(productTags: string[] | null | undefined, targetTags: string[]): boolean {
  if (!productTags || productTags.length === 0) return false;
  const normalized = new Set(productTags.map(t => t.toLowerCase().trim()));
  return targetTags.some(t => normalized.has(t));
}

function getIngredientsText(product: Product): string {
  const parts: string[] = [];
  if (product.ingredientsText) parts.push(product.ingredientsText);
  if (product.ingredients && product.ingredients.length > 0) {
    parts.push(product.ingredients.join(" "));
  }
  return parts.join(" ");
}

// ── Main Detection ──────────────────────────────────────────

/**
 * Analyse les donnees produit pour detecter 5 concerns dietetiques.
 *
 * Logique par concern :
 *   1. Labels > Allergen tags > Ingredient text (priorite decroissante)
 *   2. null = donnees insuffisantes pour conclure
 *   3. Un label "sans X" l'emporte sur la detection textuelle (intentionnel)
 */
export function analyzeDietary(
  product: Product,
  additives: AdditiveForDiet[],
): DietaryAnalysis {
  const ingredientsText = getIngredientsText(product);
  const hasIngredients = ingredientsText.length > 0;
  const labels = product.labelsTags;
  const allergens = product.allergensTags;
  const analysisTags = product.ingredientsAnalysisTags;

  return {
    containsGluten: detectGluten(ingredientsText, hasIngredients, labels, allergens),
    containsLactose: detectLactose(ingredientsText, hasIngredients, labels, allergens),
    containsPalmOil: detectPalmOil(ingredientsText, hasIngredients, labels, analysisTags),
    isVegetarian: detectVegetarian(ingredientsText, hasIngredients, labels, analysisTags, additives),
    isVegan: detectVegan(ingredientsText, hasIngredients, labels, analysisTags, additives),
  };
}

// ── Gluten Detection ────────────────────────────────────────

function detectGluten(
  text: string,
  hasText: boolean,
  labels: string[] | null,
  allergens: string[] | null,
): boolean | null {
  // Label "sans gluten" → definitif false
  if (hasAnyTag(labels, GLUTEN_FREE_LABELS)) return false;

  // Allergen tags from OFF
  if (hasAnyTag(allergens, GLUTEN_ALLERGEN_TAGS)) return true;

  // Ingredient text analysis
  if (hasText) {
    return GLUTEN_INGREDIENTS_RE.test(text);
  }

  return null; // insufficient data
}

// ── Lactose Detection ───────────────────────────────────────

function detectLactose(
  text: string,
  hasText: boolean,
  labels: string[] | null,
  allergens: string[] | null,
): boolean | null {
  if (hasAnyTag(labels, LACTOSE_FREE_LABELS)) return false;
  if (hasAnyTag(allergens, LACTOSE_ALLERGEN_TAGS)) return true;
  if (hasText) {
    return LACTOSE_INGREDIENTS_RE.test(text);
  }
  return null;
}

// ── Palm Oil Detection ──────────────────────────────────────

function detectPalmOil(
  text: string,
  hasText: boolean,
  labels: string[] | null,
  analysisTags: string[] | null,
): boolean | null {
  if (hasAnyTag(labels, PALM_OIL_FREE_LABELS)) return false;

  // OFF ingredients_analysis_tags → most reliable source
  if (hasAnyTag(analysisTags, PALM_OIL_ANALYSIS_TAGS)) return true;
  // "unknown" / "may-contain" → treat as null, not confirmed
  if (hasAnyTag(analysisTags, PALM_OIL_UNKNOWN_TAGS)) return null;

  if (hasText) {
    return PALM_OIL_INGREDIENTS_RE.test(text);
  }
  return null;
}

// ── Vegetarian Detection ────────────────────────────────────

function detectVegetarian(
  text: string,
  hasText: boolean,
  labels: string[] | null,
  analysisTags: string[] | null,
  additives: AdditiveForDiet[],
): boolean | null {
  // Label "vegetarian" → true
  if (hasAnyTag(labels, VEGETARIAN_LABELS)) return true;

  // OFF analysis tags (structured, high-quality)
  if (hasAnyTag(analysisTags, VEGETARIAN_ANALYSIS_TAGS.no)) return false;
  if (hasAnyTag(analysisTags, VEGETARIAN_ANALYSIS_TAGS.yes)) return true;

  // Check additives (any non-vegetarian additive → false)
  const nonVegAdditive = additives.find(a => a.isVegetarian === false);
  if (nonVegAdditive) return false;

  // Ingredient text analysis
  if (hasText) {
    return !NON_VEGETARIAN_INGREDIENTS_RE.test(text);
  }

  return null;
}

// ── Vegan Detection ─────────────────────────────────────────

function detectVegan(
  text: string,
  hasText: boolean,
  labels: string[] | null,
  analysisTags: string[] | null,
  additives: AdditiveForDiet[],
): boolean | null {
  // Label "vegan" → true
  if (hasAnyTag(labels, VEGAN_LABELS)) return true;

  // OFF analysis tags
  if (hasAnyTag(analysisTags, VEGAN_ANALYSIS_TAGS.no)) return false;
  if (hasAnyTag(analysisTags, VEGAN_ANALYSIS_TAGS.yes)) return true;

  // Check additives (any non-vegan additive → false)
  const nonVeganAdditive = additives.find(a => a.isVegan === false);
  if (nonVeganAdditive) return false;

  // Ingredient text analysis
  if (hasText) {
    return !NON_VEGAN_INGREDIENTS_RE.test(text);
  }

  return null;
}
