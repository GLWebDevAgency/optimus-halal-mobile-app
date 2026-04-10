import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const practiceFamilies = pgTable(
  "practice_families",
  {
    id: t.varchar({ length: 50 }).primaryKey(), // "stunning", "mechanical_slaughter"
    nameFr: t.varchar("name_fr", { length: 100 }).notNull(),
    nameEn: t.varchar("name_en", { length: 100 }).notNull(),
    dimensionSchema: t.jsonb("dimension_schema"),  // JSON Schema for dimensions validation
    isActive: t.boolean("is_active").default(true).notNull(),
  }
);

export type PracticeFamily = typeof practiceFamilies.$inferSelect;
export type NewPracticeFamily = typeof practiceFamilies.$inferInsert;
