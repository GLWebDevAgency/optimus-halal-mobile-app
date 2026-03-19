import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { admins, users, safeUserColumns } from "../../db/schema/index.js";
import { logger } from "../../lib/logger.js";

export const adminRouter = router({
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
