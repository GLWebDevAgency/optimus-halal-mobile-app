import { z } from "zod";
import { eq, sql, ilike, or, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { admins, users, safeUserColumns, scans, products } from "../../db/schema/index.js";
import { logger } from "../../lib/logger.js";

export const adminRouter = router({
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
            ilike(users.email, `%${search}%`),
            ilike(users.displayName, `%${search}%`)
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

      // Count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(where);

      // Data
      const items = await ctx.db
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
        .offset(offset);

      return {
        items,
        total: countResult?.count ?? 0,
        page,
        totalPages: Math.ceil((countResult?.count ?? 0) / limit),
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
    const admin = await ctx.db.query.admins.findFirst({
      where: eq(admins.userId, ctx.userId),
    });

    if (!admin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Accès réservé aux administrateurs",
      });
    }

    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: safeUserColumns,
    });

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
