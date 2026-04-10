import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { practiceFamilies } from "./practice-families.js";

export const practices = pgTable(
  "practices",
  {
    id: t.varchar({ length: 50 }).primaryKey(), // "STUNNING", "MECHANICAL_SLAUGHTER"
    slug: t.varchar({ length: 50 }).unique().notNull(),
    familyId: t.varchar("family_id", { length: 50 }).notNull()
      .references(() => practiceFamilies.id),
    nameFr: t.varchar("name_fr", { length: 255 }).notNull(),
    nameEn: t.varchar("name_en", { length: 255 }).notNull(),
    nameAr: t.varchar("name_ar", { length: 255 }),
    severityTier: t.smallint("severity_tier").notNull(),
    activeDossierId: t.uuid("active_dossier_id"),
    isActive: t.boolean("is_active").default(true).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.index("practices_family_idx").on(table.familyId),
  ]
);

export type Practice = typeof practices.$inferSelect;
export type NewPractice = typeof practices.$inferInsert;
