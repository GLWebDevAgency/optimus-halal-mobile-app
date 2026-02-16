import { env } from "../lib/env.js";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { db } from "../db/index.js";
import { additives, additiveMadhabRulings } from "../db/schema/index.js";
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
        "User-Agent": "OptimusHalal/1.0 (contact@optimus-sila.com)",
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
  analysisSource: string;
}

export interface HalalReason {
  type: "ingredient" | "additive" | "label" | "analysis_tag";
  name: string;
  status: "haram" | "doubtful" | "halal";
  explanation: string;
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
    .where(inArray(additives.code, codes));

  const results: AdditiveAnalysisResult[] = [];

  for (const add of dbAdditives) {
    let madhabOverride: AdditiveAnalysisResult["madhabOverride"] = undefined;

    if (madhab !== "general") {
      const [ruling] = await db
        .select()
        .from(additiveMadhabRulings)
        .where(
          and(
            eq(additiveMadhabRulings.additiveCode, add.code),
            eq(additiveMadhabRulings.madhab, madhab)
          )
        )
        .limit(1);

      if (ruling) {
        madhabOverride = {
          ruling: ruling.ruling as HalalStatus,
          explanation: ruling.explanationFr,
        };
      }
    }

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

// ── Halal Keywords ──────────────────────────────────────────

const HARAM_INGREDIENTS = [
  "porc", "pork", "gelatin", "gélatine", "lard", "saindoux",
  "alcool", "alcohol", "ethanol", "éthanol", "wine", "vin",
  "bière", "beer", "rhum", "rum", "whisky", "vodka", "brandy",
  "carmine", "cochineal",
];

const DOUBTFUL_INGREDIENTS = [
  "mono-", "diglycerides", "monoglycérides",
  "whey", "lactosérum",
  "rennet", "présure",
];

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
    const halalLabel = labelsTags.find((tag) =>
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
        explanation: "Label halal certifié détecté sur le produit",
      });

      return {
        status: "halal",
        confidence: 0.95,
        tier: "certified",
        reasons,
        certifierName: certName,
        analysisSource: "Label certifié OpenFoodFacts",
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
      reasons.push({
        type: "additive",
        name: `${add.code} (${add.name})`,
        status: add.halalStatus as "halal" | "haram" | "doubtful",
        explanation: add.madhabOverride
          ? `${add.explanation} (selon école ${options.madhab})`
          : add.explanation,
      });

      if (add.halalStatus === "haram") {
        worstStatus = "haram";
        worstConfidence = Math.max(worstConfidence, 0.9);
      } else if (add.halalStatus === "doubtful" && worstStatus !== "haram") {
        worstStatus = "doubtful";
        worstConfidence = Math.max(worstConfidence, 0.6);
      }
    }
  }

  // Check ingredients text
  if (ingredientsText) {
    const lower = ingredientsText.toLowerCase();

    for (const keyword of HARAM_INGREDIENTS) {
      if (lower.includes(keyword)) {
        reasons.push({
          type: "ingredient",
          name: keyword,
          status: "haram",
          explanation: getHaramExplanation(keyword),
        });
        worstStatus = "haram";
        worstConfidence = Math.max(worstConfidence, 0.85);
      }
    }

    if (worstStatus !== "haram") {
      for (const keyword of DOUBTFUL_INGREDIENTS) {
        if (lower.includes(keyword)) {
          const isVegan = ingredientsAnalysisTags?.includes("en:vegan");
          if (isVegan) {
            reasons.push({
              type: "ingredient",
              name: keyword,
              status: "halal",
              explanation: `${keyword} — produit labellisé vegan, donc origine végétale`,
            });
          } else {
            reasons.push({
              type: "ingredient",
              name: keyword,
              status: "doubtful",
              explanation: getDoubtfulExplanation(keyword),
            });
            if (worstStatus !== "doubtful") {
              worstStatus = "doubtful";
            }
            worstConfidence = Math.max(worstConfidence, 0.6);
          }
        }
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
        analysisSource: "Analyse automatique Optimus",
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
        analysisSource: "Analyse automatique Optimus",
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
        analysisSource: "Analyse automatique Optimus",
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
      analysisSource: "Analyse automatique Optimus",
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

// ── Explanation helpers ─────────────────────────────────────

function getHaramExplanation(keyword: string): string {
  const explanations: Record<string, string> = {
    porc: "Viande de porc — interdit (Sourate 2:173)",
    pork: "Viande de porc — interdit (Sourate 2:173)",
    gelatin: "Gélatine — généralement d'origine porcine",
    "gélatine": "Gélatine — généralement d'origine porcine",
    lard: "Graisse de porc",
    saindoux: "Graisse de porc",
    alcool: "Substance enivrante — interdit (Sourate 5:90)",
    alcohol: "Substance enivrante — interdit (Sourate 5:90)",
    ethanol: "Alcool éthylique — substance enivrante",
    "éthanol": "Alcool éthylique — substance enivrante",
    wine: "Vin — boisson alcoolisée",
    vin: "Vin — boisson alcoolisée",
    "bière": "Bière — boisson alcoolisée",
    beer: "Bière — boisson alcoolisée",
    rhum: "Rhum — boisson alcoolisée",
    rum: "Rhum — boisson alcoolisée",
    whisky: "Whisky — boisson alcoolisée",
    vodka: "Vodka — boisson alcoolisée",
    brandy: "Brandy — boisson alcoolisée",
    carmine: "Colorant E120 — extrait d'insectes (cochenille)",
    cochineal: "Cochenille — insecte utilisé comme colorant",
  };
  return explanations[keyword] ?? `Ingrédient haram détecté : ${keyword}`;
}

function getDoubtfulExplanation(keyword: string): string {
  const explanations: Record<string, string> = {
    "mono-": "Mono/diglycérides — origine animale ou végétale non précisée",
    diglycerides: "Diglycérides — origine animale ou végétale non précisée",
    "monoglycérides": "Monoglycérides — origine animale ou végétale non précisée",
    whey: "Lactosérum (whey) — procédé peut impliquer présure animale",
    "lactosérum": "Lactosérum — procédé peut impliquer présure animale",
    rennet: "Présure — enzyme souvent d'origine animale",
    "présure": "Présure — enzyme souvent d'origine animale",
  };
  return explanations[keyword] ?? `Ingrédient douteux : ${keyword}`;
}
