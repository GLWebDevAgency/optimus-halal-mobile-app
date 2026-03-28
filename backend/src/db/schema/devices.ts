/**
 * Devices Schema — Source of truth for device lifecycle
 *
 * Tracks every device that interacts with Naqiy:
 * - First seen, trial start/end, conversion, scan quota
 * - Links to user after account creation (device → user)
 * - Replaces ephemeral Redis trial keys and client-only MMKV trial state
 *
 * This is the production-grade pattern used by Spotify, Duolingo, Notion.
 */

import * as t from "drizzle-orm/pg-core";
import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const devicePlatformEnum = pgEnum("device_platform", [
  "ios",
  "android",
  "web",
]);

export const devices = pgTable(
  "devices",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    deviceId: t
      .varchar("device_id", { length: 255 })
      .notNull()
      .unique(),

    // ── Lifecycle timestamps (immutable once set) ──
    firstSeenAt: t
      .timestamp("first_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    trialStartedAt: t.timestamp("trial_started_at", { withTimezone: true }),
    trialExpiresAt: t.timestamp("trial_expires_at", { withTimezone: true }),

    // ── Conversion tracking ──
    convertedAt: t.timestamp("converted_at", { withTimezone: true }),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "set null" }),

    // ── Device metadata ──
    platform: devicePlatformEnum(),
    appVersion: t.varchar("app_version", { length: 20 }),
    osVersion: t.varchar("os_version", { length: 50 }),

    // ── Scan quota (DB = source of truth, Redis = cache) ──
    lastScanDate: t.date("last_scan_date"),
    scansToday: t.integer("scans_today").default(0).notNull(),
    totalScans: t.integer("total_scans").default(0).notNull(),

    // ── Lifecycle / Conversion tracking ──
    lastActiveAt: t.timestamp("last_active_at", { withTimezone: true }),
    paywallSeenCount: t.integer("paywall_seen_count").default(0).notNull(),
    paywallLastSeenAt: t.timestamp("paywall_last_seen_at", { withTimezone: true }),
    featureBlockedCount: t.integer("feature_blocked_count").default(0).notNull(),
    quotaHitsCount: t.integer("quota_hits_count").default(0).notNull(),

    // ── Push notifications (guest — no email available) ──
    pushToken: t.text("push_token"),
    pushNudgeSentAt: t.timestamp("push_nudge_sent_at", { withTimezone: true }),

    // ── Timestamps ──
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    t.index("devices_user_id_idx").on(table.userId),
    t.index("devices_first_seen_idx").on(table.firstSeenAt),
  ]
);
