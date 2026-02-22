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

      // Single query: COUNT(*) OVER() piggybacks total onto each row
      const rows = await ctx.db
        .select({
          store: stores,
          total: sql<number>`count(*)::int OVER()`.as("total"),
        })
        .from(stores)
        .where(and(...conditions))
        .orderBy(desc(stores.averageRating))
        .limit(input.limit)
        .offset(input.offset);

      return {
        items: rows.map((r) => r.store),
        total: rows[0]?.total ?? 0,
      };
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
        openNow: z.boolean().default(false),
        minRating: z.number().min(0).max(5).optional(),
        query: z.string().max(200).optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // Dynamic geohash precision: coarser at wide radius, finer at urban zoom
      const ghPrecision = input.radiusKm <= 2 ? 6 : input.radiusKm <= 10 ? 5 : 4;
      const gh = ngeohash.encode(input.latitude, input.longitude, ghPrecision);
      const rBucket = Math.round(input.radiusKm * 2) / 2;
      const cacheKey = `stores:v7:nearby:${gh}:r${rBucket}:l${input.limit}:t${input.storeType ?? "all"}:h${input.halalCertifiedOnly ? "1" : "0"}:o${input.openNow ? "1" : "0"}:mr${input.minRating ?? "x"}:q${input.query ?? ""}`;

      // Reduce TTL when openNow filter is active (status changes in real-time)
      const ttl = input.openNow ? 60 : 300;

      return withCache(ctx.redis, cacheKey, ttl, async () => {
        const radiusMeters = Math.max(input.radiusKm * 1000, 100);
        const point = sql`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography`;

        const conditions = [
          sql`s."is_active" = true`,
          sql`ST_DWithin(s."location", ${point}, ${radiusMeters})`,
        ];

        if (input.storeType) conditions.push(sql`s."store_type" = ${input.storeType}`);
        if (input.halalCertifiedOnly) conditions.push(sql`s."halal_certified" = true`);
        if (input.minRating) conditions.push(sql`s."average_rating" >= ${input.minRating}`);
        if (input.query) {
          const q = escapeLike(input.query);
          conditions.push(sql`(s."name" ILIKE ${"%" + q + "%"} OR s."address" ILIKE ${"%" + q + "%"})`);
        }

        // CTE: compute ST_Distance ONCE + LEFT JOIN store_hours for open status
        // Timezone: Europe/Paris (G2 fix — UTC would be wrong at 1am Paris)
        const rows = await ctx.db.execute(sql`
          WITH ranked AS (
            SELECT
              s."id", s."name", s."store_type", s."image_url",
              s."address", s."city", s."phone",
              s."latitude", s."longitude",
              s."halal_certified", s."certifier", s."certifier_name",
              s."average_rating", s."review_count",
              round(ST_Distance(s."location", ${point}))::float8 AS distance,
              EXTRACT(EPOCH FROM NOW() - COALESCE(s."updated_at", s."created_at")) AS age_seconds,
              sh."open_time", sh."close_time", sh."is_closed",
              CASE
                WHEN sh."id" IS NULL THEN 'unknown'
                WHEN sh."is_closed" THEN 'closed'
                WHEN to_char(NOW() AT TIME ZONE 'Europe/Paris', 'HH24:MI') >= sh."open_time"
                     AND to_char(NOW() AT TIME ZONE 'Europe/Paris', 'HH24:MI') < sh."close_time"
                THEN
                  CASE
                    WHEN sh."close_time" IS NOT NULL
                         AND (sh."close_time"::time - (NOW() AT TIME ZONE 'Europe/Paris')::time) < interval '30 minutes'
                         AND (sh."close_time"::time - (NOW() AT TIME ZONE 'Europe/Paris')::time) > interval '0 minutes'
                    THEN 'closing_soon'
                    ELSE 'open'
                  END
                WHEN sh."open_time" IS NOT NULL
                     AND ((sh."open_time"::time - (NOW() AT TIME ZONE 'Europe/Paris')::time) < interval '30 minutes')
                     AND ((sh."open_time"::time - (NOW() AT TIME ZONE 'Europe/Paris')::time) > interval '0 minutes')
                THEN 'opening_soon'
                ELSE 'closed'
              END AS open_status
            FROM "stores" s
            LEFT JOIN "store_hours" sh
              ON sh."store_id" = s."id"
              AND sh."day_of_week" = EXTRACT(DOW FROM NOW() AT TIME ZONE 'Europe/Paris')::int
            WHERE ${sql.join(conditions, sql` AND `)}
          )
          SELECT
            *,
            round((
              0.35 * (1.0 - LEAST(distance / GREATEST(${radiusMeters}::float8, 1.0), 1.0))
              + 0.25 * CASE WHEN halal_certified THEN COALESCE(average_rating, 2.5) / 5.0 ELSE 0 END
              + 0.20 * (ln(1 + COALESCE(review_count, 0)) / ln(501.0))
              + 0.15 * CASE WHEN COALESCE(review_count, 0) > 0 THEN (COALESCE(average_rating, 2.5) - 1.0) / 4.0 ELSE 0.5 END
              + 0.05 * (1.0 / (1 + COALESCE(age_seconds, 0) / 7776000.0))
            )::numeric, 3)::float8 AS relevance_score
          FROM ranked
          ${input.openNow ? sql`WHERE open_status IN ('open', 'closing_soon')` : sql``}
          ORDER BY relevance_score DESC
          LIMIT ${input.limit}
        `);

        return (rows as Record<string, unknown>[]).map((row) => ({
          id: row.id as string,
          name: row.name as string,
          storeType: row.store_type as string,
          imageUrl: row.image_url as string | null,
          address: row.address as string,
          city: row.city as string,
          phone: row.phone as string | null,
          latitude: row.latitude as number,
          longitude: row.longitude as number,
          halalCertified: row.halal_certified as boolean,
          certifier: row.certifier as string,
          certifierName: row.certifier_name as string | null,
          averageRating: row.average_rating as number,
          reviewCount: row.review_count as number,
          distance: row.distance as number,
          relevanceScore: row.relevance_score as number,
          openStatus: row.open_status as string,
          openTime: row.open_time as string | null,
          closeTime: row.close_time as string | null,
        }));
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
