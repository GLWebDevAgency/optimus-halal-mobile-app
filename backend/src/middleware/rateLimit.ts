import { createMiddleware } from "hono/factory";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { env } from "../lib/env.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix = "rl" } = options;
  const windowSec = Math.ceil(windowMs / 1000);

  // In development, multiply limits by 10x to avoid blocking during rapid dev iteration
  const effectiveMax = env.NODE_ENV === "development" ? max * 10 : max;

  return createMiddleware(async (c, next) => {
    // Use the first IP in X-Forwarded-For (original client), fall back to "unknown"
    const forwardedFor = c.req.header("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const key = `${keyPrefix}:${ip}:${c.req.path}`;

    try {
      const pipe = redis.pipeline();
      pipe.incr(key);
      pipe.expire(key, windowSec, "NX");
      const results = await pipe.exec();

      const current = (results?.[0]?.[1] as number) ?? 0;

      c.header("X-RateLimit-Limit", String(effectiveMax));
      c.header("X-RateLimit-Remaining", String(Math.max(0, effectiveMax - current)));

      if (current > effectiveMax) {
        const retryAfterSec = Math.ceil(windowMs / 1000);
        c.header("Retry-After", String(retryAfterSec));
        return c.json({ error: "Too many requests", retryAfter: retryAfterSec }, 429);
      }
    } catch (err) {
      // Fail-open: if Redis is down, allow the request through
      logger.error("Erreur Redis rate-limit, requete autorisee", { error: err instanceof Error ? err.message : String(err) });
    }

    await next();
  });
}
