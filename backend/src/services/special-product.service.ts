/**
 * Special Product Detection Service — Polymorphic scoring for specific product types.
 *
 * Pure synchronous service — no DB, no Redis, no side effects.
 *
 * Inspired by Yuka's SpecialFoodProduct pattern (Honey, Salt, Chocolate):
 * - Certain products bypass NutriScore because it's irrelevant
 *   (Miel = 100% sucre par nature → NutriScore D/E non informatif)
 * - Instead, product-specific quality criteria are evaluated (pass/fail)
 *
 * Each special product type has:
 *   - Detection rules (category keywords, labels, ingredients)
 *   - Quality criteria specific to the product type
 *   - A flag indicating whether NutriScore should be bypassed
 */

import type { Product } from "../db/schema/products.js";

// ── Types ───────────────────────────────────────────────────

export type SpecialProductType = "honey" | "salt" | "chocolate" | "oil" | "coffee" | "tea";

export interface SpecialProductCriterion {
  /** i18n key for the criterion label */
  labelKey: string;
  /** Whether this criterion is met */
  pass: boolean;
  /** i18n key for detailed description */
  descriptionKey: string;
  /** Icon name (MaterialIcons) */
  icon: string;
}

export interface SpecialProductInfo {
  type: SpecialProductType;
  /** i18n key for the product type name */
  typeLabelKey: string;
  /** Quality criteria evaluated for this product */
  criteria: SpecialProductCriterion[];
  /** If true, NutriScore is not meaningful for this product */
  bypassNutriScore: boolean;
  /** Overall quality: ratio of passed criteria */
  qualityRatio: number;
}

// ── Detection Patterns ──────────────────────────────────────

interface SpecialProductDef {
  type: SpecialProductType;
  typeLabelKey: string;
  /** Category keywords for detection */
  categoryPatterns: RegExp;
  /** If any of these match searchText, skip detection (prevents false positives) */
  excludePatterns?: RegExp;
  /** Label tags that confirm the type */
  labelPatterns?: string[];
  bypassNutriScore: boolean;
  /** Function to evaluate criteria */
  evaluateCriteria: (product: Product) => SpecialProductCriterion[];
}

// ── Helpers ─────────────────────────────────────────────────

function hasLabel(product: Product, patterns: string[]): boolean {
  if (!product.labelsTags || product.labelsTags.length === 0) return false;
  const normalized = new Set(product.labelsTags.map(t => t.toLowerCase().trim()));
  return patterns.some(p => normalized.has(p));
}

function hasIngredient(product: Product, pattern: RegExp): boolean {
  const text = [
    product.ingredientsText ?? "",
    ...(product.ingredients ?? []),
  ].join(" ");
  return pattern.test(text);
}

function isBio(product: Product): boolean {
  return hasLabel(product, [
    "en:organic", "fr:bio", "fr:agriculture-biologique",
    "en:eu-organic", "en:ab-agriculture-biologique",
  ]);
}

function isOriginFrance(product: Product): boolean {
  if (product.originsTags?.some(t =>
    t.toLowerCase().includes("france") || t.toLowerCase().includes("fr:")
  )) return true;
  if (product.manufacturingPlaces?.toLowerCase().includes("france")) return true;
  if (product.countriesTags?.some(t =>
    t.toLowerCase().includes("france") || t === "en:france"
  )) return true;
  return false;
}

// ── Product Type Definitions ────────────────────────────────

const SPECIAL_PRODUCTS: SpecialProductDef[] = [
  // ── HONEY ──────────────────────────────────────────────
  {
    type: "honey",
    typeLabelKey: "specialProductHoney",
    categoryPatterns: /\b(miel|honey|honig)\b/i,
    bypassNutriScore: true,
    evaluateCriteria: (product) => {
      const criteria: SpecialProductCriterion[] = [];

      // Criterion 1: Origin (France, UE, non-UE)
      const originFr = isOriginFrance(product);
      criteria.push({
        labelKey: "specialHoneyOriginFrance",
        pass: originFr,
        descriptionKey: originFr ? "specialHoneyOriginFrancePass" : "specialHoneyOriginFranceFail",
        icon: originFr ? "flag" : "public",
      });

      // Criterion 2: Bio / Organic
      const bio = isBio(product);
      criteria.push({
        labelKey: "specialHoneyBio",
        pass: bio,
        descriptionKey: bio ? "specialHoneyBioPass" : "specialHoneyBioFail",
        icon: bio ? "eco" : "nature",
      });

      // Criterion 3: Pure honey (no added sugar/syrup)
      const hasAdded = hasIngredient(product, /\b(sucre|sugar|sirop|syrup|glucose|fructose|maltodextrine)\b/i);
      const isPure = !hasAdded;
      criteria.push({
        labelKey: "specialHoneyPure",
        pass: isPure,
        descriptionKey: isPure ? "specialHoneyPurePass" : "specialHoneyPureFail",
        icon: isPure ? "verified" : "warning",
      });

      return criteria;
    },
  },

  // ── SALT ───────────────────────────────────────────────
  {
    type: "salt",
    typeLabelKey: "specialProductSalt",
    categoryPatterns: /\b(sel de (table|mer|cuisine|guerande|l'himalaya)|sea salt|table salt|fleur de sel|sel marin|gros sel|sel fin|himalayan salt)\b/i,
    excludePatterns: /\b(caramel|cracker|chips|biscuit|confiserie|snack|bonbon)\b/i,
    bypassNutriScore: true,
    evaluateCriteria: (product) => {
      const criteria: SpecialProductCriterion[] = [];

      // Criterion 1: Sea salt vs refined
      const isSea = hasIngredient(product, /\b(sel de mer|sea salt|fleur de sel|sel marin|guerande|himalaya|sel gris)\b/i);
      criteria.push({
        labelKey: "specialSaltType",
        pass: isSea,
        descriptionKey: isSea ? "specialSaltSeaPass" : "specialSaltRefinedFail",
        icon: isSea ? "water-drop" : "grain",
      });

      // Criterion 2: No anti-caking agents
      const hasAntiCaking = hasIngredient(product, /\b(anti[- ]?agglom[eé]rant|anti[- ]?caking|e535|e536|e551|e552|e553|e554|e555|e556|e559|ferrocyanure|silice)\b/i);
      criteria.push({
        labelKey: "specialSaltNoAntiCaking",
        pass: !hasAntiCaking,
        descriptionKey: hasAntiCaking ? "specialSaltAntiCakingFail" : "specialSaltNoAntiCakingPass",
        icon: hasAntiCaking ? "science" : "check-circle",
      });

      // Criterion 3: Bio
      const bio = isBio(product);
      criteria.push({
        labelKey: "specialSaltBio",
        pass: bio,
        descriptionKey: bio ? "specialSaltBioPass" : "specialSaltBioFail",
        icon: "eco",
      });

      return criteria;
    },
  },

  // ── CHOCOLATE ──────────────────────────────────────────
  {
    type: "chocolate",
    typeLabelKey: "specialProductChocolate",
    categoryPatterns: /\b(chocolat|chocolate|cacao|cocoa)\b/i,
    excludePatterns: /\b(biscuit|cookie|c[eé]r[eé]al|gateau|cake|muesli|granola|confiserie|viennoiserie|brioche|tartine|cr[eê]pe|brownie|fondant|mousse|glace|ice.cream)\b/i,
    bypassNutriScore: false,
    evaluateCriteria: (product) => {
      const criteria: SpecialProductCriterion[] = [];

      // Criterion 1: Pure cocoa butter (no vegetable fats)
      const hasVegFat = hasIngredient(product, /\b(graisse v[eé]g[eé]tale|vegetable fat|huile de palme|palm oil|beurre de karit[eé]|shea butter|illipe|sal|mangue|kokum|colocoynthe)\b/i);
      criteria.push({
        labelKey: "specialChocolatePureCocoa",
        pass: !hasVegFat,
        descriptionKey: hasVegFat ? "specialChocolatePureCocoaFail" : "specialChocolatePureCocoaPass",
        icon: !hasVegFat ? "verified" : "warning",
      });

      // Criterion 2: Bio / Organic
      const bio = isBio(product);
      criteria.push({
        labelKey: "specialChocolateBio",
        pass: bio,
        descriptionKey: bio ? "specialChocolateBioPass" : "specialChocolateBioFail",
        icon: "eco",
      });

      // Criterion 3: No sweeteners (aspartame, sucralose, etc.)
      const hasSweetener = hasIngredient(product, /\b(aspartame|sucralose|saccharine|acesulfame|stevia|maltitol|sorbitol|xylitol|erythritol|e950|e951|e952|e954|e955|e960|e961|e962|e967|e968)\b/i);
      criteria.push({
        labelKey: "specialChocolateNoSweetener",
        pass: !hasSweetener,
        descriptionKey: hasSweetener ? "specialChocolateSweetenerFail" : "specialChocolateNoSweetenerPass",
        icon: !hasSweetener ? "check-circle" : "warning",
      });

      // Criterion 4: No palm oil
      const hasPalmOil = hasIngredient(product, /\b(huile de palme|palm oil|palmiste|palm kernel)\b/i);
      criteria.push({
        labelKey: "specialChocolateNoPalmOil",
        pass: !hasPalmOil,
        descriptionKey: hasPalmOil ? "specialChocolatePalmOilFail" : "specialChocolateNoPalmOilPass",
        icon: !hasPalmOil ? "check-circle" : "warning",
      });

      // Criterion 5: No additives (beyond lecithin E322)
      const additives = product.additivesTags ?? [];
      const meaningfulAdditives = additives.filter(a =>
        !a.includes("e322") && !a.includes("lecithin")
      );
      criteria.push({
        labelKey: "specialChocolateNoAdditives",
        pass: meaningfulAdditives.length === 0,
        descriptionKey: meaningfulAdditives.length === 0
          ? "specialChocolateNoAdditivesPass"
          : "specialChocolateAdditivesFail",
        icon: meaningfulAdditives.length === 0 ? "check-circle" : "science",
      });

      return criteria;
    },
  },

  // ── OIL ────────────────────────────────────────────────
  {
    type: "oil",
    typeLabelKey: "specialProductOil",
    categoryPatterns: /\b(huile d'olive|olive oil|huile de tournesol|sunflower oil|huile de colza|canola oil|rapeseed oil|huile de noix|walnut oil|huile de s[eé]same|sesame oil|huile d'argan|argan oil|huile de lin|linseed oil|flaxseed oil)\b/i,
    bypassNutriScore: false,
    evaluateCriteria: (product) => {
      const criteria: SpecialProductCriterion[] = [];

      // Criterion 1: Extra virgin / first cold press
      const isVirgin = hasIngredient(product, /\b(vierge extra|extra virgin|premi[eè]re pression [aà] froid|cold.pressed|first.press)\b/i)
        || hasLabel(product, ["en:extra-virgin-olive-oil", "fr:huile-d-olive-vierge-extra"]);
      criteria.push({
        labelKey: "specialOilExtraVirgin",
        pass: isVirgin,
        descriptionKey: isVirgin ? "specialOilExtraVirginPass" : "specialOilExtraVirginFail",
        icon: isVirgin ? "star" : "star-border",
      });

      // Criterion 2: Bio
      const bio = isBio(product);
      criteria.push({
        labelKey: "specialOilBio",
        pass: bio,
        descriptionKey: bio ? "specialOilBioPass" : "specialOilBioFail",
        icon: "eco",
      });

      // Criterion 3: Single origin (not a blend)
      const isBlend = hasIngredient(product, /\b(m[eé]lange|blend|mix|huiles v[eé]g[eé]tales)\b/i);
      criteria.push({
        labelKey: "specialOilSingleOrigin",
        pass: !isBlend,
        descriptionKey: isBlend ? "specialOilBlendFail" : "specialOilSingleOriginPass",
        icon: !isBlend ? "place" : "shuffle",
      });

      return criteria;
    },
  },

  // ── COFFEE ─────────────────────────────────────────────
  {
    type: "coffee",
    typeLabelKey: "specialProductCoffee",
    categoryPatterns: /\b(caf[eé](?!.*(boisson|drink|lait[eé]|latte))|coffee(?!.*(drink|beverage|milk))|espresso|arabica|robusta)\b/i,
    bypassNutriScore: true,
    evaluateCriteria: (product) => {
      const criteria: SpecialProductCriterion[] = [];

      // Criterion 1: Pure Arabica
      const isArabica = hasIngredient(product, /\b(arabica|100\s*%\s*arabica)\b/i);
      criteria.push({
        labelKey: "specialCoffeeArabica",
        pass: isArabica,
        descriptionKey: isArabica ? "specialCoffeeArabicaPass" : "specialCoffeeArabicaFail",
        icon: isArabica ? "local-cafe" : "coffee",
      });

      // Criterion 2: Bio
      const bio = isBio(product);
      criteria.push({
        labelKey: "specialCoffeeBio",
        pass: bio,
        descriptionKey: bio ? "specialCoffeeBioPass" : "specialCoffeeBioFail",
        icon: "eco",
      });

      // Criterion 3: Fair trade
      const fairTrade = hasLabel(product, [
        "en:fair-trade", "en:fairtrade", "fr:commerce-equitable",
        "en:max-havelaar", "en:rainforest-alliance",
      ]);
      criteria.push({
        labelKey: "specialCoffeeFairTrade",
        pass: fairTrade,
        descriptionKey: fairTrade ? "specialCoffeeFairTradePass" : "specialCoffeeFairTradeFail",
        icon: fairTrade ? "handshake" : "storefront",
      });

      return criteria;
    },
  },

  // ── TEA ────────────────────────────────────────────────
  {
    type: "tea",
    typeLabelKey: "specialProductTea",
    categoryPatterns: /\b(th[eé](?!.*(glac[eé]|ice|boisson))|tea(?!.*(ice|ready|drink|beverage))|infusion|rooibos|matcha|sencha|oolong|pu[- ]?erh)\b/i,
    bypassNutriScore: true,
    evaluateCriteria: (product) => {
      const criteria: SpecialProductCriterion[] = [];

      // Criterion 1: Bio
      const bio = isBio(product);
      criteria.push({
        labelKey: "specialTeaBio",
        pass: bio,
        descriptionKey: bio ? "specialTeaBioPass" : "specialTeaBioFail",
        icon: "eco",
      });

      // Criterion 2: No artificial flavors
      const hasArtificial = hasIngredient(product, /\b(ar[oô]me artificiel|artificial flavou?r|ar[oô]me de synth[eè]se)\b/i);
      criteria.push({
        labelKey: "specialTeaNoArtificial",
        pass: !hasArtificial,
        descriptionKey: hasArtificial ? "specialTeaArtificialFail" : "specialTeaNoArtificialPass",
        icon: !hasArtificial ? "check-circle" : "warning",
      });

      // Criterion 3: Fair trade
      const fairTrade = hasLabel(product, [
        "en:fair-trade", "en:fairtrade", "fr:commerce-equitable",
        "en:max-havelaar", "en:rainforest-alliance",
      ]);
      criteria.push({
        labelKey: "specialTeaFairTrade",
        pass: fairTrade,
        descriptionKey: fairTrade ? "specialTeaFairTradePass" : "specialTeaFairTradeFail",
        icon: fairTrade ? "handshake" : "storefront",
      });

      return criteria;
    },
  },
];

// ── Main Function ───────────────────────────────────────────

/**
 * Detects if a product is a "special" type and evaluates quality criteria.
 * Returns null if the product is not a special type.
 */
export function detectSpecialProduct(product: Product): SpecialProductInfo | null {
  const category = (product.category ?? "").toLowerCase();
  const categoryId = (product.categoryId ?? "").toLowerCase();
  const name = (product.name ?? "").toLowerCase();
  const searchText = `${category} ${categoryId} ${name}`;

  for (const def of SPECIAL_PRODUCTS) {
    if (!def.categoryPatterns.test(searchText)) continue;

    // Exclude false positives (e.g. "biscuit chocolaté" → not a chocolate product)
    if (def.excludePatterns?.test(searchText)) continue;

    // Additional label confirmation if defined
    if (def.labelPatterns && !hasLabel(product, def.labelPatterns)) continue;

    const criteria = def.evaluateCriteria(product);
    const passCount = criteria.filter(c => c.pass).length;
    const qualityRatio = criteria.length > 0 ? passCount / criteria.length : 0;

    return {
      type: def.type,
      typeLabelKey: def.typeLabelKey,
      criteria,
      bypassNutriScore: def.bypassNutriScore,
      qualityRatio,
    };
  }

  return null;
}
