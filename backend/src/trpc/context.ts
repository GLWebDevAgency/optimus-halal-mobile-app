import type { Context as HonoContext } from "hono";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, devices, refreshTokens } from "../db/schema/index.js";
import { redis } from "../lib/redis.js";
import { verifyAccessToken } from "../services/auth.service.js";
import { logger } from "../lib/logger.js";

const TIER_CACHE_TTL = 300; // 5min — balance between freshness and PgBouncer load
const TIER_CACHE_PREFIX = "user:tier:";
const TRIAL_DURATION_DAYS = 7;

export interface DeviceRecord {
  id: string;
  deviceId: string;
  firstSeenAt: Date;
  trialStartedAt: Date | null;
  trialExpiresAt: Date | null;
  convertedAt: Date | null;
  userId: string | null;
  lastScanDate: string | null;
  scansToday: number;
  totalScans: number;
}

export interface Context {
  db: typeof db;
  redis: typeof redis;
  userId: string | null;
  deviceId: string | null;
  device: DeviceRecord | null;
  isAnonymous: boolean;
  subscriptionTier: "free" | "premium";
  remainingScans: number | null;
  requestId: string;
  [key: string]: unknown;
}

/**
 * Resolve subscription tier: Redis first, DB fallback.
 *
 * Defense-in-depth: even if the RevenueCat EXPIRATION webhook is delayed,
 * we check `subscription_expires_at` here. If premium has lapsed, we
 * auto-downgrade in DB and invalidate the cache — the user sees "free"
 * on the very next request instead of waiting for a webhook that may never come.
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
    columns: { subscriptionTier: true, subscriptionExpiresAt: true },
  });

  let tier: "free" | "premium" = user?.subscriptionTier ?? "free";

  // Auto-downgrade if premium has lapsed (webhook may be delayed)
  if (
    tier === "premium" &&
    user?.subscriptionExpiresAt &&
    user.subscriptionExpiresAt < new Date()
  ) {
    tier = "free";
    // Fire-and-forget: downgrade tier + revoke tokens (forces re-auth → logout)
    db.update(users)
      .set({ subscriptionTier: "free", subscriptionExpiresAt: null })
      .where(eq(users.id, userId))
      .then(() => db.delete(refreshTokens).where(eq(refreshTokens.userId, userId)))
      .catch((err) => logger.warn("Auto-downgrade failed", { userId, error: String(err) }));
  }

  try {
    await redis.setex(cacheKey, TIER_CACHE_TTL, tier);
  } catch {
    // Cache write failure is non-fatal
  }

  return tier;
}

/**
 * Upsert device record — creates on first contact, updates metadata on subsequent.
 * This is the single source of truth for device lifecycle.
 * Trial starts automatically on first upsert (first_seen_at = trial_started_at).
 */
async function upsertDevice(
  deviceId: string,
  platform?: string,
  appVersion?: string,
): Promise<DeviceRecord | null> {
  try {
    const now = new Date();
    const trialExpiry = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const [device] = await db
      .insert(devices)
      .values({
        deviceId,
        firstSeenAt: now,
        trialStartedAt: now,
        trialExpiresAt: trialExpiry,
        platform: (platform as any) ?? null,
        appVersion: appVersion ?? null,
      })
      .onConflictDoNothing({ target: devices.deviceId })
      .returning();

    if (device) {
      // New device — just inserted
      return {
        id: device.id,
        deviceId: device.deviceId,
        firstSeenAt: device.firstSeenAt,
        trialStartedAt: device.trialStartedAt,
        trialExpiresAt: device.trialExpiresAt,
        convertedAt: device.convertedAt,
        userId: device.userId,
        lastScanDate: device.lastScanDate,
        scansToday: device.scansToday,
        totalScans: device.totalScans,
      };
    }

    // Existing device — fetch + update metadata if changed
    const existing = await db.query.devices.findFirst({
      where: eq(devices.deviceId, deviceId),
    });
    if (!existing) return null;

    // Update app version if changed (lightweight)
    if (appVersion && appVersion !== existing.appVersion) {
      await db
        .update(devices)
        .set({ appVersion, updatedAt: now })
        .where(eq(devices.deviceId, deviceId));
    }

    return {
      id: existing.id,
      deviceId: existing.deviceId,
      firstSeenAt: existing.firstSeenAt,
      trialStartedAt: existing.trialStartedAt,
      trialExpiresAt: existing.trialExpiresAt,
      convertedAt: existing.convertedAt,
      userId: existing.userId,
      lastScanDate: existing.lastScanDate,
      scansToday: existing.scansToday,
      totalScans: existing.totalScans,
    };
  } catch (e) {
    logger.warn("Device upsert failed", { deviceId, error: String(e) });
    return null;
  }
}

export async function createContext(c: HonoContext): Promise<Context> {
  const authorization = c.req.header("authorization");
  const deviceId = c.req.header("x-device-id") ?? null;
  const platform = c.req.header("x-device-platform") ?? undefined;
  const appVersion = c.req.header("x-app-version") ?? undefined;
  let userId: string | null = null;

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);
    try {
      const payload = await verifyAccessToken(token);
      userId = payload.sub ?? null;
    } catch (err) {
      if (err instanceof Error && err.name !== "JWTExpired" && err.name !== "JWTClaimValidationFailed" && err.name !== "JWSSignatureVerificationFailed" && err.name !== "JWTInvalid") {
        logger.error("Erreur inattendue de verification du token", { error: err.message });
      }
    }
  }

  const subscriptionTier = userId ? await resolveSubscriptionTier(userId) : "free";

  // Upsert device record (non-blocking for auth flow, but critical for quota/trial)
  const device = deviceId ? await upsertDevice(deviceId, platform, appVersion) : null;

  return {
    db,
    redis,
    userId,
    deviceId,
    device,
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
