import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { products } from "./products.js";

/**
 * Scan feedback — community validation votes on halal analysis results.
 *
 * One vote per (user, product). Upserted on each tap so the user can
 * change their mind (correct → report or vice-versa).
 */
export const scanFeedback = pgTable(
  "scan_feedback",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    productId: t
      .uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    /** true = user confirms result is correct, false = user flags it as wrong */
    isCorrect: t.boolean("is_correct").notNull(),
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
    t.uniqueIndex("scan_feedback_user_product_uidx").on(table.userId, table.productId),
    t.index("scan_feedback_product_idx").on(table.productId),
  ],
);

export type ScanFeedback = typeof scanFeedback.$inferSelect;
export type NewScanFeedback = typeof scanFeedback.$inferInsert;
