import { env } from "../lib/env.js";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { db } from "../db/index.js";
import { additives, additiveMadhabRulings, ingredientRulings } from "../db/schema/index.js";
import type { IngredientRuling } from "../db/schema/ingredient-rulings.js";
import { eq, and, inArray } from "drizzle-orm";

// ── OpenFoodFacts Types ─────────────────────────────────────

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  image_url?: string;
  image_front_url?: string;
  nutriments?: Record<string, number | string>;
  nutriscore_grade?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  labels?: string;
  labels_tags?: string[];
  countries?: string;
  allergens?: string;
  allergens_tags?: string[];
  traces?: string;
  traces_tags?: string[];
  additives_tags?: string[];
  ingredients_analysis_tags?: string[];
  manufacturing_places?: string;
  origins?: string;
}

export interface BarcodeResult {
  found: boolean;
  product?: OpenFoodFactsProduct;
}

const CACHE_TTL = 86400; // 24 hours

export async function lookupBarcode(barcode: string): Promise<BarcodeResult> {
  const cacheKey = `off:${barcode}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const url = `${env.OPENFOODFACTS_API_URL}/product/${barcode}.json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Naqiy/1.0 (contact@naqiy.com)",
      },
    });

    if (!response.ok) {
      return { found: false };
    }

    const data = (await response.json()) as { status: number; product?: Record<string, unknown> };

    if (data.status !== 1 || !data.product) {
      const result: BarcodeResult = { found: false };
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      return result;
    }

    const p = data.product;
    const product: OpenFoodFactsProduct = {
      code: (p.code as string) ?? barcode,
      product_name: p.product_name as string | undefined,
      brands: p.brands as string | undefined,
      categories: p.categories as string | undefined,
      ingredients_text: p.ingredients_text as string | undefined,
      image_url: p.image_url as string | undefined,
      image_front_url: p.image_front_url as string | undefined,
      nutriments: p.nutriments as Record<string, number | string> | undefined,
      nutriscore_grade: p.nutriscore_grade as string | undefined,
      nova_group: p.nova_group as number | undefined,
      ecoscore_grade: p.ecoscore_grade as string | undefined,
      labels: p.labels as string | undefined,
      labels_tags: p.labels_tags as string[] | undefined,
      countries: p.countries as string | undefined,
      allergens: p.allergens as string | undefined,
      allergens_tags: p.allergens_tags as string[] | undefined,
      traces: p.traces as string | undefined,
      traces_tags: p.traces_tags as string[] | undefined,
      additives_tags: p.additives_tags as string[] | undefined,
      ingredients_analysis_tags: p.ingredients_analysis_tags as string[] | undefined,
      manufacturing_places: p.manufacturing_places as string | undefined,
      origins: p.origins as string | undefined,
    };

    const result: BarcodeResult = { found: true, product };
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    return result;
  } catch (error) {
    logger.error("Echec recherche OpenFoodFacts", { barcode, error: error instanceof Error ? error.message : String(error) });
    return { found: false };
  }
}

// ── Halal Analysis v3 — Madhab-Aware + DB-Backed ───────────

export type HalalStatus = "halal" | "haram" | "doubtful" | "unknown";
export type HalalTier = "certified" | "analyzed_clean" | "doubtful" | "haram";
export type Madhab = "hanafi" | "shafii" | "maliki" | "hanbali" | "general";
export type HalalStrictness = "relaxed" | "moderate" | "strict" | "very_strict";

export interface HalalAnalysis {
  status: HalalStatus;
  confidence: number;
  tier: HalalTier;
  reasons: HalalReason[];
  certifierName: string | null;
  certifierId: string | null;
  analysisSource: string;
}

export interface HalalReason {
  type: "ingredient" | "additive" | "label" | "analysis_tag";
  name: string;
  status: "haram" | "doubtful" | "halal";
  explanation: string;
  scholarlyReference?: string | null;
  fatwaSourceName?: string | null;
  category?: string | null;
}

export interface HalalAnalysisOptions {
  madhab: Madhab;
  strictness: HalalStrictness;
}

// ── DB-Backed Additive Lookup ───────────────────────────────

interface AdditiveAnalysisResult {
  code: string;
  name: string;
  halalStatus: HalalStatus;
  explanation: string;
  toxicityLevel: string;
  riskPregnant: boolean;
  riskChildren: boolean;
  riskAllergic: boolean;
  madhabOverride?: {
    ruling: HalalStatus;
    explanation: string;
  };
}

async function lookupAdditives(
  tags: string[],
  madhab: Madhab
): Promise<AdditiveAnalysisResult[]> {
  // Normalize: "en:e322i" → "E322"
  const codes = [
    ...new Set(
      tags.map((t) =>
        t
          .replace(/^en:/, "")
          .toUpperCase()
          .replace(/[a-z]$/i, "")
      )
    ),
  ];

  if (codes.length === 0) return [];

  const dbAdditives = await db
    .select()
    .from(additives)
    .where(inArray(additives.code, codes))
    .orderBy(additives.code);

  // Batch-fetch madhab rulings in a single query (avoids N+1)
  const madhabRulingsMap = new Map<string, { ruling: HalalStatus; explanation: string }>();

  if (madhab !== "general" && dbAdditives.length > 0) {
    const additiveCodes = dbAdditives.map((a) => a.code);
    const rulings = await db
      .select()
      .from(additiveMadhabRulings)
      .where(
        and(
          inArray(additiveMadhabRulings.additiveCode, additiveCodes),
          eq(additiveMadhabRulings.madhab, madhab)
        )
      );

    for (const ruling of rulings) {
      madhabRulingsMap.set(ruling.additiveCode, {
        ruling: ruling.ruling as HalalStatus,
        explanation: ruling.explanationFr,
      });
    }
  }

  const results: AdditiveAnalysisResult[] = [];

  for (const add of dbAdditives) {
    const madhabOverride = madhabRulingsMap.get(add.code) ?? undefined;

    results.push({
      code: add.code,
      name: add.nameFr,
      halalStatus: (madhabOverride?.ruling ?? add.halalStatusDefault) as HalalStatus,
      explanation: madhabOverride?.explanation ?? add.halalExplanationFr ?? "",
      toxicityLevel: add.toxicityLevel,
      riskPregnant: add.riskPregnant,
      riskChildren: add.riskChildren,
      riskAllergic: add.riskAllergic,
      madhabOverride,
    });
  }

  // Fallback: check tags not found in DB against the hardcoded map
  for (const tag of tags) {
    const code = tag
      .replace(/^en:/, "")
      .toUpperCase()
      .replace(/[a-z]$/i, "");
    if (!dbAdditives.find((a) => a.code === code)) {
      const fallback = ADDITIVES_HALAL_DB[tag.toLowerCase()];
      if (fallback) {
        results.push({
          code,
          name: fallback.name,
          halalStatus: fallback.status,
          explanation: fallback.explanation,
          toxicityLevel: "safe",
          riskPregnant: false,
          riskChildren: false,
          riskAllergic: false,
        });
      }
    }
  }

  return results;
}

// ── Legacy Additives Fallback (kept for tags not yet in DB) ─

interface AdditiveInfo {
  name: string;
  status: "halal" | "haram" | "doubtful";
  explanation: string;
}

const ADDITIVES_HALAL_DB: Record<string, AdditiveInfo> = {
  "en:e100":  { name: "Curcumine", status: "halal", explanation: "Origine végétale" },
  "en:e101":  { name: "Riboflavine", status: "halal", explanation: "Synthétique ou végétal" },
  "en:e120":  { name: "Carmine / Cochenille", status: "haram", explanation: "Colorant extrait d'insectes (cochenille)" },
  "en:e122":  { name: "Azorubine", status: "halal", explanation: "Colorant synthétique" },
  "en:e133":  { name: "Bleu brillant", status: "halal", explanation: "Colorant synthétique" },
  "en:e150a": { name: "Caramel", status: "halal", explanation: "Sucre caramélisé" },
  "en:e160a": { name: "Bêta-carotène", status: "halal", explanation: "Origine végétale" },
  "en:e160b": { name: "Annatto", status: "halal", explanation: "Origine végétale" },
  "en:e170":  { name: "Carbonate de calcium", status: "halal", explanation: "Minéral" },
  "en:e200":  { name: "Acide sorbique", status: "halal", explanation: "Synthétique" },
  "en:e202":  { name: "Sorbate de potassium", status: "halal", explanation: "Synthétique" },
  "en:e270":  { name: "Acide lactique", status: "halal", explanation: "Fermentation végétale" },
  "en:e300":  { name: "Acide ascorbique", status: "halal", explanation: "Vitamine C synthétique" },
  "en:e322":  { name: "Lécithine", status: "halal", explanation: "Généralement d'origine soja" },
  "en:e322i": { name: "Lécithine", status: "halal", explanation: "Généralement d'origine soja" },
  "en:e330":  { name: "Acide citrique", status: "halal", explanation: "Fermentation" },
  "en:e331":  { name: "Citrate de sodium", status: "halal", explanation: "Dérivé acide citrique" },
  "en:e334":  { name: "Acide tartrique", status: "halal", explanation: "Origine végétale" },
  "en:e400":  { name: "Acide alginique", status: "halal", explanation: "Algues marines" },
  "en:e407":  { name: "Carraghénane", status: "halal", explanation: "Algues marines" },
  "en:e410":  { name: "Gomme de caroube", status: "halal", explanation: "Origine végétale" },
  "en:e412":  { name: "Gomme guar", status: "halal", explanation: "Origine végétale" },
  "en:e414":  { name: "Gomme arabique", status: "halal", explanation: "Origine végétale" },
  "en:e415":  { name: "Gomme xanthane", status: "halal", explanation: "Fermentation bactérienne" },
  "en:e420":  { name: "Sorbitol", status: "halal", explanation: "Origine végétale" },
  "en:e440":  { name: "Pectine", status: "halal", explanation: "Origine végétale (fruits)" },
  "en:e441":  { name: "Gélatine", status: "haram", explanation: "Généralement d'origine porcine" },
  "en:e460":  { name: "Cellulose", status: "halal", explanation: "Origine végétale" },
  "en:e471":  { name: "Mono/diglycérides", status: "doubtful", explanation: "Origine animale ou végétale non précisée" },
  "en:e472a": { name: "Esters acétiques", status: "doubtful", explanation: "Origine animale ou végétale non précisée" },
  "en:e472b": { name: "Esters lactiques", status: "doubtful", explanation: "Origine animale ou végétale non précisée" },
  "en:e472c": { name: "Esters citriques", status: "doubtful", explanation: "Origine animale ou végétale non précisée" },
  "en:e472e": { name: "Esters diacétyl-tartriques", status: "doubtful", explanation: "Origine animale ou végétale non précisée" },
  "en:e473":  { name: "Esters de sucrose", status: "doubtful", explanation: "Origine animale ou végétale non précisée" },
  "en:e474":  { name: "Sucroglycérides", status: "doubtful", explanation: "Origine animale ou végétale non précisée" },
  "en:e475":  { name: "Esters polyglycérol", status: "doubtful", explanation: "Origine animale ou végétale non précisée" },
  "en:e476":  { name: "Polyricinoléate", status: "halal", explanation: "Huile de ricin" },
  "en:e481":  { name: "Stéaroyl lactylate de sodium", status: "doubtful", explanation: "Acide stéarique — origine variable" },
  "en:e491":  { name: "Monostéarate de sorbitan", status: "doubtful", explanation: "Acide stéarique — origine variable" },
  "en:e500":  { name: "Bicarbonate de sodium", status: "halal", explanation: "Minéral" },
  "en:e542":  { name: "Phosphate d'os", status: "haram", explanation: "Origine animale (os)" },
  "en:e570":  { name: "Acide stéarique", status: "doubtful", explanation: "Origine animale ou végétale non précisée" },
  "en:e631":  { name: "Inosinate disodique", status: "doubtful", explanation: "Peut être d'origine animale" },
  "en:e635":  { name: "Ribonucléotides", status: "doubtful", explanation: "Peut être d'origine animale" },
  "en:e901":  { name: "Cire d'abeille", status: "halal", explanation: "Produit d'abeille — halal par consensus" },
  "en:e904":  { name: "Shellac", status: "doubtful", explanation: "Résine d'insecte (lac)" },
  "en:e920":  { name: "L-Cystéine", status: "doubtful", explanation: "Peut être extraite de plumes ou cheveux" },
  "en:e966":  { name: "Lactitol", status: "halal", explanation: "Dérivé du lactose" },
};

// ── Ingredient Rulings Engine v4 — DB-Driven ────────────────

export interface MatchedIngredientRuling {
  pattern: string;
  ruling: HalalStatus;
  confidence: number;
  explanationFr: string;
  explanationEn: string | null;
  scholarlyReference: string | null;
  fatwaSourceUrl: string | null;
  fatwaSourceName: string | null;
  category: string | null;
  priority: number;
  rulingHanafi: HalalStatus | null;
  rulingShafii: HalalStatus | null;
  rulingMaliki: HalalStatus | null;
  rulingHanbali: HalalStatus | null;
}

// In-memory cache — 47 rows, refreshed every 10 min
let _ingredientRulingsCache: IngredientRuling[] | null = null;
let _ingredientRulingsCacheTs = 0;
const INGREDIENT_RULINGS_CACHE_TTL = 600_000; // 10 minutes

/** @internal — Exposed for test cleanup only */
export function _resetIngredientRulingsCache(): void {
  _ingredientRulingsCache = null;
  _ingredientRulingsCacheTs = 0;
}

async function getIngredientRulings(): Promise<IngredientRuling[]> {
  const now = Date.now();
  if (_ingredientRulingsCache && now - _ingredientRulingsCacheTs < INGREDIENT_RULINGS_CACHE_TTL) {
    return _ingredientRulingsCache;
  }

  const rulings = await db
    .select()
    .from(ingredientRulings)
    .where(eq(ingredientRulings.isActive, true));

  _ingredientRulingsCache = rulings;
  _ingredientRulingsCacheTs = now;
  return rulings;
}

export function testPattern(text: string, pattern: string, matchType: string): boolean {
  switch (matchType) {
    case "exact":
      return text === pattern;
    case "contains":
      return text.includes(pattern);
    case "word_boundary": {
      // \b is ASCII-only — accented chars (é, è, ü…) create false boundaries.
      // e.g. "lactosérum" would match \brum\b because é is not [a-zA-Z0-9_].
      // Use Unicode-aware negative lookbehind/lookahead for word chars instead.
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const UWB = String.raw`(?<![a-zA-ZÀ-ÿ\d])`;  // Unicode word boundary start
      const UWE = String.raw`(?![a-zA-ZÀ-ÿ\d])`;    // Unicode word boundary end
      return new RegExp(`${UWB}${escaped}${UWE}`, "i").test(text);
    }
    case "regex": {
      try {
        return new RegExp(pattern, "i").test(text);
      } catch {
        logger.warn("Regex invalide dans ingredient_rulings", { pattern });
        return false;
      }
    }
    default:
      return false;
  }
}

export function resolveRulingForMadhab(ruling: IngredientRuling, madhab: Madhab): HalalStatus {
  if (madhab === "general") return ruling.rulingDefault as HalalStatus;

  const madhabRuling = ({
    hanafi: ruling.rulingHanafi,
    shafii: ruling.rulingShafii,
    maliki: ruling.rulingMaliki,
    hanbali: ruling.rulingHanbali,
  } as const)[madhab];

  return (madhabRuling ?? ruling.rulingDefault) as HalalStatus;
}

export async function matchIngredientRulings(
  ingredientsText: string,
  madhab: Madhab,
): Promise<MatchedIngredientRuling[]> {
  const rulings = await getIngredientRulings();
  const lower = ingredientsText.toLowerCase();

  // Track which keywords are overridden by higher-priority compound matches
  const overrideMap = new Map<string, number>(); // keyword → highest priority that overrides it
  const directMatches: IngredientRuling[] = [];

  for (const ruling of rulings) {
    const pattern = ruling.compoundPattern.toLowerCase();
    if (!testPattern(lower, pattern, ruling.matchType)) continue;

    directMatches.push(ruling);

    // If this ruling overrides a keyword, record it
    if (ruling.overridesKeyword) {
      const key = ruling.overridesKeyword.toLowerCase();
      const existing = overrideMap.get(key) ?? 0;
      if (ruling.priority > existing) {
        overrideMap.set(key, ruling.priority);
      }
    }
  }

  // Sort by priority descending, deduplicate, and apply overrides
  const sorted = directMatches.sort((a, b) => b.priority - a.priority);
  const results: MatchedIngredientRuling[] = [];
  const seenPatterns = new Set<string>();

  for (const ruling of sorted) {
    const patternKey = ruling.compoundPattern.toLowerCase();
    if (seenPatterns.has(patternKey)) continue;

    // Check if this low-priority keyword is overridden
    const overridePriority = overrideMap.get(patternKey);
    if (overridePriority !== undefined && overridePriority > ruling.priority) {
      continue; // Overridden by a compound match
    }

    seenPatterns.add(patternKey);

    results.push({
      pattern: ruling.compoundPattern,
      ruling: resolveRulingForMadhab(ruling, madhab),
      confidence: ruling.confidence,
      explanationFr: ruling.explanationFr,
      explanationEn: ruling.explanationEn,
      scholarlyReference: ruling.scholarlyReference,
      fatwaSourceUrl: ruling.fatwaSourceUrl,
      fatwaSourceName: ruling.fatwaSourceName,
      category: ruling.category,
      priority: ruling.priority,
      rulingHanafi: ruling.rulingHanafi as HalalStatus | null,
      rulingShafii: ruling.rulingShafii as HalalStatus | null,
      rulingMaliki: ruling.rulingMaliki as HalalStatus | null,
      rulingHanbali: ruling.rulingHanbali as HalalStatus | null,
    });
  }

  return results;
}

// ── Halal Label Tags ────────────────────────────────────────

const HALAL_LABEL_TAGS = [
  "en:halal",
  "en:halal-certified",
  "fr:certifie-halal",
  "en:halal-food-authority",
  "en:muis-halal",
  "en:jakim-halal",
  "en:mui-halal",
  "fr:halal",
  "ar:halal",
];

// ── OFF labels_tags → certifiers DB ID mapping ──────────────
// Maps OpenFoodFacts certifier-specific label tags to our certifiers table IDs.
// Source: manual cross-reference of OFF taxonomy with certification-list.json.

export const LABEL_TAG_TO_CERTIFIER_ID: Record<string, string> = {
  "fr:a-votre-service":                                       "avs-a-votre-service",
  "fr:avs":                                                   "avs-a-votre-service",
  "fr:achahada":                                              "achahada",
  "fr:altakwa":                                               "altakwa",
  "fr:association-rituelle-de-la-grande-mosquee-de-lyon":     "argml-mosquee-de-lyon",
  "fr:mosquee-de-lyon":                                       "argml-mosquee-de-lyon",
  "fr:argml":                                                 "argml-mosquee-de-lyon",
  "fr:societe-francaise-de-controle-de-viande-halal":         "sfcvh-mosquee-de-paris",
  "fr:sfcvh":                                                 "sfcvh-mosquee-de-paris",
  "fr:mosquee-de-paris":                                      "sfcvh-mosquee-de-paris",
  "fr:arrissala":                                             "arrissala",
  "fr:halal-services":                                        "halal-services",
  "fr:european-halal-trust":                                  "european-halal-trust",
  "fr:halal-monitoring-committee":                            "halal-monitoring-committee",
  "en:halal-monitoring-committee":                            "halal-monitoring-committee",
  "fr:khalis-halal":                                          "khalis-halal",
  "fr:sidq":                                                  "sidq",
  "fr:muslim-conseil-international":                          "muslim-conseil-international-mci",
  "fr:mci":                                                   "muslim-conseil-international-mci",
  "fr:halal-correct":                                         "halal-correct",
  "fr:halal-polska":                                          "halal-polska",
  "fr:afcai":                                                 "afcai",
  "fr:acmif":                                                 "acmif-mosquee-d-evry",
  "fr:mosquee-d-evry":                                        "acmif-mosquee-d-evry",
  "fr:alamane":                                               "alamane",
  "fr:islamic-centre-aachen":                                 "islamic-centre-aachen",
  "en:islamic-centre-aachen":                                 "islamic-centre-aachen",
};

// ── Vegetal origin context detection ────────────────────────
// When the ingredients text explicitly states "(origine végétale)" near
// an additive, upgrade its status from doubtful → halal.
// Example: "mono - et diglycérides d'acides gras (origine végétale)"
// This is pure regex — no NLP needed.
const VEGETAL_QUALIFIERS_RE =
  /\(\s*(?:d[''])?origine\s+v[ée]g[ée]tale\s*\)|\(\s*v[ée]g[ée]tal(?:e)?\s*\)|\(\s*(?:plant|vegetable)\s+(?:origin|source)\s*\)/i;

function hasVegetalOriginContext(
  ingredientsText: string | undefined,
  searchTerms: string[],
): boolean {
  if (!ingredientsText) return false;
  const textLower = ingredientsText.toLowerCase();

  for (const rawTerm of searchTerms) {
    const term = rawTerm.toLowerCase();
    if (term.length < 3) continue;

    const idx = textLower.indexOf(term);
    if (idx === -1) continue;

    // Check a window of 150 chars after the match for a vegetal qualifier
    const windowEnd = Math.min(ingredientsText.length, idx + term.length + 150);
    const window = ingredientsText.substring(idx, windowEnd);
    if (VEGETAL_QUALIFIERS_RE.test(window)) return true;
  }

  return false;
}

// ── Main Analysis Function (v3 — async + madhab-aware) ─────

export async function analyzeHalalStatus(
  ingredientsText: string | undefined,
  additivesTags?: string[],
  labelsTags?: string[],
  ingredientsAnalysisTags?: string[],
  options: HalalAnalysisOptions = { madhab: "general", strictness: "moderate" },
): Promise<HalalAnalysis> {
  const reasons: HalalReason[] = [];

  // ── TIER 1: Check halal certification labels ──────────────
  if (labelsTags?.length) {
    // 1a. Try certifier-specific label tags first (e.g. fr:a-votre-service → avs)
    let matchedCertifierId: string | null = null;
    let matchedCertifierTag: string | null = null;
    for (const tag of labelsTags) {
      const certId = LABEL_TAG_TO_CERTIFIER_ID[tag.toLowerCase()];
      if (certId) {
        matchedCertifierId = certId;
        matchedCertifierTag = tag;
        break;
      }
    }

    // 1b. Fall back to generic halal labels
    const halalLabel = matchedCertifierTag ?? labelsTags.find((tag) =>
      HALAL_LABEL_TAGS.includes(tag.toLowerCase())
    );

    if (halalLabel) {
      const certName = halalLabel
        .replace("en:", "")
        .replace("fr:", "")
        .replace("ar:", "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      reasons.push({
        type: "label",
        name: certName,
        status: "halal",
        explanation: matchedCertifierId
          ? `Certifié par un organisme halal reconnu (${certName})`
          : "Label halal certifié détecté sur le produit",
      });

      return {
        status: "halal",
        confidence: 0.95,
        tier: "certified",
        reasons,
        certifierName: certName,
        certifierId: matchedCertifierId,
        analysisSource: matchedCertifierId
          ? "Naqiy · Certifieur identifié via OpenFoodFacts"
          : "Naqiy · Label certifié via OpenFoodFacts",
      };
    }
  }

  // ── TIER 2-4: Analyze ingredients + additives ─────────────

  let worstStatus: HalalStatus = "unknown";
  let worstConfidence = 0;

  // Check additives via DB + madhab rulings
  if (additivesTags?.length) {
    const additiveResults = await lookupAdditives(additivesTags, options.madhab);

    for (const add of additiveResults) {
      let effectiveStatus = add.halalStatus as "halal" | "haram" | "doubtful";
      let effectiveExplanation = add.madhabOverride
        ? `${add.explanation} (selon école ${options.madhab})`
        : add.explanation;

      // Vegetal origin override: upgrade doubtful → halal when text specifies plant source
      if (effectiveStatus === "doubtful" && hasVegetalOriginContext(
        ingredientsText,
        [add.code, ...add.name.split(/[/\s,()-]+/).filter((w) => w.length >= 4)],
      )) {
        effectiveStatus = "halal";
        effectiveExplanation = `${add.name} — origine végétale précisée par le fabricant`;
      }

      reasons.push({
        type: "additive",
        name: `${add.code} (${add.name})`,
        status: effectiveStatus,
        explanation: effectiveExplanation,
      });

      if (effectiveStatus === "haram") {
        worstStatus = "haram";
        worstConfidence = Math.max(worstConfidence, 0.9);
      } else if (effectiveStatus === "doubtful" && worstStatus !== "haram") {
        worstStatus = "doubtful";
        worstConfidence = Math.max(worstConfidence, 0.6);
      }
    }
  }

  // ── TIER 3: Check ingredients text via DB-driven rulings ──
  if (ingredientsText) {
    const matchedRulings = await matchIngredientRulings(
      ingredientsText,
      options.madhab,
    );

    const isVegan = ingredientsAnalysisTags?.includes("en:vegan");

    for (const match of matchedRulings) {
      let effectiveStatus = match.ruling;
      let explanation = match.explanationFr;

      // Vegan override: if product is vegan and ruling is doubtful, upgrade
      if (isVegan && effectiveStatus === "doubtful") {
        effectiveStatus = "halal";
        explanation = `${match.pattern} — produit labellisé vegan, donc origine végétale`;
      }
      // Vegetal origin override: text says "(origine végétale)" near the matched ingredient
      else if (effectiveStatus === "doubtful" && hasVegetalOriginContext(
        ingredientsText,
        [match.pattern],
      )) {
        effectiveStatus = "halal";
        explanation = `${match.pattern} — origine végétale précisée par le fabricant`;
      }

      reasons.push({
        type: "ingredient",
        name: match.pattern,
        status: effectiveStatus as "halal" | "haram" | "doubtful",
        explanation,
        scholarlyReference: match.scholarlyReference,
        fatwaSourceName: match.fatwaSourceName,
        category: match.category,
      });

      if (effectiveStatus === "haram") {
        worstStatus = "haram";
        worstConfidence = Math.max(worstConfidence, match.confidence);
      } else if (effectiveStatus === "doubtful" && worstStatus !== "haram") {
        worstStatus = "doubtful";
        worstConfidence = Math.max(worstConfidence, match.confidence);
      }
    }
  }

  // No ingredients at all → unknown
  if (!ingredientsText && (!additivesTags || additivesTags.length === 0)) {
    return applyStrictnessOverlay(
      {
        status: "unknown",
        confidence: 0,
        tier: "doubtful",
        reasons: [{ type: "ingredient", name: "—", status: "doubtful", explanation: "Aucun ingrédient disponible" }],
        certifierName: null,
        certifierId: null,
        analysisSource: "Analyse automatique Naqiy · Données OpenFoodFacts",
      },
      options.strictness
    );
  }

  // Determine final tier
  if (worstStatus === "haram") {
    return applyStrictnessOverlay(
      {
        status: "haram",
        confidence: worstConfidence,
        tier: "haram",
        reasons,
        certifierName: null,
        certifierId: null,
        analysisSource: "Analyse automatique Naqiy · Données OpenFoodFacts",
      },
      options.strictness
    );
  }

  if (worstStatus === "doubtful") {
    return applyStrictnessOverlay(
      {
        status: "doubtful",
        confidence: worstConfidence,
        tier: "doubtful",
        reasons,
        certifierName: null,
        certifierId: null,
        analysisSource: "Analyse automatique Naqiy · Données OpenFoodFacts",
      },
      options.strictness
    );
  }

  // No issues found → analyzed clean
  return applyStrictnessOverlay(
    {
      status: "halal",
      confidence: 0.8,
      tier: "analyzed_clean",
      reasons: reasons.length > 0 ? reasons : [{
        type: "ingredient",
        name: "Tous les ingrédients",
        status: "halal",
        explanation: "Aucun ingrédient haram ou douteux détecté",
      }],
      certifierName: null,
      certifierId: null,
      analysisSource: "Analyse automatique Naqiy · Données OpenFoodFacts",
    },
    options.strictness
  );
}

// ── Strictness Overlay ──────────────────────────────────────

function applyStrictnessOverlay(
  result: HalalAnalysis,
  strictness: HalalStrictness
): HalalAnalysis {
  switch (strictness) {
    case "relaxed":
      if (result.status === "doubtful") {
        return { ...result, status: "halal", confidence: 0.5 };
      }
      return result;
    case "strict":
      if (result.status === "doubtful") {
        return { ...result, confidence: Math.max(result.confidence, 0.7) };
      }
      return result;
    case "very_strict":
      if (result.tier !== "certified") {
        return {
          ...result,
          status: result.status === "haram" ? "haram" : "doubtful",
          confidence: result.status === "haram" ? result.confidence : 0.3,
        };
      }
      return result;
    default: // "moderate"
      return result;
  }
}

