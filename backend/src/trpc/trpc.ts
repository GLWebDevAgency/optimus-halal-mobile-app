import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.js";
import { logger } from "../lib/logger.js";
import { Sentry } from "../lib/sentry.js";

// Patterns that indicate infrastructure/DB errors that must never leak to clients
const SENSITIVE_PATTERNS = [
  /relation ".*" does not exist/i,
  /column ".*" does not exist/i,
  /syntax error at or near/i,
  /\bSELECT\s+"/i,
  /\bINSERT\s+INTO\s+"/i,
  /\bUPDATE\s+".*"\s+SET/i,
  /\bDELETE\s+FROM\s+"/i,
  /violates.*constraint/i,
  /duplicate key value/i,
  /prepared statement/i,
  /connection refused/i,
  /ECONNREFUSED/i,
  /timeout expired/i,
  /Failed query:/i,
];

function isSensitiveMessage(message: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(message));
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const isInternal = error.code === "INTERNAL_SERVER_ERROR";
    const isSensitive = isSensitiveMessage(shape.message);

    if (isInternal || isSensitive) {
      logger.error("Erreur tRPC sanitisée", {
        code: error.code,
        path: shape.data?.path,
        message: error.message,
      });
      Sentry.captureException(error.cause ?? error, {
        extra: { path: shape.data?.path, code: error.code },
      });
    }

    const safeMessage =
      isInternal || isSensitive
        ? "Erreur interne du serveur"
        : shape.message;

    return {
      ...shape,
      message: safeMessage,
      data: {
        ...shape.data,
        code: error.code,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

const isPremium = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  if (ctx.subscriptionTier !== "premium") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cette fonctionnalite necessite Naqiy+",
    });
  }
  return next({ ctx });
});

export const premiumProcedure = t.procedure.use(isAuthenticated).use(isPremium);

// ── Admin middleware ──────────────────────────────────────
const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentification requise",
    });
  }

  const { admins } = await import("../db/schema/index.js");
  const { eq } = await import("drizzle-orm");

  const admin = await ctx.db.query.admins.findFirst({
    where: eq(admins.userId, ctx.userId),
  });

  if (!admin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Accès réservé aux administrateurs",
    });
  }

  return next({ ctx: { ...ctx, userId: ctx.userId, adminRole: admin.role } });
});

export const adminProcedure = t.procedure.use(isAuthenticated).use(isAdmin);

// ── Quota-checked procedure (anonymous + authenticated) ──────────
// Source of truth: `devices` table (PostgreSQL).
// Redis used only as a fast-path cache for the daily counter.
//
// Priority chain:
// 1. Premium (subscriptionTier=premium) → unlimited
// 2. Trial (device.trialExpiresAt > now AND not converted) → unlimited
// 3. Free → 5/day quota (DB-backed, Redis-cached)
const DAILY_SCAN_LIMIT = 5;

const quotaChecked = middleware(async ({ ctx, next }) => {
  // ── 1. Premium bypass ──
  if (ctx.subscriptionTier === "premium") {
    return next({ ctx: { ...ctx, remainingScans: null } });
  }

  // ── 2. Trial bypass (DB source of truth) ──
  if (ctx.device && !ctx.userId) {
    const { trialExpiresAt, convertedAt } = ctx.device;
    if (trialExpiresAt && !convertedAt && new Date(trialExpiresAt) > new Date()) {
      return next({ ctx: { ...ctx, remainingScans: null } });
    }
  }

  // ── 3. Quota enforcement ──
  const quotaId = ctx.userId ?? ctx.deviceId;
  if (!quotaId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Device ID requis (header X-Device-Id)",
    });
  }

  // Fast path: Redis cache (avoids DB read on every scan)
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `scan:quota:${quotaId}:${today}`;
  let used: number;

  try {
    const cached = await ctx.redis.get(cacheKey);
    used = cached !== null ? parseInt(cached, 10) : (ctx.device?.lastScanDate === today ? ctx.device.scansToday : 0);
  } catch {
    // Redis down — fall back to DB
    used = ctx.device?.lastScanDate === today ? ctx.device.scansToday : 0;
  }

  if (used >= DAILY_SCAN_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: JSON.stringify({
        type: "SCAN_QUOTA_EXCEEDED",
        used,
        limit: DAILY_SCAN_LIMIT,
        resetsAt: "midnight",
      }),
    });
  }

  return next({ ctx: { ...ctx, remainingScans: DAILY_SCAN_LIMIT - used } });
});

export const quotaCheckedProcedure = t.procedure.use(quotaChecked);
