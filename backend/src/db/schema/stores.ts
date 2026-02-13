import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const storeTypeEnum = pgEnum("store_type", [
  "supermarket",
  "butcher",
  "restaurant",
  "bakery",
  "abattoir",
  "wholesaler",
  "online",
  "other",
]);

export const certifierEnum = pgEnum("certifier", [
  "avs",
  "achahada",
  "argml",
  "mosquee_de_paris",
  "mosquee_de_lyon",
  "other",
  "none",
]);

export const stores = pgTable(
  "stores",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    name: t.varchar({ length: 255 }).notNull(),
    description: t.text(),
    storeType: storeTypeEnum("store_type").default("other").notNull(),
    imageUrl: t.text("image_url"),
    logoUrl: t.text("logo_url"),
    address: t.text().notNull(),
    city: t.varchar({ length: 100 }).notNull(),
    postalCode: t.varchar("postal_code", { length: 10 }),
    country: t.varchar({ length: 50 }).default("France").notNull(),
    phone: t.varchar({ length: 20 }),
    email: t.varchar({ length: 255 }),
    website: t.text(),
    latitude: t.doublePrecision().notNull(),
    longitude: t.doublePrecision().notNull(),
    halalCertified: t.boolean("halal_certified").default(false).notNull(),
    certifier: certifierEnum().default("none").notNull(),
    certifierName: t.varchar("certifier_name", { length: 255 }),
    averageRating: t.doublePrecision("average_rating").default(0).notNull(),
    reviewCount: t.integer("review_count").default(0).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),
    // Source metadata for imported data (AVS, Achahada, etc.)
    sourceId: t.varchar("source_id", { length: 100 }),
    sourceType: t.varchar("source_type", { length: 50 }),
    rawData: t.jsonb("raw_data"),
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
    t.index("stores_city_idx").on(table.city),
    t.index("stores_type_idx").on(table.storeType),
    t.index("stores_certifier_idx").on(table.certifier),
    t.index("stores_location_idx").on(table.latitude, table.longitude),
  ]
);

export const storeHours = pgTable("store_hours", {
  id: t.uuid().defaultRandom().primaryKey(),
  storeId: t
    .uuid("store_id")
    .references(() => stores.id, { onDelete: "cascade" })
    .notNull(),
  dayOfWeek: t.integer("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  openTime: t.varchar("open_time", { length: 5 }), // "09:00"
  closeTime: t.varchar("close_time", { length: 5 }), // "21:00"
  isClosed: t.boolean("is_closed").default(false).notNull(),
});

export const storeSubscriptions = pgTable(
  "store_subscriptions",
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
    t.uniqueIndex("store_subs_user_store_idx").on(table.userId, table.storeId),
  ]
);

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
