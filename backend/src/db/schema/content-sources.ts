import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const contentSourceTypeEnum = pgEnum("content_source_type", [
  "rss",
  "website",
  "instagram",
  "tiktok",
  "youtube",
]);

export const contentTargetEnum = pgEnum("content_target", [
  "alert",
  "article",
  "auto",
]);

export const contentSources = pgTable(
  "content_sources",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    /** Display name (e.g. "Al-Kanz", "AVS Actualites") */
    name: t.varchar({ length: 100 }).notNull(),
    /** Feed/page URL to monitor */
    url: t.text().notNull(),
    /** Source type determines fetch strategy */
    type: contentSourceTypeEnum().default("rss").notNull(),
    /** Hint: should new content become an alert or article? "auto" = AI decides */
    targetType: contentTargetEnum("target_type").default("auto").notNull(),
    /** Hint: suggested alert category (fraud/boycott/certification/community) */
    categoryHint: t.varchar("category_hint", { length: 50 }),
    /** Is this source actively monitored? */
    isActive: t.boolean("is_active").default(true).notNull(),
    /** Last time this source was successfully fetched */
    lastFetchedAt: t.timestamp("last_fetched_at", { withTimezone: true }),
    /** Date of the most recent item found (for delta detection) */
    lastItemDate: t.timestamp("last_item_date", { withTimezone: true }),
    /** Number of items fetched in the last run */
    lastFetchCount: t.integer("last_fetch_count").default(0),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.index("content_sources_active_idx").on(table.isActive),
  ],
);

export type ContentSource = typeof contentSources.$inferSelect;
export type NewContentSource = typeof contentSources.$inferInsert;
