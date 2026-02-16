/**
 * Redis Cache Utility — withCache pattern for hot paths
 *
 * Provides a generic cache-aside wrapper with:
 * - TTL jitter to prevent thundering herd
 * - Graceful fallback (cache miss → DB hit, Redis down → DB hit)
 * - Typed return values
 */

import type Redis from "ioredis";
import { logger } from "./logger.js";

/**
 * Cache-aside wrapper: check Redis first, fall back to fetcher on miss.
 *
 * @param redis   - ioredis instance
 * @param key     - Redis key
 * @param ttl     - Base TTL in seconds
 * @param fetcher - Async function to fetch data on cache miss
 * @param jitter  - Max random jitter in seconds (default 10% of TTL)
 */
export async function withCache<T>(
  redis: Redis,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  jitter?: number,
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch (err) {
    // Redis down — fall through to DB
    logger.warn("Cache read failed, falling back to DB", { key, error: (err as Error).message });
  }

  const data = await fetcher();

  try {
    // Add jitter to TTL to avoid thundering herd
    const jitterSec = jitter ?? Math.ceil(ttl * 0.1);
    const finalTtl = ttl + Math.floor(Math.random() * jitterSec);
    await redis.setex(key, finalTtl, JSON.stringify(data));
  } catch (err) {
    logger.warn("Cache write failed", { key, error: (err as Error).message });
  }

  return data;
}

/**
 * Invalidate cache keys matching a pattern.
 * Uses SCAN to avoid blocking Redis with KEYS.
 */
export async function invalidateCache(redis: Redis, pattern: string): Promise<number> {
  let cursor = "0";
  let deleted = 0;

  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      deleted += await redis.del(...keys);
    }
  } while (cursor !== "0");

  return deleted;
}
