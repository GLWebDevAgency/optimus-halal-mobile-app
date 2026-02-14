import type { Context as HonoContext } from "hono";
import { db } from "../db/index.js";
import { redis } from "../lib/redis.js";
import { verifyAccessToken } from "../services/auth.service.js";
import { logger } from "../lib/logger.js";

export interface Context {
  db: typeof db;
  redis: typeof redis;
  userId: string | null;
  requestId: string;
  [key: string]: unknown;
}

export async function createContext(c: HonoContext): Promise<Context> {
  const authorization = c.req.header("authorization");
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

  return {
    db,
    redis,
    userId,
    requestId: crypto.randomUUID(),
  };
}
