/**
 * Internal routes — cron/admin endpoints protected by CRON_SECRET.
 *
 * POST /refresh-stores        — trigger async store data refresh (202 Accepted)
 * GET  /refresh-stores/status — last run result from Redis
 * POST /cleanup-tokens        — delete expired refresh tokens
 */

import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { env } from "../lib/env.js";
import { db } from "../db/index.js";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { Sentry } from "../lib/sentry.js";
import { refreshStores } from "../services/store-refresh.service.js";
import { randomUUID } from "crypto";

export const internalRoutes = new Hono();

// ── Auth middleware ────────────────────────────────────────────

function verifyCronSecret(c: { req: { header: (name: string) => string | undefined } }): boolean {
  if (!env.CRON_SECRET) return false;
  const auth = c.req.header("Authorization");
  return auth === `Bearer ${env.CRON_SECRET}`;
}

// ── POST /refresh-stores ──────────────────────────────────────

internalRoutes.post("/refresh-stores", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  // Acquire distributed lock (300s TTL — max pipeline duration)
  const lockId = randomUUID();
  const acquired = await redis.set("lock:store-refresh", lockId, "EX", 300, "NX");

  if (!acquired) {
    return c.json({ error: "Refresh déjà en cours" }, 409);
  }

  // Fire-and-forget: respond immediately, run pipeline async
  // The lock is released in the finally block
  (async () => {
    try {
      await refreshStores();
    } catch (err) {
      logger.error("Refresh magasins échoué", {
        error: err instanceof Error ? err.message : String(err),
      });
      Sentry.captureException(err);

      // Store failure result
      await redis.setex(
        "store-refresh:last-run",
        7 * 86400,
        JSON.stringify({
          success: false,
          completedAt: new Date().toISOString(),
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      // Release lock only if we still hold it (compare-and-delete)
      const currentLock = await redis.get("lock:store-refresh");
      if (currentLock === lockId) {
        await redis.del("lock:store-refresh");
      }
    }
  })();

  return c.json({ status: "accepted", lockId }, 202);
});

// ── GET /refresh-stores/status ────────────────────────────────

internalRoutes.get("/refresh-stores/status", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const [lastRun, lockActive] = await Promise.all([
    redis.get("store-refresh:last-run"),
    redis.get("lock:store-refresh"),
  ]);

  return c.json({
    lastRun: lastRun ? JSON.parse(lastRun) : null,
    isRunning: lockActive !== null,
  });
});

// ── POST /cleanup-tokens ─────────────────────────────────────
// Deletes expired refresh tokens. Called daily by GitHub Actions cron.

internalRoutes.post("/cleanup-tokens", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  try {
    const result = await db.execute(sql`
      DELETE FROM refresh_tokens WHERE expires_at < NOW()
    `);
    const deleted = (result as unknown as { rowCount?: number }).rowCount ?? 0;

    logger.info("Tokens expirés nettoyés", { deleted });

    return c.json({ success: true, deleted });
  } catch (err) {
    logger.error("Nettoyage tokens échoué", {
      error: err instanceof Error ? err.message : String(err),
    });
    Sentry.captureException(err);
    return c.json({ error: "Cleanup failed" }, 500);
  }
});
