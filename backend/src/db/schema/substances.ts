import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const substances = pgTable(
  "substances",
  {
    id: t.varchar({ length: 50 }).primaryKey(),         // "SHELLAC", "E471"
    slug: t.varchar({ length: 50 }).unique().notNull(),
    nameFr: t.varchar("name_fr", { length: 255 }).notNull(),
    nameEn: t.varchar("name_en", { length: 255 }).notNull(),
    nameAr: t.varchar("name_ar", { length: 255 }),
    eNumbers: t.text("e_numbers").array().default([]),
    tier: t.smallint().notNull(),                        // 1..4
    priorityScore: t.smallint("priority_score").notNull(), // 0..100
    fiqhIssues: t.text("fiqh_issues").array().notNull(),
    issueType: t.varchar("issue_type", { length: 30 }).notNull(),
    activeDossierId: t.uuid("active_dossier_id"),        // FK added after dossiers table
    isActive: t.boolean("is_active").default(true).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.index("substances_tier_idx").on(table.tier),
    t.index("substances_priority_idx").on(table.priorityScore),
  ]
);

export type Substance = typeof substances.$inferSelect;
export type NewSubstance = typeof substances.$inferInsert;
