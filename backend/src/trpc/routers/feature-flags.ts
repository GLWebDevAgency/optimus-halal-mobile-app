import { z } from "zod";
import { eq, ilike, desc, sql, and } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { featureFlags, flagUserOverrides, users } from "../../db/schema/index.js";
import {
  resolveUserFlags,
  invalidateFlagsCache,
  invalidateAllUserFlagsCache,
} from "../../services/feature-flags.service.js";
import { logger } from "../../lib/logger.js";
import { TRPCError } from "@trpc/server";

// ── Zod schemas ───────────────────────────────────────────

const flagRuleSchema = z.object({
  attribute: z.string().max(50),
  operator: z.enum(["eq", "neq", "in", "notIn", "gte", "lte", "semverGte", "semverLte"]),
  value: z.union([z.string(), z.array(z.string()), z.number()]),
});

const flagTypeEnum = z.enum(["boolean", "percentage", "variant"]);

// ── Router ────────────────────────────────────────────────

export const featureFlagsRouter = router({
  // ── Public: get resolved flags for authenticated user ───
  getForUser: protectedProcedure
    .input(
      z.object({
        platform: z.string().max(20).optional(),
        appVersion: z.string().max(20).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Fetch user context server-side (never trust client for tier/madhab)
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
        columns: { subscriptionTier: true, madhab: true },
      });

      const userCtx = {
        tier: (user?.subscriptionTier ?? "free") as "free" | "premium",
        madhab: user?.madhab ?? null,
        platform: input.platform ?? null,
        appVersion: input.appVersion ?? null,
      };

      return resolveUserFlags(ctx.db, ctx.userId, userCtx);
    }),

  // ── Admin: list all flags ───────────────────────────────
  list: adminProcedure
    .input(
      z.object({
        search: z.string().max(200).optional(),
        enabled: z.boolean().optional(),
        flagType: flagTypeEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.search) {
        conditions.push(
          ilike(featureFlags.label, `%${input.search}%`)
        );
      }

      if (input.enabled !== undefined) {
        conditions.push(eq(featureFlags.enabled, input.enabled));
      }

      if (input.flagType) {
        conditions.push(eq(featureFlags.flagType, input.flagType));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, [{ count }]] = await Promise.all([
        ctx.db
          .select()
          .from(featureFlags)
          .where(where)
          .orderBy(desc(featureFlags.updatedAt)),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(featureFlags)
          .where(where),
      ]);

      return { items, total: count };
    }),

  // ── Admin: get flag by ID (with overrides) ──────────────
  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const flag = await ctx.db.query.featureFlags.findFirst({
        where: eq(featureFlags.id, input.id),
      });

      if (!flag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Flag introuvable" });
      }

      const overrides = await ctx.db
        .select({
          id: flagUserOverrides.id,
          userId: flagUserOverrides.userId,
          value: flagUserOverrides.value,
          reason: flagUserOverrides.reason,
          createdAt: flagUserOverrides.createdAt,
        })
        .from(flagUserOverrides)
        .where(eq(flagUserOverrides.flagId, input.id));

      return { flag, overrides };
    }),

  // ── Admin: create flag ──────────────────────────────────
  create: adminProcedure
    .input(
      z.object({
        key: z.string().min(1).max(100).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Format: camelCase ou snake_case"),
        label: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        flagType: flagTypeEnum.default("boolean"),
        enabled: z.boolean().default(false),
        defaultValue: z.unknown().default(false),
        rolloutPercentage: z.number().int().min(0).max(100).default(100),
        variants: z.array(z.string()).optional(),
        rules: z.array(flagRuleSchema).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [flag] = await ctx.db
        .insert(featureFlags)
        .values({
          key: input.key,
          label: input.label,
          description: input.description,
          flagType: input.flagType,
          enabled: input.enabled,
          defaultValue: input.defaultValue,
          rolloutPercentage: input.rolloutPercentage,
          variants: input.variants,
          rules: input.rules,
        })
        .returning();

      logger.info("Admin: flag created", { flagKey: input.key, by: ctx.userId });
      await invalidateAllUserFlagsCache();

      return flag;
    }),

  // ── Admin: update flag ──────────────────────────────────
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        label: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).nullable().optional(),
        flagType: flagTypeEnum.optional(),
        enabled: z.boolean().optional(),
        defaultValue: z.unknown().optional(),
        rolloutPercentage: z.number().int().min(0).max(100).optional(),
        variants: z.array(z.string()).nullable().optional(),
        rules: z.array(flagRuleSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const [flag] = await ctx.db
        .update(featureFlags)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(featureFlags.id, id))
        .returning();

      if (!flag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Flag introuvable" });
      }

      logger.info("Admin: flag updated", { flagKey: flag.key, by: ctx.userId });
      await invalidateAllUserFlagsCache();

      return flag;
    }),

  // ── Admin: quick toggle ─────────────────────────────────
  toggle: adminProcedure
    .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [flag] = await ctx.db
        .update(featureFlags)
        .set({ enabled: input.enabled, updatedAt: new Date() })
        .where(eq(featureFlags.id, input.id))
        .returning();

      if (!flag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Flag introuvable" });
      }

      logger.info("Admin: flag toggled", {
        flagKey: flag.key,
        enabled: input.enabled,
        by: ctx.userId,
      });
      await invalidateAllUserFlagsCache();

      return flag;
    }),

  // ── Admin: delete flag (super_admin only) ───────────────
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.adminRole !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Suppression réservée aux super administrateurs",
        });
      }

      const [flag] = await ctx.db
        .delete(featureFlags)
        .where(eq(featureFlags.id, input.id))
        .returning();

      if (!flag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Flag introuvable" });
      }

      logger.info("Admin: flag deleted", { flagKey: flag.key, by: ctx.userId });
      await invalidateAllUserFlagsCache();

      return { success: true };
    }),

  // ── Admin: set user override ────────────────────────────
  setOverride: adminProcedure
    .input(
      z.object({
        flagId: z.string().uuid(),
        userId: z.string().uuid(),
        value: z.unknown(),
        reason: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [override] = await ctx.db
        .insert(flagUserOverrides)
        .values({
          flagId: input.flagId,
          userId: input.userId,
          value: input.value,
          reason: input.reason,
        })
        .onConflictDoUpdate({
          target: [flagUserOverrides.flagId, flagUserOverrides.userId],
          set: { value: input.value, reason: input.reason },
        })
        .returning();

      logger.info("Admin: flag override set", {
        flagId: input.flagId,
        targetUser: input.userId,
        by: ctx.userId,
      });
      await invalidateFlagsCache(input.userId);

      return override;
    }),

  // ── Admin: remove user override ─────────────────────────
  removeOverride: adminProcedure
    .input(
      z.object({
        flagId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(flagUserOverrides)
        .where(
          and(
            eq(flagUserOverrides.flagId, input.flagId),
            eq(flagUserOverrides.userId, input.userId)
          )
        );

      logger.info("Admin: flag override removed", {
        flagId: input.flagId,
        targetUser: input.userId,
        by: ctx.userId,
      });
      await invalidateFlagsCache(input.userId);

      return { success: true };
    }),

  // ── Admin: bulk override (beta testers, etc.) ───────────
  bulkOverride: adminProcedure
    .input(
      z.object({
        flagId: z.string().uuid(),
        userIds: z.array(z.string().uuid()).min(1).max(500),
        value: z.unknown(),
        reason: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const values = input.userIds.map((userId) => ({
        flagId: input.flagId,
        userId,
        value: input.value,
        reason: input.reason,
      }));

      await ctx.db
        .insert(flagUserOverrides)
        .values(values)
        .onConflictDoUpdate({
          target: [flagUserOverrides.flagId, flagUserOverrides.userId],
          set: { value: input.value, reason: input.reason },
        });

      logger.info("Admin: bulk flag override", {
        flagId: input.flagId,
        count: input.userIds.length,
        by: ctx.userId,
      });

      // Invalidate all affected users
      await invalidateAllUserFlagsCache();

      return { count: input.userIds.length };
    }),
});
