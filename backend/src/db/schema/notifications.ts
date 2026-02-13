import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const notificationTypeEnum = pgEnum("notification_type", [
  "alert",
  "promotion",
  "scan_result",
  "reward",
  "community",
  "system",
]);

export const pushTokens = pgTable("push_tokens", {
  id: t.uuid().defaultRandom().primaryKey(),
  userId: t
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: t.text().notNull(),
  platform: t.varchar({ length: 10 }).notNull(), // "ios" | "android"
  deviceId: t.varchar("device_id", { length: 255 }),
  isActive: t.boolean("is_active").default(true).notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: notificationTypeEnum().default("system").notNull(),
    title: t.varchar({ length: 255 }).notNull(),
    body: t.text().notNull(),
    data: t.jsonb(), // arbitrary payload (alertId, productId, etc.)
    imageUrl: t.text("image_url"),
    isRead: t.boolean("is_read").default(false).notNull(),
    readAt: t.timestamp("read_at", { withTimezone: true }),
    sentAt: t
      .timestamp("sent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.index("notifications_user_id_idx").on(table.userId),
    t.index("notifications_type_idx").on(table.type),
    t.index("notifications_sent_at_idx").on(table.sentAt),
  ]
);

export const notificationSettings = pgTable("notification_settings", {
  id: t.uuid().defaultRandom().primaryKey(),
  userId: t
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  alertsEnabled: t.boolean("alerts_enabled").default(true).notNull(),
  promotionsEnabled: t.boolean("promotions_enabled").default(true).notNull(),
  scanResultsEnabled: t.boolean("scan_results_enabled").default(true).notNull(),
  rewardsEnabled: t.boolean("rewards_enabled").default(true).notNull(),
  communityEnabled: t.boolean("community_enabled").default(true).notNull(),
  quietHoursStart: t.varchar("quiet_hours_start", { length: 5 }), // "22:00"
  quietHoursEnd: t.varchar("quiet_hours_end", { length: 5 }), // "08:00"
  updatedAt: t
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type PushToken = typeof pushTokens.$inferSelect;
