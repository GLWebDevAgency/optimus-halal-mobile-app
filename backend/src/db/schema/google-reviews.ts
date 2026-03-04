import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { stores } from "./stores.js";

export const googleReviews = pgTable(
  "google_reviews",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    storeId: t
      .uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    googleReviewId: t.varchar("google_review_id", { length: 500 }).notNull(),
    authorName: t.varchar("author_name", { length: 255 }).notNull(),
    authorPhotoUri: t.text("author_photo_uri"),
    rating: t.integer().notNull(),
    text: t.text(),
    publishTime: t.timestamp("publish_time", { withTimezone: true }),
    relativeTime: t.varchar("relative_time", { length: 100 }),
    languageCode: t.varchar("language_code", { length: 10 }).default("fr"),
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
    t.index("google_reviews_store_idx").on(table.storeId),
    t.uniqueIndex("google_reviews_review_id_idx").on(table.googleReviewId),
  ],
);

export type GoogleReview = typeof googleReviews.$inferSelect;
export type NewGoogleReview = typeof googleReviews.$inferInsert;
