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
      // Geohash precision 5 (~5km cells) for cache key
      const gh = ngeohash.encode(input.latitude, input.longitude, 5);
      const cacheKey = `stores:v1:nearby:${gh}:${input.storeType ?? "all"}:${input.halalCertifiedOnly ? "1" : "0"}`;

      return withCache(ctx.redis, cacheKey, 300, async () => {
        const radiusMeters = input.radiusKm * 1000;
        const point = sql`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography`;

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
            distance: sql<number>`round(ST_Distance("stores"."location", ${point})::numeric)`.as("distance"),
          })
          .from(stores)
          .where(and(...conditions))
          .orderBy(sql`ST_Distance("stores"."location", ${point})`)
          .limit(input.limit);
      });
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
