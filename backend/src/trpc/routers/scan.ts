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
  type HalalAnalysis,
} from "../../services/barcode.service.js";
import { matchAllergens } from "../../services/allergen.service.js";
import { notFound } from "../../lib/errors.js";

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
}

async function computeMadhabVerdicts(
  db: any,
  halalAnalysis: HalalAnalysis | null
): Promise<MadhabVerdictItem[]> {
  if (!halalAnalysis) return [];

  // If product is certified halal → all schools agree
  if (halalAnalysis.tier === "certified") {
    return MADHAB_SCHOOLS.map((m) => ({
      madhab: m,
      status: "halal" as const,
      conflictingAdditives: [],
    }));
  }

  // Extract additive codes from analysis reasons (format: "E441 (Gélatine)")
  // Validate format with regex to avoid querying with garbage codes
  const additiveCodes = halalAnalysis.reasons
    .filter((r) => r.type === "additive" && r.status !== "halal")
    .map((r) => r.name.split(" ")[0])
    .filter((code) => /^E\d+[a-z]?$/i.test(code));

  if (additiveCodes.length === 0) {
    // No problematic additives → all schools: same as general analysis
    return MADHAB_SCHOOLS.map((m) => ({
      madhab: m,
      status: halalAnalysis.status as "halal" | "doubtful" | "haram",
      conflictingAdditives: [],
    }));
  }

  // Fetch all madhab rulings + additive names in one join query
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

  // Type for joined ruling rows
  type RulingRow = {
    additiveCode: string;
    madhab: string;
    ruling: string;
    explanationFr: string;
    scholarlyReference: string | null;
    additiveName: string;
  };

  // Group by madhab
  const byMadhab = new Map<string, RulingRow[]>();
  for (const r of rulings as RulingRow[]) {
    const list = byMadhab.get(r.madhab) ?? [];
    list.push(r);
    byMadhab.set(r.madhab, list);
  }

  // Worst-status logic: haram > doubtful > halal
  const STATUS_WEIGHT = { haram: 3, doubtful: 2, halal: 1, unknown: 0 } as const;

  return MADHAB_SCHOOLS.map((madhab) => {
    const schoolRulings = byMadhab.get(madhab) ?? [];

    // Non-halal rulings for this school
    const conflicting = schoolRulings.filter((r: RulingRow) => r.ruling !== "halal");

    // If no rulings exist for this school, fall back to general analysis status
    const worstStatus = schoolRulings.length > 0
      ? schoolRulings.reduce((worst: "halal" | "doubtful" | "haram", r: RulingRow) => {
          const w = STATUS_WEIGHT[r.ruling as keyof typeof STATUS_WEIGHT] ?? 0;
          const cw = STATUS_WEIGHT[worst as keyof typeof STATUS_WEIGHT] ?? 0;
          return w > cw ? (r.ruling as "halal" | "doubtful" | "haram") : worst;
        }, "halal" as "halal" | "doubtful" | "haram")
      : (halalAnalysis.status as "halal" | "doubtful" | "haram");

    return {
      madhab,
      status: worstStatus,
      conflictingAdditives: conflicting.map((r: RulingRow) => ({
        code: r.additiveCode,
        name: r.additiveName ?? r.additiveCode,
        ruling: r.ruling,
        explanation: r.explanationFr,
        scholarlyReference: r.scholarlyReference,
      })),
    };
  });
}

export const scanRouter = router({
  scanBarcode: protectedProcedure
    .input(
      z.object({
        barcode: z.string().regex(/^[0-9]{4,14}$/, "Code-barres invalide"),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
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

          const [newProduct] = await ctx.db
            .insert(products)
            .values({
              barcode: input.barcode,
              name: off.product_name ?? "Produit inconnu",
              brand: off.brands,
              category: off.categories?.split(",")[0]?.trim(),
              ingredients: off.ingredients_text
                ? off.ingredients_text.split(",").map((i) => i.trim())
                : [],
              halalStatus: halalAnalysis.status,
              confidenceScore: halalAnalysis.confidence,
              certifierName: halalAnalysis.certifierName,
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
        const storedOff = product.offData as Record<string, unknown> | null;
        if (storedOff) {
          halalAnalysis = await analyzeHalalStatus(
            storedOff.ingredients_text as string | undefined,
            storedOff.additives_tags as string[] | undefined,
            storedOff.labels_tags as string[] | undefined,
            storedOff.ingredients_analysis_tags as string[] | undefined,
            analysisOptions,
          );
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

      // 5. Record scan + update user stats
      const result = await ctx.db.transaction(async (tx) => {
        const [scan] = await tx
          .insert(scans)
          .values({
            userId: ctx.userId,
            productId: product?.id,
            barcode: input.barcode,
            halalStatus: product?.halalStatus ?? "unknown",
            confidenceScore: product?.confidenceScore ?? 0,
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
          },
        });

        let newStreak = 1;
        if (user?.lastScanDate) {
          const lastScan = new Date(user.lastScanDate);
          const diffDays = Math.floor(
            (now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays === 0) {
            newStreak = user.currentStreak ?? 1;
          } else if (diffDays === 1) {
            newStreak = (user.currentStreak ?? 0) + 1;
          }
        }

        // Level-up detection
        const previousXp = user?.experiencePoints ?? 0;
        const previousLevel = user?.level ?? 1;
        const newXp = previousXp + 10;
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
          })
          .where(eq(users.id, ctx.userId));

        return {
          scan,
          levelUp: newLevel > previousLevel
            ? { previousLevel, newLevel, newXp }
            : null,
        };
      });

      // 6. Build enriched OFF extras for the mobile app
      const storedOff = (product?.offData ?? offData) as Record<string, unknown> | null;
      const offExtras = storedOff ? {
        nutriscoreGrade: (storedOff.nutriscore_grade as string) ?? null,
        novaGroup: (storedOff.nova_group as number) ?? null,
        ecoscoreGrade: (storedOff.ecoscore_grade as string) ?? null,
        allergensTags: (storedOff.allergens_tags as string[]) ?? [],
        tracesTags: (storedOff.traces_tags as string[]) ?? [],
        additivesTags: (storedOff.additives_tags as string[]) ?? [],
        labelsTags: (storedOff.labels_tags as string[]) ?? [],
        ingredientsAnalysisTags: (storedOff.ingredients_analysis_tags as string[]) ?? [],
        manufacturingPlaces: (storedOff.manufacturing_places as string) ?? null,
        origins: (storedOff.origins as string) ?? null,
      } : null;

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

      // 8. Madhab verdicts — all 4 school opinions for comparative display
      const madhabVerdicts = await computeMadhabVerdicts(ctx.db, halalAnalysis);

      return {
        scan: result.scan,
        product: product ?? null,
        isNewProduct: !product,
        halalAnalysis,
        boycott: boycottResult,
        offExtras,
        personalAlerts,
        communityVerifiedCount: communityCount?.count ?? 0,
        madhabVerdicts,
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

      const items = await ctx.db
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
          },
        })
        .from(scans)
        .leftJoin(products, eq(scans.productId, products.id))
        .where(and(...conditions))
        .orderBy(desc(scans.scannedAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop()!;
        nextCursor = next.id;
      }

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
