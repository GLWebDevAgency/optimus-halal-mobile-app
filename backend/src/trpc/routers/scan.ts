import { z } from "zod";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import {
  scans,
  products,
  users,
  analysisRequests,
  boycottTargets,
  additives as additivesTable,
  additiveMadhabRulings,
} from "../../db/schema/index.js";
import {
  lookupBarcode,
  analyzeHalalStatus,
  matchIngredientRulings,
  extractIngredientList,
  smartExtractIngredients,
  type HalalAnalysis,
  type MatchedIngredientRuling,
  type OpenFoodFactsProduct,
} from "../../services/barcode.service.js";
import { matchAllergens } from "../../services/allergen.service.js";
import { computeHealthScore, type AdditiveForScore } from "../../services/health-score.service.js";
import { getCertifierScores, getAllCertifierScores } from "../../services/certifier-score.service.js";
import { notFound } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";

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
  status: "halal" | "doubtful" | "haram";
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
  scanBarcode: protectedProcedure
    .input(
      z.object({
        barcode: z.string().regex(/^[0-9]{4,14}$/, "Code-barres invalide"),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        viewOnly: z.boolean().optional(), // true = read-only, no scan record created
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 0. Fetch user profile for madhab-aware analysis + personal alerts
      const userProfile = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
        columns: {
          madhab: true,
          halalStrictness: true,
          allergens: true,
          isPregnant: true,
          hasChildren: true,
        },
      });

      // 1. Check if product exists in DB
      let product = await ctx.db.query.products.findFirst({
        where: eq(products.barcode, input.barcode),
      });

      let halalAnalysis: HalalAnalysis | null = null;
      let offData: Record<string, unknown> | null = null;
      let aiEnrichment: import("../../services/ai-extract/index.js").ExtractionResult | null = null;

      const analysisOptions = {
        madhab: userProfile?.madhab ?? ("general" as const),
        strictness: userProfile?.halalStrictness ?? ("moderate" as const),
      };

      // 2. If not, fetch from OpenFoodFacts
      if (!product) {
        const offResult = await lookupBarcode(input.barcode);

        if (offResult.found && offResult.product) {
          const off = offResult.product;
          offData = off as unknown as Record<string, unknown>;

          // v3 analysis: async, madhab-aware, DB-backed
          halalAnalysis = await analyzeHalalStatus(
            off.ingredients_text,
            off.additives_tags,
            off.labels_tags,
            off.ingredients_analysis_tags,
            analysisOptions,
          );

          const newExtraction = await smartExtractIngredients(off as OpenFoodFactsProduct);
          aiEnrichment = newExtraction.aiEnrichment;

          const [newProduct] = await ctx.db
            .insert(products)
            .values({
              barcode: input.barcode,
              name: off.product_name ?? "Produit inconnu",
              brand: off.brands,
              category: off.categories?.split(",")[0]?.trim(),
              ingredients: newExtraction.ingredients,
              halalStatus: halalAnalysis.status,
              confidenceScore: halalAnalysis.confidence,
              certifierName: halalAnalysis.certifierName,
              certifierId: halalAnalysis.certifierId,
              imageUrl: off.image_front_url ?? off.image_url,
              nutritionFacts: off.nutriments ?? null,
              offData: off,
              lastSyncedAt: new Date(),
            })
            .returning();

          product = newProduct;
        }
      } else {
        // Product exists — re-run analysis with user's madhab preferences
        let storedOff = product.offData as Record<string, unknown> | null;

        // Legacy product backfill: if offData is missing, re-fetch from OFF
        // and persist so future scans don't need to re-fetch.
        if (!storedOff) {
          const offResult = await lookupBarcode(input.barcode);
          if (offResult.found && offResult.product) {
            const off = offResult.product;
            storedOff = off as unknown as Record<string, unknown>;
            offData = storedOff;

            // Backfill: persist OFF data + update product metadata
            await ctx.db
              .update(products)
              .set({
                offData: off,
                name: off.product_name ?? product.name,
                brand: off.brands ?? product.brand,
                imageUrl: off.image_front_url ?? off.image_url ?? product.imageUrl,
                nutritionFacts: off.nutriments ?? product.nutritionFacts,
                lastSyncedAt: new Date(),
              })
              .where(eq(products.id, product.id));

            product = {
              ...product,
              offData: off as any,
              name: off.product_name ?? product.name,
              brand: off.brands ?? product.brand,
              imageUrl: off.image_front_url ?? off.image_url ?? product.imageUrl,
              nutritionFacts: (off.nutriments ?? product.nutritionFacts) as any,
            };

            logger.info("Legacy product backfilled with OFF data", {
              barcode: input.barcode,
              productId: product.id,
            });
          }
        }

        if (storedOff) {
          halalAnalysis = await analyzeHalalStatus(
            storedOff.ingredients_text as string | undefined,
            storedOff.additives_tags as string[] | undefined,
            storedOff.labels_tags as string[] | undefined,
            storedOff.ingredients_analysis_tags as string[] | undefined,
            analysisOptions,
          );

          // Always refresh ingredients via AI — Redis cache (7d) makes this free
          // after the first call. Ensures all legacy products get clean data.
          if (storedOff.ingredients_text) {
            const extraction = await smartExtractIngredients(storedOff as unknown as OpenFoodFactsProduct);
            aiEnrichment = extraction.aiEnrichment;
            if (extraction.ingredients.length > 0) {
              const current = product.ingredients as string[] | null;
              const changed = !current || current.length !== extraction.ingredients.length
                || current.some((v, i) => v !== extraction.ingredients[i]);
              if (changed) {
                product = { ...product, ingredients: extraction.ingredients };
                // Persist to DB (fire-and-forget — don't block response)
                ctx.db
                  .update(products)
                  .set({ ingredients: extraction.ingredients })
                  .where(eq(products.id, product.id))
                  .then(() => {})
                  .catch(() => {});
              }
            }
          }

          // Sync product record if analysis result changed (status, certifier, or confidence)
          if (halalAnalysis && (
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

            // Keep local product in sync with DB for the response
            product = {
              ...product,
              halalStatus: halalAnalysis.status,
              confidenceScore: halalAnalysis.confidence,
              certifierName: halalAnalysis.certifierName,
              certifierId: halalAnalysis.certifierId,
            };
          }
        }
      }

      // 3. Check boycott status
      const boycottResult = await checkBoycott(ctx.db, product?.brand);

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
          offProduct.traces_tags ?? []
        );

        for (const match of allergenMatches) {
          personalAlerts.push({
            type: "allergen",
            severity: match.severity,
            title:
              match.matchType === "allergen"
                ? `Contient : ${match.userAllergen}`
                : `Traces possibles : ${match.userAllergen}`,
            description:
              match.matchType === "allergen"
                ? `Ce produit contient un allergène de votre profil (${match.userAllergen}).`
                : `Ce produit peut contenir des traces de ${match.userAllergen}.`,
          });
        }
      }

      // 4b. Health warnings (pregnant/children + risky additives)
      let healthScoreAdditives: AdditiveForScore[] = [];

      if (offProduct?.additives_tags?.length) {
        const codes = [
          ...new Set(
            (offProduct.additives_tags as string[]).map((t: string) =>
              t
                .replace(/^en:/, "")
                .toUpperCase()
                .replace(/[a-z]$/i, "")
            )
          ),
        ];

        const riskyAdditives = await ctx.db
          .select()
          .from(additivesTable)
          .where(inArray(additivesTable.code, codes))
          .orderBy(additivesTable.code);

        // Map for health score computation
        healthScoreAdditives = riskyAdditives.map((a) => ({
          code: a.code,
          toxicityLevel: a.toxicityLevel as AdditiveForScore["toxicityLevel"],
          efsaStatus: a.efsaStatus as AdditiveForScore["efsaStatus"],
          adiMgPerKg: a.adiMgPerKg,
          bannedCountries: a.bannedCountries,
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

      if (input.viewOnly) {
        // View-only mode: no scan record, no XP, no streak update
        result = { scan: null, levelUp: null };
      } else {
        result = await ctx.db.transaction(async (tx) => {
          const [scan] = await tx
            .insert(scans)
            .values({
              userId: ctx.userId,
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
            where: eq(users.id, ctx.userId),
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
              updatedAt: now,
              ...(usedStreakFreeze
                ? {
                    streakFreezeCount: sql`${users.streakFreezeCount} - 1`,
                    streakFreezeLastUsed: now,
                  }
                : {}),
            })
            .where(eq(users.id, ctx.userId));

          return {
            scan,
            levelUp: newLevel > previousLevel
              ? { previousLevel, newLevel, newXp }
              : null,
          };
        });
      }

      // 6. Build enriched OFF extras for the mobile app
      // OFF returns "unknown"/"not-applicable" as strings instead of null — normalize to null
      const storedOff = (product?.offData ?? offData) as Record<string, unknown> | null;
      const offGrade = (v: unknown): string | null => {
        const s = v as string | undefined;
        return s && s !== "unknown" && s !== "not-applicable" ? s : null;
      };
      const offExtras = storedOff ? {
        nutriscoreGrade: offGrade(storedOff.nutriscore_grade),
        novaGroup: (storedOff.nova_group as number) ?? null,
        ecoscoreGrade: offGrade(storedOff.ecoscore_grade),
        allergensTags: (storedOff.allergens_tags as string[]) ?? [],
        tracesTags: (storedOff.traces_tags as string[]) ?? [],
        additivesTags: (storedOff.additives_tags as string[]) ?? [],
        labelsTags: (storedOff.labels_tags as string[]) ?? [],
        ingredientsAnalysisTags: (storedOff.ingredients_analysis_tags as string[]) ?? [],
        manufacturingPlaces: (storedOff.manufacturing_places as string) ?? null,
        origins: (storedOff.origins as string) ?? null,
      } : null;

      // 6b. Naqiy Health Score — 4-axis nutritional formula
      // OFF is always prioritary; AI enrichment fills gaps
      const healthScore = computeHealthScore({
        nutriscoreGrade: offExtras?.nutriscoreGrade ?? null,
        novaGroup: offExtras?.novaGroup ?? aiEnrichment?.novaEstimate ?? null,
        additives: healthScoreAdditives,
        hasIngredientsList: !!(storedOff?.ingredients_text),
        hasNutritionFacts: !!(storedOff?.nutriments && Object.keys(storedOff.nutriments as object).length > 0),
        hasAllergens: (offExtras?.allergensTags?.length ?? 0) > 0 || (aiEnrichment?.allergenHints?.length ?? 0) > 0,
        hasOrigin: !!(offExtras?.origins || offExtras?.manufacturingPlaces),
      });

      logger.info("Health score computed", {
        barcode: input.barcode,
        score: healthScore.score,
        label: healthScore.label,
        confidence: healthScore.dataConfidence,
        novaSource: offExtras?.novaGroup ? "off" : aiEnrichment?.novaEstimate ? "ai" : "none",
      });

      // 7. Community scan count — how many OTHER users verified this product
      const [communityCount] = await ctx.db
        .select({ count: sql<number>`count(DISTINCT ${scans.userId})::int` })
        .from(scans)
        .where(
          and(
            eq(scans.barcode, input.barcode),
            sql`${scans.userId} != ${ctx.userId}`
          )
        );

      // 8. Ingredient rulings — enriched scholarly data for UI
      const ingredientsText = storedOff?.ingredients_text as string | undefined;
      const ingredientRulingsData = ingredientsText
        ? await matchIngredientRulings(ingredientsText, analysisOptions.madhab)
        : [];

      // 9. Madhab verdicts — all 4 school opinions for comparative display
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
            website: scored.website,
            halalAssessment: scored.halalAssessment,
            practices: scored.practices,
          };
          // Override certifierName with the real DB name
          halalAnalysis.certifierName = scored.name;
        }
      }

      return {
        scan: result.scan,
        product: product ?? null,
        isNewProduct: !product,
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
        levelUp: result.levelUp,
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
        return {
          ...item,
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
});
