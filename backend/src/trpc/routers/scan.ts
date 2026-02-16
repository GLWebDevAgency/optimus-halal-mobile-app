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
} from "../../db/schema/index.js";
import {
  lookupBarcode,
  analyzeHalalStatus,
  type HalalAnalysis,
} from "../../services/barcode.service.js";
import { matchAllergens } from "../../services/allergen.service.js";
import { notFound } from "../../lib/errors.js";

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

export const scanRouter = router({
  scanBarcode: protectedProcedure
    .input(
      z.object({
        barcode: z.string().min(1).max(50),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
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
          .where(inArray(additivesTable.code, codes));

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
          columns: { lastScanDate: true, currentStreak: true, longestStreak: true },
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

        await tx
          .update(users)
          .set({
            totalScans: sql`${users.totalScans} + 1`,
            experiencePoints: sql`${users.experiencePoints} + 10`,
            currentStreak: newStreak,
            longestStreak: sql`GREATEST(${users.longestStreak}, ${newStreak})`,
            lastScanDate: now,
            updatedAt: now,
          })
          .where(eq(users.id, ctx.userId));

        return scan;
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

      return {
        scan: result,
        product: product ?? null,
        isNewProduct: !product,
        halalAnalysis,
        boycott: boycottResult,
        offExtras,
        personalAlerts,
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
        barcode: z.string().min(1).max(50),
        productName: z.string().max(255).optional(),
        brandName: z.string().max(255).optional(),
        photoUrls: z.array(z.string().url()).optional(),
        notes: z.string().max(1000).optional(),
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
