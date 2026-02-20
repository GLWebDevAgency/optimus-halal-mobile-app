import { z } from "zod";
import { eq, and, ilike, or, desc, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { stores, storeHours, storeSubscriptions } from "../../db/schema/index.js";
import { notFound, conflict } from "../../lib/errors.js";
import { withCache } from "../../lib/cache.js";
import ngeohash from "ngeohash";

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

export const storeRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().max(200).optional(),
        storeType: z
          .enum([
            "supermarket", "butcher", "restaurant", "bakery",
            "abattoir", "wholesaler", "online", "other",
          ])
          .optional(),
        certifier: z
          .enum([
            "avs", "achahada", "argml", "mosquee_de_paris",
            "mosquee_de_lyon", "other", "none",
          ])
          .optional(),
        city: z.string().optional(),
        halalCertifiedOnly: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(stores.isActive, true)];

      if (input.query) {
        const q = escapeLike(input.query);
        conditions.push(
          or(
            ilike(stores.name, `%${q}%`),
            ilike(stores.address, `%${q}%`)
          )!
        );
      }
      if (input.storeType) conditions.push(eq(stores.storeType, input.storeType));
      if (input.certifier) conditions.push(eq(stores.certifier, input.certifier));
      if (input.city) conditions.push(ilike(stores.city, `%${escapeLike(input.city)}%`));
      if (input.halalCertifiedOnly) conditions.push(eq(stores.halalCertified, true));

      const items = await ctx.db
        .select()
        .from(stores)
        .where(and(...conditions))
        .orderBy(desc(stores.averageRating))
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(stores)
        .where(and(...conditions));

      return { items, total: count };
    }),

  nearby: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radiusKm: z.number().min(0.1).max(50).default(5),
        storeType: z
          .enum([
            "supermarket", "butcher", "restaurant", "bakery",
            "abattoir", "wholesaler", "online", "other",
          ])
          .optional(),
        halalCertifiedOnly: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // Dynamic geohash precision: coarser at wide radius, finer at urban zoom
      // p4=~39km (country), p5=~5km (city), p6=~1.2km (neighborhood)
      const ghPrecision = input.radiusKm <= 2 ? 6 : input.radiusKm <= 10 ? 5 : 4;
      const gh = ngeohash.encode(input.latitude, input.longitude, ghPrecision);
      const cacheKey = `stores:v4:nearby:${gh}:r${input.radiusKm}:l${input.limit}:t${input.storeType ?? "all"}:h${input.halalCertifiedOnly ? "1" : "0"}`;

      return withCache(ctx.redis, cacheKey, 300, async () => {
        const radiusMeters = Math.max(input.radiusKm * 1000, 100); // Guard: minimum 100m
        const point = sql`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography`;

        // Relevance scoring formula — single source of truth (used in SELECT + ORDER BY)
        const relevanceExpr = sql`(
          0.35 * (1.0 - LEAST(ST_Distance("stores"."location", ${point}) / ${radiusMeters}, 1.0))
          + 0.25 * CASE WHEN "stores"."halal_certified" THEN COALESCE("stores"."average_rating", 2.5) / 5.0 ELSE 0 END
          + 0.20 * (ln(1 + COALESCE("stores"."review_count", 0)) / ln(501.0))
          + 0.15 * CASE WHEN COALESCE("stores"."review_count", 0) > 0 THEN (COALESCE("stores"."average_rating", 2.5) - 1.0) / 4.0 ELSE 0.5 END
          + 0.05 * (1.0 / (1 + EXTRACT(EPOCH FROM NOW() - COALESCE("stores"."updated_at", "stores"."created_at")) / 7776000.0))
        )`;

        const conditions = [
          eq(stores.isActive, true),
          sql`ST_DWithin("stores"."location", ${point}, ${radiusMeters})`,
        ];

        if (input.storeType) conditions.push(eq(stores.storeType, input.storeType));
        if (input.halalCertifiedOnly) conditions.push(eq(stores.halalCertified, true));

        return ctx.db
          .select({
            id: stores.id,
            name: stores.name,
            storeType: stores.storeType,
            imageUrl: stores.imageUrl,
            address: stores.address,
            city: stores.city,
            postalCode: stores.postalCode,
            phone: stores.phone,
            website: stores.website,
            latitude: stores.latitude,
            longitude: stores.longitude,
            halalCertified: stores.halalCertified,
            certifier: stores.certifier,
            certifierName: stores.certifierName,
            averageRating: stores.averageRating,
            reviewCount: stores.reviewCount,
            todayOpen: sql<string | null>`(
              SELECT sh.open_time::text FROM store_hours sh
              WHERE sh.store_id = stores.id
              AND sh.day_of_week = EXTRACT(DOW FROM NOW())::int
              AND NOT sh.is_closed
              LIMIT 1
            )`.as("today_open"),
            todayClose: sql<string | null>`(
              SELECT sh.close_time::text FROM store_hours sh
              WHERE sh.store_id = stores.id
              AND sh.day_of_week = EXTRACT(DOW FROM NOW())::int
              AND NOT sh.is_closed
              LIMIT 1
            )`.as("today_close"),
            distance: sql<number>`round(ST_Distance("stores"."location", ${point}))::float8`.as("distance"),
            relevanceScore: sql<number>`round((${relevanceExpr})::numeric, 3)::float8`.as("relevance_score"),
          })
          .from(stores)
          .where(and(...conditions))
          .orderBy(sql`${relevanceExpr} DESC`)
          .limit(input.limit);
      }, undefined, { skipEmpty: true });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const store = await ctx.db.query.stores.findFirst({
        where: eq(stores.id, input.id),
      });
      if (!store) throw notFound("Magasin introuvable");

      const hours = await ctx.db.query.storeHours.findMany({
        where: eq(storeHours.storeId, input.id),
        orderBy: (h, { asc }) => [asc(h.dayOfWeek)],
      });

      return { ...store, hours };
    }),

  subscribe: protectedProcedure
    .input(z.object({ storeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [sub] = await ctx.db
          .insert(storeSubscriptions)
          .values({ userId: ctx.userId, storeId: input.storeId })
          .returning();
        return sub;
      } catch {
        throw conflict("Vous êtes déjà abonné à ce magasin");
      }
    }),

  unsubscribe: protectedProcedure
    .input(z.object({ storeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(storeSubscriptions)
        .where(
          and(
            eq(storeSubscriptions.userId, ctx.userId),
            eq(storeSubscriptions.storeId, input.storeId)
          )
        );
      return { success: true };
    }),

  getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const subs = await ctx.db
      .select({
        subscription: storeSubscriptions,
        store: stores,
      })
      .from(storeSubscriptions)
      .innerJoin(stores, eq(storeSubscriptions.storeId, stores.id))
      .where(eq(storeSubscriptions.userId, ctx.userId));

    return subs.map((s) => ({ ...s.store, subscribedAt: s.subscription.createdAt }));
  }),
});
