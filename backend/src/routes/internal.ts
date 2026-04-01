/**
 * Internal routes — cron/admin endpoints protected by CRON_SECRET.
 *
 * POST /refresh-stores        — trigger async store data refresh (202 Accepted)
 * GET  /refresh-stores/status — last run result from Redis
 * POST /cleanup-tokens        — delete expired refresh tokens
 */

import { Hono } from "hono";
import { sql, and, gte, lte, isNotNull, isNull, eq } from "drizzle-orm";
import { env } from "../lib/env.js";
import { db } from "../db/index.js";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { Sentry } from "../lib/sentry.js";
import { refreshStores } from "../services/store-refresh.service.js";
import { syncRecalls } from "../services/recall-sync.service.js";
import { sendPushNotifications } from "../services/push-notifications.js";
import { devices, pushTokens, users, alerts, articles, contentSources } from "../db/schema/index.js";
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

// ── POST /create-draft ───────────────────────────────────────
// Creates a draft alert or article. Used by Claude Cowork veille task.
// ONLY inserts drafts (is_active=false / is_published=false).
// Protected by CRON_SECRET — same auth as all internal endpoints.

internalRoutes.post("/create-draft", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const body = await c.req.json();
  const { type } = body; // "alert" or "article"

  try {
    if (type === "alert") {
      const { title, summary, content, severity, priority, categoryId, imageUrl, sourceUrl } = body;
      if (!title || !summary || !content) {
        return c.json({ error: "title, summary, content requis" }, 400);
      }

      const [draft] = await db
        .insert(alerts)
        .values({
          title,
          summary,
          content,
          severity: severity ?? "info",
          priority: priority ?? "medium",
          categoryId: categoryId ?? "community",
          imageUrl: imageUrl ?? null,
          sourceUrl: sourceUrl ?? null,
          isActive: false, // ALWAYS draft — admin validates
        })
        .returning({ id: alerts.id, title: alerts.title });

      return c.json({ success: true, type: "alert", id: draft.id, title: draft.title });

    } else if (type === "article") {
      const { title, slug, excerpt, content: articleContent, coverImage, author, articleType, tags, readTimeMinutes, externalLink } = body;
      if (!title || !slug) {
        return c.json({ error: "title, slug requis" }, 400);
      }

      const [draft] = await db
        .insert(articles)
        .values({
          title,
          slug,
          excerpt: excerpt ?? null,
          content: articleContent ?? null,
          coverImage: coverImage ?? null,
          author: author ?? "Naqiy Team",
          type: articleType ?? "blog",
          tags: tags ?? [],
          readTimeMinutes: readTimeMinutes ?? 3,
          externalLink: externalLink ?? null,
          isPublished: false, // ALWAYS draft — admin validates
        })
        .returning({ id: articles.id, title: articles.title });

      return c.json({ success: true, type: "article", id: draft.id, title: draft.title });

    } else {
      return c.json({ error: "type doit être 'alert' ou 'article'" }, 400);
    }
  } catch (err) {
    logger.error("Create draft failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return c.json({ error: "Création du draft échouée" }, 500);
  }
});

// ── GET /content-sources ─────────────────────────────────────
// Lists active content sources. Used by Claude Cowork to know what to fetch.

internalRoutes.get("/content-sources", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const sources = await db
    .select()
    .from(contentSources)
    .where(eq(contentSources.isActive, true))
    .orderBy(contentSources.name);

  return c.json({ sources });
});

// ── POST /update-source-fetch ─────────────────────────────────
// Updates last_fetched_at and last_item_date for a content source.
// Called by Claude Cowork after fetching a source's RSS feed.

internalRoutes.post("/update-source-fetch", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const { sourceId, lastItemDate, fetchCount } = await c.req.json();
  if (!sourceId) return c.json({ error: "sourceId requis" }, 400);

  await db
    .update(contentSources)
    .set({
      lastFetchedAt: new Date(),
      lastItemDate: lastItemDate ? new Date(lastItemDate) : undefined,
      lastFetchCount: fetchCount ?? 0,
    })
    .where(eq(contentSources.id, sourceId));

  return c.json({ success: true });
});

// ── POST /cleanup-seed-alerts ─────────────────────────────────
// One-shot: removes seed alerts (is_active=true) that were inserted by
// the old seed pipeline. Keeps Cowork drafts (is_active=false).

internalRoutes.post("/cleanup-seed-alerts", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  // Delete read status first (FK constraint)
  await db.execute(sql`
    DELETE FROM alert_read_status
    WHERE alert_id IN (SELECT id FROM alerts WHERE is_active = true)
  `);

  // Delete seed alerts (all active ones = seed data)
  const result = await db.execute(sql`
    DELETE FROM alerts WHERE is_active = true
  `);

  // Also delete any test drafts
  await db.execute(sql`
    DELETE FROM alerts WHERE title LIKE '%[TEST]%'
  `);

  const remaining = await db.execute(sql`SELECT count(*)::int as count FROM alerts`);

  return c.json({
    success: true,
    deleted: (result as unknown as { rowCount?: number }).rowCount ?? 0,
    remaining: (remaining[0] as { count: number }).count,
  });
});

// ── POST /sync-recalls ───────────────────────────────────────
// Syncs food safety recalls from RappelConso (data.economie.gouv.fr).
// Called daily at 6:00 CET by GitHub Actions cron.

internalRoutes.post("/sync-recalls", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const lockId = randomUUID();
  const acquired = await redis.set("lock:recall-sync", lockId, "EX", 120, "NX");

  if (!acquired) {
    return c.json({ error: "Sync rappels déjà en cours" }, 409);
  }

  // Parse optional query params
  const autoApprove = c.req.query("auto_approve") !== "false";

  (async () => {
    try {
      const result = await syncRecalls({ autoApprove });
      await redis.setex(
        "recall-sync:last-run",
        7 * 86400,
        JSON.stringify(result),
      );
    } catch (err) {
      logger.error("Sync rappels échoué", {
        error: err instanceof Error ? err.message : String(err),
      });
      Sentry.captureException(err);
      await redis.setex(
        "recall-sync:last-run",
        7 * 86400,
        JSON.stringify({
          success: false,
          completedAt: new Date().toISOString(),
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      const currentLock = await redis.get("lock:recall-sync");
      if (currentLock === lockId) {
        await redis.del("lock:recall-sync");
      }
    }
  })();

  return c.json({ status: "accepted" }, 202);
});

// ── GET /sync-recalls/status ─────────────────────────────────

internalRoutes.get("/sync-recalls/status", async (c) => {
  if (!verifyCronSecret(c)) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const [lastRun, lockActive] = await Promise.all([
    redis.get("recall-sync:last-run"),
    redis.get("lock:recall-sync"),
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
