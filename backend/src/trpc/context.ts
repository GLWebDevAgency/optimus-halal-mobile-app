import type { Context as HonoContext } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { redis } from "../lib/redis.js";
import { verifyAccessToken } from "../services/auth.service.js";
import { logger } from "../lib/logger.js";

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

  let subscriptionTier: "free" | "premium" = "free";
  if (userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { subscriptionTier: true },
    });
    subscriptionTier = user?.subscriptionTier ?? "free";
  }

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
