import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const halalStrictnessEnum = pgEnum("halal_strictness", [
  "relaxed",
  "moderate",
  "strict",
  "very_strict",
]);

export const languageEnum = pgEnum("language", ["fr", "en", "ar"]);

export const madhabEnum = pgEnum("madhab", [
  "hanafi",
  "shafii",
  "maliki",
  "hanbali",
  "general",
]);

export const users = pgTable(
  "users",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    email: t.varchar({ length: 255 }).notNull(),
    passwordHash: t.text("password_hash").notNull(),
    displayName: t.varchar("display_name", { length: 100 }).notNull(),
    phoneNumber: t.varchar("phone_number", { length: 20 }),
    avatarUrl: t.text("avatar_url"),
    bio: t.text(),
    city: t.varchar({ length: 100 }),
    preferredLanguage: languageEnum("preferred_language").default("fr").notNull(),
    halalStrictness: halalStrictnessEnum("halal_strictness")
      .default("moderate")
      .notNull(),
    dietaryRestrictions: t.text("dietary_restrictions").array(),
    allergens: t.text().array(),
    madhab: madhabEnum().default("general").notNull(),
    isPregnant: t.boolean("is_pregnant").default(false).notNull(),
    hasChildren: t.boolean("has_children").default(false).notNull(),
    level: t.integer().default(1).notNull(),
    experiencePoints: t.integer("experience_points").default(0).notNull(),
    totalScans: t.integer("total_scans").default(0).notNull(),
    currentStreak: t.integer("current_streak").default(0).notNull(),
    longestStreak: t.integer("longest_streak").default(0).notNull(),
    lastScanDate: t.timestamp("last_scan_date", { withTimezone: true }),
    notificationEnabled: t.boolean("notification_enabled").default(true).notNull(),
    biometricEnabled: t.boolean("biometric_enabled").default(false).notNull(),
    darkMode: t.boolean("dark_mode").default(false).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),
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
    t.uniqueIndex("users_email_idx").on(table.email),
    t.index("users_city_idx").on(table.city),
  ]
);

export const refreshTokens = pgTable("refresh_tokens", {
  id: t.uuid().defaultRandom().primaryKey(),
  userId: t
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  tokenHash: t.text("token_hash").notNull(),
  deviceId: t.varchar("device_id", { length: 255 }),
  deviceName: t.varchar("device_name", { length: 255 }),
  expiresAt: t
    .timestamp("expires_at", { withTimezone: true })
    .notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const addresses = pgTable("addresses", {
  id: t.uuid().defaultRandom().primaryKey(),
  userId: t
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  label: t.varchar({ length: 50 }),
  addressType: t
    .varchar("address_type", { length: 20 })
    .$type<"home" | "work" | "other">()
    .default("home")
    .notNull(),
  fullName: t.varchar("full_name", { length: 100 }).notNull(),
  phone: t.varchar({ length: 20 }),
  street: t.text().notNull(),
  streetNumber: t.varchar("street_number", { length: 20 }),
  apartment: t.varchar({ length: 50 }),
  city: t.varchar({ length: 100 }).notNull(),
  postalCode: t.varchar("postal_code", { length: 10 }).notNull(),
  country: t.varchar({ length: 50 }).default("France").notNull(),
  instructions: t.text(),
  latitude: t.doublePrecision(),
  longitude: t.doublePrecision(),
  isDefault: t.boolean("is_default").default(false).notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Address = typeof addresses.$inferSelect;
