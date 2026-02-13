import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const alertSeverityEnum = pgEnum("alert_severity", [
  "info",
  "warning",
  "critical",
]);

export const alertPriorityEnum = pgEnum("alert_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const alertCategories = pgTable("alert_categories", {
  id: t.varchar({ length: 50 }).primaryKey(),
  name: t.varchar({ length: 100 }).notNull(),
  nameFr: t.varchar("name_fr", { length: 100 }),
  nameAr: t.varchar("name_ar", { length: 100 }),
  icon: t.varchar({ length: 50 }),
  color: t.varchar({ length: 7 }),
});

export const alerts = pgTable(
  "alerts",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    title: t.varchar({ length: 255 }).notNull(),
    summary: t.text().notNull(),
    content: t.text().notNull(),
    severity: alertSeverityEnum().default("info").notNull(),
    priority: alertPriorityEnum().default("medium").notNull(),
    categoryId: t.varchar("category_id", { length: 50 }).references(() => alertCategories.id),
    imageUrl: t.text("image_url"),
    productId: t.uuid("product_id"),
    storeId: t.uuid("store_id"),
    sourceUrl: t.text("source_url"),
    publishedAt: t
      .timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
    isActive: t.boolean("is_active").default(true).notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.index("alerts_severity_idx").on(table.severity),
    t.index("alerts_published_at_idx").on(table.publishedAt),
    t.index("alerts_category_idx").on(table.categoryId),
  ]
);

export const alertReadStatus = pgTable(
  "alert_read_status",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    alertId: t
      .uuid("alert_id")
      .references(() => alerts.id, { onDelete: "cascade" })
      .notNull(),
    isRead: t.boolean("is_read").default(false).notNull(),
    isDismissed: t.boolean("is_dismissed").default(false).notNull(),
    readAt: t.timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    t.uniqueIndex("alert_read_user_alert_idx").on(table.userId, table.alertId),
  ]
);

export type Alert = typeof alerts.$inferSelect;
export type AlertCategory = typeof alertCategories.$inferSelect;
