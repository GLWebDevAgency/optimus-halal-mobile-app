import { createMiddleware } from "hono/factory";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix = "rl" } = options;
  const windowSec = Math.ceil(windowMs / 1000);

  return createMiddleware(async (c, next) => {
    // Use the first IP in X-Forwarded-For (original client), fall back to "unknown"
    const forwardedFor = c.req.header("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const key = `${keyPrefix}:${ip}:${c.req.path}`;

    try {
      // Atomic pipeline: INCR + EXPIRE(NX) in a single round trip
      // NX = only set TTL if none exists (prevents resetting the window)
      const pipe = redis.pipeline();
      pipe.incr(key);
      pipe.expire(key, windowSec, "NX");
      const results = await pipe.exec();

      const current = (results?.[0]?.[1] as number) ?? 0;

      c.header("X-RateLimit-Limit", String(max));
      c.header("X-RateLimit-Remaining", String(Math.max(0, max - current)));

      if (current > max) {
        return c.json({ error: "Too many requests" }, 429);
      }
    } catch (err) {
      // Fail-open: if Redis is down, allow the request through
      logger.error("Erreur Redis rate-limit, requête autorisée", { error: err instanceof Error ? err.message : String(err) });
    }

    await next();
  });
}
