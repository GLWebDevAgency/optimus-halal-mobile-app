import type { Context as HonoContext } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { redis } from "../lib/redis.js";
import { verifyAccessToken } from "../services/auth.service.js";
import { logger } from "../lib/logger.js";

const TIER_CACHE_TTL = 300; // 5min — balance between freshness and PgBouncer load
const TIER_CACHE_PREFIX = "user:tier:";

export interface Context {
  db: typeof db;
  redis: typeof redis;
  userId: string | null;
  deviceId: string | null;
  isAnonymous: boolean;
  subscriptionTier: "free" | "premium";
  remainingScans: number | null;
  requestId: string;
  [key: string]: unknown;
}

/**
 * Resolve subscription tier: Redis first, PgBouncer fallback.
 * Eliminates 1 DB roundtrip per authenticated request (~30-50% PgBouncer load reduction).
 */
async function resolveSubscriptionTier(userId: string): Promise<"free" | "premium"> {
  const cacheKey = `${TIER_CACHE_PREFIX}${userId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached === "free" || cached === "premium") return cached;
  } catch {
    // Redis down — fall through to DB
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { subscriptionTier: true },
  });
  const tier = user?.subscriptionTier ?? "free";

  try {
    await redis.setex(cacheKey, TIER_CACHE_TTL, tier);
  } catch {
    // Cache write failure is non-fatal
  }

  return tier;
}

export async function createContext(c: HonoContext): Promise<Context> {
  const authorization = c.req.header("authorization");
  const deviceId = c.req.header("x-device-id") ?? null;
  let userId: string | null = null;

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);
    try {
      const payload = await verifyAccessToken(token);
      userId = payload.sub ?? null;
    } catch (err) {
      // Distinguish expired/invalid tokens (expected) from infrastructure errors (unexpected)
      if (err instanceof Error && err.name !== "JWTExpired" && err.name !== "JWTClaimValidationFailed" && err.name !== "JWSSignatureVerificationFailed" && err.name !== "JWTInvalid") {
        logger.error("Erreur inattendue de verification du token", { error: err.message });
      }
    }
  }

  const subscriptionTier = userId ? await resolveSubscriptionTier(userId) : "free";

  return {
    db,
    redis,
    userId,
    deviceId,
    isAnonymous: !userId,
    subscriptionTier,
    remainingScans: null,
    requestId: crypto.randomUUID(),
  };
}

/** Invalidate cached tier when subscription changes (call from subscription router). */
export async function invalidateUserTierCache(userId: string): Promise<void> {
  try {
    await redis.del(`${TIER_CACHE_PREFIX}${userId}`);
  } catch {
    // Non-fatal
  }
}
