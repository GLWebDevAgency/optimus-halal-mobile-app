import { createMiddleware } from "hono/factory";
import { redis } from "../lib/redis.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix = "rl" } = options;
  const windowSec = Math.ceil(windowMs / 1000);

  return createMiddleware(async (c, next) => {
    // Use the last IP in X-Forwarded-For (closest proxy), fall back to "unknown"
    const forwardedFor = c.req.header("x-forwarded-for");
    const ip = forwardedFor?.split(",").pop()?.trim() || "unknown";
    const key = `${keyPrefix}:${ip}:${c.req.path}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        // First request in this window — set TTL
        await redis.expire(key, windowSec);
      } else {
        // Self-heal: if TTL was lost (e.g. crash between INCR and EXPIRE), re-set it
        const ttl = await redis.ttl(key);
        if (ttl === -1) {
          await redis.expire(key, windowSec);
        }
      }

      c.header("X-RateLimit-Limit", String(max));
      c.header("X-RateLimit-Remaining", String(Math.max(0, max - current)));

      if (current > max) {
        return c.json({ error: "Too many requests" }, 429);
      }
    } catch (err) {
      // Fail-open: if Redis is down, allow the request through
      console.error("[rateLimit] Redis error, allowing request:", err instanceof Error ? err.message : err);
    }

    await next();
  });
}
