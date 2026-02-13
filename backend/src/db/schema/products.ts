import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const halalStatusEnum = pgEnum("halal_status", [
  "halal",
  "haram",
  "doubtful",
  "unknown",
]);

export const products = pgTable(
  "products",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    barcode: t.varchar({ length: 50 }).notNull(),
    name: t.varchar({ length: 255 }).notNull(),
    brand: t.varchar({ length: 255 }),
    brandLogo: t.text("brand_logo"),
    category: t.varchar({ length: 100 }),
    categoryId: t.varchar("category_id", { length: 50 }),
    description: t.text(),
    imageUrl: t.text("image_url"),
    ingredients: t.text().array(),
    halalStatus: halalStatusEnum("halal_status").default("unknown").notNull(),
    confidenceScore: t.doublePrecision("confidence_score").default(0).notNull(),
    certifierId: t.varchar("certifier_id", { length: 50 }),
    certifierName: t.varchar("certifier_name", { length: 255 }),
    certifierLogo: t.text("certifier_logo"),
    nutritionFacts: t.jsonb("nutrition_facts"),
    price: t.doublePrecision(),
    currency: t.varchar({ length: 3 }).default("EUR"),
    inStock: t.boolean("in_stock").default(true),
    // OpenFoodFacts data
    offData: t.jsonb("off_data"),
    lastSyncedAt: t.timestamp("last_synced_at", { withTimezone: true }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.uniqueIndex("products_barcode_idx").on(table.barcode),
    t.index("products_halal_status_idx").on(table.halalStatus),
    t.index("products_category_idx").on(table.category),
    t.index("products_name_idx").on(table.name),
  ]
);

export const categories = pgTable("categories", {
  id: t.varchar({ length: 50 }).primaryKey(),
  name: t.varchar({ length: 100 }).notNull(),
  nameFr: t.varchar("name_fr", { length: 100 }),
  nameAr: t.varchar("name_ar", { length: 100 }),
  icon: t.varchar({ length: 50 }),
  parentId: t.varchar("parent_id", { length: 50 }),
  sortOrder: t.integer("sort_order").default(0),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Category = typeof categories.$inferSelect;
