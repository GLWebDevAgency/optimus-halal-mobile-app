import { eq } from "drizzle-orm";
import type { db as DB } from "../db/index.js";
import { featureFlags, flagUserOverrides } from "../db/schema/index.js";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";

// ── Cache keys & TTL ──────────────────────────────────────
const FLAGS_GLOBAL_KEY = "flags:global";
const FLAGS_GLOBAL_TTL = 60; // 1 min — flags rarely change
const FLAGS_USER_PREFIX = "flags:resolved:";
const FLAGS_USER_TTL = 300; // 5 min

// ── FNV-1a hash for sticky rollout allocation ─────────────
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

// ── Types ─────────────────────────────────────────────────
interface FlagRule {
  attribute: string;
  operator: "eq" | "neq" | "in" | "notIn" | "gte" | "lte" | "semverGte" | "semverLte";
  value: string | string[] | number;
}

interface UserContext {
  tier: "free" | "premium";
  madhab: string | null;
  platform: string | null;
  appVersion: string | null;
}

type FlagRow = typeof featureFlags.$inferSelect;

// ── Semver comparison ─────────────────────────────────────
function semverCompare(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// ── Rule evaluation ───────────────────────────────────────
function getContextValue(ctx: UserContext, attribute: string): string | null {
  switch (attribute) {
    case "tier": return ctx.tier;
    case "madhab": return ctx.madhab;
    case "platform": return ctx.platform;
    case "appVersion": return ctx.appVersion;
    default: return null;
  }
}

function evaluateRule(rule: FlagRule, ctx: UserContext): boolean {
  const actual = getContextValue(ctx, rule.attribute);
  if (actual === null || actual === undefined) return false;

  switch (rule.operator) {
    case "eq":
      return actual === String(rule.value);
    case "neq":
      return actual !== String(rule.value);
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(actual);
    case "notIn":
      return Array.isArray(rule.value) && !rule.value.includes(actual);
    case "gte":
      return Number(actual) >= Number(rule.value);
    case "lte":
      return Number(actual) <= Number(rule.value);
    case "semverGte":
      return semverCompare(actual, String(rule.value)) >= 0;
    case "semverLte":
      return semverCompare(actual, String(rule.value)) <= 0;
    default:
      return false;
  }
}

function evaluateRules(rules: FlagRule[], ctx: UserContext): boolean {
  if (rules.length === 0) return true; // no rules = always match
  return rules.every((rule) => evaluateRule(rule, ctx));
}

// ── Resolve a single flag ─────────────────────────────────
function resolveFlag(
  flag: FlagRow,
  userId: string,
  overrideValue: unknown | undefined,
): unknown {
  // 1. Kill switch OFF → default
  if (!flag.enabled) return flag.defaultValue;

  // 2. User override takes precedence
  if (overrideValue !== undefined) return overrideValue;

  // 3. Rollout percentage (sticky via FNV-1a)
  if (flag.flagType === "percentage" || flag.rolloutPercentage < 100) {
    const bucket = fnv1a(flag.key + userId) % 100;
    if (bucket >= flag.rolloutPercentage) return flag.defaultValue;
  }

  // 4. Variant allocation
  if (flag.flagType === "variant" && Array.isArray(flag.variants) && flag.variants.length > 0) {
    const idx = fnv1a(flag.key + userId) % flag.variants.length;
    return flag.variants[idx];
  }

  // 5. Boolean enabled = true
  return true;
}

// ── Load all flags (with global cache) ────────────────────
async function loadAllFlags(db: typeof DB): Promise<FlagRow[]> {
  // Try Redis cache first
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
    result[flag.key] = resolveFlag(flag, userId, override);
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
    // Scan and delete all user flag caches
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
