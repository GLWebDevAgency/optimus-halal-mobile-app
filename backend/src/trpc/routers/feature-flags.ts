import { z } from "zod";
import { eq, ilike, desc, sql, and } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc.js";
import { featureFlags, flagUserOverrides, flagAuditHistory, users } from "../../db/schema/index.js";
import {
  resolveUserFlags,
  invalidateFlagsCache,
  invalidateAllUserFlagsCache,
} from "../../services/feature-flags.service.js";
import { logger } from "../../lib/logger.js";
import { escapeLike } from "../../lib/sql-utils.js";
import { TRPCError } from "@trpc/server";
import type { db as DB } from "../../db/index.js";

// ── Zod schemas ───────────────────────────────────────────

const flagRuleSchema = z.object({
  attribute: z.string().max(50),
  operator: z.enum(["eq", "neq", "in", "notIn", "gte", "lte", "semverGte", "semverLte"]),
  value: z.union([z.string(), z.array(z.string()), z.number()]),
});

const flagTypeEnum = z.enum(["boolean", "percentage", "variant"]);

// ── Audit helper ──────────────────────────────────────────

async function logAudit(
  db: typeof DB,
  params: {
    flagId: string;
    action: string;
    actorId: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
    metadata?: Record<string, unknown>;
  },
) {
  try {
    await db.insert(flagAuditHistory).values({
      flagId: params.flagId,
      action: params.action,
      actorId: params.actorId,
      actorType: "admin",
      changes: params.changes ?? null,
      metadata: params.metadata ?? null,
    });
  } catch {
    // Non-fatal — never block a mutation because audit logging failed
    logger.warn("Failed to write flag audit log", { action: params.action, flagId: params.flagId });
  }
}

// ── Diff helper for update mutations ──────────────────────

function diffChanges(
  before: Record<string, unknown>,
  updates: Record<string, unknown>,
): Record<string, { old: unknown; new: unknown }> | undefined {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, newVal] of Object.entries(updates)) {
    if (newVal === undefined) continue;
    const oldVal = before[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal, new: newVal };
    }
  }
  return Object.keys(changes).length > 0 ? changes : undefined;
}

// ── Router ────────────────────────────────────────────────

export const featureFlagsRouter = router({
  // ── Public: get global flags for guests (no auth required) ───
  // Resolves all enabled flags without user overrides or user context.
  // Returns the same flags for every guest (cacheable aggressively).
  getGlobal: publicProcedure
    .input(
      z.object({
        platform: z.string().max(20).optional(),
        appVersion: z.string().max(20).optional(),
      })
    )
    .query(async ({ ctx }) => {
      const allFlags = await ctx.db.select().from(featureFlags);

      const result: Record<string, unknown> = {};
      for (const flag of allFlags) {
        if (!flag.enabled) {
          result[flag.key] = flag.defaultValue;
          continue;
        }
        // For guests: boolean enabled flags → true, others → defaultValue
        if (flag.flagType === "boolean") {
          result[flag.key] = true;
        } else {
          result[flag.key] = flag.defaultValue;
        }
      }
      return result;
    }),

  // ── Protected: get resolved flags for authenticated user ───
  getForUser: protectedProcedure
    .input(
      z.object({
        platform: z.string().max(20).optional(),
        appVersion: z.string().max(20).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
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
        conditions.push(ilike(featureFlags.label, `%${escapeLike(input.search)}%`));
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

  // ── Admin: get flag by ID (with overrides + audit) ──────
  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const flag = await ctx.db.query.featureFlags.findFirst({
        where: eq(featureFlags.id, input.id),
      });

      if (!flag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Flag introuvable" });
      }

      const [overrides, auditLog] = await Promise.all([
        ctx.db
          .select({
            id: flagUserOverrides.id,
            userId: flagUserOverrides.userId,
            value: flagUserOverrides.value,
            reason: flagUserOverrides.reason,
            createdAt: flagUserOverrides.createdAt,
          })
          .from(flagUserOverrides)
          .where(eq(flagUserOverrides.flagId, input.id)),
        ctx.db
          .select()
          .from(flagAuditHistory)
          .where(eq(flagAuditHistory.flagId, input.id))
          .orderBy(desc(flagAuditHistory.createdAt))
          .limit(50),
      ]);

      return { flag, overrides, auditLog };
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

      await logAudit(ctx.db, {
        flagId: flag.id,
        action: "create",
        actorId: ctx.userId,
        metadata: { key: input.key, flagType: input.flagType },
      });

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

      // Fetch current state for diff
      const before = await ctx.db.query.featureFlags.findFirst({
        where: eq(featureFlags.id, id),
      });

      if (!before) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Flag introuvable" });
      }

      const [flag] = await ctx.db
        .update(featureFlags)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(featureFlags.id, id))
        .returning();

      const changes = diffChanges(before as unknown as Record<string, unknown>, updates);
      await logAudit(ctx.db, {
        flagId: id,
        action: "update",
        actorId: ctx.userId,
        changes,
      });

      logger.info("Admin: flag updated", { flagKey: flag.key, by: ctx.userId });
      await invalidateAllUserFlagsCache();

      return flag;
    }),

  // ── Admin: quick toggle ─────────────────────────────────
  toggle: adminProcedure
    .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.query.featureFlags.findFirst({
        where: eq(featureFlags.id, input.id),
        columns: { enabled: true },
      });

      const [flag] = await ctx.db
        .update(featureFlags)
        .set({ enabled: input.enabled, updatedAt: new Date() })
        .where(eq(featureFlags.id, input.id))
        .returning();

      if (!flag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Flag introuvable" });
      }

      await logAudit(ctx.db, {
        flagId: input.id,
        action: "toggle",
        actorId: ctx.userId,
        changes: { enabled: { old: before?.enabled, new: input.enabled } },
      });

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

      // Log before deletion (cascade will delete audit too, so log first with metadata)
      const flag = await ctx.db.query.featureFlags.findFirst({
        where: eq(featureFlags.id, input.id),
      });

      if (!flag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Flag introuvable" });
      }

      await logAudit(ctx.db, {
        flagId: input.id,
        action: "delete",
        actorId: ctx.userId,
        metadata: { key: flag.key, label: flag.label },
      });

      await ctx.db.delete(featureFlags).where(eq(featureFlags.id, input.id));

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

      await logAudit(ctx.db, {
        flagId: input.flagId,
        action: "set_override",
        actorId: ctx.userId,
        metadata: { targetUserId: input.userId, value: input.value, reason: input.reason },
      });

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

      await logAudit(ctx.db, {
        flagId: input.flagId,
        action: "remove_override",
        actorId: ctx.userId,
        metadata: { targetUserId: input.userId },
      });

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

      await logAudit(ctx.db, {
        flagId: input.flagId,
        action: "bulk_override",
        actorId: ctx.userId,
        metadata: { count: input.userIds.length, reason: input.reason },
      });

      logger.info("Admin: bulk flag override", {
        flagId: input.flagId,
        count: input.userIds.length,
        by: ctx.userId,
      });

      await invalidateAllUserFlagsCache();

      return { count: input.userIds.length };
    }),
});
