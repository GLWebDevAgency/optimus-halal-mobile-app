import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const charterVersions = pgTable(
  "charter_versions",
  {
    id: t.varchar({ length: 30 }).primaryKey(),     // "watch_v1_2026_04"
    effectiveFrom: t.date("effective_from").notNull(),
    contentFr: t.text("content_fr").notNull(),
    contentEn: t.text("content_en").notNull(),
    contentAr: t.text("content_ar").notNull(),
    hash: t.varchar({ length: 64 }).notNull(),
    isCurrent: t.boolean("is_current").default(false).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

export const userCharterSignatures = pgTable(
  "user_charter_signatures",
  {
    userId: t.uuid("user_id").notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    charterId: t.varchar("charter_id", { length: 30 }).notNull()
      .references(() => charterVersions.id),
    signedAt: t.timestamp("signed_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),
  },
  (table) => [
    t.primaryKey({ columns: [table.userId, table.charterId] }),
  ]
);

export type CharterVersion = typeof charterVersions.$inferSelect;
export type UserCharterSignature = typeof userCharterSignatures.$inferSelect;
