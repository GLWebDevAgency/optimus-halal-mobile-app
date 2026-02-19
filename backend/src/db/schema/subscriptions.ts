import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const subscriptionEventTypeEnum = pgEnum("subscription_event_type", [
  "INITIAL_PURCHASE",
  "RENEWAL",
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
  "NON_RENEWING_PURCHASE",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
]);

export const subscriptionEvents = pgTable("subscription_events", {
  id: t.uuid().defaultRandom().primaryKey(),
  userId: t
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  eventType: subscriptionEventTypeEnum("event_type").notNull(),
  provider: t.varchar({ length: 20 }).notNull(),
  productId: t.varchar("product_id", { length: 100 }),
  price: t.doublePrecision(),
  currency: t.varchar({ length: 3 }).default("EUR"),
  environment: t.varchar({ length: 20 }).notNull().default("PRODUCTION"),
  rawPayload: t.jsonb("raw_payload"),
  webhookEventId: t.varchar("webhook_event_id", { length: 255 }).unique(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type SubscriptionEvent = typeof subscriptionEvents.$inferSelect;
export type NewSubscriptionEvent = typeof subscriptionEvents.$inferInsert;
