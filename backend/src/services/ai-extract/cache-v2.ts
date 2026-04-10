import crypto from "node:crypto";
import { redis } from "../../lib/redis.js";
import { logger } from "../../lib/logger.js";
import type { GeminiSemanticResult } from "./types.js";

const CACHE_TTL = 7 * 24 * 3600; // 7 days
const CACHE_PREFIX = "ai:extract:v2:";

export function buildCacheKeyV2(
  text: string,
  categoryHint: string,
  promptVersion: string,
  vocabularyHash: string,
): string {
  const payload = `${text}|${categoryHint}|${promptVersion}|${vocabularyHash}`;
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  return `${CACHE_PREFIX}${hash}`;
}

export async function getCachedV2(key: string): Promise<GeminiSemanticResult | null> {
  try {
    const raw = await redis.get(key);
    if (raw) return JSON.parse(raw) as GeminiSemanticResult;
  } catch { /* Redis down — non-fatal */ }
  return null;
}

export async function setCacheV2(key: string, result: GeminiSemanticResult): Promise<void> {
  try {
    const jitter = Math.floor(Math.random() * 3600);
    await redis.setex(key, CACHE_TTL + jitter, JSON.stringify(result));
  } catch { /* non-fatal */ }
}

// ── Singleflight (request coalescing) ──
// Prevents cache stampede on deploy when all cache entries are busted simultaneously.
const _inflight = new Map<string, Promise<GeminiSemanticResult | null>>();

export function singleflight(
  key: string,
  fn: () => Promise<GeminiSemanticResult | null>,
): Promise<GeminiSemanticResult | null> {
  const existing = _inflight.get(key);
  if (existing) {
    logger.debug("Singleflight: coalescing request", { key: key.slice(-12) });
    return existing;
  }

  const promise = fn().finally(() => {
    _inflight.delete(key);
  });

  _inflight.set(key, promise);
  return promise;
}
