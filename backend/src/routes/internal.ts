/**
 * Internal routes — cron/admin endpoints protected by CRON_SECRET.
 *
 * POST /refresh-stores        — trigger async store data refresh (202 Accepted)
 * GET  /refresh-stores/status — last run result from Redis
 * POST /cleanup-tokens        — delete expired refresh tokens
 */

import { Hono } from "hono";
import { sql, and, gte, lte, isNotNull, isNull } from "drizzle-orm";
import { env } from "../lib/env.js";
import { db } from "../db/index.js";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { Sentry } from "../lib/sentry.js";
import { refreshStores } from "../services/store-refresh.service.js";
import { sendPushNotifications } from "../services/push-notifications.js";
import { devices, pushTokens, users } from "../db/schema/index.js";
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

  return c.json({ status: "accepted" }, 202);
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

// ── POST /seed-admin ──────────────────────────────────────────
// Bootstrap: seed super_admin from ADMIN_EMAIL env var. Idempotent.

internalRoutes.post("/seed-admin", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return c.json({ error: "ADMIN_EMAIL not set" }, 400);
  }

  try {
    let users = await db.execute(sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${adminEmail}) LIMIT 1`);

    // Bootstrap: create user if not found (uses argon2id like auth flow)
    if (users.length === 0) {
      const { hashPassword } = await import("../services/auth.service.js");
      const tempPassword = process.env.ADMIN_TEMP_PASSWORD;
      if (!tempPassword) {
        return c.json({ error: "ADMIN_TEMP_PASSWORD env var required for bootstrap" }, 400);
      }
      const passwordHash = await hashPassword(tempPassword);
      users = await db.execute(sql`
        INSERT INTO users (email, password_hash, display_name)
        VALUES (${adminEmail}, ${passwordHash}, 'Admin')
        RETURNING id
      `);
      logger.info("Bootstrap user created for admin", { email: adminEmail });
    }

    const userId = (users[0] as { id: string }).id;
    await db.execute(sql`
      INSERT INTO admins (user_id, role) VALUES (${userId}, 'super_admin')
      ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin'
    `);
    logger.info("Admin seeded via internal endpoint", { email: adminEmail });
    return c.json({ success: true, seeded: 1, email: adminEmail });
  } catch (err) {
    logger.error("Admin seed failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return c.json({ error: "Seed failed" }, 500);
  }
});

// ── POST /send-push-nudges ────────────────────────────────────
// Sends conversion nudge push notifications to eligible devices/users.
// Called daily at 10:00 CET by GitHub Actions.
//
// Two nudge types:
//   1. quota_nudge   — quota_hits >= 3, no nudge in 7d, active last 14d
//   2. trial_nudge   — trial expired 20-48h ago, not converted, no nudge sent

internalRoutes.post("/send-push-nudges", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  try {
    // ── 1. Quota nudge — guest devices ────────────────────────
    const quotaEligibleDevices = await db
      .select({
        deviceId: devices.deviceId,
        pushToken: devices.pushToken,
      })
      .from(devices)
      .where(
        and(
          isNotNull(devices.pushToken),
          isNull(devices.convertedAt),
          gte(devices.quotaHitsCount, 3),
          gte(devices.lastActiveAt, fourteenDaysAgo),
          // No nudge in last 7 days
          sql`(push_nudge_sent_at IS NULL OR push_nudge_sent_at < ${sevenDaysAgo.toISOString()})`,
        )
      )
      .limit(500);

    // ── 2. Trial expiry nudge — guest devices ─────────────────
    const trialEligibleDevices = await db
      .select({
        deviceId: devices.deviceId,
        pushToken: devices.pushToken,
      })
      .from(devices)
      .where(
        and(
          isNotNull(devices.pushToken),
          isNull(devices.convertedAt),
          isNotNull(devices.trialExpiresAt),
          // Trial expired between 20h and 48h ago
          lte(devices.trialExpiresAt, twentyHoursAgo),
          gte(devices.trialExpiresAt, fortyEightHoursAgo),
          // Never sent a nudge
          isNull(devices.pushNudgeSentAt),
        )
      )
      .limit(500);

    // ── 3. Quota nudge — registered free users ────────────────
    const registeredQuotaTokens = await db
      .select({
        token: pushTokens.token,
        userId: pushTokens.userId,
      })
      .from(pushTokens)
      .innerJoin(users, sql`${pushTokens.userId} = ${users.id}`)
      .where(
        and(
          sql`${pushTokens.isActive} = true`,
          sql`${users.subscriptionTier} = 'free'`,
          gte(users.quotaHitsCount, 3),
          gte(users.lastActiveAt, fourteenDaysAgo),
          sql`(${users.pushNudgeSentAt} IS NULL OR ${users.pushNudgeSentAt} < ${sevenDaysAgo.toISOString()})`,
        )
      )
      .limit(500);

    // ── Push message copy ─────────────────────────────────────
    // Principes : éthique islamique (pas de manipulation), identité forte,
    // valeur réelle, prix transparent, sans engagement.
    //
    // Quota nudge — identité + clarté
    //   Trigger psychologique : tu fais partie des familles qui ne font pas
    //   confiance au flou. Appartenance + prix clair = conversion honnête.
    //
    // Trial nudge — continuité + mission
    //   Pas de peur, pas de culpabilité. Ancrage sur la valeur vécue.

    const quotaMessages = quotaEligibleDevices
      .filter((d) => d.pushToken)
      .map((d) => ({
        to: d.pushToken!,
        title: "Limite de scans atteinte",
        body: "Tu fais partie des familles qui refusent le flou. Naqiy+ — illimité, sans engagement, dès 2,99 € / mois.",
        data: { screen: "paywall", trigger: "push_quota" },
        sound: "default" as const,
        channelId: "naqiy_nudge",
      }));

    const trialMessages = trialEligibleDevices
      .filter((d) => d.pushToken)
      .map((d) => ({
        to: d.pushToken!,
        title: "Ton essai Naqiy+ est terminé",
        body: "Manger halal en conscience est un choix quotidien. Rejoins Naqiy+ pour continuer sans limite — dès 2,99 € / mois.",
        data: { screen: "paywall", trigger: "push_trial" },
        sound: "default" as const,
        channelId: "naqiy_nudge",
      }));

    const registeredMessages = registeredQuotaTokens.map((t) => ({
      to: t.token,
      title: "Limite de scans atteinte",
      body: "Tu reviens souvent — c'est le signe que Naqiy compte pour toi. Passe à illimité dès 2,99 € / mois, sans engagement.",
      data: { screen: "paywall", trigger: "push_quota" },
      sound: "default" as const,
      channelId: "naqiy_nudge",
    }));

    const allMessages = [...quotaMessages, ...trialMessages, ...registeredMessages];

    const { sent, failed } = await sendPushNotifications(allMessages);

    // Mark nudge sent — fire-and-forget updates
    const nudgeTime = new Date();

    if (quotaEligibleDevices.length > 0) {
      const ids = quotaEligibleDevices.map((d) => d.deviceId);
      db.execute(
        sql`UPDATE devices SET push_nudge_sent_at = ${nudgeTime.toISOString()} WHERE device_id = ANY(${ids})`
      ).catch(() => {});
    }

    if (trialEligibleDevices.length > 0) {
      const ids = trialEligibleDevices.map((d) => d.deviceId);
      db.execute(
        sql`UPDATE devices SET push_nudge_sent_at = ${nudgeTime.toISOString()} WHERE device_id = ANY(${ids})`
      ).catch(() => {});
    }

    if (registeredQuotaTokens.length > 0) {
      const userIds = [...new Set(registeredQuotaTokens.map((t) => t.userId))];
      db.execute(
        sql`UPDATE users SET push_nudge_sent_at = ${nudgeTime.toISOString()} WHERE id = ANY(${userIds})`
      ).catch(() => {});
    }

    logger.info("Push nudges envoyés", {
      quotaDevices: quotaEligibleDevices.length,
      trialDevices: trialEligibleDevices.length,
      registeredUsers: registeredQuotaTokens.length,
      sent,
      failed,
    });

    return c.json({
      success: true,
      sent,
      failed,
      breakdown: {
        quotaDevices: quotaEligibleDevices.length,
        trialDevices: trialEligibleDevices.length,
        registeredUsers: registeredQuotaTokens.length,
      },
    });
  } catch (err) {
    logger.error("Push nudges échoué", {
      error: err instanceof Error ? err.message : String(err),
    });
    Sentry.captureException(err);
    return c.json({ error: "Push nudges failed" }, 500);
  }
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
