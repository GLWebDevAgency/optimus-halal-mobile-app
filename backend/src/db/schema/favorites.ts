import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { products } from "./products.js";

export const favoriteFolders = pgTable("favorite_folders", {
  id: t.uuid().defaultRandom().primaryKey(),
  userId: t
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: t.varchar({ length: 100 }).notNull(),
  color: t.varchar({ length: 7 }),
  icon: t.varchar({ length: 50 }),
  sortOrder: t.integer("sort_order").default(0),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const favorites = pgTable(
  "favorites",
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
    folderId: t
      .uuid("folder_id")
      .references(() => favoriteFolders.id, { onDelete: "set null" }),
    notes: t.text(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.uniqueIndex("favorites_user_product_idx").on(
      table.userId,
      table.productId
    ),
    t.index("favorites_folder_idx").on(table.folderId),
  ]
);

export type Favorite = typeof favorites.$inferSelect;
export type FavoriteFolder = typeof favoriteFolders.$inferSelect;
