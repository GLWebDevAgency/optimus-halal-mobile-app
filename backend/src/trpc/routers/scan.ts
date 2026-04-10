import { z } from "zod";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, quotaCheckedProcedure } from "../trpc.js";
import {
  scans,
  products,
  users,
  analysisRequests,
  boycottTargets,
  additives as additivesTable,
  additiveMadhabRulings,
  devices,
  scanFeedback,
} from "../../db/schema/index.js";
import {
  analyzeHalalStatus,
  matchIngredientRulings,
  smartExtractIngredients,
  type HalalAnalysis,
  type MatchedIngredientRuling,
  type OpenFoodFactsProduct,
} from "../../services/barcode.service.js";
import {
  resolveProduct,
  refreshProductInBackground,
  backfillProductFromOff,
  withResolvedImage,
} from "../../services/product-lookup.service.js";
import { matchAllergens } from "../../services/allergen.service.js";
import { computeHealthScore, checkScoreExclusion, type AdditiveForScore, type UserNutritionProfile, type ScoreExclusionReason } from "../../services/health-score.service.js";
import { getCertifierScores, getAllCertifierScores, getTrustGrade } from "../../services/certifier-score.service.js";
import { analyzeDietary, type DietaryAnalysis, type AdditiveForDiet } from "../../services/diet-detection.service.js";
import { computeNutrientBreakdown, type NutrientBreakdown } from "../../services/nutrient-thresholds.service.js";
import { detectSpecialProduct, type SpecialProductInfo } from "../../services/special-product.service.js";
import { reconcileNutriments, type ReconciliationReport } from "../../services/data-reconciler.service.js";
import { analyzeBeverage, type BeverageAnalysis } from "../../services/beverage-intelligence.service.js";

// ── Input Sanitization ─────────────────────────────────────
// Strip control characters, BOM, and normalize Unicode before
// passing text to the halal pattern matching engine.
// Note: Gemini AI path only needs stripNullBytes() — see barcode.service.ts.
function sanitizeIngredients(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars
    .replace(/\uFEFF/g, "") // BOM
    .normalize("NFC") // Unicode normalization
    .trim();
}

/** Normalize OFF additive tag to canonical DB code: "en:e322i" → "E322" */
function normalizeAdditiveTag(tag: string): string {
  return tag.replace(/^en:/, "").toUpperCase().replace(/[a-z]$/i, "");
}
import { lookupBrandCertifier } from "../../services/brand-certifier.service.js";
import { notFound } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { featureFlags as featureFlagsTable } from "../../db/schema/feature-flags.js";
import { ScanOrchestratorV2, type OrchestratorDeps } from "../../services/scan-orchestrator-v2.js";
import { HalalEngineV2 } from "../../domain/engine/halal-engine-v2.js";
import { CertifierTrustEngine } from "../../domain/engine/certifier-trust-engine.js";
import { DrizzleEvaluationStore } from "../../infra/adapters/drizzle-evaluation-store.js";
import { DrizzleDossierRepo } from "../../infra/adapters/drizzle-dossier-repo.js";
import { DrizzleScenarioRepo } from "../../infra/adapters/drizzle-scenario-repo.js";
import { DrizzleMadhabRulingRepo } from "../../infra/adapters/drizzle-madhab-ruling-repo.js";
import { DrizzleMatchPatternRepo } from "../../infra/adapters/drizzle-match-pattern-repo.js";
import { DrizzleCertifierTrustRepo } from "../../infra/adapters/drizzle-certifier-trust-repo.js";
import { aiExtractIngredientsV2 } from "../../services/ai-extract/index.js";
import type { RiskyAdditive } from "../../services/personal-engine.js";
import type { AllergenMatch as AllergenMatchReal } from "../../services/allergen.service.js";

// ── Level thresholds ──────────────────────────────────────────
// XP required to REACH each level (index = level - 1)
// Level 1: 0+, Level 2: 100+, Level 3: 300+, ... Level 10: 10000+
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];

function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

// ── Boycott check helper ────────────────────────────────────

async function checkBoycott(db: any, brand: string | null | undefined) {
  if (!brand) return { isBoycotted: false, targets: [] as any[] };

  const brandLower = brand.toLowerCase();
  const matches = await db
    .select()
    .from(boycottTargets)
    .where(
      and(
        eq(boycottTargets.isActive, true),
        sql`EXISTS (
          SELECT 1 FROM unnest(${boycottTargets.brands}) AS b
          WHERE lower(b) = ${brandLower}
          OR ${brandLower} LIKE '%' || lower(b) || '%'
          OR lower(b) LIKE '%' || ${brandLower} || '%'
        )`
      )
    );

  if (matches.length === 0) return { isBoycotted: false, targets: [] as any[] };

  return {
    isBoycotted: true,
    targets: matches.map((t: any) => ({
      id: t.id,
      companyName: t.companyName,
      boycottLevel: t.boycottLevel,
      severity: t.severity,
      reasonSummary: t.reasonSummary,
      sourceUrl: t.sourceUrl,
      sourceName: t.sourceName,
    })),
  };
}

// ── Madhab verdicts helper ─────────────────────────────────
// Fetches all 4 school rulings for problematic additives in one query,
// then computes a per-school verdict (worst status across additives).

const MADHAB_SCHOOLS = ["hanafi", "shafii", "maliki", "hanbali"] as const;

export interface MadhabVerdictItem {
  madhab: (typeof MADHAB_SCHOOLS)[number];
  status: "halal" | "doubtful" | "haram" | "unknown";
  conflictingAdditives: Array<{
    code: string;
    name: string;
    ruling: string;
    explanation: string;
    scholarlyReference: string | null;
  }>;
  conflictingIngredients: Array<{
    pattern: string;
    ruling: string;
    explanation: string;
    scholarlyReference: string | null;
  }>;
}

async function computeMadhabVerdicts(
  db: any,
  halalAnalysis: HalalAnalysis | null,
  ingredientRulingsData: MatchedIngredientRuling[] = [],
): Promise<MadhabVerdictItem[]> {
  if (!halalAnalysis) return [];

  // If analysis concluded "unknown" (no ingredients/additives to analyze),
  // all schools have insufficient data — never default to "halal"
  if (halalAnalysis.status === "unknown") {
    return MADHAB_SCHOOLS.map((m) => ({
      madhab: m,
      status: "unknown" as const,
      conflictingAdditives: [],
      conflictingIngredients: [],
    }));
  }

  // If product is certified halal → all schools agree
  if (halalAnalysis.tier === "certified") {
    return MADHAB_SCHOOLS.map((m) => ({
      madhab: m,
      status: "halal" as const,
      conflictingAdditives: [],
      conflictingIngredients: [],
    }));
  }

  // Extract ALL additive codes from analysis reasons (format: "E441 (Gélatine)")
  // allAdditiveCodes: used to suppress Tier 3 patterns that alias Tier 2 additives
  // nonHalalAdditiveCodes: used for madhab-specific DB lookup
  const allAdditiveCodes = halalAnalysis.reasons
    .filter((r) => r.type === "additive")
    .map((r) => r.name.split(" ")[0])
    .filter((code) => /^E\d+[a-z]?$/i.test(code));
  const additiveCodes = allAdditiveCodes.filter((code) => {
    const reason = halalAnalysis.reasons.find(
      (r) => r.type === "additive" && r.name.split(" ")[0] === code,
    );
    return reason?.status !== "halal";
  });

  // Fetch all madhab rulings + additive names in one join query
  let additivesByMadhab = new Map<string, RulingRow[]>();

  if (additiveCodes.length > 0) {
    const rulings = await db
      .select({
        additiveCode: additiveMadhabRulings.additiveCode,
        madhab: additiveMadhabRulings.madhab,
        ruling: additiveMadhabRulings.ruling,
        explanationFr: additiveMadhabRulings.explanationFr,
        scholarlyReference: additiveMadhabRulings.scholarlyReference,
        additiveName: additivesTable.nameFr,
      })
      .from(additiveMadhabRulings)
      .innerJoin(
        additivesTable,
        eq(additiveMadhabRulings.additiveCode, additivesTable.code)
      )
      .where(inArray(additiveMadhabRulings.additiveCode, additiveCodes));

    for (const r of rulings as RulingRow[]) {
      const list = additivesByMadhab.get(r.madhab) ?? [];
      list.push(r);
      additivesByMadhab.set(r.madhab, list);
    }
  }

  // Worst-status logic: haram > doubtful > halal
  const STATUS_WEIGHT = { haram: 3, doubtful: 2, halal: 1, unknown: 0 } as const;

  // Per-madhab field mapping for ingredient rulings
  const MADHAB_FIELD = {
    hanafi: "rulingHanafi",
    shafii: "rulingShafii",
    maliki: "rulingMaliki",
    hanbali: "rulingHanbali",
  } as const;

  // ── Tier 2→3 deduplication (computed once, shared across all 4 madhabs) ──
  // When an additive is evaluated by Tier 2 (with per-madhab rulings from
  // additive_madhab_rulings), its Tier 3 text aliases must be suppressed
  // to avoid double-counting. E.g., E471 already has precise per-madhab
  // rulings → suppress "mono-", "diglycerides", "monoglycerides" from Tier 3.
  const allAdditiveLower = new Set(allAdditiveCodes.map((c) => c.toLowerCase()));
  const E_CODE_ALIASES: Record<string, string[]> = {
    e471: ["mono-", "diglycerides", "monoglycerides", "diglycérides", "monoglycérides"],
    e441: ["gélatine", "gelatin", "gelatine"],
    e120: ["carmine", "cochineal", "carmin", "cochenille"],
    e542: ["phosphite"],
  };
  const suppressedPatterns = new Set<string>();
  for (const code of allAdditiveLower) {
    suppressedPatterns.add(code);
    for (const alias of E_CODE_ALIASES[code] ?? []) {
      suppressedPatterns.add(alias.toLowerCase());
    }
  }

  return MADHAB_SCHOOLS.map((madhab) => {
    // ── Additive conflicts ──
    const schoolRulings = additivesByMadhab.get(madhab) ?? [];
    const conflictingAdditives = schoolRulings.filter((r: RulingRow) => r.ruling !== "halal");

    // Start from neutral "halal" — let per-madhab additive + ingredient conflicts
    // determine the worst status. Previously this fell back to halalAnalysis.status
    // (the GLOBAL verdict) which caused all madhabs to show "doubtful" even when
    // a specific school considers the conflicting ingredient halal.
    let worstStatus: "halal" | "doubtful" | "haram" = schoolRulings.length > 0
      ? schoolRulings.reduce((worst: "halal" | "doubtful" | "haram", r: RulingRow) => {
          const w = STATUS_WEIGHT[r.ruling as keyof typeof STATUS_WEIGHT] ?? 0;
          const cw = STATUS_WEIGHT[worst as keyof typeof STATUS_WEIGHT] ?? 0;
          return w > cw ? (r.ruling as "halal" | "doubtful" | "haram") : worst;
        }, "halal" as "halal" | "doubtful" | "haram")
      : "halal";
    const conflictingIngredients = ingredientRulingsData
      .filter((ir) => {
        const patternLower = ir.pattern.toLowerCase();
        // Skip if this pattern is an E-number already covered by Tier 2
        if (allAdditiveLower.has(patternLower)) return false;
        // Skip if this pattern is an alias of a Tier 2 additive
        if (suppressedPatterns.has(patternLower)) return false;
        // Skip partial-match patterns (e.g. "mono-") that are substrings of a suppressed alias
        if ([...suppressedPatterns].some((sp) => patternLower.includes(sp) || sp.includes(patternLower))) return false;
        const madhabRuling = (ir[MADHAB_FIELD[madhab]] ?? ir.ruling) as string;
        return madhabRuling !== "halal";
      })
      .map((ir) => {
        const madhabRuling = (ir[MADHAB_FIELD[madhab]] ?? ir.ruling) as string;
        return {
          pattern: ir.pattern,
          ruling: madhabRuling,
          explanation: ir.explanationFr,
          scholarlyReference: ir.scholarlyReference,
        };
      });

    // Combine worst status from additives and ingredients
    for (const ci of conflictingIngredients) {
      const w = STATUS_WEIGHT[ci.ruling as keyof typeof STATUS_WEIGHT] ?? 0;
      const cw = STATUS_WEIGHT[worstStatus as keyof typeof STATUS_WEIGHT] ?? 0;
      if (w > cw) worstStatus = ci.ruling as "halal" | "doubtful" | "haram";
    }

    return {
      madhab,
      status: worstStatus,
      conflictingAdditives: conflictingAdditives.map((r: RulingRow) => ({
        code: r.additiveCode,
        name: r.additiveName ?? r.additiveCode,
        ruling: r.ruling,
        explanation: r.explanationFr,
        scholarlyReference: r.scholarlyReference,
      })),
      conflictingIngredients,
    };
  });
}

// Type for joined additive ruling rows
type RulingRow = {
  additiveCode: string;
  madhab: string;
  ruling: string;
  explanationFr: string;
  scholarlyReference: string | null;
  additiveName: string;
};

export const scanRouter = router({
  // ── Quota check — reads from devices table (source of truth) ──
  getQuota: publicProcedure.query(async ({ ctx }) => {
    // Premium → unlimited
    if (ctx.subscriptionTier === "premium") {
      return { used: 0, limit: null, remaining: null, unlimited: true, trialActive: false, trialDaysRemaining: 0 };
    }

    // Trial check from devices table
    if (ctx.device) {
      const { trialExpiresAt, convertedAt, lastScanDate, scansToday } = ctx.device;
      const now = new Date();
      const trialActive = !!trialExpiresAt && !convertedAt && new Date(trialExpiresAt) > now;
      const trialDaysRemaining = trialActive
        ? Math.max(0, Math.ceil((new Date(trialExpiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      if (trialActive) {
        return { used: 0, limit: null, remaining: null, unlimited: true, trialActive: true, trialDaysRemaining };
      }

      // Post-trial — read quota from DB
      const today = now.toISOString().slice(0, 10);
      const used = lastScanDate === today ? scansToday : 0;
      return { used, limit: 5, remaining: Math.max(0, 5 - used), unlimited: false, trialActive: false, trialDaysRemaining: 0 };
    }

    return { used: 0, limit: 5, remaining: 5, unlimited: false, trialActive: false, trialDaysRemaining: 0 };
  }),

  scanBarcode: quotaCheckedProcedure
    .input(
      z.object({
        barcode: z.string().regex(/^[0-9]{4,14}$/, "Code-barres invalide"),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        viewOnly: z.boolean().optional(), // true = read-only, no scan record created
        nutritionProfile: z.enum(["standard", "pregnant", "child", "athlete", "elderly"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 0. Fetch user profile for madhab-aware analysis + personal alerts
      // Anonymous users: skip profile fetch, analyze for all madhabs
      const userProfile = ctx.isAnonymous ? null : await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
        columns: {
          madhab: true,
          halalStrictness: true,
          allergens: true,
          isPregnant: true,
          hasChildren: true,
        },
      });

      // 1. DB-first product resolution (0.3ms for 99%+ of scans)
      //    OFF API called ONLY for unknown barcodes or stale background refresh
      const lookupResult = await resolveProduct(ctx.db, input.barcode);
      let product = lookupResult?.product ?? null;
      let offData = lookupResult?.offData ?? null;

      let halalAnalysis: HalalAnalysis | null = null;
      let aiEnrichment: import("../../services/ai-extract/index.js").ExtractionResult | null = null;

      const analysisOptions = {
        madhab: userProfile?.madhab ?? ("general" as const),
        strictness: userProfile?.halalStrictness ?? ("moderate" as const),
      };

      // 2. Legacy backfill: if product exists but has no OFF data, fetch it once
      if (product && !offData) {
        const backfill = await backfillProductFromOff(ctx.db, product);
        product = backfill.product;
        offData = backfill.offData;
      }

      // 3. Halal analysis (unified path — same logic for new and existing products)
      const storedOff = offData ?? (product?.offData as Record<string, unknown> | null);
      // Prefer French ingredients text when available (OFF stores per-language variants in offData JSONB)
      const ingredientsTextForAnalysis =
        (storedOff?.ingredients_text_fr as string)
        || (storedOff?.ingredients_text as string)
        || "";
      if (storedOff) {
        halalAnalysis = await analyzeHalalStatus(
          sanitizeIngredients(ingredientsTextForAnalysis),
          storedOff.additives_tags as string[] | undefined,
          storedOff.labels_tags as string[] | undefined,
          storedOff.ingredients_analysis_tags as string[] | undefined,
          analysisOptions,
        );

        // Tier 1c: Brand-based certifier fallback
        if (halalAnalysis.status === "halal" && !halalAnalysis.certifierId) {
          const brandString = (storedOff.brands as string | undefined) ?? product?.brand;
          if (brandString) {
            const brandMatch = await lookupBrandCertifier(ctx.db, brandString);
            if (brandMatch) {
              halalAnalysis = {
                ...halalAnalysis,
                certifierId: brandMatch.certifierId,
                certifierName: brandMatch.certifierName,
                analysisSource: "Naqiy · Certifieur identifié via marque connue",
              };
            }
          }
        }

        // AI ingredient extraction (Redis-cached 7d — free after first call)
        // Pass FR ingredients text to AI when available for French-language chips
        if (ingredientsTextForAnalysis) {
          const offForExtraction = { ...storedOff, ingredients_text: ingredientsTextForAnalysis };
          const extraction = await smartExtractIngredients(offForExtraction as unknown as OpenFoodFactsProduct);
          aiEnrichment = extraction.aiEnrichment;
          if (product && extraction.ingredients.length > 0) {
            const current = product.ingredients as string[] | null;
            const changed = !current || current.length !== extraction.ingredients.length
              || current.some((v, i) => v !== extraction.ingredients[i]);
            if (changed) {
              product = { ...product, ingredients: extraction.ingredients };
              ctx.db
                .update(products)
                .set({ ingredients: extraction.ingredients })
                .where(eq(products.id, product.id))
                .then(() => {})
                .catch(() => {});
            }
          }
        }
      }

      // 4. Sync product halal status if analysis result changed
      if (product && halalAnalysis && (
        product.halalStatus !== halalAnalysis.status ||
        product.certifierId !== halalAnalysis.certifierId ||
        product.certifierName !== halalAnalysis.certifierName ||
        product.confidenceScore !== halalAnalysis.confidence
      )) {
        await ctx.db
          .update(products)
          .set({
            halalStatus: halalAnalysis.status,
            confidenceScore: halalAnalysis.confidence,
            certifierName: halalAnalysis.certifierName,
            certifierId: halalAnalysis.certifierId,
          })
          .where(eq(products.id, product.id));

        product = {
          ...product,
          halalStatus: halalAnalysis.status,
          confidenceScore: halalAnalysis.confidence,
          certifierName: halalAnalysis.certifierName,
          certifierId: halalAnalysis.certifierId,
        };
      }

      // 5. Background refresh for stale products (fire-and-forget)
      if (product && lookupResult?.source === "db_stale") {
        refreshProductInBackground(ctx.db, input.barcode, product.id);
      }

      // 6. Parallel enrichment: boycott + community count + ingredient rulings
      const ingredientsText = storedOff?.ingredients_text as string | undefined;
      const [boycottResult, communityCount, ingredientRulingsData] = await Promise.all([
        checkBoycott(ctx.db, product?.brand),
        ctx.db
          .select({ count: sql<number>`count(DISTINCT ${scans.userId})::int` })
          .from(scans)
          .where(and(
            eq(scans.barcode, input.barcode),
            ...(ctx.userId ? [sql`${scans.userId} != ${ctx.userId}`] : []),
          ))
          .then(rows => rows[0]),
        ingredientsText
          ? matchIngredientRulings(ingredientsText, analysisOptions.madhab)
          : Promise.resolve([] as MatchedIngredientRuling[]),
      ]);

      // 4. Build personal alerts
      const personalAlerts: {
        type: "allergen" | "health" | "boycott";
        severity: "high" | "medium" | "low";
        title: string;
        description: string;
      }[] = [];

      const offProduct = offData
        ? (offData as any)
        : product?.offData
          ? (product.offData as any)
          : null;

      // 4a. Allergen matching
      if (userProfile?.allergens?.length && offProduct) {
        const allergenMatches = matchAllergens(
          userProfile.allergens,
          offProduct.allergens_tags ?? [],
          offProduct.traces_tags ?? [],
        );

        for (const match of allergenMatches) {
          const name = match.displayName;
          const isTrace = match.matchType === "trace";

          personalAlerts.push({
            type: "allergen",
            severity: match.severity,
            title: isTrace
              ? `Traces possibles : ${name}`
              : `Contient : ${name}`,
            description: isTrace
              ? `Ce produit peut contenir des traces de ${name}.`
              : `Ce produit contient un allergène de votre profil (${name}).`,
          });
        }
      }

      // 4b. Health warnings (pregnant/children + risky additives)
      let healthScoreAdditives: AdditiveForScore[] = [];
      const additiveHealthEffects: Record<string, { type: string; confirmed: boolean }> = {};
      let detectedAdditives: Array<{
        code: string;
        nameFr: string;
        nameEn: string | null;
        category: string;
        origin: string;
        halalStatusDefault: string;
        toxicityLevel: string;
        healthEffectType: string | null;
        healthEffectConfirmed: boolean;
        riskPregnant: boolean;
        riskChildren: boolean;
        healthEffectsFr: string | null;
      }> = [];

      if (offProduct?.additives_tags?.length) {
        const codes = [
          ...new Set(
            (offProduct.additives_tags as string[]).map(normalizeAdditiveTag)
          ),
        ];

        const riskyAdditives = await ctx.db
          .select()
          .from(additivesTable)
          .where(inArray(additivesTable.code, codes))
          .orderBy(additivesTable.code);

        // Map for health score computation (V2: includes risk flags for profile axis)
        healthScoreAdditives = riskyAdditives.map((a) => ({
          code: a.code,
          toxicityLevel: a.toxicityLevel as AdditiveForScore["toxicityLevel"],
          efsaStatus: a.efsaStatus as AdditiveForScore["efsaStatus"],
          adiMgPerKg: a.adiMgPerKg,
          bannedCountries: a.bannedCountries,
          riskPregnant: a.riskPregnant,
          riskChildren: a.riskChildren,
        }));

        // V3: Extract health effects for frontend badges
        for (const a of riskyAdditives) {
          if (a.healthEffectType) {
            additiveHealthEffects[a.code] = {
              type: a.healthEffectType,
              confirmed: a.healthEffectConfirmed ?? true,
            };
          }
        }

        // V4: Build detectedAdditives — ALL additives from OFF tags enriched with DB data.
        // Frontend uses this to show a complete additives list with color-coding
        // for those that have madhab rulings (conflictingAdditives handles the color).
        detectedAdditives = riskyAdditives.map((a) => ({
          code: a.code,
          nameFr: a.nameFr,
          nameEn: a.nameEn,
          category: a.category,
          origin: a.origin,
          halalStatusDefault: a.halalStatusDefault,
          toxicityLevel: a.toxicityLevel,
          healthEffectType: a.healthEffectType ?? null,
          healthEffectConfirmed: a.healthEffectConfirmed ?? true,
          riskPregnant: a.riskPregnant,
          riskChildren: a.riskChildren,
          healthEffectsFr: a.healthEffectsFr ?? null,
        }));

        for (const add of riskyAdditives) {
          if (add.riskPregnant && userProfile?.isPregnant) {
            personalAlerts.push({
              type: "health",
              severity: "high",
              title: `${add.code} déconseillé (grossesse)`,
              description:
                add.healthEffectsFr ??
                `${add.nameFr} est déconseillé aux femmes enceintes.`,
            });
          }
          if (add.riskChildren && userProfile?.hasChildren) {
            personalAlerts.push({
              type: "health",
              severity: "medium",
              title: `${add.code} attention (enfants)`,
              description:
                add.healthEffectsFr ??
                `${add.nameFr} peut affecter les enfants.`,
            });
          }
        }
      }

      // 5. Record scan + update user stats (skip in viewOnly mode)
      // Use fresh analysis values (not stale product DB values) — fixes confidence desync
      const scanHalalStatus = halalAnalysis?.status ?? product?.halalStatus ?? "unknown";
      const scanConfidence = halalAnalysis?.confidence ?? product?.confidenceScore ?? 0;

      let result: {
        scan: any;
        levelUp: { previousLevel: number; newLevel: number; newXp: number } | null;
      };

      if (input.viewOnly || ctx.isAnonymous || !ctx.userId) {
        // View-only or anonymous mode: no scan record, no XP, no streak update
        result = { scan: null, levelUp: null };
      } else {
        const userId = ctx.userId; // narrowed to string
        result = await ctx.db.transaction(async (tx) => {
          const [scan] = await tx
            .insert(scans)
            .values({
              userId,
              productId: product?.id,
              barcode: input.barcode,
              halalStatus: scanHalalStatus,
              confidenceScore: scanConfidence,
              latitude: input.latitude,
              longitude: input.longitude,
            })
            .returning();

          const now = new Date();
          const user = await tx.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
              lastScanDate: true,
              currentStreak: true,
              longestStreak: true,
              experiencePoints: true,
              level: true,
              streakFreezeCount: true,
            },
          });

          let newStreak = 1;
          let usedStreakFreeze = false;
          if (user?.lastScanDate) {
            const lastScan = new Date(user.lastScanDate);
            const diffDays = Math.floor(
              (now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays === 0) {
              newStreak = user.currentStreak ?? 1;
            } else if (diffDays === 1) {
              newStreak = (user.currentStreak ?? 0) + 1;
            } else if (diffDays <= 3 && (user.streakFreezeCount ?? 0) > 0) {
              // Streak freeze: preserve streak if missed 1-3 days and user has freezes
              newStreak = (user.currentStreak ?? 0) + 1;
              usedStreakFreeze = true;
            }
            // else: diffDays > 3 or no freeze → newStreak stays 1 (reset)
          }

          // Milestone bonus XP: award extra XP when streak hits key thresholds
          const STREAK_MILESTONES: Record<number, number> = {
            3: 15, 7: 30, 14: 50, 30: 100, 60: 200, 100: 500, 365: 1000,
          };
          const milestoneBonus = STREAK_MILESTONES[newStreak] ?? 0;

          // Level-up detection
          const previousXp = user?.experiencePoints ?? 0;
          const previousLevel = user?.level ?? 1;
          const newXp = previousXp + 10 + milestoneBonus;
          const newLevel = calculateLevel(newXp);

          await tx
            .update(users)
            .set({
              totalScans: sql`${users.totalScans} + 1`,
              experiencePoints: newXp,
              level: newLevel,
              currentStreak: newStreak,
              longestStreak: sql`GREATEST(${users.longestStreak}, ${newStreak})`,
              lastScanDate: now,
              lastActiveAt: now,
              firstScanAt: sql`COALESCE(${users.firstScanAt}, ${now.toISOString()})`,
              updatedAt: now,
              ...(usedStreakFreeze
                ? {
                    streakFreezeCount: sql`${users.streakFreezeCount} - 1`,
                    streakFreezeLastUsed: now,
                  }
                : {}),
            })
            .where(eq(users.id, userId));

          return {
            scan,
            levelUp: newLevel > previousLevel
              ? { previousLevel, newLevel, newXp }
              : null,
          };
        });
      }

      // 7. Build enriched OFF extras for the mobile app
      // OFF returns "unknown"/"not-applicable" as strings instead of null — normalize to null
      const finalOff = (storedOff ?? product?.offData ?? offData) as Record<string, unknown> | null;
      const offGrade = (v: unknown): string | null => {
        const s = v as string | undefined;
        return s && s !== "unknown" && s !== "not-applicable" ? s : null;
      };
      const offExtras = finalOff ? {
        nutriscoreGrade: offGrade(finalOff.nutriscore_grade),
        novaGroup: (finalOff.nova_group as number) ?? null,
        ecoscoreGrade: offGrade(finalOff.ecoscore_grade),
        allergensTags: (finalOff.allergens_tags as string[]) ?? [],
        tracesTags: (finalOff.traces_tags as string[]) ?? [],
        additivesTags: (finalOff.additives_tags as string[]) ?? [],
        labelsTags: (finalOff.labels_tags as string[]) ?? [],
        ingredientsAnalysisTags: (finalOff.ingredients_analysis_tags as string[]) ?? [],
        manufacturingPlaces: (finalOff.manufacturing_places as string) ?? null,
        origins: (finalOff.origins as string) ?? null,
      } : null;

      // 8. Special product detection (must be BEFORE health score for bypassNutriScore)
      const specialProduct: SpecialProductInfo | null = product
        ? detectSpecialProduct(product as any)
        : null;

      // 8. Naqiy Health Score V3 — 4-axis category-aware formula + data quality gate
      //
      // Court-circuit: if product already flagged "unreliable" in DB,
      // skip the entire health score computation → score=null ("je ne sais pas").
      // The flag persists until data is refreshed from OFF (auto-healing in refreshProductInBackground).
      const dbDataQualityFlag = (product as any)?.dataQualityFlag as string | null;

      const nutritionProfile: UserNutritionProfile =
        input.nutritionProfile
        ?? (userProfile?.isPregnant ? "pregnant" : undefined)
        ?? (userProfile?.hasChildren ? "child" : undefined)
        ?? "standard";

      const offNutriments = finalOff?.nutriments as Record<string, number | string> | null | undefined;
      const offCategories = (finalOff?.categories as string) ?? null;
      const ingredientsList = product?.ingredients as string[] | null;

      const offNutriscoreData = finalOff?.nutriscore_data as Record<string, unknown> | undefined;
      const offNutriscoreComponents: { id: string; value: number }[] | undefined =
        offNutriscoreData?.components
          ? [
              ...((offNutriscoreData.components as any).negative ?? []),
              ...((offNutriscoreData.components as any).positive ?? []),
            ].map((c: any) => ({ id: c.id as string, value: c.value as number }))
          : undefined;

      // 8a. DataReconciler — multi-source nutriment resolution
      // Merges OFF nutriments + NutriScore components + DB denormalized columns
      const reconciliation = reconcileNutriments(
        offNutriments,
        offNutriscoreComponents,
        product ? {
          energyKcal100g: (product as any).energyKcal100g,
          fat100g: (product as any).fat100g,
          saturatedFat100g: (product as any).saturatedFat100g,
          carbohydrates100g: (product as any).carbohydrates100g,
          sugars100g: (product as any).sugars100g,
          fiber100g: (product as any).fiber100g,
          proteins100g: (product as any).proteins100g,
          salt100g: (product as any).salt100g,
        } : null,
      );

      // Use reconciled nutriments for health score (best available from all sources)
      const reconciledNutriments = Object.keys(reconciliation.flat).length > 0
        ? reconciliation.flat
        : offNutriments;

      // 8b. BeverageIntelligence — subcategory + sugar/sweetener/caffeine analysis
      const beverageAnalysis: BeverageAnalysis | null = analyzeBeverage(
        offCategories,
        product?.name,
        reconciledNutriments,
        finalOff?.ingredients_text as string | undefined,
        offExtras?.additivesTags,
      );

      // Data Quality Gate — court-circuit for previously flagged products
      // "في الشك أمسك" — when data is unreliable, return null instead of a misleading score
      type HealthScoreResultType = ReturnType<typeof computeHealthScore>;
      let healthScore: HealthScoreResultType;

      if (dbDataQualityFlag === "unreliable") {
        logger.info("Product data quality flagged unreliable — skipping health score computation", {
          barcode: input.barcode,
          reasons: (product as any)?.dataQualityReasons,
        });
        healthScore = {
          score: null,
          label: null,
          axes: {
            nutrition: null,
            additives: { score: 0, max: 0, penalties: [], hasHighConcern: false, hasBanned: false },
            processing: null,
            profile: { delta: 0, reasons: ["data_unreliable_cached"] },
          },
          bonuses: { bio: 0, aop: 0 },
          dataConfidence: "very_low",
          cappedByAdditive: false,
          category: "general",
          dataQualityFlag: "unreliable",
          dataQualityReasons: ((product as any)?.dataQualityReasons as string[]) ?? ["cached_unreliable"],
        };
      } else {
        healthScore = computeHealthScore({
          nutriscoreGrade: offExtras?.nutriscoreGrade ?? null,
          novaGroup: offExtras?.novaGroup ?? aiEnrichment?.novaEstimate ?? null,
          additives: healthScoreAdditives,
          hasIngredientsList: !!(finalOff?.ingredients_text),
          hasNutritionFacts: !!(reconciledNutriments && Object.keys(reconciledNutriments).length > 0),
          hasAllergens: (offExtras?.allergensTags?.length ?? 0) > 0 || (aiEnrichment?.allergenHints?.length ?? 0) > 0,
          hasOrigin: !!(offExtras?.origins || offExtras?.manufacturingPlaces),
          nutriments: reconciledNutriments,
          categories: offCategories,
          profile: nutritionProfile,
          aiNovaEstimate: aiEnrichment?.novaEstimate ?? null,
          additiveCount: offExtras?.additivesTags?.length ?? healthScoreAdditives.length,
          ingredientCount: ingredientsList?.length ?? 0,
          containsAlcohol: aiEnrichment?.containsAlcohol ?? false,
          offNutriscoreComponents,
          labels: offExtras?.labelsTags,
          specialProduct: specialProduct ? {
            bypassNutriScore: specialProduct.bypassNutriScore,
            qualityRatio: specialProduct.qualityRatio,
            type: specialProduct.type,
          } : null,
          beverageScoreModifier: beverageAnalysis?.scoreModifier,
        });
      }

      logger.info("Health score V2 computed", {
        barcode: input.barcode,
        score: healthScore.score,
        label: healthScore.label,
        confidence: healthScore.dataConfidence,
        profile: nutritionProfile,
        profileDelta: healthScore.axes.profile.delta,
        cappedByAdditive: healthScore.cappedByAdditive,
        nutritionSource: healthScore.axes.nutrition?.source ?? "none",
        novaSource: healthScore.axes.processing?.source ?? "none",
        nutrientAnomalies: healthScore.nutrientAnomalies?.length ?? 0,
      });

      if (healthScore.nutrientAnomalies?.length) {
        logger.warn("Nutrient anomalies detected in OFF data", {
          barcode: input.barcode,
          anomalies: healthScore.nutrientAnomalies,
          dataQualityFlag: healthScore.dataQualityFlag,
        });
      }

      // 8b. Persist data quality flag in DB (non-blocking)
      // This creates the "circuit short" for future scans: once flagged "unreliable",
      // the product stays flagged until data is refreshed from OFF (auto-healing).
      if (product && healthScore.dataQualityFlag) {
        ctx.db
          .update(products)
          .set({
            dataQualityFlag: healthScore.dataQualityFlag,
            dataQualityReasons: healthScore.dataQualityReasons ?? null,
          })
          .where(eq(products.id, product.id))
          .then(() => {
            if (healthScore.dataQualityFlag === "unreliable") {
              logger.warn("Product flagged as unreliable — future scans will return score=null", {
                barcode: input.barcode,
                reasons: healthScore.dataQualityReasons,
              });
            }
          })
          .catch((err) => {
            logger.error("Failed to persist data quality flag", {
              barcode: input.barcode,
              error: err instanceof Error ? err.message : String(err),
            });
          });
      }

      // 9. Madhab verdicts + Certifier — parallel (both independent)
      const madhabVerdicts = await computeMadhabVerdicts(ctx.db, halalAnalysis, ingredientRulingsData);

      // 10. Certifier enrichment — runtime-computed trust scores
      // Scores are computed LIVE from raw practice flags + certifier_events
      // with dynamic controversy penalty (time-decay). Not pre-computed.
      let certifierData: {
        id: string;
        name: string;
        trustScore: number;
        trustScoreHanafi: number;
        trustScoreShafii: number;
        trustScoreMaliki: number;
        trustScoreHanbali: number;
        trustGrade: {
          grade: number;
          arabic: string;
          label: string;
          color: string;
        };
        website: string | null;
        halalAssessment: boolean;
        practices: {
          controllersAreEmployees: boolean | null;
          controllersPresentEachProduction: boolean | null;
          hasSalariedSlaughterers: boolean | null;
          acceptsMechanicalSlaughter: boolean | null;
          acceptsElectronarcosis: boolean | null;
          acceptsPostSlaughterElectrocution: boolean | null;
          acceptsStunning: boolean | null;
          acceptsVsm: boolean | null;
          transparencyPublicCharter: boolean | null;
          transparencyAuditReports: boolean | null;
          transparencyCompanyList: boolean | null;
        };
        detail: {
          score: number;
          blocks: {
            ritualValidity: number;
            operationalAssurance: number;
            productQuality: number;
            transparency: number;
          };
          cap?: number;
          evidenceLevel: 'verified' | 'declared' | 'inferred' | 'unknown';
        };
        lastVerifiedAt: string | null;
      } | null = null;

      if (halalAnalysis?.certifierId) {
        const scored = await getCertifierScores(ctx.db, ctx.redis, halalAnalysis.certifierId);
        if (scored) {
          certifierData = {
            id: scored.id,
            name: scored.name,
            trustScore: scored.scores.trustScore,
            trustScoreHanafi: scored.scores.trustScoreHanafi,
            trustScoreShafii: scored.scores.trustScoreShafii,
            trustScoreMaliki: scored.scores.trustScoreMaliki,
            trustScoreHanbali: scored.scores.trustScoreHanbali,
            trustGrade: getTrustGrade(scored.scores.trustScore),
            website: scored.website,
            halalAssessment: scored.halalAssessment,
            practices: scored.practices,
            detail: scored.detail,
            lastVerifiedAt: scored.lastVerifiedAt,
          };
          // Override certifierName with the real DB name
          halalAnalysis.certifierName = scored.name;
        }
      }

      // 11. New V3 enrichments — dietary, nutrients, special product, score exclusion
      // All are pure synchronous (no DB, no Redis) — computed from existing product data
      const dietaryAdditives: AdditiveForDiet[] = healthScoreAdditives.map(a => ({
        code: a.code,
        isVegetarian: null, // Will be enriched from full additive rows below
        isVegan: null,
      }));

      // Enrich dietary additives with veg/vegan flags from full DB rows
      if (offProduct?.additives_tags?.length) {
        const codes = [
          ...new Set(
            (offProduct.additives_tags as string[]).map(normalizeAdditiveTag)
          ),
        ];
        if (codes.length > 0) {
          const fullAdditives = await ctx.db
            .select({
              code: additivesTable.code,
              isVegetarian: additivesTable.isVegetarian,
              isVegan: additivesTable.isVegan,
            })
            .from(additivesTable)
            .where(inArray(additivesTable.code, codes));

          const addMap = new Map(fullAdditives.map(a => [a.code, a]));
          for (const da of dietaryAdditives) {
            const full = addMap.get(da.code);
            if (full) {
              da.isVegetarian = full.isVegetarian;
              da.isVegan = full.isVegan;
            }
          }
        }
      }

      const dietaryAnalysis: DietaryAnalysis | null = product
        ? analyzeDietary(product as any, dietaryAdditives)
        : null;

      const nutrientBreakdown: NutrientBreakdown[] | null = product
        ? computeNutrientBreakdown(product as any)
        : null;

      const scoreExclusion: ScoreExclusionReason | null = product
        ? checkScoreExclusion(product as any)
        : null;

      // Increment scan counters — DB (source of truth) + Redis (cache)
      let remainingScans: number | null = null;
      const quotaId = ctx.userId ?? ctx.deviceId;
      if (quotaId && !input.viewOnly) {
        const today = new Date().toISOString().slice(0, 10);

        // DB: update devices table (Drizzle ORM — source of truth)
        if (ctx.deviceId) {
          const isNewDay = ctx.device?.lastScanDate !== today;
          await ctx.db
            .update(devices)
            .set({
              scansToday: isNewDay ? 1 : sql`scans_today + 1`,
              lastScanDate: today,
              totalScans: sql`total_scans + 1`,
              lastActiveAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(devices.deviceId, ctx.deviceId));
        }

        // Redis: fast-path cache for next request quota check
        try {
          const cacheKey = `scan:quota:${quotaId}:${today}`;
          await ctx.redis.incr(cacheKey);
          await ctx.redis.expire(cacheKey, 86400);
        } catch {
          // Redis failure is non-fatal — DB is source of truth
        }

        remainingScans = ctx.remainingScans !== null ? ctx.remainingScans - 1 : null;
      }

      return {
        scan: result.scan,
        product: product ?? null,
        isNewProduct: lookupResult?.source === "off_new",
        halalAnalysis,
        boycott: boycottResult,
        offExtras,
        healthScore,
        aiEnrichment: aiEnrichment ? {
          novaEstimate: aiEnrichment.novaEstimate ?? null,
          allergenHints: aiEnrichment.allergenHints ?? [],
          containsAlcohol: aiEnrichment.containsAlcohol ?? false,
          isOrganic: aiEnrichment.isOrganic ?? false,
        } : null,
        personalAlerts,
        communityVerifiedCount: communityCount?.count ?? 0,
        madhabVerdicts,
        ingredientRulings: ingredientRulingsData,
        certifierData,
        dietaryAnalysis,
        nutrientBreakdown,
        specialProduct,
        scoreExclusion,
        additiveHealthEffects,
        detectedAdditives,
        beverageAnalysis,
        dataReconciliation: reconciliation.hasConflicts ? {
          conflicts: reconciliation.conflicts,
          coverage: reconciliation.coverage,
          completeness: reconciliation.completeness,
        } : null,
        levelUp: result.levelUp,
        remainingScans,
      };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(scans.userId, ctx.userId)];
      if (input.cursor) {
        const cursorScan = await ctx.db.query.scans.findFirst({
          where: eq(scans.id, input.cursor),
          columns: { scannedAt: true },
        });
        if (cursorScan) {
          conditions.push(sql`${scans.scannedAt} < ${cursorScan.scannedAt}`);
        }
      }

      // Query scans + products (no certifier JOIN — scores come from runtime engine)
      const rawItems = await ctx.db
        .select({
          id: scans.id,
          barcode: scans.barcode,
          halalStatus: scans.halalStatus,
          confidenceScore: scans.confidenceScore,
          scannedAt: scans.scannedAt,
          product: {
            id: products.id,
            name: products.name,
            brand: products.brand,
            imageUrl: products.imageUrl,
            imageR2Key: products.imageR2Key,
            imageFrontUrl: products.imageFrontUrl,
            category: products.category,
            halalStatus: products.halalStatus,
            confidenceScore: products.confidenceScore,
            certifierId: products.certifierId,
            certifierName: products.certifierName,
          },
        })
        .from(scans)
        .leftJoin(products, eq(scans.productId, products.id))
        .where(and(...conditions))
        .orderBy(desc(scans.scannedAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (rawItems.length > input.limit) {
        const next = rawItems.pop()!;
        nextCursor = next.id;
      }

      // Enrich with runtime-computed trust scores (batch, cached in Redis 1h)
      // getAllCertifierScores() is a single batched query — no N+1
      const allScores = await getAllCertifierScores(ctx.db, ctx.redis);
      const scoreMap = new Map(allScores.map((c) => [c.id, c.scores]));

      const items = rawItems.map((item) => {
        const certifierId = item.product?.certifierId;
        const scores = certifierId ? scoreMap.get(certifierId) ?? null : null;
        const product = item.product
          ? withResolvedImage(item.product)
          : item.product;
        return {
          ...item,
          product,
          certifier: scores
            ? {
                trustScore: scores.trustScore,
                trustScoreHanafi: scores.trustScoreHanafi,
                trustScoreShafii: scores.trustScoreShafii,
                trustScoreMaliki: scores.trustScoreMaliki,
                trustScoreHanbali: scores.trustScoreHanbali,
              }
            : null,
        };
      });

      return { items, nextCursor };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: {
        totalScans: true,
        currentStreak: true,
        longestStreak: true,
        experiencePoints: true,
        level: true,
      },
    });
    if (!user) throw notFound("Utilisateur introuvable");

    const totalScansResult = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(scans)
      .where(eq(scans.userId, ctx.userId));

    return {
      ...user,
      totalScansVerified: totalScansResult[0]?.count ?? 0,
    };
  }),

  requestAnalysis: protectedProcedure
    .input(
      z.object({
        barcode: z.string().regex(/^[0-9]{4,14}$/, "Code-barres invalide"),
        productName: z.string().trim().max(255).optional(),
        brandName: z.string().trim().max(255).optional(),
        photoUrls: z.array(z.string().url()).max(10).optional(),
        notes: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [request] = await ctx.db
        .insert(analysisRequests)
        .values({ ...input, userId: ctx.userId })
        .returning();

      return request;
    }),

  importHistory: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            barcode: z.string().min(1).max(50),
            productId: z.string().uuid().optional(),
            halalStatus: z.string().max(20).optional(),
            confidenceScore: z.number().min(0).max(1).optional(),
            scannedAt: z.string().datetime(),
          })
        ).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.items.length === 0) return { imported: 0 };

      // Deduplicate by barcode — keep only the most recent scan per barcode
      const byBarcode = new Map<string, typeof input.items[number]>();
      for (const item of input.items) {
        const existing = byBarcode.get(item.barcode);
        if (!existing || item.scannedAt > existing.scannedAt) {
          byBarcode.set(item.barcode, item);
        }
      }

      const values = Array.from(byBarcode.values()).map((item) => ({
        userId: ctx.userId,
        barcode: item.barcode,
        productId: item.productId ?? null,
        halalStatus: item.halalStatus ?? null,
        confidenceScore: item.confidenceScore ?? null,
        scannedAt: new Date(item.scannedAt),
      }));

      // Insert — no conflict handling needed since scans don't have a unique constraint on (userId, barcode)
      // Multiple scans of the same product are valid (user may scan at different times)
      await ctx.db.insert(scans).values(values);

      return { imported: values.length };
    }),

  submitFeedback: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        isCorrect: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(scanFeedback)
        .values({
          userId: ctx.userId,
          productId: input.productId,
          isCorrect: input.isCorrect,
        })
        .onConflictDoUpdate({
          target: [scanFeedback.userId, scanFeedback.productId],
          set: {
            isCorrect: input.isCorrect,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  // ── V2 Halal Engine — gated behind feature flag ──────────
  scanBarcodeV2: quotaCheckedProcedure
    .input(
      z.object({
        barcode: z.string().regex(/^[0-9]{4,14}$/, "Code-barres invalide"),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        viewOnly: z.boolean().optional(),
        nutritionProfile: z.enum(["standard", "pregnant", "child", "athlete", "elderly"]).optional(),
        scanRequestId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Feature flag gate: halalEngineV2Enabled must be enabled
      const [flagRow] = await ctx.db
        .select({ enabled: featureFlagsTable.enabled, defaultValue: featureFlagsTable.defaultValue })
        .from(featureFlagsTable)
        .where(eq(featureFlagsTable.key, "halalEngineV2Enabled"))
        .limit(1);

      const flagEnabled = flagRow?.enabled === true;
      if (!flagEnabled) {
        throw new Error("halalEngineV2Enabled feature flag is not enabled");
      }

      // Fetch user profile
      const userProfile = ctx.isAnonymous ? null : await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
        columns: {
          id: true,
          madhab: true,
          halalStrictness: true,
          allergens: true,
          isPregnant: true,
          hasChildren: true,
          subscriptionTier: true,
        },
      });

      // Build dependencies
      const deps: OrchestratorDeps = {
        db: ctx.db,
        halalEngine: new HalalEngineV2(
          new DrizzleDossierRepo(),
          new DrizzleScenarioRepo(),
          new DrizzleMadhabRulingRepo(),
          new DrizzleMatchPatternRepo(),
        ),
        certifierTrustEngine: new CertifierTrustEngine(new DrizzleCertifierTrustRepo()),
        evaluationStore: new DrizzleEvaluationStore(),
        resolveProduct: resolveProduct,
        aiExtractIngredientsV2: aiExtractIngredientsV2,
        matchAllergens: matchAllergens,
        lookupBrandCertifier: lookupBrandCertifier,
        fetchRiskyAdditives: async (db: any, codes: string[]): Promise<RiskyAdditive[]> => {
          if (codes.length === 0) return [];
          const rows = await db
            .select({
              code: additivesTable.code,
              nameFr: additivesTable.nameFr,
              riskPregnant: additivesTable.riskPregnant,
              riskChildren: additivesTable.riskChildren,
              healthEffectsFr: additivesTable.healthEffectsFr,
            })
            .from(additivesTable)
            .where(inArray(additivesTable.code, codes));
          return rows.map((r: any) => ({
            code: r.code,
            nameFr: r.nameFr,
            riskPregnant: r.riskPregnant ?? false,
            riskChildren: r.riskChildren ?? false,
            healthEffectsFr: r.healthEffectsFr ?? null,
          }));
        },
      };

      const orchestrator = new ScanOrchestratorV2(deps);

      const result = await orchestrator.execute(
        {
          barcode: input.barcode,
          latitude: input.latitude,
          longitude: input.longitude,
          viewOnly: input.viewOnly,
          nutritionProfile: input.nutritionProfile,
          scanRequestId: input.scanRequestId,
        },
        userProfile
          ? {
              id: userProfile.id,
              madhab: userProfile.madhab,
              halalStrictness: userProfile.halalStrictness,
              allergens: userProfile.allergens,
              isPregnant: userProfile.isPregnant ?? false,
              hasChildren: userProfile.hasChildren ?? false,
              subscriptionTier: userProfile.subscriptionTier as "free" | "premium",
              boycottOptIn: false, // TODO: read from user preferences when boycott UI is shipped
            }
          : null,
      );

      return result;
    }),
});
