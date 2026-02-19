import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../trpc.js";
import { reports, reviews, reviewHelpfulVotes, products, stores } from "../../db/schema/index.js";
import { notFound } from "../../lib/errors.js";

export const reportRouter = router({
  // ── Reports ─────────────────────────────────────────────

  createReport: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "incorrect_halal_status",
          "wrong_ingredients",
          "missing_product",
          "store_issue",
          "other",
        ]),
        productId: z.string().uuid().optional(),
        storeId: z.string().uuid().optional(),
        title: z.string().trim().min(5).max(255),
        description: z.string().trim().min(10).max(2000),
        photoUrls: z.array(z.string().url()).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [report] = await ctx.db
        .insert(reports)
        .values({ ...input, userId: ctx.userId })
        .returning();
      return report;
    }),

  getMyReports: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(reports)
        .where(eq(reports.userId, ctx.userId))
        .orderBy(desc(reports.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  // ── Reviews ─────────────────────────────────────────────

  createReview: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid().optional(),
        storeId: z.string().uuid().optional(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().max(2000).optional(),
        photoUrls: z.array(z.string().url()).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Transaction: insert review + update store rating
      return ctx.db.transaction(async (tx) => {
        const [review] = await tx
          .insert(reviews)
          .values({ ...input, userId: ctx.userId })
          .returning();

        // Update store average rating if storeId provided
        if (input.storeId) {
          const [stats] = await tx
            .select({
              avg: sql<number>`AVG(${reviews.rating})::float`,
              count: sql<number>`count(*)::int`,
            })
            .from(reviews)
            .where(eq(reviews.storeId, input.storeId));

          if (stats) {
            await tx
              .update(stores)
              .set({
                averageRating: stats.avg,
                reviewCount: stats.count,
                updatedAt: new Date(),
              })
              .where(eq(stores.id, input.storeId));
          }
        }

        return review;
      });
    }),

  getProductReviews: publicProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(reviews)
        .where(eq(reviews.productId, input.productId))
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getStoreReviews: publicProcedure
    .input(
      z.object({
        storeId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(reviews)
        .where(eq(reviews.storeId, input.storeId))
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  markHelpful: protectedProcedure
    .input(z.object({ reviewId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Insert vote — if already exists, do nothing (deduplication)
      const [vote] = await ctx.db
        .insert(reviewHelpfulVotes)
        .values({
          reviewId: input.reviewId,
          userId: ctx.userId,
        })
        .onConflictDoNothing()
        .returning();

      if (!vote) {
        return { success: false, alreadyVoted: true };
      }

      await ctx.db
        .update(reviews)
        .set({ helpfulCount: sql`${reviews.helpfulCount} + 1` })
        .where(eq(reviews.id, input.reviewId));

      return { success: true, alreadyVoted: false };
    }),
});
