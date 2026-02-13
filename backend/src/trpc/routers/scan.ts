import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import {
  scans,
  products,
  users,
  analysisRequests,
} from "../../db/schema/index.js";
import {
  lookupBarcode,
  analyzeHalalStatus,
} from "../../services/barcode.service.js";
import { notFound } from "../../lib/errors.js";

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
      // 1. Check if product exists in DB
      let product = await ctx.db.query.products.findFirst({
        where: eq(products.barcode, input.barcode),
      });

      // 2. If not, fetch from OpenFoodFacts
      if (!product) {
        const offResult = await lookupBarcode(input.barcode);

        if (offResult.found && offResult.product) {
          const off = offResult.product;
          const analysis = analyzeHalalStatus(off.ingredients_text);

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
              halalStatus: analysis.status,
              confidenceScore: analysis.confidence,
              imageUrl: off.image_front_url ?? off.image_url,
              nutritionFacts: off.nutriments ?? null,
              offData: off,
              lastSyncedAt: new Date(),
            })
            .returning();

          product = newProduct;
        }
      }

      // 3. Record the scan
      const [scan] = await ctx.db
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

      // 4. Update user stats
      const now = new Date();
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
        columns: { lastScanDate: true, currentStreak: true, longestStreak: true },
      });

      let newStreak = 1;
      if (user?.lastScanDate) {
        const lastScan = new Date(user.lastScanDate);
        const diffDays = Math.floor(
          (now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays <= 1) {
          newStreak = (user.currentStreak ?? 0) + 1;
        }
      }

      await ctx.db
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

      return {
        scan,
        product: product ?? null,
        isNewProduct: !product,
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
      const items = await ctx.db.query.scans.findMany({
        where: eq(scans.userId, ctx.userId),
        orderBy: desc(scans.scannedAt),
        limit: input.limit + 1,
        with: {
          // Will need relations setup — fallback to manual join if needed
        },
      });

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
