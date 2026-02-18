import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { products } from "./products.js";
import { stores } from "./stores.js";

export const reportTypeEnum = pgEnum("report_type", [
  "incorrect_halal_status",
  "wrong_ingredients",
  "missing_product",
  "store_issue",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewing",
  "resolved",
  "rejected",
]);

export const reports = pgTable(
  "reports",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: reportTypeEnum().notNull(),
    status: reportStatusEnum().default("pending").notNull(),
    productId: t.uuid("product_id").references(() => products.id),
    storeId: t.uuid("store_id").references(() => stores.id),
    title: t.varchar({ length: 255 }).notNull(),
    description: t.text().notNull(),
    photoUrls: t.text("photo_urls").array(),
    adminResponse: t.text("admin_response"),
    resolvedAt: t.timestamp("resolved_at", { withTimezone: true }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.index("reports_user_id_idx").on(table.userId),
    t.index("reports_status_idx").on(table.status),
    t.index("reports_type_idx").on(table.type),
  ]
);

export const reviews = pgTable(
  "reviews",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    productId: t.uuid("product_id").references(() => products.id),
    storeId: t.uuid("store_id").references(() => stores.id),
    rating: t.integer().notNull(), // 1-5
    comment: t.text(),
    photoUrls: t.text("photo_urls").array(),
    isVerifiedPurchase: t
      .boolean("is_verified_purchase")
      .default(false)
      .notNull(),
    helpfulCount: t.integer("helpful_count").default(0).notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    t.index("reviews_product_id_idx").on(table.productId),
    t.index("reviews_store_id_idx").on(table.storeId),
    t.index("reviews_user_id_idx").on(table.userId),
    t.index("reviews_rating_idx").on(table.rating),
  ]
);

export const reviewHelpfulVotes = pgTable(
  "review_helpful_votes",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    reviewId: t
      .uuid("review_id")
      .references(() => reviews.id, { onDelete: "cascade" })
      .notNull(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.uniqueIndex("review_helpful_unique").on(table.reviewId, table.userId),
  ]
);

export type Report = typeof reports.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type ReviewHelpfulVote = typeof reviewHelpfulVotes.$inferSelect;
