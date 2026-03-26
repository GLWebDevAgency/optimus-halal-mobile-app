import { eq } from "drizzle-orm";
import type { db as DB } from "../db/index.js";
import { featureFlags, flagUserOverrides } from "../db/schema/index.js";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import {
  fnv1a,
  evaluateRules,
  resolveFlag,
  type FlagRule,
  type UserContext,
  type FlagData,
} from "./feature-flags.engine.js";

export type { FlagRule, UserContext } from "./feature-flags.engine.js";

// ── Cache keys & TTL ──────────────────────────────────────
const FLAGS_GLOBAL_KEY = "flags:global";
const FLAGS_GLOBAL_TTL = 60; // 1 min — flags rarely change
const FLAGS_USER_PREFIX = "flags:resolved:";
const FLAGS_USER_TTL = 300; // 5 min

type FlagRow = typeof featureFlags.$inferSelect;

// ── Load all flags (with global cache) ────────────────────
async function loadAllFlags(db: typeof DB): Promise<FlagRow[]> {
  try {
    const cached = await redis.get(FLAGS_GLOBAL_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // Redis down — fall through
  }

  const rows = await db.select().from(featureFlags);

  try {
    await redis.setex(FLAGS_GLOBAL_KEY, FLAGS_GLOBAL_TTL, JSON.stringify(rows));
  } catch {
    // Non-fatal
  }

  return rows;
}

// ── Load user overrides ───────────────────────────────────
async function loadUserOverrides(
  db: typeof DB,
  userId: string,
): Promise<Map<string, unknown>> {
  const rows = await db
    .select({
      flagId: flagUserOverrides.flagId,
      value: flagUserOverrides.value,
    })
    .from(flagUserOverrides)
    .where(eq(flagUserOverrides.userId, userId));

  return new Map(rows.map((r) => [r.flagId, r.value]));
}

// ── Main: resolve all flags for a user ────────────────────
export async function resolveUserFlags(
  db: typeof DB,
  userId: string,
  userCtx: UserContext,
): Promise<Record<string, unknown>> {
  // Check per-user cache
  const cacheKey = `${FLAGS_USER_PREFIX}${userId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Redis down
  }

  const [allFlags, overrides] = await Promise.all([
    loadAllFlags(db),
    loadUserOverrides(db, userId),
  ]);

  const result: Record<string, unknown> = {};

  for (const flag of allFlags) {
    // Evaluate targeting rules
    const rulesArray = (Array.isArray(flag.rules) ? flag.rules : []) as FlagRule[];
    const rulesMatch = evaluateRules(rulesArray, userCtx);

    if (!rulesMatch && flag.enabled) {
      // Rules don't match — user gets default value (unless override exists)
      const override = overrides.get(flag.id);
      result[flag.key] = override !== undefined ? override : flag.defaultValue;
      continue;
    }

    const override = overrides.get(flag.id);
    result[flag.key] = resolveFlag(flag as FlagData, userId, override);
  }

  // Cache resolved flags
  try {
    await redis.setex(cacheKey, FLAGS_USER_TTL, JSON.stringify(result));
  } catch {
    // Non-fatal
  }

  return result;
}

// ── Cache invalidation ────────────────────────────────────
export async function invalidateFlagsCache(userId?: string): Promise<void> {
  try {
    await redis.del(FLAGS_GLOBAL_KEY);
    if (userId) {
      await redis.del(`${FLAGS_USER_PREFIX}${userId}`);
    }
  } catch {
    // Non-fatal
  }
}

/** Invalidate all per-user flag caches (brute-force, for global flag changes) */
export async function invalidateAllUserFlagsCache(): Promise<void> {
  try {
    await redis.del(FLAGS_GLOBAL_KEY);
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${FLAGS_USER_PREFIX}*`, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    logger.warn("Failed to invalidate all user flag caches");
  }
}
