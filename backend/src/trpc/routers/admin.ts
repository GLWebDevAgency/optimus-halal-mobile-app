import { z } from "zod";
import { eq, sql, ilike, or, desc, asc, and, gte, lte, ne, count as drizzleCount } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import {
  admins,
  users,
  safeUserColumns,
  scans,
  products,
  waitlistLeads,
  stores,
  devices,
  refreshTokens,
} from "../../db/schema/index.js";
import { logger } from "../../lib/logger.js";
import { randomBytes } from "node:crypto";
import { hashPassword } from "../../services/auth.service.js";
import { invalidateUserTierCache } from "../context.js";
import { escapeLike } from "../../lib/sql-utils.js";

export const adminRouter = router({
  // ── Dashboard Stats ─────────────────────────────────────────
  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevThirtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      totalUsersResult,
      prev30Users,
      totalScansResult,
      prev30Scans,
      totalProductsResult,
      totalStoresResult,
      premiumUsersResult,
      prev30Premium,
      waitlistCountResult,
      prev30Waitlist,
      dailySignups,
      dailyScans,
    ] = await Promise.all([
      // KPI 1: Total users
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(users),
      // KPI 1 trend: users 30-60 days ago
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(users)
        .where(lte(users.createdAt, thirtyDaysAgo)),
      // KPI 2: Total scans (last 30 days)
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(scans)
        .where(gte(scans.scannedAt, thirtyDaysAgo)),
      // KPI 2 trend: scans 30-60 days ago
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(scans)
        .where(and(gte(scans.scannedAt, prevThirtyDaysAgo), lte(scans.scannedAt, thirtyDaysAgo))),
      // KPI 3: Total products (pg_class estimate — avoids 817K row seq scan)
      ctx.db.execute(sql`SELECT reltuples::int AS count FROM pg_class WHERE relname = 'products'`),
      // KPI 4: Total stores (pg_class estimate)
      ctx.db.execute(sql`SELECT reltuples::int AS count FROM pg_class WHERE relname = 'stores'`),
      // KPI 5: Premium users
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(users)
        .where(eq(users.subscriptionTier, "premium")),
      // KPI 5 trend: premium users 30 days ago
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(users)
        .where(and(eq(users.subscriptionTier, "premium"), lte(users.createdAt, thirtyDaysAgo))),
      // KPI 6: Waitlist count
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(waitlistLeads),
      // KPI 6 trend: waitlist 30 days ago
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(waitlistLeads)
        .where(lte(waitlistLeads.createdAt, thirtyDaysAgo)),
      // Chart: daily signups (30 days)
      ctx.db
        .select({
          date: sql<string>`to_char(${users.createdAt}::date, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(users)
        .where(gte(users.createdAt, thirtyDaysAgo))
        .groupBy(sql`${users.createdAt}::date`)
        .orderBy(sql`${users.createdAt}::date`),
      // Chart: daily scans (30 days)
      ctx.db
        .select({
          date: sql<string>`to_char(${scans.scannedAt}::date, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(scans)
        .where(gte(scans.scannedAt, thirtyDaysAgo))
        .groupBy(sql`${scans.scannedAt}::date`)
        .orderBy(sql`${scans.scannedAt}::date`),
    ]);

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalUsers = totalUsersResult[0]?.count ?? 0;
    const totalScans30d = totalScansResult[0]?.count ?? 0;
    const prevScans30d = prev30Scans[0]?.count ?? 0;
    const premiumCount = premiumUsersResult[0]?.count ?? 0;
    const prevPremiumCount = prev30Premium[0]?.count ?? 0;
    const waitlistCount = waitlistCountResult[0]?.count ?? 0;
    const prevWaitlistCount = prev30Waitlist[0]?.count ?? 0;

    return {
      kpis: {
        totalUsers: {
          value: totalUsers,
          trend: calcTrend(totalUsers, prev30Users[0]?.count ?? 0),
        },
        scansLast30d: {
          value: totalScans30d,
          trend: calcTrend(totalScans30d, prevScans30d),
        },
        totalProducts: {
          value: Number((totalProductsResult[0] as { count?: number })?.count ?? 0),
          trend: null, // static count, no trend
        },
        totalStores: {
          value: Number((totalStoresResult[0] as { count?: number })?.count ?? 0),
          trend: null,
        },
        premiumUsers: {
          value: premiumCount,
          trend: calcTrend(premiumCount, prevPremiumCount),
        },
        waitlistLeads: {
          value: waitlistCount,
          trend: calcTrend(waitlistCount, prevWaitlistCount),
        },
      },
      charts: {
        dailySignups,
        dailyScans,
      },
    };
  }),

  // ── User Detail ─────────────────────────────────────────────
  getUserDetail: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.userId),
        columns: safeUserColumns,
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
      }

      // Parallel: scan history + device info + admin status
      const [recentScans, userDevices, adminRecord] = await Promise.all([
        ctx.db
          .select({
            id: scans.id,
            barcode: scans.barcode,
            halalStatus: scans.halalStatus,
            scannedAt: scans.scannedAt,
            productName: products.name,
          })
          .from(scans)
          .leftJoin(products, eq(scans.productId, products.id))
          .where(eq(scans.userId, input.userId))
          .orderBy(desc(scans.scannedAt))
          .limit(20),
        ctx.db
          .select({
            id: devices.id,
            deviceId: devices.deviceId,
            platform: devices.platform,
            appVersion: devices.appVersion,
            firstSeenAt: devices.firstSeenAt,
            totalScans: devices.totalScans,
          })
          .from(devices)
          .where(eq(devices.userId, input.userId)),
        ctx.db.query.admins.findFirst({
          where: eq(admins.userId, input.userId),
        }),
      ]);

      return {
        user,
        recentScans,
        devices: userDevices,
        isAdmin: !!adminRecord,
        adminRole: adminRecord?.role ?? null,
      };
    }),

  // ── Update User (admin actions) ─────────────────────────────
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        action: z.enum(["ban", "unban", "change_tier", "reset_password", "delete_gdpr"]),
        tier: z.enum(["free", "premium"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, action } = input;

      // Prevent actions on self
      if (userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Impossible de modifier votre propre compte via cette action",
        });
      }

      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, email: true, isActive: true },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
      }

      switch (action) {
        case "ban": {
          await ctx.db.update(users).set({ isActive: false }).where(eq(users.id, userId));
          // Revoke all refresh tokens
          await ctx.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
          logger.info("Admin: user banned", { userId, by: ctx.userId });
          return { success: true, message: `${user.email} a été banni` };
        }

        case "unban": {
          await ctx.db.update(users).set({ isActive: true }).where(eq(users.id, userId));
          logger.info("Admin: user unbanned", { userId, by: ctx.userId });
          return { success: true, message: `${user.email} a été réactivé` };
        }

        case "change_tier": {
          if (ctx.adminRole !== "super_admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Réservé aux super administrateurs" });
          }
          if (!input.tier) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Tier requis" });
          }
          await ctx.db
            .update(users)
            .set({ subscriptionTier: input.tier })
            .where(eq(users.id, userId));
          await invalidateUserTierCache(userId);
          logger.info("Admin: tier changed", { userId, tier: input.tier, by: ctx.userId });
          return { success: true, message: `${user.email} → ${input.tier}` };
        }

        case "reset_password": {
          const tempPassword = randomBytes(16).toString("base64url"); // 128 bits
          const passwordHash = await hashPassword(tempPassword);
          await ctx.db.update(users).set({ passwordHash }).where(eq(users.id, userId));
          // Revoke all refresh tokens to force re-login
          await ctx.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
          // TODO: send tempPassword via email (Resend) instead of returning it
          logger.info("Admin: password reset", { userId, by: ctx.userId });
          return { success: true, message: `Mot de passe réinitialisé pour ${user.email}. L'utilisateur devra se reconnecter.` };
        }

        case "delete_gdpr": {
          // GDPR right to erasure — full cascade thanks to FK onDelete: cascade
          await ctx.db.delete(users).where(eq(users.id, userId));
          logger.info("Admin: GDPR delete", { userId, by: ctx.userId });
          return { success: true, message: `${user.email} supprimé (GDPR)` };
        }
      }
    }),
  /**
   * List users with pagination, search, and tier filter.
   * Requires admin access.
   */
  listUsers: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        search: z.string().trim().optional(),
        tier: z.enum(["free", "premium"]).optional(),
        sortBy: z.enum(["createdAt", "totalScans", "email"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, tier, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      // Build WHERE conditions
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(users.email, `%${escapeLike(search)}%`),
            ilike(users.displayName, `%${escapeLike(search)}%`)
          )
        );
      }
      if (tier) {
        conditions.push(eq(users.subscriptionTier, tier));
      }

      const where = conditions.length > 0
        ? sql`${sql.join(conditions.map(c => sql`(${c})`), sql` AND `)}`
        : undefined;

      // Sort
      const sortColumn = sortBy === "totalScans" ? users.totalScans
        : sortBy === "email" ? users.email
        : users.createdAt;
      const orderFn = sortOrder === "asc" ? asc : desc;

      const [[countResult], items] = await Promise.all([
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(where),
        ctx.db
          .select({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
            subscriptionTier: users.subscriptionTier,
            madhab: users.madhab,
            totalScans: users.totalScans,
            isActive: users.isActive,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(where)
          .orderBy(orderFn(sortColumn))
          .limit(limit)
          .offset(offset),
      ]);

      const total = countResult?.count ?? 0;
      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // ── Conversion Funnel ────────────────────────────────────────
  /**
   * Free→Premium conversion funnel for admin dashboard.
   *
   * Returns:
   *  - Global KPIs: conversion rate, hot free users, trial stats
   *  - "Hot" free users (quota_hits >= 2, active in 7d) — priorité conversion
   *  - Guest devices with high engagement (no email)
   *  - Paywall funnel: seen → blocked → converted
   */
  conversionFunnel: adminProcedure.query(async ({ ctx }) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      // Registered users: free vs premium counts
      freeUsersCount,
      premiumUsersCount,
      // Free users "chauds" — ont touché le quota récemment
      hotFreeUsers,
      // Paywall funnel KPIs (registered users)
      paywallFunnel,
      // Guest devices still unconverted (no userId)
      guestDevicesCount,
      // Guest devices "chauds"
      hotGuestDevices,
      // Trial stats
      trialStats,
      // Recent conversions (device → user, last 30d)
      recentConversions,
    ] = await Promise.all([
      // Free users total
      ctx.db.select({ count: sql<number>`count(*)::int` })
        .from(users).where(eq(users.subscriptionTier, "free")),

      // Premium users total
      ctx.db.select({ count: sql<number>`count(*)::int` })
        .from(users).where(eq(users.subscriptionTier, "premium")),

      // Hot free users: quota_hits >= 2, active last 7d
      ctx.db.select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        quotaHitsCount: users.quotaHitsCount,
        paywallSeenCount: users.paywallSeenCount,
        featureBlockedCount: users.featureBlockedCount,
        totalScans: users.totalScans,
        lastActiveAt: users.lastActiveAt,
        firstScanAt: users.firstScanAt,
        createdAt: users.createdAt,
      })
        .from(users)
        .where(and(
          eq(users.subscriptionTier, "free"),
          gte(users.quotaHitsCount, 2),
          gte(users.lastActiveAt, sevenDaysAgo),
        ))
        .orderBy(desc(users.quotaHitsCount), desc(users.lastActiveAt))
        .limit(50),

      // Paywall funnel aggregates for registered users
      ctx.db.select({
        totalPaywallImpressions: sql<number>`sum(paywall_seen_count)::int`,
        totalFeatureBlocks: sql<number>`sum(feature_blocked_count)::int`,
        totalQuotaHits: sql<number>`sum(quota_hits_count)::int`,
        usersWithPaywallSeen: sql<number>`count(*) filter (where paywall_seen_count > 0)::int`,
        usersWithQuotaHit: sql<number>`count(*) filter (where quota_hits_count > 0)::int`,
      })
        .from(users)
        .where(eq(users.subscriptionTier, "free")),

      // Guest devices count (not yet converted)
      ctx.db.select({ count: sql<number>`count(*)::int` })
        .from(devices).where(sql`converted_at IS NULL`),

      // Hot guest devices: quota_hits >= 2, active last 7d
      ctx.db.select({
        deviceId: devices.deviceId,
        platform: devices.platform,
        totalScans: devices.totalScans,
        quotaHitsCount: devices.quotaHitsCount,
        paywallSeenCount: devices.paywallSeenCount,
        trialExpiresAt: devices.trialExpiresAt,
        firstSeenAt: devices.firstSeenAt,
        lastActiveAt: devices.lastActiveAt,
      })
        .from(devices)
        .where(and(
          sql`converted_at IS NULL`,
          gte(devices.quotaHitsCount, 2),
          gte(devices.lastActiveAt, sevenDaysAgo),
        ))
        .orderBy(desc(devices.quotaHitsCount), desc(devices.lastActiveAt))
        .limit(50),

      // Trial stats: active trials + expired unconverted
      ctx.db.select({
        activeTrial: sql<number>`count(*) filter (where trial_expires_at > now() and converted_at is null)::int`,
        expiredUnconverted: sql<number>`count(*) filter (where trial_expires_at <= now() and converted_at is null)::int`,
        converted: sql<number>`count(*) filter (where converted_at is not null)::int`,
      }).from(devices),

      // Recent conversions: devices converted in last 30d
      ctx.db.select({ count: sql<number>`count(*)::int` })
        .from(devices)
        .where(and(
          sql`converted_at IS NOT NULL`,
          gte(devices.convertedAt, thirtyDaysAgo),
        )),
    ]);

    const freeCount = freeUsersCount[0]?.count ?? 0;
    const premiumCount = premiumUsersCount[0]?.count ?? 0;
    const totalRegistered = freeCount + premiumCount;
    const conversionRate = totalRegistered > 0
      ? Math.round((premiumCount / totalRegistered) * 100 * 10) / 10
      : 0;

    return {
      kpis: {
        freeUsers: freeCount,
        premiumUsers: premiumCount,
        conversionRate, // %
        guestDevices: guestDevicesCount[0]?.count ?? 0,
        recentConversions30d: recentConversions[0]?.count ?? 0,
        trial: trialStats[0] ?? { activeTrial: 0, expiredUnconverted: 0, converted: 0 },
      },
      paywallFunnel: paywallFunnel[0] ?? {
        totalPaywallImpressions: 0,
        totalFeatureBlocks: 0,
        totalQuotaHits: 0,
        usersWithPaywallSeen: 0,
        usersWithQuotaHit: 0,
      },
      // Registered free users with high conversion intent
      hotFreeUsers,
      // Anonymous devices with high engagement (push only — no email)
      hotGuestDevices,
    };
  }),

  /**
   * Recent scans across all users — for admin dashboard.
   */
  recentScans: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: scans.id,
          barcode: scans.barcode,
          halalStatus: scans.halalStatus,
          scannedAt: scans.scannedAt,
          userEmail: users.email,
          productName: products.name,
        })
        .from(scans)
        .leftJoin(users, eq(scans.userId, users.id))
        .leftJoin(products, eq(scans.productId, products.id))
        .orderBy(desc(scans.scannedAt))
        .limit(input.limit);

      return rows;
    }),

  /**
   * Check if the authenticated user has admin access.
   * Returns admin info if found, throws FORBIDDEN otherwise.
   * Used by the web admin panel after login to verify admin status.
   */
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    const [admin, user] = await Promise.all([
      ctx.db.query.admins.findFirst({
        where: eq(admins.userId, ctx.userId),
      }),
      ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
        columns: safeUserColumns,
      }),
    ]);

    if (!admin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Accès réservé aux administrateurs",
      });
    }

    return {
      adminId: admin.id,
      role: admin.role,
      user,
    };
  }),

  /**
   * List all admins. Requires super_admin role.
   */
  list: adminProcedure.query(async ({ ctx }) => {
    if (ctx.adminRole !== "super_admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Réservé aux super administrateurs",
      });
    }

    const result = await ctx.db
      .select({
        adminId: admins.id,
        role: admins.role,
        createdAt: admins.createdAt,
        userId: users.id,
        email: users.email,
        displayName: users.displayName,
      })
      .from(admins)
      .innerJoin(users, eq(admins.userId, users.id))
      .orderBy(admins.createdAt);

    return result;
  }),

  /**
   * Grant admin access to a user by email. Requires super_admin role.
   */
  grant: adminProcedure
    .input(
      z.object({
        email: z.string().trim().email(),
        role: z.enum(["admin", "super_admin"]).default("admin"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.adminRole !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Réservé aux super administrateurs",
        });
      }

      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email.toLowerCase().trim()),
        columns: { id: true, email: true, displayName: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Aucun utilisateur avec l'email ${input.email}`,
        });
      }

      const existing = await ctx.db.query.admins.findFirst({
        where: eq(admins.userId, user.id),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `${input.email} est déjà administrateur`,
        });
      }

      const [admin] = await ctx.db
        .insert(admins)
        .values({
          userId: user.id,
          role: input.role,
          grantedBy: ctx.userId,
        })
        .returning();

      logger.info("Admin granted", {
        adminId: admin.id,
        userId: user.id,
        role: input.role,
        grantedBy: ctx.userId,
      });

      return { adminId: admin.id, role: admin.role, user };
    }),

  /**
   * Revoke admin access. Requires super_admin role.
   * Cannot revoke own access (safety).
   */
  revoke: adminProcedure
    .input(z.object({ adminId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.adminRole !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Réservé aux super administrateurs",
        });
      }

      const admin = await ctx.db.query.admins.findFirst({
        where: eq(admins.id, input.adminId),
      });

      if (!admin) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Administrateur introuvable",
        });
      }

      if (admin.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Impossible de révoquer votre propre accès",
        });
      }

      await ctx.db.delete(admins).where(eq(admins.id, input.adminId));

      logger.info("Admin revoked", {
        adminId: input.adminId,
        revokedBy: ctx.userId,
      });

      return { success: true };
    }),
});
