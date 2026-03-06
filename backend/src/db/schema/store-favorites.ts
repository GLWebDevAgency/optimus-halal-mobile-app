import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { stores } from "./stores.js";

export const storeFavorites = pgTable(
  "store_favorites",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    storeId: t
      .uuid("store_id")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.uniqueIndex("store_favorites_user_store_idx").on(table.userId, table.storeId),
    t.index("store_favorites_user_idx").on(table.userId),
  ]
);

export type StoreFavorite = typeof storeFavorites.$inferSelect;
