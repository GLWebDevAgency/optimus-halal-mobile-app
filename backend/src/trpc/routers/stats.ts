import { sql, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import {
  users,
  products,
  scans,
  stores,
  reports,
  alerts,
} from "../../db/schema/index.js";
import { redis } from "../../lib/redis.js";

export const statsRouter = router({
  global: publicProcedure.query(async ({ ctx }) => {
    // Cache global stats for 5 minutes
    const cached = await redis.get("stats:global");
    if (cached) return JSON.parse(cached);

    const [usersCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isActive, true));

    const [productsCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products);

    const [scansCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(scans);

    const [storesCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(stores)
      .where(eq(stores.isActive, true));

    const [halalCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.halalStatus, "halal"));

    const stats = {
      totalUsers: usersCount?.count ?? 0,
      totalProducts: productsCount?.count ?? 0,
      totalScans: scansCount?.count ?? 0,
      totalStores: storesCount?.count ?? 0,
      halalProducts: halalCount?.count ?? 0,
    };

    await redis.setex("stats:global", 300, JSON.stringify(stats));
    return stats;
  }),

  userDashboard: protectedProcedure.query(async ({ ctx }) => {
    const [scanCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(scans)
      .where(eq(scans.userId, ctx.userId));

    const [reportCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(reports)
      .where(eq(reports.userId, ctx.userId));

    const [activeAlerts] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(alerts)
      .where(
        sql`${alerts.isActive} = true AND (${alerts.expiresAt} IS NULL OR ${alerts.expiresAt} > NOW())`
      );

    const recentScans = await ctx.db
      .select()
      .from(scans)
      .where(eq(scans.userId, ctx.userId))
      .orderBy(sql`${scans.scannedAt} DESC`)
      .limit(5);

    return {
      totalScans: scanCount?.count ?? 0,
      totalReports: reportCount?.count ?? 0,
      activeAlerts: activeAlerts?.count ?? 0,
      recentScans,
    };
  }),
});
